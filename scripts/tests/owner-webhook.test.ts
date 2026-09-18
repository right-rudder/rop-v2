import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOwnerPayload,
  matchSubmitterContact,
  type OwnerPayloadArgs,
} from "../../src/lib/owner-webhook.ts";

const args: OwnerPayloadArgs = {
  source: "claim_approved",
  approvedAt: "2026-09-17T12:00:00.000Z",
  approvedBy: "admin-uuid",
  accountStatus: "active",
  owner: {
    userId: "user-uuid",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@gmail.com",
    phone: "555-0100",
    roleTitle: "Chief Flight Instructor",
    workEmail: "ada@skyline.com",
  },
  school: {
    id: "skyline-aviation-academy",
    name: "Skyline Aviation Academy",
    slug: "skyline-aviation-academy",
    url: "https://example.com/arizona/phoenix/kdvt/skyline-aviation-academy",
    editUrl: "https://example.com/schools/skyline-aviation-academy/edit",
    website: "https://skyline.com",
    phone: "555-0199",
    airportCode: "KDVT",
    city: "Phoenix",
    state: "AZ",
  },
};

test("builds a flat, string-valued contact payload", () => {
  const payload = buildOwnerPayload(args);
  for (const [key, value] of Object.entries(payload)) {
    assert.equal(typeof value, "string", key);
  }
  assert.equal(payload.source, "flight-school-finder");
  assert.equal(payload.event, "owner_approved");
  assert.equal(payload.owner_source, "claim_approved");
  assert.equal(payload.account_status, "active");
  assert.equal(payload.name, "Ada Lovelace");
  assert.equal(payload.email, "ada@gmail.com");
  assert.equal(payload.work_email, "ada@skyline.com");
  assert.equal(payload.role_title, "Chief Flight Instructor");
  assert.equal(payload.company_name, "Skyline Aviation Academy");
  assert.equal(payload.school_edit_url, args.school.editUrl);
  assert.equal(payload.approved_by, "admin-uuid");
});

test("carries the path that approved the owner", () => {
  for (const source of ["claim_approved", "admin_assigned", "admin_invited", "submission_approved"] as const) {
    assert.equal(buildOwnerPayload({ ...args, source }).owner_source, source);
  }
  assert.equal(buildOwnerPayload({ ...args, accountStatus: "invited" }).account_status, "invited");
});

test("leaves unknown fields blank and the name free of stray spaces", () => {
  const payload = buildOwnerPayload({
    ...args,
    owner: { ...args.owner, firstName: " Ada ", lastName: "", phone: "", roleTitle: "", workEmail: "" },
  });
  assert.equal(payload.name, "Ada");
  assert.equal(payload.last_name, "");
  assert.equal(payload.phone, "");
  assert.equal(payload.role_title, "");
  assert.equal(payload.work_email, "");
});

const contacts = [
  { name: "Grace Hopper", title: "Owner", phone: "555-0101", email: "grace@skyline.com" },
  { name: "Ada  Lovelace", title: "Chief Flight Instructor", phone: "555-0102", email: "ADA@skyline.com" },
];

test("finds the submitter among the listed contacts by email, ignoring case", () => {
  const match = matchSubmitterContact(contacts, {
    email: "ada@SKYLINE.com",
    firstName: "Someone",
    lastName: "Else",
  });
  assert.equal(match?.title, "Chief Flight Instructor");
});

test("falls back to the full name when the emails differ", () => {
  const match = matchSubmitterContact(contacts, {
    email: "ada@gmail.com",
    firstName: "ada",
    lastName: "lovelace",
  });
  assert.equal(match?.phone, "555-0102");
});

test("matches nobody rather than guessing", () => {
  const who = { email: "alan@gmail.com", firstName: "Alan", lastName: "Turing" };
  assert.equal(matchSubmitterContact(contacts, who), undefined);
  assert.equal(matchSubmitterContact([], who), undefined);
  assert.equal(matchSubmitterContact(undefined, who), undefined);
  // A nameless, emailless account must not match a blank contact row
  const blank = [{ name: "", title: "", phone: "", email: "" }];
  assert.equal(matchSubmitterContact(blank, { email: "", firstName: "", lastName: "" }), undefined);
});
