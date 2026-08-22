"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { setLeadStatus } from "@/app/actions/leads";
import { useActionToast } from "@/components/ToastProvider";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Notice } from "@/components/ui/Notice";

const STATUSES: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

export function LeadCard({
  lead,
  school,
  programName,
}: {
  lead: Lead;
  school: { name: string; href: string; airportCode: string } | null;
  programName?: string;
}) {
  const [state, action, pending] = useActionState(setLeadStatus, {});
  useActionToast(state, { ok: { title: "Lead updated" }, errorTitle: "Couldn't update lead" });
  const date = new Date(lead.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{date}</p>
          <p className="mt-1 font-display text-lg font-bold tracking-tight text-ink">{lead.name}</p>
          {school ? (
            <Link href={school.href} className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted hover:text-accent-ink">
              <MapPin size={13} aria-hidden />
              <span className="font-mono font-semibold text-sky">{school.airportCode}</span> · {school.name}
            </Link>
          ) : (
            <p className="mt-0.5 text-sm text-muted">School no longer listed</p>
          )}
        </div>
        <form action={action} className="flex flex-wrap gap-1.5">
          <input type="hidden" name="id" value={lead.id} />
          {STATUSES.map((s) => (
            <Chip
              key={s.value}
              type="submit"
              name="status"
              value={s.value}
              active={lead.status === s.value}
              disabled={pending || lead.status === s.value}
              className="px-3 py-1 text-xs"
            >
              {s.label}
            </Chip>
          ))}
        </form>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <Mail size={14} className="shrink-0 text-muted" aria-hidden />
          <a href={`mailto:${lead.email}`} className="break-all font-semibold text-accent-ink hover:underline">{lead.email}</a>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="shrink-0 text-muted" aria-hidden />
            <a href={`tel:${lead.phone.replace(/\D/g, "")}`} className="font-semibold text-ink hover:text-accent-ink">{lead.phone}</a>
          </div>
        )}
        {programName && (
          <p className="sm:col-span-2">
            <span className="block text-xs text-muted">Interested in</span>
            <span className="font-semibold text-ink">{programName}</span>
          </p>
        )}
      </div>

      {lead.message && (
        <p className="whitespace-pre-line rounded-xl bg-surface-2 px-4 py-3 text-sm leading-relaxed text-ink">{lead.message}</p>
      )}

      {state.error && <Notice tone="error">{state.error}</Notice>}
    </Card>
  );
}
