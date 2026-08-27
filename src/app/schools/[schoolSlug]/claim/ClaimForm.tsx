"use client";

import { useActionState } from "react";
import { createClaim } from "@/app/actions/claims";
import { CLAIM_LIMITS } from "@/lib/claims";
import { useActionToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { Input, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

export function ClaimForm({
  schoolId,
  schoolName,
  backHref,
  defaultEmail,
}: {
  schoolId: string;
  schoolName: string;
  backHref: string;
  /** The viewer's account email, offered as a starting point. */
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState(createClaim, {});
  useActionToast(state, { errorTitle: "Couldn't submit claim" });

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="schoolId" value={schoolId} />

      {state.error && <Notice tone="error">{state.error}</Notice>}

      <FormSection
        title="Tell us who you are"
        description={`We check every claim by hand before handing over ${schoolName}.`}
      >
        <Field
          label="Your role at the school"
          htmlFor="roleTitle"
          hint="For example: Owner, Chief Flight Instructor, Office Manager."
          required
        >
          <Input
            id="roleTitle"
            name="roleTitle"
            type="text"
            required
            maxLength={CLAIM_LIMITS.roleTitle}
            placeholder="e.g. Chief Flight Instructor"
          />
        </Field>

        <Field
          label="Work email"
          htmlFor="workEmail"
          hint="An address at the school's own domain is the fastest way for us to verify you."
          required
        >
          <Input
            id="workEmail"
            name="workEmail"
            type="email"
            required
            maxLength={CLAIM_LIMITS.email}
            defaultValue={defaultEmail}
            placeholder="you@yourschool.com"
          />
        </Field>

        <Field
          label="Anything else we should know?"
          htmlFor="message"
          hint="Optional. Helpful if your email isn't on the school's domain."
        >
          <Textarea
            id="message"
            name="message"
            maxLength={CLAIM_LIMITS.message}
            placeholder="e.g. I've managed this school since 2019 — our website is currently being rebuilt."
          />
        </Field>
      </FormSection>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit claim"}
        </Button>
        <Button href={backHref} variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  );
}
