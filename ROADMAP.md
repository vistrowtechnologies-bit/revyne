# RevYne roadmap: fix bugs, close the competitor gaps

Written 26 Nov 2026 from a signed-in audit of the owner web app, a read of the
repo docs, and public research on Dhanda (EZO) and RevmeAI. Competitor claims
come from store listings and are not independently verified. Items marked
"verify" were seen only partly or not at all.

Rules from `CLAUDE.md` still apply: nothing public on Google without the
owner's OK in chat, no review gating, AI output is always an editable draft,
web and Android stay at feature parity, schema changes only via migrations.

---

## Phase 0: fix what is broken (days)

| # | Item | Where | Status |
|---|---|---|---|
| 0.1 | QR, poster and WhatsApp links pointed at `revyneai.com`, which does not resolve | `apps/web-preview/src/lib/supabase.ts`, `apps/mobile/lib/core/config/env.dart` | **Changed in code, not deployed or tested.** Defaults to `revyne-pied.vercel.app`. Switch back once DNS is live |
| 0.2 | `account-delete` left the user's files in `gbp-media` and `avatars` | `backend/supabase/functions/account-delete/index.ts` | **Changed in code, not deployed or tested.** Needs `deno test` and a deploy |
| 0.3 | `REVIEW_PAGE_ORIGINS` may lack `https://revyne-pied.vercel.app`, so AI drafts and private messages on the website review page could fail | Supabase secret | Open. Owner checks the value; do not overwrite without asking |
| 0.4 | App legal links and website contact email still use vistrow.com | `account_screen.dart`, `sign_in_screen.dart`, `Account.tsx`, `SignIn.tsx`, `apps/website/*` | Open. Wait for revyneai.com, then change everything at once |
| 0.5 | Profile shows "Google is reviewing a recent change" | Google profile screen | Verify the edit is approved |
| 0.6 | "Products, tone & languages" did not visibly react to a click | Account screen | Verify by hand |
| 0.7 | Scheduled post never confirmed publishing end to end | `gbp-scheduler` | Verify with an owner-approved test post |
| 0.8 | Two-account RLS test never run | Supabase | Verify |
| 0.9 | Point `revyneai.com` DNS at Vercel, deploy the website, update `site.config.js` | Registrar, Vercel | Owner action |

Exit: every link a customer sees opens, and deletion removes all user data.

## Phase 1: protect the lead over Dhanda (2 to 3 weeks)

Dhanda's recent 1-star reviews are about sales calls, upsells, unreachable
support and work promised but not done. Make the opposite visible.

- 1.1 In-app cancel and a clear "what you get" screen. No sales calls, ever.
- 1.2 Activity log of every change (exists, but it is empty in testing: verify it records replies, posts, edits).
- 1.3 "Google changed your profile" push alert within 48 hours (screen exists, no push).
- 1.4 Support: in-app ticket that cannot error out, plus a WhatsApp link.
- 1.5 Crash reporting and CI (Crashlytics, GitHub Actions: analyze, test, build).

## Phase 2: close the feature gaps (4 to 8 weeks)

### 2.1 Done-for-you weekly posts and festival templates (highest value)
Dhanda's main paid hook. Our version stays approve-first.
- Suggest one post a week per business: AI text from the owner's products and tone, plus a photo from their gallery.
- Festival and season calendar for India (Diwali, Holi, Eid, Navratri, Independence Day, wedding season, sales). Template images with the business name and logo, generated server-side.
- Owner sees a "This week's suggestion" card on Home, edits or rejects, and confirms before anything goes to Google. Nothing auto-posts.
- Build: `post_suggestions` table, a scheduled function that drafts them, a templates store, then the Home card and a Posts tab list. Web and Android together.
- Success: an owner can publish a good post in under 30 seconds from one tap.

### 2.2 Keyword insights with advice
- Today we show search keywords. Add "what to target": group keywords, show rank movement, and suggest what to put in the description, posts and replies.
- Use only data we already get from the Performance API, plus clear wording that Google does not share rank positions.
- Later (needs Places API and billing): add "how you compare nearby".

### 2.3 Competitor and nearby comparison
- Needs Places API (New), billing and a restricted key, which the plan has not set up.
- Phase it: (a) free audit screen from the business's own data, (b) nearby businesses by category with rating and review count, (c) a gap list ("they have 120 reviews, you have 1").
- Respect Google's Places terms: store only `place_id` long term, show attribution.

### 2.4 More Indian languages
- Review page and AI replies today cover English, Hindi, Hinglish. Add Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali, Punjabi, Malayalam.
- Two parts: AI output in those languages, and a translated app UI with a language picker (the plan already lists the picker).
- Have a native speaker review the AI prompts and the UI strings for each language before shipping it.

