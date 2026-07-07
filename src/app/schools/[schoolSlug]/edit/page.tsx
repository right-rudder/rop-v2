import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import {
  getSchoolBySlug,
  getCityBySlug,
  getStateBySlug,
  getPrograms,
} from "@/lib/data";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { schoolHref } from "@/lib/utils";
import { EditSchoolForm } from "./EditSchoolForm";

type Props = { params: Promise<{ schoolSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  return {
    title: school
      ? `Edit ${school.name} – Flight School Finder`
      : "Edit School – Flight School Finder",
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
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Pencil className="w-10 h-10 text-blue-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Edit Flight School
          </h1>
          <p className="text-blue-200 text-lg">
            Editing{" "}
            <span className="font-semibold text-white">{school.name}</span>
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-4 py-12">
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
        />
      </section>
    </div>
  );
}
