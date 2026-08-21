import { test } from "node:test";
import assert from "node:assert/strict";
import { safeInternalPath } from "../../src/lib/safe-path.ts";

test("accepts same-site paths, including query and hash", () => {
  assert.equal(safeInternalPath("/update-password"), "/update-password");
  assert.equal(safeInternalPath("/a/b?c=1#d"), "/a/b?c=1#d");
  assert.equal(safeInternalPath("/"), "/");
});

test("rejects anything that could leave the site", () => {
  const bad = [
    "https://evil.example",
    "http://evil.example/x",
    "//evil.example",
    "/\\evil.example",
    "/\\/evil.example",
    "javascript:alert(1)",
    "evil.example",
    "/foo\nbar",
    "/\tfoo",
    "/foo bar",
    "",
    null,
    undefined,
  ];
  for (const value of bad) {
    assert.equal(safeInternalPath(value), "/", `should reject ${JSON.stringify(value)}`);
  }
});

test("supports a custom fallback", () => {
  assert.equal(safeInternalPath("//evil.example", ""), "");
  assert.equal(safeInternalPath(null, "/login"), "/login");
});
