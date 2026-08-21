"use client";

import { useState, useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { FilterInput, NoMatches, SortBar } from "@/components/ExplorerControls";

export type CityRow = {
  id: string;
  name: string;
  slug: string;
  stateSlug: string;
  stateAbbreviation: string;
  schoolCount: number;
  airportCount: number;
};

type SortField = "name" | "state" | "schools" | "airports";
type SortDir = "asc" | "desc";

export function CitiesExplorer({ cities }: { cities: CityRow[] }) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = cities;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.stateAbbreviation.toLowerCase().includes(q) ||
          c.stateSlug.replace(/-/g, " ").includes(q),
      );
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "state") cmp = a.stateAbbreviation.localeCompare(b.stateAbbreviation);
      else if (sortField === "schools") cmp = a.schoolCount - b.schoolCount;
      else if (sortField === "airports") cmp = a.airportCount - b.airportCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [cities, query, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" || field === "state" ? "asc" : "desc");
    }
  }

  const totalSchools = cities.reduce((n, c) => n + c.schoolCount, 0);

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${cities.length} cities / ${totalSchools.toLocaleString()} schools`}
        title="Browse flight schools by city"
        description="Find schools in the metro you're in — or the one you're willing to drive to."
      >
        <FilterInput
          value={query}
          onChange={setQuery}
          placeholder="City or state — Mesa, AZ, Florida"
          className="max-w-lg"
        />
      </PageHero>

      <Container className="py-10">
        <SortBar
          fields={[
            ["name", "City"],
            ["state", "State"],
            ["schools", "Schools"],
            ["airports", "Airports"],
          ]}
          sortField={sortField}
          sortDir={sortDir}
          onToggle={toggleSort}
          summary={
            filtered.length === cities.length
              ? `${cities.length} cities`
              : `${filtered.length} of ${cities.length} cities`
          }
        />

        {filtered.length === 0 ? (
          <NoMatches query={query} onClear={() => setQuery("")} noun="cities" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((city) => (
              <Card key={city.id} href={`/cities/${city.slug}`} className="flex h-full flex-col p-5">
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
                  {city.stateAbbreviation}
                </span>
                <span className="mt-1 font-display text-xl font-bold leading-tight tracking-tight text-ink transition-colors group-hover:text-accent-ink">
                  {city.name}
                </span>
                <dl className="mt-4 space-y-0.5 border-t border-line pt-3 font-mono text-xs text-muted">
                  <div className="flex justify-between">
                    <dt>{city.schoolCount === 1 ? "School" : "Schools"}</dt>
                    <dd className="text-ink">{city.schoolCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{city.airportCount === 1 ? "Airport" : "Airports"}</dt>
                    <dd className="text-ink">{city.airportCount}</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
