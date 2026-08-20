import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BASE_URL } from "@/lib/site";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Better shared defaults (will be overridden by pages when needed)
export const metadata: Metadata = {
  title: {
    default:
      "Flight School Finder – Find Pilot Training Schools Across the USA",
    template: "%s | Flight School Finder",
  },
  description: "Find flight schools by city, state, airport or name.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: "Flight School Finder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="min-h-screen bg-paper">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
