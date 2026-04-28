import React, { useMemo } from "react";
import { ExternalLink, FileText, Image as ImageIcon, Video, X } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { inferMediaKind, mediaLabelFromPath, mediaSrcFromPath } from "../../utils/media";
import { electron } from "../../lib/electron";
import { isElectronRuntime } from "../../lib/runtime";
import { AnimatedButton } from "../shared/AnimatedButton";
import { SmartTooltip } from "../shared/SmartTooltip";

export function MediaPreviewModal({ payload }: { payload?: Record<string, unknown> }) {
  const closeModal = useUiStore((state) => state.closeModal);
  const path = String(payload?.path ?? "");
  const title = typeof payload?.title === "string" && payload.title.trim().length > 0
    ? payload.title
    : mediaLabelFromPath(path);
  const caption = typeof payload?.caption === "string" ? payload.caption : "";
  const kind = useMemo(() => inferMediaKind(path), [path]);
  const src = useMemo(() => mediaSrcFromPath(path), [path]);

  const handleOpenExternal = async () => {
    if (!path) {
      return;
    }

    if (isElectronRuntime && electron.mediaOpenExternal && !path.startsWith("browser-media:")) {
      await electron.mediaOpenExternal(path);
      return;
    }

    window.open(src, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content max-w-5xl"
        onClick={(event) => event.stopPropagation()}
        data-testid="media-preview-modal"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate font-serif text-2xl font-normal text-[var(--ui-text-1)]">{title}</h2>
            {caption && <p className="mt-1 text-sm text-[var(--ui-text-3)]">{caption}</p>}
          </div>
          <div className="flex items-center gap-2">
            <AnimatedButton
              type="button"
              onClick={() => void handleOpenExternal()}
              variant="surface"
              className="inline-flex items-center gap-2"
              data-testid="btn-open-media-external"
            >
              <ExternalLink className="h-4 w-4" />
              Open Externally
            </AnimatedButton>
            <SmartTooltip content="Close preview">
              <AnimatedButton type="button" onClick={closeModal} variant="ghost" size="icon" aria-label="Close preview">
                <X className="h-5 w-5" />
              </AnimatedButton>
            </SmartTooltip>
          </div>
        </div>

        <div className="rounded-[var(--ui-radius-xl)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-4">
          {kind === "photo" && (
            <div className="flex max-h-[70svh] items-center justify-center overflow-hidden rounded-lg bg-black/50">
              <img
                src={src}
                alt={title}
                className="max-h-[68svh] w-auto max-w-full object-contain"
                data-testid="media-preview-image"
              />
            </div>
          )}

          {kind === "video" && (
            <div className="overflow-hidden rounded-lg bg-black/50">
              <video
                controls
                src={src}
                className="max-h-[68svh] w-full bg-black"
                data-testid="media-preview-video"
              />
            </div>
          )}

          {kind === "file" && (
            <div className="flex min-h-[22rem] flex-col items-center justify-center gap-4 rounded-[var(--ui-radius-lg)] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-6 py-10 text-center">
              <div className="rounded-full bg-[var(--ui-surface-3)] p-4 text-[var(--ui-text-2)]">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <p className="text-base font-medium text-[var(--ui-text-1)]">{title}</p>
                <p className="mt-2 text-sm text-[var(--ui-text-3)]">
                  This file opens with the system handler. Use the button above to inspect it outside Tinker.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 text-xs text-[var(--ui-text-3)]">
          {kind === "photo" && <ImageIcon className="h-4 w-4 text-[var(--ui-accent)]" />}
          {kind === "video" && <Video className="h-4 w-4 text-[var(--ui-accent)]" />}
          {kind === "file" && <FileText className="h-4 w-4 text-[var(--ui-text-3)]" />}
          <span>{mediaLabelFromPath(path)}</span>
        </div>
      </div>
    </div>
  );
}
