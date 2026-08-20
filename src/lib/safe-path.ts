/**
 * Accept a redirect target only if it is a same-site path.
 *
 * Used for every user-influenced redirect (`?next=` on the auth confirm
 * route and the login form) and for `revalidatePath` targets. Anything that
 * could leave the origin — absolute URLs, protocol-relative `//host`,
 * backslash tricks, `javascript:` — falls back.
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value) return fallback;
  // Must start with exactly one "/" (not "//host" or "/\host")
  if (!/^\/(?![/\\])/.test(value)) return fallback;
  // No whitespace or control characters — some parsers strip them, which
  // can turn a "safe" string into a different URL
  if (hasWhitespaceOrControl(value)) return fallback;
  return value;
}

function hasWhitespaceOrControl(value: string): boolean {
  if (/\s/.test(value)) return true;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}
