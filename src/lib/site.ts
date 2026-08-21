/**
 * Canonical public origin of the site, without a trailing slash.
 *
 * Single source for `metadataBase`, the sitemap, robots, auth redirect URLs
 * and absolute JSON-LD URLs. Set NEXT_PUBLIC_SITE_URL in production.
 */
function resolveBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return configured.replace(/\/+$/, "");
}

export const BASE_URL = resolveBaseUrl();

export const SITE_NAME = "Flight School Finder";

/** Absolute URL for a site-relative path: "/states/arizona" → "https://…/states/arizona" */
export function absoluteUrl(path: string): string {
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
