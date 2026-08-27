"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Columns3,
  GraduationCap,
  Heart,
  Info,
  Mail,
  MessageSquare,
  Pencil,
  PlusCircle,
  Send,
  Star,
  type LucideIcon,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { FaqList } from "@/components/FaqList";
import { FilterInput, NoMatches } from "@/components/ExplorerControls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  HELP_FAQ_GROUPS,
  HELP_GUIDES,
  SUPPORT_EMAIL,
  type HelpGuide,
} from "@/content/help-content";
import type { Faq } from "@/lib/structured-data";
import { countNoun } from "@/lib/seo";

const GUIDE_ICONS: Record<string, LucideIcon> = {
  saved: Heart,
  compare: Columns3,
  "request-info": Send,
  "write-review": Star,
  comments: MessageSquare,
  claim: BadgeCheck,
  "add-school": PlusCircle,
  "edit-listing": Pencil,
};

/**
 * Filter haystacks, built once at module scope: the content is static, so
 * there is nothing to memoize per render.
 */
const GUIDE_TEXT = new Map(
  HELP_GUIDES.map((guide) => [
    guide.id,
    [guide.title, guide.summary, ...guide.steps, ...(guide.notes ?? []), ...(guide.keywords ?? [])]
      .join(" ")
      .toLowerCase(),
  ]),
);

const FAQ_TEXT = new Map<Faq, string>(
  HELP_FAQ_GROUPS.flatMap((group) =>
    group.faqs.map((faq) => [faq, `${faq.q} ${faq.a} ${group.title}`.toLowerCase()] as const),
  ),
);

const h2 = "font-display text-2xl font-bold tracking-tight text-ink md:text-3xl";

const audienceLabel = (audience: HelpGuide["audience"]) =>
  audience === "students" ? "Student pilots" : "Flight schools";

/**
 * The whole help page body. It is a client component because the filter box
 * in the hero drives the sections below it; with an empty query — which is
 * how the page is server-rendered and how a crawler sees it — every guide and
 * every answer is in the markup. The page's FAQPage structured data is
 * emitted server-side from the full list, so filtering never touches it.
 */
