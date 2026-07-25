# Campus Trade

A campus-only marketplace: students list used items at a fixed price, buyers can
chat or make an offer, sellers accept/reject offers, and accepted offers give the
buyer 48 hours to confirm before the reservation expires and the item reopens.
No payment processing — buyers and sellers pay each other in person.

## Stack
- **Next.js 14** (App Router) + TypeScript — pages and API routes in one app
- **Prisma + Postgres** for the database (get a free one from [Neon](https://neon.tech), Supabase, or Railway — the same connection string works for local dev and for your Vercel deployment)
- **Cookie-based auth** with bcrypt password hashing and **email verification codes** — any email address can sign up, but the account is inactive until they enter the 6-digit code sent to that address

## Run it locally

1. Get a free Postgres database (Neon is the fastest: sign up, create a project, copy the connection string it gives you).
2. Copy the env file and paste your connection string in:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL` to your Postgres connection string.
3. Install and set up the database:
   ```bash
   npm install
   npm run db:push   # creates the tables from prisma/schema.prisma
   npm run db:seed    # optional: adds two pre-verified demo users + four listings
   npm run dev
   ```

Visit http://localhost:3000. If you seeded the database, log in as:
- `mei@university.edu` / `password123`
- `arjun@university.edu` / `password123`

### Email verification codes

Without a `RESEND_API_KEY` set, verification codes are printed to your terminal
instead of emailed — look for a line like `Verification code for you@x.com: 042917`
after signing up. That's fine for local dev. For real emails:

1. Sign up at [resend.com](https://resend.com) (free tier covers plenty of signups)
2. Get an API key and put it in `.env` as `RESEND_API_KEY`
3. Set `EMAIL_FROM` — Resend's sandbox domain (`onboarding@resend.dev`) works for
   testing without any domain setup; verify your own domain with Resend before
   going live so emails land reliably and don't look like spam

## How the core flows work

**Fixed-price listings.** Every item has a set price (`app/listings/new`). Buyers
either chat with the seller or submit a structured offer — there's no bidding.

**Offers.** A buyer's offer is a row in the `Offer` table with a status
(`pending` → `accepted`/`rejected` → `confirmed`/`expired`). The seller sees all
pending offers on their item in **My Listings** and can accept one — accepting
automatically rejects every other pending offer on that listing (`app/api/offers/[id]/accept`).

**The 48-hour window.** Accepting an offer sets `Listing.reservedUntil` 48 hours
out and flips the listing to `reserved`. There's no cron job — instead,
`lib/offers.ts#expireIfNeeded` checks the deadline every time a listing is read
(browsing, viewing the detail page, or loading My Listings) and flips it back to
`available` if the window has passed. This keeps things simple to deploy: no
background workers needed. If you want it to happen exactly on time rather than
"next time someone loads the page," add a scheduled job (e.g. a Vercel Cron Job)
that calls `expireAllStale()` every few minutes.

**No-shows.** Once a buyer confirms, the listing moves to `confirmed`. If they
never show up to pay, the seller can hit **Buyer didn't show** in My Listings
(`app/api/listings/[id]/cancel-reservation`), which reopens the listing with a
clean slate. Once the meetup actually happens, the seller hits **Mark completed**
to close it out.

**No payments.** There is intentionally no payment integration anywhere in this
codebase. The whole point is buyers and sellers exchange cash or their own bank
transfer app in person — Campus Trade only handles discovery, offers, and chat.

## Before this is real and public

- **Change `JWT_SECRET`** in `.env` — the checked-in value is a placeholder for
  local dev only.
- **Set up `RESEND_API_KEY` in production** — without it, verification codes
  only print to your server logs, which means real users can never actually
  sign up. This is the one piece that's required, not optional, before launch.
- **Use separate databases for dev and production** if you want to keep test
  data separate — create a second Neon/Supabase project for production and
  point Vercel's `DATABASE_URL` at that one instead of your local dev database.
- **Deploy.** Push this to GitHub, then import it into Vercel — it detects
  Next.js automatically. Add your `DATABASE_URL`, `JWT_SECRET`,
  `RESEND_API_KEY`, and `EMAIL_FROM` as environment variables in the Vercel
  dashboard.
- **Since anyone with any email can now sign up**, the campus-only trust that
  `.edu` used to provide is gone — worth deciding whether you want that back
  in some form (e.g. an invite-code system, or manually approving new signups
  at first) versus accepting a more open userbase.
- **Add basic safety nudges** — e.g. a note on the listing page encouraging
  meetups in public, well-lit campus spots (library, student center).
- **Rate limit** the offer and message endpoints before this is public, so one
  person can't spam offers or messages.

## Project structure

```
app/
  api/            # all backend routes (auth, listings, offers, messages)
  listings/       # browse detail + create-listing pages
  my-listings/    # seller dashboard
  login/ signup/  # auth pages
lib/
  auth.ts         # password hashing, session cookies, getCurrentUser()
  db.ts           # Prisma client singleton
  offers.ts       # the 48h expiry logic
prisma/
  schema.prisma   # User, Listing, Offer, Message models
  seed.js         # demo data
```
