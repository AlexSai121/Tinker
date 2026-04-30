import React from "react";
import { cn } from "../../utils/cn";

interface Props {
  type: string;
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  observation: "border border-[rgba(157,120,50,0.22)] bg-[rgba(235,203,122,0.28)] text-[#6f5520]",
  reference: "border border-[rgba(111,135,157,0.24)] bg-[rgba(169,186,203,0.28)] text-[#53697d]",
  attempt: "border border-[rgba(111,102,91,0.18)] bg-[rgba(216,208,195,0.42)] text-[var(--ui-text-2)]",
  question: "border border-[rgba(183,95,80,0.22)] bg-[rgba(221,169,156,0.26)] text-[#8b5148]",
  breakthrough: "border border-[rgba(102,138,91,0.24)] bg-[rgba(155,181,143,0.28)] text-[#56754d]",
  sticky: "border border-[rgba(157,120,50,0.22)] bg-[rgba(235,203,122,0.34)] text-[#6f5520]",
};

export function TypeBadge({ type, className }: Props) {
  const colorClass = TYPE_COLORS[type.toLowerCase()] || TYPE_COLORS.observation;
  
  return (
    <span 
      className={cn("rounded-[var(--ui-radius-xs)] px-2 py-0.5 text-[10px] font-semibold uppercase", colorClass, className)}
      data-testid={`badge-${type}`}
    >
      {type}
    </span>
  );
}
