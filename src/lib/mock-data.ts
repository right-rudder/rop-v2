// Catalog data used by scripts/generate-seed.ts to produce supabase/seed.sql.
// The app itself reads from Supabase (src/lib/data.ts).
import type { State, City, Airport, FlightSchool, Program, TrainerAircraft } from "./types";

// ── States (all 50) ────────────────────────────────────────────────────────────
// schoolCount / airportCount are denormalized display values.
// In Phase 2 these will be computed from live DB rows.
export const states: State[] = [
  { id: "al", name: "Alabama",        slug: "alabama",        abbreviation: "AL", schoolCount: 14, airportCount:  9 },
  { id: "ak", name: "Alaska",         slug: "alaska",         abbreviation: "AK", schoolCount: 22, airportCount: 45 },
  { id: "az", name: "Arizona",        slug: "arizona",        abbreviation: "AZ", schoolCount: 18, airportCount: 13 },
  { id: "ar", name: "Arkansas",       slug: "arkansas",       abbreviation: "AR", schoolCount:  8, airportCount:  6 },
  { id: "ca", name: "California",     slug: "california",     abbreviation: "CA", schoolCount: 48, airportCount: 28 },
  { id: "co", name: "Colorado",       slug: "colorado",       abbreviation: "CO", schoolCount: 19, airportCount: 16 },
  { id: "ct", name: "Connecticut",    slug: "connecticut",    abbreviation: "CT", schoolCount:  7, airportCount:  5 },
  { id: "de", name: "Delaware",       slug: "delaware",       abbreviation: "DE", schoolCount:  4, airportCount:  3 },
  { id: "fl", name: "Florida",        slug: "florida",        abbreviation: "FL", schoolCount: 42, airportCount: 24 },
  { id: "ga", name: "Georgia",        slug: "georgia",        abbreviation: "GA", schoolCount: 17, airportCount: 11 },
  { id: "hi", name: "Hawaii",         slug: "hawaii",         abbreviation: "HI", schoolCount:  9, airportCount:  7 },
  { id: "id", name: "Idaho",          slug: "idaho",          abbreviation: "ID", schoolCount: 10, airportCount:  9 },
  { id: "il", name: "Illinois",       slug: "illinois",       abbreviation: "IL", schoolCount: 16, airportCount: 12 },
  { id: "in", name: "Indiana",        slug: "indiana",        abbreviation: "IN", schoolCount: 11, airportCount:  8 },
  { id: "ia", name: "Iowa",           slug: "iowa",           abbreviation: "IA", schoolCount:  9, airportCount:  7 },
  { id: "ks", name: "Kansas",         slug: "kansas",         abbreviation: "KS", schoolCount: 12, airportCount: 10 },
  { id: "ky", name: "Kentucky",       slug: "kentucky",       abbreviation: "KY", schoolCount: 10, airportCount:  7 },
  { id: "la", name: "Louisiana",      slug: "louisiana",      abbreviation: "LA", schoolCount: 11, airportCount:  8 },
  { id: "me", name: "Maine",          slug: "maine",          abbreviation: "ME", schoolCount:  7, airportCount:  6 },
  { id: "md", name: "Maryland",       slug: "maryland",       abbreviation: "MD", schoolCount:  9, airportCount:  7 },
  { id: "ma", name: "Massachusetts",  slug: "massachusetts",  abbreviation: "MA", schoolCount: 12, airportCount:  8 },
  { id: "mi", name: "Michigan",       slug: "michigan",       abbreviation: "MI", schoolCount: 18, airportCount: 13 },
  { id: "mn", name: "Minnesota",      slug: "minnesota",      abbreviation: "MN", schoolCount: 16, airportCount: 14 },
  { id: "ms", name: "Mississippi",    slug: "mississippi",    abbreviation: "MS", schoolCount:  8, airportCount:  6 },
  { id: "mo", name: "Missouri",       slug: "missouri",       abbreviation: "MO", schoolCount: 14, airportCount: 10 },
  { id: "mt", name: "Montana",        slug: "montana",        abbreviation: "MT", schoolCount: 11, airportCount: 12 },
  { id: "ne", name: "Nebraska",       slug: "nebraska",       abbreviation: "NE", schoolCount:  8, airportCount:  7 },
  { id: "nv", name: "Nevada",         slug: "nevada",         abbreviation: "NV", schoolCount: 11, airportCount:  8 },
  { id: "nh", name: "New Hampshire",  slug: "new-hampshire",  abbreviation: "NH", schoolCount:  6, airportCount:  5 },
  { id: "nj", name: "New Jersey",     slug: "new-jersey",     abbreviation: "NJ", schoolCount: 11, airportCount:  7 },
  { id: "nm", name: "New Mexico",     slug: "new-mexico",     abbreviation: "NM", schoolCount:  9, airportCount:  8 },
  { id: "ny", name: "New York",       slug: "new-york",       abbreviation: "NY", schoolCount: 28, airportCount: 18 },
  { id: "nc", name: "North Carolina", slug: "north-carolina", abbreviation: "NC", schoolCount: 18, airportCount: 13 },
  { id: "nd", name: "North Dakota",   slug: "north-dakota",   abbreviation: "ND", schoolCount:  7, airportCount:  8 },
  { id: "oh", name: "Ohio",           slug: "ohio",           abbreviation: "OH", schoolCount: 19, airportCount: 13 },
  { id: "ok", name: "Oklahoma",       slug: "oklahoma",       abbreviation: "OK", schoolCount: 13, airportCount: 11 },
  { id: "or", name: "Oregon",         slug: "oregon",         abbreviation: "OR", schoolCount: 14, airportCount: 11 },
  { id: "pa", name: "Pennsylvania",   slug: "pennsylvania",   abbreviation: "PA", schoolCount: 21, airportCount: 14 },
  { id: "ri", name: "Rhode Island",   slug: "rhode-island",   abbreviation: "RI", schoolCount:  4, airportCount:  2 },
  { id: "sc", name: "South Carolina", slug: "south-carolina", abbreviation: "SC", schoolCount: 11, airportCount:  8 },
  { id: "sd", name: "South Dakota",   slug: "south-dakota",   abbreviation: "SD", schoolCount:  7, airportCount:  6 },
  { id: "tn", name: "Tennessee",      slug: "tennessee",      abbreviation: "TN", schoolCount: 15, airportCount: 10 },
  { id: "tx", name: "Texas",          slug: "texas",          abbreviation: "TX", schoolCount: 52, airportCount: 38 },
  { id: "ut", name: "Utah",           slug: "utah",           abbreviation: "UT", schoolCount: 13, airportCount:  9 },
  { id: "vt", name: "Vermont",        slug: "vermont",        abbreviation: "VT", schoolCount:  5, airportCount:  4 },
  { id: "va", name: "Virginia",       slug: "virginia",       abbreviation: "VA", schoolCount: 16, airportCount: 10 },
  { id: "wa", name: "Washington",     slug: "washington",     abbreviation: "WA", schoolCount: 20, airportCount: 14 },
  { id: "wv", name: "West Virginia",  slug: "west-virginia",  abbreviation: "WV", schoolCount:  7, airportCount:  5 },
  { id: "wi", name: "Wisconsin",      slug: "wisconsin",      abbreviation: "WI", schoolCount: 14, airportCount: 11 },
  { id: "wy", name: "Wyoming",        slug: "wyoming",        abbreviation: "WY", schoolCount:  8, airportCount:  8 },
];

