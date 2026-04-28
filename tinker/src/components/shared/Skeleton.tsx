import React from "react";
import { cn } from "../../utils/cn";

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div className={cn("animate-pulse rounded-md bg-[var(--ui-surface-3)]", className)} aria-hidden="true" />;
}
