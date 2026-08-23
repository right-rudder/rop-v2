import { test } from "node:test";
import assert from "node:assert/strict";
import { mdInline } from "../../src/lib/markdown.ts";

test("mdInline escapes link-breaking characters and collapses whitespace", () => {
  assert.equal(mdInline("Sky [Harbor] School"), "Sky \\[Harbor\\] School");
  assert.equal(mdInline("back\\slash"), "back\\\\slash");
  assert.equal(mdInline("  line one\n\nline two\t three "), "line one line two three");
  assert.equal(mdInline("Plain Name"), "Plain Name");
});
