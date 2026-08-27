/**
 * Delivery for ownership-change notices: an in-app row plus a best-effort
 * email. Server-only — imported by the claim/ownership server actions.
 *
 * The in-app row is the notification of record. Email is a second, optional
 * hop: the address lookup needs the service role and the send needs a webhook,
 * and neither is worth failing an approval over. Both degrade to a log line,
 * so the feature works with nothing configured beyond the database.
 */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { absoluteUrl } from "@/lib/site";
import { buildNotification, type NotificationType } from "@/lib/notifications";

export type NotifyArgs = {
  /** auth.users id of the recipient */
  userId: string;
  type: NotificationType;
  school: { id: string; name: string; path: string; editPath: string };
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

/**
 * The account email for a user. Deliberately not the work email from a claim:
 * that address is evidence for the admin review, while product mail belongs at
 * the address the person signed up with.
 */
async function accountEmail(userId: string): Promise<string> {
  try {
    const { data, error } = await createServiceClient().auth.admin.getUserById(userId);
    if (error) {
      console.error("[notify] could not look up recipient:", error.message);
      return "";
    }
    return data.user?.email ?? "";
  } catch (e) {
    // Missing service-role key, most likely — the in-app row still stands.
    console.error("[notify] recipient lookup unavailable:", e instanceof Error ? e.message : e);
    return "";
  }
}

/**
 * Record an ownership change for one user and try to email them about it.
 * Never throws: a failed notification must not roll back the ownership change
 * that prompted it, which has already been written.
 */
export async function notifyUser({ userId, type, school }: NotifyArgs): Promise<void> {
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

  const to = await accountEmail(userId);
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
