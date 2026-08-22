"use client";

import { useActionState } from "react";
import { LIMITS, type User } from "@/lib/types";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormSection, choiceClass } from "@/components/ui/FormSection";
import { Input, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

type Props = {
  user: User;
  programs: { slug: string; shortName: string }[];
  backHref: string;
};

export function EditProfileForm({ user, programs, backHref }: Props) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const held = new Set(user.pilotCertificates ?? []);

  return (
    <form action={action} className="space-y-8">
      <FormSection title="About you">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              maxLength={LIMITS.personName}
              defaultValue={user.firstName}
            />
          </Field>
          <Field label="Last name" htmlFor="lastName" required>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              maxLength={LIMITS.personName}
              defaultValue={user.lastName}
            />
          </Field>
        </div>

        <Field
          label="Bio"
          htmlFor="bio"
          hint={`A few lines about your flying — up to ${LIMITS.bio.toLocaleString()} characters.`}
        >
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={LIMITS.bio}
            defaultValue={user.bio ?? ""}
            placeholder="Student pilot working toward my private certificate…"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Certificates &amp; ratings"
        description="Shown as tags on your profile. Tick what you currently hold."
      >
        <fieldset>
          <legend className="sr-only">Certificates and ratings you hold</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {programs.map((program) => (
              <label
                key={program.slug}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  name="pilotCertificates"
                  value={program.slug}
                  defaultChecked={held.has(program.slug)}
                  className={choiceClass}
                />
                {program.shortName}
              </label>
            ))}
          </div>
        </fieldset>
      </FormSection>

      {state.error && <Notice tone="error">{state.error}</Notice>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={pending} className="sm:flex-1">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button href={backHref} variant="secondary" size="lg" className="sm:flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
