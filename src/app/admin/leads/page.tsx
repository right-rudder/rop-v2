import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getLeads, getSchoolsByIds, getPrograms } from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { LeadCard } from "./LeadCard";
import { AdminPage, AdminSection, AdminEmpty } from "../AdminShell";
import type { Lead, LeadStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Leads – Admin",
  robots: { index: false },
};

const GROUPS: Array<{ status: LeadStatus; title: string; empty: string }> = [
  { status: "new", title: "New", empty: "No new leads — all caught up." },
  { status: "contacted", title: "Contacted", empty: "Nothing in progress." },
  { status: "closed", title: "Closed", empty: "No closed leads yet." },
];

export default async function AdminLeadsPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/admin/leads");
  if (!isAdmin(viewer)) notFound();

  const [leads, programs] = await Promise.all([getLeads(), getPrograms()]);
  const schoolsById = await getSchoolsByIds(leads.flatMap((l) => (l.schoolId ? [l.schoolId] : [])));
  const programNames = Object.fromEntries(programs.map((p) => [p.slug, p.shortName]));
  const byStatus = (status: LeadStatus): Lead[] => leads.filter((l) => l.status === status);
  const newCount = byStatus("new").length;

  return (
    <AdminPage
      eyebrow={`${newCount} new ${newCount === 1 ? "lead" : "leads"}`}
      title="Leads"
      description="Information requests from school pages. Each one is also forwarded to the GoHighLevel workflow."
    >
      {GROUPS.map((group) => {
        const items = byStatus(group.status);
        return (
          <AdminSection key={group.status} title={group.title} count={items.length}>
            {items.length === 0 ? (
              <AdminEmpty>{group.empty}</AdminEmpty>
            ) : (
              <div className="space-y-5">
                {items.map((lead) => {
                  const school = lead.schoolId ? schoolsById[lead.schoolId] : undefined;
                  return (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      school={
                        school
                          ? { name: school.name, href: schoolHref(school), airportCode: school.primaryAirportCode }
                          : null
                      }
                      programName={lead.programSlug ? programNames[lead.programSlug] : undefined}
                    />
                  );
                })}
              </div>
            )}
          </AdminSection>
        );
      })}
    </AdminPage>
  );
}
