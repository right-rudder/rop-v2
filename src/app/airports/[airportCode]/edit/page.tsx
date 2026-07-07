import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { getAirportByCode, getCityBySlug, getStateBySlug } from "@/lib/data";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { EditAirportForm } from "./EditAirportForm";

type Props = { params: Promise<{ airportCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airportCode } = await params;
  const airport = await getAirportByCode(airportCode);
  return {
    title: airport
      ? `Edit ${airport.icao} – ${airport.name} – Flight School Finder`
      : "Edit Airport – Flight School Finder",
    robots: { index: false },
  };
}

export default async function EditAirportPage({ params }: Props) {
  const { airportCode } = await params;

  // Airports have no per-listing owner — editing is admin-only
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login");
  if (!isAdmin(viewer)) notFound();

  const airport = await getAirportByCode(airportCode);
  if (!airport) notFound();

  const [city, state] = await Promise.all([
    getCityBySlug(airport.citySlug),
    getStateBySlug(airport.stateSlug),
  ]);

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Pencil className="w-10 h-10 text-blue-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Edit Airport
          </h1>
          <p className="text-blue-200 text-lg">
            Editing{" "}
            <span className="font-semibold text-white">
              {airport.icao} – {airport.name}
            </span>
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <EditAirportForm
          airport={airport}
          cityName={city?.name ?? airport.citySlug}
          stateName={state?.name ?? airport.stateSlug}
        />
      </section>
    </div>
  );
}
