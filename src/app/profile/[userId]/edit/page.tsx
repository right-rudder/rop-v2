import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPrograms } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { EditProfileForm } from "./EditProfileForm";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";

type Props = { params: Promise<{ userId: string }> };

export const metadata: Metadata = {
  title: "Edit Profile",
  robots: { index: false },
};

export default async function EditProfilePage({ params }: Props) {
  const { userId } = await params;

  const viewer = await getCurrentUser();
  if (!viewer) redirect(`/login?next=/profile/${userId}/edit`);

  // Only your own profile is editable — anyone else's 404s, same as an
  // unmanaged school listing. (Admins don't edit other users' profiles.)
  if (viewer.id !== userId || !viewer.profile) notFound();

  const programs = await getPrograms();
  const backHref = `/profile/${viewer.id}`;

  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        back={{ href: backHref, label: "Back to profile" }}
        eyebrow="Editing profile"
        title={`${viewer.profile.firstName} ${viewer.profile.lastName}`}
        description="What you share here is public on your profile and next to your reviews."
      />
      <Container size="narrow" className="py-12">
        <EditProfileForm
          user={viewer.profile}
          programs={programs.map((p) => ({ slug: p.slug, shortName: p.shortName }))}
          backHref={backHref}
        />
      </Container>
    </div>
  );
}
