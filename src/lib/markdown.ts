/**
 * Make free text safe inside a one-line Markdown construct such as a link
 * label or the note after it. User-supplied names and descriptions may
 * contain `[`, `]`, `\` or newlines (validation only checks length), any of
 * which would end the link early or break the line structure of /llms.txt.
 * Escapes only those — the text is read by people and models, so the rest
 * stays as written.
 */
export function mdInline(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\[\]]/g, (c) => `\\${c}`);
}
