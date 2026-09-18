"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { controlClass } from "@/components/ui/Input";

/**
 * "Type REVOKE to confirm" modal for actions worth a deliberate pause. Render
 * it INSIDE the <form> whose action it guards: its button is that form's only
 * submit button, and the typed word is submitted as `confirm` so the action can
 * check it again. Until the word matches the button is disabled, which also
 * blocks Enter from submitting the form.
 *
 * A native <dialog> opened with showModal(): the focus trap, Esc to close, the
 * inert page behind and the top-layer backdrop all come from the browser.
 */
export function TypedConfirmDialog({
  open,
  onClose,
  title,
  children,
  word,
  confirmLabel,
  pendingLabel,
  pending = false,
  tone = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** What is about to happen, in full — the admin should not have to remember the form */
  children: ReactNode;
  /** The word to type, e.g. "REVOKE" */
  word: string;
  confirmLabel: string;
  pendingLabel: string;
  pending?: boolean;
  /** "danger" for actions that take something away */
  tone?: "default" | "danger";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const titleId = useId();
  const inputId = useId();
  const matches = typed.trim().toUpperCase() === word;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // A stale word must never pre-arm the next confirmation
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setTyped("");
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc and close() both land here. Mid-submit the dialog stays: closing it
      // would hide the pending state without stopping the action.
      onCancel={(e) => {
        if (pending) e.preventDefault();
      }}
      onClose={onClose}
      // The dialog box is covered by its padding-less child, so a click whose
      // target is the dialog itself can only have landed on the backdrop
      onClick={(e) => {
        if (e.target === ref.current && !pending) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-left text-ink shadow-card backdrop:bg-ink/50 backdrop:backdrop-blur-[2px] open:animate-scale-in"
    >
      <div className="space-y-5 p-6">
        <div className="space-y-2">
          <h3 id={titleId} className="font-display text-xl font-bold tracking-tight text-ink">
            {title}
          </h3>
          <div className="text-sm leading-relaxed text-muted">{children}</div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            Type <span className="font-mono tracking-wider">{word}</span> to confirm
          </label>
          <input
            id={inputId}
            name="confirm"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={cn(controlClass, "font-mono tracking-wider")}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={tone === "danger" ? "danger" : "primary"}
            disabled={!matches || pending}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
