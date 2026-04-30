import React from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, FileText, GitBranchPlus, Image as ImageIcon, Video } from "lucide-react";
import type { Item, ItemMedia, Scar } from "../../types";
import { TypeBadge } from "../shared/TypeBadge";
import { ScarTagger } from "./ScarTagger";
import { decodeStructuredItemContent } from "../../utils/itemContent";
import { mediaLabelFromPath, mediaSrcFromPath } from "../../utils/media";
import { useUiStore } from "../../stores/uiStore";
import { AnimatedButton } from "../shared/AnimatedButton";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { cn } from "../../utils/cn";

interface Props {
  item: Item;
  media: ItemMedia[];
  scars: Scar[];
}

const ITEM_ACCENTS: Record<string, string> = {
  observation: "var(--ui-accent-note)",
  reference: "var(--ui-accent-reference)",
  attempt: "var(--ui-accent-attempt)",
  question: "var(--ui-accent-question)",
  breakthrough: "var(--ui-accent-breakthrough)",
  sticky: "var(--ui-accent-note)",
};

export function ItemCard({ item, media, scars }: Props) {
  const openModal = useUiStore((s) => s.openModal);
  const { isTabletLayout } = useResponsiveLayout();
  const stopPointer = (event: React.PointerEvent<HTMLElement>) => event.stopPropagation();
  const structured = decodeStructuredItemContent(item);
  const title = structured?.title;
  const contentText = structured?.content ?? item.content;
  const whyThisMatters = structured?.whyThisMatters ?? "";
  const sourceUrl = structured?.sourceUrl;
  const attemptWhat = structured?.attemptWhat;
  const attemptResult = structured?.attemptResult;
  const attemptTools = structured?.attemptTools ?? [];
  const outcome = structured?.outcome;
  const confidence = structured?.confidence;

  const getCardStyle = () => {
    if (scars.length > 0) return "bg-[#fae8e5] border border-[#f5d2cd] shadow-sm"; // Show as failure if it has scars
    switch (item.type) {
      case "observation": return "bg-[#fcf5de] border border-[#f5e6b3] shadow-sm";
      case "breakthrough": return "bg-[#e8f2e6] border border-[#d2e8cd] shadow-sm";
      default: return "bg-white border border-[var(--ui-border)] shadow-[var(--ui-shadow-card)]";
    }
  };

  const getTapeColor = () => {
    if (scars.length > 0) return "bg-[#e6958a]";
    switch (item.type) {
      case "observation": return "bg-[#e6c35c]";
      case "breakthrough": return "bg-[#7bb371]";
      case "reference": return "bg-[#8ba6c1]";
      case "attempt": return "bg-[#c4beb8]";
      default: return "bg-[var(--ui-border-strong)]";
    }
  };

  return (
    <motion.div
      className={cn("flex flex-col gap-3 p-4 rounded-xl relative overflow-hidden transition-colors hover:border-[var(--ui-border-strong)]", getCardStyle())}
      style={{ "--item-accent": ITEM_ACCENTS[item.type] ?? "var(--ui-accent-note)" } as React.CSSProperties}
      data-testid={`item-card-${item.type}`}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className={cn("absolute top-3 right-3 w-2.5 h-2.5 rounded-full shadow-inner opacity-80", getTapeColor())} />
      <div className="flex justify-between items-start pt-1">
        <div className="flex flex-col gap-2">
          <div className="text-[9px] font-bold tracking-widest text-black/40 uppercase">
            {item.type}
          </div>
          {scars.length > 0 && (
            <motion.span
              className="h-2 w-2 rounded-full bg-[var(--ui-danger)]"
              title={`${scars.length} scar${scars.length === 1 ? "" : "s"} tagged`}
              data-testid="scar-indicator"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        {title && (
          <div className="pr-5 text-[28px] leading-tight tracking-[-0.02em] text-[#1f1b18]">
            {title}
          </div>
        )}
        <div className="item-handwriting whitespace-pre-wrap break-words pr-5 font-[var(--ui-font-hand)] text-[15px] leading-relaxed text-[#2a2622]">
          {contentText}
        </div>
      </div>

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          onPointerDown={stopPointer}
          className="ui-link text-xs"
        >
          {sourceUrl}
        </a>
      )}

      {whyThisMatters && (
        <div className="mt-2 rounded-[var(--ui-radius-sm)] border border-[rgba(102,138,91,0.24)] bg-[var(--ui-success-soft)] p-2 text-xs">
          <span className="mb-1 block font-semibold text-[var(--ui-success)]">Why this matters:</span>
          <span className="text-[var(--ui-text-2)]">{whyThisMatters}</span>
        </div>
      )}

      {item.type === "attempt" && (attemptWhat || attemptResult) && (
        <div className="grid gap-2 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[rgba(255,253,247,0.42)] p-3 text-xs">
          {attemptWhat && (
            <div>
              <span className="mb-1 block font-semibold text-[var(--ui-accent)]">What you tried</span>
              <span className="text-[var(--ui-text-2)]">{attemptWhat}</span>
            </div>
          )}
          {attemptResult && (
            <div>
              <span className="mb-1 block font-semibold text-[var(--ui-accent)]">Result</span>
              <span className="text-[var(--ui-text-2)]">{attemptResult}</span>
            </div>
          )}
          {attemptTools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {attemptTools.map((tool) => (
                <span key={tool} className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-1)] px-2 py-1 text-[var(--ui-text-2)]">
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {(outcome || confidence !== undefined) && (
        <div className="flex items-center gap-2 text-[11px] text-[var(--ui-text-2)]">
          {outcome && <span className="rounded-full bg-white/55 px-2 py-1 capitalize">{outcome}</span>}
          {confidence !== undefined && <span>{confidence}% confidence</span>}
        </div>
      )}

      {media.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {media.map(m => (
            <div key={m.id} className="overflow-hidden rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-bg-muted)]">
              {m.type === "photo" ? (
                <img
                  src={mediaSrcFromPath(m.path)}
                  alt={mediaLabelFromPath(m.path)}
                  loading="lazy"
                  decoding="async"
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center">
                  {m.type === "video" && <Video className="h-6 w-6 text-[var(--ui-accent)]" />}
                  {m.type === "file" && <FileText className="h-6 w-6 text-[var(--ui-text-2)]" />}
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2 py-2 text-xs text-[var(--ui-text-2)]">
                {m.type === "photo" && <ImageIcon className="w-3 h-3 text-[var(--ui-accent)]" />}
                {m.type === "video" && <Video className="w-3 h-3 text-[var(--ui-accent)]" />}
                {m.type === "file" && <FileText className="w-3 h-3 text-[var(--ui-text-2)]" />}
                <span className="truncate">{mediaLabelFromPath(m.path)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto border-t border-[var(--ui-border)] pt-3">
        {scars.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {scars.map(scar => (
              <span key={scar.id} className="inline-flex items-center gap-1 rounded-full border border-[rgba(198,69,69,0.28)] bg-[var(--ui-danger-soft)] px-1.5 py-0.5 text-[10px] text-[var(--ui-danger)]">
                <AlertTriangle className="w-2.5 h-2.5" />
                {scar.failureType} ({scar.severity})
              </span>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-3">
          {item.type === "attempt" && !isTabletLayout && <ScarTagger itemId={item.id} />}
          <AnimatedButton
            type="button"
            onClick={() => openModal({ type: "createBridge", payload: { sourceItemId: item.id } })}
            onPointerDown={stopPointer}
            variant="surface"
            size="sm"
            className="flex items-center gap-1 text-xs text-[var(--ui-accent)]"
            data-testid={`btn-open-bridge-${item.id}`}
          >
            <GitBranchPlus className="h-3 w-3" />
            Create Bridge
          </AnimatedButton>
        </div>
      </div>
    </motion.div>
  );
}
