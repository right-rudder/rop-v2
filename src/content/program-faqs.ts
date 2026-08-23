import type { Faq } from "@/lib/structured-data";

/**
 * Questions prospective students actually search for, answered per program.
 * Rendered visibly on /programs/{slug} and mirrored as FAQPage structured
 * data, so every answer must stand on its own as plain text.
 *
 * Hours are FAA minimums (FAR 61 / 141) and match the catalog's
 * `minimumHours`; durations match `typicalDuration`. Dollar figures are
 * rounded ranges at typical U.S. rental + instruction rates and are worded
 * as estimates — revisit them yearly.
 */
export const PROGRAM_FAQS: Record<string, Faq[]> = {
  "private-pilot": [
    {
      q: "How many flight hours do you need for a private pilot license?",
      a: "The FAA minimum is 40 hours under Part 61, or 35 hours at a Part 141 school. Most students need more — 60 to 70 hours is common — because the checkride tests proficiency, not hours. Flying two or three times a week keeps skills fresh and usually means fewer total hours.",
    },
    {
      q: "How much does a private pilot license cost?",
      a: "Budget roughly $12,000 to $20,000 in the United States as of 2026. The main variables are the aircraft you train in, your instructor's hourly rate, how often you fly, and how many hours you ultimately need. Ask schools for an all-in estimate that includes ground school, books, exam fees and the checkride examiner's fee.",
    },
    {
      q: "How long does it take to get a private pilot certificate?",
      a: "Typically 6 to 12 months flying two or three times a week. Accelerated programs can finish in a few weeks if you fly daily; flying once a week or less usually stretches training past a year and adds hours.",
    },
    {
      q: "What are the requirements to start private pilot training?",
      a: "You can begin lessons at any age, but you must be 16 to solo and 17 to take the checkride, read, speak and understand English, and hold at least a third-class FAA medical certificate (or qualify under BasicMed once you have held a medical). You will also need to pass the FAA knowledge test before the practical test.",
    },
    {
      q: "Part 61 or Part 141 — which is better for a private pilot?",
      a: "Part 141 schools follow an FAA-approved syllabus with slightly lower hour minimums and are often preferred for structured, full-time or veteran-benefit training. Part 61 is more flexible for people who fly around a job. For most private pilot students the instructor and scheduling matter more than the part.",
    },
  ],
  "instrument-rating": [
    {
      q: "What are the requirements for an instrument rating?",
      a: "Under Part 61 you need a private pilot certificate, 50 hours of cross-country time as pilot in command, and 40 hours of actual or simulated instrument time, including at least 15 hours with an instrument instructor (CFII). You must also pass the instrument knowledge test and a practical test.",
    },
    {
      q: "How much does an instrument rating cost?",
      a: "Plan on roughly $8,000 to $15,000 as of 2026. Simulator time, which counts toward part of the required hours, can lower the total; aircraft with glass cockpits and the cross-country flights you may still need to log can raise it.",
    },
    {
      q: "How long does instrument training take?",
      a: "Usually 3 to 6 months flying a couple of times a week. Because instrument flying is skill-intensive, frequent lessons matter even more than for the private certificate.",
    },
    {
      q: "Is an instrument rating worth it if I only fly for fun?",
      a: "For many pilots, yes. It lets you fly legally through clouds and low visibility, makes cross-country trips far more reliable, and sharpens precision and radio work. It is also required for a commercial certificate without restrictions and for most professional flying.",
    },
  ],
  "commercial-pilot": [
    {
      q: "How many hours do you need for a commercial pilot license?",
      a: "Part 61 requires 250 total flight hours, including specific cross-country, night, instrument and solo (or solo-equivalent) time; Part 141 programs can certificate at 190 hours. Most pilots build the hours after their instrument rating through time-building flights and additional training.",
    },
    {
      q: "How much does it cost to go from zero to commercial pilot?",
      a: "Zero-to-commercial programs, including private, instrument and commercial training plus the hour-building in between, are commonly quoted in the $60,000 to $100,000 range in the United States as of 2026. The price depends heavily on how the time-building hours are flown.",
    },
    {
      q: "What can you do with a commercial pilot certificate?",
      a: "You can be paid to fly: banner towing, aerial survey, skydive operations, pipeline patrol, some charter roles and, with an instructor certificate, flight instruction. Airline and most corporate jobs additionally require an ATP or restricted ATP plus far more hours.",
    },
    {
      q: "Do I need an instrument rating before a commercial certificate?",
      a: "Not strictly, but a commercial certificate without an instrument rating carries a limitation that rules out carrying passengers for hire at night or beyond 50 nautical miles. Almost every career path assumes you hold both, so most schools teach them in sequence.",
    },
  ],
  cfi: [
    {
      q: "What do you need to become a certified flight instructor?",
      a: "A commercial or ATP certificate and an instrument rating (for airplane instruction), the Fundamentals of Instructing and Flight Instructor knowledge tests, and a practical test with an FAA inspector or designated examiner. Most candidates add spin training and a logbook endorsement before the checkride.",
    },
    {
      q: "How long does CFI training take?",
      a: "Typically 2 to 4 months after your commercial certificate. Much of it is ground work — learning to teach every maneuver from the right seat and to explain it clearly — rather than new flying skills.",
    },
    {
      q: "Why do so many pilots become flight instructors?",
      a: "Instructing is the most common way to build the 1,500 hours the airlines require: you are paid to fly and your students' hours count as yours. It also deepens your own understanding of flying, which shows in later checkrides and interviews.",
    },
    {
      q: "How hard is the CFI checkride?",
      a: "It has a reputation as one of the toughest in aviation — an oral exam that often runs several hours, followed by a flight where you teach the examiner. Thorough ground preparation and practice teaching to other pilots are the best predictors of passing.",
    },
  ],
  cfii: [
    {
      q: "What is a CFII and what does it let you do?",
      a: "A CFII is a flight instructor with an instrument instructor rating. It lets you teach instrument students, endorse them for the knowledge and practical tests, and give instrument proficiency checks.",
    },
    {
      q: "What are the prerequisites for the CFII?",
      a: "A current flight instructor certificate and an instrument rating. You will take the Flight Instructor Instrument knowledge test and a practical test focused on teaching instrument procedures.",
    },
    {
      q: "How long does the CFII add-on take?",
      a: "Usually 1 to 2 months, often less for recent instrument graduates, since you already hold the flying skills and are learning to teach them.",
    },
  ],
  mei: [
    {
      q: "What is a multi-engine instructor rating?",
      a: "The MEI is an add-on to a flight instructor certificate that lets you teach in multi-engine airplanes — including the engine-failure procedures that define twin training.",
    },
    {
      q: "What do you need before MEI training?",
      a: "A flight instructor certificate and a multi-engine rating with some multi-engine pilot-in-command time; many schools also want at least a handful of hours in the specific twin you will instruct in.",
    },
    {
      q: "How long does the MEI take and why is it valued?",
      a: "Often 1 to 2 weeks. Schools with twin programs need instructors who can teach in them, and multi-engine instruction time is the kind of experience regional airlines like to see.",
    },
  ],
  "multi-engine": [
    {
      q: "How many hours does a multi-engine rating take?",
      a: "There is no FAA hour minimum; the rating is earned to a practical-test standard. Most pilots complete it in about 10 to 15 hours of flying plus ground training, over 1 to 3 weeks.",
    },
    {
      q: "How much does a multi-engine rating cost?",
      a: "Twins cost considerably more per hour than single-engine trainers, so expect roughly $5,000 to $10,000 as of 2026 depending on the aircraft and hours needed.",
    },
    {
      q: "Do I need a multi-engine rating for an airline career?",
      a: "Yes — airline aircraft are multi-engine, and the ATP practical test is typically taken in a multi-engine airplane. Most professional tracks add the rating after the commercial certificate.",
    },
  ],
  atp: [
    {
      q: "How many hours do you need for an ATP certificate?",
      a: "1,500 total hours for an unrestricted ATP. A restricted ATP (R-ATP) is available at 1,000 hours with a bachelor's degree from an approved aviation program, 1,250 hours with an associate degree from one, or 750 hours for qualifying military pilots.",
    },
    {
      q: "What is the ATP CTP course?",
      a: "The Airline Transport Pilot Certification Training Program is a mandatory course of ground school and simulator sessions you must finish before taking the ATP multi-engine knowledge test. It is offered by airlines, universities and a number of training centers.",
    },
    {
      q: "What are the other ATP requirements?",
      a: "You must be 23 (21 for an R-ATP), hold a commercial certificate with an instrument rating, meet specific cross-country, night and instrument hour requirements, and pass the knowledge and practical tests. A first-class medical is required to exercise ATP privileges as an airline captain.",
    },
  ],
  "sport-pilot": [
    {
      q: "How is a sport pilot certificate different from a private pilot certificate?",
      a: "Sport pilots fly light-sport aircraft in daytime visual conditions with at most one passenger, and the FAA minimum is 20 hours rather than 40. The trade-off is fewer privileges: no night flying, no instrument flying, and limits on aircraft size and performance.",
    },
    {
      q: "Do I need an FAA medical for a sport pilot certificate?",
      a: "No. A valid U.S. driver's license serves as your medical, as long as your most recent FAA medical application was not denied, suspended or revoked. That makes sport pilot a practical route for people who cannot or prefer not to hold a standard medical certificate.",
    },
    {
      q: "Can sport pilot training count toward a private pilot license later?",
      a: "Yes. Hours logged with an instructor count toward the private certificate's requirements, so many pilots start with sport and upgrade when they want night, instrument or larger-aircraft privileges.",
    },
  ],
  "discovery-flight": [
    {
      q: "What happens on a discovery flight?",
      a: "A flight instructor briefs you on the aircraft, you help with the preflight inspection, and then you take the controls for most of a 30- to 60-minute flight with the instructor alongside. It is a real lesson, and the time goes in your logbook.",
    },
    {
      q: "How much does a discovery flight cost?",
      a: "Most schools price introductory flights between roughly $100 and $300 depending on the aircraft and flight length — often below their normal lesson rate — because it is how most students decide where to train.",
    },
    {
      q: "Do I need anything to book a discovery flight?",
      a: "No license, medical or experience. Bring a government ID, wear comfortable clothes and sunglasses, and come with questions about the school's aircraft, instructors, scheduling and pricing — it is as much a school interview as a flight.",
    },
  ],
  "ground-school": [
    {
      q: "What does ground school cover?",
      a: "Aerodynamics, aircraft systems, weather, navigation and flight planning, airspace, regulations and human factors — the knowledge the FAA written test examines and that you use on every flight.",
    },
    {
      q: "Is online ground school as good as in-person?",
      a: "Online courses are accepted by the FAA for the knowledge-test endorsement and are usually cheaper and self-paced; in-person classes offer an instructor to ask and classmates to study with. Many students combine an online course with review sessions from their flight instructor.",
    },
    {
      q: "When should I do ground school?",
      a: "Start it before or alongside your first flying lessons. Understanding the theory as you fly it makes each flight hour count for more, and finishing the knowledge test early keeps it from delaying your checkride.",
    },
  ],
  "seaplane-rating": [
    {
      q: "How long does a seaplane rating take?",
      a: "There is no FAA hour minimum. Most pilots earn the single-engine sea rating in 5 to 10 flight hours over 2 to 5 days at a seaplane base, finishing with a practical test but no additional written exam.",
    },
    {
      q: "What do you learn in seaplane training?",
      a: "Reading the water and wind, step taxiing, glassy- and rough-water takeoffs and landings, docking and beaching, and the handling differences of floats. It is widely considered the most fun add-on rating in aviation.",
    },
  ],
  tailwheel: [
    {
      q: "What is a tailwheel endorsement?",
      a: "A logbook endorsement from an instructor, not a new rating, that lets you act as pilot in command of an airplane with conventional (tailwheel) landing gear. It requires demonstrating normal and crosswind takeoffs and landings, wheel landings, and go-arounds.",
    },
    {
      q: "How long does tailwheel training take?",
      a: "There is no hour minimum. Most pilots need 5 to 10 hours spread over 1 to 3 days, depending on prior experience and the airplane; the skill is precise rudder work on the ground and in the flare.",
    },
  ],
  "high-performance": [
    {
      q: "What is a high-performance endorsement?",
      a: "A logbook endorsement required to act as pilot in command of an airplane with an engine of more than 200 horsepower. An instructor gives ground and flight training on the aircraft's performance, systems and handling, then signs your logbook — there is no test or hour minimum.",
    },
    {
      q: "How long does a high-performance endorsement take?",
      a: "Often a few hours of flying and a ground session, frequently combined with a complex endorsement or a checkout in a specific airplane at the school.",
    },
  ],
  "complex-endorsement": [
    {
      q: "What counts as a complex airplane?",
      a: "An airplane with retractable landing gear, flaps and a controllable-pitch propeller. Flying one as pilot in command requires a one-time logbook endorsement from an instructor covering the systems and procedures.",
    },
    {
      q: "Is a complex airplane still required for the commercial checkride?",
      a: "No. Since 2018 the FAA no longer requires the commercial pilot or flight instructor practical test to be taken in a complex airplane, although some schools still include complex training for the experience.",
    },
  ],
};
