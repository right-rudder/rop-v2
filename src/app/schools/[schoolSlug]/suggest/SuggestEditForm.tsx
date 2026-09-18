"use client";

import { useActionState, useState } from "react";
import { createSuggestion } from "@/app/actions/suggestions";
import {
  SUGGESTION_FIELDS,
  SUGGESTION_REASONS,
  SUGGESTION_LIMITS,
  suggestionFieldKind,
  formatSuggestionValue,
  type SuggestionField,
  type SuggestionReason,
} from "@/lib/suggestions";
import type { ContactPerson } from "@/lib/types";
import { useActionToast } from "@/components/ToastProvider";
import { SchoolContactsField } from "@/components/SchoolContactsField";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

type CurrentValues = {
  phone: string;
  website: string;
  address: string;
  hours: string;
  contacts: ContactPerson[];
};

type TextField = Exclude<SuggestionField, "contacts">;

export function SuggestEditForm({
  schoolId,
  schoolName,
  backHref,
  defaultField,
  pendingFields,
  current,
}: {
  schoolId: string;
  schoolName: string;
  backHref: string;
  defaultField: SuggestionField;
  /** Fields this member already has a suggestion pending on. */
  pendingFields: SuggestionField[];
  /** What the listing shows right now, for the "currently listed" box. */
  current: CurrentValues;
}) {
  const [state, action, pending] = useActionState(createSuggestion, {});
  useActionToast(state, { errorTitle: "Couldn't submit suggestion" });

  const [field, setField] = useState<SuggestionField>(defaultField);
  const [reason, setReason] = useState<SuggestionReason | "">("");
  const kind = suggestionFieldKind(field);
  const noteRequired = reason === "other";

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="schoolId" value={schoolId} />

      {state.error && <Notice tone="error">{state.error}</Notice>}

      <FormSection
        title="What needs correcting?"
        description={`Every suggestion is checked by hand before it changes ${schoolName}.`}
      >
        <Field label="Field" htmlFor="field" required>
          <Select
            id="field"
            name="field"
            value={field}
            onChange={(e) => setField(e.target.value as SuggestionField)}
          >
            {SUGGESTION_FIELDS.map((f) => {
              const busy = pendingFields.includes(f.key);
              return (
                <option key={f.key} value={f.key} disabled={busy}>
                  {f.label}
                  {busy ? " (pending review)" : ""}
                </option>
              );
            })}
          </Select>
        </Field>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-ink">Currently listed</p>
          <pre className="whitespace-pre-wrap rounded-xl border border-line bg-paper/60 px-4 py-3 font-sans text-sm text-muted">
            {formatSuggestionValue(field, current[field])}
          </pre>
        </div>

        {kind === "contacts" ? null : (
          <Field label={`Correct ${labelFor(field).toLowerCase()}`} htmlFor="value" required>
            {kind === "multiline" ? (
              <Textarea
                key={field}
                id="value"
                name="value"
                required
                maxLength={SUGGESTION_LIMITS[field as TextField]}
                defaultValue={current[field as TextField]}
                placeholder="e.g. Mon–Fri 8am–6pm, Sat 9am–2pm"
              />
            ) : (
              <Input
                key={field}
                id="value"
                name="value"
                type={kind === "url" ? "url" : field === "phone" ? "tel" : "text"}
                required
                maxLength={SUGGESTION_LIMITS[field as TextField]}
                defaultValue={current[field as TextField]}
                placeholder={kind === "url" ? "https://yourschool.com" : undefined}
              />
            )}
          </Field>
        )}
      </FormSection>

      {kind === "contacts" && <SchoolContactsField initialContacts={current.contacts} />}

      <FormSection title="Why?" description="Helps us verify the change quickly.">
        <Field label="What's wrong with it?" htmlFor="reason" required>
          <Select
            id="reason"
            name="reason"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value as SuggestionReason | "")}
          >
            <option value="">Choose a reason</option>
            {SUGGESTION_REASONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Details"
          htmlFor="note"
          hint="A source helps: the school's website, a recent visit, a call."
          required={noteRequired}
        >
          <Textarea
            id="note"
            name="note"
            required={noteRequired}
            maxLength={SUGGESTION_LIMITS.note}
            placeholder="e.g. Called last week — this number now reaches a pizza place."
          />
        </Field>
      </FormSection>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit suggestion"}
        </Button>
        <Button href={backHref} variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function labelFor(field: SuggestionField): string {
  return SUGGESTION_FIELDS.find((f) => f.key === field)!.label;
}
