"use client";

import { useActionState } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { assignOwner, revokeOwner } from "@/app/actions/claims";
import { useActionToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

/** Hand a listing to an account directly, without a claim. */
export function AssignOwnerForm() {
  const [state, action, pending] = useActionState(assignOwner, {});
  useActionToast(state, {
    ok: (s) => ({ title: "Owner assigned", description: s.message }),
    errorTitle: "Couldn't assign owner",
  });

  return (
    <form action={action}>
      <FormSection
        title="Assign a listing"
        description="Hands the listing to an existing account and tells them about it. The listing must not already have an owner. No account yet? Invite them from the Users tab instead."
      >
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.message && <Notice tone="ok">{state.message}</Notice>}

        <Field
          label="Listing slug"
          htmlFor="assign-slug"
          hint="The last part of the listing's URL, e.g. skyline-aviation-academy."
          required
        >
          <Input
            id="assign-slug"
            name="schoolSlug"
            type="text"
            required
            placeholder="skyline-aviation-academy"
          />
        </Field>

        <Field
          label="New owner's account email"
          htmlFor="assign-email"
          hint="Must be the address they signed up with."
          required
        >
          <Input id="assign-email" name="email" type="email" required placeholder="owner@school.com" />
        </Field>

        <Button type="submit" disabled={pending}>
          <UserPlus size={15} />
          {pending ? "Assigning…" : "Assign owner"}
        </Button>
      </FormSection>
    </form>
  );
}

/** Take a listing back, so it can be claimed or reassigned. */
export function RevokeOwnerForm() {
  const [state, action, pending] = useActionState(revokeOwner, {});
  useActionToast(state, {
    ok: (s) => ({ title: "Ownership revoked", description: s.message }),
    errorTitle: "Couldn't revoke ownership",
  });

  return (
    <form action={action}>
      <FormSection
        title="Revoke a listing"
        description="Removes the current owner and tells them. The listing becomes claimable again."
      >
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.message && <Notice tone="ok">{state.message}</Notice>}

        <Field label="Listing slug" htmlFor="revoke-slug" required>
          <Input
            id="revoke-slug"
            name="schoolSlug"
            type="text"
            required
            placeholder="skyline-aviation-academy"
          />
        </Field>

        <Button type="submit" variant="secondary" disabled={pending}>
          <UserMinus size={15} />
          {pending ? "Revoking…" : "Revoke ownership"}
        </Button>
      </FormSection>
    </form>
  );
}
