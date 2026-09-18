import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Inbox,
  Mail,
  PencilLine,
  Plane,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
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
      href: "/admin/claims",
      icon: BadgeCheck,
      title: "Claims",
      value: counts.pendingClaims,
      label: `pending ${plural(counts.pendingClaims, "claim", "claims")}`,
      detail: "Requests to manage an existing listing.",
    },
    {
      href: "/admin/suggestions",
      icon: PencilLine,
      title: "Suggestions",
      value: counts.pendingSuggestions,
      label: `pending ${plural(counts.pendingSuggestions, "suggestion", "suggestions")}`,
      detail: "Corrections to listing details from members.",
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

  const totals = [
    { icon: Users, label: plural(counts.users, "user", "users"), value: counts.users },
    { icon: Building2, label: plural(counts.listings, "listing", "listings"), value: counts.listings },
    { icon: UserCheck, label: plural(counts.owners, "owner", "owners"), value: counts.owners },
    { icon: Plane, label: plural(counts.airports, "airport", "airports"), value: counts.airports },
  ];

  return (
    <AdminPage
      eyebrow="Overview"
      title="Admin"
      description="Moderation queue and inbound requests at a glance."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <section aria-labelledby="admin-totals" className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="admin-totals"
            className="font-mono text-xs uppercase tracking-[0.12em] text-muted"
          >
            Directory totals
          </h2>
          <Link href="/admin/users" className="text-sm font-semibold text-accent-ink hover:underline">
            Manage users
          </Link>
        </div>
        <dl className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {totals.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-4 p-5">
              <stat.icon size={18} className="shrink-0 text-accent-ink" aria-hidden />
              <div className="flex flex-col-reverse">
                <dt className="mt-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                  {stat.label}
                </dt>
                <dd className="font-display text-3xl font-bold leading-none tracking-tight text-ink">
                  {stat.value.toLocaleString()}
                </dd>
              </div>
            </Card>
          ))}
        </dl>
      </section>
    </AdminPage>
  );
}
