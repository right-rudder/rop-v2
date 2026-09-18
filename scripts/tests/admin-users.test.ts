import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INVITE_LIMITS,
  inviteStatus,
  sortAdminUsers,
  validateInvite,
} from "../../src/lib/admin-users.ts";

const valid = {
  email: "ada@school.com",
  firstName: "Ada",
  lastName: "Lovelace",
  phone: "555-0100",
  roleTitle: "Owner",
};

test("accepts a complete invite, trims every field and lowercases the email", () => {
  const result = validateInvite({
    email: "  Ada@School.COM ",
    firstName: " Ada ",
    lastName: " Lovelace ",
    phone: " 555-0100 ",
    roleTitle: " Owner ",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.value, valid);
});

test("requires an email and both names; phone and role are optional", () => {
  assert.equal(validateInvite({ ...valid, email: "" }).ok, false);
  assert.equal(validateInvite({ ...valid, firstName: "  " }).ok, false);
  assert.equal(validateInvite({ ...valid, lastName: "" }).ok, false);
  assert.equal(validateInvite({ ...valid, phone: "", roleTitle: "" }).ok, true);
  assert.equal(validateInvite({ email: valid.email, firstName: "Ada", lastName: "L" }).ok, true);
});

test("rejects malformed email addresses", () => {
  for (const email of ["ada", "ada@school", "ada school.com", "@school.com", "a@b@c.com"]) {
    assert.equal(validateInvite({ ...valid, email }).ok, false, email);
  }
});

test("enforces the profile and metadata lengths", () => {
  assert.equal(validateInvite({ ...valid, firstName: "a".repeat(INVITE_LIMITS.name) }).ok, true);
  assert.equal(validateInvite({ ...valid, firstName: "a".repeat(INVITE_LIMITS.name + 1) }).ok, false);
  assert.equal(validateInvite({ ...valid, lastName: "a".repeat(INVITE_LIMITS.name + 1) }).ok, false);
  assert.equal(validateInvite({ ...valid, phone: "5".repeat(INVITE_LIMITS.phone + 1) }).ok, false);
  assert.equal(validateInvite({ ...valid, roleTitle: "r".repeat(INVITE_LIMITS.roleTitle + 1) }).ok, false);
});

const at = "2026-09-17T12:00:00Z";

test("tells invited accounts from self-signups, confirmed or not", () => {
  assert.equal(inviteStatus({ invited_at: at }), "invited");
  assert.equal(inviteStatus({ invited_at: at, email_confirmed_at: at }), "accepted");
  assert.equal(inviteStatus({ invited_at: at, confirmed_at: at }), "accepted");
  assert.equal(inviteStatus({ email_confirmed_at: at }), "active");
  assert.equal(inviteStatus({}), "unconfirmed");
  assert.equal(inviteStatus({ invited_at: null, email_confirmed_at: null }), "unconfirmed");
});

test("sorts pending invites first, then newest, without mutating", () => {
  const rows = [
    { id: "old-active", status: "active", createdAt: "2026-01-01T00:00:00Z" },
    { id: "old-invite", status: "invited", createdAt: "2026-02-01T00:00:00Z" },
    { id: "new-active", status: "accepted", createdAt: "2026-09-01T00:00:00Z" },
    { id: "new-invite", status: "invited", createdAt: "2026-08-01T00:00:00Z" },
  ] as const;
  assert.deepEqual(
    sortAdminUsers(rows).map((r) => r.id),
    ["new-invite", "old-invite", "new-active", "old-active"],
  );
  assert.equal(rows[0].id, "old-active");
});
