import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import {
  getPendingSuggestions,
  getRecentDecidedSuggestions,
  getSchoolsByIds,
  getUsersByIds,
} from "@/lib/data";
import { currentValueFor, formatSuggestionValue, suggestionValuesEqual } from "@/lib/suggestions";
import { schoolHref } from "@/lib/utils";
import { SuggestionCard } from "./SuggestionCard";
import { AdminPage, AdminSection, AdminEmpty } from "../AdminShell";

export const metadata: Metadata = {
  title: "Listing Suggestions – Admin",
  robots: { index: false },
};

const RECENT_LIMIT = 50;

export default async function AdminSuggestionsPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/admin/suggestions");
  if (!isAdmin(viewer)) notFound();

  // Approved rows are kept forever, so only a window of decisions is loaded.
  const [pending, processed] = await Promise.all([
    getPendingSuggestions(),
    getRecentDecidedSuggestions(RECENT_LIMIT),
  ]);
  const suggestions = [...pending, ...processed];
  const [schoolsById, usersById] = await Promise.all([
    getSchoolsByIds(suggestions.flatMap((s) => (s.schoolId ? [s.schoolId] : []))),
    getUsersByIds(suggestions.map((s) => s.userId)),
  ]);

  const cardFor = (suggestion: (typeof suggestions)[number]) => {
    const school = suggestion.schoolId ? schoolsById[suggestion.schoolId] : undefined;
    const user = usersById[suggestion.userId];
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
    // The listing is the authority on what it shows now; the suggestion only
    // remembers what it showed when filed. A difference is worth a look.
    const live = school ? currentValueFor(school, suggestion.field) : undefined;
    const stale = live !== undefined && !suggestionValuesEqual(suggestion.currentValue, live);
    return (
      <SuggestionCard
        key={suggestion.id}
        suggestion={suggestion}
        schoolName={school?.name ?? suggestion.schoolName}
        schoolHref={school ? schoolHref(school) : undefined}
        listingGone={!school}
        suggesterName={name || "Unnamed account"}
        liveValue={stale ? formatSuggestionValue(suggestion.field, live) : undefined}
      />
    );
  };

  return (
    <AdminPage
      eyebrow={`${pending.length} pending ${pending.length === 1 ? "suggestion" : "suggestions"}`}
      title="Listing suggestions"
      description="Approving a suggestion writes the value to the listing and tells the member. You can edit the value first."
    >
      <AdminSection title="Pending review">
        {pending.length === 0 ? (
          <AdminEmpty>No pending suggestions — all caught up.</AdminEmpty>
        ) : (
          <div className="space-y-5">{pending.map(cardFor)}</div>
        )}
      </AdminSection>

      {processed.length > 0 && (
        <AdminSection title="Recent decisions">
          <div className="space-y-5">{processed.map(cardFor)}</div>
        </AdminSection>
      )}
    </AdminPage>
  );
}
