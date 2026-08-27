import Link from "next/link";
import { ShieldCheck, Heart, Bell } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Minimal, serializable view of the signed-in user for the navbar */
export type NavViewer = {
  id: string;
  isAdmin: boolean;
  /** Drives the bell's badge; 0 hides it. */
  unreadNotifications: number;
};

/**
 * Login button that swaps to Profile + Log Out once a session exists, plus
 * an Admin shortcut when the signed-in user's profile has role = 'admin'.
 *
 * Purely presentational: `viewer` is resolved server-side in the root layout
 * (see getCurrentUser in src/lib/auth.ts). The auth Server Actions call
 * revalidatePath("/", "layout") before redirecting, so the layout — and this
 * button — re-render with the new session without a full page reload.
 */
export function AuthButton({
  viewer,
  mobile = false,
  onNavigate,
}: {
  viewer: NavViewer | null;
  mobile?: boolean;
  /** Fired when a navigation link is tapped, so the mobile panel can close */
  onNavigate?: () => void;
}) {
  if (!viewer) {
    return (
      <Button href="/login" size="sm" full={mobile} onClick={onNavigate}>
        Log in
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", mobile && "w-full flex-wrap gap-3")}>
      <Link
        href="/saved"
        title="Saved schools"
        onClick={onNavigate}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink/40",
          mobile && "flex-1 justify-center",
        )}
      >
        <Heart size={14} />
        Saved
      </Link>
      <Link
        href="/notifications"
        title={
          viewer.unreadNotifications > 0
            ? `Notifications (${viewer.unreadNotifications} unread)`
            : "Notifications"
        }
        onClick={onNavigate}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink/40",
          mobile && "flex-1 justify-center",
        )}
      >
        <Bell size={14} />
        Alerts
        {viewer.unreadNotifications > 0 && (
          <span
            aria-hidden
            className="inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-ink"
          >
            {viewer.unreadNotifications > 9 ? "9+" : viewer.unreadNotifications}
          </span>
        )}
      </Link>
      {viewer.isAdmin && (
        <Link
          href="/admin"
          title="Admin"
          onClick={onNavigate}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink transition-colors hover:border-accent/60",
            mobile && "flex-1 justify-center",
          )}
        >
          <ShieldCheck size={14} />
          Admin
        </Link>
      )}
      <Button
        href={`/profile/${viewer.id}`}
        variant="ghost"
        size="sm"
        className={cn(mobile && "flex-1")}
        onClick={onNavigate}
      >
        My profile
      </Button>
      <form action={logout} className={cn(mobile && "flex-1")}>
        <Button type="submit" variant="secondary" size="sm" full={mobile}>
          Log out
        </Button>
      </form>
    </div>
  );
}
