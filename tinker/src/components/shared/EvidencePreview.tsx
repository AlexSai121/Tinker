import React from "react";
import { ExternalLink, FileText, Video } from "lucide-react";
import { inferMediaKind, mediaLabelFromPath, mediaSrcFromPath } from "../../utils/media";
import { useUiStore } from "../../stores/uiStore";

interface EvidencePreviewProps {
  path: string;
  className?: string;
  compact?: boolean;
}

export function EvidencePreview({ path, className = "", compact = false }: EvidencePreviewProps) {
  const openModal = useUiStore((state) => state.openModal);
  const kind = inferMediaKind(path);
  const src = mediaSrcFromPath(path);
  const label = mediaLabelFromPath(path);
  const handlePreview = () => {
    openModal({
      type: "mediaPreview",
      payload: {
        path,
        title: label,
      },
    });
  };

  if (kind === "photo") {
    return (
      <button
        type="button"
        onClick={handlePreview}
        className={`group block overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] text-left ${className}`}
        data-testid={`evidence-preview-${kind}`}
      >
        <img
          src={src}
          alt={label}
          loading="lazy"
          decoding="async"
          className={compact ? "h-16 w-full object-cover" : "h-40 w-full object-cover"}
        />
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-[var(--ui-text-3)]">
          <span className="truncate">{label}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--ui-text-muted)] group-hover:text-[var(--ui-text-1)]" />
        </div>
      </button>
    );
  }

  if (kind === "video") {
    return (
      <button
        type="button"
        onClick={handlePreview}
        className={`group block overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] text-left ${className}`}
        data-testid={`evidence-preview-${kind}`}
      >
        <div className={compact ? "flex h-16 items-center justify-center" : "flex h-40 items-center justify-center"}>
          <Video className="h-8 w-8 text-[var(--ui-accent)]" />
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-[var(--ui-text-3)]">
          <span className="truncate">{label}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--ui-text-muted)] group-hover:text-[var(--ui-text-1)]" />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePreview}
      className={`group flex w-full items-center gap-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-3 py-3 text-left ${className}`}
      data-testid={`evidence-preview-${kind}`}
    >
      <FileText className="h-4 w-4 shrink-0 text-[var(--ui-text-3)]" />
      <span className="min-w-0 flex-1 truncate text-sm text-[var(--ui-text-2)]">{label}</span>
      <ExternalLink className="h-3 w-3 shrink-0 text-[var(--ui-text-muted)] group-hover:text-[var(--ui-text-1)]" />
    </button>
  );
}
