import type { Metadata } from "next";
import { PlaneTakeoff } from "lucide-react";
import { SchoolContactsField } from "@/components/SchoolContactsField";

export const metadata: Metadata = {
  title: "Add a Flight School – Flight School Finder",
  description:
    "Submit your flight school to be listed on Flight School Finder. Reach students searching for flight training near them.",
};

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600";

const sectionClass =
  "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5";

export default function AddSchoolPage() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <PlaneTakeoff className="w-12 h-12 text-blue-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Add Your Flight School
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">
            List your school for free and connect with students searching for
            flight training in your area.
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
                placeholder="e.g. Skyline Aviation Academy"
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
                placeholder="Describe your school, training philosophy, and what makes you stand out…"
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
                  placeholder="https://yourschool.com"
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
                  placeholder="(555) 000-0000"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Location
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter the primary airport where your school operates.
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
                  placeholder="e.g. KFFZ"
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
                  placeholder="e.g. Mesa"
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
                  placeholder="e.g. Arizona"
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
                {[
                  "Private Pilot",
                  "Instrument Rating",
                  "Commercial Pilot",
                  "CFI",
                  "CFII",
                  "Multi-Engine Rating",
                  "ATP",
                  "Sport Pilot",
                  "Discovery Flights",
                  "Ground School",
                ].map((program) => (
                  <label
                    key={program}
                    className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      name="programs"
                      value={program}
                      className="accent-blue-700 w-4 h-4"
                    />
                    <span className="text-sm">{program}</span>
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
                  className={inputClass}
                >
                  <option value="">Select range…</option>
                  {["1-3", "3-6", "6-9", "10-20", "20-30", "30-40", "40-50", "50+"].map((r) => (
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
                  className={inputClass}
                >
                  <option value="">Select range…</option>
                  {["1-3", "3-6", "6-9", "10-20", "20-30", "30-40", "40-50", "50+"].map((r) => (
                    <option key={r} value={r}>{r} instructors</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contacts — client component for dynamic add/remove */}
          <SchoolContactsField />

          {/* Notice */}
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Submissions are reviewed by our team before going live. You&apos;ll
            receive an email once your listing is approved.
          </p>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-lg rounded-xl transition"
          >
            Submit for Review
          </button>
        </form>
      </section>
    </div>
  );
}
