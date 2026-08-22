/** Minimal viewer shape needed for content-moderation checks (serializable for client components). */
export type ModerationViewer = { id: string | null; isAdmin: boolean };

/**
 * Owner or admin may delete a review/comment. Mirrors the RLS policies
 * "Owner delete" and "Admin delete" on public.reviews / public.comments —
 * this only decides what UI to show; the database is the real gate.
 */
export function canDeleteContent(viewer: ModerationViewer | null, ownerId: string): boolean {
  if (!viewer?.id) return false;
  return viewer.isAdmin || viewer.id === ownerId;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Canonical 8-4-4-4-12 uuid check for ids arriving from form data. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
