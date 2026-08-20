"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Admin-only navigation destinations shown next to the auth controls */
const adminLinks = [{ label: "Submissions", href: "/admin/submissions" }];

/**
 * Login button that swaps to Profile + Log Out once a session exists, plus
 * admin shortcuts when the signed-in user's profile has role = 'admin'.
 * Subscribes to auth state so it updates immediately after login/logout
 * without a full page reload.
 */
export function AuthButton({ mobile = false }: { mobile?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  // id of the user confirmed as admin — comparing against the current user
  // avoids a stale admin badge flashing after switching accounts
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    let cancelled = false;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.role === "admin") setAdminUserId(user.id);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAdmin = user !== null && adminUserId === user.id;

  if (!user) {
    return (
      <Button href="/login" size="sm" full={mobile}>
        Log in
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", mobile && "w-full flex-wrap gap-3")}>
      {isAdmin &&
        adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={`Admin: ${link.label}`}
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
        href={`/profile/${user.id}`}
        variant="ghost"
        size="sm"
        className={cn(mobile && "flex-1")}
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
