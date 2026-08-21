"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthButton, type NavViewer } from "@/components/AuthButton";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { navLinks } from "@/lib/nav-links";
import { cn } from "@/lib/cn";

const linkBase =
  "relative inline-flex items-center gap-1 rounded-md py-1 text-sm font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const linkIdle = "text-muted hover:text-ink";
// Active route: magenta rule under the label, like a chart annotation
const linkActive =
  "text-ink after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-accent";

export function Navbar({ viewer }: { viewer: NavViewer | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Desktop dropdown opened by click / keyboard (hover still works via CSS)
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  // Flatten nav links for mobile: top-level links stay as-is, children get promoted with mobileLabel
  const mobileLinks = navLinks.flatMap((link) =>
    link.children
      ? link.children.map((child) => ({ label: child.mobileLabel, href: child.href }))
      : [{ label: link.label, href: link.href as string }],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="group relative"
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={openMenu === link.label}
                    onClick={() =>
                      setOpenMenu((current) => (current === link.label ? null : link.label))
                    }
                    className={cn(
                      linkBase,
                      link.children.some((c) => isActive(c.href)) ? linkActive : linkIdle,
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform duration-200 group-hover:rotate-180",
                        openMenu === link.label && "rotate-180",
                      )}
                    />
                  </button>
                  {/* Transparent bridge fills the gap so hover stays active */}
                  <div
                    className={cn(
                      "absolute left-1/2 top-full min-w-48 -translate-x-1/2 pt-3",
                      openMenu === link.label
                        ? "block"
                        : "hidden group-hover:block group-focus-within:block",
                    )}
                  >
                    <div className="flex animate-scale-in flex-col overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-card">
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={() => setOpenMenu(null)}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-2",
                            isActive(child.href)
                              ? "font-semibold text-accent-ink"
                              : "text-ink",
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(linkBase, isActive(link.href) ? linkActive : linkIdle)}
                >
                  {link.label}
                </Link>
              ),
            )}
            <div className="ml-1 flex items-center gap-2 border-l border-line pl-5">
              <AuthButton viewer={viewer} />
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="rounded-lg p-2 text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile panel — slides down under the bar */}
      {open && (
        <div
          id="mobile-nav"
          className="animate-slide-down border-t border-line bg-paper md:hidden"
        >
          <nav className="flex flex-col px-3 py-3" aria-label="Primary mobile">
            {mobileLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-surface-2",
                  isActive(link.href) ? "text-accent-ink" : "text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-line px-1 pt-4">
              <AuthButton viewer={viewer} mobile />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