// ── Cities ─────────────────────────────────────────────────────────────────────
// Only cities that have airports/schools in mock data.
// nearbyCitySlugs creates the metro-area web (can cross state lines).
export const cities: City[] = [
  // Arizona — Phoenix metro
  { id: "az-mesa",        name: "Mesa",           slug: "mesa",           stateSlug: "arizona",    stateAbbreviation: "AZ", nearbyCitySlugs: ["phoenix", "scottsdale", "chandler", "tempe"] },
  { id: "az-phoenix",     name: "Phoenix",        slug: "phoenix",        stateSlug: "arizona",    stateAbbreviation: "AZ", nearbyCitySlugs: ["mesa", "scottsdale", "chandler", "tempe"] },
  { id: "az-scottsdale",  name: "Scottsdale",     slug: "scottsdale",     stateSlug: "arizona",    stateAbbreviation: "AZ", nearbyCitySlugs: ["mesa", "phoenix", "tempe"] },
  { id: "az-chandler",    name: "Chandler",       slug: "chandler",       stateSlug: "arizona",    stateAbbreviation: "AZ", nearbyCitySlugs: ["mesa", "phoenix", "tempe"] },
  { id: "az-tempe",       name: "Tempe",          slug: "tempe",          stateSlug: "arizona",    stateAbbreviation: "AZ", nearbyCitySlugs: ["mesa", "phoenix", "scottsdale", "chandler"] },
  { id: "az-tucson",      name: "Tucson",         slug: "tucson",         stateSlug: "arizona",    stateAbbreviation: "AZ", nearbyCitySlugs: [] },

  // Illinois — St. Louis metro (cross-state: Belleville IL ↔ St. Louis MO)
  { id: "il-belleville",  name: "Belleville",     slug: "belleville",     stateSlug: "illinois",   stateAbbreviation: "IL", nearbyCitySlugs: ["st-louis"] },

  // Missouri
  { id: "mo-st-louis",    name: "St. Louis",      slug: "st-louis",       stateSlug: "missouri",   stateAbbreviation: "MO", nearbyCitySlugs: ["belleville"] },
  { id: "mo-kc",          name: "Kansas City",    slug: "kansas-city",    stateSlug: "missouri",   stateAbbreviation: "MO", nearbyCitySlugs: ["overland-park"] },

  // Kansas — Kansas City metro (cross-state: Kansas City MO ↔ Overland Park KS)
  { id: "ks-overland",    name: "Overland Park",  slug: "overland-park",  stateSlug: "kansas",     stateAbbreviation: "KS", nearbyCitySlugs: ["kansas-city"] },

  // Florida — Miami metro
  { id: "fl-miami",       name: "Miami",          slug: "miami",          stateSlug: "florida",    stateAbbreviation: "FL", nearbyCitySlugs: ["pembroke-pines", "fort-lauderdale"] },
  { id: "fl-pp",          name: "Pembroke Pines", slug: "pembroke-pines", stateSlug: "florida",    stateAbbreviation: "FL", nearbyCitySlugs: ["miami", "fort-lauderdale"] },
  { id: "fl-ftl",         name: "Fort Lauderdale",slug: "fort-lauderdale",stateSlug: "florida",    stateAbbreviation: "FL", nearbyCitySlugs: ["miami", "pembroke-pines"] },

  // California
  { id: "ca-san-diego",   name: "San Diego",      slug: "san-diego",      stateSlug: "california", stateAbbreviation: "CA", nearbyCitySlugs: [] },
  { id: "ca-los-angeles", name: "Los Angeles",    slug: "los-angeles",    stateSlug: "california", stateAbbreviation: "CA", nearbyCitySlugs: [] },

  // Tennessee
  { id: "tn-nashville",   name: "Nashville",      slug: "nashville",      stateSlug: "tennessee",  stateAbbreviation: "TN", nearbyCitySlugs: [] },
  { id: "tn-chattanooga", name: "Chattanooga",    slug: "chattanooga",    stateSlug: "tennessee",  stateAbbreviation: "TN", nearbyCitySlugs: [] },
];

