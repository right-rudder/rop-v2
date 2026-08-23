import type { Metadata } from "next";

const ELLIPSIS = "…";

/** "1 school" / "2 schools" — for counts in titles and descriptions. */
export function countNoun(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Fit free text into a meta description. Collapses whitespace, then cuts at
 * the last word boundary that fits (trailing punctuation dropped) and ends
 * with an ellipsis — never mid-word, and never longer than `max`. A single
 * word longer than the budget is hard-cut.
 */
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const budget = max - ELLIPSIS.length;
  const boundary = clean.lastIndexOf(" ", budget);
  const head = (boundary > 0 ? clean.slice(0, boundary) : clean.slice(0, budget)).replace(
    /[\s,;:.–—-]+$/,
    "",
  );
  return `${head}${ELLIPSIS}`;
}

/**
 * Robots directive for a location page (state / city / airport) by how many
 * schools it lists. A page with none is a near-empty template — with a small
 * catalog that's most of them — so it's kept out of the index (but still
 * crawled, so its links to populated pages count) until it has a listing.
 * The sitemap applies the same rule.
 */
export function thinPageRobots(schoolCount: number): Metadata["robots"] {
  return schoolCount === 0 ? { index: false, follow: true } : undefined;
}
