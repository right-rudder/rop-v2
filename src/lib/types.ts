// The notification union lives with its copy builder in ./notifications;
// re-exported here so consumers get it from the usual place.
import type { NotificationType } from "./notifications";
import type { SuggestionField, SuggestionReason, SuggestionValue } from "./suggestions";
export type { NotificationType };

/** WGS-84 coordinate pair (decimal degrees). */
export type LatLng = { lat: number; lng: number };

export type State = {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  schoolCount: number;
  airportCount: number;
};

export type City = {
  id: string;
  name: string;
  slug: string;
  stateSlug: string;
  stateAbbreviation: string;
  /** Slugs of related cities in the same metro area (can cross state lines) */
  nearbyCitySlugs: string[];
};

export type Airport = {
  id: string;
  name: string;
  citySlug: string;
  stateSlug: string;
  /** 4-letter ICAO code — used as URL slug (lowercase), e.g. "KFFZ" */
  icao: string;
  /** 3-letter IATA airline code, e.g. "MSC" */
  iata: string | null;
  /** FAA local identifier, e.g. "FFZ" */
  faaLid: string | null;
  /** Short paragraph describing the airport for the detail page */
  description?: string;
  /** Airport reference point; drives near-me search and the map */
  coords?: LatLng;
};

export type ContactPerson = {
  name: string;
  title: string;
  phone: string;
  email: string;
};

/** Fleet / instructor size buckets offered in the school forms */
export const FLEET_RANGES = ["1-3", "3-6", "6-9", "10-20", "20-30", "30-40", "40-50", "50+"] as const;
export type FleetRange = (typeof FLEET_RANGES)[number];

/**
 * Max lengths for user-supplied text. Mirrors the CHECK constraints in
 * supabase/schema.sql — enforced in server actions and hinted via maxLength.
 */
export const LIMITS = {
  reviewBody: 5000,
  commentBody: 2000,
  schoolName: 120,
  schoolDescription: 5000,
  website: 300,
  phone: 40,
  address: 300,
  hours: 300,
  location: 80,
  contactField: 120,
  contacts: 10,
  personName: 60,
  bio: 1000,
} as const;

export type AircraftCategory =
  | "single-engine"
  | "multi-engine"
  | "helicopter"
  | "glider"
  | "sport";

/** A training program / certificate / rating offered by flight schools */
export type Program = {
  id: string;
  slug: string;
  /** Full official name, e.g. "Private Pilot Certificate" */
  name: string;
  /** Short display name used in tags/chips, e.g. "Private Pilot" */
  shortName: string;
  description: string;
  faaPart?: "61" | "141" | "both";
  /** Minimum flight hours required (Part 61 value) */
  minimumHours?: number;
  /** FAA certificate or endorsement issued upon completion */
  certificate?: string;
  /** Slugs of programs that must be completed first */
  prerequisites?: string[];
  /** Typical completion time, e.g. "6–12 months" */
  typicalDuration?: string;
  /** Controls display order everywhere — maps to sort_order column in DB */
  sortOrder: number;
};

/** A make/model of aircraft commonly used for flight training */
export type TrainerAircraft = {
  id: string;
  slug: string;
  make: string;
  model: string;
  /** Canonical display name, e.g. "Cessna 172 Skyhawk" */
  displayName: string;
  category: AircraftCategory;
  description: string;
  /** Program slugs this aircraft is typically used for */
  commonUse: string[];
  engineCount: number;
  /** Approximate cruise speed, e.g. "~122 knots" */
  typicalCruise?: string;
  /** Controls display order everywhere — maps to sort_order column in DB */
  sortOrder: number;
};

export type FlightSchool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  primaryAirportCode: string; // ICAO
  citySlug: string;
  stateSlug: string;
  /**
   * Links this listing to other listings of the same school brand.
   * All locations of the same organization share the same organizationId.
   * Single-location schools omit this field.
   */
  organizationId?: string;
  /** Slugs referencing the programs catalog (public.programs) */
  programSlugs: string[];
  rating: number;
  reviewCount: number;
  website: string;
  phone: string;
  /** When true, the school appears in the Featured section on the home page */
  featured?: boolean;
  /** Whether the school operates under FAR Part 61, Part 141, or both */
  faaPart?: "61" | "141" | "both";
  contacts?: ContactPerson[];
  /** Slugs referencing the aircraft catalog (public.trainer_aircraft) */
  aircraftSlugs?: string[];
  estimatedPlanes?: FleetRange;
  estimatedInstructors?: FleetRange;
  /** Phase 2+: id of the registered user who claimed/manages this listing */
  managedBy?: string;
  /** Optional per-school override of the airport position (hangar/office) */
  coords?: LatLng;
  /**
   * Object path in the `school-logos` Storage bucket (`<schoolId>/<uuid>.<ext>`),
   * not a URL — resolve it with publicImageUrl() from lib/supabase/storage.
   */
  logoPath?: string;

  // ── Imported facts ──────────────────────────────────────────────────────
  // Populated by the catalog import (scripts/seed). Booleans are tri-state:
  // undefined means the source did not say, which is not the same as "no".

  /** "flight-school" | "helicopter-school" | "aviation-college" */
  schoolTypes: string[];
  /** Approved for VA education benefits */
  vaApproved?: boolean;
  /** Student visas the school can sponsor, e.g. ["M-1", "F-1"] */
  visaTypes: string[];
  /** On-site student housing */
  dormitory?: boolean;
  /** A Designated Pilot Examiner works on site */
  dpeOnSite?: boolean;
  inHouseMaintenance?: boolean;
  /** Free-text opening hours as published by the school */
  hours?: string;
  /** Street address of the school's office/hangar */
  address?: string;
  /**
   * Training the school offers that has no entry in the programs / aircraft
   * catalogs yet (rotary wing, glider, simulator classes, Part 107 ...).
   */
  trainingTags: string[];
};

