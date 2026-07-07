import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { getAirportByCode, getCityBySlug, getStateBySlug } from "@/lib/mock-data";

type Props = { params: Promise<{ airportCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airportCode } = await params;
  const airport = getAirportByCode(airportCode);
  return {
    title: airport
      ? `Edit ${airport.icao} – ${airport.name} – Flight School Finder`
      : "Edit Airport – Flight School Finder",
    robots: { index: false },
  };
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600";

const sectionClass =
  "bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5";

export default async function EditAirportPage({ params }: Props) {
  const { airportCode } = await params;
  const airport = getAirportByCode(airportCode);
  if (!airport) notFound();

  const city = getCityBySlug(airport.citySlug);
  const state = getStateBySlug(airport.stateSlug);

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Pencil className="w-10 h-10 text-blue-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Edit Airport
          </h1>
          <p className="text-blue-200 text-lg">
            Editing{" "}
            <span className="font-semibold text-white">
              {airport.icao} – {airport.name}
            </span>
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <form className="space-y-10">

          {/* Identifiers */}
          <div className={sectionClass}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Airport Identifiers
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                ICAO is used as the canonical URL slug. IATA and FAA LID are
                optional alternate identifiers.
              </p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Airport Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="name"
                type="text"
                defaultValue={airport.name}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="icao"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  ICAO Code <span className="text-rose-600">*</span>
                </label>
                <input
                  id="icao"
                  type="text"
                  defaultValue={airport.icao}
                  maxLength={4}
                  className={`${inputClass} uppercase`}
                />
                <p className="text-xs text-slate-400 mt-1">4-letter code</p>
              </div>
              <div>
                <label
                  htmlFor="iata"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  IATA Code
                </label>
                <input
                  id="iata"
                  type="text"
                  defaultValue={airport.iata ?? ""}
                  maxLength={3}
                  className={`${inputClass} uppercase`}
                />
                <p className="text-xs text-slate-400 mt-1">3-letter code</p>
              </div>
              <div>
                <label
                  htmlFor="faaLid"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  FAA LID
                </label>
                <input
                  id="faaLid"
                  type="text"
                  defaultValue={airport.faaLid ?? ""}
                  maxLength={5}
                  className={`${inputClass} uppercase`}
                />
                <p className="text-xs text-slate-400 mt-1">Local identifier</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  defaultValue={city?.name ?? airport.citySlug}
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
                  defaultValue={state?.name ?? airport.stateSlug}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={sectionClass}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Description
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Shown on the airport detail page. Brief overview of the airport,
                its history, or what makes it notable for flight training.
              </p>
            </div>

            <textarea
              id="description"
              rows={5}
              defaultValue={airport.description ?? ""}
              placeholder="e.g. Falcon Field Airport is a public general aviation airport located in Mesa, Arizona…"
              className={`${inputClass} resize-none`}
            />
          </div>

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
