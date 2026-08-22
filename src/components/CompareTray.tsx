"use client";

import { X } from "lucide-react";
import { useCompare } from "@/components/CompareProvider";
import { formatCompareHref, COMPARE_MAX } from "@/lib/compare";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/** Sticky bottom bar listing the compare picks. Renders nothing when empty. */
export function CompareTray() {
  const { picks, remove, clear } = useCompare();
  if (picks.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Compare schools"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 shadow-card backdrop-blur"
    >
      <Container className="flex flex-wrap items-center gap-3 py-3">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
          Compare <span className="text-ink">{picks.length}</span>/{COMPARE_MAX}
        </span>
        <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {picks.map((p) => (
            <li
              key={p.id}
              className="inline-flex max-w-[14rem] items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink"
            >
              <span className="truncate">{p.name}</span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name} from compare`}
                className="rounded-full text-muted transition-colors hover:text-ink"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          {picks.length >= 2 ? (
            <Button size="sm" href={formatCompareHref(picks.map((p) => p.id))}>
              Compare ({picks.length})
            </Button>
          ) : (
            <Button size="sm" disabled title="Pick at least two schools">
              Compare ({picks.length})
            </Button>
          )}
        </div>
      </Container>
    </div>
  );
}
