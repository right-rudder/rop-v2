import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getLeads, getSchoolsByIds, getPrograms } from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { LeadCard } from "./LeadCard";
import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import type { Lead, LeadStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Leads – Admin",
  robots: { index: false },
};

const h2 = "mb-4 font-display text-2xl font-bold tracking-tight text-ink";

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
  const schoolsById = await getSchoolsByIds(leads.map((l) => l.schoolId));
  const programNames = Object.fromEntries(programs.map((p) => [p.slug, p.shortName]));
  const byStatus = (status: LeadStatus): Lead[] => leads.filter((l) => l.status === status);
  const newCount = byStatus("new").length;

  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        eyebrow={
          <>
            <Badge tone="accent">Admin</Badge>
            <span className="text-line">/</span>
            {newCount} new {newCount === 1 ? "lead" : "leads"}
          </>
        }
        title="Leads"
        description="Information requests from school pages. Each one is also forwarded to the GoHighLevel workflow."
      />

      <Container size="narrow" className="space-y-14 py-12">
        {GROUPS.map((group) => {
          const items = byStatus(group.status);
          return (
            <section key={group.status}>
              <h2 className={h2}>
                {group.title}{" "}
                <span className="font-mono text-base font-normal text-muted">{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
                  {group.empty}
                </div>
              ) : (
                <div className="space-y-5">
                  {items.map((lead) => {
                    const school = schoolsById[lead.schoolId];
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
            </section>
          );
        })}
      </Container>
    </div>
  );
}
