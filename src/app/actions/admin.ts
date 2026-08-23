"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
// Approval creates catalog rows, so every existence check here uses the
// fresh `load*` readers: a cached "not found" would produce a duplicate
// city, a second airport insert, or a slug collision.
import {
  getStates,
  loadCityBySlug,
  loadAirportByCode,
  loadSchoolBySlug,
  loadSchoolsManagedByUser,
  getSchoolSubmissionById,
  getPrograms,
  invalidateCatalog,
} from "@/lib/data";
import { slugify, isAirportCode } from "@/lib/utils";
import type { SchoolSubmission, State } from "@/lib/types";

export type AdminActionState = {
  error?: string;
  message?: string;
};

/** Match free-text state input against the states catalog (name or abbreviation) */
async function resolveState(input: string): Promise<State | undefined> {
  const needle = input.trim().toLowerCase();
  const states = await getStates();
  return states.find(
    (s) => s.name.toLowerCase() === needle || s.abbreviation.toLowerCase() === needle,
  );
}

/** Find or create the city for a submission; returns its slug */
async function resolveCitySlug(
  cityName: string,
  state: State,
): Promise<string> {
  const supabase = await createClient();
  const baseSlug = slugify(cityName);

  const existing = await loadCityBySlug(baseSlug);
  if (existing && existing.stateSlug === state.slug) return existing.slug;

  // Slug taken by a same-named city in another state, or city doesn't exist yet
  const slug = existing ? `${baseSlug}-${state.id}` : baseSlug;
  const collision = existing ? await loadCityBySlug(slug) : null;
  if (collision) return collision.slug;

  const { error } = await supabase.from("cities").insert({
    id: `${state.id}-${slug}`,
    name: cityName.trim(),
    slug,
    state_slug: state.slug,
    state_abbreviation: state.abbreviation,
  });
  if (error) throw new Error(`Could not create city: ${error.message}`);
  return slug;
}

/** Find or create the airport for a submission; returns its ICAO code */
async function resolveAirportIcao(
  code: string,
  citySlug: string,
  state: State,
): Promise<string> {
  const supabase = await createClient();
  const existing = await loadAirportByCode(code);
  if (existing) return existing.icao;

  const icao = code.toUpperCase();
  // Most US general aviation fields have only a 3-4 character FAA local
  // identifier, so accept those as well as 4-letter ICAO codes.
  if (!isAirportCode(icao)) {
    throw new Error(
      `Airport "${code}" is not in the catalog and is not a valid airport identifier. Add the airport first.`,
    );
  }

  // Minimal placeholder row — edit it at /airports/<icao>/edit afterwards
  const { error } = await supabase.from("airports").insert({
    id: icao.toLowerCase(),
    name: `${icao} Airport`,
    icao,
    city_slug: citySlug,
    state_slug: state.slug,
  });
  if (error) throw new Error(`Could not create airport: ${error.message}`);
  return icao;
}

/** A unique flight_schools slug based on the school name */
async function uniqueSchoolSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; await loadSchoolBySlug(slug); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

async function createSchoolFromSubmission(
  submission: SchoolSubmission,
): Promise<string> {
  const supabase = await createClient();

  const state = await resolveState(submission.state);
  if (!state) {
    throw new Error(
      `"${submission.state}" doesn't match any US state name or abbreviation.`,
    );
  }

  // Re-approving after a partial failure must not create a duplicate listing
  const alreadyCreated = (
    await loadSchoolsManagedByUser(submission.submittedBy)
  ).find((s) => s.name === submission.name);

  let schoolId: string;
  if (alreadyCreated) {
    schoolId = alreadyCreated.id;
  } else {
    const citySlug = await resolveCitySlug(submission.city, state);
    const icao = await resolveAirportIcao(
      submission.airportCode,
      citySlug,
      state,
    );
    const slug = await uniqueSchoolSlug(submission.name);

    const { error } = await supabase.from("flight_schools").insert({
      id: slug,
      name: submission.name,
      slug,
      description: submission.description,
      primary_airport_code: icao,
      city_slug: citySlug,
      state_slug: state.slug,
      website: submission.website,
      phone: submission.phone,
      faa_part: submission.faaPart ?? null,
      contacts: submission.contacts,
      estimated_planes: submission.estimatedPlanes ?? null,
      estimated_instructors: submission.estimatedInstructors ?? null,
      managed_by: submission.submittedBy,
    });
    if (error) throw new Error(`Could not create school: ${error.message}`);
    schoolId = slug;
  }

  // Link submitted programs. Newer submissions store catalog slugs; older
  // ones stored display labels — map both, drop anything unrecognized.
  const catalog = await getPrograms();
  const bySlugOrLabel = new Map<string, string>();
  for (const p of catalog) {
    bySlugOrLabel.set(p.slug, p.slug);
    bySlugOrLabel.set(p.shortName.toLowerCase(), p.slug);
  }
  const links = [
    ...new Set(
      submission.programs
        .map((entry) => bySlugOrLabel.get(entry) ?? bySlugOrLabel.get(entry.toLowerCase()))
        .filter((slug): slug is string => slug !== undefined),
    ),
  ].map((program_slug) => ({ school_id: schoolId, program_slug }));
  if (links.length > 0) {
    const { error } = await supabase
      .from("school_programs")
      // ignoreDuplicates → ON CONFLICT DO NOTHING: the join table has no UPDATE
      // policy, so a plain upsert would fail when re-approving after a partial run
      .upsert(links, { onConflict: "school_id,program_slug", ignoreDuplicates: true });
    if (error) throw new Error(`Could not link programs: ${error.message}`);
  }

  return schoolId;
}

export async function approveSubmission(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const viewer = await getCurrentUser();
  if (!isAdmin(viewer)) return { error: "Admin access required." };

  const id = formData.get("submissionId") as string;
  const submission = await getSchoolSubmissionById(id);
  if (!submission) return { error: "Submission not found." };
  if (submission.status !== "pending") {
    return { error: "This submission has already been processed." };
  }

  // Order matters for crash-safety. The listing is created first — that step
  // is idempotent (it reuses a listing already created for this submission),
  // so if anything fails or the process dies before the status flips, the
  // submission simply stays `pending` and the next approval picks up where it
  // left off. The reverse order (claim → create) could strand a row as
  // `approved` with no listing, which only manual SQL could recover.
  let schoolId: string;
  try {
    schoolId = await createSchoolFromSubmission(submission);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Approval failed." };
  } finally {
    // A city, airport or school row may exist even when a later step threw
    invalidateCatalog();
  }

  // Conditional update: if another admin approved in the meantime, the
  // listing above was the shared idempotent one and nothing is duplicated.
  const supabase = await createClient();
  const { data: updated, error: updateError } = await supabase
    .from("school_submissions")
    .update({ status: "approved" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (updateError) {
    return {
      error: `Listing "${schoolId}" was created but the submission could not be marked approved (${updateError.message}). Approve again to finish.`,
    };
  }
  if (!updated || updated.length === 0) {
    return { error: "This submission has already been processed." };
  }

  revalidatePath("/admin/submissions");
  return { message: `Approved — listing "${schoolId}" is live.` };
}

export async function rejectSubmission(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const viewer = await getCurrentUser();
  if (!isAdmin(viewer)) return { error: "Admin access required." };

  const id = formData.get("submissionId") as string;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_submissions")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This submission has already been processed." };
  }

  revalidatePath("/admin/submissions");
  return { message: "Submission rejected." };
}
