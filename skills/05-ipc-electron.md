# SKILL: Tinker IPC & Electron Main Process Patterns

## Philosophy
The main process is a thin wrapper around the OS and database. It exposes a typed API to the renderer via IPC. No business logic in main. No direct DB access in renderer.

## IPC Architecture
```
Renderer (React)
  ↓ window.electron.invoke(channel, payload)
Preload Script (contextBridge)
  ↓ ipcRenderer.invoke(channel, payload)
Main Process (Node.js)
  ↓ ipcMain.handle(channel, handler)
Handler Function
  ↓ better-sqlite3 / fs / dialog
```

## Channel Definitions
ALL channel names are centralized in `electron/ipc/channels.ts`:

```typescript
export const IPC_CHANNELS = {
  DB_QUERY: "db:query",
  DB_MUTATE: "db:mutate",
  DB_MIGRATE: "db:migrate",
  DB_EXPORT: "db:export",
  DB_IMPORT: "db:import",
  MEDIA_SAVE: "media:save",
  MEDIA_DELETE: "media:delete",
  MEDIA_GET_THUMBNAIL: "media:getThumbnail",
  MEDIA_OPEN_EXTERNAL: "media:openExternal",
  FS_GET_PATH: "fs:getPath",
  FS_SHOW_OPEN_DIALOG: "fs:showOpenDialog",
  FS_SHOW_SAVE_DIALOG: "fs:showSaveDialog",
  APP_GET_VERSION: "app:getVersion",
  APP_QUIT: "app:quit",
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close",
} as const;
```

## Type Definitions
```typescript
export interface DbQueryRequest { sql: string; params?: unknown[]; }
export interface DbQueryResponse<T = unknown> { data: T[]; }
export interface DbMutateRequest { sql: string; params?: unknown[]; }
export interface DbMutateResponse { lastInsertRowid: number | bigint; changes: number; }
export interface MediaSaveRequest { fileName: string; buffer: ArrayBuffer; subDir: "photos" | "videos" | "files" | "thumbnails"; }
export interface MediaSaveResponse { filePath: string; success: boolean; }
export interface MediaDeleteRequest { filePath: string; }
export interface FsShowOpenDialogRequest { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }>; properties?: ("openFile" | "openDirectory" | "multiSelections")[]; }
export interface FsShowOpenDialogResponse { canceled: boolean; filePaths: string[]; }
export interface FsShowSaveDialogRequest { title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }>; }
export interface FsShowSaveDialogResponse { canceled: boolean; filePath?: string; }
export interface DbExportResponse { json: string; filePath: string; }
export interface DbImportRequest { filePath: string; }
```

## Preload Script
```typescript
import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "./ipc/channels";
import type { /* all types */ } from "./ipc/types";

export interface ElectronAPI {
  dbQuery: <T>(request: DbQueryRequest) => Promise<DbQueryResponse<T>>;
  dbMutate: (request: DbMutateRequest) => Promise<DbMutateResponse>;
  dbMigrate: () => Promise<void>;
  dbExport: () => Promise<DbExportResponse>;
  dbImport: (request: DbImportRequest) => Promise<void>;
  mediaSave: (request: MediaSaveRequest) => Promise<MediaSaveResponse>;
  mediaDelete: (request: MediaDeleteRequest) => Promise<void>;
  mediaGetThumbnail: (filePath: string) => Promise<string | null>;
  mediaOpenExternal: (filePath: string) => Promise<void>;
  fsGetPath: (name: "userData" | "documents" | "pictures" | "downloads") => string;
  fsShowOpenDialog: (request: FsShowOpenDialogRequest) => Promise<FsShowOpenDialogResponse>;
  fsShowSaveDialog: (request: FsShowSaveDialogRequest) => Promise<FsShowSaveDialogResponse>;
  appGetVersion: () => string;
  appQuit: () => void;
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
}

const api: ElectronAPI = {
  dbQuery: (request) => ipcRenderer.invoke(IPC_CHANNELS.DB_QUERY, request),
  dbMutate: (request) => ipcRenderer.invoke(IPC_CHANNELS.DB_MUTATE, request),
  dbMigrate: () => ipcRenderer.invoke(IPC_CHANNELS.DB_MIGRATE),
  dbExport: () => ipcRenderer.invoke(IPC_CHANNELS.DB_EXPORT),
  dbImport: (request) => ipcRenderer.invoke(IPC_CHANNELS.DB_IMPORT, request),
  mediaSave: (request) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_SAVE, request),
  mediaDelete: (request) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_DELETE, request),
  mediaGetThumbnail: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_GET_THUMBNAIL, filePath),
  mediaOpenExternal: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.MEDIA_OPEN_EXTERNAL, filePath),
  fsGetPath: (name) => ipcRenderer.sendSync(IPC_CHANNELS.FS_GET_PATH, name),
  fsShowOpenDialog: (request) => ipcRenderer.invoke(IPC_CHANNELS.FS_SHOW_OPEN_DIALOG, request),
  fsShowSaveDialog: (request) => ipcRenderer.invoke(IPC_CHANNELS.FS_SHOW_SAVE_DIALOG, request),
  appGetVersion: () => ipcRenderer.sendSync(IPC_CHANNELS.APP_GET_VERSION),
  appQuit: () => ipcRenderer.send(IPC_CHANNELS.APP_QUIT),
  windowMinimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  windowMaximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  windowClose: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
};

contextBridge.exposeInMainWorld("electron", api);

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

## Main Process Entry
```typescript
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { registerIpcHandlers } from "./ipc/handlers";

