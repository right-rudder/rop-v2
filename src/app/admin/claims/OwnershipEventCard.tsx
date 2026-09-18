import Link from "next/link";
import { UserMinus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

/** An ownership change in the claims timeline — a record, with nothing to act on. */
export function OwnershipEventCard({
  kind,
  at,
  schoolName,
  schoolHref,
  userId,
  userName,
  actorName,
}: {
  kind: "granted" | "revoked";
  /** ISO timestamp */
  at: string;
  /** Snapshot from the audit row, so it reads even after the listing is gone */
  schoolName: string;
  /** Unset once the listing has been removed */
  schoolHref?: string;
  userId: string;
  /** Unset for an account without a profile — which has no profile page to link to either */
  userName?: string;
  /** The admin who made the change; unset for changes made outside the app and for backfilled history */
  actorName?: string;
}) {
  const granted = kind === "granted";
  const Icon = granted ? UserPlus : UserMinus;
  const date = new Date(at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            <Icon size={13} aria-hidden />
            {granted ? "Ownership granted" : "Ownership revoked"}
          </p>
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">
            {schoolHref ? (
              <Link href={schoolHref} className="hover:underline">
                {schoolName}
              </Link>
            ) : (
              schoolName
            )}
          </h3>
        </div>
        <time className="shrink-0 font-mono text-xs text-muted" dateTime={at}>
          {date}
        </time>
      </div>

      <div className="space-y-1.5 text-sm text-muted">
        <p>
          {granted ? "Now managed by " : "No longer managed by "}
          {userName ? (
            <Link href={`/profile/${userId}`} className="text-accent-ink hover:underline">
              {userName}
            </Link>
          ) : (
            <span className="text-ink">an account without a profile</span>
          )}
        </p>
        <p>
          {actorName ? (
            <>
              By <span className="text-ink">{actorName}</span>
            </>
          ) : (
            "No acting admin on record"
          )}
        </p>
        {!schoolHref && <p>This listing has since been removed.</p>}
      </div>

      <Badge tone={granted ? "ok" : "neutral"}>{granted ? "Granted" : "Revoked"}</Badge>
    </Card>
  );
}
