import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tokens,
  optional,
  yesNoNull,
  faaPart,
  fleetBucket,
  visaTypes,
  schoolTypes,
  mapTraining,
  contactPeople,
  airportIdent,
  cityName,
  describeSchool,
} from "../seed/normalize.ts";
import { programs, trainerAircraft } from "../seed/static-catalog.ts";

const known = {
  programSlugs: new Set(programs.map((p) => p.slug)),
  aircraftSlugs: new Set(trainerAircraft.map((a) => a.slug)),
};

const noTraining = {
  certifications: "",
  ratings: "",
  advanced: "",
  services: "",
  planes: "",
  simulator: "",
  rotorcraft: "",
};

test("tokens splits on semicolons, trims, de-dupes and drops placeholders", () => {
  assert.deepEqual(tokens("Instrument; Multi-Engine"), ["Instrument", "Multi-Engine"]);
  assert.deepEqual(tokens("A;  A ; B"), ["A", "B"]);
  assert.deepEqual(tokens("N/A"), []);
  assert.deepEqual(tokens(""), []);
  // Commas are content, not separators: only visaTypes treats them as such.
  assert.deepEqual(tokens("Hunter Field, Hunter's Field"), ["Hunter Field, Hunter's Field"]);
});

test("optional and yesNoNull treat sheet placeholders as unknown", () => {
  assert.equal(optional("  Yes "), "Yes");
  assert.equal(optional("N/A"), null);
  assert.equal(optional("--"), null);
  assert.equal(optional(""), null);

  assert.equal(yesNoNull("Yes"), true);
  assert.equal(yesNoNull("No"), false);
  assert.equal(yesNoNull("N/A"), null);
  assert.equal(yesNoNull(""), null);
});

test("faaPart models pilot training only", () => {
  assert.equal(faaPart("Part 61"), "61");
  assert.equal(faaPart("Part 141"), "141");
  assert.equal(faaPart("Part 141; Part 61"), "both");
  assert.equal(faaPart("Part 61; Part 141"), "both");
  assert.equal(faaPart("Part 107; Part 141; Part 61"), "both");
  // Drone-, type- and ultralight-only schools have no 61/141 pilot program.
  assert.equal(faaPart("Part 107"), null);
  assert.equal(faaPart("Part 142"), null);
  assert.equal(faaPart(""), null);
});

test("fleetBucket maps counts onto the FLEET_RANGES the forms offer", () => {
  assert.equal(fleetBucket("1"), "1-3");
  assert.equal(fleetBucket("3"), "1-3");
  assert.equal(fleetBucket("4"), "3-6");
  assert.equal(fleetBucket("9"), "6-9");
  assert.equal(fleetBucket("20"), "10-20");
  assert.equal(fleetBucket("21"), "20-30");
  assert.equal(fleetBucket("50"), "40-50");
  assert.equal(fleetBucket("100"), "50+");
  assert.equal(fleetBucket("N/A"), null);
  assert.equal(fleetBucket("0"), null);
  assert.equal(fleetBucket("many"), null);
});

test("visaTypes canonicalises both separators the sheet uses", () => {
  assert.deepEqual(visaTypes("M1"), ["M-1"]);
  assert.deepEqual(visaTypes("F1"), ["F-1"]);
  assert.deepEqual(visaTypes("F1; M1"), ["F-1", "M-1"]);
  assert.deepEqual(visaTypes("F1, M1"), ["F-1", "M-1"]);
  assert.deepEqual(visaTypes("No"), []);
});

test("schoolTypes maps the three kinds the sheet uses", () => {
  assert.deepEqual(schoolTypes("Flight school"), ["flight-school"]);
  assert.deepEqual(schoolTypes("Flight school; Helicopter school"), [
    "flight-school",
    "helicopter-school",
  ]);
  assert.deepEqual(schoolTypes("Aviation college"), ["aviation-college"]);
  assert.deepEqual(schoolTypes(""), []);
});

test("mapTraining routes tokens to programs, aircraft, or tags — never dropping a fact", () => {
  const m = mapTraining(
    {
      ...noTraining,
      certifications: "Private Pilot; Commercial; Flight Instructor CFI; Airline Transport Pilot ATP",
      ratings: "Instrument; Multi-Engine; Rotary Wing",
      advanced: "Tailwheel; Mountain Flying; G1000",
      services: "Ground School; Intro Flight; Simulator",
      planes: "Single Engine; Cessna 172",
    },
    known,
  );

  assert.deepEqual(m.programSlugs, [
    "private-pilot",
    "commercial-pilot",
    "cfi",
    "atp",
    "instrument-rating",
    "multi-engine",
    "tailwheel",
    "ground-school",
    "discovery-flight",
  ]);
  assert.deepEqual(m.aircraftSlugs, ["cessna-172-skyhawk"]);
  // Unmapped tokens survive as searchable tags rather than being discarded.
  assert.deepEqual(m.trainingTags, [
    "rotary-wing",
    "mountain-flying",
    "g1000",
    "simulator",
    "single-engine",
  ]);
  assert.deepEqual(m.unmapped, [
    "Rotary Wing",
    "Mountain Flying",
    "G1000",
    "Simulator",
    "Single Engine",
  ]);
});

