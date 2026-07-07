import type { Metadata } from "next";
import Link from "next/link";
import { Plane, ChevronRight } from "lucide-react";
import { trainerAircraft } from "@/lib/mock-data";
import type { AircraftCategory } from "@/lib/types";
import { Suspense } from "react";
import AircraftFilterBar from "@/components/AircraftFilterBar";

export const metadata: Metadata = {
  title: "Trainer Aircraft – Common Flight Training Aircraft",
  description:
    "Browse single-engine trainers, multi-engine aircraft, helicopters, and sport planes used at U.S. flight schools — specs, descriptions, and schools that fly each type.",
  alternates: { canonical: "/aircraft" },
  openGraph: {
    title: "Trainer Aircraft – Common Flight Training Aircraft",
    description:
      "Browse trainer aircraft used at U.S. flight schools — specs and schools that fly each type.",
    url: "/aircraft",
    type: "website",
  },
};

const categoryLabels: Record<AircraftCategory, string> = {
  "single-engine": "Single-Engine",
  "multi-engine": "Multi-Engine",
  helicopter: "Helicopter",
  glider: "Glider",
  sport: "Sport / LSA",
};

const categoryOrder: AircraftCategory[] = [
  "single-engine",
  "multi-engine",
  "helicopter",
  "sport",
  "glider",
];

const sorted = [...trainerAircraft].sort((a, b) => a.sortOrder - b.sortOrder);

const grouped = categoryOrder
  .map((cat) => ({
    category: cat,
    label: categoryLabels[cat],
    aircraft: sorted.filter((a) => a.category === cat),
  }))
  .filter((g) => g.aircraft.length > 0);

export default async function AircraftPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = category as AircraftCategory | undefined;

  const visibleGroups = activeCategory
    ? grouped.filter((g) => g.category === activeCategory)
    : grouped;

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <Plane size={15} />
            Trainer Aircraft
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Common Flight Training Aircraft
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            From the Cessna 172 to the Piper Seminole — specs, descriptions, and flight
            schools near you that fly each aircraft.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Suspense>
          <AircraftFilterBar />
        </Suspense>
      </div>

      {/* Aircraft grouped by category */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {visibleGroups.map(({ category, label, aircraft }) => (
          <section key={category}>
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest text-xs mb-4">
              {label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aircraft.map((ac) => (
                <Link
                  key={ac.slug}
                  href={`/aircraft/${ac.slug}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{ac.make}</p>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition">
                        {ac.displayName}
                      </h3>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-slate-400 group-hover:text-blue-500 shrink-0 mt-1 transition"
                    />
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {ac.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-0.5">
                      <Plane size={11} />
                      {ac.engineCount === 1 ? "Single engine" : `${ac.engineCount} engines`}
                    </span>
                    {ac.typicalCruise && (
                      <span className="inline-flex items-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-0.5">
                        {ac.typicalCruise}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
