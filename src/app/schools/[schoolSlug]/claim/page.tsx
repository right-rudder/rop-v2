import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSchoolBySlug, getPendingClaimFor } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { schoolHref } from "@/lib/utils";
import { ClaimForm } from "./ClaimForm";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";
import { Notice } from "@/components/ui/Notice";
import { Button } from "@/components/ui/Button";

type Props = { params: Promise<{ schoolSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  return {
    title: school ? `Claim ${school.name}` : "Claim a listing",
    robots: { index: false },
  };
}

export default async function ClaimSchoolPage({ params }: Props) {
  const { schoolSlug } = await params;

  const viewer = await getCurrentUser();
  if (!viewer) redirect(`/login?next=/schools/${schoolSlug}/claim`);

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const listingHref = schoolHref(school);
  const pending = await getPendingClaimFor(viewer.id, school.id);

  const hero = (
    <PageHero
      size="narrow"
      back={{ href: listingHref, label: "Back to listing" }}
      eyebrow={
        <>
          <span className="font-semibold text-sky">{school.primaryAirportCode}</span>
          <span className="text-line">/</span>
          Claiming listing
        </>
      }
      title={school.name}
    />
  );

  // Already spoken for, or already asked — say so instead of taking a claim
  // the action would only refuse. (It re-checks both regardless.)
  if (school.managedBy || pending) {
    return (
      <div className="pb-20">
        {hero}
        <Container size="narrow" className="space-y-6 py-12">
          <Notice tone="info">
            {school.managedBy
              ? "Someone already manages this listing. If that's not right, get in touch and we'll sort it out."
              : "Your claim is with our team. We'll let you know as soon as it's been reviewed."}
          </Notice>
          <Button href={listingHref} variant="secondary">
            Back to listing
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {hero}
      <Container size="narrow" className="py-12">
        <ClaimForm
          schoolId={school.id}
          schoolName={school.name}
          backHref={listingHref}
          defaultEmail={viewer.email ?? ""}
        />
      </Container>
    </div>
  );
}
