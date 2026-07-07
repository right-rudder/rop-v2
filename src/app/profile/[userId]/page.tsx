import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, MessageSquare, User as UserIcon, ShieldCheck, BookOpen, PlaneTakeoff } from "lucide-react";
import {
  getUserById,
  getReviewsByUser,
  getCommentsByUser,
  getSchoolsManagedByUser,
  getSchoolBySlug,
  getCityBySlug,
  getStateBySlug,
  getProgramBySlug,
  reviews as allReviews,
  users,
} from "@/lib/mock-data";
import { schoolHref } from "@/lib/utils";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const user = getUserById(userId);
  if (!user) return { title: "User Not Found" };
  return {
    title: `${user.firstName} ${user.lastName} – Flight School Finder`,
    description: user.bio ?? `${user.firstName} ${user.lastName}'s profile on Flight School Finder.`,
    robots: { index: false },
  };
}

export function generateStaticParams() {
  return users.map((u) => ({ userId: u.id }));
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  const user = getUserById(userId);
  if (!user) notFound();

  const reviews = getReviewsByUser(userId);
  const userComments = getCommentsByUser(userId);
  const managedSchools = getSchoolsManagedByUser(userId);
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const joinedYear = new Date(user.joinedAt).getFullYear();

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-blue-700 flex items-center justify-center text-2xl font-extrabold shrink-0">
            {initials}
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
              <h1 className="text-3xl font-extrabold">
                {user.firstName} {user.lastName}
              </h1>
              {user.role === "admin" && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-rose-700 px-2 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-blue-300 text-sm mb-3">Member since {joinedYear}</p>

            {/* Pilot certificates — labels come from the programs catalog */}
            {user.pilotCertificates && user.pilotCertificates.length > 0 && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {user.pilotCertificates.map((slug) => {
                  const program = getProgramBySlug(slug);
                  return (
                    <span
                      key={slug}
                      className="text-xs font-semibold bg-blue-800 border border-blue-600 px-2 py-1 rounded-full"
                    >
                      {program?.shortName ?? slug}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-12">
        {/* Bio */}
        {user.bio && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-700" />
              About
            </h2>
            <p className="text-slate-600 dark:text-slate-300">{user.bio}</p>
          </section>
        )}

        {/* Reviews */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-700" />
            Reviews Written
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({reviews.length})
            </span>
          </h2>

          {reviews.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const school = getSchoolBySlug(review.schoolId);
                const city = school ? getCityBySlug(school.citySlug) : null;
                const state = school ? getStateBySlug(school.stateSlug) : null;
                const href = school ? schoolHref(school) : null;

                return (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        {href && school ? (
                          <Link
                            href={href}
                            className="font-semibold text-slate-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 transition"
                          >
                            {school.name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {review.schoolId}
                          </span>
                        )}
                        {city && state && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {city.name}, {state.abbreviation}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.overall
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Subcategory scores */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-3 py-2.5 border-y border-slate-100 dark:border-slate-800">
                      {(["customerService", "instructors", "aircraft", "availability", "facilities"] as const).map((key) => {
                        const labels: Record<string, string> = {
                          customerService: "Customer Service",
                          instructors: "Instructors",
                          aircraft: "Aircraft",
                          availability: "Availability",
                          facilities: "Facilities",
                        };
                        return (
                          <div key={key} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{labels[key]}</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  className={i < review[key] ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">{review.body}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Comments */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-700" />
            Comments
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({userComments.length})
            </span>
          </h2>

          {userComments.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {userComments.map((comment) => {
                const review = allReviews.find((r) => r.id === comment.reviewId);
                const school = review ? getSchoolBySlug(review.schoolId) : null;
                const href = school ? schoolHref(school) : null;
                return (
                  <div
                    key={comment.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-1.5">
                      <div>
                        {href && school ? (
                          <Link
                            href={href}
                            className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 transition"
                          >
                            {school.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            Review
                          </span>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Comment on a review
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        {new Date(comment.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{comment.body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Managed Schools */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PlaneTakeoff className="w-5 h-5 text-blue-700" />
            Schools Managed
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({managedSchools.length})
            </span>
          </h2>

          {managedSchools.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No managed schools.</p>
          ) : (
            <div className="space-y-3">
              {managedSchools.map((school) => {
                const city = getCityBySlug(school.citySlug);
                const state = getStateBySlug(school.stateSlug);
                return (
                  <div
                    key={school.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <Link
                        href={schoolHref(school)}
                        className="font-semibold text-slate-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 transition"
                      >
                        {school.name}
                      </Link>
                      {city && state && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {city.name}, {state.abbreviation} · {school.primaryAirportCode}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/schools/${school.slug}/edit`}
                      className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline shrink-0"
                    >
                      Edit
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
