# Admin Users page + GHL owner webhook — design

**Date:** 2026-09-17 · **Branch:** `feat/admin-users-owner-webhook` · **DB changes:** `20260917205107_add_ownership_events` (the invite page and webhook need none)

## Why

"Listing owner" is not a role — it is `flight_schools.managed_by` — and until now an admin could
only hand a listing to someone who had already signed up (`assignOwner`, by slug + account
email). There was no way to onboard a school contact from the admin side and no list of accounts
anywhere. Separately, approved owners never reached the CRM: the only GoHighLevel hops were
student leads (`GHL_WEBHOOK_URL`) and notification emails (`GHL_NOTIFY_WEBHOOK_URL`).

## Decisions

| Area | Choice |
|---|---|
| Account creation | Supabase invite email — `auth.admin.inviteUserByEmail`. The account exists (unconfirmed) from that moment, so ownership can be assigned before the first sign-in |
| Invite landing | `redirectTo = /auth/confirm?next=/update-password`; the **Invite user** email template must use the `token_hash` link with `type=invite` (see below) |
| Page | `/admin/users`: invite form with an optional listing picker + every account with status, badges, owned listings and **Resend invite** |
| Roles | Unchanged. No promote-to-admin; invite metadata carries name and phone only, never a role |
| Account list | `auth.admin.listUsers`, paged until a short page (`src/lib/user-directory.ts`). No SQL function, no migration |
| Listing picker | Client combobox over unowned listings from the catalog cache (`getUnownedListingOptions`); posts `schoolId`, which the action re-reads fresh |
| Ownership write | `grantOwnership()` in `src/lib/ownership.ts`, on the **admin's session** — RLS and `protect_flight_school_columns` stay the boundary. Not in a `"use server"` file: it has no admin check of its own |
| CRM hop | New `GHL_OWNER_WEBHOOK_URL`, separate from leads and notification mail. Pure payload builder `src/lib/owner-webhook.ts`, sender `sendOwnerWebhook()` in `src/lib/notify.ts` |
| Notification | Reuses `listing_assigned` (no new type → no CHECK migration). Invitees get the in-app row only |

## When the owner webhook fires

Every path where an admin makes someone an owner, after the last database write has succeeded:

| Path | Action | `owner_source` | Role / work email from |
|---|---|---|---|
| Claim approved | `approveClaim` | `claim_approved` | the claim |
| Listing assigned | `assignOwner`, or `inviteUser` for an address that already has a confirmed account | `admin_assigned` | — (invite form's role, if given) |
| Owner invited | `inviteUser` with a listing | `admin_invited`, `account_status: invited` | the invite form |
| Submission approved | `approveSubmission` | `submission_approved` | the submission contact matching the submitter (`matchSubmitterContact`: account email, else full name) |

Name comes from the path's own data, else the profile, else auth metadata; email is always the
account email; phone is auth metadata, else the matched contact. Unknown fields are empty strings.
The full field list is in `supabase/README.md`.

Same delivery contract as the other two hops: `AbortSignal.timeout(8_000)`, errors logged under
`[owner-webhook]`, never thrown — an approval is never reported as failed over the CRM. It is
awaited inline, in `Promise.all` with `notifyUser`, rather than deferred with `after()`: `after`
depends on the platform's `waitUntil`, and a silently dropped contact is worse than a slower
response on a rare admin click.

## Invite semantics

1. Validate (`validateInvite`), then — if a listing was picked — load it fresh and refuse if it
   is gone or owned. Everything refusable is refused **before** the email: an invite cannot be unsent.
2. `user_id_by_email`:
   - no account → invite;
   - account never confirmed → invite again (re-issues the link);
   - confirmed account + listing → no email, plain assignment, message says so;
   - confirmed account, no listing → error.
3. `grantOwnership`. If it fails after the invite went out, the error says the invite was sent
   and to submit again with the same email — which lands in the "never confirmed" branch.
4. `notifyUser(listing_assigned, email: false for invitees)` + `sendOwnerWebhook`.

Status per account (`inviteStatus`): `invited` (has `invited_at`, not confirmed) · `accepted` ·
`unconfirmed` (self-signup, not confirmed) · `active`. Resend is only offered for `invited` and
calls `inviteUserByEmail` again — `auth.resend()` only supports `signup` and `email_change`.

## The Invite email template is required

`inviteUserByEmail` is not PKCE. With Supabase's default `{{ .ConfirmationURL }}` the session
comes back in the URL fragment, which `src/app/auth/confirm/route.ts` — a server route — never
sees, so the invitee lands on `/login?error=confirm-failed`. The template must be:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/update-password
```

The route's existing `verifyOtp` branch handles `type=invite` unchanged.

## Also fixed

`assignOwner` updated with `.is("managed_by", null)` but never checked that a row matched, so
losing a race to another admin reported success. It now goes through `grantOwnership`, which
selects the updated row and reports the conflict.

## Ownership forms on `/admin/claims`

Assign and Revoke no longer take a pasted slug. Both use the shared `src/app/admin/ListingPicker.tsx`
— Assign over unowned listings, Revoke over owned ones (searchable by owner name too) — and
submit `schoolId`. Both open `src/components/TypedConfirmDialog.tsx`, a native `<dialog>` that
spells out who gains or loses which listing and stays disabled until the admin types `ASSIGN` /
`REVOKE`. The word is submitted as `confirm` and checked again in the action (`confirmsWith`,
`OWNERSHIP_CONFIRM` in `src/lib/claims.ts`), so a request that skipped the dialog is refused.

## Ownership audit trail

`public.ownership_events` (`kind` granted | revoked, `school_id` + `school_name` snapshot,
`user_id`, `actor_id`, `created_at`) records every change of `flight_schools.managed_by`.

- **Written by a trigger, not the app** — `log_ownership_change()` (SECURITY DEFINER, empty
  `search_path`) on `after insert` / `after update of managed_by`, each with a `WHEN` clause so the
  catalog import's upserts never enter the function. The row lands in the same transaction as the
  ownership change on every path — claim approval, submission approval, assign, invite, revoke, a
  hand edit in the SQL editor — so it cannot be skipped the way the best-effort notification can.
  `actor_id` is `auth.uid()`: the admin, or null outside a user session.
- **Read-only to the API** — RLS `Admin read`; `authenticated` holds `select` only, `anon` nothing.
- **`user_id` / `actor_id` are not foreign keys.** Deleting an account nulls its `managed_by`
  (FK `on delete set null`), which fires the trigger mid-delete; a reference to the row being
  deleted would fail and block the deletion.
- **Backfill** — the three ownership notifications that existed were copied in (actor known only
  for claim approvals, via `school_claims.decided_by`; null otherwise).

`/admin/claims` → **Recent activity** merges these with decided claims, newest first
(`loadOwnershipEvents` in `src/lib/ownership.ts`, on the admin's session). A grant that an approved
claim already shows is dropped by `isClaimGrant` (same listing + person, decided within 10 minutes)
so it is not listed twice.

## Security

Every action and the page re-check `isAdmin`. `listAuthUsers()` checks again itself, because it
returns every account's email. The service role is used only for `user_id_by_email` and
`auth.admin.*`; it never writes `managed_by`.

## Tests

`scripts/tests/owner-webhook.test.ts` (payload shape, sources, blanks, contact matching),
`scripts/tests/admin-users.test.ts` (validation, status, sort), `scripts/tests/claims.test.ts`
(confirm word, claim-grant de-duplication) and the updated
`scripts/tests/admin-nav.test.ts`. Actions, the picker and the invite round-trip are verified
manually — see the checklist in `supabase/README.md` § Verify.
