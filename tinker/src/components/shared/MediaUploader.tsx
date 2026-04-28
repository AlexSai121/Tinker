import React, { useState, useRef } from "react";
import { Camera, Loader2, UploadCloud, X } from "lucide-react";
import { electron } from "../../lib/electron";
import { cn } from "../../utils/cn";
import { serializeBrowserMedia } from "../../utils/media";
import { isElectronRuntime } from "../../lib/runtime";
import { triggerHapticFeedback } from "../../utils/haptics";

export interface UploadedMediaValue {
  name: string;
  path: string;
  type: "photo" | "video" | "file";
}

interface Props {
  onUploadSuccess?: (value: UploadedMediaValue) => void;
  className?: string;
  buttonText?: string;
  showCameraCapture?: boolean;
  cameraButtonText?: string;
}

export function MediaUploader({
  onUploadSuccess,
  className,
  buttonText,
  showCameraCapture = false,
  cameraButtonText = "Use Camera",
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      
      const arrayBuffer = await file.arrayBuffer();
      const mediaType: "photo" | "video" | "file" =
        file.type.startsWith("image/")
          ? "photo"
          : file.type.startsWith("video/")
            ? "video"
            : "file";

      if (!isElectronRuntime) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        onUploadSuccess?.({
          name: file.name,
          path: serializeBrowserMedia({ name: file.name, src: dataUrl }),
          type: mediaType,
        });
        triggerHapticFeedback("light");
        return;
      }

      if (!electron.mediaSave) {
        setError("IPC not available");
        return;
      }
      
      // Determine subdir based on file type
      let subDir: "photos" | "videos" | "files" = "files";
      if (file.type.startsWith("image/")) subDir = "photos";
      else if (file.type.startsWith("video/")) subDir = "videos";

      const res = await electron.mediaSave({
        fileName: file.name,
        buffer: arrayBuffer,
        subDir
      });

      if (res.success) {
        onUploadSuccess?.({
          name: file.name,
          path: res.filePath,
          type: mediaType,
        });
        triggerHapticFeedback("light");
      } else {
        setError("Failed to save media file");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging ? "border-[var(--ui-accent)] bg-[var(--ui-accent-soft)]" : "border-[var(--ui-border)] hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-2)]",
          isUploading && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid="media-uploader-dropzone"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,application/pdf"
          data-testid="media-uploader-input"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          capture="environment"
          data-testid="media-camera-input"
        />
        
        <div className="flex flex-col items-center justify-center">
          {isUploading ? (
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-[var(--ui-accent)]" />
          ) : (
            <UploadCloud className="mb-2 h-8 w-8 text-[var(--ui-text-3)]" />
          )}

          <p className="text-sm font-medium text-[var(--ui-text-2)]">
            {isUploading ? "Uploading..." : buttonText ?? "Click or drag file to this area to upload"}
          </p>
          <p className="mt-1 text-xs text-[var(--ui-text-3)]">
            Support for images, videos, and documents.
          </p>
        </div>
      </div>

      {showCameraCapture && (
        <button
          type="button"
          className="btn btn-ghost mt-3 w-full justify-center gap-2"
          onClick={() => cameraInputRef.current?.click()}
          data-testid="media-camera-button"
        >
          <Camera className="h-4 w-4" />
          {cameraButtonText}
        </button>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-400 flex items-center">
          <X className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}
