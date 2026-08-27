/**
 * Copy for ownership-change notifications. Pure — no imports — so the tests in
 * scripts/tests run this file directly under `node --test`. The delivery side
 * (DB row + email hop) lives in src/lib/notify.ts.
 */
export type NotificationType =
  | "claim_approved"
  | "claim_rejected"
  | "listing_assigned"
  | "listing_revoked";

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "claim_approved",
  "claim_rejected",
  "listing_assigned",
  "listing_revoked",
];

/** Events that hand someone a listing link to its editor, not its public page. */
function grantsListing(type: NotificationType): boolean {
  return type === "claim_approved" || type === "listing_assigned";
}

/**
 * Label for the notification's link. Kept next to buildNotification so the
 * wording always matches where `href` actually points.
 */
export function notificationLinkLabel(type: NotificationType): string {
  return grantsListing(type) ? "Manage listing" : "View listing";
}

export type NotificationCopy = {
  title: string;
  body: string;
  /** Same-site path the notification links to. */
  href: string;
  emailSubject: string;
};

/**
 * `schoolPath` is the listing's canonical path; `editPath` is where the new
 * owner goes to edit it. Approved/assigned link to the editor — that is the
 * thing the user just gained — while rejected/revoked link to the listing.
 */
export function buildNotification(
  type: NotificationType,
  schoolName: string,
  schoolPath: string,
  editPath: string,
): NotificationCopy {
  const name = schoolName.trim() || "your listing";
  switch (type) {
    case "claim_approved":
      return {
        title: "Your claim was approved",
        body: `You now manage ${name}. You can edit its listing any time.`,
        href: editPath,
        emailSubject: `You now manage ${name}`,
      };
    case "claim_rejected":
      return {
        title: "Your claim wasn't approved",
        body: `We couldn't verify your claim to ${name}. Reply to this email if you think that's wrong.`,
        href: schoolPath,
        emailSubject: `About your claim to ${name}`,
      };
    case "listing_assigned":
      return {
        title: "A listing was assigned to you",
        body: `You now manage ${name}. You can edit its listing any time.`,
        href: editPath,
        emailSubject: `You now manage ${name}`,
      };
    case "listing_revoked":
      return {
        title: "A listing was removed from your account",
        body: `You no longer manage ${name}. Get in touch if you have questions.`,
        href: schoolPath,
        emailSubject: `You no longer manage ${name}`,
      };
  }
}
