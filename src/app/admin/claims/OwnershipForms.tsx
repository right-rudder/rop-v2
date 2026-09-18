"use client";

import { useActionState, useState, type MouseEvent } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { assignOwner, revokeOwner } from "@/app/actions/claims";
import { useActionToast } from "@/components/ToastProvider";
import { TypedConfirmDialog } from "@/components/TypedConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { OWNERSHIP_CONFIRM } from "@/lib/claims";
import type { ListingOption } from "@/lib/data";
import { ListingPicker } from "../ListingPicker";

/**
 * What both forms share: the picked listing, the open/closed confirmation, and
 * what happens when the action answers — the dialog closes either way (an error
 * belongs in the form, where it stays readable), and a success drops the
 * listing, which no longer belongs in this picker.
 */
function useOwnershipForm(state: { error?: string; message?: string }, onSuccess?: () => void) {
  const [listing, setListing] = useState<ListingOption | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [needsListing, setNeedsListing] = useState(false);

  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    setConfirming(false);
    if (state.message) {
      setListing(null);
      onSuccess?.();
    }
  }

  /** Open the confirmation only over a form that could actually be submitted. */
  function review(e: MouseEvent<HTMLButtonElement>) {
    setNeedsListing(!listing);
    if (!listing) return;
    if (e.currentTarget.form?.reportValidity()) setConfirming(true);
  }

  function pick(option: ListingOption | null) {
    setListing(option);
    if (option) setNeedsListing(false);
  }

  return {
    listing,
    pick,
    confirming,
    review,
    cancel: () => setConfirming(false),
    listingError: needsListing ? "Pick a listing first." : undefined,
  };
}

/** Hand a listing to an account directly, without a claim. */
export function AssignOwnerForm({ listings }: { listings: ListingOption[] }) {
  const [state, action, pending] = useActionState(assignOwner, {});
  useActionToast(state, {
    ok: (s) => ({ title: "Owner assigned", description: s.message }),
    errorTitle: "Couldn't assign owner",
  });
  // Controlled so the confirmation can name the address — which also means
  // React's post-action form reset no longer clears it for us.
  const [email, setEmail] = useState("");
  const form = useOwnershipForm(state, () => setEmail(""));

  return (
    <form action={action}>
      <FormSection
        title="Assign a listing"
        description="Hands the listing to an existing account and tells them about it. No account yet? Invite them from the Users tab instead."
      >
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.message && <Notice tone="ok">{state.message}</Notice>}

        <Field
          label="Listing"
          htmlFor="assign-listing"
          hint="Only listings without an owner appear."
          error={form.listingError}
          required
        >
          <ListingPicker
            id="assign-listing"
            name="schoolId"
            options={listings}
            value={form.listing}
            onChange={form.pick}
            emptyLabel="No unowned listing matches"
          />
        </Field>

        <Field
          label="New owner's account email"
          htmlFor="assign-email"
          hint="Must be the address they signed up with."
          required
        >
          <Input
            id="assign-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@school.com"
            autoComplete="off"
          />
        </Field>

        <Button onClick={form.review} disabled={pending}>
          <UserPlus size={15} />
          Assign owner…
        </Button>

        <TypedConfirmDialog
          open={form.confirming}
          onClose={form.cancel}
          title="Assign this listing?"
          word={OWNERSHIP_CONFIRM.assign}
          confirmLabel="Assign owner"
          pendingLabel="Assigning…"
          pending={pending}
        >
          <strong className="font-semibold text-ink">{email.trim()}</strong> will be able to edit{" "}
          <strong className="font-semibold text-ink">{form.listing?.name}</strong>
          {form.listing && ` (${form.listing.location})`}, and is told about it. Any pending
          claims on the listing stay in the queue.
        </TypedConfirmDialog>
      </FormSection>
    </form>
  );
}

/** Take a listing back, so it can be claimed or reassigned. */
export function RevokeOwnerForm({ listings }: { listings: ListingOption[] }) {
  const [state, action, pending] = useActionState(revokeOwner, {});
  useActionToast(state, {
    ok: (s) => ({ title: "Ownership revoked", description: s.message }),
    errorTitle: "Couldn't revoke ownership",
  });
  const form = useOwnershipForm(state);

  return (
    <form action={action}>
      <FormSection
        title="Revoke a listing"
        description="Removes the current owner and tells them. The listing becomes claimable again."
      >
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.message && <Notice tone="ok">{state.message}</Notice>}

        <Field
          label="Listing"
          htmlFor="revoke-listing"
          hint={
            listings.length === 0
              ? "No listing has an owner yet."
              : "Only listings with an owner appear. Search by school, place or owner."
          }
          error={form.listingError}
          required
        >
          <ListingPicker
            id="revoke-listing"
            name="schoolId"
            options={listings}
            value={form.listing}
            onChange={form.pick}
            emptyLabel="No owned listing matches"
          />
        </Field>

        <Button variant="secondary" onClick={form.review} disabled={pending}>
          <UserMinus size={15} />
          Revoke ownership…
        </Button>

        <TypedConfirmDialog
          open={form.confirming}
          onClose={form.cancel}
          title="Revoke this listing?"
          word={OWNERSHIP_CONFIRM.revoke}
          confirmLabel="Revoke ownership"
          pendingLabel="Revoking…"
          pending={pending}
          tone="danger"
        >
          <strong className="font-semibold text-ink">{form.listing?.owner ?? "The current owner"}</strong>{" "}
          will no longer be able to edit{" "}
          <strong className="font-semibold text-ink">{form.listing?.name}</strong>
          {form.listing && ` (${form.listing.location})`}, and is told about it. The listing itself
          and its content stay as they are.
        </TypedConfirmDialog>
      </FormSection>
    </form>
  );
}
