import { ArrowUpRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";

type SchoolCardProps = {
  name: string;
  location: string; // e.g. "Mesa, AZ"
  /** Primary airport ICAO, e.g. "KFFZ" — shown in chart blue */
  airportCode?: string;
  rating?: number;
  reviewCount?: number;
  href?: string; // when provided, the whole card becomes a link
};

/**
 * Listing card. No fake thumbnail: the identifying data (airport code, city)
 * is the image — set in the mono "chart" voice above a display-face name.
 */
export function SchoolCard({
  name,
  location,
  airportCode,
  rating,
  reviewCount,
  href,
}: SchoolCardProps) {
  const hasReviews = rating !== undefined && (reviewCount ?? 0) > 0;

  const inner = (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
          {airportCode ? (
            <span className="font-semibold text-sky">{airportCode}</span>
          ) : (
            <MapPin size={12} className="shrink-0" aria-hidden />
          )}
          {airportCode && <span aria-hidden>·</span>}
          <span className="truncate">{location}</span>
        </p>
        {href && (
          <ArrowUpRight
            size={18}
            aria-hidden
            className="shrink-0 text-muted transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-ink"
          />
        )}
      </div>

      <h3 className="mb-5 line-clamp-2 font-display text-xl font-bold leading-tight tracking-tight text-ink">
        {name}
      </h3>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
        {hasReviews ? (
          <Stars value={rating} count={reviewCount} size={14} />
        ) : (
          <span className="text-xs text-muted">No reviews yet</span>
        )}
      </div>
    </>
  );

  const cls = "flex h-full flex-col p-5";

  if (href) {
    return (
      <Card href={href} className={cls}>
        {inner}
      </Card>
    );
  }
  return <Card className={cls}>{inner}</Card>;
}
