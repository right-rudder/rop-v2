/**
 * Delivery for ownership-change notices: an in-app row plus a best-effort
 * email, and the CRM hop that tells GoHighLevel about a newly approved owner.
 * Server-only — imported by the claim/ownership server actions.
 *
 * The in-app row is the notification of record. Email is a second, optional
 * hop: the address lookup needs the service role and the send needs a webhook,
 * and neither is worth failing an approval over. Both degrade to a log line,
 * so the feature works with nothing configured beyond the database.
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { absoluteUrl } from "@/lib/site";
import { getLocationMaps, getUserById } from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { buildNotification, type NotificationType } from "@/lib/notifications";
import {
  buildOwnerPayload,
  matchSubmitterContact,
  type OwnerAccountStatus,
  type OwnerSource,
} from "@/lib/owner-webhook";
import type { ContactPerson, FlightSchool } from "@/lib/types";

export type NotifyArgs = {
  /** auth.users id of the recipient */
  userId: string;
  type: NotificationType;
  school: { id: string; name: string; path: string; editPath: string };
  /**
   * false stores the in-app row only. For someone who was just invited: the
   * email's "manage your listing" link would land them on /login before they
   * have a password, and the invite email is already on its way.
   */
  email?: boolean;
};

type EmailArgs = {
  to: string;
  subject: string;
  title: string;
  body: string;
  url: string;
  type: NotificationType;
};

/**
 * Hand the email to the GoHighLevel workflow that renders and sends it — the
 * same shape as the lead webhook in app/actions/leads.ts. Swapping in a direct
 * provider later means replacing this function alone.
 */
async function sendNotificationEmail(a: EmailArgs): Promise<void> {
  const url = process.env.GHL_NOTIFY_WEBHOOK_URL;
  if (!url) {
    console.error("[notify] GHL_NOTIFY_WEBHOOK_URL is not set — in-app only, no email sent");
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "flight-school-finder",
        event: a.type,
        email: a.to,
        subject: a.subject,
        title: a.title,
        body: a.body,
        url: a.url,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) console.error("[notify] webhook responded", res.status);
  } catch (e) {
    console.error("[notify] webhook failed", e instanceof Error ? e.message : e);
  }
}

type AccountContact = { email: string; phone: string; firstName: string; lastName: string };

const NO_CONTACT: AccountContact = { email: "", phone: "", firstName: "", lastName: "" };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * What auth.users knows about a person: the account email, plus the name and
 * phone they signed up (or were invited) with. The email is deliberately not
 * the work email from a claim: that address is evidence for the admin review,
 * while product mail belongs at the address the person signed up with.
 * Memoized per request — one approval notifies and reports the same user.
 */
const accountContact = cache(async (userId: string): Promise<AccountContact> => {
  try {
    const { data, error } = await createServiceClient().auth.admin.getUserById(userId);
    if (error) {
      console.error("[notify] could not look up recipient:", error.message);
      return NO_CONTACT;
    }
    const meta = data.user?.user_metadata ?? {};
    return {
      email: data.user?.email ?? "",
      phone: text(meta.phone),
      firstName: text(meta.first_name),
      lastName: text(meta.last_name),
    };
  } catch (e) {
    // Missing service-role key, most likely — the in-app row still stands.
    console.error("[notify] recipient lookup unavailable:", e instanceof Error ? e.message : e);
    return NO_CONTACT;
  }
});

/**
 * Record an ownership change for one user and try to email them about it.
 * Never throws: a failed notification must not roll back the ownership change
 * that prompted it, which has already been written.
 */
export async function notifyUser({ userId, type, school, email = true }: NotifyArgs): Promise<void> {
  const copy = buildNotification(type, school.name, school.path, school.editPath);

  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    school_id: school.id,
    title: copy.title,
    body: copy.body,
    href: copy.href,
  });
  if (error) {
    console.error("[notify] could not store notification:", error.message);
  }

  if (!email) return;
  const { email: to } = await accountContact(userId);
  if (!to) return;
  await sendNotificationEmail({
    to,
    subject: copy.emailSubject,
    title: copy.title,
    body: copy.body,
    url: absoluteUrl(copy.href),
    type,
  });
}

export type OwnerWebhookArgs = {
  /** auth.users id of the new owner */
  userId: string;
  source: OwnerSource;
  school: FlightSchool;
  /** auth.users id of the admin who approved them */
  approvedBy: string;
  /** Defaults to "active"; "invited" while the invite email is unanswered */
  accountStatus?: OwnerAccountStatus;
  /**
   * Fields the approving path knows better than the account does — a claim's
   * role and work email, the invite form, a submission's matching contact.
   * Anything left out falls back to the profile, then to auth metadata.
   */
  contact?: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleTitle: string;
    workEmail: string;
  }>;
  /**
   * The contacts a submitter listed for the school. A submission has no "your
   * role" field, but submitters usually list themselves — the entry matching
   * the account supplies their title, work email and a fallback phone.
   */
  listedContacts?: readonly ContactPerson[];
};

/**
 * Tell GoHighLevel that an admin approved this person as a listing's owner, so
 * the CRM gets the contact. Called after the ownership write has landed, and
 * never throws — same contract as the notification email above: the approval
 * stands whether or not the CRM heard about it.
 */
export async function sendOwnerWebhook(a: OwnerWebhookArgs): Promise<void> {
  const url = process.env.GHL_OWNER_WEBHOOK_URL;
  if (!url) {
    console.error("[owner-webhook] GHL_OWNER_WEBHOOK_URL is not set — owner not sent to GHL");
    return;
  }
  try {
    const [account, profile, { cityNameBySlug, stateBySlug }] = await Promise.all([
      accountContact(a.userId),
      getUserById(a.userId),
      getLocationMaps(),
    ]);
    const email = a.contact?.email || account.email;
    if (!email) {
      console.error("[owner-webhook] no email for user", a.userId, "— owner not sent to GHL");
      return;
    }

    const firstName = a.contact?.firstName || profile?.firstName || account.firstName;
    const lastName = a.contact?.lastName || profile?.lastName || account.lastName;
    const self = matchSubmitterContact(a.listedContacts, {
      email: account.email,
      firstName,
      lastName,
    });

    const payload = buildOwnerPayload({
      source: a.source,
      approvedAt: new Date().toISOString(),
      approvedBy: a.approvedBy,
      accountStatus: a.accountStatus ?? "active",
      owner: {
        userId: a.userId,
        firstName,
        lastName,
        email,
        phone: a.contact?.phone || account.phone || self?.phone || "",
        roleTitle: a.contact?.roleTitle || self?.title || "",
        workEmail: a.contact?.workEmail || self?.email || "",
      },
      school: {
        id: a.school.id,
        name: a.school.name,
        slug: a.school.slug,
        url: absoluteUrl(schoolHref(a.school)),
        editUrl: absoluteUrl(`/schools/${a.school.slug}/edit`),
        website: a.school.website,
        phone: a.school.phone,
        airportCode: a.school.primaryAirportCode,
        city: cityNameBySlug[a.school.citySlug] ?? "",
        state: stateBySlug[a.school.stateSlug]?.abbreviation ?? "",
      },
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) console.error("[owner-webhook] webhook responded", res.status);
  } catch (e) {
    console.error("[owner-webhook] failed", e instanceof Error ? e.message : e);
  }
}
