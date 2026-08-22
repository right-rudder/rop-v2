"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { COMPARE_MAX, COMPARE_STORAGE_KEY, type ComparePick } from "@/lib/compare";

type Ctx = {
  picks: ComparePick[];
  has: (id: string) => boolean;
  full: boolean;
  /** Returns false when the tray is full and the pick was not added. */
  toggle: (pick: ComparePick) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  replace: (picks: ComparePick[]) => void;
};

const CompareContext = createContext<Ctx | null>(null);

function load(): ComparePick[] {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p): p is ComparePick =>
          !!p &&
          typeof p === "object" &&
          typeof (p as ComparePick).id === "string" &&
          typeof (p as ComparePick).name === "string" &&
          typeof (p as ComparePick).href === "string",
      )
      .slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

function save(picks: ComparePick[]) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(picks));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

/** Browser-local compare selection (max COMPARE_MAX), persisted to localStorage. */
export function CompareProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<ComparePick[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setPicks(load());
  }, []);

  const update = useCallback((next: ComparePick[]) => {
    setPicks(next);
    save(next);
  }, []);

  const has = useCallback((id: string) => picks.some((p) => p.id === id), [picks]);
  const toggle = useCallback(
    (pick: ComparePick) => {
      if (picks.some((p) => p.id === pick.id)) {
        update(picks.filter((p) => p.id !== pick.id));
        return true;
      }
      if (picks.length >= COMPARE_MAX) return false;
      update([...picks, pick]);
      return true;
    },
    [picks, update],
  );
  const remove = useCallback(
    (id: string) => update(picks.filter((p) => p.id !== id)),
    [picks, update],
  );
  const clear = useCallback(() => update([]), [update]);
  const replace = useCallback(
    (next: ComparePick[]) => update(next.slice(0, COMPARE_MAX)),
    [update],
  );

  const value = useMemo(
    () => ({ picks, has, full: picks.length >= COMPARE_MAX, toggle, remove, clear, replace }),
    [picks, has, toggle, remove, clear, replace],
  );
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): Ctx {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside <CompareProvider>");
  return ctx;
}
