"use client";

import { useEffect } from "react";
import { useCompare } from "@/components/CompareProvider";
import type { ComparePick } from "@/lib/compare";

/** Seeds the compare tray from a shared /compare URL. Renders nothing. */
export function CompareSync({ picks }: { picks: ComparePick[] }) {
  const { replace } = useCompare();
  const key = picks.map((p) => p.id).join(",");
  useEffect(() => {
    replace(picks);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per distinct id list
  }, [key]);
  return null;
}
