# Leads → GoHighLevel — design

Date: 2026-08-21 · Branch: `feature/leads-ghl` · Backlog item 3

## Goal

Let a prospective student request information from a school directly on its page. Every lead is stored, forwarded to the agency's GoHighLevel (GHL) workflow via an inbound webhook, and visible to admins. This delivers the README's "built-in lead generation".

## Decisions already made

- Notification channel is a **GHL inbound webhook** (`GHL_WEBHOOK_URL`); no email provider in this pass.
- Recipients: **admin only** — GHL handles distribution. No owner dashboard for now; owners keep their existing edit flow.
- Anti-spam: **honeypot + rate limit** enforced in the database; no third-party CAPTCHA.
- Visitors do not need an account to send a lead.

## Data model

Patch `supabase/add-leads.sql` (idempotent; folded into `schema.sql`, listed in `supabase/README.md`):

```sql
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  school_id    text references public.flight_schools (id) on delete set null,
  name         text not null,
  email        text not null,
  phone        text not null default '',
  program_slug text references public.programs (slug),
  message      text not null default '',
  source_path  text not null default '',
  ip_hash      text not null,
  status       text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at   timestamptz not null default now(),
  constraint leads_name_length    check (char_length(name) between 1 and 120),
  constraint leads_email_format   check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint leads_phone_length   check (char_length(phone) <= 40),
  constraint leads_message_length check (char_length(message) <= 2000),
  constraint leads_source_length  check (char_length(source_path) <= 300),
  constraint leads_ip_hash_format check (ip_hash ~ '^[0-9a-f]{64}$')
);
create index if not exists leads_school_created_idx on public.leads (school_id, created_at desc);
create index if not exists leads_ip_created_idx     on public.leads (ip_hash, created_at desc);
create index if not exists leads_email_school_idx   on public.leads (lower(email), school_id, created_at desc);
alter table public.leads enable row level security;
create policy "Admin read"   on public.leads for select to authenticated using ((select public.is_admin()));
create policy "Admin update" on public.leads for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant select, update (status) on public.leads to authenticated;
```

No INSERT grant or policy for any API role — inserts only happen inside `submit_lead`, which only `service_role` may execute:

```sql
create or replace function public.submit_lead(
  p_school_id text, p_name text, p_email text, p_phone text,
  p_program_slug text, p_message text, p_source_path text, p_ip_hash text
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.flight_schools where id = p_school_id) then
    raise exception 'Unknown school' using errcode = 'P0001';
  end if;
  if p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Missing request fingerprint' using errcode = 'P0001';
  end if;
  if (select count(*) from public.leads where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many requests. Please try again in an hour.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.leads where lower(email) = lower(p_email) and school_id = p_school_id and created_at > now() - interval '24 hours') then
    raise exception 'You already contacted this school today.' using errcode = 'P0001';
  end if;
  insert into public.leads (school_id, name, email, phone, program_slug, message, source_path, ip_hash)
  values (p_school_id, p_name, p_email, coalesce(p_phone, ''), nullif(p_program_slug, ''), coalesce(p_message, ''), coalesce(p_source_path, ''), p_ip_hash)
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.submit_lead(text,text,text,text,text,text,text,text) from public, anon, authenticated;
grant  execute on function public.submit_lead(text,text,text,text,text,text,text,text) to service_role;
```

The table's CHECK constraints are the validation of record; the function adds existence, rate limits, and normalisation. **Review revision (PR #6):** the function is `SECURITY INVOKER`, executable only by `service_role`, and the server action calls it through a service-role client (`src/lib/supabase/service.ts`, `SUPABASE_SERVICE_ROLE_KEY`). A caller-supplied `p_ip_hash` on an `anon`-callable RPC would let a direct Data API caller pick a fresh hash per request and skip the honeypot; making the function server-only closes that. `ip_hash` is constrained to 64 hex chars. `school_id` is nullable with `ON DELETE SET NULL` so leads survive a school's removal (the admin card shows "School no longer listed"). Errors raised with `P0001` carry user-safe messages the action shows verbatim; other errors go through `friendlyDbError`.

`src/lib/supabase/database.types.ts` gains `leads` and the `submit_lead` function signature.

## Pure helpers — `src/lib/leads.ts` (tested)

- `LEAD_LIMITS = { name: 120, email: 254, phone: 40, message: 2000 }`
- `validateLead(input: { name; email; phone; programSlug; message }, allowedPrograms: string[]): { ok: true; value } | { ok: false; error }` — trims, requires name + email, checks lengths, email shape, program in allowed list or empty.
- `buildGhlPayload(args): Record<string, string>` — flat, string-valued: `lead_id, submitted_at, source, school_id, school_name, school_slug, school_url, airport_code, city, state, name, email, phone, program, program_slug, message, source_path`.
- `hashIp(ip: string, salt: string): string` — SHA-256 hex of `salt + ip` (`node:crypto`), 64 chars; raw IP never stored.

