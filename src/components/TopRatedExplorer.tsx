"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { SchoolCard } from "@/components/SchoolCard";

const PAGE_SIZE = 6;

/** Just the fields the cards render — keep the client payload small */
export type TopRatedItem = {
  id: string;
  name: string;
  location: string;
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Showing {visible.length} of {schools.length} schools · ranked by rating &amp; reviews
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {visible.map((school, index) => (
          <div key={school.id} className="relative">
            {index < 3 && (
              <div className="absolute -top-3 -left-3 z-10 w-8 h-8 rounded-full bg-rose-700 text-white text-sm font-bold flex items-center justify-center shadow-md">
                {index + 1}
              </div>
            )}
            <SchoolCard
              name={school.name}
              location={school.location}
              rating={school.rating}
              reviewCount={school.reviewCount}
              href={school.href}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
          >
            Load More Schools
          </button>
        </div>
      )}

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-rose-800 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </section>
  );
}