### 2.4b Photo guide and upload checks (copies the idea, fixes the gap in Dhanda's guide)
- Dhanda's "What to upload?" guide lists eight good photo types and no rules on what to avoid. RevYne can show both.
- Guide screen per photo category (exterior, interior, product, at work, team, food and drink, common areas, rooms) with Google's minimum counts and tips, and a clear "avoid" list: stock photos, screenshots, collages, heavy filters, added text, borders, identifiable people without consent, other people's images, repeated uploads. Source and wording: see `COMPETITOR_STUDY.md` (Google's rules).
- Checks before upload that the app can really run: JPG or PNG only, 10 KB to 5 MB, at least 250 x 250 px (recommend 720 x 720); video up to 30 s and 75 MB. Warn, do not block, on things the app cannot judge.
- Say plainly that Google, not RevYne, decides what goes live, and that going live can take 24 to 48 hours.
- Photo count goal in the Google Score already says 10 photos; tie it to the per-category minimums.

### 2.4c Business website (owner request, 26 Nov 2026; Dhanda sells this as a Pro feature)
- A free one-page site per business built from data RevYne already has: name, category, description, hours,
  phone and WhatsApp buttons, address with map link, photos, services or top items, and the review link/QR.
- Served from our own domain (e.g. `revyneai.com/b/<slug>`), static and fast, with proper SEO tags and
  LocalBusiness structured data. Owner previews and publishes; nothing goes live without approval.
- Later: custom domain, theme colours from brand settings, and a contact form that lands in Private messages.
- To check before building: Google ended its own Business Profile websites in 2024 (from memory, confirm), and
  what the owner wants to charge for it.

### 2.5 Plans and billing
- Play Billing subscriptions with server verification, plans screen, billing history, a real pricing page. Decide Play Billing alone or with Razorpay.
- Price against what is known: Dhanda about 999 rupees for 3 months (user-reported). RevmeAI pricing is not confirmed.

## Phase 3: launch

OAuth verification with demo video, `revyne-prod` on Supabase Pro, Play Console
organisation account (D-U-N-S), upload keystore backed up twice, Play App
Signing SHA-1 as an Android OAuth client, data safety form, content rating,
listing, then internal, closed and production tracks.

## Phase 3b: standee with NFC chip (owner's plan, to sell)
- Sell a physical standee whose NFC chip and printed QR both open the business's review link. Details and open
  questions are in `COMPETITOR_STUDY.md` ("Owner plan: standee with NFC chip").
- App side: pair a standee by scanning or entering its short code; per-standee scan and tap counts; unpair or
  replace.
- Backend: a `standees` table (code, business, status), a redirect or lookup for `/s/<code>`, and counters, with
  RLS and `service_role` grants per `backend/README.md`.
- Decisions needed from the owner first: chip type and supplier, print and shipping, price, payment, returns.
  Do not build before those are decided.

## Phase 4: later

Bulk WhatsApp campaigns (Cloud API), Pub/Sub instead of polling for review
alerts, multi-location and team members, monthly WhatsApp report.

## Out of scope for now

- **Order management** (RevmeAI). Out of scope. (The website builder moved into scope as 2.4c at the owner's request.)
- Dhanda-style Facebook and Instagram management. Different APIs and review rules.

## Competitor comparison (tested 26 Nov 2026)

Sources: Dhanda's Play Store listing and reviews (read in a browser), RevmeAI's
Play Store listing, and a hands-on pass through the RevmeAI Android app on a
real phone (Free plan, signed in, no business added). RevmeAI payments, posting
and the Edit Business form were not exercised. Dhanda's app itself was not
tested, only its public listing.

| Area | RevYne | Dhanda (EZO) | RevmeAI |
|---|---|---|---|
| Scale | Not launched | 1M+ installs, 4.6 stars, 80K reviews | 500+ installs |
| Price | Not set | About 999 rupees for 3 months (user-reported) | Free; 249 (1 month), 849 (6 months), 1,499 (1 year); franchise 2,299 for 6 months |
| Review collection (QR, WhatsApp, link) | Yes, every rating gets the Google button | Not advertised | QR (unlimited scans on paid plans) |
| Reads your real Google reviews | Yes, live | Yes (replies) | **No.** Owner types in the customer name, stars and text by hand |
| AI replies | Yes, 3 languages, owner approves, posts to Google | Yes, personalised | Yes, 1-2 per day tip; locked to "Plan Expired" on free |
| Posts | Create, schedule, AI text, photo | Weekly images and updates done for the owner | AI post topics, 2 a week on free |
| Profile editing on Google | Yes (description, hours, phone, website) | Claimed | Edit Business needs a mobile number first |
| Score or audit | Own Google Score, no nearby comparison | Free Google Score audit, keyword and competitor analysis | "Improve GMB ranking" (details unconfirmed) |
| Extras | Reports PDF, private messages, themes | Facebook and Instagram setup promised | Website builder, orders, themes |
| Support | In-app help | Sales calls; unreachable after payment (recent 1-star reviews) | Email only |
| Delete account in app | Yes | Not checked | **Not found** in Profile (Google Play requires it) |
| Logout | Yes | Not checked | One tap, no confirmation |

What this shows:
- RevYne is ahead on review collection, live Google data, approval before anything is published, and support without sales calls.
- RevmeAI is a thin tool. Its price points confirm the earlier plan (249 and 1,499). Its "bonus days" banner pushes purchases; avoid copying that.
- Dhanda wins on scale and on done-for-you content, and loses on trust.
- Worth copying: a weekly post counter with suggested topics (see 2.1), clear plan-expired messaging, and a cap or nudge against bulk replies, which Google may read as spam.
- Not worth copying: website builder and order management.

---

## What was and was not tested so far

- **Tested:** the signed-in owner web app (Home, Reviews, Google, Get Reviews, Account and sub-screens) in read-only mode. Public website pages. Local web build.
- **Not tested:** Android app, every write action (reply, post, edit, upload, schedule), PDF downloads, push notifications, phone-width layout when signed in, and the competitors' app flows.
