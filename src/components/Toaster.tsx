"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToastQueue } from "@/components/ToastProvider";
import type { Toast, ToastTone } from "@/lib/toast";
import { cn } from "@/lib/cn";

const tones: Record<ToastTone, { bar: string; icon: string; Icon: typeof Info }> = {
  ok: { bar: "bg-ok", icon: "text-ok", Icon: CheckCircle2 },
  error: { bar: "bg-danger", icon: "text-danger", Icon: AlertCircle },
  info: { bar: "bg-accent", icon: "text-accent-ink", Icon: Info },
};

/**
 * Renders the toast queue, top-right under the sticky navbar (clear of the
 * bottom CompareTray). The wrapper is a polite live region so additions are
 * announced; each error toast is also an alert.
 */
export function Toaster() {
  const { toasts, dismiss } = useToastQueue();
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 top-20 z-50 flex flex-col items-end gap-2.5 sm:inset-x-auto sm:right-6 sm:w-full sm:max-w-sm"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const { bar, icon, Icon } = tones[toast.tone];

  // Auto-dismiss; hovering or focusing the toast holds it open.
  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(onDismiss, toast.duration);
    return () => window.clearTimeout(t);
  }, [paused, toast.duration, onDismiss]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface py-3.5 pl-5 pr-3 shadow-card",
        "animate-toast-in",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", bar)} />
      <Icon size={18} aria-hidden className={cn("mt-0.5 shrink-0", icon)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-ink">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm leading-relaxed text-muted">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