// ── Airports ───────────────────────────────────────────────────────────────────
// All three identifiers (ICAO, IATA, FAA LID) must be searchable.
// URL slug uses lowercase ICAO (e.g. /airports/kffz).
// Falcon Field example: KFFZ (ICAO), MSC (IATA), FFZ (FAA LID)
export const airports: Airport[] = [
  // Arizona
  { id: "kffz", name: "Falcon Field Airport",               citySlug: "mesa",           stateSlug: "arizona",    icao: "KFFZ", iata: "MSC",  faaLid: "FFZ",
    coords: { lat: 33.4608, lng: -111.7283 },
    description: "Falcon Field Airport (KFFZ) in Mesa, Arizona is one of the busiest general aviation airports in the United States. Originally built as a World War II training base for British RAF pilots, the airport today serves a thriving community of flight schools, charter operators, and private pilots. Its uncongested airspace, 300+ days of sunshine per year, and proximity to the Phoenix metro make it an ideal location for year-round flight training from first solo through advanced ratings." },
  { id: "kdvt", name: "Phoenix Deer Valley Airport",         citySlug: "phoenix",        stateSlug: "arizona",    icao: "KDVT", iata: null,   faaLid: "DVT",
    coords: { lat: 33.6883, lng: -112.0826 },
    description: "Phoenix Deer Valley Airport (KDVT) is one of the nation's busiest single-runway general aviation airports, handling hundreds of operations daily in the northwest Phoenix metro. The airport's Class D airspace and pattern-intensive environment give student pilots exceptional radio communication and traffic-awareness experience early in their training. Excellent VFR weather, a modern terminal, and multiple flight school tenants make KDVT a top choice for Private Pilot through CFI training." },
  { id: "kphx", name: "Phoenix Sky Harbor International",    citySlug: "phoenix",        stateSlug: "arizona",    icao: "KPHX", iata: "PHX",  faaLid: "PHX",
    coords: { lat: 33.4373, lng: -112.0078 },
    description: "Phoenix Sky Harbor International Airport (KPHX) is the primary commercial service airport for the greater Phoenix metropolitan area and one of the busiest airports in the American Southwest. As a Class B airport, it serves as an important navigational reference and airspace boundary for student pilots training at nearby GA fields. Some advanced and instrument-rated training programs conduct Class B transition flights out of KPHX to give students real-world experience in complex, high-traffic airspace." },
  { id: "kchd", name: "Chandler Municipal Airport",          citySlug: "chandler",       stateSlug: "arizona",    icao: "KCHD", iata: null,   faaLid: "CHD",
    coords: { lat: 33.2691, lng: -111.8110 },
    description: "Chandler Municipal Airport (KCHD) is a general aviation reliever airport in the southeast Phoenix metro. With minimal commercial traffic and a relaxed pattern environment, KCHD is well-suited for primary flight training. The airport sits within easy flying distance of several practice areas in the Sonoran Desert and benefits from the same 300+ days of VFR weather that makes the entire Phoenix metro a pilot-training hub." },
  { id: "ktus", name: "Tucson International Airport",        citySlug: "tucson",         stateSlug: "arizona",    icao: "KTUS", iata: "TUS",  faaLid: "TUS",
    coords: { lat: 32.1161, lng: -110.9410 },
    description: "Tucson International Airport (KTUS) serves both commercial airline traffic and a robust general aviation community in southern Arizona. Situated at roughly 2,600 feet MSL with consistent desert VFR conditions, KTUS is home to several flight training programs that leverage the region's clear skies and diverse terrain — from desert flatlands to mountain ridges — for well-rounded pilot development. Instrument students benefit from the full suite of ILS, RNAV, and VOR approaches serving the airport." },

  // Illinois (St. Louis metro — airport is in Belleville, IL but serves St. Louis, MO)
  { id: "kcps", name: "St. Louis Downtown Airport",          citySlug: "belleville",     stateSlug: "illinois",   icao: "KCPS", iata: "CPS",  faaLid: "CPS",
    coords: { lat: 38.5707, lng: -90.1562 },
    description: "St. Louis Downtown Airport (KCPS), located in Belleville, Illinois, is a general aviation reliever airport serving the greater St. Louis metro area. Despite its Illinois address, KCPS functions as a practical training hub for pilots from both sides of the Mississippi River. Its relatively quiet pattern and proximity to St. Louis Lambert's Class B airspace give student pilots valuable exposure to complex airspace transitions while keeping training costs manageable at a non-commercial field." },

  // Missouri
  { id: "kstl", name: "St. Louis Lambert International",     citySlug: "st-louis",       stateSlug: "missouri",   icao: "KSTL", iata: "STL",  faaLid: "STL",
    coords: { lat: 38.7487, lng: -90.3700 },
    description: "St. Louis Lambert International Airport (KSTL) is Missouri's largest and busiest airport, anchoring the St. Louis metro's aviation infrastructure. As a Class B facility with multiple parallel runways and a full ILS/RNAV approach suite, KSTL is the benchmark airspace environment for instrument-rated pilots training in the region. Flight schools operating here give students unparalleled exposure to real-world ATC communication and commercial traffic procedures in a major hub environment." },
  { id: "kmkc", name: "Charles B. Wheeler Downtown Airport", citySlug: "kansas-city",    stateSlug: "missouri",   icao: "KMKC", iata: "MKC",  faaLid: "MKC",
    coords: { lat: 39.1232, lng: -94.5928 },
    description: "Charles B. Wheeler Downtown Airport (KMKC) sits along the Missouri River just north of downtown Kansas City, offering a uniquely urban backdrop for general aviation training. The airport features Class D airspace and sits comfortably clear of Kansas City International's Class B, making it an ideal base for primary training with convenient access to practice areas and cross-country routes across the Great Plains. Its downtown location means easy access for Kansas City-area students." },

  // Kansas
  { id: "kojc", name: "Johnson County Executive Airport",    citySlug: "overland-park",  stateSlug: "kansas",     icao: "KOJC", iata: "OJC",  faaLid: "OJC",
    coords: { lat: 38.8476, lng: -94.7376 },
    description: "Johnson County Executive Airport (KOJC) in Overland Park, Kansas is a modern GA reliever airport serving the prosperous Kansas side of the Kansas City metro. With a well-maintained runway, instrument approaches, and a growing roster of flight school tenants, KOJC is the go-to training airport for students in Johnson County and the surrounding suburbs. Its Class D airspace and active pattern traffic give trainees solid radio discipline and situational awareness from their earliest lessons." },
  { id: "kixd", name: "New Century Aircenter",               citySlug: "overland-park",  stateSlug: "kansas",     icao: "KIXD", iata: null,   faaLid: "IXD",
    coords: { lat: 38.8309, lng: -94.8903 },
    description: "New Century Aircenter (KIXD) is a general aviation airport located southwest of the Kansas City metro near Gardner, Kansas. Originally built as Olathe Naval Air Station, the airport retains wide runways and excellent facilities suited to both primary training and complex/high-performance operations. Its non-towered environment and multiple runways offer student pilots flexibility in pattern work, while the relatively light traffic density provides a confidence-building setting for solo and cross-country flights." },

  // Florida
  { id: "kfxe", name: "Fort Lauderdale Executive Airport",   citySlug: "fort-lauderdale",stateSlug: "florida",    icao: "KFXE", iata: "FXE",  faaLid: "FXE",
    coords: { lat: 26.1973, lng: -80.1707 },
    description: "Fort Lauderdale Executive Airport (KFXE) is one of the premier general aviation airports in South Florida, handling a mix of private jets, charter turboprops, and flight school traffic in Broward County. The airport's Class D airspace, year-round VMC weather, and proximity to both Miami's Class B and the Atlantic coast make it an outstanding environment for building diverse pilot experience. Multiple FAA-certificated flight schools call KFXE home, offering training from PPL through ATP in one of the country's most active GA markets." },
  { id: "kopf", name: "Miami-Opa Locka Executive Airport",   citySlug: "miami",          stateSlug: "florida",    icao: "KOPF", iata: "OPF",  faaLid: "OPF",
    coords: { lat: 25.9070, lng: -80.2784 },
    description: "Miami-Opa Locka Executive Airport (KOPF) is a busy general aviation reliever airport serving the northern Miami-Dade area. Situated just outside Miami's Class B airspace, KOPF gives student pilots immediate access to one of the nation's most complex airspace environments while training in a more manageable tower-controlled setting. Year-round tropical VFR conditions and a diverse surrounding landscape — coast, Everglades, and urban corridor — make for a rich and varied training experience." },
  { id: "kpmp", name: "Pompano Beach Airpark",               citySlug: "pembroke-pines", stateSlug: "florida",    icao: "KPMP", iata: "PMP",  faaLid: "PMP",
    coords: { lat: 26.2471, lng: -80.1111 },
    description: "Pompano Beach Airpark (KPMP) is a general aviation airport in Broward County, Florida, ideally positioned between Fort Lauderdale and Boca Raton. With a non-towered environment, a single active runway, and consistent South Florida VFR weather, KPMP is a popular base for primary and multi-engine flight training. Student pilots here quickly become comfortable with self-announce procedures and uncontrolled pattern operations — skills that translate directly to real-world cross-country flying." },

  // California
  { id: "kmyf", name: "Montgomery-Gibbs Executive Airport",  citySlug: "san-diego",      stateSlug: "california", icao: "KMYF", iata: "MYF",  faaLid: "MYF",
    coords: { lat: 32.8157, lng: -117.1396 },
    description: "Montgomery-Gibbs Executive Airport (KMYF) is San Diego's busiest general aviation airport, located in the Mission Hills area just eight miles northeast of downtown. Its Class D airspace, coastal proximity, and mild year-round weather create an exceptional training environment where students fly over Pacific beaches, mountains, and desert terrain within a single lesson. KMYF hosts numerous flight training programs and benefits from San Diego's remarkably consistent VFR conditions, averaging fewer IFR days per year than almost any major metro in the country." },
  { id: "kcrq", name: "McClellan-Palomar Airport",           citySlug: "san-diego",      stateSlug: "california", icao: "KCRQ", iata: "CLD",  faaLid: "CLD",
    coords: { lat: 33.1283, lng: -117.2802 },
    description: "McClellan-Palomar Airport (KCRQ) in Carlsbad, California serves the north San Diego County coast and is one of Southern California's most active general aviation airports. The airport's tower-controlled environment, ILS approach, and proximity to both LAX and SAN Class B airspace give students valuable experience navigating complex SoCal airspace. Marine-layer mornings followed by clear afternoons mean IFR students get genuine IMC exposure while VFR students enjoy some of the best cross-country flying conditions in the western United States." },
  { id: "klax", name: "Los Angeles International Airport",   citySlug: "los-angeles",    stateSlug: "california", icao: "KLAX", iata: "LAX",  faaLid: "LAX",
    coords: { lat: 33.9425, lng: -118.4081 },
    description: "Los Angeles International Airport (KLAX) is one of the world's busiest airports and the primary commercial aviation gateway to Southern California. As a Class B airport with multiple parallel runways and extraordinarily dense ATC traffic, KLAX itself is not a typical flight training base — but it forms the centerpiece of the LA Basin's complex airspace that every SoCal instrument student must learn to navigate. Advanced and instrument-rated training programs regularly conduct Class B operations and approaches into KLAX to give students authentic high-workload flight experience." },

  // Tennessee
  { id: "kbna", name: "Nashville International Airport",     citySlug: "nashville",      stateSlug: "tennessee",  icao: "KBNA", iata: "BNA",  faaLid: "BNA",
    coords: { lat: 36.1245, lng: -86.6782 },
    description: "Nashville International Airport (KBNA) is Tennessee's busiest airport, serving both commercial airline traffic and a growing general aviation community in the heart of Middle Tennessee. The airport's Class C airspace, multiple instrument approaches, and diverse surrounding terrain — rolling hills, river valleys, and open farmland — make it an excellent environment for instrument and commercial training. Flight schools operating at KBNA give students real-world exposure to ATC procedures at a major regional hub without the complexity of a full Class B facility." },
  { id: "kcha", name: "Chattanooga Metropolitan Airport",    citySlug: "chattanooga",    stateSlug: "tennessee",  icao: "KCHA", iata: "CHA",  faaLid: "CHA",
    coords: { lat: 35.0353, lng: -85.2038 },
    description: "Chattanooga Metropolitan Airport (KCHA) serves the greater Chattanooga area in the scenic Tennessee River valley, flanked by Lookout Mountain and the ridges of the southern Appalachians. The airport's Class C airspace and mix of commercial and GA traffic give student pilots meaningful ATC interaction in a less overwhelming environment than a major hub. The surrounding mountain terrain provides outstanding cross-country and instrument training routes, and the relatively mild four-season climate allows for solid year-round training schedules." },
];

