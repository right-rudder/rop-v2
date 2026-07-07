import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSchoolSubmissions, getPrograms } from "@/lib/data";
import { SubmissionCard } from "./SubmissionCard";

export const metadata: Metadata = {
  title: "School Submissions – Admin – Flight School Finder",
  robots: { index: false },
};

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
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Inbox className="w-10 h-10 text-blue-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            School Submissions
          </h1>
          <p className="text-blue-200 text-lg">
            {pending.length} pending{" "}
            {pending.length === 1 ? "submission" : "submissions"}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {/* Pending */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Pending Review
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-500 dark:text-slate-400">
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
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Recently Processed
            </h2>
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
      </div>
    </div>
  );
}
