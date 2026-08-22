import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCompareIds, formatCompareHref, COMPARE_MAX } from "../../src/lib/compare.ts";

test("parseCompareIds: splits, trims, dedupes, keeps order", () => {
  assert.deepEqual(parseCompareIds("a, b,a,c"), ["a", "b", "c"]);
});

test("parseCompareIds: drops unsafe or empty ids", () => {
  assert.deepEqual(parseCompareIds("ok-1,,Bad Id,<script>,x"), ["ok-1", "x"]);
  assert.deepEqual(parseCompareIds(null), []);
  assert.deepEqual(parseCompareIds(undefined), []);
  assert.deepEqual(parseCompareIds(""), []);
});

test("parseCompareIds: caps at COMPARE_MAX", () => {
  const ids = parseCompareIds("a,b,c,d,e,f");
  assert.equal(ids.length, COMPARE_MAX);
  assert.deepEqual(ids, ["a", "b", "c", "d"]);
});

test("parseCompareIds: rejects ids longer than 64 chars", () => {
  assert.deepEqual(parseCompareIds("a".repeat(65) + ",b"), ["b"]);
});

test("formatCompareHref", () => {
  assert.equal(formatCompareHref(["a", "b"]), "/compare?ids=a%2Cb");
  assert.equal(formatCompareHref([]), "/compare");
});
