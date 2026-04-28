import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, FileText, GitBranchPlus, Image as ImageIcon, Layers, Video } from "lucide-react";
import type { Item, ItemMedia, Scar } from "../../types";
import { decodeStructuredItemContent } from "../../utils/itemContent";
import { inferMediaKind, mediaLabelFromPath, mediaSrcFromPath } from "../../utils/media";
import { TypeBadge } from "../shared/TypeBadge";
import { AnimatedButton } from "../shared/AnimatedButton";
import { useUiStore } from "../../stores/uiStore";

interface Props {
  item: Item;
  media: ItemMedia[];
  scars: Scar[];
}

export function MediaCard({ item, media, scars }: Props) {
  const openModal = useUiStore((s) => s.openModal);
  const stopPointer = (event: React.PointerEvent<HTMLElement>) => event.stopPropagation();
  const preview = media[0];
  const previewKind = preview ? inferMediaKind(preview.path) : "file";
  const structured = decodeStructuredItemContent(item);
  const contentText = structured?.content ?? item.content;
  const label = preview ? mediaLabelFromPath(preview.path) : contentText;
  const handlePreview = () => {
    if (!preview) {
      return;
    }

    openModal({
      type: "mediaPreview",
      payload: {
        path: preview.path,
        title: label,
        caption: contentText,
      },
    });
  };

  return (
    <article
      className="flex w-[320px] flex-col gap-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-1)] p-3"
      data-testid={`item-card-${item.type}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <TypeBadge type={item.type} />
          {scars.length > 0 && <span className="h-2.5 w-2.5 rounded-full bg-[var(--ui-danger)]" data-testid="scar-indicator" />}
        </div>
        <span className="text-xs text-[var(--ui-text-3)]" title={item.createdAt.toString()}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </span>
      </div>

      <button
        type="button"
        onClick={handlePreview}
        onPointerDown={stopPointer}
        className="overflow-hidden rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-0)] text-left"
        data-testid={`btn-preview-media-${item.id}`}
      >
        {previewKind === "photo" ? (
          <img
            src={mediaSrcFromPath(preview.path)}
            alt={label}
            loading="lazy"
            decoding="async"
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="flex h-44 items-center justify-center bg-[var(--ui-surface-0)] text-[var(--ui-text-2)]">
            {previewKind === "video" ? <Video className="h-10 w-10 text-[var(--ui-accent)]" /> : <FileText className="h-10 w-10" />}
          </div>
        )}
      </button>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--ui-text-2)]">
          {previewKind === "photo" && <ImageIcon className="h-3.5 w-3.5 text-[var(--ui-accent)]" />}
          {previewKind === "video" && <Video className="h-3.5 w-3.5 text-[var(--ui-accent)]" />}
          {previewKind === "file" && <FileText className="h-3.5 w-3.5 text-[var(--ui-text-2)]" />}
          <span className="truncate">{label}</span>
        </div>

        {contentText.trim().length > 0 && (
          <p className="line-clamp-3 text-sm text-[var(--ui-text-1)]">{contentText}</p>
        )}

        {media.length > 1 && (
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-2 py-1 text-[11px] text-[var(--ui-text-2)]">
            <Layers className="h-3.5 w-3.5" />
            {media.length} files
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--ui-border)] pt-3">
        <AnimatedButton
          type="button"
          onClick={handlePreview}
          onPointerDown={stopPointer}
          variant="ghost"
          size="sm"
          className="text-xs text-[var(--ui-text-2)]"
          data-testid={`btn-preview-media-secondary-${item.id}`}
        >
          <ExternalLink className="h-3 w-3" />
          Preview
        </AnimatedButton>
        <AnimatedButton
          type="button"
          onClick={() => openModal({ type: "createBridge", payload: { sourceItemId: item.id } })}
          onPointerDown={stopPointer}
          variant="surface"
          size="sm"
          className="text-xs text-[var(--ui-accent)]"
          data-testid={`btn-open-bridge-${item.id}`}
        >
          <GitBranchPlus className="h-3 w-3" />
          Create Bridge
        </AnimatedButton>
      </div>
    </article>
  );
}
