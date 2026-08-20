"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { SchoolCard } from "@/components/SchoolCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const PAGE_SIZE = 6;

/** Just the fields the cards render — keep the client payload small */
export type TopRatedItem = {
  id: string;
  name: string;
  location: string;
  airportCode?: string;
  href: string;
  rating: number;
  reviewCount: number;
};

type Props = {
  schools: TopRatedItem[];
};

export function TopRatedExplorer({ schools }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = schools.slice(0, visibleCount);
  const hasMore = visibleCount < schools.length;

  return (
    <Container className="py-12 md:py-16">
      <p className="mb-8 font-mono text-xs uppercase tracking-[0.12em] text-muted">
        Showing {visible.length} of {schools.length} schools
      </p>

      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((school, index) => (
          <Reveal key={school.id} index={index % PAGE_SIZE} className="h-full">
            <li className="relative h-full">
              {/* Rank — a real ordering, so it's numbered */}
              <span
                aria-label={`Rank ${index + 1}`}
                className={
                  index < 3
                    ? "absolute -left-2 -top-2 z-10 flex h-8 min-w-8 items-center justify-center rounded-full bg-accent px-2 font-mono text-sm font-semibold text-white shadow-sm"
                    : "absolute -left-2 -top-2 z-10 flex h-8 min-w-8 items-center justify-center rounded-full border border-line bg-surface px-2 font-mono text-sm font-semibold text-muted"
                }
              >
                {index + 1}
              </span>
              <SchoolCard
                name={school.name}
                location={school.location}
                airportCode={school.airportCode}
                rating={school.rating}
                reviewCount={school.reviewCount}
                href={school.href}
              />
            </li>
          </Reveal>
        ))}
      </ol>

      {hasMore && (
        <div className="mt-12 text-center">
          <Button variant="secondary" size="lg" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Show more schools
          </Button>
        </div>
      )}

      <BackToTop visible={showBackToTop} />
    </Container>
  );
}

/** Floating "back to top" control shared by the paged explorers */
export function BackToTop({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 flex h-11 w-11 animate-scale-in items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card transition-colors hover:border-accent hover:text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <ArrowUp size={18} />
    </button>
  );
}
