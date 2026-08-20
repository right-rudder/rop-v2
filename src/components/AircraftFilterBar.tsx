"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AircraftCategory } from "@/lib/types";
import { Chip } from "@/components/ui/Chip";

const FILTERS: { value: AircraftCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "single-engine", label: "Single-engine" },
  { value: "multi-engine", label: "Multi-engine" },
  { value: "helicopter", label: "Helicopter" },
  { value: "sport", label: "Sport / LSA" },
  { value: "glider", label: "Glider" },
];

export default function AircraftFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "all";

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {FILTERS.map(({ value, label }) => (
        <Chip key={value} active={active === value} onClick={() => select(value)}>
          {label}
        </Chip>
      ))}
    </div>
  );
}