export type Review = {
  id: string;
  schoolId: string;
  /** Links to users.id */
  userId: string;
  /** Overall 1–5 star rating */
  overall: number;
  /** Subcategory ratings 1–5 */
  customerService: number;
  instructors: number;
  aircraft: number;
  availability: number;
  facilities: number;
  body: string;
  createdAt: string; // ISO date string
};

export type Comment = {
  id: string;
  /** Links to reviews.id */
  reviewId: string;
  /** Links to users.id */
  userId: string;
  body: string;
  createdAt: string; // ISO date string
};

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type LeadStatus = "new" | "contacted" | "closed";

/** A "Request information" submission from a school page (see submit_lead in the DB) */
export type Lead = {
  id: string;
  /** null once the school has been removed — the lead is kept as a record */
  schoolId: string | null;
  name: string;
  email: string;
  phone: string;
  programSlug?: string;
  message: string;
  /** Same-site path the form was submitted from */
  sourcePath: string;
  status: LeadStatus;
  createdAt: string;
};

/** A raw "Add Your Flight School" form submission awaiting admin review */
export type SchoolSubmission = {
  id: string;
  /** auth.users id of the submitter */
  submittedBy: string;
  status: SubmissionStatus;
  name: string;
  description: string;
  website: string;
  phone: string;
  /** Free-text ICAO code as entered — resolved to an airport on approval */
  airportCode: string;
  /** Free-text city/state as entered — resolved to slugs on approval */
  city: string;
  state: string;
  faaPart?: "61" | "141" | "both";
  /** Program slugs from the programs catalog */
  programs: string[];
  estimatedPlanes?: FleetRange;
  estimatedInstructors?: FleetRange;
  contacts: ContactPerson[];
  createdAt: string;
};

/** Claims move through the same three states as submissions. */
export type ClaimStatus = SubmissionStatus;

/** A request to manage a listing, awaiting or carrying an admin decision */
export type SchoolClaim = {
  id: string;
  schoolId: string;
  /** auth.users id of the claimant */
  userId: string;
  status: ClaimStatus;
  /** The claimant's role at the school, e.g. "Chief Flight Instructor" */
  roleTitle: string;
  message: string;
  /**
   * Where the claimant can be reached at the school. Evidence for the admin
   * review — compared against the listing's website domain — not a login.
   */
  workEmail: string;
  /** auth.users id of the deciding admin; unset while pending */
  decidedBy?: string;
  decidedAt?: string;
  createdAt: string;
};

/** Suggestions move through the same three states as claims. */
export type SuggestionStatus = SubmissionStatus;

/**
 * A member's proposed correction to one listing field, awaiting or carrying
 * an admin decision. Approved rows are the contribution record behind the
 * profile's "approved corrections" count.
 */
export type SchoolSuggestion = {
  id: string;
  schoolId: string;
  /** auth.users id of the member who filed it */
  userId: string;
  field: SuggestionField;
  /** What the member proposes: text, or a contact list for `contacts` */
  proposedValue: SuggestionValue;
  /** What the listing showed when the suggestion was filed */
  currentValue: SuggestionValue;
  reason: SuggestionReason;
  note: string;
  status: SuggestionStatus;
  /** auth.users id of the deciding admin; unset while pending */
  decidedBy?: string;
  decidedAt?: string;
  /** What was written on approval — may differ from proposedValue if the admin edited it */
  appliedValue?: SuggestionValue;
  createdAt: string;
};

/**
 * An in-app notification about an ownership change. Named AppNotification
 * because `Notification` is a DOM global.
 */
export type AppNotification = {
  id: string;
  /** auth.users id of the recipient */
  userId: string;
  type: NotificationType;
  /** null once the school has been removed — the notice is kept */
  schoolId: string | null;
  title: string;
  body: string;
  /** Same-site path the notification links to */
  href: string;
  /** Unset while unread */
  readAt?: string;
  createdAt: string;
};

export type UserRole = "user" | "admin";

export type User = {
  /** 7-character random ID — used as the profile URL segment: /profile/[id] */
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  /** ISO date string */
  joinedAt: string;
  bio?: string;
  /** Program slugs from the programs catalog — certificates/ratings the user holds */
  pilotCertificates?: string[];
};
