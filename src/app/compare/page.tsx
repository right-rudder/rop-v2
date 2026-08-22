import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import {
  getSchoolsByIds,
  getPrograms,
  getTrainerAircraft,
  getLocationMaps,
} from "@/lib/data";
import { parseCompareIds, formatCompareHref, type ComparePick } from "@/lib/compare";
import { schoolHref } from "@/lib/utils";
import { PageHero } from "@/components/PageHero";
import { CompareSync } from "@/components/CompareSync";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Notice } from "@/components/ui/Notice";
import { Stars } from "@/components/ui/Stars";
import type { FlightSchool } from "@/lib/types";

export const metadata: Metadata = {
  title: "Compare schools",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ ids?: string }> };

const faaLabel = (part: FlightSchool["faaPart"]) =>
  part === "both" ? "Part 61 & 141" : part ? `Part ${part}` : null;

const th = "sticky left-0 z-10 bg-paper px-4 py-3 text-left align-top text-xs font-semibold uppercase tracking-[0.12em] text-muted";
const td = "border-t border-line px-4 py-3 align-top";
const dash = <span className="text-muted">—</span>;

export default async function ComparePage({ searchParams }: Props) {
  const { ids: param } = await searchParams;
  const ids = parseCompareIds(param);
  const [byId, programs, aircraft, { cityNameBySlug, stateBySlug }] = await Promise.all([
    getSchoolsByIds(ids),
    getPrograms(),
    getTrainerAircraft(),
    getLocationMaps(),
  ]);
  const schools = ids.flatMap((id) => (byId[id] ? [byId[id]] : []));

  const locationOf = (s: FlightSchool) =>
    `${cityNameBySlug[s.citySlug] ?? s.citySlug}, ${stateBySlug[s.stateSlug]?.abbreviation ?? s.stateSlug.toUpperCase()}`;

  if (schools.length < 2) {
    return (
      <div className="pb-20">
        <PageHero size="narrow" eyebrow="Compare" title="Compare schools" description="See up to four schools side by side." />
        <Container size="narrow" className="py-12">
          <Notice tone="info">
            Pick at least two schools to compare — use the compare button on any school card.
          </Notice>
          <Button href="/search" className="mt-6">
            Search schools
          </Button>
        </Container>
      </div>
    );
  }

  const picks: ComparePick[] = schools.map((s) => ({ id: s.id, name: s.name, href: schoolHref(s) }));
  const programRows = programs.filter((p) => schools.some((s) => s.programSlugs.includes(p.slug)));
  const aircraftRows = aircraft.filter((a) => schools.some((s) => (s.aircraftSlugs ?? []).includes(a.slug)));
  const check = <span className="font-semibold text-accent-ink">✓</span>;

  return (
    <div className="pb-20">
      <CompareSync picks={picks} />
      <PageHero
        size="narrow"
        eyebrow={`${schools.length} schools`}
        title="Compare schools"
        description="Programs, fleet, ratings and contact details side by side."
      />
      <Container className="py-12">
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[48rem] border-separate border-spacing-0 text-sm text-ink">
            <thead>
              <tr>
                <th className={th} scope="col">
                  <span className="sr-only">Attribute</span>
                </th>
                {schools.map((s) => {
                  const removeHref = formatCompareHref(schools.filter((x) => x.id !== s.id).map((x) => x.id));
                  return (
                    <th key={s.id} scope="col" className="min-w-[12rem] px-4 py-4 text-left align-top">
                      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
                        <span className="font-semibold text-sky">{s.primaryAirportCode}</span> · {locationOf(s)}
                      </p>
                      <Link href={schoolHref(s)} className="mt-1 block font-display text-lg font-bold leading-tight tracking-tight text-ink hover:text-accent-ink">
                        {s.name}
                      </Link>
                      <Link href={removeHref} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink">
                        <X size={12} aria-hidden /> Remove
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={th}>Rating</th>
                {schools.map((s) => (
                  <td key={s.id} className={td}>
                    {s.reviewCount > 0 ? <Stars value={s.rating} count={s.reviewCount} size={14} /> : <span className="text-muted">No reviews</span>}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className={th}>Training type</th>
                {schools.map((s) => (
                  <td key={s.id} className={td}>{faaLabel(s.faaPart) ?? dash}</td>
                ))}
              </tr>
              {programRows.map((p) => (
                <tr key={p.slug}>
                  <th scope="row" className={th}>{p.shortName}</th>
                  {schools.map((s) => (
                    <td key={s.id} className={td}>{s.programSlugs.includes(p.slug) ? check : dash}</td>
                  ))}
                </tr>
              ))}
              {aircraftRows.map((a) => (
                <tr key={a.slug}>
                  <th scope="row" className={th}>{a.displayName}</th>
                  {schools.map((s) => (
                    <td key={s.id} className={td}>{(s.aircraftSlugs ?? []).includes(a.slug) ? check : dash}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className={th}>Fleet size</th>
                {schools.map((s) => (
                  <td key={s.id} className={td}>{s.estimatedPlanes ? `${s.estimatedPlanes} aircraft` : dash}</td>
                ))}
              </tr>
              <tr>
                <th scope="row" className={th}>Instructors</th>
                {schools.map((s) => (
                  <td key={s.id} className={td}>{s.estimatedInstructors ?? dash}</td>
                ))}
              </tr>
              <tr>
                <th scope="row" className={th}>Website</th>
                {schools.map((s) => (
                  <td key={s.id} className={td}>
                    {s.website ? (
                      <a href={s.website} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-accent-ink hover:underline">
                        {s.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : dash}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className={th}>Phone</th>
                {schools.map((s) => (
                  <td key={s.id} className={td}>
                    {s.phone ? (
                      <a href={`tel:${s.phone.replace(/\D/g, "")}`} className="font-semibold text-ink hover:text-accent-ink">{s.phone}</a>
                    ) : dash}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  );
}
