import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getSchoolBySlug,
  getCityBySlug,
  getStateBySlug,
  getPrograms,
} from "@/lib/data";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { schoolHref } from "@/lib/utils";
import { BUCKETS, publicImageUrl } from "@/lib/supabase/storage";
import { EditSchoolForm } from "./EditSchoolForm";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";

type Props = { params: Promise<{ schoolSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  return {
    title: school
      ? `Edit ${school.name}`
      : "Edit School",
    robots: { index: false },
  };
}

export default async function EditSchoolPage({ params }: Props) {
  const { schoolSlug } = await params;

  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login");

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  // Only the listing's claimed manager or an admin may edit
  if (school.managedBy !== viewer.id && !isAdmin(viewer)) notFound();

  const [city, state, sortedPrograms] = await Promise.all([
    getCityBySlug(school.citySlug),
    getStateBySlug(school.stateSlug),
    getPrograms(),
  ]);

  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        back={{ href: schoolHref(school), label: "Back to listing" }}
        eyebrow={
          <>
            <span className="font-semibold text-sky">{school.primaryAirportCode}</span>
            <span className="text-line">/</span>
            Editing listing
          </>
        }
        title={school.name}
      />
      <Container size="narrow" className="py-12">
        <EditSchoolForm
          school={school}
          cityName={city?.name ?? school.citySlug}
          stateName={state?.name ?? school.stateSlug}
          programs={sortedPrograms.map((p) => ({
            slug: p.slug,
            shortName: p.shortName,
          }))}
          viewerIsAdmin={isAdmin(viewer)}
          backHref={schoolHref(school)}
          logoUrl={
            school.logoPath ? publicImageUrl(BUCKETS.schoolLogos, school.logoPath) : undefined
          }
        />
      </Container>
    </div>
  );
}
