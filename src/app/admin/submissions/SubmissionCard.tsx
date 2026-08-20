"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MapPin, Phone, Globe, Users, Plane, Check, X } from "lucide-react";
import type { SchoolSubmission } from "@/lib/types";
import { approveSubmission, rejectSubmission } from "@/app/actions/admin";

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

  const busy = approvePending || rejectPending;
  const error = approveState.error ?? rejectState.error;
  const message = approveState.message ?? rejectState.message;
  const date = new Date(submission.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {submission.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <MapPin size={13} />
            {submission.city}, {submission.state}
            <span className="font-mono text-blue-700 dark:text-blue-400 ml-1">
              {submission.airportCode.toUpperCase()}
            </span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 block">{date}</span>
          {submission.faaPart && (
            <span className="inline-block mt-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5">
              Part {submission.faaPart === "both" ? "61 / 141" : submission.faaPart}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {submission.description}
      </p>

      {/* Details */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        {submission.website && (
          <span className="flex items-center gap-1">
            <Globe size={12} />
            <a
              href={submission.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 dark:text-blue-400 hover:underline"
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
        <Link
          href={`/profile/${submission.submittedBy}`}
          className="text-blue-700 dark:text-blue-400 hover:underline"
        >
          Submitter profile
        </Link>
      </div>

      {/* Programs */}
      {submission.programs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {submission.programs.map((slug) => (
            <span
              key={slug}
              className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2 py-0.5"
            >
              {programShortNames[slug] ?? slug}
            </span>
          ))}
        </div>
      )}

      {/* Contacts */}
      {submission.contacts.length > 0 && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {submission.contacts.map((c, i) => (
            <p key={`${i}-${c.email}`}>
              {[c.name, c.title, c.phone, c.email].filter(Boolean).join(" · ")}
            </p>
          ))}
        </div>
      )}

      {(error || message) && (
        <p
          className={`text-sm ${
            error
              ? "text-rose-600 dark:text-rose-400"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          {error ?? message}
        </p>
      )}

      {/* Actions */}
      {submission.status === "pending" ? (
        <div className="flex gap-3 pt-1">
          <form action={approveAction} className="flex-1">
            <input type="hidden" name="submissionId" value={submission.id} />
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition"
            >
              <Check size={15} />
              {approvePending ? "Approving…" : "Approve & publish"}
            </button>
          </form>
          <form action={rejectAction} className="flex-1">
            <input type="hidden" name="submissionId" value={submission.id} />
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-60 text-slate-800 dark:text-white font-semibold rounded-lg text-sm transition"
            >
              <X size={15} />
              {rejectPending ? "Rejecting…" : "Reject"}
            </button>
          </form>
        </div>
      ) : (
        <p
          className={`text-sm font-semibold ${
            submission.status === "approved"
              ? "text-green-700 dark:text-green-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {submission.status === "approved" ? "Approved" : "Rejected"}
        </p>
      )}
    </div>
  );
}
