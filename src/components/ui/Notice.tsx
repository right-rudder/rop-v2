import type { ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "ok" | "error" | "info";

const tones: Record<Tone, { cls: string; Icon: typeof Info }> = {
  ok: { cls: "bg-ok-soft text-ok border-ok/20", Icon: CheckCircle2 },
  error: { cls: "bg-danger-soft text-danger border-danger/20", Icon: AlertCircle },
  info: { cls: "bg-accent-soft text-accent-ink border-accent/20", Icon: Info },
};

/** Inline status banner for forms and page-level feedback. */
export function Notice({
  tone = "info",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  const { cls, Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-relaxed",
        cls,
        className,
      )}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
