import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Auth + admin surfaces. Edit pages and profiles already send
        // `robots: { index: false }` in their metadata.
        disallow: [
          "/admin/",
          "/auth/",
          "/login",
          "/signup",
          "/forgot-password",
          "/update-password",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
