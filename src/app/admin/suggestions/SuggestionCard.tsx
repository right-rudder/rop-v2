"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import type { SchoolSuggestion } from "@/lib/types";
import {
  SUGGESTION_LIMITS,
  suggestionFieldKind,
  suggestionFieldLabel,
  suggestionReasonLabel,
  suggestionValuesEqual,
  formatSuggestionValue,
  type SuggestionField,
} from "@/lib/suggestions";
import { approveSuggestion, rejectSuggestion } from "@/app/actions/suggestions";
import { useActionToast } from "@/components/ToastProvider";
import { SchoolContactsField } from "@/components/SchoolContactsField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

type TextField = Exclude<SuggestionField, "contacts">;

export function SuggestionCard({
  suggestion,
  schoolName,
  schoolHref,
  /** The listing has been deleted since filing; the record keeps its name. */
  listingGone,
  suggesterName,
  /** What the listing shows now, only when it differs from the snapshot taken at filing. */
  liveValue,
}: {
  suggestion: SchoolSuggestion;
  schoolName: string;
  schoolHref?: string;
  listingGone: boolean;
  suggesterName: string;
  liveValue?: string;
}) {
  const [approveState, approveAction, approvePending] = useActionState(approveSuggestion, {});
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectSuggestion, {});

  useActionToast(approveState, {
    ok: (s) => ({ title: "Suggestion applied", description: s.message }),
    errorTitle: "Couldn't apply suggestion",
  });
  useActionToast(rejectState, {
    ok: { title: "Suggestion declined" },
    errorTitle: "Couldn't decline suggestion",
  });

  const busy = approvePending || rejectPending;
  const error = approveState.error ?? rejectState.error;
  const message = approveState.message ?? rejectState.message;
  const date = new Date(suggestion.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { field } = suggestion;
  const kind = suggestionFieldKind(field);
  const label = suggestionFieldLabel(field);
  const editedOnApply =
    suggestion.appliedValue !== undefined &&
    !suggestionValuesEqual(suggestion.appliedValue, suggestion.proposedValue);

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            Suggested edit
            <Badge tone="accent">{label}</Badge>
            <Badge tone="neutral">{suggestionReasonLabel(suggestion.reason)}</Badge>
          </p>
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">
            {schoolHref ? (
              <Link href={schoolHref} className="hover:underline">
                {schoolName}
              </Link>
            ) : (
              schoolName
            )}
          </h3>
        </div>
        <time className="shrink-0 font-mono text-xs text-muted" dateTime={suggestion.createdAt}>
          {date}
        </time>
      </div>

      <p className="text-sm text-ink">
        <Link href={`/profile/${suggestion.userId}`} className="text-accent-ink hover:underline">
          {suggesterName}
        </Link>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <ValueBlock title="Currently listed" value={formatSuggestionValue(field, suggestion.currentValue)} muted />
        <ValueBlock title="Proposed" value={formatSuggestionValue(field, suggestion.proposedValue)} />
      </div>

      {liveValue !== undefined && (
        <Notice tone="info">
          The listing changed since this was suggested. It now shows:{" "}
          <span className="whitespace-pre-wrap font-semibold">{liveValue}</span>
        </Notice>
      )}

      {suggestion.note && (
        <p className="border-l-2 border-line pl-4 text-sm leading-relaxed text-ink/90">
          {suggestion.note}
        </p>
      )}

      {(error || message) && <Notice tone={error ? "error" : "ok"}>{error ?? message}</Notice>}

      {suggestion.status === "pending" && listingGone ? (
        <div className="space-y-4 pt-1">
          <Notice tone="info">This listing no longer exists, so there is nothing to apply.</Notice>
          <form action={rejectAction}>
            <input type="hidden" name="suggestionId" value={suggestion.id} />
            <Button type="submit" variant="secondary" full disabled={busy}>
              <X size={15} />
              {rejectPending ? "Declining…" : "Decline"}
            </Button>
          </form>
        </div>
      ) : suggestion.status === "pending" ? (
        <div className="space-y-4 pt-1">
          <form action={approveAction} className="space-y-4">
            <input type="hidden" name="suggestionId" value={suggestion.id} />
            {kind === "contacts" ? (
              <SchoolContactsField
                initialContacts={Array.isArray(suggestion.proposedValue) ? suggestion.proposedValue : []}
              />
            ) : (
              <Field label="Apply as (edit if needed)" htmlFor={`value-${suggestion.id}`}>
                {kind === "multiline" ? (
                  <Textarea
                    id={`value-${suggestion.id}`}
                    name="value"
                    required
                    maxLength={SUGGESTION_LIMITS[field as TextField]}
                    defaultValue={typeof suggestion.proposedValue === "string" ? suggestion.proposedValue : ""}
                  />
                ) : (
                  <Input
                    id={`value-${suggestion.id}`}
                    name="value"
                    type={kind === "url" ? "url" : "text"}
                    required
                    maxLength={SUGGESTION_LIMITS[field as TextField]}
                    defaultValue={typeof suggestion.proposedValue === "string" ? suggestion.proposedValue : ""}
                  />
                )}
              </Field>
            )}
            <Button type="submit" full disabled={busy}>
              <Check size={15} />
              {approvePending ? "Applying…" : "Approve & apply"}
            </Button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="suggestionId" value={suggestion.id} />
            <Button type="submit" variant="secondary" full disabled={busy}>
              <X size={15} />
              {rejectPending ? "Declining…" : "Decline"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-2">
          <Badge tone={suggestion.status === "approved" ? "ok" : "neutral"}>
            {suggestion.status === "approved" ? "Applied" : "Declined"}
          </Badge>
          {editedOnApply && suggestion.appliedValue !== undefined && (
            <ValueBlock
              title="Applied with edits"
              value={formatSuggestionValue(field, suggestion.appliedValue)}
            />
          )}
        </div>
      )}
    </Card>
  );
}

function ValueBlock({ title, value, muted }: { title: string; value: string; muted?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{title}</p>
      <p className={`whitespace-pre-wrap text-sm ${muted ? "text-muted" : "font-semibold text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
