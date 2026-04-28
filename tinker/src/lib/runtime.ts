const electronRuntimeDetected =
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  /Electron/i.test(navigator.userAgent) &&
  typeof window.electron !== "undefined" &&
  typeof window.electron.dbQuery === "function";

const ELECTRON_DATA_FALLBACK_MARKERS = [
  "ERR_DLOPEN_FAILED",
  "better_sqlite3.node",
  "NODE_MODULE_VERSION",
  "db ipc error",
  "db_query error",
  "electron.dbquery",
  "electron.dbmutate",
];

let electronFallbackReason: string | null = null;

export let isElectronRuntime = electronRuntimeDetected;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "";
}

export function shouldFallbackToBrowserStore(error: unknown): boolean {
  if (!electronRuntimeDetected) {
    return false;
  }

  const message = getErrorMessage(error).toLowerCase();
  return ELECTRON_DATA_FALLBACK_MARKERS.some((marker) => message.includes(marker.toLowerCase()));
}

export function disableElectronRuntime(error?: unknown) {
  if (!isElectronRuntime) {
    return;
  }

  isElectronRuntime = false;
  electronFallbackReason = getErrorMessage(error) || "Unknown Electron data error";
  console.warn("Falling back to browser store after Electron data backend failure:", electronFallbackReason);
}

export function getElectronFallbackReason() {
  return electronFallbackReason;
}