// ── Programs ───────────────────────────────────────────────────────────────────
// Canonical list of certificates, ratings, and endorsements offered by schools.
// Flight schools reference these via programSlugs[].
export const programs: Program[] = [
  {
    id: "private-pilot",
    slug: "private-pilot",
    name: "Private Pilot Certificate",
    shortName: "Private Pilot",
    sortOrder: 1,
    description:
      "The Private Pilot Certificate (PPL) is the entry-level certificate that allows you to act as pilot in command of an aircraft. Under FAR Part 61, you need a minimum of 40 flight hours; FAA-certificated Part 141 schools can complete training in as few as 35 hours. Training covers basic aircraft control, navigation, cross-country planning, night flying, and emergency procedures. Upon completion you'll pass both a written knowledge exam and a practical checkride with an FAA-designated pilot examiner.",
    faaPart: "both",
    minimumHours: 40,
    certificate: "FAA Private Pilot Certificate",
    prerequisites: [],
    typicalDuration: "6–12 months",
  },
  {
    id: "instrument-rating",
    slug: "instrument-rating",
    name: "Instrument Rating",
    shortName: "Instrument Rating",
    sortOrder: 3,
    description:
      "The Instrument Rating (IR) allows you to fly in instrument meteorological conditions (IMC) — clouds, fog, and low visibility — using only cockpit instruments. Requirements under Part 61 include 50 hours of cross-country PIC time and 40 hours of actual or simulated instrument flight. The rating dramatically increases both the utility and safety of your certificate by enabling legal flight in challenging weather and into airports served by ILS and RNAV approaches.",
    faaPart: "both",
    minimumHours: 40,
    certificate: "FAA Instrument Rating",
    prerequisites: ["private-pilot"],
    typicalDuration: "3–6 months",
  },
  {
    id: "commercial-pilot",
    slug: "commercial-pilot",
    name: "Commercial Pilot Certificate",
    shortName: "Commercial Pilot",
    sortOrder: 4,
    description:
      "The Commercial Pilot Certificate (CPL) authorizes you to be compensated for flying. Under Part 61, the minimums are 250 total flight hours including specific cross-country, instrument, and complex aircraft time. A commercial certificate is a prerequisite for most aviation careers — flight instruction, charter, cargo, and airline employment all require it at minimum as a stepping stone.",
    faaPart: "both",
    minimumHours: 250,
    certificate: "FAA Commercial Pilot Certificate",
    prerequisites: ["private-pilot", "instrument-rating"],
    typicalDuration: "12–24 months",
  },
  {
    id: "cfi",
    slug: "cfi",
    name: "Certified Flight Instructor",
    shortName: "CFI",
    sortOrder: 5,
    description:
      "The Certified Flight Instructor (CFI) certificate is the primary pathway for new commercial pilots to build flight hours. As a CFI, you are authorized to provide flight instruction and sign off student logbooks. Most regional airline-bound pilots log the bulk of their 1,500 ATP hours in the right seat of a trainer. The CFI practical test is considered one of the most demanding in aviation, covering deep aeronautical knowledge and teaching ability.",
    faaPart: "both",
    certificate: "FAA Flight Instructor Certificate",
    prerequisites: ["commercial-pilot"],
    typicalDuration: "2–4 months",
  },
  {
    id: "cfii",
    slug: "cfii",
    name: "Certified Flight Instructor – Instrument",
    shortName: "CFII",
    sortOrder: 6,
    description:
      "The CFII add-on authorizes flight instructors to provide instrument flight instruction and conduct instrument proficiency checks. Requires an active CFI certificate plus an Instrument Rating. Many flight schools prefer instructors who hold both CFI and CFII ratings to handle the full range of their student curriculum.",
    faaPart: "both",
    certificate: "FAA Flight Instructor Certificate – Instrument",
    prerequisites: ["cfi", "instrument-rating"],
    typicalDuration: "1–2 months",
  },
  {
    id: "mei",
    slug: "mei",
    name: "Multi-Engine Instructor",
    shortName: "MEI",
    sortOrder: 6.5,
    description:
      "The Multi-Engine Instructor (MEI) rating is an add-on to the CFI certificate that authorizes providing flight instruction in multi-engine aircraft. Candidates must already hold a CFI certificate and a multi-engine rating. Training focuses on teaching engine-out procedures, asymmetric thrust management, and the systems knowledge unique to light twins. The MEI is a valuable credential for instructors at schools with multi-engine training programs and is a common step on the path toward turbine and airline employment.",
    faaPart: "both",
    certificate: "Multi-Engine Instructor Rating (added to CFI certificate)",
    prerequisites: ["cfi", "multi-engine"],
    typicalDuration: "1–2 weeks",
  },
  {
    id: "multi-engine",
    slug: "multi-engine",
    name: "Multi-Engine Rating",
    shortName: "Multi-Engine",
    sortOrder: 7,
    description:
      "The Multi-Engine Rating (MEL) is an add-on rating that authorizes operation of aircraft with more than one engine. It does not require a minimum number of flight hours — practical performance standards are the measure. Training focuses on asymmetric thrust management, engine-out procedures, systems knowledge, and the V-speed profiles unique to multi-engine aircraft. Most commercial and airline training tracks include a multi-engine rating.",
    faaPart: "both",
    certificate: "Multi-Engine Rating (added to existing certificate)",
    prerequisites: ["private-pilot"],
    typicalDuration: "1–3 weeks",
  },
  {
    id: "atp",
    slug: "atp",
    name: "Airline Transport Pilot Certificate",
    shortName: "ATP",
    sortOrder: 8,
    description:
      "The Airline Transport Pilot (ATP) certificate is the highest level of FAA pilot certification and is required to serve as captain (PIC) of a Part 121 airliner. Under current FAA regulations, most candidates need 1,500 total flight hours, though military-trained pilots qualify at 750 hours and Part 141 graduates qualify at 1,000 hours. ATP candidates must hold a commercial certificate and instrument rating, pass the ATP written exam, and complete the ATP Certification Training Program (ATP CTP) before the checkride.",
    faaPart: "both",
    minimumHours: 1500,
    certificate: "FAA Airline Transport Pilot Certificate",
    prerequisites: ["commercial-pilot", "instrument-rating"],
    typicalDuration: "Depends on total flight hours accumulated",
  },
  {
    id: "sport-pilot",
    slug: "sport-pilot",
    name: "Sport Pilot Certificate",
    shortName: "Sport Pilot",
    sortOrder: 2,
    description:
      "The Sport Pilot Certificate allows pilots to fly Light Sport Aircraft (LSA) — aircraft limited to a max gross weight of 1,320 lbs and two seats. Training minimums are 20 hours, and the certificate requires only a valid U.S. driver's license as a medical requirement, making it accessible to many applicants who cannot obtain a standard FAA medical certificate. Sport pilot is an efficient path for recreational flying without the full PPL commitment.",
    faaPart: "both",
    minimumHours: 20,
    certificate: "FAA Sport Pilot Certificate",
    prerequisites: [],
    typicalDuration: "3–6 months",
  },
  {
    id: "discovery-flight",
    slug: "discovery-flight",
    name: "Discovery Flight",
    shortName: "Discovery Flight",
    sortOrder: 9,
    description:
      "A discovery flight is an introductory lesson designed for people curious about learning to fly. Typically 30–60 minutes, you'll take the controls under the supervision of a CFI and experience the basics of aircraft control firsthand. Discovery flights are offered by most flight schools, often at a discounted introductory rate, and count as your first logbook entry if you later pursue a certificate.",
    typicalDuration: "30–60 minutes",
  },
  {
    id: "ground-school",
    slug: "ground-school",
    name: "Ground School",
    shortName: "Ground School",
    sortOrder: 10,
    description:
      "Ground school covers the academic knowledge required to pass FAA written knowledge exams. Topics include aerodynamics, aircraft systems, weather, navigation, FARs and AIM, and airspace. Ground school may be delivered in-person at a flight school, online, or as part of an accelerated weekend course. Many flight schools recommend completing ground school concurrently with or before beginning flight training for maximum efficiency.",
    typicalDuration: "4–12 weeks",
  },
  {
    id: "seaplane-rating",
    slug: "seaplane-rating",
    name: "Seaplane Rating",
    shortName: "Seaplane Rating",
    sortOrder: 11,
    description:
      "The Seaplane (Single-Engine Sea, SES) rating is an add-on to your existing certificate that authorizes flight in floatplanes and flying boats. Training covers water operations, docking, step taxi, glassy water landings, and takeoff/landing technique unique to amphibious and floatplane aircraft. The rating has no hour minimum and can be completed in as few as 5–10 hours at a seaplane base.",
    certificate: "Seaplane Rating (added to existing certificate)",
    prerequisites: ["private-pilot"],
    typicalDuration: "2–5 days",
  },
  {
    id: "tailwheel",
    slug: "tailwheel",
    name: "Tailwheel Endorsement",
    shortName: "Tailwheel",
    sortOrder: 12,
    description:
      "The tailwheel (conventional landing gear) endorsement authorizes flight in aircraft where the third wheel is at the tail rather than the nose. Tailwheel aircraft require more precise ground handling technique due to their tendency toward ground loops. The endorsement requires demonstration of normal and crosswind takeoffs and landings, and wheel landings to the satisfaction of a CFI. No minimum hours are required.",
    certificate: "Tailwheel Endorsement (logbook entry)",
    prerequisites: ["private-pilot"],
    typicalDuration: "1–3 days",
  },
  {
    id: "high-performance",
    slug: "high-performance",
    name: "High Performance Endorsement",
    shortName: "High Performance",
    sortOrder: 13,
    description:
      "The high-performance endorsement is required before acting as PIC of any aircraft with an engine rated at more than 200 horsepower. Training focuses on the additional systems, speeds, and performance considerations of more powerful aircraft. Common aircraft requiring this endorsement include the Cessna 182 Skylane and Beechcraft Bonanza.",
    certificate: "High Performance Endorsement (logbook entry)",
    prerequisites: ["private-pilot"],
    typicalDuration: "1–2 days",
  },
  {
    id: "complex-endorsement",
    slug: "complex-endorsement",
    name: "Complex Aircraft Endorsement",
    shortName: "Complex",
    sortOrder: 14,
    description:
      "The complex aircraft endorsement is required before acting as PIC of any aircraft with retractable landing gear, flaps, AND a controllable-pitch propeller. It is required for Commercial Pilot training (FAR 61.129) unless using an Advanced Avionics Aircraft. Training covers retractable gear procedures, constant-speed propeller operation, emergency extension procedures, and appropriate V-speeds.",
    certificate: "Complex Aircraft Endorsement (logbook entry)",
    prerequisites: ["private-pilot"],
    typicalDuration: "1–2 days",
  },
];

