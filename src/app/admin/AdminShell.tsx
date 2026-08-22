import type { ReactNode } from "react";
import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";

/**
 * Shared page shell for /admin/* routes: the narrow hero with an "Admin"
 * badge eyebrow, then a narrow stacked content column. Pages keep their own
 * auth guard — see src/app/admin/layout.tsx for why.
 */
export function AdminPage({
  eyebrow,
  title,
  description,
  children,
}: {
  /** Shown after the Admin badge, e.g. "3 pending submissions" */
  eyebrow: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        eyebrow={
          <>
            <Badge tone="accent">Admin</Badge>
            <span className="text-line">/</span>
            {eyebrow}
          </>
        }
        title={title}
        description={description}
      />
      <Container size="narrow" className="space-y-14 py-12">
        {children}
      </Container>
    </div>
  );
}

/** Titled group of cards with an optional mono count beside the heading */
export function AdminSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 font-display text-2xl font-bold tracking-tight text-ink">
        {title}
        {count !== undefined && (
          <>
            {" "}
            <span className="font-mono text-base font-normal text-muted">{count}</span>
          </>
        )}
      </h2>
      {children}
    </section>
  );
}

/** Dashed placeholder for an empty queue */
export function AdminEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
      {children}
    </div>
  );
}
