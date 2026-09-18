"use client";

import { useActionState, useState } from "react";
import { Send } from "lucide-react";
import { inviteUser } from "@/app/actions/users";
import { useActionToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { INVITE_LIMITS } from "@/lib/admin-users";
import type { ListingOption } from "@/lib/data";
import { ListingPicker } from "../ListingPicker";

/** Create an account by invite email, optionally handing it a listing at once. */
export function InviteUserForm({ listings }: { listings: ListingOption[] }) {
  const [state, action, pending] = useActionState(inviteUser, {});
  useActionToast(state, {
    ok: (s) => ({ title: "Invite sent", description: s.message }),
    errorTitle: "Couldn't send invite",
  });

  // The listing just assigned is no longer unowned — drop it once the action succeeds
  const [listing, setListing] = useState<ListingOption | null>(null);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.message) setListing(null);
  }

  return (
    <form action={action}>
      <FormSection
        title="Invite by email"
        description="They get an email with a link to set a password. Pick a listing to make them its owner right away — they can edit it as soon as they accept."
      >
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.message && <Notice tone="ok">{state.message}</Notice>}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="invite-first-name" required>
            <Input
              id="invite-first-name"
              name="firstName"
              type="text"
              required
              maxLength={INVITE_LIMITS.name}
              autoComplete="off"
            />
          </Field>
          <Field label="Last name" htmlFor="invite-last-name" required>
            <Input
              id="invite-last-name"
              name="lastName"
              type="text"
              required
              maxLength={INVITE_LIMITS.name}
              autoComplete="off"
            />
          </Field>
        </div>

        <Field
          label="Email"
          htmlFor="invite-email"
          hint="Becomes their sign-in address. If it already has an account, no invite is sent — a picked listing is simply assigned."
          required
        >
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            maxLength={INVITE_LIMITS.email}
            placeholder="owner@school.com"
            autoComplete="off"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="invite-phone">
            <Input
              id="invite-phone"
              name="phone"
              type="tel"
              maxLength={INVITE_LIMITS.phone}
              autoComplete="off"
            />
          </Field>
          <Field label="Role at the school" htmlFor="invite-role" hint="Sent to the CRM with the contact.">
            <Input
              id="invite-role"
              name="roleTitle"
              type="text"
              maxLength={INVITE_LIMITS.roleTitle}
              placeholder="Chief Flight Instructor"
              autoComplete="off"
            />
          </Field>
        </div>

        <Field
          label="Listing to manage"
          htmlFor="invite-listing"
          hint="Optional. Only listings without an owner appear."
        >
          <ListingPicker
            id="invite-listing"
            name="schoolId"
            options={listings}
            value={listing}
            onChange={setListing}
            emptyLabel="No unowned listing matches"
          />
        </Field>

        <Button type="submit" disabled={pending}>
          <Send size={15} />
          {pending ? "Sending…" : "Send invite"}
        </Button>
      </FormSection>
    </form>
  );
}
