import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteSchools, getLocationMaps } from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { PageHero } from "@/components/PageHero";
import { SchoolCard } from "@/components/SchoolCard";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Saved schools",
  robots: { index: false },
};

export default async function SavedPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/saved");

  const [schools, { cityNameBySlug, stateBySlug }] = await Promise.all([
    getFavoriteSchools(viewer.id),
    getLocationMaps(),
  ]);

  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        eyebrow={`${schools.length} saved ${schools.length === 1 ? "school" : "schools"}`}
        title="Saved schools"
        description="Your shortlist. Tap the heart on any school to add or remove it."
      />
      <Container className="py-12">
        {schools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
            <p className="font-display text-xl font-bold tracking-tight text-ink">
              Nothing saved yet
            </p>
            <p className="mt-1 text-sm text-muted">
              Browse the directory and tap the heart on schools you like.
            </p>
            <Button href="/search" className="mt-6">
              Search schools
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <SchoolCard
                key={school.id}
                schoolId={school.id}
                path="/saved"
                name={school.name}
                location={`${cityNameBySlug[school.citySlug] ?? school.citySlug}, ${stateBySlug[school.stateSlug]?.abbreviation ?? school.stateSlug.toUpperCase()}`}
                airportCode={school.primaryAirportCode}
                logoPath={school.logoPath}
                rating={school.rating}
                reviewCount={school.reviewCount}
                href={schoolHref(school)}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
