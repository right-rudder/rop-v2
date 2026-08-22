/**
 * Bucket names and public-URL building. Deliberately free of server-only
 * imports so Client Components (SchoolCard and friends) can render a stored
 * image without pulling in the upload path. The upload helpers live in
 * ./storage, which re-exports these.
 */

export const BUCKETS = {
  /** `<schoolId>/<uuid>.<ext>` — the first path segment is the ownership key. */
  schoolLogos: "school-logos",
} as const;

export type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * Public URL for an object in a public bucket. Built by hand rather than via
 * getPublicUrl() so it stays synchronous and needs no client instance.
 */
export function publicImageUrl(bucket: Bucket, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL must be set to build storage URLs");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;
}
