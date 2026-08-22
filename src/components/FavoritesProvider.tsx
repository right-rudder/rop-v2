"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toggleFavorite } from "@/app/actions/favorites";
import { useToast } from "@/components/ToastProvider";

type Ctx = {
  viewerId: string | null;
  ids: ReadonlySet<string>;
  pending: ReadonlySet<string>;
  lastError: string | null;
  toggle: (schoolId: string, path: string) => void;
};

const FavoritesContext = createContext<Ctx | null>(null);

/**
 * The signed-in user's saved school ids, seeded once by the root layout and
 * toggled optimistically. Cards read this instead of querying per page.
 */
export function FavoritesProvider({
  viewerId,
  initialIds,
  children,
}: {
  viewerId: string | null;
  initialIds: string[];
  children: ReactNode;
}) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [lastError, setLastError] = useState<string | null>(null);
  const seeded = useRef(initialIds.join(","));
  const toast = useToast();

  // Re-seed when the server hands down a different list (login/logout re-render the layout).
  useEffect(() => {
    const key = initialIds.join(",");
    if (key !== seeded.current) {
      seeded.current = key;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from server props
      setIds(new Set(initialIds));
    }
  }, [initialIds]);

  const toggle = useCallback(
    (schoolId: string, path: string) => {
      if (!viewerId || pending.has(schoolId)) return;
      const wasSaved = ids.has(schoolId);
      setLastError(null);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(schoolId);
        else next.add(schoolId);
        return next;
      });
      setPending((prev) => new Set(prev).add(schoolId));
      toggleFavorite(schoolId, path)
        .then((result) => {
          if ("error" in result) {
            setLastError(result.error);
            toast.error("Couldn't update saved schools", result.error);
            setIds((prev) => {
              const next = new Set(prev);
              if (wasSaved) next.add(schoolId);
              else next.delete(schoolId);
              return next;
            });
          } else {
            toast.ok(wasSaved ? "Removed from saved schools" : "Saved school", wasSaved ? undefined : "Find it anytime under Saved.");
          }
        })
        .catch(() => {
          setLastError("Couldn't save — try again.");
          toast.error("Couldn't save — try again.");
        })
        .finally(() =>
          setPending((prev) => {
            const next = new Set(prev);
            next.delete(schoolId);
            return next;
          }),
        );
    },
    [viewerId, ids, pending, toast],
  );

  const value = useMemo(
    () => ({ viewerId, ids, pending, lastError, toggle }),
    [viewerId, ids, pending, lastError, toggle],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): Ctx {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
