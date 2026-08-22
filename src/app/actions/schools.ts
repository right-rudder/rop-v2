"use server";

import { withFlash } from "@/lib/toast";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/supabase/errors";
import { BUCKETS, uploadImage, removeImage } from "@/lib/supabase/storage";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSchoolById, getPrograms } from "@/lib/data";
import { schoolHref, isHttpUrl, isAirportCode } from "@/lib/utils";
import {
  FLEET_RANGES,
  LIMITS,
  type ContactPerson,
  type FleetRange,
} from "@/lib/types";

export type SchoolFormState = {
  error?: string;
  success?: boolean;
};

type FaaPart = "61" | "141" | "both";

const field = (formData: FormData, key: string) =>
  ((formData.get(key) as string | null) ?? "").trim();

function parseFleetRange(value: string): FleetRange | null {
  return (FLEET_RANGES as readonly string[]).includes(value)
    ? (value as FleetRange)
    : null;
}

/** Rebuild ContactPerson[] from `contacts[i][field]` form inputs, dropping empty rows */
function parseContacts(formData: FormData): ContactPerson[] | { error: string } {
  const byIndex = new Map<number, ContactPerson>();
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^contacts\[(\d+)\]\[(name|title|phone|email)\]$/);
    if (!match || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length > LIMITS.contactField) {
      return {
        error: `Contact details must be ${LIMITS.contactField} characters or fewer.`,
      };
    }
    const index = Number(match[1]);
    const contact =
      byIndex.get(index) ?? { name: "", title: "", phone: "", email: "" };
    contact[match[2] as keyof ContactPerson] = trimmed;
    byIndex.set(index, contact);
  }
  const contacts = [...byIndex.values()].filter(
    (c) => c.name || c.title || c.phone || c.email,
  );
  if (contacts.length > LIMITS.contacts) {
    return { error: `Please list at most ${LIMITS.contacts} contacts.` };
  }
  return contacts;
}

type SchoolFields = {
  name: string;
  description: string;
  website: string;
  phone: string;
  faaPart: FaaPart | null;
  estimatedPlanes: FleetRange | null;
  estimatedInstructors: FleetRange | null;
  contacts: ContactPerson[];
};

/**
 * Fields shared by the submit and edit forms, validated to the same limits
 * the database enforces (supabase/schema.sql) so users get a clear message
 * instead of a constraint error.
 */
function parseSchoolFields(
  formData: FormData,
): { fields: SchoolFields } | { error: string } {
  const name = field(formData, "name");
  const description = field(formData, "description");
  const website = field(formData, "website");
  const phone = field(formData, "phone");

  if (!name) return { error: "Please enter the school name." };
  if (name.length > LIMITS.schoolName) {
    return { error: `School name must be ${LIMITS.schoolName} characters or fewer.` };
  }
  if (!description) return { error: "Please enter a description." };
  if (description.length > LIMITS.schoolDescription) {
    return {
      error: `Description must be ${LIMITS.schoolDescription.toLocaleString()} characters or fewer.`,
    };
  }
  if (website && (website.length > LIMITS.website || !isHttpUrl(website))) {
    return {
      error: "Website must be a full address starting with http:// or https://.",
    };
  }
  if (phone.length > LIMITS.phone) {
    return { error: `Phone number must be ${LIMITS.phone} characters or fewer.` };
  }

  const contacts = parseContacts(formData);
  if (!Array.isArray(contacts)) return contacts;

  const faaPart = field(formData, "faaPart");
  return {
    fields: {
      name,
      description,
      website,
      phone,
      faaPart: ["61", "141", "both"].includes(faaPart) ? (faaPart as FaaPart) : null,
      estimatedPlanes: parseFleetRange(field(formData, "estimatedPlanes")),
      estimatedInstructors: parseFleetRange(field(formData, "estimatedInstructors")),
      contacts,
    },
  };
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

  const parsed = parseSchoolFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { fields } = parsed;

  const airportCode = field(formData, "airportCode").toUpperCase();
  const city = field(formData, "city");
  const state = field(formData, "state");
  if (!isAirportCode(airportCode)) {
    return { error: "Please enter a valid airport code (e.g. KFFZ)." };
  }
  if (!city || !state) return { error: "Please enter the city and state." };
  if (city.length > LIMITS.location || state.length > LIMITS.location) {
    return { error: `City and state must be ${LIMITS.location} characters or fewer.` };
  }

  const { error } = await supabase.from("school_submissions").insert({
    submitted_by: user.id,
    name: fields.name,
    description: fields.description,
    website: fields.website,
    phone: fields.phone,
    airport_code: airportCode,
    city,
    state,
    faa_part: fields.faaPart,
    programs: formData.getAll("programs").filter((p): p is string => typeof p === "string"),
    estimated_planes: fields.estimatedPlanes,
    estimated_instructors: fields.estimatedInstructors,
    contacts: fields.contacts,
  });

  if (error) return { error: friendlyDbError(error) };
  return { success: true };
}

