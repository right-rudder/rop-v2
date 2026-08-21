"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Fade-up on first scroll into view. `index` staggers siblings (70ms each).
 * Motion is disabled globally under prefers-reduced-motion (see globals.css).
 *
 * `as="li"` lets list consumers keep a valid content model — an `<ol>`/`<ul>`
 * must have list items as direct children, so the reveal element *is* the item.
 */
export function Reveal({
  children,
  index = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        ref.current = el;
      }}
      className={cn("reveal", className)}
      style={{ "--i": Math.min(index, 8) } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
