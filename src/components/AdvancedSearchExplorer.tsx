"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, Star, SlidersHorizontal, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

type SchoolFilterItem = {
  id: string;
  name: string;
  href: string;
  stateSlug: string;
  citySlug: string;
  airportCode: string;
  programSlugs: string[];
  aircraftSlugs: string[];
  faaPart?: "61" | "141" | "both";
  rating: number;
  reviewCount: number;
  location: string;
};

type ProgramOption = { slug: string; shortName: string };
type AircraftOption = { slug: string; displayName: string };
type StateOption = { slug: string; name: string; abbreviation: string };
type CityOption = { slug: string; name: string; stateSlug: string; stateAbbreviation: string };

type Props = {
  schools: SchoolFilterItem[];
  programs: ProgramOption[];
  aircraft: AircraftOption[];
  states: StateOption[];
  cities: CityOption[];
};

const faaPartOptions: Array<{ val: "any" | "61" | "141" | "both"; label: string }> = [
  { val: "any", label: "Any" },
  { val: "61", label: "Part 61" },
  { val: "141", label: "Part 141" },
  { val: "both", label: "61 & 141" },
];

const filterLabel = "mb-2 block text-sm font-semibold text-ink";
const checkboxCls =
  "h-4 w-4 cursor-pointer rounded border-line accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

