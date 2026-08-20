import { Button } from "@/components/ui/Button";

/** Shared "nothing here yet" box for listing sections — an invitation to act. */
export function EmptyState({
  title,
  hint,
  actionLabel = "Submit a listing",
  actionHref = "/schools/add",
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
      <p className="font-display text-xl font-bold tracking-tight text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{hint}</p>
      <Button href={actionHref} variant="secondary" size="sm" className="mt-6">
        {actionLabel}
      </Button>
    </div>
  );
}
