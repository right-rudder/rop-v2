import { test } from "node:test";
import assert from "node:assert/strict";
import { PROGRAM_FAQS } from "../../src/content/program-faqs.ts";
import { STATE_INTROS, CITY_INTROS } from "../../src/content/location-intros.ts";

test("every program FAQ is a real question with a self-contained answer", () => {
  for (const [slug, faqs] of Object.entries(PROGRAM_FAQS)) {
    assert.ok(faqs.length >= 2, `${slug}: at least two questions`);
    const questions = new Set<string>();
    for (const { q, a } of faqs) {
      assert.ok(q.endsWith("?"), `${slug}: "${q}" should end with ?`);
      assert.ok(!questions.has(q), `${slug}: duplicate question "${q}"`);
      questions.add(q);
      assert.ok(a.length >= 80 && a.length <= 700, `${slug}: answer length ${a.length} for "${q}"`);
      assert.ok(!/\s{2,}/.test(a), `${slug}: double spaces in answer for "${q}"`);
    }
  }
});

test("location intros are substantive paragraphs", () => {
  for (const [slug, paragraphs] of Object.entries({ ...STATE_INTROS, ...CITY_INTROS })) {
    assert.ok(paragraphs.length >= 1, slug);
    for (const p of paragraphs) assert.ok(p.length >= 150, `${slug}: paragraph too short (${p.length})`);
  }
});
