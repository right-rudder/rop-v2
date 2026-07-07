import type { Metadata } from "next";
import Link from "next/link";
import { SchoolCard } from "@/components/SchoolCard";
import {
  getFeaturedSchools,
  getCityBySlug,
  getStateBySlug,
  programs,
} from "@/lib/mock-data";
import { schoolHref } from "@/lib/utils";
import { HeroSearch } from "@/components/HeroSearch";

export const metadata: Metadata = {
  title: "Flight School Finder – Find Pilot Training Schools Across the USA",
  description:
    "Find flight schools by city, state, airport, or school name. Compare ratings, programs, and contact info for pilot training across the USA.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Flight School Finder – Find Pilot Training Schools Across the USA",
    description:
      "Find flight schools by city, state, airport, or school name. Compare ratings, programs, and contact info for pilot training across the USA.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "Flight School Finder – Find Pilot Training Schools Across the USA",
    description: "Find flight schools by city, state, airport, or school name.",
  },
};

export default function Home() {
  const featuredSchools = getFeaturedSchools();

  return (
    <div className="pb-20">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-28 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,rgba(59,130,246,0.15),transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Find Pilot Training Schools Across the USA
          </h1>
          <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto mb-10">
            Search by flight school name, city, airport, or state — and compare
            ratings, programs, and contact info.
          </p>

          <HeroSearch />
        </div>
      </section>

      {/* Featured schools */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-rose-800 dark:text-rose-700">
            Featured Flight Schools
          </h2>
          <Link
            href="/featured"
            className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredSchools.map((school) => {
            const city = getCityBySlug(school.citySlug);
            const state = getStateBySlug(school.stateSlug);
            const location =
              city && state
                ? `${city.name}, ${state.abbreviation}`
                : school.citySlug;
            return (
              <SchoolCard
                key={school.id}
                name={school.name}
                location={location}
                rating={school.rating}
                reviewCount={school.reviewCount}
                href={schoolHref(school)}
              />
            );
          })}
        </div>
      </section>
      {/* Why Create an Account */}
      <section className="bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-blue-800 dark:text-blue-400">
            Why Create an Account?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Respond to Comments",
                description:
                  "Engage directly with potential students and classmates. Address feedback and questions other students may have.",
                icon: "💬",
              },
              {
                title: "Add/Update Flight School Listings",
                description:
                  "Manage your flight school's information and keep your listing up-to-date for potential students.",
                icon: "✏️",
              },
              {
                title: "Get Notified on Comments",
                description:
                  "Receive notifications when someone comments on reviews of your flight school or your reviews.",
                icon: "🔔",
              },
              // {
              //   title: "Earn Butter Points",
              //   description: "Accumulate points for your participation that can be redeemed for special benefits.",
              //   icon: "⭐",
              // },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center border border-slate-100 dark:border-zinc-800"
              >
                <div className="text-4xl mb-4 w-16 h-16 flex items-center justify-center mx-auto rounded-full bg-linear-to-br from-blue-100 to-slate-100 dark:from-slate-700 dark:to-slate-600">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Flight Training Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-rose-800 dark:text-rose-700">
          How Flight Training Works
        </h2>
        <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 p-8 space-y-6 text-slate-700 dark:text-slate-300">
          <p className="text-lg">
            Flight training begins with the{" "}
            <strong>Private Pilot License</strong>, which allows you to fly
            small aircraft in good weather conditions. This foundational
            certification is perfect for recreational flying and is the first
            step for anyone interested in aviation.
          </p>
          <p className="text-lg">
            If you&apos;re looking to make a career out of flying, you&apos;ll
            need additional ratings and certificates, such as your Instrument
            Rating, Commercial Pilot License, and potentially Flight Instructor
            Certifications. Most airlines and good paying pilot jobs require{" "}
            <strong>1500 hours of flight time</strong>, and many pilots choose
            to become an instructor to gain the flight time needed to meet
            minimum requirements.
          </p>
          <p className="text-lg">
            Flight schools across the country offer programs to help you achieve
            these certifications and ratings, each with different approaches,
            aircraft fleets, and teaching methodologies.
          </p>
          <p className="text-lg">
            We created <strong>Flight School Finder</strong> to help you
            navigate these options and find the best flight training program for
            your specific goals, budget, and location. Whether you&apos;re
            looking to fly for fun or pursuing a professional career, finding
            the right school is the first step toward your aviation journey.
          </p>
        </div>
      </section>

      {/* Common Flight School Offerings */}
      <section className="bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-blue-800 dark:text-blue-400">
            Common Flight School Offerings
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 text-lg">
            Most flight schools offer some combination of these certifications
            and ratings.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {["private-pilot", "instrument-rating", "commercial-pilot", "cfi"]
              .map((slug) => programs.find((p) => p.slug === slug)!)
              .map((program) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug}`}
                  className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {program.shortName}
                    </h3>
                    {program.minimumHours && (
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-slate-700 px-2 py-1 rounded whitespace-nowrap ml-2">
                        {program.minimumHours}+ hrs
                      </span>
                    )}
                  </div>
                  {program.typicalDuration && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {program.typicalDuration}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {program.description}
                  </p>
                  <span className="mt-4 inline-block text-sm font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">
                    Learn more →
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Update or Add Flight School */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-rose-800 dark:text-rose-700">
            Looking to Update or Add Your Flight School?
          </h2>
          <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 p-8 space-y-6 text-slate-700 dark:text-slate-300">
            <p className="text-lg">
              Adding your flight school to our directory is simple. Start by
              creating a user account through our sign-up process. Once
              registered, you&apos;ll have access to our submission form where
              you can provide details about your flight school, including
              location, aircraft fleet, certifications offered, and instructors.
            </p>
            <p className="text-lg">
              After submission, our team will review your listing to ensure all
              information is accurate and complete. Once approved, your flight
              school will be published on our platform, making it visible to
              potential students searching for flight training in your area.
            </p>
            <div className="text-center pt-4">
              <Link
                href="/signup"
                className="inline-block px-6 py-3 bg-rose-700 text-white font-semibold rounded-xl hover:bg-rose-600 transition-colors shadow-sm"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Looking for Something Different */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-blue-800 dark:text-blue-400">
          Looking for Something Different?
        </h2>
        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 p-8 space-y-6 text-slate-700 dark:text-slate-300">
          <p className="text-lg">
            While flight schools offer structured programs for pilot
            certification, they might not be the right fit for everyone. If
            you&apos;re looking for a more personalized approach to flight
            training, connecting with private Certified Flight Instructors
            (CFIs) could be a better option for you.
          </p>
          <p className="text-lg">
            Private instruction offers more flexibility in scheduling,
            one-on-one attention, and potentially a more tailored learning
            experience that fits your specific needs and learning style.
          </p>
          <div className="text-center pt-4">
            <button className="bg-blue-700 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-sm font-semibold">
              Connect with Private CFIs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
