"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createToast,
  pushToast,
  removeToast,
  type Toast,
  type ToastInput,
} from "@/lib/toast";

export type ToastApi = {
  /** Queue a toast; returns its id so the caller can dismiss it early. */
  toast: (input: ToastInput) => string;
  ok: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
};

type Queue = { toasts: Toast[]; dismiss: (id: string) => void };

// Two contexts: the API never changes identity, so components that only
// *raise* toasts don't re-render every time the queue does.
const ApiContext = createContext<ToastApi | null>(null);
const QueueContext = createContext<Queue | null>(null);

/** Global toast queue. Mounted once in the root layout with <Toaster />. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => removeToast(prev, id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = `toast-${++counter.current}`;
    setToasts((prev) => pushToast(prev, createToast(input, id)));
    return id;
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      ok: (title, description) => toast({ tone: "ok", title, description }),
      error: (title, description) => toast({ tone: "error", title, description }),
      info: (title, description) => toast({ tone: "info", title, description }),
      dismiss,
    }),
    [toast, dismiss],
  );
  const queue = useMemo<Queue>(() => ({ toasts, dismiss }), [toasts, dismiss]);

  return (
    <ApiContext.Provider value={api}>
      <QueueContext.Provider value={queue}>{children}</QueueContext.Provider>
    </ApiContext.Provider>
  );
}

/** Raise toasts from any client component: `const toast = useToast(); toast.ok("Saved")`. */
export function useToast(): ToastApi {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/** The live queue — only <Toaster /> needs this. */
export function useToastQueue(): Queue {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("useToastQueue must be used inside <ToastProvider>");
  return ctx;
}

type ActionState = { error?: string; success?: boolean; message?: string };

type ActionToastCopy<S extends ActionState> = {
  /** Shown when the action reports success (or a message). Omit to skip. */
  ok?: ToastInput | ((state: S) => ToastInput | null | undefined);
  /** Title for the error toast; the action's message becomes the description. */
  errorTitle?: string;
};

/**
 * Mirror a useActionState result as a toast: errors as `error`, success as
 * `ok`. Keyed on the state object itself — every action return is a fresh
 * object, so resubmitting with the same error still re-announces it.
 */
export function useActionToast<S extends ActionState>(state: S, copy: ActionToastCopy<S>) {
  const toast = useToast();
  // Effect Event: reads the latest `copy` without making it a dependency, so
  // an inline copy object doesn't re-fire the effect on every render.
  const announce = useEffectEvent((s: S) => {
    const { ok, errorTitle } = copy;
    if (s.error) {
      toast.error(errorTitle ?? "Something went wrong", s.error);
    } else if (s.success || s.message) {
      const input = typeof ok === "function" ? ok(s) : ok;
      if (input) toast.toast({ tone: "ok", ...input });
    }
  });

  useEffect(() => {
    announce(state);
  }, [state]);
}
