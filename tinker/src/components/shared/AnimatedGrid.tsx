import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

interface AnimatedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export function AnimatedGrid<T>({
  items,
  renderItem,
  keyExtractor,
  className,
}: AnimatedGridProps<T>) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
