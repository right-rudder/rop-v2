import { Card } from "@/components/ui/Card";

/** Airport tile: ICAO in chart blue, secondary identifiers as mono tags. */
export function AirportCard({
  icao,
  iata,
  faaLid,
  name,
  location,
  schoolCount,
}: {
  icao: string;
  iata?: string | null;
  faaLid?: string | null;
  name: string;
  location?: string;
  schoolCount?: number;
}) {
  const tags = [iata, faaLid && faaLid !== iata ? faaLid : null].filter(Boolean) as string[];
  return (
    <Card href={`/airports/${icao.toLowerCase()}`} className="flex h-full flex-col p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-mono text-2xl font-semibold leading-none text-sky">{icao}</span>
        {tags.length > 0 && (
          <span className="flex gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted"
              >
                {t}
              </span>
            ))}
          </span>
        )}
      </div>
      <p className="font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">
        {name}
      </p>
      {(location || schoolCount !== undefined) && (
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
          <span>{location}</span>
          {schoolCount !== undefined && (
            <span className="font-mono">
              {schoolCount} {schoolCount === 1 ? "school" : "schools"}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
