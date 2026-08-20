"use client";

import { useState, useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";
import { AirportCard } from "@/components/AirportCard";
import { FilterInput, NoMatches, SortBar } from "@/components/ExplorerControls";

export type AirportRow = {
  id: string;
  name: string;
  icao: string;
  iata: string | null;
  faaLid: string | null;
  citySlug: string;
  cityName: string;
  stateSlug: string;
  stateAbbreviation: string;
  schoolCount: number;
};

type SortField = "icao" | "name" | "city" | "schools";
type SortDir = "asc" | "desc";

export function AirportsExplorer({ airports }: { airports: AirportRow[] }) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("icao");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = airports;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (a) =>
          a.icao.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.cityName.toLowerCase().includes(q) ||
          a.stateAbbreviation.toLowerCase().includes(q) ||
          (a.iata?.toLowerCase().includes(q) ?? false) ||
          (a.faaLid?.toLowerCase().includes(q) ?? false),
      );
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "icao") cmp = a.icao.localeCompare(b.icao);
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "city") cmp = a.cityName.localeCompare(b.cityName);
      else if (sortField === "schools") cmp = a.schoolCount - b.schoolCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [airports, query, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "schools" ? "desc" : "asc");
    }
  }

  const totalSchools = airports.reduce((n, a) => n + a.schoolCount, 0);

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${airports.length} airports / ${totalSchools.toLocaleString()} schools`}
        title="Browse flight schools by airport"
        description="Start from the field. Search by ICAO, IATA or FAA identifier, airport name, or city."
      >
        <FilterInput
          value={query}
          onChange={setQuery}
          placeholder="KFFZ, FFZ, Falcon Field, Mesa…"
          className="max-w-lg"
        />
      </PageHero>

      <Container className="py-10">
        <SortBar
          fields={[
            ["icao", "Code"],
            ["name", "Name"],
            ["city", "City"],
            ["schools", "Schools"],
          ]}
          sortField={sortField}
          sortDir={sortDir}
          onToggle={toggleSort}
          summary={
            filtered.length === airports.length
              ? `${airports.length} airports`
              : `${filtered.length} of ${airports.length} airports`
          }
        />

        {filtered.length === 0 ? (
          <NoMatches query={query} onClear={() => setQuery("")} noun="airports" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((airport) => (
              <AirportCard
                key={airport.id}
                icao={airport.icao}
                iata={airport.iata}
                faaLid={airport.faaLid}
                name={airport.name}
                location={`${airport.cityName}, ${airport.stateAbbreviation}`}
                schoolCount={airport.schoolCount}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
