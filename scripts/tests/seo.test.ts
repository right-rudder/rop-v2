import { test } from "node:test";
import assert from "node:assert/strict";
import { countNoun, metaDescription, thinPageRobots } from "../../src/lib/seo.ts";

test("metaDescription returns short text unchanged", () => {
  assert.equal(metaDescription("Short and sweet."), "Short and sweet.");
  assert.equal(metaDescription("  padded  "), "padded");
});

test("metaDescription cuts at a word boundary and adds an ellipsis", () => {
  const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
  const out = metaDescription(words, 160);
  assert.ok(out.length <= 160, `length ${out.length}`);
  assert.ok(out.endsWith("…"));
  // never ends mid-word: the text before the ellipsis is a whole token
  const last = out.slice(0, -1).trim().split(" ").pop();
  assert.ok(words.split(" ").includes(last!), `cut mid-word: ${last}`);
});

test("metaDescription drops trailing punctuation before the ellipsis", () => {
  const text = `${"a".repeat(150)}, ${"b".repeat(20)}`;
  assert.equal(metaDescription(text, 160), `${"a".repeat(150)}…`);
});

test("metaDescription hard-cuts a single overlong word", () => {
  const out = metaDescription("x".repeat(300), 160);
  assert.equal(out.length, 160);
  assert.ok(out.endsWith("…"));
});

test("thinPageRobots noindexes (but follows) pages with no listings", () => {
  assert.deepEqual(thinPageRobots(0), { index: false, follow: true });
  assert.equal(thinPageRobots(1), undefined);
  assert.equal(thinPageRobots(12), undefined);
});

test("countNoun pluralizes", () => {
  assert.equal(countNoun(1, "school"), "1 school");
  assert.equal(countNoun(0, "airport"), "0 airports");
  assert.equal(countNoun(2, "city", "cities"), "2 cities");
});
