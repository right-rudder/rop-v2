import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPrograms } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { AddSchoolForm } from "./AddSchoolForm";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Add a Flight School",
  description:
    "Submit your flight school to be listed on Flight School Finder. Reach students searching for flight training near them.",
};

export default async function AddSchoolPage() {
  // Submissions are tied to the signed-in user — ask visitors to log in
  // before they fill in the whole form, and bring them back afterwards
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/schools/add");

  const programs = await getPrograms();
  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        eyebrow="For flight schools"
        title="Add your flight school"
        description="List your school for free and connect with students searching for flight training in your area. Listings are reviewed before they go live."
      />
      <Container size="narrow" className="py-12">
        <AddSchoolForm
          programs={programs.map((p) => ({
            slug: p.slug,
            shortName: p.shortName,
          }))}
        />
      </Container>
    </div>
  );
}
