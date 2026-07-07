"use client";

import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { navLinks } from "@/lib/nav-links";

export function Navbar() {
  const [open, setOpen] = useState(false);

  // Flatten nav links for mobile: top-level links stay as-is, children get promoted with mobileLabel
  const mobileLinks = navLinks.flatMap((link) =>
    link.children
      ? link.children.map((child) => ({
          label: child.mobileLabel,
          href: child.href,
        }))
      : [{ label: link.label, href: link.href as string }],
  );

  return (
    <header className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-rose-800 dark:text-rose-700"
          >
            Flight School Finder
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) =>
              link.children ? (
                // Dropdown item
                <div key={link.label} className="relative group">
                  <button className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-rose-900 dark:hover:text-rose-400">
                    {link.label}
                    <ChevronDown
                      size={14}
                      className="transition-transform group-hover:rotate-180"
                    />
                  </button>
                  {/* Transparent bridge fills the gap so hover stays active */}
                  <div className="absolute top-full left-0 hidden group-hover:block pt-2 min-w-40">
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg shadow-lg overflow-hidden flex flex-col">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-slate-700 dark:text-slate-300 hover:text-rose-900 dark:hover:text-rose-400"
                >
                  {link.label}
                </a>
              ),
            )}
            <Link
              href="/login"
              className="bg-rose-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-600 transition-colors shadow-sm"
            >
              Log In
            </Link>
            <ThemeToggle />
          </nav>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="text-slate-700 dark:text-slate-300"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown — expands from top-right */}
      <div
        className={`
          md:hidden fixed inset-0 bg-white/98 dark:bg-slate-950/98 backdrop-blur-sm
          transition-all duration-200 mt-16
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        <nav className="flex flex-col py-2 min-w-44">
          {mobileLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {link.label}
            </a>
          ))}
          <div className="px-5 py-3">
            <Link
              href="/login"
              className="block w-full bg-rose-700 text-white px-4 py-2 rounded-lg hover:bg-rose-600 text-sm font-medium transition-colors text-center"
            >
              Log In
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
