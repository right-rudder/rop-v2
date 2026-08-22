"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Send, UserPlus } from "lucide-react";
import { submitLead } from "@/app/actions/leads";
import { LEAD_LIMITS } from "@/lib/leads";
import { useActionToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Input, Select, Textarea } from "@/components/ui/Input";

type ProgramOption = { slug: string; shortName: string };

/** Pre-fill for signed-in visitors; null for guests. */
export type LeadViewer = { name: string; email: string; phone: string };

/**
 * "Request information" form. Posts to submitLead; success swaps in a
 * confirmation — and, for guests, an invitation to create an account with
 * their details carried over to /signup.
 */
export function LeadForm({
  schoolId,
  schoolName,
  programs,
  viewer,
}: {
  schoolId: string;
  schoolName: string;
  programs: ProgramOption[];
  viewer: LeadViewer | null;
}) {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(submitLead, {});
  const [messageLength, setMessageLength] = useState(0);
  useActionToast(state, {
    ok: { title: "Request sent", description: `${schoolName} will be in touch.` },
    errorTitle: "Couldn't send request",
  });

  if (state.success) {
    const signupHref = state.signup
      ? `/signup?${new URLSearchParams({
          next: pathname,
          firstName: state.signup.firstName,
          lastName: state.signup.lastName,
          email: state.signup.email,
        })}`
      : null;
    return (
      <Card className="space-y-6 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={28} className="shrink-0 text-ok" aria-hidden />
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-ink">Request sent</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {schoolName} will be in touch. We&apos;ve passed your details along so they can
              follow up.
            </p>
          </div>
        </div>

        {signupHref && (
          <div className="rounded-xl border border-accent/20 bg-accent-soft/60 p-5">
            <Eyebrow accent>While you wait</Eyebrow>
            <p className="mt-2 font-display text-lg font-bold tracking-tight text-ink">
              Create a free account to keep track of your search
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Save {schoolName}, compare it side by side with other schools, and review it once
              you&apos;ve trained there. We&apos;ll pre-fill your name and email.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button href={signupHref} size="sm">
                <UserPlus size={15} aria-hidden />
                Create account
              </Button>
              <Button
                href={`/login?next=${encodeURIComponent(pathname)}`}
                variant="ghost"
                size="sm"
              >
                I already have one
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="schoolId" value={schoolId} />
        <input type="hidden" name="path" value={pathname} />
        {/* Honeypot — hidden from people, filled by bots. The action discards these. */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
          <label>
            Company website
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {viewer && (
          <p className="text-sm text-muted">
            Sending as <span className="font-semibold text-ink">{viewer.name || viewer.email}</span>
            {" — "}edit anything below if it&apos;s changed.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="lead-name" required>
            <Input
              id="lead-name"
              name="name"
              required
              maxLength={LEAD_LIMITS.name}
              autoComplete="name"
              defaultValue={viewer?.name ?? ""}
            />
          </Field>
          <Field label="Email" htmlFor="lead-email" required>
            <Input
              id="lead-email"
              name="email"
              type="email"
              required
              maxLength={LEAD_LIMITS.email}
              autoComplete="email"
              defaultValue={viewer?.email ?? ""}
            />
          </Field>
          <Field label="Phone" htmlFor="lead-phone" hint="Optional">
            <Input
              id="lead-phone"
              name="phone"
              type="tel"
              maxLength={LEAD_LIMITS.phone}
              autoComplete="tel"
              defaultValue={viewer?.phone ?? ""}
            />
          </Field>
          <Field label="I'm interested in" htmlFor="lead-program">
            <Select id="lead-program" name="program" defaultValue="">
              <option value="">Not sure yet</option>
              {programs.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.shortName}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Message"
          htmlFor="lead-message"
          hint={`${messageLength.toLocaleString()} / ${LEAD_LIMITS.message.toLocaleString()}`}
        >
          <Textarea
            id="lead-message"
            name="message"
            rows={4}
            maxLength={LEAD_LIMITS.message}
            placeholder="When would you like to start? Any questions about schedules, pricing, or financing?"
            onChange={(e) => setMessageLength(e.target.value.length)}
          />
        </Field>

        {state.error && <Notice tone="error">{state.error}</Notice>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">Shared only with this school and our team.</p>
          <Button type="submit" disabled={pending}>
            <Send size={15} aria-hidden />
            {pending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
