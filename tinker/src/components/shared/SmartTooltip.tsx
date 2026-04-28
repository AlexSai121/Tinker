import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

interface SmartTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bubbleClassName?: string;
  delay?: number;
  position?: "top" | "bottom";
}

export function SmartTooltip({
  content,
  children,
  className,
  bubbleClassName,
  delay = 300,
  position = "bottom",
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setIsVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  }, []);

  const positionClasses = position === "top"
    ? "bottom-full left-1/2 mb-2"
    : "top-full left-1/2 mt-2";

  const initialY = position === "top" ? 4 : -4;

  return (
    <span
      className={cn("group/tooltip relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.span
            role="tooltip"
            className={cn(
              "tooltip-bubble pointer-events-none absolute z-50 hidden sm:inline-flex",
              positionClasses,
              bubbleClassName
            )}
            initial={{ opacity: 0, y: initialY, x: "-50%", scale: 0.92 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: initialY, x: "-50%", scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
