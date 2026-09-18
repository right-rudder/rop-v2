import { test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_TABS, isAdminTabActive } from "../../src/lib/admin-nav.ts";

test("lists the six admin sections with Overview first", () => {
  assert.equal(ADMIN_TABS.length, 6);
  assert.equal(ADMIN_TABS[0].href, "/admin");
  assert.deepEqual(
    ADMIN_TABS.map((t) => t.href),
    [
      "/admin",
      "/admin/submissions",
      "/admin/claims",
      "/admin/users",
      "/admin/leads",
      "/admin/moderation",
    ],
  );
});

test("Overview is active only on /admin itself", () => {
  assert.equal(isAdminTabActive("/admin", "/admin"), true);
  assert.equal(isAdminTabActive("/admin/", "/admin"), true);
  assert.equal(isAdminTabActive("/admin/leads", "/admin"), false);
  assert.equal(isAdminTabActive("/admin/moderation", "/admin"), false);
});

test("section tabs match themselves and their children", () => {
  assert.equal(isAdminTabActive("/admin/leads", "/admin/leads"), true);
  assert.equal(isAdminTabActive("/admin/moderation/anything", "/admin/moderation"), true);
  assert.equal(isAdminTabActive("/admin/leads", "/admin/moderation"), false);
  assert.equal(isAdminTabActive("/admin/leadsx", "/admin/leads"), false);
  assert.equal(isAdminTabActive("/", "/admin/leads"), false);
});
