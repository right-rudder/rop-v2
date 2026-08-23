import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Flight Schools",
    description: "Find and compare flight schools across the USA by state, city, airport and program.",
    start_url: "/",
    display: "standalone",
    // Paper canvas and ink from globals.css (light theme)
    background_color: "#fafaf8",
    theme_color: "#0e1424",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
