import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionalMotif } from "@/components/ui/SectionalMotif";

/**
 * Shared page opener: light surface band, display title, optional meta row
 * and a search/filter slot. Replaces the old gradient hero on every page.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  meta,
  back,
  aside,
  size = "wide",
  align = "left",
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Row of stats / badges under the title */
  meta?: ReactNode;
  back?: { href: string; label: string };
  /** Right column on lg (e.g. rating block, CTA) */
  aside?: ReactNode;
  size?: "wide" | "default" | "narrow" | "prose";
  align?: "left" | "center";
  /** Slot below the copy — filter inputs, chips */
  children?: ReactNode;
  className?: string;
}) {
  const centered = align === "center";
  return (
    <section className={cn("relative border-b border-line bg-surface", className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <SectionalMotif
          animate={false}
          className="absolute -right-28 -top-44 h-[30rem] w-[30rem] opacity-[0.13] md:-right-16 md:-top-40 md:h-[34rem] md:w-[34rem]"
        />
      </div>

      <Container size={size} className="relative py-12 md:py-16">
        <div
          className={cn(
            "grid gap-8",
            aside && "lg:grid-cols-[1fr_auto] lg:items-end",
          )}
        >
          <div className={cn(centered && "mx-auto max-w-3xl text-center")}>
            {back && (
              <Link
                href={back.href}
                className="group mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                <ChevronLeft
                  size={16}
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                />
                {back.label}
              </Link>
            )}
            {eyebrow && (
              <Eyebrow accent className={cn("mb-4", centered && "justify-center")}>
                {eyebrow}
              </Eyebrow>
            )}
            <h1 className="text-4xl font-bold leading-[1.02] text-ink md:text-5xl lg:text-6xl">
              {title}
            </h1>
            {description && (
              <p className={cn("mt-4 max-w-2xl text-lg text-muted", centered && "mx-auto")}>
                {description}
              </p>
            )}
            {meta && (
              <div
                className={cn(
                  "mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted",
                  centered && "justify-center",
                )}
              >
                {meta}
              </div>
            )}
            {children && <div className={cn("mt-8", centered && "mx-auto max-w-xl")}>{children}</div>}
          </div>
          {aside && <div className="lg:pb-1">{aside}</div>}
        </div>
      </Container>
    </section>
  );
}
