import { CalendarClock, Phone, Plane, Wallet } from "lucide-react";
import { LeadForm, type LeadViewer } from "@/components/LeadForm";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionalMotif } from "@/components/ui/SectionalMotif";

const POINTS = [
  {
    Icon: Plane,
    title: "Start with a discovery flight",
    body: "A short intro lesson where you take the controls with an instructor beside you — the best way to know if it's for you.",
  },
  {
    Icon: CalendarClock,
    title: "Train on your schedule",
    body: "Ask about part-time and accelerated paths, weekday or weekend blocks, and how soon you could start.",
  },
  {
    Icon: Wallet,
    title: "Get real numbers",
    body: "Hourly rates, packages and financing options — before you commit to anything.",
  },
];

/**
 * Closing band on a school page: a short "why train" pitch next to the
 * request-information form. Anchored at #inquire for the hero/sidebar buttons.
 */
export function InquiryCta({
  school,
  programs,
  viewer,
}: {
  school: { id: string; name: string; phone: string };
  programs: { slug: string; shortName: string }[];
  viewer: LeadViewer | null;
}) {
  return (
    <section
      id="inquire"
      aria-labelledby="inquire-title"
      className="relative scroll-mt-20 border-t border-line bg-surface-2/60"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <SectionalMotif
          animate={false}
          className="absolute -bottom-64 -left-48 h-[36rem] w-[36rem] opacity-[0.1] md:-left-32"
        />
      </div>

      <Container className="relative py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-16">
          <div>
            <Eyebrow accent>Request information</Eyebrow>
            <h2
              id="inquire-title"
              className="mt-4 text-3xl font-bold leading-[1.05] text-ink md:text-4xl"
            >
              Ready to start flight training at {school.name}?
            </h2>
            <p className="mt-4 max-w-prose text-lg text-muted">
              Every pilot&apos;s first step is a conversation. Tell {school.name} what you&apos;re
              aiming for and they&apos;ll reply with what it takes to get there.
            </p>

            <ul className="mt-8 space-y-5">
              {POINTS.map(({ Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                    <Icon size={18} aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            {school.phone && (
              <p className="mt-8 flex items-center gap-2 text-sm text-muted">
                <Phone size={14} aria-hidden />
                Prefer to talk?{" "}
                <a
                  href={`tel:${school.phone.replace(/\D/g, "")}`}
                  className="font-semibold text-ink transition-colors hover:text-accent-ink"
                >
                  {school.phone}
                </a>
              </p>
            )}
          </div>

          <LeadForm
            schoolId={school.id}
            schoolName={school.name}
            programs={programs}
            viewer={viewer}
          />
        </div>
      </Container>
    </section>
  );
}
