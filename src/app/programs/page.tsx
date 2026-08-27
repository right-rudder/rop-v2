import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getPrograms } from "@/lib/data";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

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

export default async function ProgramsPage() {
  const sorted = await getPrograms();

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${sorted.length} programs`}
        title="Certificates, ratings & endorsements"
        description="Every FAA pilot certificate, rating and endorsement offered at U.S. flight schools — with requirements, timelines, and the schools that teach them."
      />

      <Container size="default" className="py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sorted.map((program) => (
            <Card key={program.slug} href={`/programs/${program.slug}`} className="flex h-full flex-col p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-bold leading-tight tracking-tight text-ink transition-colors group-hover:text-accent-ink">
                  {program.name}
                </h2>
                <ArrowUpRight
                  size={18}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-muted transition-[color,transform,translate] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-ink"
                />
              </div>
              <p className="mb-4 line-clamp-2 text-sm text-muted">{program.description}</p>
              <p className="mt-auto font-mono text-xs uppercase tracking-[0.12em] text-muted">
                {program.minimumHours && `${program.minimumHours}+ hrs`}
                {program.minimumHours && program.typicalDuration && " · "}
                {program.typicalDuration}
                {!program.minimumHours && !program.typicalDuration && "Add-on"}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
