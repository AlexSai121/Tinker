import React from "react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--ui-radius-md)] border border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-surface-1)] px-6 py-10 text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-[var(--ui-text-1)]">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm text-[var(--ui-text-3)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
