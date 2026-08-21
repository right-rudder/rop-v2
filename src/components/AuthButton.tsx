import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Admin-only navigation destinations shown next to the auth controls */
const adminLinks = [{ label: "Submissions", href: "/admin/submissions" }];

/** Minimal, serializable view of the signed-in user for the navbar */
export type NavViewer = {
  id: string;
  isAdmin: boolean;
};

/**
 * Login button that swaps to Profile + Log Out once a session exists, plus
 * admin shortcuts when the signed-in user's profile has role = 'admin'.
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
      {viewer.isAdmin &&
        adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={`Admin: ${link.label}`}
            onClick={onNavigate}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink transition-colors hover:border-accent/60",
              mobile && "flex-1 justify-center",
            )}
          >
            <ShieldCheck size={14} />
            {link.label}
          </Link>
        ))}
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
