import React, { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  testId?: string;
}

interface SegmentedTabsProps<T extends string> {
  value: T;
  options: SegmentedTabOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
  className,
  size = "md",
}: SegmentedTabsProps<T>) {
  const layoutId = useId();

  return (
    <div className={cn("segmented-control", size === "sm" && "segmented-control-sm", className)}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn("segmented-tab", isActive && "is-active")}
            data-testid={option.testId}
          >
            {isActive && (
              <motion.span
                layoutId={`${layoutId}-active-pill`}
                className="segmented-tab-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
              {option.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
}
