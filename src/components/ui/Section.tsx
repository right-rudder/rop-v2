import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

/** Page section with consistent rhythm and an optional heading block. */
export function Section({
  eyebrow,
  title,
  description,
  action,
  tone = "plain",
  size = "wide",
  className,
  headingClassName,
  id,
  children,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  /** tinted = soft band to break up long pages */
  tone?: "plain" | "tinted";
  size?: "wide" | "default" | "narrow" | "prose";
  className?: string;
  headingClassName?: string;
  id?: string;
  children: ReactNode;
}) {
  const hasHeading = eyebrow || title || description || action;
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24",
        tone === "tinted" && "border-y border-line bg-surface-2/60",
        className,
      )}
    >
      <Container size={size}>
        {hasHeading && (
          <div
            className={cn(
              "mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
              headingClassName,
            )}
          >
            <div className="max-w-2xl">
              {eyebrow && <Eyebrow accent className="mb-3">{eyebrow}</Eyebrow>}
              {title && (
                <h2 className="text-3xl font-bold leading-[1.05] text-ink md:text-4xl">
                  {title}
                </h2>
              )}
              {description && <p className="mt-3 text-base text-muted md:text-lg">{description}</p>}
            </div>
            {action && (
              <Link
                href={action.href}
                className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent-ink"
              >
                {action.label}
                <ArrowRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
