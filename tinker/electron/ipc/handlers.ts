import { app, dialog, ipcMain, shell, type BrowserWindow } from "electron";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { IPC_CHANNELS } from "./channels";
import type {
  DbExportResponse,
  DbImportRequest,
  FsShowOpenDialogRequest,
  FsShowSaveDialogRequest,
  MediaDeleteRequest,
  MediaSaveRequest,
  MediaSaveResponse,
} from "./types";

let dbInstance: Database.Database | null = null;
let migrationsApplied = false;

const TABLE_ORDER = [
  "shops",
  "workbenches",
  "items",
  "item_media",
  "scars",
  "skills",
  "bridges",
  "skill_bridges",
  "locker_items",
  "camera_states",
  "app_settings",
] as const;

const TABLE_IMPORT_ORDER = [
  "shops",
  "workbenches",
  "items",
  "item_media",
  "scars",
  "skills",
  "bridges",
  "skill_bridges",
  "locker_items",
  "camera_states",
  "app_settings",
] as const;

const TABLE_DELETE_ORDER = [
  "skill_bridges",
  "bridges",
  "item_media",
  "scars",
  "skills",
  "items",
  "camera_states",
  "locker_items",
  "workbenches",
  "shops",
  "app_settings",
] as const;

const TABLE_TIMESTAMP_COLUMNS: Record<(typeof TABLE_ORDER)[number], string[]> = {
  shops: ["createdAt", "updatedAt"],
  workbenches: ["lastOpenedAt", "createdAt", "updatedAt"],
  items: ["createdAt", "updatedAt"],
  item_media: ["createdAt", "updatedAt"],
  scars: ["createdAt", "updatedAt"],
  skills: ["lastEvidenceAt", "reviewDueAt", "createdAt", "updatedAt"],
  bridges: ["lastReinforcedAt", "createdAt", "updatedAt"],
  skill_bridges: ["createdAt", "updatedAt"],
  locker_items: ["staleDate", "archivedAt", "createdAt", "updatedAt"],
  camera_states: ["createdAt", "updatedAt"],
  app_settings: ["createdAt", "updatedAt"],
};

const TABLE_BOOLEAN_COLUMNS: Partial<Record<(typeof TABLE_ORDER)[number], string[]>> = {
  locker_items: ["isArchived"],
};

interface RegisterIpcHandlersOptions {
  getMainWindow: () => BrowserWindow | null;
}

interface MigrationJournalEntry {
  idx: number;
  tag: string;
}

