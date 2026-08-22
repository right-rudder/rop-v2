import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import {
  getRecentReviews,
  getRecentComments,
  getReviewsByIds,
  getUsersByIds,
  getSchoolsByIds,
} from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import type { FlightSchool, User } from "@/lib/types";
import { AdminPage, AdminSection, AdminEmpty } from "../AdminShell";
import { ModerationCard } from "./ModerationCard";

export const metadata: Metadata = {
  title: "Moderation – Admin",
  robots: { index: false },
};

const RECENT_LIMIT = 50;

export default async function AdminModerationPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/admin/moderation");
  if (!isAdmin(viewer)) notFound();

  const [reviews, comments] = await Promise.all([
    getRecentReviews(RECENT_LIMIT),
    getRecentComments(RECENT_LIMIT),
  ]);
  // Comments hang off reviews that may not be in the recent list — fetch their parents.
  const parentReviews = await getReviewsByIds(comments.map((c) => c.reviewId));
  const parents = Object.values(parentReviews);
  const [usersById, schoolsById] = await Promise.all([
    getUsersByIds([
      ...reviews.map((r) => r.userId),
      ...comments.map((c) => c.userId),
      ...parents.map((r) => r.userId),
    ]),
    getSchoolsByIds([...reviews.map((r) => r.schoolId), ...parents.map((r) => r.schoolId)]),
  ]);

  const authorOf = (userId: string) => {
    const user: User | undefined = usersById[userId];
    return {
      name: user ? `${user.firstName} ${user.lastName}` : "Anonymous",
      href: `/profile/${userId}`,
    };
  };
  const schoolOf = (schoolId: string | undefined) => {
    const school: FlightSchool | undefined = schoolId ? schoolsById[schoolId] : undefined;
    return school
      ? { name: school.name, href: schoolHref(school), airportCode: school.primaryAirportCode }
      : null;
  };

  return (
    <AdminPage
      eyebrow={`${reviews.length} recent ${reviews.length === 1 ? "review" : "reviews"}`}
      title="Moderation"
      description="Newest reviews and comments across every school. Deleting is permanent and recomputes the school's rating."
    >
      <AdminSection title="Reviews" count={reviews.length}>
        {reviews.length === 0 ? (
          <AdminEmpty>No reviews yet.</AdminEmpty>
        ) : (
          <div className="space-y-5">
            {reviews.map((review) => (
              <ModerationCard
                key={review.id}
                kind="review"
                id={review.id}
                author={authorOf(review.userId)}
                school={schoolOf(review.schoolId)}
                createdAt={review.createdAt}
                rating={review.overall}
                body={review.body}
              />
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection title="Comments" count={comments.length}>
        {comments.length === 0 ? (
          <AdminEmpty>No comments yet.</AdminEmpty>
        ) : (
          <div className="space-y-5">
            {comments.map((comment) => {
              const parent = parentReviews[comment.reviewId];
              return (
                <ModerationCard
                  key={comment.id}
                  kind="comment"
                  id={comment.id}
                  author={authorOf(comment.userId)}
                  school={schoolOf(parent?.schoolId)}
                  createdAt={comment.createdAt}
                  body={comment.body}
                  context={
                    parent ? `on ${authorOf(parent.userId).name}'s review` : "on a deleted review"
                  }
                />
              );
            })}
          </div>
        )}
      </AdminSection>
    </AdminPage>
  );
}
