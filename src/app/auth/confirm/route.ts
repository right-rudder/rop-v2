import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-path";

/**
 * Lands all Supabase auth email links (signup confirmation, password
 * recovery, email change) and establishes the session cookie.
 *
 * Handles both link styles:
 *  - `?token_hash=…&type=…` — custom email templates pointing directly here
 *  - `?code=…` — Supabase's hosted verify endpoint redirecting back (PKCE)
 *
 * `next` is restricted to same-site paths. This URL is reachable through
 * Supabase's own emails (anyone can trigger a reset email with a custom
 * redirectTo), so an absolute `next` would be an open redirect into a
 * phishing page right after the user's session was established.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  }

  // A fixed code the login page maps to copy — never echo free text from the URL
  redirect("/login?error=confirm-failed");
}