// ── Trainer Aircraft ───────────────────────────────────────────────────────────
// Canonical list of common training aircraft.
// Flight schools reference these via aircraftSlugs[].
export const trainerAircraft: TrainerAircraft[] = [
  {
    id: "cessna-152",
    slug: "cessna-152",
    make: "Cessna",
    model: "152",
    sortOrder: 2,
    displayName: "Cessna 152",
    category: "single-engine",
    description:
      "The Cessna 152 is a two-seat, single-engine trainer that served as the backbone of American flight training from the late 1970s through the 1980s and remains widely used today. With a 110-horsepower Lycoming O-235 engine and docile handling characteristics, the 152 is ideal for primary training. Its lower operating cost compared to the Cessna 172 makes it a popular choice for solo practice and early dual instruction, particularly at schools focused on cost-efficient PPL training.",
    commonUse: ["private-pilot", "sport-pilot", "discovery-flight"],
    engineCount: 1,
    typicalCruise: "~107 knots",
  },
  {
    id: "cessna-172-skyhawk",
    slug: "cessna-172-skyhawk",
    make: "Cessna",
    model: "172 Skyhawk",
    sortOrder: 1,
    displayName: "Cessna 172 Skyhawk",
    category: "single-engine",
    description:
      "The Cessna 172 Skyhawk is the most produced and most widely flown aircraft in history, with over 44,000 built since 1956. Its high-wing design provides exceptional visibility, its stable flight characteristics build pilot confidence, and its four-seat capacity allows for instructors and passengers. The 172 is used across virtually every flight school in the United States for Private Pilot through Instrument Rating training, making it the universal benchmark for general aviation trainers.",
    commonUse: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi", "cfii", "discovery-flight"],
    engineCount: 1,
    typicalCruise: "~122 knots",
  },
  {
    id: "cessna-182-skylane",
    slug: "cessna-182-skylane",
    make: "Cessna",
    model: "182 Skylane",
    sortOrder: 3,
    displayName: "Cessna 182 Skylane",
    category: "single-engine",
    description:
      "The Cessna 182 Skylane is a four-seat, high-wing aircraft with a 230-horsepower fuel-injected Continental IO-470 or IO-540 engine. As a high-performance aircraft (>200 HP), it requires a separate FAA endorsement before acting as PIC. The Skylane's greater useful load, higher cruise speed, and constant-speed propeller make it a natural progression aircraft for students transitioning from the Cessna 172 to more complex and cross-country-capable platforms.",
    commonUse: ["commercial-pilot", "instrument-rating", "high-performance", "complex-endorsement"],
    engineCount: 1,
    typicalCruise: "~145 knots",
  },
  {
    id: "piper-pa28-cherokee",
    slug: "piper-pa28-cherokee",
    make: "Piper",
    model: "PA-28 Cherokee / Warrior / Archer",
    sortOrder: 4,
    displayName: "Piper PA-28 Cherokee",
    category: "single-engine",
    description:
      "The Piper PA-28 Cherokee (and its variants: Warrior, Archer, Arrow) is a low-wing, four-seat trainer that has competed with the Cessna 172 as one of the most popular primary trainers in American aviation. The low-wing configuration provides a different visual perspective for traffic avoidance and gives student pilots valuable experience in a platform similar to the majority of the world's airline fleet. Cherokee variants range from 140 to 180 horsepower, offering a progression path within the same aircraft family.",
    commonUse: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi", "discovery-flight"],
    engineCount: 1,
    typicalCruise: "~116 knots",
  },
  {
    id: "piper-pa44-seminole",
    slug: "piper-pa44-seminole",
    make: "Piper",
    model: "PA-44 Seminole",
    sortOrder: 9,
    displayName: "Piper PA-44 Seminole",
    category: "multi-engine",
    description:
      "The Piper PA-44 Seminole is the industry's most common multi-engine trainer, used by flight schools across the country to teach multi-engine ratings and provide commercial students with multi-engine PIC time. Its counter-rotating propeller system means neither engine is a \"critical engine\" during engine-out scenarios, and its light-twin handling characteristics provide a logical step up from single-engine trainers for airline-track students.",
    commonUse: ["multi-engine", "commercial-pilot", "atp", "cfi"],
    engineCount: 2,
    typicalCruise: "~163 knots",
  },
  {
    id: "beechcraft-duchess",
    slug: "beechcraft-duchess",
    make: "Beechcraft",
    model: "Duchess 76",
    sortOrder: 10,
    displayName: "Beechcraft Duchess",
    category: "multi-engine",
    description:
      "The Beechcraft Duchess (Model 76) is a four-seat, twin-engine trainer produced from 1978 to 1982 and commonly used at flight schools as an alternative to the Piper Seminole for multi-engine ratings. Like the Seminole, the Duchess features counter-rotating propellers and relatively benign handling characteristics well-suited to training. Its T-tail configuration and retractable landing gear also fulfill the requirements for the complex aircraft endorsement.",
    commonUse: ["multi-engine", "commercial-pilot", "complex-endorsement"],
    engineCount: 2,
    typicalCruise: "~155 knots",
  },
  {
    id: "beechcraft-baron-58",
    slug: "beechcraft-baron-58",
    make: "Beechcraft",
    model: "Baron 58",
    sortOrder: 11,
    displayName: "Beechcraft Baron 58",
    category: "multi-engine",
    description:
      "The Beechcraft Baron 58 is a six-seat, twin-engine aircraft powered by two Continental IO-520 or IO-550 engines producing 300 horsepower each. It represents the upper end of light-twin training, used at flight schools offering multi-engine commercial training and at ATP prep programs where students need multi-engine PIC time in a more capable platform. The Baron's higher performance and systems complexity provide excellent preparation for turboprop and jet type ratings.",
    commonUse: ["multi-engine", "commercial-pilot", "atp"],
    engineCount: 2,
    typicalCruise: "~200 knots",
  },
  {
    id: "diamond-da20",
    slug: "diamond-da20",
    make: "Diamond",
    model: "DA20",
    sortOrder: 5,
    displayName: "Diamond DA20",
    category: "single-engine",
    description:
      "The Diamond DA20 is a two-seat composite trainer manufactured by Diamond Aircraft Industries. Its T-tail, low-wing design and carbon fiber construction make it distinctive among primary trainers, and its aerobatic capabilities (certified in the utility category) allow some schools to offer basic aerobatics training. The DA20's modern design and excellent visibility from its canopy make it a popular choice for schools seeking an alternative to traditional Cessna/Piper designs for PPL training.",
    commonUse: ["private-pilot", "sport-pilot", "discovery-flight"],
    engineCount: 1,
    typicalCruise: "~108 knots",
  },
  {
    id: "diamond-da40",
    slug: "diamond-da40",
    make: "Diamond",
    model: "DA40 Diamond Star",
    sortOrder: 6,
    displayName: "Diamond DA40",
    category: "single-engine",
    description:
      "The Diamond DA40 Diamond Star is a four-seat, composite single-engine aircraft available with both piston and turbine powerplants. Its Garmin G1000 glass cockpit avionics suite is standard equipment on newer models, making it an excellent platform for building glass-cockpit proficiency alongside Private Pilot and Instrument Rating training. The DA40's efficient diesel engine option provides reduced operating costs relative to comparable Cessna/Piper platforms.",
    commonUse: ["private-pilot", "instrument-rating", "commercial-pilot"],
    engineCount: 1,
    typicalCruise: "~147 knots",
  },
  {
    id: "diamond-da42",
    slug: "diamond-da42",
    make: "Diamond",
    model: "DA42 Twin Star",
    sortOrder: 12,
    displayName: "Diamond DA42",
    category: "multi-engine",
    description:
      "The Diamond DA42 Twin Star is a four-seat, twin-engine diesel aircraft widely used in professional and accelerated flight training programs. Equipped with the Garmin G1000 glass cockpit, it bridges the gap between traditional light-twin training and modern airline-type systems. The DA42 is approved under Part 135 charter operations and is used by some ATP accelerated training programs as a multi-engine turbine-simulation platform.",
    commonUse: ["multi-engine", "instrument-rating", "commercial-pilot", "atp"],
    engineCount: 2,
    typicalCruise: "~178 knots",
  },
  {
    id: "cirrus-sr20",
    slug: "cirrus-sr20",
    make: "Cirrus",
    model: "SR20",
    sortOrder: 7,
    displayName: "Cirrus SR20",
    category: "single-engine",
    description:
      "The Cirrus SR20 is a four-seat composite aircraft with the Cirrus Airframe Parachute System (CAPS) — a whole-aircraft ballistic parachute deployable in emergencies. Its Garmin Perspective glass cockpit, side-stick controls, and overall modern design make it one of the most technologically advanced piston trainers available. Flight schools using the SR20 typically position it for advanced or accelerated training tracks where glass-cockpit proficiency and systems complexity are prioritized.",
    commonUse: ["private-pilot", "instrument-rating", "commercial-pilot"],
    engineCount: 1,
    typicalCruise: "~155 knots",
  },
  {
    id: "cirrus-sr22",
    slug: "cirrus-sr22",
    make: "Cirrus",
    model: "SR22",
    sortOrder: 8,
    displayName: "Cirrus SR22",
    category: "single-engine",
    description:
      "The Cirrus SR22 is the best-selling piston aircraft in the world for over a decade, and a premium platform for high-performance commercial training. With a 310-horsepower Continental IO-550-N engine, the SR22 cruises at over 185 knots and is equipped with TKS ice protection on some models. Like the SR20, it features CAPS and the Garmin Perspective avionics suite. Many integrated commercial training programs use the SR22 as their advanced single-engine platform for commercial and instrument rating training.",
    commonUse: ["commercial-pilot", "instrument-rating", "high-performance", "atp"],
    engineCount: 1,
    typicalCruise: "~185 knots",
  },
  {
    id: "robinson-r22",
    slug: "robinson-r22",
    make: "Robinson",
    model: "R22 Beta II",
    sortOrder: 13,
    displayName: "Robinson R-22",
    category: "helicopter",
    description:
      "The Robinson R-22 Beta II is the world's most widely used helicopter trainer, providing the foundation for helicopter Private Pilot, Commercial, and CFI training. Its two-seat, piston-powered design offers low operating costs that make helicopter training accessible to students pursuing rotor-wing certificates. The R-22's light controls require precise technique and make it an excellent instrument for developing the coordination and scan patterns essential to helicopter flight.",
    commonUse: ["private-pilot", "commercial-pilot", "cfi"],
    engineCount: 1,
    typicalCruise: "~96 knots",
  },
  {
    id: "robinson-r44",
    slug: "robinson-r44",
    make: "Robinson",
    model: "R44 Raven",
    sortOrder: 14,
    displayName: "Robinson R-44",
    category: "helicopter",
    description:
      "The Robinson R-44 Raven is a four-seat helicopter widely used for advanced training, instrument currency, and introductory flights. Many helicopter schools progress students from the R-22 to the R-44 for their commercial pilot certificate due to its greater useful load and passenger-carrying capability. It is also used for instrument training when equipped with appropriate avionics, providing helicopter students the opportunity to earn an instrument rating in a cost-effective piston platform.",
    commonUse: ["commercial-pilot", "instrument-rating", "cfi", "discovery-flight"],
    engineCount: 1,
    typicalCruise: "~110 knots",
  },
  {
    id: "vans-rv-12",
    slug: "vans-rv-12",
    make: "Van's Aircraft",
    model: "RV-12",
    sortOrder: 15,
    displayName: "Van's RV-12",
    category: "sport",
    description:
      "The Van's RV-12 is a two-seat, low-wing Light Sport Aircraft (LSA) that is typically built from a kit and flown as a sport aircraft. Several flight schools operate factory-built versions of the RV-12 for Sport Pilot and primary training, where its responsive handling, modern design, and low operating cost distinguish it from traditional Cessna 150/152 trainers. The RV-12's cruise speed of 110+ knots and fuel efficiency make it practical for cross-country training in the sport pilot category.",
    commonUse: ["sport-pilot", "private-pilot", "discovery-flight"],
    engineCount: 1,
    typicalCruise: "~110 knots",
  },
];

