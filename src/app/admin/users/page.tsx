import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getUnownedListingOptions } from "@/lib/data";
import { listAuthUsers, type AdminUserRow } from "@/lib/user-directory";
import { Notice } from "@/components/ui/Notice";
import { InviteUserForm } from "./InviteUserForm";
import { UserRow } from "./UserRow";
import { AdminPage, AdminSection, AdminEmpty } from "../AdminShell";

export const metadata: Metadata = {
  title: "Users – Admin",
  robots: { index: false },
};

export default async function AdminUsersPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/admin/users");
  if (!isAdmin(viewer)) notFound();

  // The account list needs the service role; without it the page still
  // renders, and says why the list is missing, rather than erroring out.
  const [listings, users] = await Promise.all([
    getUnownedListingOptions(),
    listAuthUsers().catch((e): null => {
      console.error("[admin/users]", e instanceof Error ? e.message : e);
      return null;
    }),
  ]);

  const pending = users?.filter((u: AdminUserRow) => u.status === "invited").length ?? 0;

  return (
    <AdminPage
      eyebrow={`${pending} pending ${pending === 1 ? "invite" : "invites"}`}
      title="Users"
      description="Invite someone by email and, if they run a school, hand them its listing in the same step. Owners are ordinary accounts that manage a listing — not a separate role."
    >
      <AdminSection title="Invite a user">
        <InviteUserForm listings={listings} />
      </AdminSection>

      <AdminSection title="Accounts" count={users?.length}>
        {users === null ? (
          <Notice tone="error">
            The account list isn’t available — SUPABASE_SERVICE_ROLE_KEY is missing or was rejected
            on this server.
          </Notice>
        ) : users.length === 0 ? (
          <AdminEmpty>No accounts yet.</AdminEmpty>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </div>
        )}
      </AdminSection>
    </AdminPage>
  );
}
