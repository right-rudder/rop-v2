import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Size = "wide" | "default" | "narrow" | "prose";

const sizes: Record<Size, string> = {
  wide: "max-w-7xl",
  default: "max-w-5xl",
  narrow: "max-w-4xl",
  prose: "max-w-3xl",
};

export function Container({
  size = "wide",
  className,
  children,
}: {
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)}>
      {children}
    </div>
  );
}
