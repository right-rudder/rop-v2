import type { Metadata } from "next";
import { HowItWorksContent } from "@/components/HowItWorksContent";
import { JsonLd } from "@/components/JsonLd";
import { ALL_HELP_FAQS } from "@/content/help-content";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import { metaDescription } from "@/lib/seo";

const DESCRIPTION =
  "How to use Flight School Finder: search and compare flight schools, request information, write reviews, and — if you run a school — claim, add or edit your listing.";

export const metadata: Metadata = {
  title: "How It Works",
  description: metaDescription(DESCRIPTION),
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How Flight School Finder Works",
    description: metaDescription(DESCRIPTION),
    url: "/how-it-works",
    type: "website",
  },
};

export default function HowItWorksPage() {
  return (
    <>
      {/*
        Built from the full FAQ list on the server, so the page's filter box —
        which only narrows what is rendered client-side — can never desync the
        structured data from what a crawler is told the page answers.
      */}
      <JsonLd data={breadcrumbJsonLd([{ name: "How It Works", path: "/how-it-works" }])} />
      <JsonLd data={faqJsonLd(ALL_HELP_FAQS)} />
      <HowItWorksContent />
    </>
  );
}