function getDataDir(): string {
  const dataDir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

function getDbPath(): string {
  return path.join(getDataDir(), "tinker.db");
}

function getRuntimeHealthPath(): string {
  return path.join(getDataDir(), "runtime-health.json");
}

function resolveMigrationsFolder(): string {
  const candidates = [
    path.join(process.cwd(), "src", "db", "migrations"),
    path.join(app.getAppPath(), "src", "db", "migrations"),
    path.join(__dirname, "..", "..", "src", "db", "migrations"),
    path.join(__dirname, "..", "migrations"),
    path.join(process.resourcesPath, "migrations"),
  ];

  const match = candidates.find((candidate) => fs.existsSync(candidate));
  if (!match) {
    throw new Error(`Unable to locate Drizzle migrations. Checked: ${candidates.join(", ")}`);
  }

  return match;
}

function resolveMigrationJournalPath(migrationsFolder: string): string {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  if (!fs.existsSync(journalPath)) {
    throw new Error(`Unable to locate migration journal at ${journalPath}`);
  }

  return journalPath;
}

function loadMigrationJournal(migrationsFolder: string): MigrationJournalEntry[] {
  const raw = fs.readFileSync(resolveMigrationJournalPath(migrationsFolder), "utf8");
  const parsed = JSON.parse(raw) as { entries?: MigrationJournalEntry[] };
  return [...(parsed.entries ?? [])].sort((left, right) => left.idx - right.idx);
}

function runMigrations(db: Database.Database) {
  const migrationsFolder = resolveMigrationsFolder();
  const journalEntries = loadMigrationJournal(migrationsFolder);

  db.exec(`
    CREATE TABLE IF NOT EXISTS __tinker_migrations (
      tag TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const appliedTags = new Set<string>(
    db.prepare("SELECT tag FROM __tinker_migrations").all().map((row) => String((row as { tag: string }).tag))
  );

  const applyMigration = db.transaction((entry: MigrationJournalEntry) => {
    const sqlPath = path.join(migrationsFolder, `${entry.tag}.sql`);
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Missing migration file: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, "utf8");
    if (sql.trim().length > 0) {
      db.exec(sql);
    }

    db.prepare("INSERT OR REPLACE INTO __tinker_migrations (tag, applied_at) VALUES (?, ?)")
      .run(entry.tag, Date.now());
  });

  for (const entry of journalEntries) {
    if (appliedTags.has(entry.tag)) {
      continue;
    }

    applyMigration(entry);
    appliedTags.add(entry.tag);
  }
}

function persistRuntimeMetadata(db: Database.Database) {
  const now = Date.now();
  const lastLaunchAt = new Date(now).toISOString();
  const upsertSetting = db.prepare(`
    INSERT INTO app_settings (id, key, value, created_at, updated_at)
    VALUES (@id, @key, @value, @createdAt, @updatedAt)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);

  upsertSetting.run({
    id: "runtime-last-launch-at",
    key: "runtime.lastLaunchAt",
    value: lastLaunchAt,
    createdAt: now,
    updatedAt: now,
  });

  upsertSetting.run({
    id: "runtime-last-version",
    key: "runtime.lastVersion",
    value: app.getVersion(),
    createdAt: now,
    updatedAt: now,
  });

  const lastVersion = String(
    (db.prepare("SELECT value FROM app_settings WHERE key = ?").get("runtime.lastVersion") as { value: string }).value
  );
  const persistedLaunch = String(
    (db.prepare("SELECT value FROM app_settings WHERE key = ?").get("runtime.lastLaunchAt") as { value: string }).value
  );

  fs.writeFileSync(
    getRuntimeHealthPath(),
    JSON.stringify(
      {
        dbPath: getDbPath(),
        lastLaunchAt: persistedLaunch,
        lastVersion,
      },
      null,
      2
    ),
    "utf8"
  );
}

function performReadWriteHealthCheck(db: Database.Database) {
  db.prepare("SELECT 1").get();
  db.prepare("CREATE TEMP TABLE IF NOT EXISTS _tinker_smoke (id INTEGER PRIMARY KEY, value TEXT)").run();
  db.prepare("INSERT INTO _tinker_smoke (value) VALUES (?)").run("ok");
  db.prepare("DELETE FROM _tinker_smoke").run();
}

function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(getDbPath());
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");
  }

  if (!migrationsApplied) {
    runMigrations(dbInstance);
    performReadWriteHealthCheck(dbInstance);
    persistRuntimeMetadata(dbInstance);
    migrationsApplied = true;
  }

  return dbInstance;
}

export function ensureDbReady(): void {
  void getDb();
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return cleaned.length > 0 ? cleaned : `upload-${Date.now()}`;
}

function getMediaRoot(): string {
  const mediaDir = path.join(getDataDir(), "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  return mediaDir;
}

function saveMediaFile(request: MediaSaveRequest): MediaSaveResponse {
  const targetDir = path.join(getMediaRoot(), request.subDir);
  fs.mkdirSync(targetDir, { recursive: true });

  const fileName = `${Date.now()}-${sanitizeFileName(request.fileName)}`;
  const filePath = path.join(targetDir, fileName);
  const buffer =
    request.buffer instanceof ArrayBuffer
      ? Buffer.from(request.buffer)
      : Buffer.from(new Uint8Array(request.buffer));

  fs.writeFileSync(filePath, buffer);
  return { filePath, success: true };
}

function serializeDateForExport(value: unknown) {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && String(numeric) === value) {
      return new Date(numeric).toISOString();
    }
  }

  return value;
}

function serializeRowForExport(tableName: (typeof TABLE_ORDER)[number], row: Record<string, unknown>) {
  const timestampColumns = new Set(TABLE_TIMESTAMP_COLUMNS[tableName]);
  const booleanColumns = new Set(TABLE_BOOLEAN_COLUMNS[tableName] ?? []);

  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (timestampColumns.has(key)) {
        return [key, serializeDateForExport(value)];
      }

      if (booleanColumns.has(key)) {
        return [key, Boolean(value)];
      }

      return [key, value];
    })
  );
}

