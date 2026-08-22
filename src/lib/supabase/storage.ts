import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { validateImage, storageObjectName, IMAGE_LIMITS, MAGIC_BYTES_NEEDED } from "@/lib/images";
import type { Bucket } from "./storage-url";

/**
 * Server-side image uploads. The caller passes in its own client — always the
 * cookie-bound one from ./server, never the service role — so the
 * storage.objects policies decide what may be written. Nothing here throws;
 * failures come back as a message the form can show.
 *
 * Importing this module pulls in node:crypto — Client Components that only
 * need to display an image should import ./storage-url directly.
 */

export { BUCKETS, publicImageUrl, type Bucket } from "./storage-url";

type Client = SupabaseClient<Database>;

export type UploadResult = { path: string } | { error: string };

/**
 * Validate `file` by its magic bytes and store it at `<folder>/<uuid>.<ext>`.
 * The bucket enforces size and MIME independently — this is the friendly
 * first line of defence, not the only one.
 */
export async function uploadImage(opts: {
  client: Client;
  bucket: Bucket;
  folder: string;
  file: File;
}): Promise<UploadResult> {
  const { client, bucket, folder, file } = opts;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = validateImage({
    size: bytes.byteLength,
    type: file.type,
    head: bytes.subarray(0, MAGIC_BYTES_NEEDED),
  });
  if (!checked.ok) return { error: checked.error };

  const path = storageObjectName(folder, checked.ext);
  const { error } = await client.storage.from(bucket).upload(path, bytes, {
    contentType: checked.mime,
    upsert: false,
  });
  if (error) {
    // Branch on `code`, not the message text and not `status`: the Storage API
    // returns HTTP 400 for all of these (RLS denial, bad mime, too large), and
    // only `code` tells them apart. Verified against the live API.
    const code = "code" in error ? (error.code as string | undefined) : undefined;
    console.error("[storage] upload", bucket, path, code ?? "", error.message);
    switch (code) {
      case "AccessDenied":
        // The policies deny writes outside a school you manage.
        return { error: "You don't have permission to upload here." };
      case "InvalidMimeType":
        return { error: "Please upload a PNG, JPEG, or WebP image." };
      case "EntityTooLarge":
        return { error: `Images must be smaller than ${IMAGE_LIMITS.maxBytes / (1024 * 1024)}MB.` };
      case "KeyAlreadyExists":
        return { error: "That image already exists. Please try again." };
      default:
        return { error: "That image couldn't be uploaded. Please try again." };
    }
  }
  return { path };
}

/**
 * Best-effort delete, used to clean up a logo that has just been replaced.
 * A failure here leaves an orphan object, which is not worth failing a
 * successful save over — so it logs and returns.
 */
export async function removeImage(client: Client, bucket: Bucket, path: string): Promise<void> {
  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) console.error("[storage] remove", bucket, path, error.message);
}
