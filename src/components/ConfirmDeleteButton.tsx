"use client";

import { useState } from "react";
import { useActionState } from "react";
import { usePathname } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ReviewFormState } from "@/app/actions/reviews";

/**
 * Two-step "Delete → Yes, delete / Cancel" control backed by a Server
 * Action. Renders the given hidden `fields` plus a same-site `path` the
 * action revalidates (defaults to the current pathname).
 */
export function ConfirmDeleteButton({
  action,
  fields,
  label,
  confirmText,
  path,
}: {
  action: (prev: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
  fields: Record<string, string>;
  /** Idle button text, e.g. "Delete review" */
  label: string;
  /** Confirmation prompt shown before the final click */
  confirmText: string;
  /** Path to revalidate after success; defaults to the current page */
  path?: string;
}) {
  const pathname = usePathname();
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-danger"
      >
        <Trash2 size={13} aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="path" value={path ?? pathname} />
      <span className="text-xs text-muted">{confirmText}</span>
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold text-danger hover:underline disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs text-muted hover:underline"
      >
        Cancel
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}
