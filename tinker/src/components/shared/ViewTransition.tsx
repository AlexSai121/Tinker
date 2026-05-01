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
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.995,
    transition: { duration: 0.1, ease: "easeOut" },
  },
};

export function ViewTransition({ viewKey, children }: ViewTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        className="h-full w-full origin-top"
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
