"use client";

import { useState, useMemo } from "react";
import type { State } from "@/lib/types";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { FilterInput, NoMatches, SortBar } from "@/components/ExplorerControls";

type SortField = "name" | "schools" | "airports";
type SortDir = "asc" | "desc";

export function StatesExplorer({ states }: { states: State[] }) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = states;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.abbreviation.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "schools") cmp = a.schoolCount - b.schoolCount;
      else if (sortField === "airports") cmp = a.airportCount - b.airportCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [states, query, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Default desc for count fields so "Most schools" feels natural
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  const totalSchools = states.reduce((n, s) => n + s.schoolCount, 0);

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${states.length} states / ${totalSchools.toLocaleString()} schools`}
        title="Browse flight schools by state"
        description="Every listing, filed by state. Type a name or two-letter abbreviation to jump straight to it."
      >
        <FilterInput
          value={query}
          onChange={setQuery}
          placeholder="State name or abbreviation — Mi, New, Cal"
          className="max-w-lg"
        />
      </PageHero>

      <Container className="py-10">
        <SortBar
          fields={[
            ["name", "Name"],
            ["schools", "Schools"],
            ["airports", "Airports"],
          ]}
          sortField={sortField}
          sortDir={sortDir}
          onToggle={toggleSort}
          summary={
            filtered.length === states.length
              ? `${states.length} states`
              : `${filtered.length} of ${states.length} states`
          }
        />

        {filtered.length === 0 ? (
          <NoMatches query={query} onClear={() => setQuery("")} noun="states" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((state) => (
              <Card key={state.id} href={`/states/${state.slug}`} className="flex h-full flex-col p-5">
                <span className="font-display text-3xl font-bold leading-none tracking-tight text-ink transition-colors group-hover:text-accent-ink">
                  {state.abbreviation}
                </span>
                <span className="mt-1.5 text-sm font-medium leading-tight text-muted">
                  {state.name}
                </span>
                <dl className="mt-auto space-y-0.5 border-t border-line pt-3 font-mono text-xs text-muted">
                  <div className="flex justify-between">
                    <dt>Schools</dt>
                    <dd className="text-ink">{state.schoolCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Airports</dt>
                    <dd className="text-ink">{state.airportCount}</dd>
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
