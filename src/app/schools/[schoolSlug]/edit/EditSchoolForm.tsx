"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import type { FlightSchool } from "@/lib/types";
import { SchoolContactsField } from "@/components/SchoolContactsField";
import { updateSchool } from "@/app/actions/schools";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60 disabled:cursor-not-allowed";

const sectionClass =
  "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5";

const fleetRanges = ["1-3", "3-6", "6-9", "10-20", "20-30", "30-40", "40-50", "50+"] as const;

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
    <form action={action} className="space-y-10">
      <input type="hidden" name="schoolId" value={school.id} />

      {state.success && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3">
          <CheckCircle size={16} />
          <span>
            Changes saved.{" "}
            <Link href={backHref} className="font-semibold underline">
              View listing
            </Link>
          </span>
        </div>
      )}

      {/* Basic Info */}
      <div className={sectionClass}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Basic Information
        </h2>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            School Name <span className="text-rose-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={school.name}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Description <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            defaultValue={school.description}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              defaultValue={school.website}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={school.phone}
              className={inputClass}
            />
          </div>
        </div>

        {viewerIsAdmin && (
          <div className="flex items-center gap-3">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              defaultChecked={school.featured ?? false}
              className="accent-blue-700 w-4 h-4"
            />
            <label
              htmlFor="featured"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Featured listing
            </label>
          </div>
        )}
      </div>

      {/* Location — read-only: changing it re-links catalog records */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Location
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Location changes re-link the listing to other records — contact the
            site team to move a school.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="airportCode"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Airport Code (ICAO)
            </label>
            <input
              id="airportCode"
              type="text"
              disabled
              defaultValue={school.primaryAirportCode}
              className={`${inputClass} uppercase`}
            />
          </div>
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              City
            </label>
            <input
              id="city"
              type="text"
              disabled
              defaultValue={cityName}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              State
            </label>
            <input
              id="state"
              type="text"
              disabled
              defaultValue={stateName}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Training */}
      <div className={sectionClass}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Training &amp; Certification
        </h2>

        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            FAA Operating Authority
          </p>
          <div className="flex flex-wrap gap-4">
            {(["61", "141", "both"] as const).map((part) => (
              <label
                key={part}
                className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <input
                  type="radio"
                  name="faaPart"
                  value={part}
                  defaultChecked={school.faaPart === part}
                  className="accent-blue-700"
                />
                <span className="text-sm font-medium">
                  {part === "both" ? "Both Part 61 & 141" : `Part ${part}`}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Programs Offered
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {programs.map((program) => (
              <label
                key={program.slug}
                className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  name="programs"
                  value={program.slug}
                  defaultChecked={school.programSlugs.includes(program.slug)}
                  className="accent-blue-700 w-4 h-4"
                />
                <span className="text-sm">{program.shortName}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet */}
      <div className={sectionClass}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Fleet &amp; Instructors
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="estimatedPlanes"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Estimated Fleet Size
            </label>
            <select
              id="estimatedPlanes"
              name="estimatedPlanes"
              defaultValue={school.estimatedPlanes ?? ""}
              className={inputClass}
            >
              <option value="">Select range…</option>
              {fleetRanges.map((r) => (
                <option key={r} value={r}>{r} aircraft</option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="estimatedInstructors"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Estimated Number of Instructors
            </label>
            <select
              id="estimatedInstructors"
              name="estimatedInstructors"
              defaultValue={school.estimatedInstructors ?? ""}
              className={inputClass}
            >
              <option value="">Select range…</option>
              {fleetRanges.map((r) => (
                <option key={r} value={r}>{r} instructors</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <SchoolContactsField initialContacts={school.contacts} />

      {state.error && (
        <p className="text-sm text-rose-600 dark:text-rose-400 text-center">
          {state.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-lg rounded-xl transition"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
        <Link
          href={backHref}
          className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-lg rounded-xl transition text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
