import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const base = "rounded-2xl border border-line bg-surface";
const interactiveCls =
  "group block transition-[transform,border-color,box-shadow] duration-200 ease-out " +
  "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

type Common = { className?: string; children: ReactNode; interactive?: boolean };
type AsDiv = Common & Omit<ComponentProps<"div">, "className" | "children"> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, "className" | "children" | "href"> & { href: string };

/** Surface container. With `href` it becomes a whole-card link with hover lift. */
export function Card(props: AsDiv | AsLink) {
  const { className, children, interactive, ...rest } = props;
  if (rest.href !== undefined) {
    return (
      <Link className={cn(base, interactiveCls, className)} {...(rest as Omit<AsLink, keyof Common>)}>
        {children}
      </Link>
    );
  }
  const divRest = rest as Omit<AsDiv, keyof Common>;
  delete (divRest as { href?: undefined }).href;
  return (
    <div className={cn(base, interactive && interactiveCls, className)} {...divRest}>
      {children}
    </div>
  );
}
