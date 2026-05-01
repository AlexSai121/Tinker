import { app, BrowserWindow, dialog, protocol, screen, shell } from "electron";
import fs from "node:fs";
import path from "path";
import { ensureDbReady, registerIpcHandlers } from "./ipc/handlers";

const customUserDataPath = process.env.TINKER_USER_DATA_DIR?.trim();
if (customUserDataPath) {
  app.setPath("userData", customUserDataPath);
}

let mainWindow: BrowserWindow | null = null;
let windowStateSaveTimer: NodeJS.Timeout | null = null;

function getMediaRoot(): string {
  return path.join(app.getPath("userData"), "data", "media");
}

function registerMediaProtocol(): void {
  // Provide a safe way for the sandboxed renderer to load user media without relying on file:// URLs.
  protocol.registerFileProtocol("tinker-media", (request, callback) => {
    try {
      const url = new URL(request.url);
      const rawPath = url.searchParams.get("path") ?? "";
      const decodedPath = decodeURIComponent(rawPath);
      const resolvedPath = path.resolve(decodedPath);
      const mediaRoot = path.resolve(getMediaRoot());

      if (!resolvedPath.startsWith(mediaRoot + path.sep)) {
        callback({ error: -6 }); // net::ERR_FILE_NOT_FOUND
        return;
      }

      callback(resolvedPath);
    } catch {
      callback({ error: -6 });
    }
  });
}

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

function getWindowStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function readWindowState(): WindowState {
  try {
    const raw = fs.readFileSync(getWindowStatePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<WindowState>;
    if (typeof parsed.width === "number" && typeof parsed.height === "number") {
      return {
        width: parsed.width,
        height: parsed.height,
        x: typeof parsed.x === "number" ? parsed.x : undefined,
        y: typeof parsed.y === "number" ? parsed.y : undefined,
        isMaximized: Boolean(parsed.isMaximized),
      };
    }
  } catch {
    // ignore invalid or missing persisted state
  }

  return {
    width: 1400,
    height: 900,
    isMaximized: false,
  };
}

function isVisibleOnScreen(state: WindowState) {
  if (typeof state.x !== "number" || typeof state.y !== "number") {
    return true;
  }

  const x = state.x;
  const y = state.y;
  const displays = screen.getAllDisplays();
  return displays.some((display) => {
    const workArea = display.workArea;
    return (
      x < workArea.x + workArea.width &&
      x + state.width > workArea.x &&
      y < workArea.y + workArea.height &&
      y + state.height > workArea.y
    );
  });
}

function writeWindowState(window: BrowserWindow) {
  const bounds = window.getBounds();
  const nextState: WindowState = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized: window.isMaximized(),
  };

  try {
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(nextState, null, 2), "utf8");
  } catch {
    // ignore persistence errors
  }
}

function scheduleWindowStateSave(window: BrowserWindow) {
  if (windowStateSaveTimer) {
    clearTimeout(windowStateSaveTimer);
  }

  windowStateSaveTimer = setTimeout(() => {
    writeWindowState(window);
  }, 250);
}

function createWindow(): void {
  const savedWindowState = readWindowState();
  const shouldRestorePosition = isVisibleOnScreen(savedWindowState);
  mainWindow = new BrowserWindow({
    width: savedWindowState.width,
    height: savedWindowState.height,
    x: shouldRestorePosition ? savedWindowState.x : undefined,
    y: shouldRestorePosition ? savedWindowState.y : undefined,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: "hiddenInset",
    show: false,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    if (process.env.TINKER_DISABLE_DEVTOOLS !== "1") {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  if (savedWindowState.isMaximized) {
    mainWindow.maximize();
  }
  mainWindow.on("resize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      scheduleWindowStateSave(mainWindow);
    }
  });
  mainWindow.on("move", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      scheduleWindowStateSave(mainWindow);
    }
  });
  mainWindow.on("maximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      scheduleWindowStateSave(mainWindow);
    }
  });
  mainWindow.on("unmaximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      scheduleWindowStateSave(mainWindow);
    }
  });
  mainWindow.on("close", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      writeWindowState(mainWindow);
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control || input.meta) {
      if (input.key === '=' || input.key === '+') {
        if (mainWindow) {
          mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5);
        }
        event.preventDefault();
      } else if (input.key === '-') {
        if (mainWindow) {
          mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5);
        }
        event.preventDefault();
      } else if (input.key === '0') {
        if (mainWindow) {
          mainWindow.webContents.setZoomLevel(0);
        }
        event.preventDefault();
      }
    }
  });
}

app.whenReady().then(() => {
  ensureDbReady();
  registerIpcHandlers({ getMainWindow: () => mainWindow });
  registerMediaProtocol();
  createWindow();

  const exitAfterMs = Number(process.env.TINKER_SMOKE_EXIT_AFTER_MS ?? "");
  if (!Number.isNaN(exitAfterMs) && exitAfterMs > 0) {
    setTimeout(() => {
      app.quit();
    }, exitAfterMs);
  }
}).catch((error) => {
  console.error("Failed to start Tinker:", error);
  dialog.showErrorBox("Tinker failed to start", error instanceof Error ? error.message : String(error));
  app.exit(1);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
