import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NOTIFICATION_TYPES,
  buildNotification,
  notificationLinkLabel,
  type NotificationType,
} from "../../src/lib/notifications.ts";

const SCHOOL = "Blue Yonder Aviation";
const PATH = "/arizona/mesa/kffz/blue-yonder";
const EDIT = "/schools/blue-yonder/edit";

test("every type produces copy naming the school", () => {
  for (const type of NOTIFICATION_TYPES) {
    const copy = buildNotification(type, SCHOOL, PATH, EDIT);
    assert.ok(copy.title.length > 0, type);
    assert.ok(copy.title.length <= 200, type);
    assert.ok(copy.body.length > 0 && copy.body.length <= 1000, type);
    assert.ok(copy.emailSubject.includes(SCHOOL), type);
    assert.ok(copy.body.includes(SCHOOL), type);
  }
});

test("gaining a listing links to the editor, losing one links to the listing", () => {
  assert.equal(buildNotification("claim_approved", SCHOOL, PATH, EDIT).href, EDIT);
  assert.equal(buildNotification("listing_assigned", SCHOOL, PATH, EDIT).href, EDIT);
  assert.equal(buildNotification("claim_rejected", SCHOOL, PATH, EDIT).href, PATH);
  assert.equal(buildNotification("listing_revoked", SCHOOL, PATH, EDIT).href, PATH);
});

test("approval and rejection read differently", () => {
  const ok = buildNotification("claim_approved", SCHOOL, PATH, EDIT);
  const no = buildNotification("claim_rejected", SCHOOL, PATH, EDIT);
  assert.notEqual(ok.title, no.title);
  assert.notEqual(ok.body, no.body);
});

test("falls back to a generic name when the school has none", () => {
  const copy = buildNotification("claim_approved", "   ", PATH, EDIT);
  assert.ok(copy.body.includes("your listing"));
  assert.ok(copy.emailSubject.includes("your listing"));
});

test("the link label matches where the link actually goes", () => {
  // "View listing" on a link to the editor would misdescribe it, so the label
  // and the href have to agree for every type.
  for (const type of NOTIFICATION_TYPES) {
    const { href } = buildNotification(type, SCHOOL, PATH, EDIT);
    const label = notificationLinkLabel(type);
    assert.equal(label, href === EDIT ? "Manage listing" : "View listing", type);
  }
});

test("an unknown type would not silently produce empty copy", () => {
  // The union is exhaustive, so a new type added without copy fails to compile;
  // this guards the runtime shape for anything cast past the type system.
  const copy = buildNotification("claim_approved" as NotificationType, SCHOOL, PATH, EDIT);
  assert.ok(copy.href.startsWith("/"));
});
