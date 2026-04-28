import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

type AnimatedButtonVariant = "primary" | "ghost" | "danger" | "surface";
type AnimatedButtonSize = "sm" | "md" | "icon";

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
>;

interface AnimatedButtonProps extends NativeButtonProps {
  variant?: AnimatedButtonVariant;
  size?: AnimatedButtonSize;
  active?: boolean;
  isLoading?: boolean;
}

const variantClasses: Record<AnimatedButtonVariant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  surface: "btn-surface",
};

const sizeClasses: Record<AnimatedButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-11 px-4 py-2 text-sm",
  icon: "h-11 w-11 px-0 py-0",
};

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  function AnimatedButton(
    {
      className,
      variant = "ghost",
      size = "md",
      active = false,
      disabled,
      isLoading,
      type = "button",
      children,
      ...props
    },
    ref
  ) {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={disabled || isLoading ? undefined : { y: -1 }}
        whileTap={disabled || isLoading ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 450, damping: 18 }}
        className={cn(
          "btn relative select-none",
          variantClasses[variant],
          sizeClasses[size],
          active && "btn-active",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        <motion.span
          className="flex items-center justify-center gap-2"
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.span>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <motion.div
                className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);
