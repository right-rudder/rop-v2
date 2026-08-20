/**
 * Serialize structured data for a `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` does not escape `<`, so a value containing `</script>` would
 * close the tag and inject markup — a stored XSS for any text a listing owner
 * can edit. Escape the characters that can terminate or confuse the HTML
 * parser, plus the JS line terminators (U+2028 / U+2029), as JSON escape
 * sequences: the output stays valid JSON and round-trips to the original text.
 *
 * See: https://nextjs.org/docs/app/guides/json-ld
 */

// Built with fromCharCode so this source file stays ASCII-only
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

export function serializeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LINE_SEPARATOR)
    .join("\\u2028")
    .split(PARAGRAPH_SEPARATOR)
    .join("\\u2029");
}
