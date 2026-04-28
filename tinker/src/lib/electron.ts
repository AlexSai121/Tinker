import type { ElectronAPI } from "../../electron/preload";

export const electron: ElectronAPI = typeof window !== "undefined" ? window.electron : ({} as ElectronAPI);
