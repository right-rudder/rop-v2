import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSchoolClaims, getSchoolsByIds, getUsersByIds } from "@/lib/data";
import { domainsMatch } from "@/lib/claims";
import { schoolHref } from "@/lib/utils";
import { ClaimCard } from "./ClaimCard";
import { AssignOwnerForm, RevokeOwnerForm } from "./OwnershipForms";
import { AdminPage, AdminSection, AdminEmpty } from "../AdminShell";

export const metadata: Metadata = {
  title: "Listing Claims – Admin",
  robots: { index: false },
};

export default async function AdminClaimsPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/admin/claims");
  if (!isAdmin(viewer)) notFound();

  const claims = await getSchoolClaims();
  const [schoolsById, usersById] = await Promise.all([
    getSchoolsByIds(claims.map((c) => c.schoolId)),
    getUsersByIds(claims.map((c) => c.userId)),
  ]);

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
          <AssignOwnerForm />
          <RevokeOwnerForm />
        </div>
      </AdminSection>

      {processed.length > 0 && (
        <AdminSection title="Recently decided">
          <div className="space-y-5">{processed.map(cardFor)}</div>
        </AdminSection>
      )}
    </AdminPage>
  );
}
