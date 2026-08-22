/** Pure helpers for the compare feature. No imports (node --test runs this file directly). */
export const COMPARE_MAX = 4;
export const COMPARE_STORAGE_KEY = "compare:v1";

export type ComparePick = { id: string; name: string; href: string };

const SAFE_ID = /^[a-z0-9-]{1,64}$/;

/** `?ids=a,b,c` → ["a","b","c"]: trimmed, safe, deduped, capped. */
export function parseCompareIds(param: string | null | undefined): string[] {
  if (!param) return [];
  const out: string[] = [];
  for (const raw of param.split(",")) {
    const id = raw.trim();
    if (!SAFE_ID.test(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length === COMPARE_MAX) break;
  }
  return out;
}

export function formatCompareHref(ids: string[]): string {
  return ids.length ? `/compare?ids=${encodeURIComponent(ids.join(","))}` : "/compare";
}
