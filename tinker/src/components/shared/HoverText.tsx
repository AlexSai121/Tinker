import React from "react";
import { cn } from "../../utils/cn";

interface HoverTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function HoverText({
  children,
  className,
  as: Tag = "span",
}: HoverTextProps) {
  return <Tag className={cn("relative inline-block", className)}>{children}</Tag>;
}
