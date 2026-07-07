import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

// Better shared defaults (will be overridden by pages when needed)
export const metadata: Metadata = {
  title: {
    default:
      "Flight School Finder - Find Pilot Training Centers Across the USA",
    template: "%s | Flight School Finder",
  },
  description: "Find flight schools by city, state, airport or name.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: "Flight School Finder",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Navbar />

          {/* Where the actual page content goes */}
          <main className="min-h-screen bg-slate-50 dark:bg-zinc-950">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-slate-950 border-t border-slate-800 text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                {/* Brand */}
                <div className="md:col-span-2">
                  <p className="text-lg font-bold text-white mb-2">
                    Flight School Finder
                  </p>
                  <p className="text-sm leading-relaxed max-w-xs">
                    Find and compare flight training schools across the USA —
                    built to help students discover the right path to their
                    pilot certificate.
                  </p>
                </div>
                {/* Browse */}
                <div>
                  <p className="text-sm font-semibold text-slate-200 mb-3">
                    Browse
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link
                        href="/states"
                        className="hover:text-white transition-colors"
                      >
                        By State
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/cities"
                        className="hover:text-white transition-colors"
                      >
                        By City
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/airports"
                        className="hover:text-white transition-colors"
                      >
                        By Airport
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/programs"
                        className="hover:text-white transition-colors"
                      >
                        Programs
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/aircraft"
                        className="hover:text-white transition-colors"
                      >
                        Aircraft
                      </Link>
                    </li>
                  </ul>
                </div>
                {/* Account */}
                <div>
                  <p className="text-sm font-semibold text-slate-200 mb-3">
                    Account
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link
                        href="/login"
                        className="hover:text-white transition-colors"
                      >
                        Log In
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/signup"
                        className="hover:text-white transition-colors"
                      >
                        Sign Up
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/schools/add"
                        className="hover:text-white transition-colors"
                      >
                        Add a School
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                <p>
                  © {new Date().getFullYear()} Flight School Finder · Built by{" "}
                  <a
                    href="https://timjedrek.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Tim Jedrek
                  </a>{" "}
                  &amp;{" "}
                  <a
                    href="https://rightruddermarketing.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Right Rudder Marketing
                  </a>
                </p>
                <div className="flex gap-5">
                  <Link
                    href="/terms-of-service"
                    className="hover:text-white transition-colors"
                  >
                    Terms
                  </Link>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
