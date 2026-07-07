import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import { programs } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Flight Training Programs – Certificates, Ratings & Endorsements",
  description:
    "Browse every FAA pilot certificate, rating, and endorsement offered by U.S. flight schools — from Private Pilot through ATP, plus add-on ratings and specialty endorsements.",
  alternates: { canonical: "/programs" },
  openGraph: {
    title: "Flight Training Programs – Certificates, Ratings & Endorsements",
    description:
      "Browse every FAA pilot certificate, rating, and endorsement offered by U.S. flight schools.",
    url: "/programs",
    type: "website",
  },
};

const sorted = [...programs].sort((a, b) => a.sortOrder - b.sortOrder);

export default function ProgramsPage() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <BookOpen size={15} />
            Flight Training Programs
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Certificates, Ratings &amp; Endorsements
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Every FAA pilot certificate, rating, and endorsement offered at U.S.
            flight schools — with requirements, timelines, and schools near you.
          </p>
        </div>
      </section>

      {/* Programs grid */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map((program) => (
            <Link
              key={program.slug}
              href={`/programs/${program.slug}`}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition leading-snug">
                  {program.name}
                </h2>
                <ChevronRight
                  size={18}
                  className="text-slate-400 group-hover:text-blue-500 shrink-0 mt-0.5 transition"
                />
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {program.description}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                {program.minimumHours && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-0.5">
                    {program.minimumHours}+ hrs min.
                  </span>
                )}
                {program.typicalDuration && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-0.5">
                    <Clock size={11} />
                    {program.typicalDuration}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
