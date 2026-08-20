type DbError = { code?: string; message: string; details?: string | null };

/**
 * Map a PostgREST / Postgres error to something safe to show in a form.
 *
 * The raw message is logged server-side; shown to users it leaks schema
 * details ("violates foreign key constraint reviews_school_id_fkey") and is
 * rarely actionable.
 */
export function friendlyDbError(
  error: DbError,
  fallback = "Something went wrong. Please try again.",
): string {
  console.error("[supabase]", error.code ?? "", error.message, error.details ?? "");
  switch (error.code) {
    case "23505":
      return "That already exists.";
    case "23503":
      return "That record no longer exists — refresh the page and try again.";
    case "23514":
      return "One of the fields is too long or not in the expected format.";
    case "42501":
      return "You don't have permission to do that.";
    default:
      return fallback;
  }
}
