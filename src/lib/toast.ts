/**
 * Pure helpers for the global toast queue. No imports — the tests in
 * scripts/tests run this file directly under `node --test`. The React side lives in
 * src/components/ToastProvider.tsx.
 */
export type ToastTone = "ok" | "error" | "info";

export type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss. */
  duration: number;
};

export type ToastInput = {
  tone?: ToastTone;
  title: string;
  description?: string;
  duration?: number;
};

/** Visible at once; older ones are dropped first. */
export const TOAST_MAX = 3;

/** Errors need reading; confirmations just need noticing. */
export const TOAST_DURATION: Record<ToastTone, number> = {
  ok: 4_000,
  info: 5_000,
  error: 8_000,
};

export function createToast(input: ToastInput, id: string): Toast {
  const tone = input.tone ?? "info";
  const description = input.description?.trim();
  return {
    id,
    tone,
    title: input.title.trim(),
    ...(description ? { description } : {}),
    duration: input.duration ?? TOAST_DURATION[tone],
  };
}

/**
 * Append `toast`, newest last. A repeat of the same tone + title replaces the
 * earlier copy (clicking "Save" twice shouldn't stack two "Saved"s), and the
 * list is capped at `max` by dropping the oldest.
 */
export function pushToast(list: readonly Toast[], toast: Toast, max = TOAST_MAX): Toast[] {
  const next = list.filter((t) => !(t.tone === toast.tone && t.title === toast.title));
  next.push(toast);
  return next.length > max ? next.slice(next.length - max) : next;
}

export function removeToast(list: readonly Toast[], id: string): Toast[] {
  return list.filter((t) => t.id !== id);
}

/* ------------------------------------------------------------------
   Flash toasts — for server actions that redirect() after saving. The form
   unmounts before it could raise a toast, so the action appends
   `?toast=<code>` to the redirect target and <FlashToast /> in the root
   layout turns the code into a toast and strips the param. Codes only:
   free text from the URL is never shown.
   ------------------------------------------------------------------ */
export const FLASH_PARAM = "toast";

// `satisfies` (not an annotation) keeps the literal keys so withFlash only
// accepts registered codes.
export const FLASH_TOASTS = {
  "school-updated": { tone: "ok", title: "Listing saved", description: "Your changes are live." },
  "airport-updated": { tone: "ok", title: "Airport saved", description: "Your changes are live." },
  "profile-updated": { tone: "ok", title: "Profile saved" },
  "claim-submitted": {
    tone: "ok",
    title: "Claim submitted",
    description: "We'll let you know once it's been reviewed.",
  },
  "suggestion-submitted": {
    tone: "ok",
    title: "Suggestion submitted",
    description: "Thanks — we'll review it and let you know.",
  },
} satisfies Record<string, ToastInput>;

export type FlashCode = keyof typeof FLASH_TOASTS;

/**
 * Copy for a code from the URL, or undefined. Own keys only: the object has
 * Object.prototype, so `?toast=constructor` would otherwise be truthy.
 */
export function getFlashToast(code: string): ToastInput | undefined {
  return Object.hasOwn(FLASH_TOASTS, code) ? FLASH_TOASTS[code as FlashCode] : undefined;
}

/** `/path` → `/path?toast=code`, respecting an existing query string and hash. */
export function withFlash(path: string, code: FlashCode): string {
  const hashAt = path.indexOf("#");
  const base = hashAt === -1 ? path : path.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : path.slice(hashAt);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${FLASH_PARAM}=${encodeURIComponent(code)}${hash}`;
}
