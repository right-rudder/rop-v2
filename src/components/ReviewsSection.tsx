"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, MessageSquare, Trash2 } from "lucide-react";
import type { Review, Comment, User } from "@/lib/types";
import { submitComment, deleteReview } from "@/app/actions/reviews";
import { LIMITS } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { Stars } from "@/components/ui/Stars";
import { Textarea } from "@/components/ui/Input";

const SUBCATEGORIES: { key: keyof Review; label: string }[] = [
  { key: "customerService", label: "Customer service" },
  { key: "instructors",     label: "Instructors" },
  { key: "aircraft",        label: "Aircraft" },
  { key: "availability",    label: "Availability" },
  { key: "facilities",      label: "Facilities" },
];

function LoginHint({ error }: { error: string }) {
  const pathname = usePathname();
  return (
    <>
      {error}
      {error.includes("logged in") && (
        <>
          {" "}
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="font-semibold underline underline-offset-2"
          >
            Log in
          </Link>
        </>
      )}
    </>
  );
}

function CommentForm({ reviewId }: { reviewId: string }) {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(submitComment, {});

  if (state.success) {
    return (
      <Notice tone="ok" className="mt-3">
        Comment posted.
      </Notice>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="path" value={pathname} />
      <Textarea
        rows={3}
        name="body"
        required
        maxLength={LIMITS.commentBody}
        placeholder="Add a comment…"
        aria-label="Your comment"
        className="min-h-0 text-sm"
      />
      {state.error && (
        <Notice tone="error">
          <LoginHint error={state.error} />
        </Notice>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Posting…" : "Post comment"}
      </Button>
    </form>
  );
}

function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const pathname = usePathname();
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteReview, {});

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-danger"
      >
        <Trash2 size={13} />
        Delete review
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="path" value={pathname} />
      <span className="text-xs text-muted">Delete your review? This can&apos;t be undone.</span>
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold text-danger hover:underline disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs text-muted hover:underline"
      >
        Cancel
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}

function ReviewCard({
  review,
  comments,
  usersById,
  programShortNames,
  currentUserId,
}: {
  review: Review;
  comments: Comment[];
  usersById: Record<string, User>;
  programShortNames: Record<string, string>;
  currentUserId?: string | null;
}) {
  const [showForm, setShowForm] = useState(false);

  const user = usersById[review.userId];
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Anonymous";
  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Card className="p-5 md:p-6">
      {/* Header: reviewer + overall rating + date */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/profile/${review.userId}`}
            className="text-sm font-semibold text-ink transition-colors hover:text-accent-ink"
          >
            {fullName}
          </Link>
          {user?.pilotCertificates && user.pilotCertificates.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {user.pilotCertificates.map((slug) => (
                <span
                  key={slug}
                  className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted"
                >
                  {programShortNames[slug] ?? slug}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2">
            <Stars value={review.overall} size={14} />
          </div>
        </div>
        <time className="mt-0.5 shrink-0 font-mono text-xs text-muted" dateTime={review.createdAt}>
          {date}
        </time>
      </div>

      {/* Subcategory ratings */}
      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1.5 border-y border-line py-3 sm:grid-cols-3">
        {SUBCATEGORIES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">{label}</span>
            <Stars value={review[key] as number} size={11} showValue={false} />
          </div>
        ))}
      </div>

      {/* Review body */}
      <p className="mb-4 text-sm leading-relaxed text-ink/90">{review.body}</p>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="mb-3 space-y-3 border-t border-line pt-3">
          {comments.map((comment) => {
            const commenter = usersById[comment.userId];
            const commenterName = commenter
              ? `${commenter.firstName} ${commenter.lastName}`
              : "Anonymous";
            const commentDate = new Date(comment.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });
            return (
              <div key={comment.id} className="flex gap-3">
                <div className="w-0.5 shrink-0 self-stretch rounded-full bg-accent/40" />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <Link
                      href={`/profile/${comment.userId}`}
                      className="text-xs font-semibold text-ink transition-colors hover:text-accent-ink"
                    >
                      {commenterName}
                    </Link>
                    <span className="font-mono text-[0.65rem] text-muted">{commentDate}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leave a comment toggle + own-review delete */}
      <div className="flex items-center justify-between gap-3">
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent-ink"
          >
            <MessageSquare size={13} />
            Leave a comment
          </button>
        ) : (
          <span />
        )}
        {review.userId === currentUserId && <DeleteReviewButton reviewId={review.id} />}
      </div>
      {showForm && <CommentForm reviewId={review.id} />}
    </Card>
  );
}

export default function ReviewsSection({
  reviews,
  commentsByReview,
  usersById,
  programShortNames,
  currentUserId,
}: {
  reviews: Review[];
  commentsByReview: Record<string, Comment[]>;
  usersById: Record<string, User>;
  programShortNames: Record<string, string>;
  currentUserId?: string | null;
}) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
        No reviews yet. Be the first to share your experience below.
      </div>
    );
  }

  const avg = reviews.reduce((sum, r) => sum + r.overall, 0) / reviews.length;

  // Distribution based on overall rating
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.overall === star).length,
  }));

  // Subcategory averages
  const subAvgs = SUBCATEGORIES.map(({ key, label }) => ({
    label,
    avg: reviews.reduce((sum, r) => sum + (r[key] as number), 0) / reviews.length,
  }));

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto]">
        {/* Overall score */}
        <div className="flex flex-col items-start justify-center sm:border-r sm:border-line sm:pr-6">
          <span className="font-display text-6xl font-bold leading-none tracking-tight text-ink">
            {avg.toFixed(1)}
          </span>
          <Stars value={avg} showValue={false} size={14} className="mt-2" />
          <span className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Bar chart */}
        <div className="space-y-2 self-center">
          {dist.map(({ star, count }) => {
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 shrink-0 text-right font-mono text-xs text-muted">{star}</span>
                <Star size={11} className="shrink-0 text-star" fill="currentColor" strokeWidth={0} />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-star transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 font-mono text-xs text-muted">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Subcategory averages */}
        <div className="space-y-2 border-t border-line pt-5 sm:col-span-2 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {subAvgs.map(({ label, avg: subAvg }) => (
            <div key={label} className="flex items-center justify-between gap-6">
              <span className="text-xs text-muted">{label}</span>
              <div className="flex items-center gap-2">
                <Stars value={subAvg} size={11} showValue={false} />
                <span className="w-6 text-right font-mono text-xs text-ink">{subAvg.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            comments={commentsByReview[review.id] ?? []}
            usersById={usersById}
            programShortNames={programShortNames}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
