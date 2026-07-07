"use client";

import { useState } from "react";
import { useActionState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Star, CheckCircle } from "lucide-react";
import { submitReview } from "@/app/actions/reviews";

const SUBCATEGORIES = [
  { key: "customerService", label: "Customer Service" },
  { key: "instructors",     label: "Instructors" },
  { key: "aircraft",        label: "Aircraft" },
  { key: "availability",    label: "Availability" },
  { key: "facilities",      label: "Facilities" },
] as const;

type SubKey = typeof SUBCATEGORIES[number]["key"];

type Ratings = Record<SubKey, number> & { overall: number };

function StarPicker({
  label,
  value,
  hovered,
  onRate,
  onHover,
  onLeave,
}: {
  label: string;
  value: number;
  hovered: number;
  onRate: (v: number) => void;
  onHover: (v: number) => void;
  onLeave: () => void;
}) {
  const display = hovered || value;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-slate-300 w-36 shrink-0">{label}</span>
      <div className="flex items-center gap-0.5" onMouseLeave={onLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${label} ${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onRate(star)}
            onMouseEnter={() => onHover(star)}
            className="focus:outline-none"
          >
            <Star
              size={22}
              className={star <= display ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}
              fill={star <= display ? "currentColor" : "none"}
              strokeWidth={star <= display ? 0 : 1.5}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewForm({ schoolId }: { schoolId: string }) {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(submitReview, {});
  const [ratings, setRatings] = useState<Ratings>({
    overall: 0, customerService: 0, instructors: 0, aircraft: 0, availability: 0, facilities: 0,
  });
  const [hovered, setHovered] = useState<Ratings>({
    overall: 0, customerService: 0, instructors: 0, aircraft: 0, availability: 0, facilities: 0,
  });
  const [clientError, setClientError] = useState("");

  function setRating(key: keyof Ratings, val: number) {
    setRatings((prev) => ({ ...prev, [key]: val }));
    setClientError("");
  }
  function setHover(key: keyof Ratings, val: number) {
    setHovered((prev) => ({ ...prev, [key]: val }));
  }
  function clearHover(key: keyof Ratings) {
    setHovered((prev) => ({ ...prev, [key]: 0 }));
  }

  function validate(e: React.FormEvent) {
    if (ratings.overall === 0) {
      e.preventDefault();
      setClientError("Please select an overall rating.");
      return;
    }
    const missing = SUBCATEGORIES.find(({ key }) => ratings[key] === 0);
    if (missing) {
      e.preventDefault();
      setClientError(`Please rate ${missing.label}.`);
    }
  }

  if (state.success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
        <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
        <p className="font-semibold text-green-800 dark:text-green-300 text-lg">Thanks for your review!</p>
        <p className="text-green-700 dark:text-green-400 text-sm">
          Your review is now live on this page.
        </p>
      </div>
    );
  }

  const error = clientError || state.error;

  return (
    <form
      action={action}
      onSubmit={validate}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5"
    >
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="path" value={pathname} />
      {Object.entries(ratings).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      {/* Ratings */}
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Ratings</p>
        <div className="space-y-2.5">
          {/* Overall */}
          <StarPicker
            label="Overall"
            value={ratings.overall}
            hovered={hovered.overall}
            onRate={(v) => setRating("overall", v)}
            onHover={(v) => setHover("overall", v)}
            onLeave={() => clearHover("overall")}
          />
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-2.5">
            {SUBCATEGORIES.map(({ key, label }) => (
              <StarPicker
                key={key}
                label={label}
                value={ratings[key]}
                hovered={hovered[key]}
                onRate={(v) => setRating(key, v)}
                onHover={(v) => setHover(key, v)}
                onLeave={() => clearHover(key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div>
        <label
          htmlFor="review-body"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          Your review
        </label>
        <textarea
          id="review-body"
          name="body"
          rows={4}
          required
          placeholder="Share your experience with this flight school…"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          {error}
          {error.includes("logged in") && (
            <>
              {" "}
              <Link href="/login" className="font-semibold underline">
                Log in
              </Link>
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto px-6 py-2.5 bg-rose-800 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition"
      >
        {pending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
