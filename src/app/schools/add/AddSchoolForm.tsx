"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { FLEET_RANGES, LIMITS } from "@/lib/types";
import { SchoolContactsField } from "@/components/SchoolContactsField";
import { submitSchool } from "@/app/actions/schools";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FormSection, choiceClass } from "@/components/ui/FormSection";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

export function AddSchoolForm({
  programs,
}: {
  programs: { slug: string; shortName: string }[];
}) {
  const [state, action, pending] = useActionState(submitSchool, {});

  if (state.success) {
    return (
      <Card className="flex flex-col items-center gap-3 border-ok/30 bg-ok-soft p-10 text-center">
        <CheckCircle2 size={40} className="text-ok" />
        <p className="font-display text-2xl font-bold tracking-tight text-ink">
          Submitted for review
        </p>
        <p className="max-w-md text-sm text-muted">
          Our team will review your listing and email you once it&apos;s approved and
          published.
        </p>
      </Card>
    );
  }

  return (
    <form action={action} className="space-y-8">
      {/* Basic Info */}
      <FormSection title="Basic information">
        <Field label="School name" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            type="text"
            required
            maxLength={LIMITS.schoolName}
            placeholder="e.g. Skyline Aviation Academy"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          required
          hint="Your training philosophy, fleet, and what makes you stand out."
        >
          <Textarea
            id="description"
            name="description"
            rows={4}
            required
            maxLength={LIMITS.schoolDescription}
            placeholder="Describe your school…"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Website" htmlFor="website">
            <Input
              id="website"
              name="website"
              type="url"
              maxLength={LIMITS.website}
              placeholder="https://yourschool.com"
            />
          </Field>
          <Field label="Phone number" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              maxLength={LIMITS.phone}
              placeholder="(555) 000-0000"
            />
          </Field>
        </div>
      </FormSection>

      {/* Location */}
      <FormSection
        title="Location"
        description="Enter the primary airport where your school operates."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Airport code (ICAO)" htmlFor="airportCode" required>
            <Input
              id="airportCode"
              name="airportCode"
              type="text"
              required
              placeholder="e.g. KFFZ"
              maxLength={4}
              className="font-mono uppercase placeholder:font-sans placeholder:normal-case"
            />
          </Field>
          <Field label="City" htmlFor="city" required>
            <Input id="city" name="city" type="text" required placeholder="e.g. Mesa" />
          </Field>
          <Field label="State" htmlFor="state" required>
            <Input id="state" name="state" type="text" required placeholder="e.g. Arizona" />
          </Field>
        </div>
      </FormSection>

      {/* Training */}
      <FormSection title="Training &amp; certification">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">FAA operating authority</legend>
          <div className="flex flex-wrap gap-5">
            {(["61", "141", "both"] as const).map((part) => (
              <label key={part} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="radio" name="faaPart" value={part} className={choiceClass} />
                {part === "both" ? "Both Part 61 & 141" : `Part ${part}`}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Programs offered</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {programs.map((program) => (
              <label
                key={program.slug}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
              >
                <input type="checkbox" name="programs" value={program.slug} className={choiceClass} />
                {program.shortName}
              </label>
            ))}
          </div>
        </fieldset>
      </FormSection>

      {/* Fleet */}
      <FormSection title="Fleet &amp; instructors">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Estimated fleet size" htmlFor="estimatedPlanes">
            <Select id="estimatedPlanes" name="estimatedPlanes" defaultValue="">
              <option value="">Select range…</option>
              {FLEET_RANGES.map((r) => (
                <option key={r} value={r}>{r} aircraft</option>
              ))}
            </Select>
          </Field>
          <Field label="Estimated number of instructors" htmlFor="estimatedInstructors">
            <Select id="estimatedInstructors" name="estimatedInstructors" defaultValue="">
              <option value="">Select range…</option>
              {FLEET_RANGES.map((r) => (
                <option key={r} value={r}>{r} instructors</option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      {/* Contacts — client component for dynamic add/remove */}
      <SchoolContactsField />

      {state.error && (
        <Notice tone="error">
          {state.error}
          {state.error.includes("logged in") && (
            <>
              {" "}
              <Link href="/login?next=/schools/add" className="font-semibold underline underline-offset-2">
                Log in
              </Link>
            </>
          )}
        </Notice>
      )}

      <div className="space-y-3">
        <Button type="submit" size="lg" full disabled={pending}>
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
        <p className="text-center text-xs text-muted">
          Submissions are reviewed by our team before going live. You&apos;ll receive an email
          once your listing is approved.
        </p>
      </div>
    </form>
  );
}
