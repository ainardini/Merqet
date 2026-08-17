# Merqet

An online flea market for buying and selling with people around you. No shipping, no listing fees, no
online payments — chat, agree on a price, meet up, and pay however you like, in person.

Live at [merqet.site](https://www.merqet.site).

## What's actually built

This started as a simple prototype and grew into a fairly complete marketplace app. Here's everything
that's in it today:

**Accounts**
- Email + password signup, with a 6-digit email verification code (hashed, expires in 10 minutes,
  limited attempts) — works with any email provider, not restricted to `.edu`
- Forgot password flow (same verification-code pattern, separate table so it can't collide with signup)
- Profile page: edit name/campus, upload an avatar, change password, see your own stats (items sold,
  bought, rating, review count)
- Self-serve account deletion (cascades to everything you've created)

**Listings**
- Fixed-price listings with category (Furniture, Clothes, Accessories, Electronics, Beauty, Others),
  condition, a preferred meetup location, and up to 5 photos
- Price in MYR or KRW
- Edit or delete a listing any time it's still available; manual "mark as sold" for sales that happen
  outside a formal offer
- Browse with search, category/condition filters, price range, and sort (newest / price)

**Offers**
- Buyers send a structured offer instead of just haggling in chat
- Sellers see every pending offer on a listing and accept one — accepting auto-declines the rest
- Accepted offers get a 48-hour window for the buyer to confirm, checked lazily on read (no cron job
  needed) — if it lapses, the listing reopens automatically
- Seller can cancel a reservation manually if a buyer never shows up

**Chat**
- Real per-(listing, buyer) conversations — not just per-listing. (Worth noting: the very first version of
  this had a bug where two different buyers messaging the same seller about one listing would see each
  other's messages. Fixed by properly modeling conversations.)
- Text, photos, and voice notes (recorded in-browser)
- A proper Inbox (`/inbox`) for both buying and selling conversations, with unread counts, read
  receipts, and browser + email notifications (email is throttled to avoid spamming an active chat)

**Trust & safety**
- Seller ratings and reviews, tied to actual completed purchases (can't review without having bought)
- Report and block users; blocking hides each other's listings and blocks new messages/offers both ways
- Admin dashboard (`/admin/reports`) to review, dismiss, or action reports — gated by an `isAdmin` flag,
  no self-serve way to grant it (see `npm run make-admin`)
- A persistent meetup-safety nudge on listing pages

**Other**
- Favorites/wishlist
- Rich link previews — pasting a listing link into WhatsApp/iMessage/Discord shows the real photo, title,
  and price
- Rate limiting on offers, messages, listings, and signups — a simple sliding-window counter backed by
  Postgres, no external service needed
- Vercel Analytics
- Real Terms of Use, Privacy Policy, and About pages (not placeholders)
- Custom domain (`merqet.site`) with a verified sending domain on Resend, so notification emails actually
  reach real users, not just the account that owns the Resend key

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma + Postgres** (Neon, via Vercel's Postgres/Storage integration)
- **Vercel Blob** for photo and voice note uploads
- **Resend** for transactional email (verification codes, password resets, offer/message notifications)
- **Vercel Analytics**
- Cookie-based auth with bcrypt password hashing (no third-party auth provider)

## Run it locally

1. Get a free Postgres database (Neon is fastest — sign up, create a project, copy the connection string).
2. `cp .env.example .env` and fill in `DATABASE_URL` at minimum. Everything else has sensible fallbacks
   for local dev (see the comments in `.env.example`).
3. Install and set up the database:
   ```bash
   npm install
   npm run db:push
   npm run db:seed    # optional demo data
   npm run dev
   ```

Without `RESEND_API_KEY` set, verification/reset codes just print to your terminal instead of emailing —
fine for local dev.

## Useful scripts

- `npm run make-admin -- you@example.com` — grants access to `/admin/reports`. No in-app way to do this
  on purpose; admin access should be deliberate, not a toggle.
- `npm run cleanup-test-data` — one-time script that removes the seed accounts and lists every listing in
  the database so you can spot and remove leftover test junk before real users arrive.
- `npm run db:seed` — demo data for local development.

## Known limitations / honest gaps

- **Price filtering isn't currency-aware.** The min/max price filter on Browse compares raw numbers
  regardless of currency — filtering "under 50" mixes MYR and KRW listings together, which are wildly
  different scales in reality. Fine while most listings cluster in one currency; would need real
  attention if that changes.
- **`RateLimitHit` rows accumulate with no automatic cleanup.** Fine at this scale; add a scheduled job
  to prune old rows if that table ever gets large.
- **Chat photo bubbles stay as plain `<img>`, not `next/image`.** They use `maxWidth`/`maxHeight` without
  fixed dimensions so different photo shapes display naturally; converting to `next/image` would force a
  square crop. Deliberate, not an oversight — same for the local-blob upload previews in the listing form.
- **No push notifications when the site isn't open.** "Browser notifications" only work if you've already
  had a tab open once; a real installable PWA with push would need more work.

## Project structure

```
app/
  api/            # all backend routes (auth, listings, offers, messages, conversations, admin, etc.)
  listings/       # browse, listing detail, create/edit forms
  inbox/          # conversation list + individual conversation view
  my-listings/    # seller dashboard
  favorites/      # saved listings
  profile/        # account settings
  users/[id]/     # public seller profile (reviews, rating)
  admin/reports/  # report moderation dashboard
  login/ signup/ forgot-password/ reset-password/
  terms/ privacy/ about/ help/ contact/
lib/
  auth.ts         # password hashing, session cookies, email verification + password reset codes
  db.ts           # Prisma client singleton
  offers.ts       # the 48h offer-expiry logic (lazy, checked on read)
  conversations.ts# conversation lookup, read-tracking, unread counts
  moderation.ts   # block checks, seller rating aggregation
  rateLimit.ts    # the Postgres-backed rate limiter
  email.ts        # all transactional email templates, via Resend
  currency.ts / photos.ts  # small formatting helpers
components/
  NavBar.tsx / Footer.tsx
  ChatBox.tsx     # shared chat UI (text/photo/voice), used by both listing pages and Inbox
  ListingForm.tsx # shared create/edit listing form
  ReportBlockMenu.tsx / SafetyNudge.tsx
prisma/
  schema.prisma   # full data model
  seed.js / make-admin.js / cleanup-test-data.js
```
