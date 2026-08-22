import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateImage,
  storageObjectName,
  IMAGE_LIMITS,
  MAGIC_BYTES_NEEDED,
} from "../../src/lib/images.ts";

const pad = (sig: number[]) =>
  Uint8Array.from([...sig, ...new Array(Math.max(0, 16 - sig.length)).fill(0)]);

const PNG = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = pad([0xff, 0xd8, 0xff, 0xe0]);
// "RIFF" + 4 size bytes + "WEBP"
const WEBP = pad([0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

test("validateImage: accepts PNG, JPEG and WebP by magic bytes", () => {
  assert.deepEqual(validateImage({ size: 100, type: "image/png", head: PNG }), {
    ok: true, mime: "image/png", ext: "png",
  });
  assert.deepEqual(validateImage({ size: 100, type: "image/jpeg", head: JPEG }), {
    ok: true, mime: "image/jpeg", ext: "jpg",
  });
  assert.deepEqual(validateImage({ size: 100, type: "image/webp", head: WEBP }), {
    ok: true, mime: "image/webp", ext: "webp",
  });
});

test("validateImage: tolerates a charset suffix and an empty Content-Type", () => {
  assert.equal(validateImage({ size: 100, type: "image/png; charset=binary", head: PNG }).ok, true);
  assert.equal(validateImage({ size: 100, type: "", head: PNG }).ok, true);
});

test("validateImage: rejects a declared type that disagrees with the bytes", () => {
  // The classic .txt-renamed-to-.png / forged Content-Type case.
  assert.equal(validateImage({ size: 100, type: "image/png", head: JPEG }).ok, false);
});

test("validateImage: rejects formats we don't allow", () => {
  const svg = pad([0x3c, 0x73, 0x76, 0x67]); // "<svg"
  assert.equal(validateImage({ size: 100, type: "image/svg+xml", head: svg }).ok, false);
  const gif = pad([0x47, 0x49, 0x46, 0x38]); // "GIF8"
  assert.equal(validateImage({ size: 100, type: "image/gif", head: gif }).ok, false);
  assert.equal(IMAGE_LIMITS.mimes.includes("image/svg+xml" as never), false);
});

test("validateImage: enforces the size bounds", () => {
  assert.equal(validateImage({ size: 0, type: "image/png", head: PNG }).ok, false);
  assert.equal(validateImage({ size: IMAGE_LIMITS.maxBytes, type: "image/png", head: PNG }).ok, true);
  assert.equal(validateImage({ size: IMAGE_LIMITS.maxBytes + 1, type: "image/png", head: PNG }).ok, false);
});

test("validateImage: rejects a truncated header", () => {
  const short = PNG.slice(0, MAGIC_BYTES_NEEDED - 1);
  assert.equal(validateImage({ size: 100, type: "image/png", head: short }).ok, false);
});

test("storageObjectName: <folder>/<uuid>.<ext>, unique per call", () => {
  const a = storageObjectName("cloud-nine-aviation", "png");
  assert.match(a, /^cloud-nine-aviation\/[0-9a-f-]{36}\.png$/);
  assert.notEqual(a, storageObjectName("cloud-nine-aviation", "png"));
});