export async function updateSchool(
  _prevState: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  const viewer = await getCurrentUser();
  if (!viewer) return { error: "You must be logged in." };

  const schoolId = field(formData, "schoolId");
  const school = schoolId ? await getSchoolById(schoolId) : undefined;
  if (!school) return { error: "School not found." };

  const admin = isAdmin(viewer);
  if (school.managedBy !== viewer.id && !admin) {
    return { error: "You don't have permission to edit this listing." };
  }

  const parsed = parseSchoolFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { fields } = parsed;

  const supabase = await createClient();

  // Resolve the logo before touching the row: a rejected image must not leave
  // the rest of the edit half-saved. `logoPath` stays undefined when the owner
  // didn't touch the field, so the column is left alone.
  let logoPath: string | null | undefined;
  const upload = formData.get("logo");
  if (upload instanceof File && upload.size > 0) {
    const stored = await uploadImage({
      client: supabase,
      bucket: BUCKETS.schoolLogos,
      folder: schoolId,
      file: upload,
    });
    if ("error" in stored) return { error: stored.error };
    logoPath = stored.path;
  } else if (formData.get("removeLogo") === "on") {
    logoPath = null;
  }

  const { error } = await supabase
    .from("flight_schools")
    .update({
      name: fields.name,
      description: fields.description,
      website: fields.website,
      phone: fields.phone,
      faa_part: fields.faaPart,
      estimated_planes: fields.estimatedPlanes,
      estimated_instructors: fields.estimatedInstructors,
      contacts: fields.contacts,
      ...(logoPath !== undefined ? { logo_path: logoPath } : {}),
      // Featuring a listing is an admin call, not the owner's — the
      // protect_flight_school_columns trigger enforces this in the DB too
      ...(admin ? { featured: formData.get("featured") === "on" } : {}),
    })
    .eq("id", schoolId);
  if (error) {
    // Nothing points at the object we just stored, so don't leave it behind.
    if (logoPath) await removeImage(supabase, BUCKETS.schoolLogos, logoPath);
    return { error: friendlyDbError(error) };
  }

  // The row now points somewhere else, so the old object is unreachable. Do
  // this here, not after the program sync below: that has its own early
  // returns, and every one of them would leak the replaced object.
  // Best-effort — an orphan is not worth failing a saved edit over.
  if (logoPath !== undefined && school.logoPath && school.logoPath !== logoPath) {
    await removeImage(supabase, BUCKETS.schoolLogos, school.logoPath);
  }

  // Sync program links without an empty intermediate state: add the checked
  // set first (skipping rows that already exist), then drop the unchecked rest.
  const catalog = new Set((await getPrograms()).map((p) => p.slug));
  const selected = formData
    .getAll("programs")
    .filter((p): p is string => typeof p === "string" && catalog.has(p));

  if (selected.length > 0) {
    const { error: linkError } = await supabase.from("school_programs").upsert(
      selected.map((program_slug) => ({ school_id: schoolId, program_slug })),
      { onConflict: "school_id,program_slug", ignoreDuplicates: true },
    );
    if (linkError) return { error: friendlyDbError(linkError) };
  }

  let removal = supabase.from("school_programs").delete().eq("school_id", schoolId);
  if (selected.length > 0) {
    // Catalog slugs are [a-z0-9-], so no quoting is needed in the filter
    removal = removal.not("program_slug", "in", `(${selected.join(",")})`);
  }
  const { error: clearError } = await removal;
  if (clearError) return { error: friendlyDbError(clearError) };

  revalidatePath(schoolHref(school));
  revalidatePath(`/schools/${school.slug}/edit`);
  // Land on the listing so the owner sees the saved result in place.
  redirect(withFlash(schoolHref(school), "school-updated"));
}
