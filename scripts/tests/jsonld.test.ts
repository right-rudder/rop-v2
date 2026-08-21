import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeJsonLd } from "../../src/lib/jsonld.ts";

const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

test("escapes characters that could close the <script> tag", () => {
  const payload = "</script><img src=x onerror=alert(1)>";
  const out = serializeJsonLd({ name: payload });
  assert.ok(!out.includes("<"), "must not contain a raw <");
  assert.ok(!out.includes(">"), "must not contain a raw >");
  // Still valid JSON that round-trips to the original text
  assert.equal(JSON.parse(out).name, payload);
});

test("escapes ampersands and JS line terminators", () => {
  const raw = `x&y${LS}z${PS}`;
  const out = serializeJsonLd({ a: raw });
  assert.ok(!out.includes("&"));
  assert.ok(!out.includes(LS));
  assert.ok(!out.includes(PS));
  assert.equal(JSON.parse(out).a, raw);
});

test("leaves plain structured data unchanged", () => {
  assert.equal(
    serializeJsonLd({ "@type": "Thing", n: 1, ok: true }),
    '{"@type":"Thing","n":1,"ok":true}',
  );
});

test("drops undefined members like JSON.stringify", () => {
  assert.equal(serializeJsonLd({ a: 1, b: undefined }), '{"a":1}');
});
