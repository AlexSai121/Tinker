import { afterEach, describe, expect, it, vi } from "vitest";
import { cn } from "@/utils/cn";
import { triggerHapticFeedback } from "@/utils/haptics";
import {
  inferMediaKind,
  mediaLabelFromPath,
  mediaSrcFromPath,
  parseMediaPath,
  serializeBrowserMedia,
} from "@/utils/media";
import { buildSimplePdf, downloadSimplePdf } from "@/utils/pdf";

describe("misc utility helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("joins class names without falsy values", () => {
    expect(cn("one", false, undefined, "two", null, "three")).toBe("one two three");
  });

  it("serializes and parses browser media payloads", () => {
    const serialized = serializeBrowserMedia({
      name: "photo.png",
      src: "data:image/png;base64,abc",
    });

    expect(parseMediaPath(serialized)).toEqual({
      name: "photo.png",
      src: "data:image/png;base64,abc",
    });
    expect(parseMediaPath("C:\\plain\\file.png")).toBeNull();
    expect(mediaSrcFromPath(serialized)).toBe("data:image/png;base64,abc");
    expect(mediaSrcFromPath("C:\\evidence\\clip.mp4")).toBe("file:///C:/evidence/clip.mp4");
    expect(mediaLabelFromPath(serialized)).toBe("photo.png");
    expect(mediaLabelFromPath("C:\\evidence\\clip.mp4")).toBe("clip.mp4");
    expect(inferMediaKind(serialized)).toBe("photo");
    expect(inferMediaKind("movie.webm")).toBe("video");
    expect(inferMediaKind("notes.txt")).toBe("file");
  });

  it("triggers haptics only when vibration is available", () => {
    const vibrate = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { vibrate },
    });

    triggerHapticFeedback("success");
    expect(vibrate).toHaveBeenCalledWith([10, 24, 12]);

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {},
    });
    expect(() => triggerHapticFeedback("warning")).not.toThrow();
  });

  it("builds and downloads simple PDFs", () => {
    const pdf = buildSimplePdf([["Hello", "World"], ["Second page"]]);
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("/Type /Catalog");
    expect(pdf).toContain("Second page");

    const click = vi.fn();
    const createObjectURL = vi.fn(() => "blob:pdf");
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("Blob", class FakeBlob {
      constructor(public parts: unknown[], public options: Record<string, unknown>) {}
    });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        href: "",
        download: "",
        click,
      })),
    });

    downloadSimplePdf("skills.pdf", [["Owned skill evidence"]]);

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:pdf");
  });
});
