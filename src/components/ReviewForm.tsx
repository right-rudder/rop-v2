"use client";

import { useState } from "react";
import { useActionState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Star, CheckCircle2 } from "lucide-react";
import { submitReview } from "@/app/actions/reviews";
import { LIMITS } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

const SUBCATEGORIES = [
  { key: "customerService", label: "Customer service" },
  { key: "instructors",     label: "Instructors" },
  { key: "aircraft",        label: "Aircraft" },
  { key: "availability",    label: "Availability" },
  { key: "facilities",      label: "Facilities" },
] as const;

type SubKey = typeof SUBCATEGORIES[number]["key"];

type Ratings = Record<SubKey, number> & { overall: number };

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function StarPicker({
  label,
  value,
  hovered,
  onRate,
  onHover,
  onLeave,
  emphasis,
}: {
  label: string;
  value: number;
  hovered: number;
  onRate: (v: number) => void;
  onHover: (v: number) => void;
  onLeave: () => void;
  emphasis?: boolean;
}) {
  const display = hovered || value;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn("w-36 shrink-0 text-sm", emphasis ? "font-semibold text-ink" : "text-muted")}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <span className="hidden w-20 text-right font-mono text-xs text-muted sm:block" aria-hidden>
          {display ? RATING_WORDS[display] : ""}
        </span>
        <div className="flex items-center gap-0.5" onMouseLeave={onLeave} role="radiogroup" aria-label={label}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`Rate ${label} ${star} star${star > 1 ? "s" : ""}`}
              onClick={() => onRate(star)}
              onMouseEnter={() => onHover(star)}
              onFocus={() => onHover(star)}
              onBlur={onLeave}
              className="rounded-md p-0.5 transition-transform duration-150 hover:scale-115 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Star
                size={emphasis ? 26 : 22}
                className={cn(
                  "transition-colors duration-150",
                  star <= display ? "text-star" : "text-line",
                )}
                fill="currentColor"
                strokeWidth={0}
              />
            </button>
          ))}
        </div>
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
      setClientError("Select an overall rating to continue.");
      return;
    }
    const missing = SUBCATEGORIES.find(({ key }) => ratings[key] === 0);
    if (missing) {
      e.preventDefault();
      setClientError(`Rate ${missing.label.toLowerCase()} to continue.`);
    }
  }

  if (state.success) {
    return (
      <Card className="flex flex-col items-center gap-3 border-ok/30 bg-ok-soft p-8 text-center">
        <CheckCircle2 size={36} className="text-ok" />
        <p className="font-display text-xl font-bold tracking-tight text-ink">Review published</p>
        <p className="text-sm text-muted">Your review is now live on this page.</p>
      </Card>
    );
  }

  const error = clientError || state.error;

  return (
    <Card className="p-6">
      <form action={action} onSubmit={validate} className="space-y-6">
        <input type="hidden" name="schoolId" value={schoolId} />
        <input type="hidden" name="path" value={pathname} />
        {Object.entries(ratings).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}

        {/* Ratings */}
        <fieldset>
          <legend className="mb-4 text-sm font-semibold text-ink">Ratings</legend>
          <div className="space-y-3">
            <StarPicker
              label="Overall"
              emphasis
              value={ratings.overall}
              hovered={hovered.overall}
              onRate={(v) => setRating("overall", v)}
              onHover={(v) => setHover("overall", v)}
              onLeave={() => clearHover("overall")}
            />
            <div className="space-y-2.5 border-t border-line pt-3">
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
        </fieldset>

        <Field label="Your review" htmlFor="review-body" hint={`Up to ${LIMITS.reviewBody.toLocaleString()} characters.`}>
          <Textarea
            id="review-body"
            name="body"
            rows={5}
            required
            maxLength={LIMITS.reviewBody}
            placeholder="What was training here actually like — instructors, aircraft availability, scheduling, cost?"
          />
        </Field>

        {error && (
          <Notice tone="error">
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
          </Notice>
        )}

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Publishing…" : "Publish review"}
        </Button>
      </form>
    </Card>
  );
}
