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
