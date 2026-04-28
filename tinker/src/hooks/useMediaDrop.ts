import { useCallback, useState } from "react";
import { nanoid } from "nanoid";
import { useCreateItem } from "./useItems";
import { useCreateItemMedia } from "./useItemMedia";
import { electron } from "../lib/electron";
import { isElectronRuntime } from "../lib/runtime";
import { serializeBrowserMedia } from "../utils/media";
import { triggerHapticFeedback } from "../utils/haptics";

interface BenchPoint {
  x: number;
  y: number;
}

interface DroppedItem {
  id: string;
  posX: number;
  posY: number;
}

interface UseMediaDropOptions {
  workbenchId: string;
  onItemsCreated?: (items: DroppedItem[]) => void;
}

function resolveMediaType(file: File): "photo" | "video" | "file" {
  if (file.type.startsWith("image/")) {
    return "photo";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return "file";
}

function resolveMediaSubDir(type: "photo" | "video" | "file"): "photos" | "videos" | "files" {
  if (type === "photo") {
    return "photos";
  }

  if (type === "video") {
    return "videos";
  }

  return "files";
}

export function useMediaDrop({ workbenchId, onItemsCreated }: UseMediaDropOptions) {
  const createItem = useCreateItem();
  const createItemMedia = useCreateItemMedia();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const persistFile = useCallback(async (file: File, mediaType: "photo" | "video" | "file") => {
    if (!isElectronRuntime) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      return serializeBrowserMedia({ name: file.name, src: dataUrl });
    }

    if (!electron.mediaSave) {
      throw new Error("Electron media API is not available.");
    }

    const response = await electron.mediaSave({
      fileName: file.name,
      buffer: await file.arrayBuffer(),
      subDir: resolveMediaSubDir(mediaType),
    });

    if (!response.success) {
      throw new Error(`Failed to save ${file.name}`);
    }

    return response.filePath;
  }, []);

  const createDroppedMediaItems = useCallback(async (files: File[], point: BenchPoint) => {
    const now = new Date();
    const createdItems: DroppedItem[] = [];

    for (const [index, file] of files.entries()) {
      const mediaType = resolveMediaType(file);
      const itemId = nanoid();
      const offset = index * 28;
      const posX = point.x + offset;
      const posY = point.y + offset;
      const path = await persistFile(file, mediaType);

      await createItem.mutateAsync({
        id: itemId,
        workbenchId,
        type: "observation",
        content: file.name,
        posX,
        posY,
        createdAt: now,
        updatedAt: now,
      });

      await createItemMedia.mutateAsync({
        id: nanoid(),
        itemId,
        type: mediaType,
        path,
        createdAt: now,
        updatedAt: now,
      });

      createdItems.push({ id: itemId, posX, posY });
    }

    if (createdItems.length > 0) {
      onItemsCreated?.(createdItems);
      triggerHapticFeedback("success");
    }
  }, [createItem, createItemMedia, onItemsCreated, persistFile, workbenchId]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    if (!Array.from(event.dataTransfer.types).includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLElement>, point: BenchPoint) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length === 0) {
      return;
    }

    await createDroppedMediaItems(files, point);
  }, [createDroppedMediaItems]);

  return {
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
