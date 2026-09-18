"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/supabase/errors";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import {
  loadSchoolById,
  getSuggestionById,
  getPendingSuggestionsFor,
  invalidateCatalog,
} from "@/lib/data";
import { notifyUser } from "@/lib/notify";
import { contactsFromEntries } from "@/lib/contacts";
import {
  validateSuggestion,
  suggestionValuesEqual,
  suggestionFieldLabel,
  currentValueFor,
  type SuggestionField,
  type SuggestionValue,
} from "@/lib/suggestions";
import { schoolHref } from "@/lib/utils";
import { withFlash } from "@/lib/toast";
import type { FlightSchool } from "@/lib/types";

export type SuggestionActionState = {
  error?: string;
  message?: string;
};

const PENDING_MESSAGE = "You already have a suggestion for that field waiting for review.";

const field = (formData: FormData, key: string) =>
  ((formData.get(key) as string | null) ?? "").trim();

/** The shape notifyUser needs, from a listing. */
const notifyTarget = (school: FlightSchool) => ({
  id: school.id,
  name: school.name,
  path: schoolHref(school),
  editPath: `/schools/${school.slug}/edit`,
});

/**
 * The proposed value as the form sent it: the repeating contact rows for
 * `contacts`, the single `value` input for everything else. Validation of
 * the content itself happens in validateSuggestion.
 */
function readProposedValue(
  formData: FormData,
  fieldKey: string,
): { value: unknown } | { error: string } {
  if (fieldKey === "contacts") {
    const contacts = contactsFromEntries(formData.entries());
    return Array.isArray(contacts) ? { value: contacts } : contacts;
  }
  return { value: field(formData, "value") };
}

/** Whether the admin's approve form carried a value at all (it always should). */
function carriesValue(formData: FormData, fieldKey: SuggestionField): boolean {
  if (fieldKey !== "contacts") return formData.has("value");
  for (const key of formData.keys()) if (key.startsWith("contacts[")) return true;
  return false;
}

type ListingUpdate = Database["public"]["Tables"]["flight_schools"]["Update"];

/** The one-column patch an approved suggestion writes. */
function listingPatch(fieldKey: SuggestionField, value: SuggestionValue): ListingUpdate {
  if (fieldKey === "contacts") return { contacts: Array.isArray(value) ? value : [] };
  const text = typeof value === "string" ? value : "";
  switch (fieldKey) {
    case "phone":
      return { phone: text };
    case "website":
      return { website: text };
    case "address":
      return { address: text };
    case "hours":
      return { hours: text };
  }
}

// ── Filing ────────────────────────────────────────────────────────────────────

export async function createSuggestion(
  _prev: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  const viewer = await getCurrentUser();
  if (!viewer) return { error: "Please sign in to suggest an edit." };

  const schoolId = field(formData, "schoolId");
  const school = schoolId ? await loadSchoolById(schoolId) : undefined;
  if (!school) return { error: "Missing school." };
  // People who can edit the listing have no reason to queue a change to it.
  if (school.managedBy === viewer.id || isAdmin(viewer)) {
    return { error: "You can edit this listing directly." };
  }

  const fieldKey = field(formData, "field");
  const read = readProposedValue(formData, fieldKey);
  if ("error" in read) return { error: read.error };

  const validation = validateSuggestion({
    field: fieldKey,
    reason: field(formData, "reason"),
    note: field(formData, "note"),
    value: read.value,
  });
  if (!validation.ok) return { error: validation.error };
  const suggestion = validation.value;

  const current = currentValueFor(school, suggestion.field);
  if (suggestionValuesEqual(suggestion.value, current)) {
    return { error: "That's what the listing already shows." };
  }

  // Friendlier than letting the partial unique index raise 23505 — though the
  // insert below still handles that, for two submits racing each other.
  const pending = await getPendingSuggestionsFor(viewer.id, school.id);
  if (pending.some((s) => s.field === suggestion.field)) return { error: PENDING_MESSAGE };

  const supabase = await createClient();
  const { error } = await supabase.from("school_suggestions").insert({
    school_id: school.id,
    user_id: viewer.id,
    field: suggestion.field,
    proposed_value: suggestion.value,
    current_value: current,
    reason: suggestion.reason,
    note: suggestion.note,
    status: "pending",
  });
  if (error) {
    return { error: error.code === "23505" ? PENDING_MESSAGE : friendlyDbError(error) };
  }

  revalidatePath("/admin/suggestions");
  redirect(withFlash(schoolHref(school), "suggestion-submitted"));
}