let mainWindow: BrowserWindow | null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 800, minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
    titleBarStyle: "hiddenInset", show: false,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => { registerIpcHandlers(); createWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (mainWindow === null) createWindow(); });
```

## IPC Handlers
```typescript
import { ipcMain, dialog, app, shell } from "electron";
import { IPC_CHANNELS } from "./channels";
import Database from "better-sqlite3";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const dbPath = path.join(app.getPath("userData"), "tinker.db");
const mediaDir = path.join(app.getPath("userData"), "media");
const db = new Database(dbPath);

async function ensureDirs(): Promise<void> {
  for (const sub of ["photos", "videos", "files", "thumbnails"]) {
    await fs.mkdir(path.join(mediaDir, sub), { recursive: true });
  }
}

export function registerIpcHandlers(): void {
  ensureDirs();

  ipcMain.handle(IPC_CHANNELS.DB_QUERY, async (_event, request) => {
    const { sql, params = [] } = z.object({ sql: z.string(), params: z.array(z.any()).optional() }).parse(request);
    const stmt = db.prepare(sql);
    return { data: stmt.all(...params) };
  });

  ipcMain.handle(IPC_CHANNELS.DB_MUTATE, async (_event, request) => {
    const { sql, params = [] } = z.object({ sql: z.string(), params: z.array(z.any()).optional() }).parse(request);
    const result = db.prepare(sql).run(...params);
    return { lastInsertRowid: result.lastInsertRowid, changes: result.changes };
  });

  ipcMain.handle(IPC_CHANNELS.DB_EXPORT, async () => {
    const tables = ["shops","workbenches","items","item_media","scars","skills","bridges","skill_bridges","locker_items","camera_states","app_settings"];
    const exportData: Record<string, unknown[]> = {};
    for (const table of tables) { exportData[table] = db.prepare(`SELECT * FROM ${table}`).all(); }
    const json = JSON.stringify(exportData, null, 2);
    const filePath = path.join(app.getPath("downloads"), `tinker-export-${Date.now()}.json`);
    await fs.writeFile(filePath, json, "utf-8");
    return { json, filePath };
  });

  ipcMain.handle(IPC_CHANNELS.MEDIA_SAVE, async (_event, request) => {
    const { fileName, buffer, subDir } = z.object({ fileName: z.string(), buffer: z.instanceof(ArrayBuffer), subDir: z.enum(["photos","videos","files","thumbnails"]) }).parse(request);
    const filePath = path.join(mediaDir, subDir, fileName);
    await fs.writeFile(filePath, Buffer.from(buffer));
    return { filePath, success: true };
  });

  ipcMain.handle(IPC_CHANNELS.MEDIA_DELETE, async (_event, request) => {
    const { filePath } = z.object({ filePath: z.string() }).parse(request);
    await fs.unlink(filePath).catch(() => {});
  });

  ipcMain.handle(IPC_CHANNELS.MEDIA_OPEN_EXTERNAL, async (_event, filePath) => {
    await shell.openPath(filePath);
  });

  ipcMain.on(IPC_CHANNELS.FS_GET_PATH, (event, name) => { event.returnValue = app.getPath(name); });

  ipcMain.handle(IPC_CHANNELS.FS_SHOW_OPEN_DIALOG, async (_event, request) => {
    const result = await dialog.showOpenDialog(request);
    return { canceled: result.canceled, filePaths: result.filePaths };
  });

  ipcMain.handle(IPC_CHANNELS.FS_SHOW_SAVE_DIALOG, async (_event, request) => {
    const result = await dialog.showSaveDialog(request);
    return { canceled: result.canceled, filePath: result.filePath };
  });

  ipcMain.on(IPC_CHANNELS.APP_GET_VERSION, (event) => { event.returnValue = app.getVersion(); });
  ipcMain.on(IPC_CHANNELS.APP_QUIT, () => app.quit());
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => BrowserWindow.getFocusedWindow()?.minimize());
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => { const w = BrowserWindow.getFocusedWindow(); w?.isMaximized() ? w.unmaximize() : w?.maximize(); });
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => BrowserWindow.getFocusedWindow()?.close());
}
```

## Renderer-Side IPC Wrapper
```typescript
export const electron = window.electron;

export async function dbQuery<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const response = await electron.dbQuery({ sql, params });
  return response.data;
}

export async function dbMutate(sql: string, params?: unknown[]): Promise<{ lastInsertRowid: number | bigint; changes: number }> {
  return electron.dbMutate({ sql, params });
}
```

## Security Rules
1. contextIsolation: true — ALWAYS
2. nodeIntegration: false — ALWAYS
3. sandbox: true — ALWAYS
4. Validate ALL IPC payloads with Zod before processing
5. Never trust renderer — validate file paths, SQL, etc.
6. No dynamic SQL — use parameterized queries only
7. Restrict file access — only allow app directories

## No-Go List
- ❌ No ipcRenderer imported directly in renderer
- ❌ No remote module
- ❌ No shell or fs in renderer
- ❌ No dynamic SQL generation in IPC handlers
- ❌ No file access outside app directories
- ❌ No unvalidated IPC payloads
