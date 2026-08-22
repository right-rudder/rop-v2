import Link from "next/link";
import { MapPin } from "lucide-react";
import { deleteReview, deleteComment } from "@/app/actions/reviews";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function ModerationCard({
  kind,
  id,
  author,
  school,
  createdAt,
  rating,
  body,
  context,
}: {
  kind: "review" | "comment";
  id: string;
  author: { name: string; href: string };
  school: { name: string; href: string; airportCode: string } | null;
  createdAt: string;
  /** Overall stars — reviews only */
  rating?: number;
  body: string;
  /** Comments only: what the comment is attached to, e.g. "on Jane Doe's review" */
  context?: string;
}) {
  const date = new Date(createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{date}</p>
          <p className="mt-1 text-sm">
            <Link href={author.href} className="font-display text-lg font-bold tracking-tight text-ink hover:text-accent-ink">
              {author.name}
            </Link>
            {context && <span className="ml-2 text-muted">{context}</span>}
          </p>
          {school ? (
            <Link href={school.href} className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted hover:text-accent-ink">
              <MapPin size={13} aria-hidden />
              <span className="font-mono font-semibold text-sky">{school.airportCode}</span> · {school.name}
            </Link>
          ) : (
            <p className="mt-0.5 text-sm text-muted">School no longer listed</p>
          )}
        </div>
        {rating !== undefined && <Stars value={rating} size={14} />}
      </div>

      <p className="whitespace-pre-line rounded-xl bg-surface-2 px-4 py-3 text-sm leading-relaxed text-ink">{body}</p>

      <ConfirmDeleteButton
        action={kind === "review" ? deleteReview : deleteComment}
        fields={kind === "review" ? { reviewId: id } : { commentId: id }}
        label={kind === "review" ? "Delete review" : "Delete comment"}
        confirmText={`Delete this ${kind} as admin? This can't be undone.`}
        path="/admin/moderation"
      />
    </Card>
  );
}
