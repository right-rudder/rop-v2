"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Star, SlidersHorizontal, X, ArrowUp, ArrowDown } from "lucide-react";

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
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
        {label}
        {selectedItems.length > 0 && (
          <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
            {selectedItems.length} selected
          </span>
        )}
      </label>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedItems.map((item) => (
            <span
              key={item.slug}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
            >
              {renderChip(item)}
              <button
                onClick={() => onRemove(item.slug)}
                aria-label={`Remove ${renderChip(item)}`}
                className="hover:text-blue-900 dark:hover:text-blue-100 transition"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {dropdownOpen && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((item) => (
              <li key={item.slug}>
                <button
                  onMouseDown={() => onSelect(item)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
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
  }, [query, selectedStates, selectedCities, airportQuery, faaPart, selectedPrograms, selectedAircraft, minRating, sortBy, sortDir]);

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
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          School Name
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); resetCount(); }}
          placeholder="e.g. Arizona Pilot Academy"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {s.name}{" "}
            <span className="text-slate-400 dark:text-slate-500">{s.abbreviation}</span>
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
            {c.name},{" "}
            <span className="text-slate-400 dark:text-slate-500">{c.stateAbbreviation}</span>
          </>
        )}
        placeholder="Search cities…"
      />

      {/* Airport code */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Airport Code
        </label>
        <input
          type="text"
          value={airportQuery}
          onChange={(e) => { setAirportQuery(e.target.value.toUpperCase()); resetCount(); }}
          placeholder="e.g. KFFZ"
          maxLength={8}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* FAA Part */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Training Type
        </label>
        <div className="flex flex-wrap gap-2">
          {faaPartOptions.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => { setFaaPart(val); resetCount(); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                faaPart === val
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Programs */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Programs Offered
          {selectedPrograms.size > 0 && (
            <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
              {selectedPrograms.size} selected
            </span>
          )}
        </label>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {programs.map((p) => (
            <label key={p.slug} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedPrograms.has(p.slug)}
                onChange={() => toggleProgram(p.slug)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition">
                {p.shortName}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Aircraft */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Aircraft Fleet
          {selectedAircraft.size > 0 && (
            <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
              {selectedAircraft.size} selected
            </span>
          )}
        </label>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {aircraft.map((a) => (
            <label key={a.slug} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedAircraft.has(a.slug)}
                onChange={() => toggleAircraft(a.slug)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition">
                {a.displayName}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Min Rating */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Minimum Rating
        </label>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => { setMinRating(minRating === star ? 0 : star); resetCount(); }}
              aria-label={`${star} star minimum`}
              className={`text-2xl leading-none transition hover:scale-110 ${
                star <= minRating ? "text-amber-400" : "text-slate-300 dark:text-slate-600 hover:text-amber-300"
              }`}
            >
              ★
            </button>
          ))}
          {minRating > 0 && (
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{minRating}+ stars</span>
          )}
        </div>
      </div>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition"
        >
          <X size={14} />
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-blue-700 text-white text-xs rounded-full px-2 py-0.5 leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

        {mobileFiltersOpen && (
          <div className="mt-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
            {filterPanel}
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <SlidersHorizontal size={16} />
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <span className="bg-blue-700 text-white text-xs rounded-full px-2 py-0.5 leading-none">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {filtered.length}
              </span>{" "}
              school{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Sort:</span>
              {(["name", "rating"] as const).map((field) => {
                const active = sortBy === field;
                return (
                  <button
                    key={field}
                    onClick={() => {
                      if (active) {
                        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      } else {
                        setSortBy(field);
                        setSortDir(field === "rating" ? "desc" : "asc");
                      }
                      resetCount();
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition ${
                      active
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
                    }`}
                  >
                    {field === "name" ? "Name" : "Rating"}
                    {active && (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                No schools match your filters
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Try adjusting or clearing some of your filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visible.map((school) => (
                  <Link
                    key={school.id}
                    href={school.href}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition block"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition mb-1 line-clamp-2">
                      {school.name}
                    </p>
                    <p className="font-mono text-sm text-blue-700 dark:text-blue-400 mb-2">
                      {school.airportCode}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={12} />
                        {school.location}
                      </p>
                      <div className="flex items-center gap-1 text-amber-500 text-sm">
                        <Star size={13} fill="currentColor" />
                        <span className="font-semibold">{school.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    {school.faaPart && (
                      <div className="flex gap-1.5 flex-wrap">
                        {(school.faaPart === "61" || school.faaPart === "both") && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                            Part 61
                          </span>
                        )}
                        {(school.faaPart === "141" || school.faaPart === "both") && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium">
                            Part 141
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
                  >
                    Load More Schools
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
