import type { NextConfig } from "next";

// Supabase Storage host, derived from the project URL so there's no second
// place to update. The fallback keeps `next build` working when the env var
// is absent (CI type-checks, fresh clones) — no remote image will match it.
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.invalid");
// Take the protocol from the URL rather than assuming https: a local Supabase
// stack serves over http://127.0.0.1, and a mismatch here makes next/image
// refuse the logo.
const supabaseProtocol = supabaseUrl.protocol === "http:" ? "http" : "https";

/**
 * Baseline security headers on every response. Deliberately no
 * Content-Security-Policy yet: one needs allow-lists for Google Maps,
 * Supabase and the inline JSON-LD, and should ship report-only first.
 */
const securityHeaders = [
  // Two years, subdomains included. Add "; preload" after submitting to hstspreload.org.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // Geolocation stays available to our own origin: /search and /near-me use it.
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: supabaseProtocol,
        hostname: supabaseUrl.hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // School logos ride to the updateSchool server action inside the form.
    // The bucket caps images at 2MB; the rest is multipart overhead and the
    // other school fields. Stays well under Netlify's ~6MB request limit.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
