/**
 * Pure mapping functions from spreadsheet cells to catalog rows.
 *
 * Everything here is deterministic and dependency-free so scripts/tests can
 * pin the behaviour that turns 2,240 free-text rows into the database's typed
 * columns. The rule throughout: never invent data, and never silently drop it —
 * tokens we can't map to a catalog slug survive as `training_tags`.
 */
import { slugify } from "../../src/lib/utils.ts";
import { FLEET_RANGES, type FleetRange, type ContactPerson } from "../../src/lib/types.ts";

/** A "; "-separated multi-value cell -> trimmed, de-duplicated tokens. */
export function tokens(cell: string): string[] {
  if (!cell) return [];
  return [
    ...new Set(
      cell
        .split(";")
        .map((t) => t.trim())
        .filter((t) => t !== "" && t !== "N/A" && t !== "--"),
    ),
  ];
}

/** Blank / "N/A" / "--" placeholders all mean "no value". */
export function optional(cell: string): string | null {
  const v = cell.trim();
  return v === "" || v === "N/A" || v === "n/a" || v === "--" ? null : v;
}

/** Tri-state flag: Yes -> true, No -> false, blank / N/A -> null (unknown). */
export function yesNoNull(cell: string): boolean | null {
  const v = cell.trim().toLowerCase();
  if (v === "yes" || v === "y" || v === "true") return true;
  if (v === "no" || v === "n" || v === "false") return false;
  return null;
}

/**
 * The FAA-classification cell lists every applicable part
 * ("Part 141; Part 61", "Part 107; Part 61"). The schema's faa_part only
 * models pilot training: 61, 141, or both. Part 107 (drone) / 142 (type
 * training) / 103 (ultralight) alone leave it null.
 */
export function faaPart(cell: string): "61" | "141" | "both" | null {
  const parts = tokens(cell).map((t) => t.replace(/^Part\s*/i, ""));
  const has61 = parts.includes("61");
  const has141 = parts.includes("141");
  if (has61 && has141) return "both";
  if (has141) return "141";
  if (has61) return "61";
  return null;
}

/** Aircraft-count integer -> the FLEET_RANGES bucket the school forms offer. */
export function fleetBucket(cell: string): FleetRange | null {
  const v = optional(cell);
  if (v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n <= 3) return "1-3";
  if (n <= 6) return "3-6";
  if (n <= 9) return "6-9";
  if (n <= 20) return "10-20";
  if (n <= 30) return "20-30";
  if (n <= 40) return "30-40";
  if (n <= 50) return "40-50";
  return "50+";
}

/** Student-visa cell -> canonical visa codes. Accepts "M1", "F1; M1", "F1, M1". */
export function visaTypes(cell: string): string[] {
  const out: string[] = [];
  // One row writes "F1, M1" instead of the usual "F1; M1", so split on both.
  for (const t of cell.split(/[;,]/).map((v) => v.trim()).filter(Boolean)) {
    const v = t.toUpperCase().replace(/[^FM1]/g, "");
    if (v === "F1" && !out.includes("F-1")) out.push("F-1");
    if (v === "M1" && !out.includes("M-1")) out.push("M-1");
  }
  return out;
}

