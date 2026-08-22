import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createToast,
  pushToast,
  removeToast,
  TOAST_MAX,
  TOAST_DURATION,
  withFlash,
  FLASH_TOASTS,
  FLASH_PARAM,
} from "../../src/lib/toast.ts";

test("createToast: defaults tone to info and duration by tone", () => {
  const t = createToast({ title: "Hello" }, "t1");
  assert.equal(t.id, "t1");
  assert.equal(t.tone, "info");
  assert.equal(t.duration, TOAST_DURATION.info);
  assert.equal(t.description, undefined);
  assert.equal(createToast({ tone: "error", title: "x" }, "t2").duration, TOAST_DURATION.error);
  assert.equal(createToast({ tone: "ok", title: "x" }, "t3").duration, TOAST_DURATION.ok);
});

test("createToast: explicit duration wins; trims copy", () => {
  const t = createToast({ tone: "ok", title: "  Saved  ", description: " done ", duration: 1234 }, "t1");
  assert.equal(t.duration, 1234);
  assert.equal(t.title, "Saved");
  assert.equal(t.description, "done");
  assert.equal(createToast({ title: "x", description: "   " }, "t2").description, undefined);
});

test("errors linger longer than confirmations", () => {
  assert.ok(TOAST_DURATION.error > TOAST_DURATION.ok);
  assert.ok(TOAST_MAX >= 1);
});

test("pushToast: appends newest last and caps at TOAST_MAX by dropping the oldest", () => {
  let list = [] as ReturnType<typeof createToast>[];
  for (let i = 0; i < TOAST_MAX + 2; i++) {
    list = pushToast(list, createToast({ title: `n${i}` }, `id${i}`));
  }
  assert.equal(list.length, TOAST_MAX);
  assert.equal(list[list.length - 1].id, `id${TOAST_MAX + 1}`);
  assert.equal(list[0].id, "id2");
});

test("pushToast: a repeat of the same tone + title replaces the earlier one instead of stacking", () => {
  const a = createToast({ tone: "ok", title: "Saved" }, "a");
  const b = createToast({ tone: "info", title: "Other" }, "b");
  const c = createToast({ tone: "ok", title: "Saved", description: "again" }, "c");
  const list = pushToast(pushToast(pushToast([], a), b), c);
  assert.deepEqual(list.map((t) => t.id), ["b", "c"]);
});

test("pushToast: does not mutate its input", () => {
  const input = [createToast({ title: "x" }, "x")];
  const out = pushToast(input, createToast({ title: "y" }, "y"));
  assert.equal(input.length, 1);
  assert.equal(out.length, 2);
});

test("removeToast: drops by id, no-op for unknown ids", () => {
  const list = [createToast({ title: "x" }, "x"), createToast({ title: "y" }, "y")];
  assert.deepEqual(removeToast(list, "x").map((t) => t.id), ["y"]);
  assert.deepEqual(removeToast(list, "zzz").map((t) => t.id), ["x", "y"]);
});

test("FLASH_PARAM is the query key", () => {
  assert.equal(FLASH_PARAM, "toast");
});

test("withFlash: appends the flash code, joining with ? or & as needed", () => {
  assert.equal(withFlash("/profile/abc", "profile-updated"), "/profile/abc?toast=profile-updated");
  assert.equal(withFlash("/login?message=x", "password-updated"), "/login?message=x&toast=password-updated");
  assert.equal(withFlash("/a#inquire", "school-updated"), "/a?toast=school-updated#inquire");
});

test("FLASH_TOASTS: every code used by withFlash has copy with an ok tone", () => {
  for (const [code, input] of Object.entries(FLASH_TOASTS)) {
    assert.match(code, /^[a-z-]+$/);
    assert.ok(input.title.length > 0, code);
    assert.equal(input.tone, "ok");
  }
  assert.ok("school-updated" in FLASH_TOASTS);
  assert.ok("airport-updated" in FLASH_TOASTS);
  assert.ok("profile-updated" in FLASH_TOASTS);
  assert.equal(FLASH_TOASTS["not-a-code"], undefined);
});
