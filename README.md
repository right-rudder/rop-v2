# ✈️ Flight School Finder

**Find, compare, and contact flight schools across the USA — live at [pilottrainingnearme.com](https://pilottrainingnearme.com).**

Search by state, city, or airport code. Filter by the certificate you're chasing, the aircraft you want to fly, and how far you're willing to drive. Read student reviews, shortlist schools, compare them side by side, and request information from the school's page — no middlemen.

Built for **student pilots** who want a clear picture before they book a discovery flight, and for **flight schools** who want to be found by the people actively searching for training.

---

## 🧭 What's on the site

### For student pilots
- 📍 **Near me** — share your location once and see every school within 25–250 miles, closest first, or start from your metro area
- 🗺️ **Browse by state, city, or airport** — every listing has its primary airport (ICAO / IATA / FAA LID), programs, fleet size, FAA Part 61 / 141 status, and contacts
- 🔎 **Advanced search** — combine location, program, aircraft type, FAA part, and minimum rating; list or map view
- 🎓 **Programs** — every FAA certificate, rating, and endorsement from Discovery Flight to ATP, with minimum hours, typical duration, prerequisites, and answers to the questions people actually ask (cost, hours, Part 61 vs 141)
- 🛩️ **Trainer aircraft** — the Cessna 172s and 152s, Piper Seminoles, helicopters, and sport planes schools fly — and which schools fly them
- ⭐ **Reviews** — six-category ratings from real students, with comments and replies
- ❤️ **Save & compare** — shortlist schools and compare up to four side by side
- 📨 **Request info** — one form on the school's page, pre-filled for signed-in users

### For flight schools
- 🏫 **Submit a listing** — location, fleet, programs, contacts; reviewed by the team, then published
- ✏️ **Manage your page** — owners edit their listing, upload a logo, and keep programs current
- 📥 **Leads** — information requests land in an admin inbox and forward to your CRM via webhook

### Under the hood
- 🤖 **AI- and SEO-ready** — schema.org structured data on every page, `llms.txt` for AI assistants, clean canonical URLs, and a sitemap that only advertises pages with real listings
- ⚡ **Fast** — catalog reads are served from a cross-request cache; warm pages make zero database calls
- 🔒 **Hardened** — row-level security on every table, server-only lead capture with rate limiting, baseline security headers, HSTS preload

---

## 🛠️ Stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) · React 19 · TypeScript |
| Styling | Tailwind CSS 4 · `next/font` (Bricolage Grotesque, Instrument Sans, JetBrains Mono) |
| Data & auth | [Supabase](https://supabase.com) — Postgres, RLS, Auth, Storage |
| Maps | Google Maps JavaScript API (optional — the site works without a key) |
| Hosting | [Netlify](https://netlify.com) behind Cloudflare |
| Quality | ESLint · `tsc` · `node:test` · GitHub Actions on every PR |

---

## 🚀 Getting started

```sh
git clone https://github.com/right-rudder/rop-v2.git
cd rop-v2
npm install
# create .env.local — see "Environment" below
npm run dev                  # http://localhost:3000
```

### Environment

Create `.env.local` with your Supabase project's values (**Project Settings → API**):

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>        # server-only; used solely for lead capture
NEXT_PUBLIC_SITE_URL=http://localhost:3000           # production URL when deployed

# Optional
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=                     # map views; restrict to your referrers
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=                      # Cloud map style id
GHL_WEBHOOK_URL=                                     # forward leads to a GoHighLevel workflow
GHL_NOTIFY_WEBHOOK_URL=                              # GHL workflow that emails ownership notifications
GHL_OWNER_WEBHOOK_URL=                               # GHL workflow that receives each approved listing owner as a contact
LEAD_IP_SALT=                                        # random string for lead rate-limit fingerprints
```

### Database

The schema lives in `supabase/migrations/` (Supabase CLI format) with `supabase/seed.sql` for demo catalog data. First-time setup, auth email templates, and the migration workflow are all in **[supabase/README.md](supabase/README.md)**.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (`node --test`, zero dependencies) |

CI runs all four checks on every pull request and push to `main`.

---

## 🗂️ Project layout

```
src/
  app/            routes — /{state}/{city}/{airport}/{school}, /states, /cities, /airports,
                  /programs, /aircraft, /search, /near-me, /compare, /saved, /admin/*,
                  plus sitemap, robots, llms.txt, manifest, icons, and the social card
  app/actions/    Server Actions — auth, reviews, schools, airports, favorites, leads, admin
  components/     UI — explorers, cards, forms, map, toasts, and the `ui/` primitives
  content/        Editorial copy — program FAQs, state & city intros
  lib/            Data layer (cached catalog reads), auth, geo, SEO & structured-data builders
  lib/supabase/   Server, browser, public (cookie-less), and service-role clients
scripts/tests/    node:test suite
supabase/         migrations/, seed.sql, schema snapshot, setup guide
```

---

## 🤝 Contributing

1. Branch from `main`, keep the change focused, and add or update a test in `scripts/tests/` when there's logic to protect.
2. Run `npm run lint && npm run typecheck && npm test && npm run build` — the same checks CI runs.
3. Open a pull request. Netlify builds a deploy preview for every PR.

Schema changes go through `supabase migration new` — never edit the live database by hand. Details in [supabase/README.md](supabase/README.md).

---

## 🙏 Acknowledgments

Flight School Finder is developed with insight from the aviation marketing world. Special thanks to **Tim Jedrek** — pilot, software engineer, and founder of [Right Rudder Marketing](https://rightruddermarketing.com/), the digital marketing agency dedicated to helping flight schools grow enrollments through SEO, Google Ads, websites, and lead nurturing.

Learn more about Tim's work at [timjedrek.com](https://timjedrek.com/), or see how Right Rudder Marketing can help your flight school at [rightruddermarketing.com](https://rightruddermarketing.com/).

🛫 **Let's train more pilots.**
