import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Plane } from "lucide-react";
import {
  trainerAircraft,
  getAircraftBySlug,
  getSchoolsByAircraftSlug,
  getProgramBySlug,
  getCityBySlug,
  getStateBySlug,
  getAirportByCode,
} from "@/lib/mock-data";
import type { AircraftCategory } from "@/lib/types";
import { SchoolsExplorer } from "@/components/SchoolsExplorer";
import { schoolHref } from "@/lib/utils";

type Props = { params: Promise<{ aircraftSlug: string }> };

const categoryLabels: Record<AircraftCategory, string> = {
  "single-engine": "Single-Engine",
  "multi-engine": "Multi-Engine",
  helicopter: "Helicopter",
  glider: "Glider",
  sport: "Sport / LSA",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { aircraftSlug } = await params;
  const aircraft = getAircraftBySlug(aircraftSlug);
  if (!aircraft) return { title: "Aircraft Not Found" };

  const title = `${aircraft.displayName} – Flight Training Aircraft`;
  const description = aircraft.description.slice(0, 160);
  const canonical = `/aircraft/${aircraftSlug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export function generateStaticParams() {
  return trainerAircraft.map((a) => ({ aircraftSlug: a.slug }));
}

export default async function AircraftDetailPage({ params }: Props) {
  const { aircraftSlug } = await params;
  const aircraft = getAircraftBySlug(aircraftSlug);
  if (!aircraft) notFound();

  const rawSchools = getSchoolsByAircraftSlug(aircraft.slug);
  const schools = rawSchools.map((school) => {
    const city = getCityBySlug(school.citySlug);
    const state = getStateBySlug(school.stateSlug);
    const airport = getAirportByCode(school.primaryAirportCode);
    return {
      id: school.id,
      name: school.name,
      href: schoolHref(school),
      airportCode: school.primaryAirportCode,
      airportName: airport?.name,
      location: city && state ? `${city.name}, ${state.abbreviation}` : undefined,
      rating: school.rating,
    };
  });
  const commonUsePrograms = aircraft.commonUse
    .map((slug) => getProgramBySlug(slug))
    .filter(Boolean);

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/aircraft"
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white text-sm transition mb-4 pr-10"
          >
            <ChevronLeft size={16} />
            All Aircraft
          </Link>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-sm mb-4">
            <Plane size={14} />
            {categoryLabels[aircraft.category]}
          </div>

          <p className="text-slate-400 text-sm font-medium mb-1">{aircraft.make}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            {aircraft.displayName}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Plane size={15} className="text-blue-300" />
              {aircraft.engineCount === 1 ? "Single engine" : `${aircraft.engineCount} engines`}
            </span>
            {aircraft.typicalCruise && (
              <span className="flex items-center gap-1.5">
                <Plane size={15} className="text-blue-300" />
                Cruise: {aircraft.typicalCruise}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* About */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
            About the {aircraft.displayName}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {aircraft.description}
          </p>
        </section>

        {/* Specs */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Specifications
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            <div className="px-5 py-4 flex items-start gap-3">
              <Plane size={17} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Category</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {categoryLabels[aircraft.category]}
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-start gap-3">
              <Plane size={17} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Engines</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {aircraft.engineCount === 1 ? "Single engine" : `${aircraft.engineCount} engines`}
                </p>
              </div>
            </div>
            {aircraft.typicalCruise && (
              <div className="px-5 py-4 flex items-start gap-3">
                <Plane size={17} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Typical Cruise Speed</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{aircraft.typicalCruise}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Commonly used for */}
        {commonUsePrograms.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Commonly Used For
            </h2>
            <div className="flex flex-wrap gap-2">
              {commonUsePrograms.map((program) => program && (
                <Link
                  key={program.slug}
                  href={`/programs/${program.slug}`}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 transition"
                >
                  {program.shortName}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Schools with this aircraft */}
        <SchoolsExplorer
          schools={schools}
          heading={`Schools Flying the ${aircraft.displayName}`}
        />
      </div>
    </div>
  );
}
