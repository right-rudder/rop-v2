import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Inbox, Mail, ShieldAlert } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAdminCounts } from "@/lib/data";
import { AdminPage } from "./AdminShell";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

export default async function AdminOverviewPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/admin");
  if (!isAdmin(viewer)) notFound();

  const counts = await getAdminCounts();
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  const tiles = [
    {
      href: "/admin/submissions",
      icon: Inbox,
      title: "Submissions",
      value: counts.pendingSubmissions,
      label: `pending ${plural(counts.pendingSubmissions, "submission", "submissions")}`,
      detail: "Approve or reject new school listings.",
    },
    {
      href: "/admin/leads",
      icon: Mail,
      title: "Leads",
      value: counts.newLeads,
      label: `new ${plural(counts.newLeads, "lead", "leads")}`,
      detail: "Information requests awaiting contact.",
    },
    {
      href: "/admin/moderation",
      icon: ShieldAlert,
      title: "Moderation",
      value: counts.reviewsLast7Days,
      label: `${plural(counts.reviewsLast7Days, "review", "reviews")} this week`,
      detail: `${counts.reviews.toLocaleString()} ${plural(counts.reviews, "review", "reviews")} · ${counts.comments.toLocaleString()} ${plural(counts.comments, "comment", "comments")} total`,
    },
  ];

  return (
    <AdminPage
      eyebrow="Overview"
      title="Admin"
      description="Moderation queue and inbound requests at a glance."
    >
      <div className="grid gap-5 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.href} href={tile.href} className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <tile.icon size={16} className="text-accent-ink" aria-hidden />
              {tile.title}
            </div>
            <div>
              <p className="font-display text-4xl font-bold leading-none tracking-tight text-ink">
                {tile.value.toLocaleString()}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-muted">{tile.label}</p>
            </div>
            <p className="mt-auto text-xs text-muted">{tile.detail}</p>
          </Card>
        ))}
      </div>
    </AdminPage>
  );
}
