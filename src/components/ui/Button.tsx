import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap select-none " +
  "transition-[background-color,color,border-color,transform,translate,box-shadow] duration-200 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-sm hover:bg-accent-ink hover:-translate-y-px active:translate-y-0",
  secondary:
    "bg-surface text-ink border border-line hover:border-ink/30 hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

type Common = {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

type AsButton = Common & Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, "className" | "children" | "href"> & { href: string };

/** The one button. Renders a Next <Link> when `href` is given. */
export function Button(props: AsButton | AsLink) {
  const { variant = "primary", size = "md", full, className, children, ...rest } = props;
  const cls = cn(base, variants[variant], sizes[size], full && "w-full", className);

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
    <button type={type ?? "button"} className={cls} {...buttonRest}>
      {children}
    </button>
  );
}
