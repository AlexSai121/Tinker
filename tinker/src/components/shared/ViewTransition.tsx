import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ViewTransitionProps {
  viewKey: string;
  children: React.ReactNode;
}

const variants = {
  enter: {
    opacity: 0,
    y: 12,
    scale: 0.995,
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
  },
};

export function ViewTransition({ viewKey, children }: ViewTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        className="h-full w-full"
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 30,
          mass: 0.8,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