// ── Typeahead multi-select ────────────────────────────────────────────────────
// Must be defined outside the parent component so its identity is stable across
// renders — otherwise React unmounts/remounts it on every keystroke, killing focus.
function TypeaheadFilter<T extends { slug: string }>({
  label,
  inputValue,
  onInputChange,
  onFocus,
  onBlur,
  dropdownOpen,
  suggestions,
  onSelect,
  selectedItems,
  onRemove,
  renderChip,
  renderSuggestion,
  placeholder,
}: {
  label: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  dropdownOpen: boolean;
  suggestions: T[];
  onSelect: (item: T) => void;
  selectedItems: T[];
  onRemove: (slug: string) => void;
  renderChip: (item: T) => string;
  renderSuggestion: (item: T) => React.ReactNode;
  placeholder: string;
}) {
  return (
    <div>
      <label className={filterLabel}>
        {label}
        {selectedItems.length > 0 && (
          <span className="ml-2 font-mono text-xs font-normal text-accent-ink">
            {selectedItems.length} selected
          </span>
        )}
      </label>

      {selectedItems.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <span
              key={item.slug}
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink"
            >
              {renderChip(item)}
              <button
                type="button"
                onClick={() => onRemove(item.slug)}
                aria-label={`Remove ${renderChip(item)}`}
                className="rounded-full transition-colors hover:text-ink"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="py-2 text-sm"
        />
        {dropdownOpen && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full animate-scale-in overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-card">
            {suggestions.map((item) => (
              <li key={item.slug}>
                <button
                  type="button"
                  onMouseDown={() => onSelect(item)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-2"
                >
                  {renderSuggestion(item)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function AdvancedSearchExplorer({ schools, programs, aircraft, states, cities }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isFirstRender = useRef(true);

  // ── Filter state — initialized from URL params ────────────────────────────
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const [stateQuery, setStateQuery] = useState("");
  const [selectedStates, setSelectedStates] = useState<StateOption[]>(() => {
    const param = searchParams.get("state");
    if (!param) return [];
    return param.split(",").map((slug) => states.find((s) => s.slug === slug)!).filter(Boolean);
  });
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  const [cityQuery, setCityQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState<CityOption[]>(() => {
    const param = searchParams.get("city");
    if (!param) return [];
    return param.split(",").map((slug) => cities.find((c) => c.slug === slug)!).filter(Boolean);
  });
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const [airportQuery, setAirportQuery] = useState(() => searchParams.get("airport") ?? "");

  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(() => {
    const param = searchParams.get("program");
    return param ? new Set(param.split(",")) : new Set();
  });

  const [selectedAircraft, setSelectedAircraft] = useState<Set<string>>(() => {
    const param = searchParams.get("ac");
    return param ? new Set(param.split(",")) : new Set();
  });

  const [faaPart, setFaaPart] = useState<"any" | "61" | "141" | "both">(() => {
    const param = searchParams.get("part");
    return param === "61" || param === "141" || param === "both" ? param : "any";
  });

  const [minRating, setMinRating] = useState(() => {
    const param = searchParams.get("rating");
    const n = param ? parseInt(param, 10) : 0;
    return n >= 1 && n <= 5 ? n : 0;
  });

  const [sortBy, setSortBy] = useState<"name" | "rating">(() => {
    return searchParams.get("sort") === "name" ? "name" : "rating";
  });

  const [sortDir, setSortDir] = useState<"asc" | "desc">(() => {
    return searchParams.get("dir") === "asc" ? "asc" : "desc";
  });

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const resetCount = () => setVisibleCount(PAGE_SIZE);

  // ── Sync filter state → URL ───────────────────────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedStates.length) params.set("state", selectedStates.map((s) => s.slug).join(","));
    if (selectedCities.length) params.set("city", selectedCities.map((c) => c.slug).join(","));
    if (airportQuery) params.set("airport", airportQuery);
    if (faaPart !== "any") params.set("part", faaPart);
    if (selectedPrograms.size) params.set("program", [...selectedPrograms].join(","));
    if (selectedAircraft.size) params.set("ac", [...selectedAircraft].join(","));
    if (minRating > 0) params.set("rating", String(minRating));
    if (sortBy !== "rating") params.set("sort", sortBy);
    if (sortDir !== "desc") params.set("dir", sortDir);
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  }, [router, query, selectedStates, selectedCities, airportQuery, faaPart, selectedPrograms, selectedAircraft, minRating, sortBy, sortDir]);

  // ── State typeahead helpers ──────────────────────────────────────────────────
  const stateSuggestions = useMemo(() => {
    if (!stateQuery) return [];
    const q = stateQuery.toLowerCase();
    return states
      .filter(
        (s) =>
          (s.name.toLowerCase().includes(q) || s.abbreviation.toLowerCase().includes(q)) &&
          !selectedStates.some((sel) => sel.slug === s.slug)
      )
      .slice(0, 8);
  }, [stateQuery, states, selectedStates]);

  const addState = (state: StateOption) => {
    setSelectedStates((prev) => [...prev, state]);
    setStateQuery("");
    setStateDropdownOpen(false);
    resetCount();
  };

  const removeState = (slug: string) => {
    setSelectedStates((prev) => prev.filter((s) => s.slug !== slug));
    resetCount();
  };

  // ── City typeahead helpers ───────────────────────────────────────────────────
  const citySuggestions = useMemo(() => {
    if (!cityQuery) return [];
    const q = cityQuery.toLowerCase();
    return cities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) &&
          !selectedCities.some((sel) => sel.slug === c.slug) &&
          (!selectedStates.length || selectedStates.some((s) => s.slug === c.stateSlug))
      )
      .slice(0, 8);
  }, [cityQuery, cities, selectedCities, selectedStates]);

  const addCity = (city: CityOption) => {
    setSelectedCities((prev) => [...prev, city]);
    setCityQuery("");
    setCityDropdownOpen(false);
    resetCount();
  };

  const removeCity = (slug: string) => {
    setSelectedCities((prev) => prev.filter((c) => c.slug !== slug));
    resetCount();
  };

  // ── Program / aircraft toggles ───────────────────────────────────────────────
  const toggleProgram = (slug: string) => {
    setSelectedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    resetCount();
  };

  const toggleAircraft = (slug: string) => {
    setSelectedAircraft((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    resetCount();
  };

  // ── Filter logic ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return schools.filter((school) => {
      if (query && !school.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (selectedStates.length > 0 && !selectedStates.some((s) => s.slug === school.stateSlug)) return false;
      if (selectedCities.length > 0 && !selectedCities.some((c) => c.slug === school.citySlug)) return false;
      if (airportQuery && !school.airportCode.toUpperCase().includes(airportQuery.toUpperCase())) return false;
      if (faaPart !== "any") {
        if (faaPart === "61" && school.faaPart !== "61" && school.faaPart !== "both") return false;
        if (faaPart === "141" && school.faaPart !== "141" && school.faaPart !== "both") return false;
        if (faaPart === "both" && school.faaPart !== "both") return false;
      }
      if (selectedPrograms.size > 0 && ![...selectedPrograms].some((p) => school.programSlugs.includes(p))) return false;
      if (selectedAircraft.size > 0 && ![...selectedAircraft].some((a) => school.aircraftSlugs.includes(a))) return false;
      if (minRating > 0 && school.rating < minRating) return false;
      return true;
    });
  }, [query, selectedStates, selectedCities, airportQuery, faaPart, selectedPrograms, selectedAircraft, minRating, schools]);

  const activeFilterCount = [
    query ? 1 : 0,
    selectedStates.length,
    selectedCities.length,
    airportQuery ? 1 : 0,
    faaPart !== "any" ? 1 : 0,
    selectedPrograms.size,
    selectedAircraft.size,
    minRating > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const resetFilters = () => {
    setQuery("");
    setStateQuery("");
    setSelectedStates([]);
    setCityQuery("");
    setSelectedCities([]);
    setAirportQuery("");
    setSelectedPrograms(new Set());
    setSelectedAircraft(new Set());
    setFaaPart("any");
    setMinRating(0);
    setVisibleCount(PAGE_SIZE);
  };

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const cmp = sortBy === "name"
        ? a.name.localeCompare(b.name)
        : a.rating - b.rating;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  // ── Filter panel ─────────────────────────────────────────────────────────────
  const filterPanel = (
    <div className="space-y-6">
      {/* School name */}
      <div>
        <label htmlFor="filter-name" className={filterLabel}>
          School name
        </label>
        <Input
          id="filter-name"
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); resetCount(); }}
          placeholder="e.g. Arizona Pilot Academy"
          className="py-2 text-sm"
        />
      </div>

      {/* State typeahead */}
      <TypeaheadFilter
        label="State"
        inputValue={stateQuery}
        onInputChange={(v) => { setStateQuery(v); setStateDropdownOpen(true); }}
        onFocus={() => setStateDropdownOpen(true)}
        onBlur={() => setTimeout(() => setStateDropdownOpen(false), 150)}
        dropdownOpen={stateDropdownOpen}
        suggestions={stateSuggestions}
        onSelect={addState}
        selectedItems={selectedStates}
        onRemove={removeState}
        renderChip={(s) => `${s.name}`}
        renderSuggestion={(s) => (
          <>
            {s.name} <span className="font-mono text-xs text-muted">{s.abbreviation}</span>
          </>
        )}
        placeholder="Search states…"
      />

      {/* City typeahead */}
      <TypeaheadFilter
        label="City"
        inputValue={cityQuery}
        onInputChange={(v) => { setCityQuery(v); setCityDropdownOpen(true); }}
        onFocus={() => setCityDropdownOpen(true)}
        onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
        dropdownOpen={cityDropdownOpen}
        suggestions={citySuggestions}
        onSelect={addCity}
        selectedItems={selectedCities}
        onRemove={removeCity}
        renderChip={(c) => `${c.name}, ${c.stateAbbreviation}`}
        renderSuggestion={(c) => (
          <>
            {c.name}, <span className="font-mono text-xs text-muted">{c.stateAbbreviation}</span>
          </>
        )}
        placeholder="Search cities…"
      />

      {/* Airport code */}
      <div>
        <label htmlFor="filter-airport" className={filterLabel}>
          Airport code
        </label>
        <Input
          id="filter-airport"
          type="text"
          value={airportQuery}
          onChange={(e) => { setAirportQuery(e.target.value.toUpperCase()); resetCount(); }}
          placeholder="e.g. KFFZ"
          maxLength={8}
          className="py-2 font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case"
        />
      </div>

      {/* FAA Part */}
      <div>
        <p className={filterLabel}>Training type</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Training type">
          {faaPartOptions.map(({ val, label }) => (
            <Chip
              key={val}
              active={faaPart === val}
              onClick={() => { setFaaPart(val); resetCount(); }}
              className="px-3 py-1 text-xs"
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Programs */}
      <div>
        <p className={filterLabel}>
          Programs offered
          {selectedPrograms.size > 0 && (
            <span className="ml-2 font-mono text-xs font-normal text-accent-ink">
              {selectedPrograms.size} selected
            </span>
          )}
        </p>
        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {programs.map((p) => (
            <label key={p.slug} className="group flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={selectedPrograms.has(p.slug)}
                onChange={() => toggleProgram(p.slug)}
                className={checkboxCls}
              />
              <span className="text-sm text-ink transition-colors group-hover:text-accent-ink">
                {p.shortName}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Aircraft */}
      <div>
        <p className={filterLabel}>
          Aircraft fleet
          {selectedAircraft.size > 0 && (
            <span className="ml-2 font-mono text-xs font-normal text-accent-ink">
              {selectedAircraft.size} selected
            </span>
          )}
        </p>
        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {aircraft.map((a) => (
            <label key={a.slug} className="group flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={selectedAircraft.has(a.slug)}
                onChange={() => toggleAircraft(a.slug)}
                className={checkboxCls}
              />
              <span className="text-sm text-ink transition-colors group-hover:text-accent-ink">
                {a.displayName}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Min Rating */}
      <div>
        <p className={filterLabel}>Minimum rating</p>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => { setMinRating(minRating === star ? 0 : star); resetCount(); }}
              aria-label={`${star} star minimum`}
              aria-pressed={star <= minRating}
              className="rounded-md p-0.5 transition-transform duration-150 hover:scale-115 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Star
                size={22}
                fill="currentColor"
                strokeWidth={0}
                className={cn("transition-colors", star <= minRating ? "text-star" : "text-line hover:text-star/60")}
              />
            </button>
          ))}
          {minRating > 0 && (
            <span className="ml-2 font-mono text-xs text-muted">{minRating}+ stars</span>
          )}
        </div>
      </div>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <Button variant="secondary" size="sm" full onClick={resetFilters}>
          <X size={14} />
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <Container className="py-10">
      {/* Mobile filter toggle */}
      <div className="mb-6 lg:hidden">
        <Button
          variant="secondary"
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
          aria-expanded={mobileFiltersOpen}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-xs leading-none text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {mobileFiltersOpen && (
          <Card className="mt-4 animate-slide-down p-5">{filterPanel}</Card>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <Card className="sticky top-24 p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-ink">
                <SlidersHorizontal size={16} />
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-xs leading-none text-white">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {filterPanel}
          </Card>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
              <span className="text-ink">{filtered.length}</span> school{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="flex items-center gap-1.5">
              <span className="mr-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">Sort</span>
              {(["name", "rating"] as const).map((field) => {
                const active = sortBy === field;
                return (
                  <Chip
                    key={field}
                    active={active}
                    className="px-3 py-1 text-xs"
                    onClick={() => {
                      if (active) {
                        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      } else {
                        setSortBy(field);
                        setSortDir(field === "rating" ? "desc" : "asc");
                      }
                      resetCount();
                    }}
                  >
                    {field === "name" ? "Name" : "Rating"}
                    {active && (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </Chip>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
              <p className="font-display text-xl font-bold tracking-tight text-ink">
                No schools match your filters
              </p>
              <p className="mt-1 text-sm text-muted">Try adjusting or clearing some of your filters.</p>
              <Button variant="secondary" size="sm" className="mt-6" onClick={resetFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visible.map((school) => (
                  <Card key={school.id} href={school.href} className="flex h-full flex-col p-5">
                    <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                      <span className="font-semibold text-sky">{school.airportCode}</span>
                    </p>
                    <p className="line-clamp-2 font-display text-lg font-bold leading-tight tracking-tight text-ink transition-colors group-hover:text-accent-ink">
                      {school.name}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <MapPin size={12} />
                        {school.location}
                      </p>
                      {school.reviewCount > 0 ? (
                        <Stars value={school.rating} size={13} />
                      ) : (
                        <span className="text-xs text-muted">No reviews</span>
                      )}
                    </div>
                    {school.faaPart && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                        {(school.faaPart === "61" || school.faaPart === "both") && (
                          <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                            Part 61
                          </span>
                        )}
                        {(school.faaPart === "141" || school.faaPart === "both") && (
                          <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                            Part 141
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <Button variant="secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                    Show more schools
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
