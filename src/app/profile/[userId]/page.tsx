import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, ShieldCheck } from "lucide-react";
import {
  getUserById,
  getReviewsByUser,
  getCommentsByUser,
  getSchoolsManagedByUser,
  getSchoolsByIds,
  getReviewsByIds,
  getPrograms,
  getLocationMaps,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { schoolHref } from "@/lib/utils";
import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { Stars } from "@/components/ui/Stars";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) return { title: "User Not Found" };
  return {
    title: `${user.firstName} ${user.lastName}`,
    description: user.bio ?? `${user.firstName} ${user.lastName}'s profile on Flight School Finder.`,
    robots: { index: false },
  };
}

const SUB_LABELS = {
  customerService: "Customer service",
  instructors: "Instructors",
  aircraft: "Aircraft",
  availability: "Availability",
  facilities: "Facilities",
} as const;

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="mb-4 flex items-baseline gap-3 font-display text-2xl font-bold tracking-tight text-ink">
      {title}
      <span className="font-mono text-sm font-normal text-muted">{count}</span>
    </h2>
  );
}

const dateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) notFound();

  const [viewer, reviews, userComments, managedSchools, allPrograms, locationMaps] =
    await Promise.all([
      getCurrentUser(),
      getReviewsByUser(userId),
      getCommentsByUser(userId),
      getSchoolsManagedByUser(userId),
      getPrograms(),
      getLocationMaps(),
    ]);
  const isOwner = viewer?.id === user.id;
  const { cityNameBySlug, stateBySlug } = locationMaps;
  const programShortNames = Object.fromEntries(
    allPrograms.map((p) => [p.slug, p.shortName]),
  );

  // Resolve the schools behind this user's reviews and comments
  const commentedReviews = await getReviewsByIds(
    userComments.map((c) => c.reviewId),
  );
  const schoolsById = await getSchoolsByIds([
    ...reviews.map((r) => r.schoolId),
    ...Object.values(commentedReviews).map((r) => r.schoolId),
  ]);

  const initials = `${(user.firstName[0] ?? "?")}${user.lastName[0] ?? ""}`.toUpperCase();
  const joinedYear = new Date(user.joinedAt).getFullYear();

  return (
    <div className="pb-20">
      <PageHero
        size="default"
        leading={
          <div
            aria-hidden
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft font-display text-2xl font-bold text-accent-ink md:h-20 md:w-20 md:text-3xl"
          >
            {initials}
          </div>
        }
        eyebrow={
          <>
            Member since {joinedYear}
            {user.role === "admin" && (
              <Badge tone="accent">
                <ShieldCheck size={11} />
                Admin
              </Badge>
            )}
          </>
        }
        title={`${user.firstName} ${user.lastName}`}
        description={user.bio}
        aside={
          isOwner ? (
            <Button href={`/profile/${user.id}/edit`} variant="secondary" size="sm">
              <Pencil size={14} />
              Edit profile
            </Button>
          ) : undefined
        }
        meta={
          user.pilotCertificates && user.pilotCertificates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.pilotCertificates.map((slug) => (
                <Chip key={slug} href={`/programs/${slug}`} className="py-1 text-xs">
                  {programShortNames[slug] ?? slug}
                </Chip>
              ))}
            </div>
          ) : undefined
        }
      />

      <Container size="default" className="space-y-14 py-12">
        {/* Reviews */}
        <section>
          <SectionHeading title="Reviews written" count={reviews.length} />
          {reviews.length === 0 ? (
            <p className="text-sm text-muted">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const school = schoolsById[review.schoolId];
                const city = school ? (cityNameBySlug[school.citySlug] ?? school.citySlug) : null;
                const state = school ? stateBySlug[school.stateSlug] : null;
                const href = school ? schoolHref(school) : null;

                return (
                  <Card key={review.id} className="p-5 md:p-6">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        {href && school ? (
                          <Link
                            href={href}
                            className="font-display text-lg font-bold tracking-tight text-ink transition-colors hover:text-accent-ink"
                          >
                            {school.name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-ink">{review.schoolId}</span>
                        )}
                        {city && state && (
                          <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                            {school && <span className="text-sky">{school.primaryAirportCode} · </span>}
                            {city}, {state.abbreviation}
                          </p>
                        )}
                      </div>
                      <Stars value={review.overall} size={14} className="shrink-0" />
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 border-y border-line py-3 sm:grid-cols-3">
                      {(Object.keys(SUB_LABELS) as Array<keyof typeof SUB_LABELS>).map((key) => (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted">{SUB_LABELS[key]}</span>
                          <Stars value={review[key]} size={11} showValue={false} />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-ink/90">{review.body}</p>
                    <p className="mt-3 font-mono text-xs text-muted">{dateLong(review.createdAt)}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Comments */}
        <section>
          <SectionHeading title="Comments" count={userComments.length} />
          {userComments.length === 0 ? (
            <p className="text-sm text-muted">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {userComments.map((comment) => {
                const review = commentedReviews[comment.reviewId];
                const school = review ? schoolsById[review.schoolId] : null;
                const href = school ? schoolHref(school) : null;
                return (
                  <Card key={comment.id} className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div>
                        {href && school ? (
                          <Link
                            href={href}
                            className="text-sm font-semibold text-ink transition-colors hover:text-accent-ink"
                          >
                            {school.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-ink">Review</span>
                        )}
                        <p className="mt-0.5 text-xs text-muted">Comment on a review</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted">
                        {dateShort(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-ink/90">{comment.body}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Managed Schools */}
        <section>
          <SectionHeading title="Schools managed" count={managedSchools.length} />
          {managedSchools.length === 0 ? (
            <p className="text-sm text-muted">No managed schools.</p>
          ) : (
            <div className="space-y-3">
              {managedSchools.map((school) => {
                const city = cityNameBySlug[school.citySlug];
                const state = stateBySlug[school.stateSlug];
                return (
                  <Card key={school.id} className="flex items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <Link
                        href={schoolHref(school)}
                        className="font-display text-lg font-bold tracking-tight text-ink transition-colors hover:text-accent-ink"
                      >
                        {school.name}
                      </Link>
                      {city && state && (
                        <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                          <span className="text-sky">{school.primaryAirportCode}</span> · {city},{" "}
                          {state.abbreviation}
                        </p>
                      )}
                    </div>
                    <Button href={`/schools/${school.slug}/edit`} variant="secondary" size="sm">
                      Edit listing
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </Container>
    </div>
  );
}