function toSqliteTimestamp(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const date = new Date(value as string | Date);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp value: ${String(value)}`);
  }

  return date.getTime();
}

function normalizeImportedRow(tableName: (typeof TABLE_ORDER)[number], row: Record<string, unknown>) {
  const timestampColumns = new Set(TABLE_TIMESTAMP_COLUMNS[tableName]);
  const booleanColumns = new Set(TABLE_BOOLEAN_COLUMNS[tableName] ?? []);

  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (timestampColumns.has(key)) {
        return [key, toSqliteTimestamp(value)];
      }

      if (booleanColumns.has(key)) {
        return [key, value ? 1 : 0];
      }

      return [key, value];
    })
  );
}

function loadExportTables(db: Database.Database) {
  return {
    shops: db.prepare("SELECT * FROM shops ORDER BY created_at DESC").all().map((row) => serializeRowForExport("shops", row as Record<string, unknown>)),
    workbenches: db.prepare("SELECT * FROM workbenches ORDER BY created_at DESC").all().map((row) => serializeRowForExport("workbenches", row as Record<string, unknown>)),
    items: db.prepare("SELECT * FROM items ORDER BY created_at DESC").all().map((row) => serializeRowForExport("items", row as Record<string, unknown>)),
    itemMedia: db.prepare("SELECT * FROM item_media ORDER BY created_at DESC").all().map((row) => serializeRowForExport("item_media", row as Record<string, unknown>)),
    scars: db.prepare("SELECT * FROM scars ORDER BY created_at DESC").all().map((row) => serializeRowForExport("scars", row as Record<string, unknown>)),
    skills: db.prepare("SELECT * FROM skills ORDER BY created_at DESC").all().map((row) => serializeRowForExport("skills", row as Record<string, unknown>)),
    bridges: db.prepare("SELECT * FROM bridges ORDER BY created_at DESC").all().map((row) => serializeRowForExport("bridges", row as Record<string, unknown>)),
    skillBridges: db.prepare("SELECT * FROM skill_bridges ORDER BY created_at DESC").all().map((row) => serializeRowForExport("skill_bridges", row as Record<string, unknown>)),
    lockerItems: db.prepare("SELECT * FROM locker_items ORDER BY created_at DESC").all().map((row) => serializeRowForExport("locker_items", row as Record<string, unknown>)),
    cameraStates: db.prepare("SELECT * FROM camera_states ORDER BY created_at DESC").all().map((row) => serializeRowForExport("camera_states", row as Record<string, unknown>)),
    appSettings: db.prepare("SELECT * FROM app_settings ORDER BY created_at DESC").all().map((row) => serializeRowForExport("app_settings", row as Record<string, unknown>)),
  };
}

function buildSummary(tables: ReturnType<typeof loadExportTables>) {
  return {
    shops: tables.shops.length,
    workbenches: tables.workbenches.length,
    items: tables.items.length,
    itemMedia: tables.itemMedia.length,
    scars: tables.scars.length,
    skills: tables.skills.length,
    bridges: tables.bridges.length,
    skillBridges: tables.skillBridges.length,
    lockerItems: tables.lockerItems.length,
    cameraStates: tables.cameraStates.length,
    appSettings: tables.appSettings.length,
  };
}

function buildMediaManifest(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => ({
    id: String(row.id),
    itemId: String(row.itemId),
    type: String(row.type),
    path: String(row.path),
  }));
}

function exportDatabase(db: Database.Database): DbExportResponse {
  const tables = loadExportTables(db);
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    scope: "full",
    dateRange: {
      from: null,
      to: null,
    },
    summary: buildSummary(tables),
    mediaManifest: buildMediaManifest(tables.itemMedia),
    data: tables,
  };

  const json = JSON.stringify(payload, null, 2);
  const defaultPath = path.join(app.getPath("downloads"), `tinker-export-${new Date().toISOString().slice(0, 10)}.json`);
  const result = dialog.showSaveDialogSync({
    title: "Export Tinker Data",
    defaultPath,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (!result) {
    throw new Error("Export cancelled");
  }

  fs.writeFileSync(result, json, "utf8");
  return {
    json,
    filePath: result,
  };
}

function importDatabase(db: Database.Database, request: DbImportRequest) {
  const raw = fs.readFileSync(request.filePath, "utf8");
  const payload = JSON.parse(raw) as {
    data?: Partial<Record<keyof ReturnType<typeof loadExportTables>, Array<Record<string, unknown>>>>;
  };

  if (!payload.data) {
    throw new Error("Import payload is missing a data section.");
  }

  const tableMap = {
    shops: payload.data.shops ?? [],
    workbenches: payload.data.workbenches ?? [],
    items: payload.data.items ?? [],
    item_media: payload.data.itemMedia ?? [],
    scars: payload.data.scars ?? [],
    skills: payload.data.skills ?? [],
    bridges: payload.data.bridges ?? [],
    skill_bridges: payload.data.skillBridges ?? [],
    locker_items: payload.data.lockerItems ?? [],
    camera_states: payload.data.cameraStates ?? [],
    app_settings: payload.data.appSettings ?? [],
  } satisfies Record<(typeof TABLE_IMPORT_ORDER)[number], Array<Record<string, unknown>>>;

  const transaction = db.transaction(() => {
    db.pragma("foreign_keys = OFF");
    try {
      for (const tableName of TABLE_DELETE_ORDER) {
        db.prepare(`DELETE FROM ${tableName}`).run();
      }

      for (const tableName of TABLE_IMPORT_ORDER) {
        const rows = tableMap[tableName];
        if (rows.length === 0) {
          continue;
        }

        const normalizedRows = rows.map((row) => normalizeImportedRow(tableName, row));
        const keys = Object.keys(normalizedRows[0]);
        const placeholders = keys.map((key) => `@${key}`).join(", ");
        const columns = keys.join(", ");
        const stmt = db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`);

        for (const row of normalizedRows) {
          stmt.run(row);
        }
      }
    } finally {
      db.pragma("foreign_keys = ON");
    }
  });

  transaction();
  persistRuntimeMetadata(db);
}

