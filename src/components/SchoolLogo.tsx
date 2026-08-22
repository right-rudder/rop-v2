import Image from "next/image";
import { cn } from "@/lib/cn";
import { BUCKETS, publicImageUrl } from "@/lib/supabase/storage-url";

/** First letters of the first two words — the fallback when there's no logo. */
function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const SIZES = {
  sm: { box: "h-10 w-10 rounded-lg text-xs", px: 40 },
  md: { box: "h-16 w-16 rounded-xl text-base", px: 64 },
  lg: { box: "h-20 w-20 rounded-2xl text-lg", px: 80 },
} as const;

/**
 * A school's logo, or its monogram when none is set. Callers pass the stored
 * path and this resolves the URL, so they never build one by hand.
 *
 * This renders inside Client Components too (SchoolCard -> TopRatedExplorer),
 * so it MUST stay client-safe: import from lib/supabase/storage-url, never
 * from lib/supabase/storage, which pulls in node:crypto via lib/images.
 */
export function SchoolLogo({
  name,
  logoPath,
  size = "md",
  className,
}: {
  name: string;
  logoPath?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { box, px } = SIZES[size];
  const base = cn("flex shrink-0 items-center justify-center overflow-hidden", box, className);

  if (!logoPath) {
    return (
      <div
        className={cn(base, "bg-accent-soft font-display font-bold text-accent-ink")}
        aria-hidden
      >
        {monogram(name)}
      </div>
    );
  }

  return (
    <div className={cn(base, "border border-line bg-surface")}>
      <Image
        src={publicImageUrl(BUCKETS.schoolLogos, logoPath)}
        alt={`${name} logo`}
        width={px}
        height={px}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
