import type { NextConfig } from "next";

// Supabase Storage host, derived from the project URL so there's no second
// place to update. The fallback keeps `next build` working when the env var
// is absent (CI type-checks, fresh clones) — no remote image will match it.
const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.invalid",
).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
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
