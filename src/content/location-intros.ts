/**
 * Editorial intros for populated state and city pages — the paragraph(s) a
 * prospective student reads before the listing grid. Written for the places
 * that actually have listings; a slug with no entry simply renders no intro
 * (those pages are noindex until they have a school anyway).
 *
 * Keep claims to things a student can verify on a sectional or at the
 * airport: airspace, field names, weather patterns, what the training
 * environment is like. No school rankings, no prices.
 */

export const STATE_INTROS: Record<string, string[]> = {
  arizona: [
    "Arizona is one of the most popular places in the country to learn to fly, and the reason is weather: the Phoenix and Tucson valleys see dry, clear skies most of the year, so lessons rarely cancel and students tend to finish a certificate in fewer calendar months than in wetter climates. The trade-off is summer — from June to September, triple-digit heat pushes density altitude up and many schools fly early mornings.",
    "The Phoenix metro is ringed with dedicated training fields — Falcon Field (KFFZ) in Mesa, Deer Valley (KDVT), Chandler Municipal (KCHD) and Phoenix-Mesa Gateway (KIWA) — all under or beside the Phoenix Class B, which means students learn radio work and airspace discipline from day one. Tucson adds high-desert flying and easy access to practice areas.",
  ],
  california: [
    "California packs several very different training environments into one state. San Diego offers year-round flying with a spring marine layer that makes an instrument rating genuinely useful; the Los Angeles basin is the most complex airspace a student will see anywhere, with Class B, C and D fields stacked side by side.",
    "Training fields like Montgomery-Gibbs Executive (KMYF), Gillespie (KSEE) and McClellan-Palomar (KCRQ) sit minutes from the coast and the mountains, so cross-country flights cover everything from shoreline to high terrain without leaving the county.",
  ],
  florida: [
    "South Florida is flat, warm and flies almost every day of the year, which is why it hosts some of the busiest flight training airports in the United States. Pembroke Pines' North Perry (KHWO) and Fort Lauderdale Executive (KFXE) sit within a few miles of the coast, with Miami's Class B to the south and plenty of practice area over the Everglades.",
    "Expect afternoon thunderstorms in summer and a hurricane season that occasionally interrupts schedules; most schools plan around both with early-morning blocks and flexible rescheduling.",
  ],
  illinois: [
    "Southwestern Illinois is part of the St. Louis metro, and its training airports share that region's reliable instrument-approach infrastructure and four-season weather. Students here learn to fly in real crosswinds and real winter, which makes for well-rounded pilots.",
    "MidAmerica St. Louis Airport (KBLV) in Belleville has a long runway, full ILS approaches and light traffic — a rare combination for a primary trainer — with St. Louis Downtown (KCPS) and Spirit of St. Louis (KSUS) a short cross-country hop away across the river.",
  ],
  kansas: [
    "The Kansas City suburbs on the Kansas side are home to two of the region's main general-aviation fields: Johnson County Executive (KOJC) in Olathe, minutes from Overland Park, and New Century AirCenter (KIXD). Both have towered operations and instrument approaches, and the flat terrain and open practice areas west of the metro are ideal for primary training.",
    "Weather is four-season Midwest: hot summers, cold winters and a spring storm season that teaches weather judgment early. Kansas City's Class B lies just to the north-east, so students get controlled-airspace experience on every cross-country.",
  ],
  missouri: [
    "Missouri's two big metros each have a distinct flying character. St. Louis is anchored by St. Louis Downtown Airport (KCPS), a towered field across the river from the Gateway Arch, and Spirit of St. Louis (KSUS) in the western suburbs — both with full instrument approaches and an active general-aviation community.",
    "Kansas City's Charles B. Wheeler Downtown Airport (KMKC) puts students next to the city skyline under the Class B, and the outlying fields on both sides of the state line give plenty of room for pattern work and practice areas.",
  ],
  tennessee: [
    "Tennessee offers mild, flyable weather most of the year, rolling terrain that makes navigation practice interesting, and two metros with strong general-aviation airports. In Nashville, John C. Tune (KJWN) is the dedicated reliever just west of downtown, with Nashville International's Class C next door for students to learn in.",
    "Chattanooga's Lovell Field (KCHA) combines a towered Class C environment with the ridges of the Tennessee River valley — a good introduction to mountain-adjacent flying without the density-altitude extremes of the West.",
  ],
};

