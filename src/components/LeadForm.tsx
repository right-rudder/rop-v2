"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { Send } from "lucide-react";
import { submitLead } from "@/app/actions/leads";
import { LEAD_LIMITS } from "@/lib/leads";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Input, Select, Textarea } from "@/components/ui/Input";

type ProgramOption = { slug: string; shortName: string };

/** "Request information" form. Posts to submitLead; success swaps in a confirmation. */
export function LeadForm({
  schoolId,
  schoolName,
  programs,
}: {
  schoolId: string;
  schoolName: string;
  programs: ProgramOption[];
}) {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(submitLead, {});
  const [messageLength, setMessageLength] = useState(0);

  if (state.success) {
    return (
      <Notice tone="ok">
        Sent — {schoolName} will be in touch. We&apos;ve passed your details along so they can
        follow up.
      </Notice>
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

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="lead-name" required>
            <Input id="lead-name" name="name" required maxLength={LEAD_LIMITS.name} autoComplete="name" />
          </Field>
          <Field label="Email" htmlFor="lead-email" required>
            <Input id="lead-email" name="email" type="email" required maxLength={LEAD_LIMITS.email} autoComplete="email" />
          </Field>
          <Field label="Phone" htmlFor="lead-phone" hint="Optional">
            <Input id="lead-phone" name="phone" type="tel" maxLength={LEAD_LIMITS.phone} autoComplete="tel" />
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
