import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSchoolBySlug, getPendingSuggestionsFor } from "@/lib/data";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { schoolHref } from "@/lib/utils";
import { SUGGESTION_FIELDS, isSuggestionField, type SuggestionField } from "@/lib/suggestions";
import { SuggestEditForm } from "./SuggestEditForm";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";
import { Notice } from "@/components/ui/Notice";
import { Button } from "@/components/ui/Button";

type Props = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ field?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  return {
    title: school ? `Suggest an edit – ${school.name}` : "Suggest an edit",
    robots: { index: false },
  };
}

export default async function SuggestEditPage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;

  const viewer = await getCurrentUser();
  if (!viewer) redirect(`/login?next=/schools/${schoolSlug}/suggest`);

  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  const listingHref = schoolHref(school);
  const canEdit = school.managedBy === viewer.id || isAdmin(viewer);

  const hero = (
    <PageHero
      size="narrow"
      back={{ href: listingHref, label: "Back to listing" }}
      eyebrow={
        <>
          <span className="font-semibold text-sky">{school.primaryAirportCode}</span>
          <span className="text-line">/</span>
          Suggesting an edit
        </>
      }
      title={school.name}
    />
  );

  // People who can edit the listing have no reason to queue a change to it.
  // (The action refuses them regardless.)
  if (canEdit) {
    return (
      <div className="pb-20">
        {hero}
        <Container size="narrow" className="space-y-6 py-12">
          <Notice tone="info">You manage this listing — you can edit it directly.</Notice>
          <Button href={`/schools/${school.slug}/edit`} variant="secondary">
            Edit listing
          </Button>
        </Container>
      </div>
    );
  }

  const pending = await getPendingSuggestionsFor(viewer.id, school.id);
  const pendingFields = pending.map((s) => s.field);
  const openFields = SUGGESTION_FIELDS.map((f) => f.key).filter((f) => !pendingFields.includes(f));

  if (openFields.length === 0) {
    return (
      <div className="pb-20">
        {hero}
        <Container size="narrow" className="space-y-6 py-12">
          <Notice tone="info">
            Your suggestions for this listing are with our team. We&apos;ll let you know as soon
            as they&apos;ve been reviewed.
          </Notice>
          <Button href={listingHref} variant="secondary">
            Back to listing
          </Button>
        </Container>
      </div>
    );
  }

  const { field: requested } = await searchParams;
  const defaultField: SuggestionField =
    requested && isSuggestionField(requested) && openFields.includes(requested)
      ? requested
      : openFields[0];

  return (
    <div className="pb-20">
      {hero}
      <Container size="narrow" className="py-12">
        <SuggestEditForm
          schoolId={school.id}
          schoolName={school.name}
          backHref={listingHref}
          defaultField={defaultField}
          pendingFields={pendingFields}
          current={{
            phone: school.phone,
            website: school.website,
            address: school.address ?? "",
            hours: school.hours ?? "",
            contacts: school.contacts ?? [],
          }}
        />
      </Container>
    </div>
  );
}
