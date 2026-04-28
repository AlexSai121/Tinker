import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn";

interface DeleteButtonProps {
  onDelete: () => void;
  itemName?: string;
  className?: string;
  size?: "sm" | "md";
}

type DeleteState = "idle" | "confirm";

export function DeleteButton({ onDelete, itemName = "this item", className, size = "md" }: DeleteButtonProps) {
  const [state, setState] = useState<DeleteState>("idle");

  const handleClick = useCallback(() => {
    if (state === "idle") {
      setState("confirm");
      setTimeout(() => setState("idle"), 3500);
    } else {
      onDelete();
      setState("idle");
    }
  }, [state, onDelete]);

  const sizeClass = size === "sm" ? "min-h-9 px-3 py-1.5 text-sm" : "min-h-11 px-4 py-2 text-sm";

  return (
    <motion.button
      type="button"
      className={cn(
        "btn relative overflow-hidden",
        sizeClass,
        state === "confirm" ? "btn-danger" : "btn-ghost text-red-400",
        className
      )}
      animate={state === "confirm" ? { scale: [1, 1.03, 0.97, 1] } : undefined}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait">
        {state === "idle" ? (
          <motion.span
            key="idle"
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </motion.span>
        ) : (
          <motion.span
            key="confirm"
            className="flex items-center gap-2 text-white"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <motion.span
              animate={{ x: [0, -2, 2, -2, 0] }}
              transition={{ duration: 0.35 }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </motion.span>
            Click to confirm
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