// ── Review ────────────────────────────────────────────────────────────────────

export async function approveSuggestion(
  _prev: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  // The !viewer half is redundant with isAdmin, but it narrows the type so
  // recording who decided below needs no non-null assertion.
  const viewer = await getCurrentUser();
  if (!viewer || !isAdmin(viewer)) return { error: "Admin access required." };

  const suggestion = await getSuggestionById(field(formData, "suggestionId"));
  if (!suggestion) return { error: "Suggestion not found." };
  if (suggestion.status !== "pending") {
    return { error: "This suggestion has already been processed." };
  }

  const school = await loadSchoolById(suggestion.schoolId);
  if (!school) return { error: "That listing no longer exists." };

  // The admin may edit the value before applying it. The edit follows exactly
  // the member's rules; the stored reason and note ride along unchanged.
  let value: unknown = suggestion.proposedValue;
  if (carriesValue(formData, suggestion.field)) {
    const read = readProposedValue(formData, suggestion.field);
    if ("error" in read) return { error: read.error };
    value = read.value;
  }
  const validation = validateSuggestion({
    field: suggestion.field,
    reason: suggestion.reason,
    note: suggestion.note,
    value,
  });
  if (!validation.ok) return { error: validation.error };
  const applied = validation.value.value;

  const supabase = await createClient();

  // Listing first, then the status flip — the same crash-safe order as
  // approveClaim. Writing the value is idempotent, so if anything fails in
  // between, the suggestion stays pending and approving again finishes the job.
  try {
    const { data, error } = await supabase
      .from("flight_schools")
      .update(listingPatch(suggestion.field, applied))
      .eq("id", school.id)
      .select("id");
    if (error) return { error: friendlyDbError(error) };
    if (!data || data.length === 0) {
      return { error: "Couldn't update the listing — refresh and try again." };
    }
  } finally {
    invalidateCatalog();
  }

  const { data: updated, error: updateError } = await supabase
    .from("school_suggestions")
    .update({
      status: "approved",
      applied_value: applied,
      decided_by: viewer.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", suggestion.id)
    .eq("status", "pending")
    .select("id");
  if (updateError) {
    return {
      error: `${school.name} was updated, but the suggestion could not be marked approved (${updateError.message}). Approve again to finish.`,
    };
  }
  if (!updated || updated.length === 0) {
    return { error: "This suggestion has already been processed." };
  }

  await notifyUser({
    userId: suggestion.userId,
    type: "suggestion_approved",
    school: notifyTarget(school),
  });

  revalidatePath("/admin/suggestions");
  revalidatePath(schoolHref(school));
  revalidatePath(`/profile/${suggestion.userId}`);
  const label = suggestionFieldLabel(suggestion.field).toLowerCase();
  return { message: `Applied — the ${label} on ${school.name} is updated.` };
}

export async function rejectSuggestion(
  _prev: SuggestionActionState,
  formData: FormData,
): Promise<SuggestionActionState> {
  const viewer = await getCurrentUser();
  if (!viewer || !isAdmin(viewer)) return { error: "Admin access required." };

  const suggestion = await getSuggestionById(field(formData, "suggestionId"));
  if (!suggestion) return { error: "Suggestion not found." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_suggestions")
    .update({
      status: "rejected",
      decided_by: viewer.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", suggestion.id)
    .eq("status", "pending")
    .select("id");
  if (error) return { error: friendlyDbError(error) };
  if (!data || data.length === 0) return { error: "This suggestion has already been processed." };

  const school = await loadSchoolById(suggestion.schoolId);
  if (school) {
    await notifyUser({
      userId: suggestion.userId,
      type: "suggestion_rejected",
      school: notifyTarget(school),
    });
  }

  revalidatePath("/admin/suggestions");
  return { message: "Suggestion declined." };
}
