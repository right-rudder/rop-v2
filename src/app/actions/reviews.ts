"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewFormState = {
  error?: string;
  success?: boolean;
};

const RATING_KEYS = [
  "overall",
  "customerService",
  "instructors",
  "aircraft",
  "availability",
  "facilities",
] as const;

export async function submitReview(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to leave a review." };

  const ratings: Record<string, number> = {};
  for (const key of RATING_KEYS) {
    const value = Number(formData.get(key));
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return { error: "Please rate every category from 1 to 5 stars." };
    }
    ratings[key] = value;
  }

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) return { error: "Please write your review." };

  const { error } = await supabase.from("reviews").insert({
    school_id: formData.get("schoolId") as string,
    user_id: user.id,
    overall: ratings.overall,
    customer_service: ratings.customerService,
    instructors: ratings.instructors,
    aircraft: ratings.aircraft,
    availability: ratings.availability,
    facilities: ratings.facilities,
    body,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "You've already reviewed this school. Delete your review to write a new one.",
      };
    }
    return { error: error.message };
  }

  const path = formData.get("path") as string | null;
  if (path) revalidatePath(path);
  return { success: true };
}

export async function deleteReview(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to delete your review." };

  const reviewId = formData.get("reviewId") as string | null;
  if (!reviewId) return { error: "Missing review." };

  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id) // RLS "Owner delete" also enforces this
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Review not found, or it isn't yours to delete." };
  }

  const path = formData.get("path") as string | null;
  if (path) revalidatePath(path);
  return { success: true };
}

export async function submitComment(
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to comment." };

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) return { error: "Please write your comment." };

  const { error } = await supabase.from("comments").insert({
    review_id: formData.get("reviewId") as string,
    user_id: user.id,
    body,
  });

  if (error) return { error: error.message };

  const path = formData.get("path") as string | null;
  if (path) revalidatePath(path);
  return { success: true };
}
