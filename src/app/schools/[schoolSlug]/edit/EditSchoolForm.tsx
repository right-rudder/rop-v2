"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FLEET_RANGES, LIMITS, type FlightSchool } from "@/lib/types";
import { SchoolContactsField } from "@/components/SchoolContactsField";
import { updateSchool } from "@/app/actions/schools";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormSection, choiceClass } from "@/components/ui/FormSection";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

type Props = {
  school: FlightSchool;
  cityName: string;
  stateName: string;
  programs: { slug: string; shortName: string }[];
  viewerIsAdmin: boolean;
  backHref: string;
};

export function EditSchoolForm({
  school,
  cityName,
  stateName,
  programs,
  viewerIsAdmin,
  backHref,
}: Props) {
  const [state, action, pending] = useActionState(updateSchool, {});

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="schoolId" value={school.id} />

      {state.success && (
        <Notice tone="ok">
          Changes saved.{" "}
          <Link href={backHref} className="font-semibold underline underline-offset-2">
            View listing
          </Link>
        </Notice>
      )}

      {/* Basic Info */}
      <FormSection title="Basic information">
        <Field label="School name" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            type="text"
            required
            maxLength={LIMITS.schoolName}
            defaultValue={school.name}
          />
        </Field>

        <Field label="Description" htmlFor="description" required>
          <Textarea
            id="description"
            name="description"
            rows={4}
            required
            maxLength={LIMITS.schoolDescription}
            defaultValue={school.description}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Website" htmlFor="website">
            <Input
              id="website"
              name="website"
              type="url"
              maxLength={LIMITS.website}
              defaultValue={school.website}
            />
          </Field>
          <Field label="Phone number" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              maxLength={LIMITS.phone}
              defaultValue={school.phone}
            />
          </Field>
        </div>

        {viewerIsAdmin && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              defaultChecked={school.featured ?? false}
              className={choiceClass}
            />
            Featured listing
          </label>
        )}
      </FormSection>

      {/* Location — read-only: changing it re-links catalog records */}
      <FormSection
        title="Location"
        description="Location changes re-link the listing to other records — contact the site team to move a school."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Airport code (ICAO)" htmlFor="airportCode">
            <Input
              id="airportCode"
              type="text"
              disabled
              defaultValue={school.primaryAirportCode}
              className="font-mono uppercase"
            />
          </Field>
          <Field label="City" htmlFor="city">
            <Input id="city" type="text" disabled defaultValue={cityName} />
          </Field>
          <Field label="State" htmlFor="state">
            <Input id="state" type="text" disabled defaultValue={stateName} />
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
                <input
                  type="radio"
                  name="faaPart"
                  value={part}
                  defaultChecked={school.faaPart === part}
                  className={choiceClass}
                />
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
                <input
                  type="checkbox"
                  name="programs"
                  value={program.slug}
                  defaultChecked={school.programSlugs.includes(program.slug)}
                  className={choiceClass}
                />
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
            <Select
              id="estimatedPlanes"
              name="estimatedPlanes"
              defaultValue={school.estimatedPlanes ?? ""}
            >
              <option value="">Select range…</option>
              {FLEET_RANGES.map((r) => (
                <option key={r} value={r}>{r} aircraft</option>
              ))}
            </Select>
          </Field>
          <Field label="Estimated number of instructors" htmlFor="estimatedInstructors">
            <Select
              id="estimatedInstructors"
              name="estimatedInstructors"
              defaultValue={school.estimatedInstructors ?? ""}
            >
              <option value="">Select range…</option>
              {FLEET_RANGES.map((r) => (
                <option key={r} value={r}>{r} instructors</option>
              ))}
            </Select>
          </Field>
        </div>
      </FormSection>

      {/* Contacts */}
      <SchoolContactsField initialContacts={school.contacts} />

      {state.error && <Notice tone="error">{state.error}</Notice>}

      {/* Actions */}
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
