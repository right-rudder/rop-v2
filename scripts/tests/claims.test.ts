import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLAIM_LIMITS,
  validateClaim,
  emailDomain,
  websiteDomain,
  domainsMatch,
} from "../../src/lib/claims.ts";

const valid = { roleTitle: "Chief Flight Instructor", message: "I run the school.", workEmail: "ada@school.com" };

test("accepts a complete claim and trims every field", () => {
  const result = validateClaim({
    roleTitle: "  Owner  ",
    message: "  We'd like to manage this.  ",
    workEmail: "  ada@school.com  ",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.value, {
    roleTitle: "Owner",
    message: "We'd like to manage this.",
    workEmail: "ada@school.com",
  });
});

test("requires a role and a work email, but not a message", () => {
  assert.equal(validateClaim({ ...valid, roleTitle: "   " }).ok, false);
  assert.equal(validateClaim({ ...valid, workEmail: "" }).ok, false);
  assert.equal(validateClaim({ ...valid, message: "" }).ok, true);
});

test("rejects malformed email addresses", () => {
  for (const workEmail of ["ada", "ada@school", "ada school.com", "@school.com", "a@b@c.com"]) {
    assert.equal(validateClaim({ ...valid, workEmail }).ok, false, workEmail);
  }
});

test("enforces the same lengths as the DB constraints", () => {
  assert.equal(validateClaim({ ...valid, roleTitle: "r".repeat(CLAIM_LIMITS.roleTitle) }).ok, true);
  assert.equal(validateClaim({ ...valid, roleTitle: "r".repeat(CLAIM_LIMITS.roleTitle + 1) }).ok, false);
  assert.equal(validateClaim({ ...valid, message: "m".repeat(CLAIM_LIMITS.message) }).ok, true);
  assert.equal(validateClaim({ ...valid, message: "m".repeat(CLAIM_LIMITS.message + 1) }).ok, false);
});

test("emailDomain takes the part after the last @, lowercased", () => {
  assert.equal(emailDomain("Ada@Mail.School.com"), "mail.school.com");
  assert.equal(emailDomain("  ada@school.com  "), "school.com");
  assert.equal(emailDomain("not-an-email"), "");
});

test("websiteDomain strips scheme, www and path", () => {
  assert.equal(websiteDomain("https://www.school.com/about"), "school.com");
  assert.equal(websiteDomain("http://school.com"), "school.com");
  assert.equal(websiteDomain("school.com"), "school.com");
  assert.equal(websiteDomain("www.school.com/x?y=1"), "school.com");
  assert.equal(websiteDomain("SCHOOL.COM"), "school.com");
});

test("websiteDomain gives up on free text rather than inventing a domain", () => {
  assert.equal(websiteDomain(""), "");
  assert.equal(websiteDomain("   "), "");
  assert.equal(websiteDomain("call us"), "");
  assert.equal(websiteDomain("https://"), "");
});

test("domainsMatch accepts the exact domain and its subdomains", () => {
  assert.equal(domainsMatch("ada@school.com", "https://www.school.com"), true);
  assert.equal(domainsMatch("ada@mail.school.com", "https://school.com"), true);
  assert.equal(domainsMatch("Ada@SCHOOL.com", "school.com"), true);
});

test("domainsMatch rejects lookalikes and unknown domains", () => {
  assert.equal(domainsMatch("ada@gmail.com", "https://school.com"), false);
  // "notschool.com" ends with "school.com" as a string but is a different domain
  assert.equal(domainsMatch("ada@notschool.com", "https://school.com"), false);
  assert.equal(domainsMatch("ada@school.com", ""), false);
  assert.equal(domainsMatch("", "https://school.com"), false);
  assert.equal(domainsMatch("ada@school.com", "call us"), false);
});
