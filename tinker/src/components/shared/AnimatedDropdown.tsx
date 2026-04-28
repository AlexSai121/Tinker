import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

interface DropdownOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedDropdownProps {
  options: DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function AnimatedDropdown({
  options,
  selectedId,
  onSelect,
  placeholder = "Select…",
  className,
  triggerClassName,
}: AnimatedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === selectedId);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      setIsOpen(false);
    },
    [onSelect]
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "input flex items-center justify-between gap-2 cursor-pointer",
          triggerClassName
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption?.label ?? placeholder}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border shadow-xl"
            style={{
              borderColor: "var(--ui-border)",
              background: "var(--ui-surface-elevated)",
              boxShadow: "var(--ui-shadow-2)",
            }}
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style-origin="top"
          >
            {options.map((option, i) => (
              <motion.button
                key={option.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors",
                  selectedId === option.id
                    ? "bg-[var(--ui-accent-soft)] font-medium"
                    : "hover:bg-[rgba(255,255,255,0.04)]"
                )}
                style={{ color: "var(--ui-text-1)" }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => handleSelect(option.id)}
              >
                {option.icon}
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
