/**
 * Pure image-upload helpers: size/type validation by magic bytes, and storage
 * object naming. No Supabase, no Next — imported by the server-side upload
 * helper and by scripts/tests; relative imports only.
 *
 * IMAGE_LIMITS must stay in sync with the school-logos bucket's
 * file_size_limit / allowed_mime_types in supabase/migrations/20260822054342_add_storage_school_logos.sql.
 */
import { randomUUID } from "node:crypto";

export const IMAGE_LIMITS = {
  maxBytes: 2 * 1024 * 1024,
  mimes: ["image/png", "image/jpeg", "image/webp"],
} as const;

export type ImageMime = (typeof IMAGE_LIMITS.mimes)[number];
export type ImageExt = "png" | "jpg" | "webp";

export type ImageValidation =
  | { ok: true; mime: ImageMime; ext: ImageExt }
  | { ok: false; error: string };

const EXT_BY_MIME: Record<ImageMime, ImageExt> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/** Bytes we need to see to identify every format we accept (WebP needs 12). */
export const MAGIC_BYTES_NEEDED = 12;

const startsWith = (head: Uint8Array, sig: readonly number[]) =>
  sig.every((byte, i) => head[i] === byte);

/**
 * Identify the format from the leading bytes, ignoring the filename and the
 * browser-supplied Content-Type — both are attacker-controlled.
 */
function sniff(head: Uint8Array): ImageMime | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // JPEG: FF D8 FF
  if (startsWith(head, [0xff, 0xd8, 0xff])) return "image/jpeg";
  // WebP: "RIFF" .... "WEBP"
  if (
    startsWith(head, [0x52, 0x49, 0x46, 0x46]) &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

const megabytes = (bytes: number) => `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`;

export function validateImage(input: {
  size: number;
  type: string;
  head: Uint8Array;
}): ImageValidation {
  if (input.size <= 0) return { ok: false, error: "That file is empty." };
  if (input.size > IMAGE_LIMITS.maxBytes) {
    return { ok: false, error: `Images must be smaller than ${megabytes(IMAGE_LIMITS.maxBytes)}.` };
  }
  if (input.head.length < MAGIC_BYTES_NEEDED) {
    return { ok: false, error: "That file looks truncated or isn't an image." };
  }

  const sniffed = sniff(input.head);
  if (!sniffed) {
    return { ok: false, error: "Please upload a PNG, JPEG, or WebP image." };
  }
  // The declared type has to agree with the bytes; a mismatch means the file
  // was renamed or the Content-Type was forged.
  const declared = input.type.split(";")[0].trim().toLowerCase();
  if (declared && declared !== sniffed) {
    return { ok: false, error: "That file's contents don't match its type." };
  }

  return { ok: true, mime: sniffed, ext: EXT_BY_MIME[sniffed] };
}

/**
 * `<folder>/<uuid>.<ext>`. Random names mean a replaced logo never collides
 * with the CDN's cache of the old one.
 */
export function storageObjectName(folder: string, ext: ImageExt): string {
  return `${folder}/${randomUUID()}.${ext}`;
}
