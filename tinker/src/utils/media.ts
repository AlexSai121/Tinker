export interface BrowserMediaPayload {
  name: string;
  src: string;
}

export type MediaKind = "photo" | "video" | "file";

const BROWSER_MEDIA_PREFIX = "browser-media:";

export function serializeBrowserMedia(payload: BrowserMediaPayload): string {
  return `${BROWSER_MEDIA_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`;
}

export function parseMediaPath(path: string): BrowserMediaPayload | null {
  if (!path.startsWith(BROWSER_MEDIA_PREFIX)) {
    return null;
  }

  try {
    const raw = path.slice(BROWSER_MEDIA_PREFIX.length);
    return JSON.parse(decodeURIComponent(raw)) as BrowserMediaPayload;
  } catch {
    return null;
  }
}

export function mediaSrcFromPath(path: string): string {
  const browserMedia = parseMediaPath(path);
  if (browserMedia) {
    return browserMedia.src;
  }

  if (path.startsWith("file://") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  // Electron renderer runs sandboxed; using file:// URLs can fail. Prefer the custom protocol.
  if (typeof window !== "undefined" && "electron" in window && path) {
    return `tinker-media://file?path=${encodeURIComponent(path)}`;
  }

  return `file:///${path.replace(/\\/g, "/")}`;
}

export function mediaLabelFromPath(path: string): string {
  const browserMedia = parseMediaPath(path);
  if (browserMedia) {
    return browserMedia.name;
  }

  return path.split(/[/\\]/).pop() ?? path;
}

export function inferMediaKind(path: string): MediaKind {
  const browserMedia = parseMediaPath(path);
  const candidate = browserMedia?.src ?? path;

  if (/^data:image\//.test(candidate) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(candidate)) {
    return "photo";
  }

  if (/^data:video\//.test(candidate) || /\.(mp4|webm|mov|m4v|avi)$/i.test(candidate)) {
    return "video";
  }

  return "file";
}
