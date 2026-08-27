import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client — bypasses RLS. Server-only; never import it from a
 * Client Component. Used for three things, each of which needs a privilege the
 * Data API roles deliberately do not have:
 *
 *   - public.submit_lead(), executable by service_role alone so the rate-limit
 *     fingerprint is always computed on the server;
 *   - public.user_id_by_email(), likewise, so "assign owner by email" cannot
 *     double as a way to probe which addresses have accounts;
 *   - reading a recipient's account email when sending a notification
 *     (auth.users is not on the Data API).
 */
export function createServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient must only run on the server");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
