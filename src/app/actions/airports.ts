"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export type AirportFormState = {
  error?: string;
};

export async function updateAirport(
  _prevState: AirportFormState,
  formData: FormData,
): Promise<AirportFormState> {
  const viewer = await getCurrentUser();
  if (!isAdmin(viewer)) return { error: "Admin access required." };

  const airportId = formData.get("airportId") as string;
  const field = (key: string) =>
    ((formData.get(key) as string | null) ?? "").trim();

  const name = field("name");
  if (!name) return { error: "Please enter the airport name." };

  const iata = field("iata").toUpperCase();
  if (iata && !/^[A-Z0-9]{3}$/.test(iata)) {
    return { error: "IATA code must be 3 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("airports")
    .update({
      name,
      iata: iata || null,
      faa_lid: field("faaLid").toUpperCase() || null,
      description: field("description") || null,
    })
    .eq("id", airportId)
    .select("icao")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Airport not found (or update was blocked)." };

  const href = `/airports/${data.icao.toLowerCase()}`;
  revalidatePath(href);
  revalidatePath(`${href}/edit`);
  // Land on the airport page so the editor sees the saved result in place.
  redirect(href);
}