export function registerIpcHandlers({ getMainWindow }: RegisterIpcHandlersOptions): void {
  ipcMain.handle(IPC_CHANNELS.DB_QUERY, (_event, { sql, params }) => {
    const db = getDb();
    const stmt = db.prepare(sql);
    const data = stmt.raw(true).all(...(params || []));
    return { data };
  });

  ipcMain.handle(IPC_CHANNELS.DB_MUTATE, (_event, { sql, params }) => {
    const db = getDb();
    const stmt = db.prepare(sql);
    const info = stmt.run(...(params || []));
    return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
  });

  ipcMain.handle(IPC_CHANNELS.DB_MIGRATE, () => {
    ensureDbReady();
  });

  ipcMain.handle(IPC_CHANNELS.DB_EXPORT, () => exportDatabase(getDb()));

  ipcMain.handle(IPC_CHANNELS.DB_IMPORT, (_event, request: DbImportRequest) => {
    importDatabase(getDb(), request);
  });

  ipcMain.handle(IPC_CHANNELS.MEDIA_SAVE, (_event, request: MediaSaveRequest) => saveMediaFile(request));

  ipcMain.handle(IPC_CHANNELS.MEDIA_DELETE, (_event, request: MediaDeleteRequest) => {
    if (fs.existsSync(request.filePath)) {
      fs.unlinkSync(request.filePath);
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEDIA_GET_THUMBNAIL, (_event, filePath: string) => {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const ext = path.extname(filePath).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"].includes(ext) ? filePath : null;
  });

  ipcMain.handle(IPC_CHANNELS.MEDIA_OPEN_EXTERNAL, async (_event, filePath: string) => {
    const result = await shell.openPath(filePath);
    if (result) {
      throw new Error(result);
    }
  });

  ipcMain.handle(IPC_CHANNELS.FS_GET_PATH, (_event, name) => app.getPath(name));

  ipcMain.handle(IPC_CHANNELS.FS_SHOW_OPEN_DIALOG, (_event, request: FsShowOpenDialogRequest) => {
    const window = getMainWindow();
    return window ? dialog.showOpenDialog(window, request) : dialog.showOpenDialog(request);
  });

  ipcMain.handle(IPC_CHANNELS.FS_SHOW_SAVE_DIALOG, (_event, request: FsShowSaveDialogRequest) => {
    const window = getMainWindow();
    return window ? dialog.showSaveDialog(window, request) : dialog.showSaveDialog(request);
  });

  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => app.getVersion());

  ipcMain.on(IPC_CHANNELS.APP_QUIT, () => app.quit());
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => getMainWindow()?.minimize());
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const window = getMainWindow();
    if (!window) {
      return;
    }

    if (window.isMaximized()) {
      window.unmaximize();
      return;
    }

    window.maximize();
  });
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => getMainWindow()?.close());
}
