import { test } from "node:test";
import assert from "node:assert/strict";
import { canDeleteContent, isUuid } from "../../src/lib/permissions.ts";

const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

test("anonymous viewers can never delete", () => {
  assert.equal(canDeleteContent(null, OWNER), false);
  assert.equal(canDeleteContent({ id: null, isAdmin: false }, OWNER), false);
  assert.equal(canDeleteContent({ id: null, isAdmin: true }, OWNER), false);
});

test("owners can delete their own content, not others'", () => {
  assert.equal(canDeleteContent({ id: OWNER, isAdmin: false }, OWNER), true);
  assert.equal(canDeleteContent({ id: OTHER, isAdmin: false }, OWNER), false);
});

test("admins can delete anyone's content", () => {
  assert.equal(canDeleteContent({ id: OTHER, isAdmin: true }, OWNER), true);
  assert.equal(canDeleteContent({ id: OWNER, isAdmin: true }, OWNER), true);
});

test("isUuid accepts the canonical 8-4-4-4-12 shape only", () => {
  assert.equal(isUuid(OWNER), true);
  assert.equal(isUuid("A1B2C3D4-E5F6-7A8B-9C0D-E1F2A3B4C5D6"), true);
  assert.equal(isUuid("------------------------------------"), false); // 36 dashes
  assert.equal(isUuid("11111111111111111111111111111111"), false); // no dashes
  assert.equal(isUuid(`${OWNER}x`), false);
  assert.equal(isUuid(""), false);
  assert.equal(isUuid(null), false);
  assert.equal(isUuid(undefined), false);
  assert.equal(isUuid(42), false);
});
