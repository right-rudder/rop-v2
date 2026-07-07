"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSchoolById, getPrograms } from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import type { ContactPerson } from "@/lib/types";

export type SchoolFormState = {
  error?: string;
  success?: boolean;
};

const FLEET_RANGES = ["1-3", "3-6", "6-9", "10-20", "20-30", "30-40", "40-50", "50+"];

/** Rebuild ContactPerson[] from `contacts[i][field]` form inputs, dropping empty rows */
function parseContacts(formData: FormData): ContactPerson[] {
  const byIndex = new Map<number, ContactPerson>();
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^contacts\[(\d+)\]\[(name|title|phone|email)\]$/);
    if (!match || typeof value !== "string") continue;
    const index = Number(match[1]);
    const contact =
      byIndex.get(index) ?? { name: "", title: "", phone: "", email: "" };
    contact[match[2] as keyof ContactPerson] = value.trim();
    byIndex.set(index, contact);
  }
  return [...byIndex.values()].filter(
    (c) => c.name || c.title || c.phone || c.email,
  );
}

export async function submitSchool(
  _prevState: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to submit a school." };

  const field = (key: string) =>
    ((formData.get(key) as string | null) ?? "").trim();

  const name = field("name");
  const description = field("description");
  const airportCode = field("airportCode").toUpperCase();
  const city = field("city");
  const state = field("state");

  if (!name) return { error: "Please enter the school name." };
  if (!description) return { error: "Please enter a description." };
  if (!/^[A-Z0-9]{3,4}$/.test(airportCode)) {
    return { error: "Please enter a valid airport code (e.g. KFFZ)." };
  }
  if (!city || !state) return { error: "Please enter the city and state." };

  const faaPart = field("faaPart");
  const estimatedPlanes = field("estimatedPlanes");
  const estimatedInstructors = field("estimatedInstructors");

  const { error } = await supabase.from("school_submissions").insert({
    submitted_by: user.id,
    name,
    description,
    website: field("website"),
    phone: field("phone"),
    airport_code: airportCode,
    city,
    state,
    faa_part: ["61", "141", "both"].includes(faaPart) ? faaPart : null,
    programs: formData.getAll("programs").filter((p) => typeof p === "string"),
    estimated_planes: FLEET_RANGES.includes(estimatedPlanes)
      ? estimatedPlanes
      : null,
    estimated_instructors: FLEET_RANGES.includes(estimatedInstructors)
      ? estimatedInstructors
      : null,
    contacts: parseContacts(formData),
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateSchool(
  _prevState: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  const viewer = await getCurrentUser();
  if (!viewer) return { error: "You must be logged in." };

  const schoolId = formData.get("schoolId") as string;
  const school = await getSchoolById(schoolId);
  if (!school) return { error: "School not found." };

  const admin = isAdmin(viewer);
  if (school.managedBy !== viewer.id && !admin) {
    return { error: "You don't have permission to edit this listing." };
  }

  const field = (key: string) =>
    ((formData.get(key) as string | null) ?? "").trim();

  const name = field("name");
  const description = field("description");
  if (!name) return { error: "Please enter the school name." };
  if (!description) return { error: "Please enter a description." };

  const faaPart = field("faaPart");
  const estimatedPlanes = field("estimatedPlanes");
  const estimatedInstructors = field("estimatedInstructors");

  const supabase = await createClient();
  const { error } = await supabase
    .from("flight_schools")
    .update({
      name,
      description,
      website: field("website"),
      phone: field("phone"),
      faa_part: ["61", "141", "both"].includes(faaPart) ? faaPart : null,
      estimated_planes: FLEET_RANGES.includes(estimatedPlanes)
        ? estimatedPlanes
        : null,
      estimated_instructors: FLEET_RANGES.includes(estimatedInstructors)
        ? estimatedInstructors
        : null,
      contacts: parseContacts(formData),
      // Featuring a listing is an admin call, not the owner's
      ...(admin ? { featured: formData.get("featured") === "on" } : {}),
    })
    .eq("id", schoolId);
  if (error) return { error: error.message };

  // Sync program links: clear and re-insert the checked set
  const catalog = new Set((await getPrograms()).map((p) => p.slug));
  const selected = formData
    .getAll("programs")
    .filter((p): p is string => typeof p === "string" && catalog.has(p));

  const { error: clearError } = await supabase
    .from("school_programs")
    .delete()
    .eq("school_id", schoolId);
  if (clearError) return { error: clearError.message };

  if (selected.length > 0) {
    const { error: linkError } = await supabase.from("school_programs").insert(
      selected.map((program_slug) => ({ school_id: schoolId, program_slug })),
    );
    if (linkError) return { error: linkError.message };
  }

  revalidatePath(schoolHref(school));
  revalidatePath(`/schools/${school.slug}/edit`);
  return { success: true };
}