export const CITY_INTROS: Record<string, string[]> = {
  mesa: [
    "Mesa's Falcon Field (KFFZ) is one of the busiest general-aviation airports in the country and has been a training field since it opened as a wartime flying school. Its parallel runways, control tower and reliable weather make it a natural base for flight schools, with the Superstition Mountains and the open desert east of the city as a practice area.",
  ],
  phoenix: [
    "Phoenix is a flight-training hub: reliable desert weather, a dozen airports within a half-hour drive, and Sky Harbor's Class B overhead so students learn to work with approach control early. Deer Valley (KDVT) on the north side is among the busiest general-aviation fields in the United States; Chandler, Mesa and Scottsdale add more towered options around the valley.",
  ],
  scottsdale: [
    "Scottsdale Airport (KSDL) sits under the north-east edge of the Phoenix Class B with a single long runway and a busy mix of business jets and trainers — good exposure to real traffic for students who want it.",
  ],
  chandler: [
    "Chandler Municipal (KCHD) is a towered training field south-east of Phoenix with parallel runways and room to practice, and Phoenix-Mesa Gateway (KIWA) a few miles east for longer runways and instrument approaches.",
  ],
  tempe: [
    "Tempe has no airport of its own but sits within minutes of Falcon Field, Chandler Municipal and Sky Harbor, so students based here can pick the field that suits their school and schedule.",
  ],
  tucson: [
    "Tucson combines high-desert flying — field elevation around 2,600 feet — with Tucson International's Class C, Ryan Field (KRYN) to the west for uncongested pattern work, and practice areas over open desert.",
  ],
  "san-diego": [
    "San Diego is a year-round training city with a specific rhythm: a coastal marine layer on many spring mornings that burns off by late morning, then clear skies. Montgomery-Gibbs Executive (KMYF) and Gillespie Field (KSEE) are the main training airports, with McClellan-Palomar (KCRQ) up the coast, all operating under or beside San Diego International's Class B.",
  ],
  "los-angeles": [
    "Los Angeles is the most intensive airspace a student pilot can learn in — a Class B over LAX with a ring of Class C and D fields — and students who train here come out comfortable on the radio anywhere. Many schools base at relievers around the basin and use the coastline and the high desert as practice areas.",
  ],
  "pembroke-pines": [
    "Pembroke Pines' North Perry Airport (KHWO) is one of the busiest pure general-aviation airports in Florida, with four runways, a control tower and a cluster of flight schools. The Everglades immediately to the west give an unobstructed practice area, and Fort Lauderdale and Miami's airspace is close enough for regular Class B and C experience.",
  ],
  "fort-lauderdale": [
    "Fort Lauderdale Executive (KFXE) is a towered reliever with full instrument approaches and a mix of jets and trainers, a few miles from the coast and from the Miami and Fort Lauderdale Class B and C airspace.",
  ],
  miami: [
    "Miami-area students typically train at Opa-locka Executive (KOPF), Pompano Beach (KPMP) or North Perry, all towered fields within the reach of Miami International's Class B — a demanding but excellent environment for learning airspace and radio work.",
  ],
  belleville: [
    "Belleville's MidAmerica St. Louis Airport (KBLV) shares its runways with Scott Air Force Base, which means a long, well-maintained runway, precision approaches and a control tower with comparatively light civilian traffic — an unusually roomy place to learn. St. Louis and its other airports are a short flight west.",
  ],
  "st-louis": [
    "St. Louis Downtown Airport (KCPS) in Cahokia is the metro's main general-aviation field, towered and directly across the Mississippi from the Arch; Spirit of St. Louis (KSUS) serves the western suburbs. Both offer instrument approaches and year-round training in genuine four-season weather.",
  ],
  "kansas-city": [
    "Kansas City's Charles B. Wheeler Downtown Airport (KMKC) is a towered field beside the river and the downtown skyline, under the Kansas City Class B. Training here means controlled airspace from the first lesson, with the Kansas-side fields — Johnson County Executive and New Century — minutes away for pattern work.",
  ],
  "overland-park": [
    "Overland Park students fly out of Johnson County Executive (KOJC) in neighbouring Olathe, a towered airport with instrument approaches and open practice areas to the west, or New Century AirCenter (KIXD) a few miles further south-west.",
  ],
  nashville: [
    "Nashville's general-aviation training happens mostly at John C. Tune Airport (KJWN), a towered reliever just west of downtown, with Nashville International's Class C next door. Mild weather, rolling terrain and a growing pilot community make it one of the South's busier training cities.",
  ],
  chattanooga: [
    "Chattanooga's Lovell Field (KCHA) is a Class C airport shared by airlines and trainers, set in the Tennessee River valley between ridgelines — students get tower and approach-control experience plus an early taste of terrain awareness.",
  ],
};
