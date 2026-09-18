# Listing suggestions — design

**Date:** 2026-09-17 · **Branch:** `feat/listing-suggestions` · **DB changes:** `add_school_suggestions` (new table, count function, wider `notifications.type` CHECK)

## Why

Listings carry contact facts — phone, website, address, hours, key contacts — that go stale.
Until now only the listing's owner (`flight_schools.managed_by`) or an admin could fix them, and
the owner edit form does not even expose address or hours. Most listings are unowned, so a wrong
phone number sat there until someone emailed us.

This feature lets any signed-in member propose a correction to one of those five fields. Every
suggestion lands in a new admin queue at `/admin/suggestions`. Approving it writes the value to the
listing in the same click. The member is told the outcome through the same channel as claims
(in-app notification plus email). Approved suggestions stay in the table forever, so a later
gamification pass can count, rank and badge contributors; for now the public profile shows
"N approved corrections".

## Decisions

| Area | Choice | Why |
|---|---|---|
| Who may suggest | Signed-in members who are neither the listing's manager nor an admin. Guests get a sign-in link; managers and admins are pointed at the edit form | Every approved suggestion is attributable to an account, and the people who can already edit have no reason to queue a change |
| Fields | `phone`, `website`, `address`, `hours`, `contacts` — one field per suggestion | The contact and location facts the listing already stores. Address and hours have no owner UI today, so this is their only correction path |
| Reason | Required, from a fixed list: out of date, wrong information, doesn't work, missing, moved or rebranded, typo or formatting, other. "Other" requires the details box | One-glance triage for admins and a category a gamification pass can weight later |
| Table | `public.school_suggestions`, same family as `school_claims` | Pending / approved / rejected with `decided_by` / `decided_at`; one pending row per user, listing and field (partial unique index) |
| Value storage | `jsonb` for `proposed_value`, `current_value` and `applied_value` — a JSON string for the four text fields, an array of `{name,title,phone,email}` for contacts | `flight_schools.contacts` is jsonb already; one column with a per-field shape CHECK, no app-side parsing |
| Current-value snapshot | Captured at submit time for the admin diff. The queue compares it with the live listing and flags "changed since this was suggested" | A conditional write on the snapshot cannot work for jsonb contacts and would refuse a still-correct fix |
| Approve | Writes the listing column first, then flips the status and records `applied_value`, then notifies. The admin may edit the value in the card; the edit goes through the same validator as the member's | Mirrors `approveClaim`: if the status flip fails the listing is already right and approving again finishes the job |
| Owned listings | Suggestions are accepted; the owner is not told in v1 | Admin edits to owned listings are already silent |
| Contribution credit | Derived from the table by `public.approved_suggestion_count(uuid)`, a `security definer` function granted to `anon` and `authenticated`; no counter column | The profile page is public. RLS hides other people's rows, so a plain count would be 0 for every visitor; a public SELECT policy would expose notes. The function returns one integer and nothing else |
| Notifications | New types `suggestion_approved` and `suggestion_rejected`, both linking to the public listing | Same delivery as claims via `notifyUser` |
| Contacts validation | The `parseContacts` loop moves out of the schools action into pure `src/lib/contacts.ts`, used by both the edit form and suggestions | `"use server"` files cannot be imported by `node --test` |

## Flows

**Member.** A "Suggest an edit" link sits in the listing's contact card (hidden for anyone who can
edit the listing). `/schools/<slug>/suggest` shows a field picker with the current value, an input
matching the field (contacts reuse the edit form's repeating field), the reason dropdown and an
optional details box. Fields with a pending suggestion from this member are disabled. Submitting
refuses a value identical to the listing's, then inserts on the member's own session and returns
to the listing with a flash toast.

**Admin.** `/admin/suggestions` lists pending suggestions newest first — field and reason badges,
the member, a "currently / proposed" diff, the note, and a warning when the listing changed since
the snapshot. The approve form carries the proposed value in an editable input. Approve applies,
invalidates the catalog cache, revalidates the listing page and notifies the member. Decline only
records the decision and notifies. Decided suggestions appear below under "Recent decisions", with
"Applied with edits" when the admin changed the value. The overview gains a Suggestions tile.

**Profile.** The hero eyebrow shows "N approved corrections" beside the owner badge when N > 0.

## Non-goals

Badges, points and leaderboards; anonymous suggestions; other fields (name, description,
programs, coordinates, logo); clearing a field to empty; telling the owner about an applied
correction; auto-declining rival pending suggestions on approval; editing or withdrawing a
suggestion after it is filed.
