"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MapPin, Phone, Globe, Users, Plane, Check, X } from "lucide-react";
import type { SchoolSubmission } from "@/lib/types";
import { approveSubmission, rejectSubmission } from "@/app/actions/admin";
import { useActionToast } from "@/components/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";

export function SubmissionCard({
  submission,
  programShortNames,
}: {
  submission: SchoolSubmission;
  programShortNames: Record<string, string>;
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveSubmission,
    {},
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectSubmission,
    {},
  );

  useActionToast(approveState, {
    ok: (s) => ({ title: "Submission approved", description: s.message }),
    errorTitle: "Couldn't approve submission",
  });
  useActionToast(rejectState, {
    ok: { title: "Submission rejected" },
    errorTitle: "Couldn't reject submission",
  });

  const busy = approvePending || rejectPending;
  const error = approveState.error ?? rejectState.error;
  const message = approveState.message ?? rejectState.message;
  const date = new Date(submission.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <Card className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            <span className="font-semibold text-sky">{submission.airportCode.toUpperCase()}</span>
            {" · "}
            <MapPin size={11} className="inline -mt-0.5" aria-hidden /> {submission.city},{" "}
            {submission.state}
          </p>
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">
            {submission.name}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <time className="font-mono text-xs text-muted" dateTime={submission.createdAt}>
            {date}
          </time>
          {submission.faaPart && (
            <Badge>Part {submission.faaPart === "both" ? "61 / 141" : submission.faaPart}</Badge>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-ink/90">{submission.description}</p>

      {/* Details */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
        {submission.website && (
          <span className="flex items-center gap-1">
            <Globe size={12} />
            <a
              href={submission.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-ink hover:underline"
            >
              {submission.website.replace(/^https?:\/\//, "")}
            </a>
          </span>
        )}
        {submission.phone && (
          <span className="flex items-center gap-1">
            <Phone size={12} />
            {submission.phone}
          </span>
        )}
        {submission.estimatedPlanes && (
          <span className="flex items-center gap-1">
            <Plane size={12} />
            {submission.estimatedPlanes} aircraft
          </span>
        )}
        {submission.estimatedInstructors && (
          <span className="flex items-center gap-1">
            <Users size={12} />
            {submission.estimatedInstructors} instructors
          </span>
        )}
        <Link href={`/profile/${submission.submittedBy}`} className="text-accent-ink hover:underline">
          Submitter profile
        </Link>
      </div>

      {/* Programs */}
      {submission.programs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {submission.programs.map((slug) => (
            <span
              key={slug}
              className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-ink"
            >
              {programShortNames[slug] ?? slug}
            </span>
          ))}
        </div>
      )}

      {/* Contacts */}
      {submission.contacts.length > 0 && (
        <div className="space-y-0.5 text-xs text-muted">
          {submission.contacts.map((c, i) => (
            <p key={`${i}-${c.email}`}>
              {[c.name, c.title, c.phone, c.email].filter(Boolean).join(" · ")}
            </p>
          ))}
        </div>
      )}

      {(error || message) && (
        <Notice tone={error ? "error" : "ok"}>{error ?? message}</Notice>
      )}

      {/* Actions */}
      {submission.status === "pending" ? (
        <div className="flex gap-3 pt-1">
          <form action={approveAction} className="flex-1">
            <input type="hidden" name="submissionId" value={submission.id} />
            <Button type="submit" full disabled={busy}>
              <Check size={15} />
              {approvePending ? "Approving…" : "Approve & publish"}
            </Button>
          </form>
          <form action={rejectAction} className="flex-1">
            <input type="hidden" name="submissionId" value={submission.id} />
            <Button type="submit" variant="secondary" full disabled={busy}>
              <X size={15} />
              {rejectPending ? "Rejecting…" : "Reject"}
            </Button>
          </form>
        </div>
      ) : (
        <Badge tone={submission.status === "approved" ? "ok" : "neutral"}>
          {submission.status === "approved" ? "Approved" : "Rejected"}
        </Badge>
      )}
    </Card>
  );
}
