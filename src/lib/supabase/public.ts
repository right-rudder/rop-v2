import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cookie-less anon client for public-read tables (the catalog, reviews,
 * comments, profiles — every table with a `Public read` RLS policy).
 *
 * It never reads `cookies()`, so the data it returns is not tied to a
 * request: Next can share it across visitors via `unstable_cache`, and the
 * route is not forced dynamic by the read itself. Exactly what the anon role
 * can see is still decided by RLS in the database.
 *
 * Server-only. For anything RLS scopes to the signed-in user (favorites,
 * submissions, leads) or any write, use ./server instead.
 */
let instance: SupabaseClient<Database> | undefined;

export function createPublicClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("createPublicClient must only run on the server");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }
  // One client per server instance: it holds no session, so nothing leaks
  // between requests, and reusing it skips re-parsing the URL/key each call.
  return (instance ??= createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }));
}