test("mapTraining normalises the sheet's spelling variants and skips yes/no noise", () => {
  const m = mapTraining(
    {
      ...noTraining,
      certifications: "Private Pilot Cetficiate; Privae Pilot Certificate",
      ratings: "Multi Engine; Multi-Engine",
      advanced: "Tailwhell; No",
    },
    known,
  );
  assert.deepEqual(m.programSlugs, ["private-pilot", "multi-engine", "tailwheel"]);
  assert.deepEqual(m.trainingTags, []);
});

test("mapTraining de-duplicates a slug reached from two different cells", () => {
  const m = mapTraining(
    { ...noTraining, certifications: "Commercial", ratings: "Commercial" },
    known,
  );
  assert.deepEqual(m.programSlugs, ["commercial-pilot"]);
});

test("contactPeople drops empty rows and placeholder names", () => {
  assert.deepEqual(contactPeople({ name: "N/A", phone: "N/A", email: "" }), []);
  assert.deepEqual(contactPeople({ name: "Contact Us", phone: "", email: "a@b.com" }), [
    { name: "Contact", title: "", phone: "", email: "a@b.com" },
  ]);
  assert.deepEqual(
    contactPeople({ name: "Noelle Mayes", phone: "(530) 473-5315", email: "n@x.com" }),
    [{ name: "Noelle Mayes", title: "", phone: "(530) 473-5315", email: "n@x.com" }],
  );
});

test("airportIdent prefers a real code over the synthetic OurAirports row key", () => {
  // Tavares Seaplane Base: no icao_code, but a real GPS code.
  assert.equal(
    airportIdent({ ident: "US-0181", icao_code: "", gps_code: "KFA1", local_code: "FA1" }),
    "KFA1",
  );
  assert.equal(
    airportIdent({ ident: "01J", icao_code: "", gps_code: "K01J", local_code: "01J" }),
    "K01J",
  );
  assert.equal(
    airportIdent({ ident: "KFFZ", icao_code: "KFFZ", gps_code: "KFFZ", local_code: "FFZ" }),
    "KFFZ",
  );
  // Closed fields have no code at all: the row key is all there is.
  assert.equal(
    airportIdent({ ident: "US-0880", icao_code: "", gps_code: "", local_code: "" }),
    "US-0880",
  );
});

test("cityName title-cases only when the source is all lowercase", () => {
  assert.equal(cityName("fort lauderdale"), "Fort Lauderdale");
  assert.equal(cityName("Fort Lauderdale"), "Fort Lauderdale");
  assert.equal(cityName("  McMinnville "), "McMinnville");
});

test("describeSchool produces a factual intro from the row's own data", () => {
  const text = describeSchool({
    name: "Arizona Pilot Academy",
    cityName: "Mesa",
    stateName: "Arizona",
    airportName: "Falcon Field Airport",
    airportIdent: "KFFZ",
    faaPart: "both",
    programNames: ["Private Pilot", "Instrument Rating", "Commercial Pilot"],
    vaApproved: true,
    visaTypes: ["M-1"],
    schoolTypes: ["flight-school"],
  });

  assert.match(text, /^Arizona Pilot Academy is a flight school based at Falcon Field Airport \(KFFZ\) in Mesa, Arizona\./);
  assert.match(text, /both FAR Part 61 and Part 141/);
  assert.match(text, /Private Pilot, Instrument Rating and Commercial Pilot/);
  assert.match(text, /approved for VA education benefits and able to enroll international students on M-1 visas/);
  assert.ok(text.length <= 5000);
});

test("describeSchool stays a valid sentence when the row has almost nothing", () => {
  const text = describeSchool({
    name: "Tiny Air",
    cityName: "Williams",
    stateName: "California",
    airportName: "Williams Ag Airport",
    airportIdent: "00CL",
    faaPart: null,
    programNames: [],
    vaApproved: null,
    visaTypes: [],
    schoolTypes: [],
  });
  assert.equal(
    text,
    "Tiny Air is a flight school based at Williams Ag Airport (00CL) in Williams, California.",
  );
});

test("describeSchool names helicopter-only and college listings correctly", () => {
  const heli = describeSchool({
    name: "Rotor Co",
    cityName: "Mesa",
    stateName: "Arizona",
    airportName: "Falcon Field",
    airportIdent: "KFFZ",
    faaPart: "61",
    programNames: ["Private Pilot"],
    vaApproved: null,
    visaTypes: [],
    schoolTypes: ["helicopter-school"],
  });
  assert.match(heli, /is a helicopter flight school based at/);

  const college = describeSchool({
    name: "State Aviation College",
    cityName: "Daytona Beach",
    stateName: "Florida",
    airportName: "Daytona Beach International Airport",
    airportIdent: "KDAB",
    faaPart: "141",
    programNames: ["Commercial Pilot"],
    vaApproved: null,
    visaTypes: [],
    schoolTypes: ["aviation-college", "flight-school"],
  });
  assert.match(college, /is an? aviation college based at/);
  assert.match(college, /trains under FAR Part 141, with instruction toward Commercial Pilot\./);
});

test("mapTraining keeps slashed and typo'd tokens as clean, single-spelling tags", () => {
  const m = mapTraining(
    {
      certifications: "",
      ratings: "",
      advanced: "Drone/UAS",
      services: "Aicraft Maintenance Training; Aircraft Maintenance Training; IPC check",
      planes: "",
      simulator: "",
      rotorcraft: "",
    },
    known,
  );
  // "/" must separate words rather than vanish, and each concept gets one tag.
  assert.deepEqual(m.trainingTags, [
    "drone-uas",
    "aircraft-maintenance-training",
    "instrument-proficiency-check",
  ]);
});