/** school_type cell -> canonical school kinds. */
export function schoolTypes(cell: string): string[] {
  const map: Record<string, string> = {
    "flight school": "flight-school",
    "helicopter school": "helicopter-school",
    "aviation college": "aviation-college",
  };
  const out: string[] = [];
  for (const t of tokens(cell)) {
    const v = map[t.toLowerCase()];
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/**
 * Free-text training tokens -> program slugs from the editorial catalog.
 * Keys are lowercased source tokens; anything absent becomes a training tag.
 */
const PROGRAM_BY_TOKEN: Record<string, string> = {
  "private pilot": "private-pilot",
  "private pilot certificate": "private-pilot",
  "private pilot cetficiate": "private-pilot", // sheet typo, 1 row
  "privae pilot certificate": "private-pilot", // sheet typo, 7 rows
  commercial: "commercial-pilot",
  "commercial pilot certificate": "commercial-pilot",
  "flight instructor cfi": "cfi",
  "flight instructor certificate": "cfi",
  "flight instructor certificates": "cfi",
  "flight instructor instrument cfii": "cfii",
  "flight instructor instrument certificate": "cfii",
  "multi engine instructor mei": "mei",
  "flight instructor multi engine certificate": "mei",
  "airline transport pilot atp": "atp",
  "airline transport pilot atp se": "atp",
  "airline transport pilot atp me": "atp",
  "airline transport pilot atp helicopter": "atp",
  "sport pilot": "sport-pilot",
  instrument: "instrument-rating",
  "multi-engine": "multi-engine",
  "multi engine": "multi-engine",
  seaplane: "seaplane-rating",
  tailwheel: "tailwheel",
  tailwhell: "tailwheel", // sheet typo, 1 row
  "high performance": "high-performance",
  complex: "complex-endorsement",
  "ground school": "ground-school",
  "intro flight": "discovery-flight",
};

/**
 * Source spellings that mean the same thing as another token. Applied before
 * tagging so the tag vocabulary does not carry the sheet's typos.
 */
const TAG_ALIASES: Record<string, string> = {
  "aicraft maintenance training": "Aircraft Maintenance Training",
  "ipc check": "Instrument Proficiency Check",
  "flight instructor certificates": "Flight Instructor Certificate",
};

/** Free-text rental/equipment tokens -> trainer aircraft slugs. */
const AIRCRAFT_BY_TOKEN: Record<string, string> = {
  "cessna 172": "cessna-172-skyhawk",
  "beechcraft duchess 76": "beechcraft-duchess",
};

/**
 * The tag stored for a token with no catalog slug.
 *
 * slugify() drops "/" and "&" outright, which would fuse words
 * ("Drone/UAS" -> "droneuas"), so those become separators first. Exported so
 * the unmapped-tokens report shows the tag that was actually written.
 */
export function trainingTag(raw: string): string {
  const canonical = TAG_ALIASES[raw.trim().toLowerCase()] ?? raw;
  return slugify(canonical.replace(/[/&+]/g, " "));
}

export type TrainingSource = {
  certifications: string;
  ratings: string;
  advanced: string;
  services: string;
  planes: string;
  simulator: string;
  rotorcraft: string;
};

export type TrainingMapping = {
  programSlugs: string[];
  aircraftSlugs: string[];
  /** Everything that has no catalog slug, kebab-cased, so no fact is lost. */
  trainingTags: string[];
  /** Source tokens with no mapping, for the unmapped-tokens report. */
  unmapped: string[];
};

/**
 * Map every training-related cell at once. Tokens that match the programs or
 * aircraft catalogs become join rows; the rest become searchable tags.
 */
export function mapTraining(
  src: TrainingSource,
  known: { programSlugs: Set<string>; aircraftSlugs: Set<string> },
): TrainingMapping {
  const programSlugs: string[] = [];
  const aircraftSlugs: string[] = [];
  const trainingTags: string[] = [];
  const unmapped: string[] = [];

  const push = (list: string[], value: string) => {
    if (!list.includes(value)) list.push(value);
  };

  const all = [
    ...tokens(src.certifications),
    ...tokens(src.ratings),
    ...tokens(src.advanced),
    ...tokens(src.services),
    ...tokens(src.planes),
    ...tokens(src.simulator),
    ...tokens(src.rotorcraft),
  ];

  for (const raw of all) {
    const key = raw.toLowerCase();
    const program = PROGRAM_BY_TOKEN[key];
    if (program !== undefined && known.programSlugs.has(program)) {
      push(programSlugs, program);
      continue;
    }
    const aircraft = AIRCRAFT_BY_TOKEN[key];
    if (aircraft !== undefined && known.aircraftSlugs.has(aircraft)) {
      push(aircraftSlugs, aircraft);
      continue;
    }
    // "No" / "Yes" answers leak into these multi-value cells; they are not facts.
    if (key === "no" || key === "yes" || key === "none") continue;
    const tag = trainingTag(raw);
    if (tag !== "") {
      push(trainingTags, tag);
      push(unmapped, raw);
    }
  }

  return { programSlugs, aircraftSlugs, trainingTags, unmapped };
}

/** Placeholder contact names the sheet uses in place of a person. */
const PLACEHOLDER_NAMES = new Set(["contact us", "contact", "n/a", "na", "--", "owner", "office"]);

/** Build the contacts[] array, dropping rows that carry no real information. */
export function contactPeople(row: {
  name: string;
  phone: string;
  email: string;
}): ContactPerson[] {
  const name = optional(row.name);
  const phone = optional(row.phone);
  const email = optional(row.email);
  const realName = name !== null && !PLACEHOLDER_NAMES.has(name.toLowerCase()) ? name : null;
  if (realName === null && phone === null && email === null) return [];
  return [
    {
      name: realName ?? "Contact",
      title: "",
      phone: phone ?? "",
      email: email ?? "",
    },
  ];
}

/** True when the value is one of the FLEET_RANGES buckets. */
export function isFleetRange(value: string | null): value is FleetRange {
  return value !== null && (FLEET_RANGES as readonly string[]).includes(value);
}

/**
 * The airport's stable public identifier.
 *
 * OurAirports' `ident` is a bare row key that is sometimes a synthetic
 * "US-1234" for airports with no published code. Prefer the real ICAO, then
 * the GPS/local code, and only fall back to `ident`. The result is what the
 * app shows and routes on (/airports/<lowercased>).
 */
export function airportIdent(row: {
  ident: string;
  icao_code: string;
  gps_code: string;
  local_code: string;
}): string {
  const candidates = [row.icao_code, row.gps_code, row.local_code, row.ident];
  for (const c of candidates) {
    const v = c.trim().toUpperCase();
    if (v !== "" && /^[A-Z0-9]{3,4}$/.test(v)) return v;
  }
  return row.ident.trim().toUpperCase();
}

/** Title-case a lowercase-ish city name while leaving already-cased text alone. */
export function cityName(raw: string): string {
  const v = raw.trim().replace(/\s+/g, " ");
  return v === v.toLowerCase()
    ? v.replace(/\b[a-z]/g, (c) => c.toUpperCase())
    : v;
}

/**
 * Deterministic school description.
 *
 * Every imported listing needs an intro: the source has none, and empty school
 * pages are both a bad landing page and thin content for search. Owners
 * replace it when they claim the listing.
 */
export function describeSchool(input: {
  name: string;
  cityName: string;
  stateName: string;
  airportName: string;
  airportIdent: string;
  faaPart: "61" | "141" | "both" | null;
  programNames: string[];
  vaApproved: boolean | null;
  visaTypes: string[];
  schoolTypes: string[];
}): string {
  const sentences: string[] = [];

  const kind = input.schoolTypes.includes("aviation-college")
    ? "aviation college"
    : input.schoolTypes.includes("helicopter-school") && !input.schoolTypes.includes("flight-school")
      ? "helicopter flight school"
      : "flight school";

  sentences.push(
    `${input.name} is a ${kind} based at ${input.airportName} (${input.airportIdent}) in ${input.cityName}, ${input.stateName}.`,
  );

  const part =
    input.faaPart === "both"
      ? "The school offers both FAR Part 61 and Part 141 training"
      : input.faaPart === "141"
        ? "The school trains under FAR Part 141"
        : input.faaPart === "61"
          ? "The school trains under FAR Part 61"
          : null;

  const list = input.programNames.slice(0, 4);
  const programs =
    list.length > 1
      ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`
      : list[0];

  if (part !== null && programs !== undefined) {
    sentences.push(`${part}, with instruction toward ${programs}.`);
  } else if (part !== null) {
    sentences.push(`${part}.`);
  } else if (programs !== undefined) {
    sentences.push(`Training includes ${programs}.`);
  }

  const extras: string[] = [];
  if (input.vaApproved === true) extras.push("approved for VA education benefits");
  if (input.visaTypes.length > 0) {
    extras.push(`able to enroll international students on ${input.visaTypes.join(" and ")} visas`);
  }
  if (extras.length > 0) {
    sentences.push(`It is ${extras.join(" and ")}.`);
  }

  return sentences.join(" ");
}
