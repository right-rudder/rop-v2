"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Phone, RotateCw } from "lucide-react";
import { resendInvite } from "@/app/actions/users";
import { useActionToast } from "@/components/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { INVITE_STATUS_LABEL, type InviteStatus } from "@/lib/admin-users";
import type { AdminUserRow } from "@/lib/user-directory";

const STATUS_TONE: Record<InviteStatus, "accent" | "ok" | "neutral"> = {
  invited: "accent",
  accepted: "ok",
  active: "ok",
  unconfirmed: "neutral",
};

export function UserRow({ user }: { user: AdminUserRow }) {
  const [state, action, pending] = useActionState(resendInvite, {});
  useActionToast(state, {
    ok: (s) => ({ title: "Invite sent again", description: s.message }),
    errorTitle: "Couldn't resend invite",
  });

  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="space-y-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold tracking-tight text-ink">
            {user.hasProfile ? (
              <Link href={`/profile/${user.id}`} className="hover:underline">
                {user.name || "Unnamed account"}
              </Link>
            ) : (
              user.name || "Unnamed account"
            )}
          </h3>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Mail size={13} aria-hidden />
              <span className="break-all">{user.email || "No email"}</span>
            </span>
            {user.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} aria-hidden />
                {user.phone}
              </span>
            )}
          </p>
        </div>
        <time className="shrink-0 font-mono text-xs text-muted" dateTime={user.createdAt}>
          {joined}
        </time>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[user.status]}>{INVITE_STATUS_LABEL[user.status]}</Badge>
        {user.isAdmin && <Badge tone="sky">Admin</Badge>}
        {user.listings.length > 0 && <Badge tone="sky">Owner</Badge>}
        {!user.hasProfile && <Badge>No profile</Badge>}
      </div>

      {user.listings.length > 0 && (
        <ul className="space-y-1 border-l-2 border-line pl-4 text-sm">
          {user.listings.map((listing) => (
            <li key={listing.id}>
              <Link href={listing.href} className="text-accent-ink hover:underline">
                {listing.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(state.error || state.message) && (
        <Notice tone={state.error ? "error" : "ok"}>{state.error ?? state.message}</Notice>
      )}

      {user.status === "invited" && (
        <form action={action}>
          <input type="hidden" name="userId" value={user.id} />
          <Button type="submit" variant="secondary" disabled={pending}>
            <RotateCw size={15} />
            {pending ? "Sending…" : "Resend invite"}
          </Button>
        </form>
      )}
    </Card>
  );
}
