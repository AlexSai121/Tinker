import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "./ipc/channels";
import type {
  DbQueryRequest,
  DbQueryResponse,
  DbMutateRequest,
  DbMutateResponse,
  DbExportResponse,
  DbImportRequest,
  MediaSaveRequest,
  MediaSaveResponse,
  MediaDeleteRequest,
  FsShowOpenDialogRequest,
  FsShowOpenDialogResponse,
  FsShowSaveDialogRequest,
  FsShowSaveDialogResponse,
} from "./ipc/types";

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
  fsGetPath: (name: "userData" | "documents" | "pictures" | "downloads") => Promise<string>;
  fsShowOpenDialog: (request: FsShowOpenDialogRequest) => Promise<FsShowOpenDialogResponse>;
  fsShowSaveDialog: (request: FsShowSaveDialogRequest) => Promise<FsShowSaveDialogResponse>;
  appGetVersion: () => Promise<string>;
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
  fsGetPath: (name) => ipcRenderer.invoke(IPC_CHANNELS.FS_GET_PATH, name),
  fsShowOpenDialog: (request) => ipcRenderer.invoke(IPC_CHANNELS.FS_SHOW_OPEN_DIALOG, request),
  fsShowSaveDialog: (request) => ipcRenderer.invoke(IPC_CHANNELS.FS_SHOW_SAVE_DIALOG, request),
  appGetVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
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