export function HowItWorksContent() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const searching = needle.length > 0;

  const guides = searching
    ? HELP_GUIDES.filter((guide) => GUIDE_TEXT.get(guide.id)?.includes(needle))
    : HELP_GUIDES;

  const faqGroups = searching
    ? HELP_FAQ_GROUPS.map((group) => ({
        ...group,
        faqs: group.faqs.filter((faq) => FAQ_TEXT.get(faq)?.includes(needle)),
      })).filter((group) => group.faqs.length > 0)
    : HELP_FAQ_GROUPS;

  const faqCount = faqGroups.reduce((total, group) => total + group.faqs.length, 0);
  const nothingMatched = searching && guides.length === 0 && faqCount === 0;

  const studentGuides = HELP_GUIDES.filter((guide) => guide.audience === "students");
  const ownerGuides = HELP_GUIDES.filter((guide) => guide.audience === "owners");

  return (
    <div className="pb-20">
      <PageHero
        size="default"
        eyebrow="Help & FAQ"
        title="How Flight School Finder works"
        description="A free directory of flight schools across the USA. Search it, compare schools, read what students say, and contact a school directly — or, if you run one, take charge of its listing."
      >
        <FilterInput
          value={query}
          onChange={setQuery}
          placeholder="Search help topics and questions…"
          label="Search help topics"
          className="max-w-xl"
        />
        <p aria-live="polite" className="mt-3 text-sm text-muted">
          {searching
            ? nothingMatched
              ? "No matches"
              : `${countNoun(guides.length, "guide")} and ${countNoun(faqCount, "answer")} match`
            : "Or read it end to end — everything is on this page."}
        </p>
      </PageHero>

      <Container size="default" className="space-y-16 py-14">
        {!searching && (
          <>
            <section id="what-is-this" className="scroll-mt-24 space-y-4">
              <h2 className={h2}>What this site is</h2>
              <p className="max-w-prose leading-relaxed text-muted">
                Flight School Finder is a directory of flight training schools in the United
                States. Every listing shows the school&apos;s home airport, the programs it offers
                from private pilot through ATP and instructor ratings, its FAA Part 61 or Part 141
                status, fleet and instructor estimates, contact details, and reviews written by
                students who trained there.
              </p>
              <p className="max-w-prose leading-relaxed text-muted">
                You can use the whole directory without an account: search, compare schools side
                by side, and send an information request to any school. An account adds the things
                that need to be tied to a person — saving schools, writing reviews, commenting, and
                managing a listing if you run a flight school.
              </p>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <PathCard
                id="for-students"
                icon={GraduationCap}
                eyebrow="Student pilots"
                title="Looking for flight training"
                lead="Start with search, narrow to a shortlist, then talk to the schools that fit."
                points={[
                  "Search by state, city, airport code, program, aircraft, FAA Part or rating — or within a radius of where you live.",
                  "Save the ones you like to your account, and put up to four side by side to compare programs, fleet and ratings.",
                  "Read student reviews, then send an information request straight from a listing. No account needed for that.",
                ]}
                guides={studentGuides}
                cta={{ label: "Search flight schools", href: "/search" }}
              />
              <PathCard
                id="for-schools"
                icon={Building2}
                eyebrow="Flight schools"
                title="You run a flight school"
                lead="Search the directory for your school first — what you do next depends on whether it is already there."
                points={[
                  "Already listed? Claim it, and once we verify you the listing is yours to edit.",
                  "Not listed? Submit it. After review it goes live with you as its manager.",
                  "Listings are free, and you can update yours whenever something changes.",
                ]}
                guides={ownerGuides}
                cta={{ label: "Add your school", href: "/schools/add" }}
              />
            </section>
          </>
        )}

        {guides.length > 0 && (
          <section id="guides" className="scroll-mt-24">
            <h2 className={h2}>{searching ? "Matching guides" : "Step-by-step guides"}</h2>
            {!searching && (
              <p className="mt-3 max-w-prose leading-relaxed text-muted">
                The {HELP_GUIDES.length} things people come here to do, start to finish.
              </p>
            )}
            <div className="mt-8 space-y-6">
              {guides.map((guide) => (
                <GuideBlock key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}

        {faqGroups.length > 0 && (
          <section id="faq" className="scroll-mt-24">
            <h2 className={h2}>
              {searching ? "Matching questions" : "Frequently asked questions"}
            </h2>
            <div className="mt-8 space-y-10">
              {faqGroups.map((group) => (
                <div key={group.id} id={group.id} className="scroll-mt-24">
                  <h3 className="font-display text-xl font-bold tracking-tight text-ink">
                    {group.title}
                  </h3>
                  {!searching && (
                    <p className="mb-4 mt-1 text-sm text-muted">{group.description}</p>
                  )}
                  <div className={searching ? "mt-4" : undefined}>
                    <FaqList items={group.faqs} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {nothingMatched && (
          <NoMatches query={query.trim()} onClear={() => setQuery("")} noun="help topics" />
        )}

        {!searching && (
          <>
            <section id="contact" className="scroll-mt-24">
              <Card className="p-6 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Mail size={18} className="text-accent" aria-hidden />
                      <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                        Still stuck?
                      </h2>
                    </div>
                    <p className="mt-2 max-w-prose leading-relaxed text-muted">
                      Email us about anything this page does not cover — a claim that needs a
                      second look, a listing at the wrong airport, a review that breaks the terms,
                      or a school that should not be in the directory at all.
                    </p>
                  </div>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="shrink-0 font-semibold text-accent-ink hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </Card>
            </section>

            <section className="flex flex-col items-start gap-3 sm:flex-row">
              <Button href="/search" size="lg">
                Find a flight school
              </Button>
              <Button href="/schools/add" variant="secondary" size="lg">
                Add your school
              </Button>
            </section>
          </>
        )}
      </Container>
    </div>
  );
}

function PathCard({
  id,
  icon: Icon,
  eyebrow,
  title,
  lead,
  points,
  guides,
  cta,
}: {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
  guides: HelpGuide[];
  cta: { label: string; href: string };
}) {
  return (
    <Card id={id} className="scroll-mt-24 p-6 md:p-8">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
        <Icon size={20} aria-hidden />
      </span>
      <Eyebrow accent className="mb-2">
        {eyebrow}
      </Eyebrow>
      <h2 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
        {title}
      </h2>
      <p className="mt-2 leading-relaxed text-muted">{lead}</p>
      <ul className="mt-5 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex gap-2.5 leading-relaxed text-muted">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 border-t border-line pt-5">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-muted">Guides</p>
        <ul className="space-y-1.5">
          {guides.map((guide) => (
            <li key={guide.id}>
              <Link
                href={`#${guide.id}`}
                className="text-sm font-medium text-ink underline-offset-4 hover:text-accent-ink hover:underline"
              >
                {guide.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Button href={cta.href} variant="secondary" size="sm" className="mt-6">
        {cta.label}
      </Button>
    </Card>
  );
}

function GuideBlock({ guide }: { guide: HelpGuide }) {
  const Icon = GUIDE_ICONS[guide.id] ?? BookOpen;
  return (
    <section id={guide.id} className="scroll-mt-24">
      <Card className="p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
            <Icon size={20} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
                {guide.title}
              </h3>
              <Badge tone="neutral">{audienceLabel(guide.audience)}</Badge>
            </div>
            <p className="mt-2 max-w-prose leading-relaxed text-muted">{guide.summary}</p>

            <ol className="mt-6 space-y-3.5">
              {guide.steps.map((step, i) => (
                <li key={step} className="flex gap-3.5">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-xs font-semibold text-ink"
                  >
                    {i + 1}
                  </span>
                  <span className="max-w-prose leading-relaxed text-muted">{step}</span>
                </li>
              ))}
            </ol>

            {guide.notes && guide.notes.length > 0 && (
              <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                {guide.notes.map((note) => (
                  <li key={note} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                    <Info size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                    <span className="max-w-prose">{note}</span>
                  </li>
                ))}
              </ul>
            )}

            {guide.cta && (
              <Button href={guide.cta.href} variant="secondary" size="sm" className="mt-6">
                {guide.cta.label}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
