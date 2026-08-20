import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap " +
  "transition-[background-color,color,border-color] duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const idle = "bg-surface text-ink border-line hover:border-ink/40";
const activeCls = "bg-accent-soft text-accent-ink border-accent/40";

type Common = { active?: boolean; className?: string; children: ReactNode };
type AsButton = Common & Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, "className" | "children" | "href"> & { href: string };

/** Pill for filters, tags and program links. */
export function Chip(props: AsButton | AsLink) {
  const { active, className, children } = props;
  const cls = cn(base, active ? activeCls : idle, className);
  if (props.href !== undefined) {
    const { active: _a, className: _c, children: _ch, ...rest } = props;
    return (
      <Link className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  const { active: _a, className: _c, children: _ch, type, ...rest } = props;
  return (
    <button type={type ?? "button"} aria-pressed={active} className={cls} {...rest}>
      {children}
    </button>
  );
}
