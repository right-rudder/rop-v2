import type { Metadata } from "next";
import { PlaneTakeoff } from "lucide-react";
import { redirect } from "next/navigation";
import { getPrograms } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { AddSchoolForm } from "./AddSchoolForm";

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
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <PlaneTakeoff className="w-12 h-12 text-blue-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Add Your Flight School
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">
            List your school for free and connect with students searching for
            flight training in your area.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <AddSchoolForm
          programs={programs.map((p) => ({
            slug: p.slug,
            shortName: p.shortName,
          }))}
        />
      </section>
    </div>
  );
}