// ── Flight Schools ─────────────────────────────────────────────────────────────
// Each physical location is its own listing.
// Multi-location brands share an organizationId so their detail pages can
// cross-link to sibling listings ("Other Locations" section).
export const flightSchools: FlightSchool[] = [
  // ── Arizona Pilot Academy (2 locations) ────────────────────────────────────
  {
    id: "arizona-pilot-academy-mesa",
    name: "Arizona Pilot Academy",
    slug: "arizona-pilot-academy",
    description:
      "Arizona Pilot Academy offers comprehensive flight training at Falcon Field Airport in Mesa. With a modern fleet and experienced instructors, we guide students from first flight through ATP certifications.",
    primaryAirportCode: "KFFZ",
    citySlug: "mesa",
    stateSlug: "arizona",
    organizationId: "arizona-pilot-academy",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi", "cfii", "mei", "multi-engine"],
    faaPart: "both",
    rating: 4.8,
    reviewCount: 142,
    website: "https://example.com/arizona-pilot-academy",
    phone: "(480) 555-0101",
    featured: true,
    aircraftSlugs: ["cessna-172-skyhawk", "piper-pa28-cherokee", "beechcraft-baron-58", "cessna-182-skylane"],
    estimatedPlanes: "10-20",
    estimatedInstructors: "10-20",
    managedBy: "a3k9xm2",
    contacts: [
      { name: "Robert Hale", title: "Owner / Chief Pilot", phone: "(480) 555-0101", email: "rhale@example.com" },
      { name: "Maria Santos", title: "Director of Training", phone: "(480) 555-0103", email: "msantos@example.com" },
      { name: "Kevin Park", title: "Front Desk / Scheduling", phone: "(480) 555-0104", email: "kpark@example.com" },
    ],
  },
  {
    id: "arizona-pilot-academy-phoenix",
    name: "Arizona Pilot Academy – Deer Valley",
    slug: "arizona-pilot-academy-deer-valley",
    description:
      "Arizona Pilot Academy's Deer Valley location at Phoenix Deer Valley Airport brings the same experienced instructors and modern fleet to the northwest Phoenix metro.",
    primaryAirportCode: "KDVT",
    citySlug: "phoenix",
    stateSlug: "arizona",
    organizationId: "arizona-pilot-academy",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi", "cfii", "mei", "multi-engine"],
    faaPart: "both",
    rating: 4.7,
    reviewCount: 58,
    website: "https://example.com/arizona-pilot-academy",
    phone: "(602) 555-0102",
    aircraftSlugs: ["cessna-172-skyhawk", "piper-pa28-cherokee", "cessna-182-skylane"],
    estimatedPlanes: "6-9",
    estimatedInstructors: "6-9",
    contacts: [
      { name: "Dana Cole", title: "Location Manager / CFI", phone: "(602) 555-0102", email: "dcole@example.com" },
      { name: "Tina Ruiz", title: "Front Desk / Scheduling", phone: "(602) 555-0105", email: "truiz@example.com" },
    ],
  },

  // ── Midwest Flight Training (single location) ──────────────────────────────
  {
    id: "midwest-flight-training",
    name: "Midwest Flight Training",
    slug: "midwest-flight-training",
    description:
      "Serving the St. Louis metro from St. Louis Downtown Airport in Belleville, IL, Midwest Flight Training provides quality instruction at competitive rates for all skill levels.",
    primaryAirportCode: "KCPS",
    citySlug: "belleville",
    stateSlug: "illinois",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot"],
    faaPart: "61",
    rating: 4.6,
    reviewCount: 89,
    website: "https://example.com/midwest-flight-training",
    phone: "(618) 555-0202",
    aircraftSlugs: ["cessna-172-skyhawk", "piper-pa28-cherokee", "cessna-152"],
    estimatedPlanes: "6-9",
    estimatedInstructors: "3-6",
    contacts: [
      { name: "Gary Novak", title: "Owner / Chief Pilot", phone: "(618) 555-0202", email: "gnovak@example.com" },
      { name: "Pam Weston", title: "Front Desk / Scheduling", phone: "(618) 555-0203", email: "pweston@example.com" },
    ],
  },

  // ── Suncoast Aviation (single location) ───────────────────────────────────
  {
    id: "suncoast-aviation",
    name: "Suncoast Aviation",
    slug: "suncoast-aviation",
    description:
      "Premier flight school serving the Miami–Fort Lauderdale metro from Pompano Beach Airpark. Year-round VFR flying conditions and an ATP-focused training pipeline.",
    primaryAirportCode: "KPMP",
    citySlug: "pembroke-pines",
    stateSlug: "florida",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi", "atp"],
    faaPart: "141",
    rating: 4.8,
    reviewCount: 142,
    website: "https://example.com/suncoast-aviation",
    phone: "(954) 555-0303",
    featured: true,
    aircraftSlugs: ["cessna-172-skyhawk", "cessna-182-skylane", "piper-pa44-seminole", "beechcraft-baron-58", "diamond-da20"],
    estimatedPlanes: "20-30",
    estimatedInstructors: "20-30",
    managedBy: "p7r2wq8",
    contacts: [
      { name: "Carlos Vega", title: "Owner", phone: "(954) 555-0303", email: "cvega@example.com" },
      { name: "Angela Marsh", title: "Chief Pilot / Director of Training", phone: "(954) 555-0304", email: "amarsh@example.com" },
      { name: "Jordan Lee", title: "Front Desk / Scheduling", phone: "(954) 555-0305", email: "jlee@example.com" },
    ],
  },

  // ── St. Louis Flight Academy (single location) ────────────────────────────
  {
    id: "st-louis-flight-academy",
    name: "St. Louis Flight Academy",
    slug: "st-louis-flight-academy",
    description:
      "Located at St. Louis Lambert International, we offer professional-level training programs for aspiring pilots at every stage — from discovery flights to ATP prep.",
    primaryAirportCode: "KSTL",
    citySlug: "st-louis",
    stateSlug: "missouri",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "multi-engine", "atp"],
    faaPart: "141",
    rating: 4.9,
    reviewCount: 67,
    website: "https://example.com/st-louis-flight-academy",
    phone: "(314) 555-0404",
    featured: true,
    aircraftSlugs: ["cessna-172-skyhawk", "piper-pa28-cherokee", "piper-pa44-seminole", "beechcraft-duchess"],
    estimatedPlanes: "10-20",
    estimatedInstructors: "10-20",
    contacts: [
      { name: "Thomas Ellery", title: "Owner / Chief Pilot", phone: "(314) 555-0404", email: "tellery@example.com" },
      { name: "Rachel Burns", title: "Director of Training", phone: "(314) 555-0405", email: "rburns@example.com" },
      { name: "Neil Cho", title: "Front Desk / Scheduling", phone: "(314) 555-0406", email: "ncho@example.com" },
    ],
  },

  // ── Heartland Flyers (2 locations) ────────────────────────────────────────
  {
    id: "heartland-flyers-kc",
    name: "Heartland Flyers",
    slug: "heartland-flyers",
    description:
      "Training Kansas City area pilots for over 20 years from Charles B. Wheeler Downtown Airport. Heartland Flyers' downtown location is the gateway to our regional flight training network.",
    primaryAirportCode: "KMKC",
    citySlug: "kansas-city",
    stateSlug: "missouri",
    organizationId: "heartland-flyers",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi"],
    faaPart: "61",
    rating: 4.8,
    reviewCount: 142,
    website: "https://example.com/heartland-flyers",
    phone: "(816) 555-0505",
    featured: true,
    aircraftSlugs: ["cessna-172-skyhawk", "cessna-152", "piper-pa28-cherokee", "vans-rv-12"],
    estimatedPlanes: "10-20",
    estimatedInstructors: "10-20",
    contacts: [
      { name: "Frank Briggs", title: "Owner / Founder", phone: "(816) 555-0505", email: "fbriggs@example.com" },
      { name: "Donna Pierce", title: "Chief Pilot", phone: "(816) 555-0507", email: "dpierce@example.com" },
      { name: "Sam Okafor", title: "Front Desk / Scheduling", phone: "(816) 555-0508", email: "sokafor@example.com" },
    ],
  },
  {
    id: "heartland-flyers-overland-park",
    name: "Heartland Flyers – Overland Park",
    slug: "heartland-flyers-overland-park",
    description:
      "Heartland Flyers' Johnson County location at Overland Park Executive Airport serves the Kansas side of the KC metro with the same trusted instruction and fleet.",
    primaryAirportCode: "KOJC",
    citySlug: "overland-park",
    stateSlug: "kansas",
    organizationId: "heartland-flyers",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi"],
    faaPart: "61",
    rating: 4.7,
    reviewCount: 61,
    website: "https://example.com/heartland-flyers",
    phone: "(913) 555-0506",
    aircraftSlugs: ["cessna-172-skyhawk", "piper-pa28-cherokee", "vans-rv-12"],
    estimatedPlanes: "6-9",
    estimatedInstructors: "6-9",
    contacts: [
      { name: "Casey Tran", title: "Location Manager / CFI", phone: "(913) 555-0506", email: "ctran@example.com" },
      { name: "Bria Owens", title: "Front Desk / Scheduling", phone: "(913) 555-0509", email: "bowens@example.com" },
    ],
  },

  // ── Pacific Coast Flight School (single location) ─────────────────────────
  {
    id: "pacific-coast-flight-school",
    name: "Pacific Coast Flight School",
    slug: "pacific-coast-flight-school",
    description:
      "Based at Montgomery-Gibbs Executive Airport in San Diego, Pacific Coast offers year-round training in some of the country's most favorable VFR flying conditions.",
    primaryAirportCode: "KMYF",
    citySlug: "san-diego",
    stateSlug: "california",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi", "seaplane-rating"],
    faaPart: "both",
    rating: 4.7,
    reviewCount: 210,
    website: "https://example.com/pacific-coast-flight-school",
    phone: "(619) 555-0606",
    featured: true,
    aircraftSlugs: ["cessna-172-skyhawk", "cessna-182-skylane", "piper-pa28-cherokee", "robinson-r44", "diamond-da40"],
    estimatedPlanes: "20-30",
    estimatedInstructors: "20-30",
    contacts: [
      { name: "Linda Hayashi", title: "Owner / Chief Pilot", phone: "(619) 555-0606", email: "lhayashi@example.com" },
      { name: "Greg Fontaine", title: "Director of Training", phone: "(619) 555-0607", email: "gfontaine@example.com" },
      { name: "Maya Torres", title: "Front Desk / Scheduling", phone: "(619) 555-0608", email: "mtorres@example.com" },
    ],
  },

  // ── Phoenix Flight Academy (single location) ──────────────────────────────
  {
    id: "phoenix-flight-academy",
    name: "Phoenix Flight Academy",
    slug: "phoenix-flight-academy",
    description:
      "Accelerated pilot training programs at Deer Valley Airport — one of the nation's busiest single-runway GA airports — in the heart of the Phoenix metro.",
    primaryAirportCode: "KDVT",
    citySlug: "phoenix",
    stateSlug: "arizona",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi", "cfii", "mei", "multi-engine"],
    faaPart: "141",
    rating: 4.7,
    reviewCount: 98,
    website: "https://example.com/phoenix-flight-academy",
    phone: "(602) 555-0707",
    featured: true,
  },

  // ── Tennessee Flight Training (2 locations) ───────────────────────────────
  {
    id: "tennessee-flight-training-nashville",
    name: "Tennessee Flight Training",
    slug: "tennessee-flight-training",
    description:
      "Tennessee Flight Training's Nashville location at BNA offers flexible scheduling and a modern fleet for students in Middle Tennessee.",
    primaryAirportCode: "KBNA",
    citySlug: "nashville",
    stateSlug: "tennessee",
    organizationId: "tennessee-flight-training",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi"],
    faaPart: "61",
    rating: 4.5,
    reviewCount: 73,
    website: "https://example.com/tennessee-flight-training",
    phone: "(615) 555-0808",
  },
  {
    id: "tennessee-flight-training-chattanooga",
    name: "Tennessee Flight Training – Chattanooga",
    slug: "tennessee-flight-training-chattanooga",
    description:
      "Tennessee Flight Training's Chattanooga location serves East Tennessee pilots with the same quality instruction and fleet as the Nashville campus.",
    primaryAirportCode: "KCHA",
    citySlug: "chattanooga",
    stateSlug: "tennessee",
    organizationId: "tennessee-flight-training",
    programSlugs: ["private-pilot", "instrument-rating", "commercial-pilot", "cfi"],
    faaPart: "61",
    rating: 4.4,
    reviewCount: 38,
    website: "https://example.com/tennessee-flight-training",
    phone: "(423) 555-0809",
  },
];
