import { ArrowUpRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CompareButton } from "@/components/CompareButton";
import { cn } from "@/lib/cn";

type SchoolCardProps = {
  name: string;
  location: string; // e.g. "Mesa, AZ"
  /** Primary airport ICAO, e.g. "KFFZ" — shown in chart blue */
  airportCode?: string;
  rating?: number;
  reviewCount?: number;
  href?: string; // when provided, the whole card becomes a link
  /** When set, save + compare controls render top-right (as siblings of the link). */
  schoolId?: string;
  /** Page to re-render after saving; defaults to `href`. */
  path?: string;
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
  schoolId,
  path,
}: SchoolCardProps) {
  const hasReviews = rating !== undefined && (reviewCount ?? 0) > 0;

  const inner = (
    <>
      <div className={cn("mb-4 flex items-start justify-between gap-3", schoolId && "pr-20")}>
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

  const card = href ? (
    <Card href={href} className={cls}>
      {inner}
    </Card>
  ) : (
    <Card className={cls}>{inner}</Card>
  );
  if (!schoolId) return card;
  return (
    <div className="relative h-full">
      {card}
      <div className="absolute right-3 top-3 z-10 flex gap-1.5">
        <CompareButton id={schoolId} name={name} href={href ?? "#"} />
        <FavoriteButton schoolId={schoolId} path={path ?? href ?? "/"} />
      </div>
    </div>
  );
}
