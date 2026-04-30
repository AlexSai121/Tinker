import React, { useEffect, useRef, useState } from "react";
import { Pin } from "lucide-react";
import type { Item } from "../../types";
import { useUpdateItem } from "../../hooks/useItems";
import { decodeStructuredItemContent, encodeStructuredItemContent } from "../../utils/itemContent";

interface Props {
  item: Item;
  autoFocus?: boolean;
}

export function StickyNote({ item, autoFocus = false }: Props) {
  const updateItem = useUpdateItem();
  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const structured = decodeStructuredItemContent(item);
  const [titleDraft, setTitleDraft] = useState(structured?.title ?? "");
  const [bodyDraft, setBodyDraft] = useState(structured?.content ?? item.content);

  useEffect(() => {
    const nextStructured = decodeStructuredItemContent(item);
    setTitleDraft(nextStructured?.title ?? "");
    setBodyDraft(nextStructured?.content ?? item.content);
  }, [item]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    if (titleDraft.trim().length === 0) {
      titleRef.current?.focus();
      return;
    }

    textareaRef.current?.focus();
  }, [autoFocus, titleDraft]);

  const buildNextContent = () => {
    const nextTitle = titleDraft.trim();
    const nextBody = bodyDraft.trimEnd();

    if (!nextTitle && !nextBody) {
      return "";
    }

    return encodeStructuredItemContent({
      version: 1,
      title: nextTitle || undefined,
      content: nextBody,
    });
  };

  const handleCommit = async () => {
    const nextContent = buildNextContent();
    if (nextContent === item.content) {
      return;
    }

    await updateItem.mutateAsync({
      id: item.id,
      data: {
        content: nextContent,
      },
    });
  };

  return (
    <article
      className="item-material-card flex min-h-[220px] w-[260px] rotate-[-1deg] flex-col overflow-hidden text-[var(--ui-text-1)]"
      style={{ "--item-accent": "var(--ui-accent-note)" } as React.CSSProperties}
      data-testid="item-card-sticky"
    >
      <div className="flex items-center justify-between border-b border-[rgba(157,120,50,0.22)] bg-[rgba(235,203,122,0.2)] px-3 py-2">
        <span className="text-[10px] font-semibold uppercase text-[#6f5520]">Sticky</span>
        <Pin className="h-3.5 w-3.5 text-[#6f5520]" />
      </div>

      <input
        ref={titleRef}
        value={titleDraft}
        onChange={(event) => setTitleDraft(event.target.value)}
        onBlur={() => void handleCommit()}
        onPointerDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        className="border-b border-[rgba(157,120,50,0.16)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ui-text-1)] outline-none placeholder:text-[var(--ui-text-3)]"
        placeholder="Title"
        data-testid={`sticky-note-title-${item.id}`}
      />

      <textarea
        ref={textareaRef}
        value={bodyDraft}
        onChange={(event) => setBodyDraft(event.target.value)}
        onBlur={() => void handleCommit()}
        onPointerDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        className="item-handwriting min-h-0 flex-1 resize-none bg-transparent px-4 py-3 outline-none placeholder:text-[var(--ui-text-3)]"
        placeholder="Jot it down..."
        data-testid={`sticky-note-input-${item.id}`}
      />
    </article>
  );
}
