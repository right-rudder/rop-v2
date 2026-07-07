import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import {
  getSchoolBySlug,
  getCityBySlug,
  getStateBySlug,
  programs,
} from "@/lib/mock-data";
import { SchoolContactsField } from "@/components/SchoolContactsField";

type Props = { params: Promise<{ schoolSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  const school = getSchoolBySlug(schoolSlug);
  return {
    title: school
      ? `Edit ${school.name} – Flight School Finder`
      : "Edit School – Flight School Finder",
    robots: { index: false },
  };
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600";

const sectionClass =
  "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5";

const fleetRanges = ["1-3", "3-6", "6-9", "10-20", "20-30", "30-40", "40-50", "50+"] as const;

export default async function EditSchoolPage({ params }: Props) {
  const { schoolSlug } = await params;
  const school = getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const city = getCityBySlug(school.citySlug);
  const state = getStateBySlug(school.stateSlug);
  const sortedPrograms = [...programs].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Pencil className="w-10 h-10 text-blue-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Edit Flight School
          </h1>
          <p className="text-blue-200 text-lg">
            Editing{" "}
            <span className="font-semibold text-white">{school.name}</span>
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <form className="space-y-10">

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
                type="text"
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
                rows={4}
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
                  type="tel"
                  defaultValue={school.phone}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="featured"
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
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Location
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Primary airport where this school operates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="airportCode"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Airport Code (ICAO) <span className="text-rose-600">*</span>
                </label>
                <input
                  id="airportCode"
                  type="text"
                  defaultValue={school.primaryAirportCode}
                  maxLength={4}
                  className={`${inputClass} uppercase`}
                />
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  City <span className="text-rose-600">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  defaultValue={city?.name ?? school.citySlug}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  State <span className="text-rose-600">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  defaultValue={state?.name ?? school.stateSlug}
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
                {sortedPrograms.map((program) => (
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-lg rounded-xl transition"
            >
              Save Changes
            </button>
            <button
              type="button"
              className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-lg rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
