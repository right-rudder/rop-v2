import Link from "next/link";
import { MapPin, Plane, Star } from "lucide-react";

type SchoolCardProps = {
  name: string;
  location: string; // e.g. "Mesa, AZ"
  rating?: number;
  reviewCount?: number;
  imageGradient?: string;
  href?: string; // when provided, the whole card becomes a link
};

export function SchoolCard({
  name,
  location,
  rating = 4.8,
  reviewCount = 142,
  imageGradient = "from-blue-600/20 via-indigo-600/10 to-blue-900/30 dark:from-blue-900/40 dark:via-indigo-950/40 dark:to-slate-900/60",
  href,
}: SchoolCardProps) {
  const inner = (
    <>
      {/* Thumbnail */}
      <div
        className={`relative h-44 bg-linear-to-br ${imageGradient} flex items-center justify-center`}
      >
        <Plane
          size={52}
          className="text-blue-400/30 dark:text-blue-400/20 rotate-12"
        />
      </div>

      <div className="p-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5 line-clamp-2 leading-snug">
          {name}
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-bold">{rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({reviewCount})
            </span>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            View →
          </span>
        </div>
      </div>
    </>
  );

  const cls =
    "bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-zinc-800 block";

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return <div className={cls}>{inner}</div>;
}
