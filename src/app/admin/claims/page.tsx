import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import {
  getSchoolClaims,
  getSchoolsByIds,
  getUsersByIds,
  getUnownedListingOptions,
  loadManagedSchools,
  type ListingOption,
} from "@/lib/data";
import { domainsMatch, isClaimGrant } from "@/lib/claims";
import { loadOwnershipEvents } from "@/lib/ownership";
import { schoolHref } from "@/lib/utils";
import { ClaimCard } from "./ClaimCard";
import { AssignOwnerForm, RevokeOwnerForm } from "./OwnershipForms";
import { OwnershipEventCard } from "./OwnershipEventCard";
import { AdminPage, AdminSection, AdminEmpty } from "../AdminShell";

export const metadata: Metadata = {
  title: "Listing Claims – Admin",
  robots: { index: false },
};

export default async function AdminClaimsPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/admin/claims");
  if (!isAdmin(viewer)) notFound();

  const [claims, unowned, managed, events] = await Promise.all([
    getSchoolClaims(),
    getUnownedListingOptions(),
    loadManagedSchools(),
    // The timeline is a record, not a control — it must not take the page down
    loadOwnershipEvents().catch((e) => {
      console.error("[admin/claims]", e instanceof Error ? e.message : e);
      return [];
    }),
  ]);
  const [schoolsById, usersById] = await Promise.all([
    getSchoolsByIds([
      ...claims.map((c) => c.schoolId),
      ...events.flatMap((e) => (e.schoolId ? [e.schoolId] : [])),
    ]),
    getUsersByIds([
      ...claims.map((c) => c.userId),
      ...managed.map((m) => m.managedBy),
      ...events.flatMap((e) => (e.actorId ? [e.userId, e.actorId] : [e.userId])),
    ]),
  ]);

  // The revoke picker names each listing's owner, so the confirmation can say
  // whose access is about to go. An owner without a profiles row has no name.
  const owned: ListingOption[] = managed.map((m) => {
    const owner = usersById[m.managedBy];
    return {
      id: m.id,
      name: m.name,
      location: m.location,
      airport: m.airport,
      owner: owner ? `${owner.firstName} ${owner.lastName}`.trim() : undefined,
    };
  });

  const pending = claims.filter((c) => c.status === "pending");
  const processed = claims.filter((c) => c.status !== "pending");

  const cardFor = (claim: (typeof claims)[number]) => {
    const school = schoolsById[claim.schoolId];
    const user = usersById[claim.userId];
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
    return (
      <ClaimCard
        key={claim.id}
        claim={claim}
        schoolName={school?.name ?? claim.schoolId}
        schoolHref={school ? schoolHref(school) : "#"}
        claimantName={name || "Unnamed account"}
        // The listing is the authority on both facts; a claim only records
        // what the person typed.
        domainMatches={domainsMatch(claim.workEmail, school?.website ?? "")}
        alreadyOwned={Boolean(school?.managedBy)}
      />
    );
  };

  const nameOf = (userId: string | undefined) => {
    const user = userId ? usersById[userId] : undefined;
    return user ? `${user.firstName} ${user.lastName}`.trim() || undefined : undefined;
  };

  // One timeline, newest first: claim decisions by when they were decided,
  // beside every other ownership change — assignments, invited owners, approved
  // submissions, revocations. A grant that an approved claim already shows is
  // left out rather than listed twice.
  const timeline = [
    ...processed.map((claim) => ({ at: claim.decidedAt ?? claim.createdAt, node: cardFor(claim) })),
    ...events.filter((event) => !isClaimGrant(event, claims)).map((event) => {
      const school = event.schoolId ? schoolsById[event.schoolId] : undefined;
      return {
        at: event.at,
        node: (
          <OwnershipEventCard
            key={event.id}
            kind={event.kind}
            at={event.at}
            schoolName={school?.name ?? event.schoolName}
            schoolHref={school ? schoolHref(school) : undefined}
            userId={event.userId}
            userName={nameOf(event.userId)}
            actorName={nameOf(event.actorId)}
          />
        ),
      };
    }),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <AdminPage
      eyebrow={`${pending.length} pending ${pending.length === 1 ? "claim" : "claims"}`}
      title="Listing claims"
      description="Approving a claim hands the listing to the claimant and declines any other claims on it."
    >
      <AdminSection title="Pending review">
        {pending.length === 0 ? (
          <AdminEmpty>No pending claims — all caught up.</AdminEmpty>
        ) : (
          <div className="space-y-5">{pending.map(cardFor)}</div>
        )}
      </AdminSection>

      <AdminSection title="Ownership">
        <div className="space-y-5">
          <AssignOwnerForm listings={unowned} />
          <RevokeOwnerForm listings={owned} />
        </div>
      </AdminSection>

      {timeline.length > 0 && (
        <AdminSection title="Recent activity">
          <div className="space-y-5">{timeline.map((entry) => entry.node)}</div>
        </AdminSection>
      )}
    </AdminPage>
  );
}