## Server action — `src/app/actions/leads.ts`

`submitLead(prev: LeadFormState, formData): Promise<LeadFormState>` where `LeadFormState = { error?: string; success?: boolean }`.
1. Honeypot: if `formData.get("company_website")` is non-empty → return `{ success: true }` without doing anything.
2. Resolve school via `getSchoolById(schoolId)`; unknown → error.
3. `validateLead` with the school's `programSlugs`.
4. Client IP from `headers()`: `x-nf-client-connection-ip` (Netlify) → first entry of `x-forwarded-for` → `"unknown"`; `hashIp(ip, process.env.LEAD_IP_SALT ?? process.env.NEXT_PUBLIC_SITE_URL ?? "")`.
5. `service.rpc("submit_lead", {...})` with the service-role client (`createServiceClient()`); if the key is missing the action returns a clear "not configured" error. `P0001` → show `error.message`; others → `friendlyDbError`.
6. If `GHL_WEBHOOK_URL` is set: `fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(buildGhlPayload(...)), signal: AbortSignal.timeout(8000) })`. Non-2xx or throw → `console.error("[ghl]", …)`; never surfaces to the user.
7. `revalidatePath("/admin/leads")`; return `{ success: true }`.

`setLeadStatus(prev, formData)` — admin only (`isAdmin(viewer)`), `status ∈ {new, contacted, closed}`, `update … eq(id)`, revalidate `/admin/leads`.

## UI

`src/components/LeadForm.tsx` (client, `useActionState`) rendered by the school page in a new main-column section **"Request information"** (`id="inquire"`) placed after "About" (before Programs) so it is high on the page:
- Fields: Name*, Email*, Phone, "I'm interested in" `<select>` (school's programs by short name + "Not sure yet"), Message (textarea, 2000 max, counter), honeypot `company_website` (visually hidden, `tabIndex=-1`, `autoComplete="off"`), hidden `schoolId`, `path`.
- Uses `Field`/`Input`/`Textarea`/`Select`/`Button`/`Notice` primitives; pending state disables the submit; success replaces the form with a `Notice tone="ok"` "Sent — {school name} will be in touch." Privacy line under the button: "Shared only with this school and our team."
- Hero `aside`: a primary **"Request info"** `Button href="#inquire"` becomes the first CTA; "Visit website" drops to secondary. Sidebar card: same button, full width, above "Visit website".

`/admin/leads` (`src/app/admin/leads/page.tsx`, pattern = `/admin/submissions`): login → redirect, non-admin → `notFound()`. Sections "New", "Contacted", "Closed" (collapsed count for closed). `LeadCard` (client) shows date, school link, name, `mailto:`/`tel:` links, program, message, status chips as three small forms calling `setLeadStatus`. `getLeads()` in `data.ts` (admin RLS) joins school name/slug for links. `AuthButton` `adminLinks` gains `{ label: "Leads", href: "/admin/leads" }`.

## Config

- `GHL_WEBHOOK_URL` — server-only; the URL from a GHL workflow's "Inbound Webhook" trigger. Field mapping lives in GHL.
- `LEAD_IP_SALT` — optional; any random string. Falls back to the site URL so hashes are still not raw IPs.
- Documented in `supabase/README.md` env section; placeholders appended to `.env.local`.

## Error handling

| Situation | Behaviour |
|---|---|
| Honeypot filled | Fake success, nothing stored |
| Missing/invalid field | Inline error from `validateLead`, form keeps values |
| Rate limited / duplicate | The SQL function's message shown verbatim |
| Unknown school / RLS | `friendlyDbError` fallback |
| GHL down or URL unset | Lead stored; error logged; user sees success |
| Admin status update fails | Inline error on the card |

## Testing

- `scripts/tests/leads.test.ts`: `validateLead` (required, lengths, email shape, program allow-list), `buildGhlPayload` (flat strings, all keys present), `hashIp` (deterministic, 64 hex, salt-sensitive).
- `npm test`, lint, `tsc`, `npm run build`.
- Manual: submit a lead on a school page → row in `leads`, GHL workflow receives it (or `[ghl]` log when unset); honeypot filled → nothing stored; 4th submit within an hour → rate-limit message; `/admin/leads` lists it, status chips update; non-admin gets 404.

## Out of scope

Owner dashboard / owner notifications, email delivery, CAPTCHA, lead analytics, discovery-flight booking type, editing lead contents.
