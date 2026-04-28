import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

interface SaveButtonProps {
  onSave: () => Promise<void>;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

type SaveState = "idle" | "saving" | "success" | "error";

export function SaveButton({ onSave, children = "Save", className, disabled }: SaveButtonProps) {
  const [state, setState] = useState<SaveState>("idle");

  const handleClick = useCallback(async () => {
    if (state !== "idle") return;
    setState("saving");
    try {
      await onSave();
      setState("success");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }, [onSave, state]);

  const bgColor = {
    idle: "var(--ui-accent)",
    saving: "var(--ui-accent)",
    success: "var(--ui-success)",
    error: "var(--ui-danger)",
  }[state];

  return (
    <motion.button
      type="button"
      className={cn(
        "btn btn-primary relative overflow-hidden",
        className
      )}
      style={{ backgroundColor: bgColor }}
      animate={{ backgroundColor: bgColor }}
      whileHover={state === "idle" && !disabled ? { y: -1 } : undefined}
      whileTap={state === "idle" && !disabled ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => void handleClick()}
      disabled={state !== "idle" || disabled}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          className="flex items-center justify-center gap-2 text-white"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {state === "idle" && children}
          {state === "saving" && (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-4 w-4" />
              </motion.span>
              Saving…
            </>
          )}
          {state === "success" && (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          )}
          {state === "error" && "Failed — retry?"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
