"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { BackToTop } from "@/components/TopRatedExplorer";

const PAGE_SIZE = 6;

export type SchoolListItem = {
  id: string;
  name: string;
  href: string;
  airportCode: string;
  airportName?: string;
  location?: string;
  rating: number;
  reviewCount?: number;
};

type Props = {
  schools: SchoolListItem[];
  heading: string;
};

export function SchoolsExplorer({ schools, heading }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = schools.slice(0, visibleCount);
  const hasMore = visibleCount < schools.length;

  if (schools.length === 0) {
    return (
      <section>
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight text-ink">{heading}</h2>
        <p className="text-muted">No schools listed yet.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{heading}</h2>
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
          {visible.length} of {schools.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((school) => (
          <Card key={school.id} href={school.href} className="p-5">
            <p className="mb-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
              <span className="font-semibold text-sky">{school.airportCode}</span>
              {school.airportName ? ` · ${school.airportName}` : ""}
            </p>
            <p className="font-display text-lg font-bold leading-tight tracking-tight text-ink transition-colors group-hover:text-accent-ink">
              {school.name}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              {school.location ? (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MapPin size={12} />
                  {school.location}
                </p>
              ) : (
                <span />
              )}
              {school.reviewCount === 0 ? (
                <span className="text-xs text-muted">No reviews yet</span>
              ) : (
                <Stars value={school.rating} size={13} />
              )}
            </div>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button variant="secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Show more schools
          </Button>
        </div>
      )}

      <BackToTop visible={showBackToTop} />
    </section>
  );
}
