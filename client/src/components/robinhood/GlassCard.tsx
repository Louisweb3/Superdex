import { HTMLAttributes, ReactNode } from "react";
import { cardBase, cardHover } from "./theme";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

export function GlassCard({
  children,
  hoverable = false,
  className = "",
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={`${cardBase} ${hoverable ? cardHover : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
