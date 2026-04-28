type TableName =
  | "shops"
  | "workbenches"
  | "items"
  | "itemMedia"
  | "scars"
  | "skills"
  | "bridges"
  | "skillBridges"
  | "lockerItems"
  | "cameraStates"
  | "appSettings";

import { inferMediaKind } from "../utils/media";

export const BROWSER_STORE_TABLES: TableName[] = [
  "shops",
  "workbenches",
  "items",
  "itemMedia",
  "scars",
  "skills",
  "bridges",
  "skillBridges",
  "lockerItems",
  "cameraStates",
  "appSettings",
];

const STORAGE_KEY = "tinker-browser-store";

const WORKBENCH_DEFAULT_WIDTH = 1000;
const WORKBENCH_DEFAULT_HEIGHT = 1000;

type BrowserStoreState = {
  shops: unknown[];
  workbenches: unknown[];
  items: unknown[];
  itemMedia: unknown[];
  scars: unknown[];
  skills: unknown[];
  bridges: unknown[];
  skillBridges: unknown[];
  lockerItems: unknown[];
  cameraStates: unknown[];
  appSettings: unknown[];
};

const initialState = (): BrowserStoreState => ({
  shops: [],
  workbenches: [],
  items: [],
  itemMedia: [],
  scars: [],
  skills: [],
  bridges: [],
  skillBridges: [],
  lockerItems: [],
  cameraStates: [],
  appSettings: [],
});

function reviveDates<T>(value: T): T {
  if (typeof value === "string") {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime()) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return asDate as T;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => reviveDates(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, reviveDates(nested)])
    ) as T;
  }

  return value;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeTableRows(table: TableName, rows: unknown[]): unknown[] {
  switch (table) {
    case "workbenches":
      return rows.map((row) => {
        if (!row || typeof row !== "object") {
          return row;
        }

        const record = row as Record<string, unknown>;
        return {
          ...record,
          posX: asNumber(record.posX, 0),
          posY: asNumber(record.posY, 0),
          posZ: asNumber(record.posZ, 0),
          width: asNumber(record.width, WORKBENCH_DEFAULT_WIDTH),
          height: asNumber(record.height, WORKBENCH_DEFAULT_HEIGHT),
        };
      });
    case "items":
      return rows.map((row) => {
        if (!row || typeof row !== "object") {
          return row;
        }

        const record = row as Record<string, unknown>;
        return {
          ...record,
          content: asString(record.content, ""),
          posX: asNumber(record.posX, 0),
          posY: asNumber(record.posY, 0),
        };
      });
    case "itemMedia":
      return rows.map((row) => {
        if (!row || typeof row !== "object") {
          return row;
        }

        const record = row as Record<string, unknown>;
        const path = asString(record.path, "");
        const normalizedType =
          record.type === "photo" || record.type === "video" || record.type === "file"
            ? record.type
            : inferMediaKind(path);

        return {
          ...record,
          path,
          type: normalizedType,
        };
      });
    case "skills":
      return rows.map((row) => {
        if (!row || typeof row !== "object") {
          return row;
        }

        const record = row as Record<string, unknown>;
        return {
          ...record,
          name: asString(record.name, "Untitled skill"),
          status:
            record.status === "exposed" ||
            record.status === "attempted" ||
            record.status === "practiced" ||
            record.status === "owned"
              ? record.status
              : "exposed",
          evidence: record.evidence == null ? null : asString(record.evidence, ""),
          evidenceMediaPath: record.evidenceMediaPath == null ? null : asString(record.evidenceMediaPath, ""),
        };
      });
    case "appSettings":
      return rows.filter((row) => row && typeof row === "object");
    default:
      return rows;
  }
}

function normalizeState(state: Partial<BrowserStoreState>): BrowserStoreState {
  const nextState = initialState();

  for (const table of BROWSER_STORE_TABLES) {
    nextState[table] = normalizeTableRows(table, asArray(state[table]));
  }

  return nextState;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readState(): BrowserStoreState {
  const storage = getStorage();
  if (!storage) return initialState();

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return initialState();

  try {
    return normalizeState(reviveDates(JSON.parse(raw)) as Partial<BrowserStoreState>);
  } catch {
    return initialState();
  }
}

export function getBrowserStoreSnapshot(): BrowserStoreState {
  return readState();
}

export function replaceBrowserStoreSnapshot(state: Partial<BrowserStoreState>): void {
  writeState(normalizeState(state));
}

function writeState(state: BrowserStoreState): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

export function getTable<T>(table: TableName): T[] {
  const state = readState();
  return [...(asArray(state[table]) as T[])];
}

export function setTable<T>(table: TableName, rows: T[]): void {
  const state = readState();
  state[table] = normalizeTableRows(table, rows as unknown[]);
  writeState(state);
}

export function insertRow<T extends { id: string }>(table: TableName, row: T): T {
  const rows = getTable<T>(table);
  rows.push(row);
  setTable(table, rows);
  return row;
}

export function updateRow<T extends { id: string }>(
  table: TableName,
  id: string,
  updater: (row: T) => T
): T {
  const rows = getTable<T>(table);
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) {
    throw new Error(`Row not found in ${table}: ${id}`);
  }
  const next = updater(rows[index]);
  rows[index] = next;
  setTable(table, rows);
  return next;
}

export function deleteRow(table: TableName, id: string): void {
  const rows = getTable<{ id: string }>(table).filter((row) => row.id !== id);
  setTable(table, rows);
}
