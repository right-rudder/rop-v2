import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSchoolSubmissions, getPrograms } from "@/lib/data";
import { SubmissionCard } from "./SubmissionCard";
import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "School Submissions – Admin",
  robots: { index: false },
};

const h2 = "mb-4 font-display text-2xl font-bold tracking-tight text-ink";

export default async function AdminSubmissionsPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login");
  if (!isAdmin(viewer)) notFound();

  const [submissions, programs] = await Promise.all([
    getSchoolSubmissions(),
    getPrograms(),
  ]);
  const programShortNames = Object.fromEntries(
    programs.map((p) => [p.slug, p.shortName]),
  );

  const pending = submissions.filter((s) => s.status === "pending");
  const processed = submissions.filter((s) => s.status !== "pending");

  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        eyebrow={
          <>
            <Badge tone="accent">Admin</Badge>
            <span className="text-line">/</span>
            {pending.length} pending {pending.length === 1 ? "submission" : "submissions"}
          </>
        }
        title="School submissions"
        description="Approve listings to publish them to the directory, or reject ones that don't belong."
      />

      <Container size="narrow" className="space-y-14 py-12">
        {/* Pending */}
        <section>
          <h2 className={h2}>Pending review</h2>
          {pending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
              No pending submissions — all caught up.
            </div>
          ) : (
            <div className="space-y-5">
              {pending.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  programShortNames={programShortNames}
                />
              ))}
            </div>
          )}
        </section>

        {/* Processed */}
        {processed.length > 0 && (
          <section>
            <h2 className={h2}>Recently processed</h2>
            <div className="space-y-5">
              {processed.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  programShortNames={programShortNames}
                />
              ))}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}
