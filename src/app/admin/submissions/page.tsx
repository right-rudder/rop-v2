import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSchoolSubmissions, getPrograms } from "@/lib/data";
import { SubmissionCard } from "./SubmissionCard";
import { AdminPage, AdminSection, AdminEmpty } from "../AdminShell";

export const metadata: Metadata = {
  title: "School Submissions – Admin",
  robots: { index: false },
};

export default async function AdminSubmissionsPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/admin/submissions");
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
    <AdminPage
      eyebrow={`${pending.length} pending ${pending.length === 1 ? "submission" : "submissions"}`}
      title="School submissions"
      description="Approve listings to publish them to the directory, or reject ones that don't belong."
    >
      {/* Pending */}
      <AdminSection title="Pending review">
        {pending.length === 0 ? (
          <AdminEmpty>No pending submissions — all caught up.</AdminEmpty>
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
      </AdminSection>

      {/* Processed */}
      {processed.length > 0 && (
        <AdminSection title="Recently processed">
          <div className="space-y-5">
            {processed.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                programShortNames={programShortNames}
              />
            ))}
          </div>
        </AdminSection>
      )}
    </AdminPage>
  );
}
