import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, parseCsvRecords, toCsv } from "../seed/csv.ts";

test("parseCsv handles quotes, escaped quotes, embedded commas and newlines", () => {
  assert.deepEqual(parseCsv("a,b\n1,2"), [
    ["a", "b"],
    ["1", "2"],
  ]);
  assert.deepEqual(parseCsv('a,"b,c"\n1,"say ""hi"""'), [
    ["a", "b,c"],
    ["1", 'say "hi"'],
  ]);
  assert.deepEqual(parseCsv('x\n"line\nbreak"'), [["x"], ["line\nbreak"]]);
});

test("parseCsv normalises CRLF and strips a BOM", () => {
  assert.deepEqual(parseCsv("a,b\r\n1,2\r\n"), [
    ["a", "b"],
    ["1", "2"],
  ]);
  assert.deepEqual(parseCsv("﻿a,b\n1,2"), [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("parseCsvRecords keys rows by header and trims cells", () => {
  const rows = parseCsvRecords("name, city \nWings Inc , Mesa \n");
  assert.deepEqual(rows, [{ name: "Wings Inc", city: "Mesa" }]);
});

test("parseCsvRecords keeps the first of duplicate header names", () => {
  const rows = parseCsvRecords("name,name\nfirst,second");
  assert.deepEqual(rows, [{ name: "first" }]);
});

test("toCsv round-trips values that need quoting", () => {
  const rows = [{ a: 'say "hi"', b: "x,y", c: "line\nbreak" }];
  const text = toCsv(["a", "b", "c"], rows);
  assert.deepEqual(parseCsvRecords(text), rows);
});

test("toCsv emits empty strings for missing keys", () => {
  assert.equal(toCsv(["a", "b"], [{ a: "1" }]), "a,b\n1,\n");
});
