"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, MessageSquare, CheckCircle, Trash2 } from "lucide-react";
import type { Review, Comment, User } from "@/lib/types";
import { submitComment, deleteReview } from "@/app/actions/reviews";

const SUBCATEGORIES: { key: keyof Review; label: string }[] = [
  { key: "customerService", label: "Customer Service" },
  { key: "instructors",     label: "Instructors" },
  { key: "aircraft",        label: "Aircraft" },
  { key: "availability",    label: "Availability" },
  { key: "facilities",      label: "Facilities" },
];

function StarRow({ filled, size = 14 }: { filled: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className="text-amber-400"
          fill={i <= filled ? "currentColor" : "none"}
          strokeWidth={i <= filled ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

function CommentForm({ reviewId }: { reviewId: string }) {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(submitComment, {});

  if (state.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3">
        <CheckCircle size={16} />
        <span>Comment posted.</span>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3 mt-3">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="path" value={pathname} />
      <textarea
        rows={3}
        name="body"
        required
        placeholder="Add a comment…"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      {state.error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          {state.error}
          {state.error.includes("logged in") && (
            <>
              {" "}
              <Link href="/login" className="font-semibold underline">
                Log in
              </Link>
            </>
          )}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition"
        >
          {pending ? "Posting…" : "Post Comment"}
        </button>
      </div>
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
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
      >
        <Trash2 size={13} />
        Delete review
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="path" value={pathname} />
      <span className="text-xs text-slate-600 dark:text-slate-300">
        Delete your review? This can&apos;t be undone.
      </span>
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
      >
        Cancel
      </button>
      {state.error && (
        <span className="text-xs text-rose-600 dark:text-rose-400">
          {state.error}
        </span>
      )}
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      {/* Header: reviewer + overall rating + date */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <Link
            href={`/profile/${review.userId}`}
            className="font-semibold text-slate-800 dark:text-slate-100 text-sm hover:text-blue-700 dark:hover:text-blue-400 transition"
          >
            {fullName}
          </Link>
          {user?.pilotCertificates && user.pilotCertificates.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {user.pilotCertificates.map((slug) => (
                <span
                  key={slug}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded"
                >
                  {programShortNames[slug] ?? slug}
                </span>
              ))}
            </div>
          )}
          <div className="mt-1.5">
            <StarRow filled={review.overall} />
          </div>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">{date}</span>
      </div>

      {/* Subcategory ratings */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mb-4 py-3 border-y border-slate-100 dark:border-slate-800">
        {SUBCATEGORIES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            <StarRow filled={review[key] as number} size={11} />
          </div>
        ))}
      </div>

      {/* Review body */}
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
        {review.body}
      </p>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3 mb-3">
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
                <div className="w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0 self-stretch" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/profile/${comment.userId}`}
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition"
                    >
                      {commenterName}
                    </Link>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{commentDate}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {comment.body}
                  </p>
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
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition"
          >
            <MessageSquare size={13} />
            Leave a comment
          </button>
        ) : (
          <span />
        )}
        {review.userId === currentUserId && (
          <DeleteReviewButton reviewId={review.id} />
        )}
      </div>
      {showForm && <CommentForm reviewId={review.id} />}
    </div>
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No reviews yet. Be the first to share your experience!
        </p>
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col sm:flex-row gap-6">
        {/* Overall score + distribution */}
        <div className="flex flex-col sm:flex-row gap-6 flex-1">
          <div className="flex flex-col items-center justify-center sm:border-r border-slate-200 dark:border-slate-700 sm:pr-6 shrink-0">
            <span className="text-5xl font-extrabold text-slate-800 dark:text-slate-100">
              {avg.toFixed(1)}
            </span>
            <StarRow filled={Math.round(avg)} />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          {/* Bar chart */}
          <div className="flex-1 space-y-2">
            {dist.map(({ star, count }) => {
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-right text-slate-600 dark:text-slate-400 shrink-0">{star}</span>
                  <Star size={12} className="text-amber-400 shrink-0" fill="currentColor" strokeWidth={0} />
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 text-slate-500 dark:text-slate-400 shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subcategory averages */}
        <div className="sm:border-l border-slate-200 dark:border-slate-700 sm:pl-6 space-y-2 shrink-0">
          {subAvgs.map(({ label, avg: subAvg }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-600 dark:text-slate-400 w-32">{label}</span>
              <div className="flex items-center gap-1.5">
                <StarRow filled={Math.round(subAvg)} size={12} />
                <span className="text-xs text-slate-500 dark:text-slate-400 w-6 text-right">
                  {subAvg.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
