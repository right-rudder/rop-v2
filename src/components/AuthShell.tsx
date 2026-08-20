import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { LogoMark } from "@/components/ui/Logo";
import { SectionalMotif } from "@/components/ui/SectionalMotif";

/** Centered card used by log in / sign up / password pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <SectionalMotif className="pointer-events-none absolute left-1/2 top-1/2 h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" />
      <Card className="relative w-full max-w-md p-8 shadow-card">
        <div className="mb-8 text-center">
          <LogoMark size={28} className="mx-auto mb-5" />
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-muted">{subtitle}</p>
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </Card>
    </div>
  );
}
