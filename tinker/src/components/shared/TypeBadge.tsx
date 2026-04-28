import React from "react";
import { cn } from "../../utils/cn";

interface Props {
  type: string;
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  observation: "border border-[var(--ui-border)] bg-[var(--ui-surface-3)] text-[var(--ui-text-2)]",
  reference: "border border-[rgba(204,120,92,0.28)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]",
  attempt: "border border-[rgba(198,69,69,0.28)] bg-[var(--ui-danger-soft)] text-[var(--ui-danger)]",
  question: "border border-[rgba(212,160,23,0.3)] bg-[var(--ui-warning-soft)] text-[var(--ui-warning)]",
  breakthrough: "border border-[rgba(93,184,114,0.3)] bg-[var(--ui-success-soft)] text-[var(--ui-success)]",
  sticky: "border border-[rgba(204,120,92,0.28)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]",
};

export function TypeBadge({ type, className }: Props) {
  const colorClass = TYPE_COLORS[type.toLowerCase()] || TYPE_COLORS.observation;
  
  return (
    <span 
      className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", colorClass, className)}
      data-testid={`badge-${type}`}
    >
      {type}
    </span>
  );
}
