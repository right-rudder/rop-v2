"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { friendlyDbError } from "@/lib/supabase/errors";
import { safeInternalPath } from "@/lib/safe-path";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSchoolById, getLocationMaps, getProgramsBySlugs } from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";
import { validateLead, buildGhlPayload, hashIp } from "@/lib/leads";
import type { FlightSchool, LeadStatus } from "@/lib/types";

export type LeadFormState = { error?: string; success?: boolean };

const LEAD_STATUSES: readonly LeadStatus[] = ["new", "contacted", "closed"];

const field = (formData: FormData, key: string) =>
  (formData.get(key) as string | null) ?? "";

/** Netlify sets x-nf-client-connection-ip; fall back to the first forwarded hop. */
async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Hand the lead to the GoHighLevel workflow. Failures are logged, never shown. */
async function forwardToGhl(payload: Record<string, string>): Promise<void> {
  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) {
    console.error("[ghl] GHL_WEBHOOK_URL is not set — lead stored but not forwarded");
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) console.error("[ghl] webhook responded", res.status);
  } catch (e) {
    console.error("[ghl] webhook failed", e instanceof Error ? e.message : e);
  }
}

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  // Honeypot: real users never see this field. Pretend it worked.
  if (field(formData, "company_website").trim()) return { success: true };

  const schoolId = field(formData, "schoolId").trim();
  const school: FlightSchool | undefined = schoolId ? await getSchoolById(schoolId) : undefined;
  if (!school) return { error: "Missing school." };

  const validation = validateLead(
    {
      name: field(formData, "name"),
      email: field(formData, "email"),
      phone: field(formData, "phone"),
      programSlug: field(formData, "program"),
      message: field(formData, "message"),
    },
    school.programSlugs,
  );
  if (!validation.ok) return { error: validation.error };
  const lead = validation.value;

  const sourcePath = safeInternalPath(field(formData, "path"), schoolHref(school));
  const ipHash = hashIp(
    await clientIp(),
    process.env.LEAD_IP_SALT || process.env.NEXT_PUBLIC_SITE_URL || "",
  );

  // submit_lead is server-only (service role): Data API roles cannot call
  // it, so the fingerprint and honeypot can't be bypassed by a direct caller.
  let service: ReturnType<typeof createServiceClient>;
  try {
    service = createServiceClient();
  } catch (e) {
    console.error("[leads]", e instanceof Error ? e.message : e);
    return { error: "Lead capture isn't configured on this server yet. Please use the school's website or phone instead." };
  }
  const { data: leadId, error } = await service.rpc("submit_lead", {
    p_school_id: school.id,
    p_name: lead.name,
    p_email: lead.email,
    p_phone: lead.phone,
    p_program_slug: lead.programSlug,
    p_message: lead.message,
    p_source_path: sourcePath,
    p_ip_hash: ipHash,
  });
  if (error) {
    return { error: error.code === "P0001" ? error.message : friendlyDbError(error) };
  }

  const [{ cityNameBySlug, stateBySlug }, programs] = await Promise.all([
    getLocationMaps(),
    lead.programSlug ? getProgramsBySlugs([lead.programSlug]) : Promise.resolve([]),
  ]);
  await forwardToGhl(
    buildGhlPayload({
      leadId: String(leadId),
      submittedAt: new Date().toISOString(),
      sourcePath,
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        url: absoluteUrl(schoolHref(school)),
        airportCode: school.primaryAirportCode,
        city: cityNameBySlug[school.citySlug] ?? school.citySlug,
        state: stateBySlug[school.stateSlug]?.abbreviation ?? school.stateSlug,
      },
      lead: { ...lead, programName: programs[0]?.name ?? "" },
    }),
  );

  revalidatePath("/admin/leads");
  return { success: true };
}

export type LeadStatusState = { error?: string; success?: boolean };

export async function setLeadStatus(
  _prev: LeadStatusState,
  formData: FormData,
): Promise<LeadStatusState> {
  const viewer = await getCurrentUser();
  if (!isAdmin(viewer)) return { error: "Admin access required." };

  const id = field(formData, "id").trim();
  const status = field(formData, "status").trim() as LeadStatus;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Missing lead." };
  if (!LEAD_STATUSES.includes(status)) return { error: "Unknown status." };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) return { error: friendlyDbError(error) };

  revalidatePath("/admin/leads");
  return { success: true };
}
