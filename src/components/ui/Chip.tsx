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
  const { active, className, children, ...rest } = props;
  const cls = cn(base, active ? activeCls : idle, className);
  if (rest.href !== undefined) {
    return (
      <Link className={cls} {...(rest as Omit<AsLink, keyof Common>)}>
        {children}
      </Link>
    );
  }
  const { type, ...buttonRest } = rest as Omit<AsButton, keyof Common>;
  delete (buttonRest as { href?: undefined }).href;
  return (
    <button type={type ?? "button"} aria-pressed={active} className={cls} {...buttonRest}>
      {children}
    </button>
  );
}
