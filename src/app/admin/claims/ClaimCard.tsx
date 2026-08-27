"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check, Mail, ShieldCheck, ShieldAlert, X } from "lucide-react";
import type { SchoolClaim } from "@/lib/types";
import { approveClaim, rejectClaim } from "@/app/actions/claims";
import { useActionToast } from "@/components/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";

export function ClaimCard({
  claim,
  schoolName,
  schoolHref,
  claimantName,
  /**
   * Whether the work email's domain matches the listing's website. Computed on
   * the server from the listing — a hint for review, never a permission.
   */
  domainMatches,
  /** Shown when the listing gained an owner after this claim was filed. */
  alreadyOwned,
}: {
  claim: SchoolClaim;
  schoolName: string;
  schoolHref: string;
  claimantName: string;
  domainMatches: boolean;
  alreadyOwned: boolean;
}) {
  const [approveState, approveAction, approvePending] = useActionState(approveClaim, {});
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectClaim, {});

  useActionToast(approveState, {
    ok: (s) => ({ title: "Claim approved", description: s.message }),
    errorTitle: "Couldn't approve claim",
  });
  useActionToast(rejectState, {
    ok: { title: "Claim declined" },
    errorTitle: "Couldn't decline claim",
  });

  const busy = approvePending || rejectPending;
  const error = approveState.error ?? rejectState.error;
  const message = approveState.message ?? rejectState.message;
  const date = new Date(claim.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">
            Claim on
          </p>
          <h3 className="font-display text-xl font-bold tracking-tight text-ink">
            <Link href={schoolHref} className="hover:underline">
              {schoolName}
            </Link>
          </h3>
        </div>
        <time className="shrink-0 font-mono text-xs text-muted" dateTime={claim.createdAt}>
          {date}
        </time>
      </div>

      <div className="space-y-1.5 text-sm">
        <p className="text-ink">
          <Link href={`/profile/${claim.userId}`} className="text-accent-ink hover:underline">
            {claimantName}
          </Link>
          <span className="text-muted"> — {claim.roleTitle}</span>
        </p>
        <p className="flex flex-wrap items-center gap-2 text-muted">
          <Mail size={13} aria-hidden />
          <span className="break-all">{claim.workEmail}</span>
          <Badge tone={domainMatches ? "ok" : "neutral"}>
            {domainMatches ? (
              <>
                <ShieldCheck size={11} className="inline -mt-0.5" aria-hidden /> Matches website
                domain
              </>
            ) : (
              <>
                <ShieldAlert size={11} className="inline -mt-0.5" aria-hidden /> Domain doesn&apos;t
                match
              </>
            )}
          </Badge>
        </p>
      </div>

      {claim.message && (
        <p className="border-l-2 border-line pl-4 text-sm leading-relaxed text-ink/90">
          {claim.message}
        </p>
      )}

      {(error || message) && <Notice tone={error ? "error" : "ok"}>{error ?? message}</Notice>}

      {claim.status === "pending" ? (
        alreadyOwned ? (
          <Notice tone="info">
            This listing already has an owner. Revoke them below before approving this claim.
          </Notice>
        ) : (
          <div className="flex gap-3 pt-1">
            <form action={approveAction} className="flex-1">
              <input type="hidden" name="claimId" value={claim.id} />
              <Button type="submit" full disabled={busy}>
                <Check size={15} />
                {approvePending ? "Approving…" : "Approve & hand over"}
              </Button>
            </form>
            <form action={rejectAction} className="flex-1">
              <input type="hidden" name="claimId" value={claim.id} />
              <Button type="submit" variant="secondary" full disabled={busy}>
                <X size={15} />
                {rejectPending ? "Declining…" : "Decline"}
              </Button>
            </form>
          </div>
        )
      ) : (
        <Badge tone={claim.status === "approved" ? "ok" : "neutral"}>
          {claim.status === "approved" ? "Approved" : "Declined"}
        </Badge>
      )}
    </Card>
  );
}
