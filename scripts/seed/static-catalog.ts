/**
 * Editorial reference data: the programs and trainer aircraft catalogs.
 *
 * These are hand-curated (names, descriptions, prerequisites, display order)
 * and are NOT part of the imported spreadsheet — the import maps free-text
 * training tokens onto these slugs. Moved here verbatim from the retired
 * src/lib/mock-data.ts when the real catalog import replaced it.
 *
 * States come from the sheet's "States" tab; cities, airports and schools come
 * from the two COMPILED tabs.
 */
import type { Program, TrainerAircraft } from "../../src/lib/types.ts";


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
    sortOrder: 7,
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
    sortOrder: 8,
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
    sortOrder: 9,
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
    sortOrder: 10,
    description:
      "A discovery flight is an introductory lesson designed for people curious about learning to fly. Typically 30–60 minutes, you'll take the controls under the supervision of a CFI and experience the basics of aircraft control firsthand. Discovery flights are offered by most flight schools, often at a discounted introductory rate, and count as your first logbook entry if you later pursue a certificate.",
    typicalDuration: "30–60 minutes",
  },
  {
    id: "ground-school",
    slug: "ground-school",
    name: "Ground School",
    shortName: "Ground School",
    sortOrder: 11,
    description:
      "Ground school covers the academic knowledge required to pass FAA written knowledge exams. Topics include aerodynamics, aircraft systems, weather, navigation, FARs and AIM, and airspace. Ground school may be delivered in-person at a flight school, online, or as part of an accelerated weekend course. Many flight schools recommend completing ground school concurrently with or before beginning flight training for maximum efficiency.",
    typicalDuration: "4–12 weeks",
  },
  {
    id: "seaplane-rating",
    slug: "seaplane-rating",
    name: "Seaplane Rating",
    shortName: "Seaplane Rating",
    sortOrder: 12,
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
    sortOrder: 13,
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
    sortOrder: 14,
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
    sortOrder: 15,
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
