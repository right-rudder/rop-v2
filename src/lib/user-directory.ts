/**
 * The account list behind /admin/users. Server-only.
 *
 * auth.users is not on the Data API, so this is one of the few places that
 * needs the service role — and it returns every account's email. It therefore
 * checks for an admin itself instead of trusting its caller.
 */
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getUsersByIds, loadManagedSchools } from "@/lib/data";
import { inviteStatus, sortAdminUsers, type InviteStatus } from "@/lib/admin-users";

export type AdminUserRow = {
  id: string;
  email: string;
  /** From the profile; from the signup/invite metadata when there is none */
  name: string;
  phone: string;
  status: InviteStatus;
  isAdmin: boolean;
  /**
   * false when auth.users has no matching profiles row — such an account can
   * still own listings, but has no profile page and shows no name on reviews.
   */
  hasProfile: boolean;
  createdAt: string;
  lastSignInAt?: string;
  listings: { id: string; name: string; href: string }[];
};

const PER_PAGE = 200;
// 5,000 accounts. Past that this page wants search and paging, not a longer loop.
const MAX_PAGES = 25;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Every account, pending invites first. Throws when the service key is missing. */
export async function listAuthUsers(): Promise<AdminUserRow[]> {
  if (!isAdmin(await getCurrentUser())) throw new Error("Admin access required.");

  const service = createServiceClient();
  const authUsers = [];
  // Stop on a short page rather than on the response's nextPage, which is
  // parsed from the Link header and cannot be relied on for long lists.
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw new Error(`Could not list users: ${error.message}`);
    authUsers.push(...data.users);
    if (data.users.length < PER_PAGE) break;
  }

  const [profiles, managed] = await Promise.all([
    getUsersByIds(authUsers.map((u) => u.id)),
    loadManagedSchools(),
  ]);
  const listingsByOwner = new Map<string, AdminUserRow["listings"]>();
  for (const { managedBy, id, name, href } of managed) {
    listingsByOwner.set(managedBy, [...(listingsByOwner.get(managedBy) ?? []), { id, name, href }]);
  }

  return sortAdminUsers(
    authUsers.map((u): AdminUserRow => {
      const profile = profiles[u.id];
      const meta = u.user_metadata ?? {};
      const name = profile
        ? `${profile.firstName} ${profile.lastName}`
        : `${text(meta.first_name)} ${text(meta.last_name)}`;
      return {
        id: u.id,
        email: u.email ?? "",
        name: name.trim(),
        phone: text(meta.phone),
        status: inviteStatus(u),
        isAdmin: profile?.role === "admin",
        hasProfile: Boolean(profile),
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? undefined,
        listings: listingsByOwner.get(u.id) ?? [],
      };
    }),
  );
}
