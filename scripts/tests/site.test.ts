import { test } from "node:test";
import assert from "node:assert/strict";

// BASE_URL is resolved at import time, so set the env before loading the module.
process.env.NEXT_PUBLIC_SITE_URL = "https://fsf.example/";
const { BASE_URL, absoluteUrl } = await import("../../src/lib/site.ts");

test("BASE_URL has no trailing slash", () => {
  assert.equal(BASE_URL, "https://fsf.example");
});

test("absoluteUrl joins site-relative paths", () => {
  assert.equal(absoluteUrl("/states/arizona"), "https://fsf.example/states/arizona");
  assert.equal(absoluteUrl("states"), "https://fsf.example/states");
  assert.equal(absoluteUrl("/"), "https://fsf.example/");
});
