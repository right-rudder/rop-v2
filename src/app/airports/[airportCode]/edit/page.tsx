import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAirportByCode, getCityBySlug, getStateBySlug } from "@/lib/data";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { EditAirportForm } from "./EditAirportForm";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";

type Props = { params: Promise<{ airportCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airportCode } = await params;
  const airport = await getAirportByCode(airportCode);
  return {
    title: airport
      ? `Edit ${airport.icao} – ${airport.name}`
      : "Edit Airport",
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
      <PageHero
        size="narrow"
        back={{ href: `/airports/${airport.icao.toLowerCase()}`, label: "Back to airport" }}
        eyebrow={
          <>
            <span className="font-semibold text-sky">{airport.icao}</span>
            <span className="text-line">/</span>
            Editing airport
          </>
        }
        title={airport.name}
      />
      <Container size="narrow" className="py-12">
        <EditAirportForm
          airport={airport}
          cityName={city?.name ?? airport.citySlug}
          stateName={state?.name ?? airport.stateSlug}
        />
      </Container>
    </div>
  );
}
