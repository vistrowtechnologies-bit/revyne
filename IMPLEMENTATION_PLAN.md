# RevYne — Implementation Plan (APK first, browser later)

Owner: Vistrow Technologies · Started: 31 Oct 2026
Google Cloud: project `revyne-513306`, project number `159350280865` (org `vistrowtechnologies-org`, account vistrowtechnologies@gmail.com)
GitHub: `vistrowtechnologies-bit/revyne`

Rule: tick a box only when the item is done **and verified**. A phase is ticked only when every item in it is ticked.

---

## Product in one line

Android app that helps Indian local businesses get more genuine Google reviews (QR + WhatsApp → customer's own words, AI-polished, posted by the customer) and manage their Google Business Profile (replies, posts, photos, insights) — self-serve, no sales calls, nothing goes to Google without the owner's approval.

## How we beat competitors (verified Oct 2026)

| Competitor | Their weakness (evidence) | Our answer |
|---|---|---|
| Dhanda (EZO, 1M+ installs, ₹999/mo – ₹29,999/3 yr) | 17 of 33 recent 1–2★ Play reviews = spam sales calls; "paid, nothing posted"; refunds refused; staff changed logo without approval; no review-collection QR | Self-serve, no calls, in-app cancel; activity log of every change; owner approval before anything is published; QR + WhatsApp review collection |
| RevmeAI (500+ installs, ₹249/mo – ₹1,499/yr) | Keyword-stuffed AI reviews (policy risk); QR only; 3 languages; unclear GBP depth | Compliance-first review page; WhatsApp requests; 10+ Indian languages; real GBP API features |
| SmartReviewer / ReviewGenie / Reviwee etc. (₹199–₹499/mo, web only) | Some route 1–3★ customers away from Google (Google policy: no "selectively solicit positive reviews"); web-only | Google button shown to every rating; native Android app |

Compliance rules baked into the product (Google Maps content policy + GBP API policy):
- Every customer sees the Google review button regardless of rating; private feedback is an option for everyone, never only for unhappy customers.
- No incentives, no business-chosen keyword stuffing; AI only polishes what the customer says; varied output.
- RevYne never posts a review on a customer's behalf.
- Replies, posts and profile edits are published only after the owner's explicit approval; owner notified of every change (≤48 h); GBP API content not stored > 30 days.
- Places API: only `place_id` stored long-term; Google attribution shown with any Google reviews.

## Screens (33 owner-app screens + 1 customer web page)

Bottom nav: **Home · Reviews · Get Reviews · Google Profile · Account**

| Area | Screens | Phase |
|---|---|---|
| Start-up & onboarding (7) | Splash · Language picker · Sign in · Find your business (Places search) · Confirm details · Products & tone · "QR ready" + Google Score | 1 |
| Home (3) | Dashboard · Notifications · Google Score breakdown (vs nearby competitors) | 1 |
| Reviews (4) | Reviews inbox · Review detail + AI reply · Private feedback inbox | 1 (inbox/reply upgraded in 3) |
| | Reply templates & tone | 2 |
| Get Reviews (5) | QR & poster · WhatsApp request (single) · Review page settings | 1 |
| | Scan & conversion stats | 2 |
| | Bulk WhatsApp campaign | 4 |
| Google Profile (8) | Connect profile · Profile editor (approve changes) · Posts list · Create post · Photos · Insights · Activity log | 3 |
| | Location switcher | 4 |
| Account (6) | Business settings · Help & support · Settings / legal / delete account | 1 |
| | Plans & upgrade · Billing history | 2 |
| | Team members | 4 |
| Customer web page (1 page, 5 states) | Rate + highlights → AI draft & edit → Copy & open Google → Private feedback → Thank you | 1 |

## Google permissions (scopes)

| Scope | Why | When requested |
|---|---|---|
| `openid`, `email`, `profile` | Sign in | At sign-in |
| `https://www.googleapis.com/auth/business.manage` | Read **and** edit/manage Business Profile: locations, reviews + replies, posts, photos, insights, verifications, notifications. It is the only GBP scope; there is no separate read-only one. | At "Connect Google Profile" (incremental), with offline access so we keep a refresh token |

Works for real users only after (a) Google approves GBP API access for the project (quota goes 0 → 300 QPM) and (b) the OAuth consent screen is verified / published.

---

## Architecture & hosting

| Layer | Choice | Region / notes |
|---|---|---|
| Owner app | Flutter (Android first) → Google Play | — |
| Backend core | Supabase **Pro**: Postgres + RLS, Auth (Google), Storage, Edge Functions | **Mumbai (ap-south-1)**; separate `dev` and `prod` projects |
| Background jobs | Supabase Cron (pg_cron) + Queues (pgmq) for GBP sync, scheduled posts, campaigns, usage resets | Same project |
| Heavy / long jobs (if Edge Function time limits hit) | Google Cloud Run worker in `revyne-513306` | `asia-south1` (Mumbai) |
| Google events | Cloud Pub/Sub (GBP new-review notifications, Play Billing RTDN) → push to backend | `revyne-513306` |
| Push notifications | Firebase Cloud Messaging (Firebase added to `revyne-513306`) | — |
| Customer review page, website, legal pages | Static site on Cloudflare Pages (or Vercel Pro) behind Cloudflare DNS/CDN | Global edge |
| AI | LLM API called only from server functions; per-plan limits + monthly spend cap | — |
| Email | Resend or Amazon SES | — |
| WhatsApp (Phase 4) | Meta WhatsApp Cloud API or an Indian BSP | — |
| Monitoring | Sentry (app + functions), Firebase Crashlytics, uptime checks | — |
| CI/CD | GitHub Actions: DB migrations, function deploys, Flutter builds | — |

Scaling limits to design for (not the database):
- GBP API quota is **300 QPM per project** shared by all users → use Pub/Sub notifications instead of polling, queue all GBP calls, request a quota increase when needed. Edits: 10/min per profile.
- AI cost/rate limits → server-side limits, caching, spend cap.
- Postgres growth → indexes from day one; partition `review_sessions`/events tables and move analytics to BigQuery when large; add compute + read replica + pooled connections as users grow.

## Phase 0 — Accounts & foundations

- [x] Remove leftover backup folders / temp files from the old project workspace (moved to `E:\AI REVIEW-old-backups-20261031`)
- [x] Google Cloud project created under Vistrow org (`revyne-513306`)
- [ ] Billing account linked to `revyne-513306` (needed for Places API) — **owner to do** (needs payment details)
- [x] APIs enabled (31 Oct): My Business Account Management, My Business Business Information, Business Profile Performance, My Business Verifications, My Business Notifications, My Business Place Actions, Cloud Pub/Sub
- [ ] Google My Business API (v4, reviews + posts) — hidden until Google approves GBP access; enable right after approval
- [ ] Places API (New) — enable after billing is linked
- [x] OAuth consent screen (Google Auth Platform) basic setup: app name RevYne, support + contact email vistrowtechnologies@gmail.com, audience External, status Testing
- [ ] OAuth branding: logo, homepage, privacy policy, terms, authorized domain `revyneai.com` (+ Supabase domain) — after domain is live
- [x] Data Access scopes saved: `openid`, `userinfo.email`, `userinfo.profile`, `business.manage` (console lists `business.manage` as **non-sensitive** — see risk in Phase 3)
- [x] Test users saved (verified after reload, 2 Nov): pranav28.nair@gmail.com, vistrowtechnologies@gmail.com (the 31 Oct save had not gone through). Max 100 while in Testing
- [x] OAuth client "RevYne Web (Supabase + server)" created, JS origin `https://revyneai.com`; secret held by owner only. Redirect URI `https://<new-supabase-ref>.supabase.co/auth/v1/callback` to add once Supabase project exists
- [x] OAuth client "RevYne Android Debug (Windows PC)" created — package `com.revyne.revyne_app` (kept from old app), debug SHA-1 `EB:98:1A:24:DC:95:A0:5C:C7:15:C9:EB:58:AA:98:92:48:EE:47:F5`- [ ] Places API key restricted (API restriction + app/server restriction)
- [ ] Domain `revyneai.com` live with homepage, privacy policy, terms, account-deletion page
- [ ] Domain verified in Google Search Console (needed for OAuth verification)
- [ ] Vistrow Business Profile checked: verified & active 60+ days, website = `https://revyneai.com`
- [x] Vistrow Business Profile checked (4 Nov): verified, "Marketing agency", Pune service area, website `https://vistrow.com` (live, has privacy policy; RevYne not mentioned yet). Owner confirmed 60+ days verified
- [x] GBP API access applied 4 Nov from vistrowtechnologies@gmail.com — **case ID 0-6496000041329**, Google estimate 7–10 business days. Submit only one request per project. On approval: enable "Google My Business API" (v4), check quotas show 300 QPM
- [x] Billing account linked (4 Nov, UPI prepayment). Places API **not** enabled — not needed after connect-only decision; set a budget alert
- [ ] Play Console organisation account for Vistrow Technologies (D-U-N-S number)
- [x] Supabase org "Vistrow Technologies" (Free) created; project `revyne-dev` (ref `qokgcupkabyzdqmgtgdp`) in South Asia (Mumbai) `ap-south-1` — Data API on, auto-expose new tables **off**, automatic RLS **on**; DB password held by owner only
- [x] Redirect URI `https://qokgcupkabyzdqmgtgdp.supabase.co/auth/v1/callback` added to Google Web OAuth client (2 Nov)
- [x] Supabase Google provider saved (2 Nov): enabled, Client IDs = Web client `159350280865-johkre455g6fo86e9snrip56vomv3qs2.apps.googleusercontent.com`, secret pasted by owner. End-to-end sign-in test happens with the first Phase 1 sign-in screen
- [ ] `revyne-prod` project (Mumbai, Pro plan) — create only before Play launch (Phase 2)
- [ ] Firebase added to `revyne-513306` (FCM push, Crashlytics)
- [ ] Cloudflare account + DNS for `revyneai.com`; static site hosting for website / customer review page
- [ ] Payment decision recorded: Play Billing (required for in-app subscriptions) ± Razorpay via user-choice billing

## Phase 1 — Free MVP APK (no GMB API dependency)

- [x] New Flutter project `apps/mobile` (package `com.revyne.revyne_app`, branch `rebuild`): design tokens + shared widgets, env config via `--dart-define-from-file`, Riverpod + go_router, auth → onboarding → 5-tab shell gate (load errors never fall through to onboarding), analyzer clean, tests passing, debug APK builds (needs `kotlin.incremental=false` on this PC)
- [ ] Supabase schema + RLS — **foundation migration written** (`backend/supabase/migrations/20261102000000_foundation.sql`: profiles, subscriptions (client read-only), businesses (column-level grants), `get_review_page(slug)`); **pushed to revyne-dev 2 Nov** (+ `20261102000100_lock_rls_auto_enable.sql`). Verified from outside with the publishable key: anon cannot read/insert any table, `get_review_page` works, internal functions not callable; Security Advisor 0 errors, only the 2 intentional `get_review_page` warnings. Still to add: review_sessions, private_feedback, reply_drafts, whatsapp_requests, usage, support_tickets. Two-account RLS test pending
- [x] Google sign-in (native Credential Manager → Supabase `signInWithIdToken`) — verified 2 Nov on Realme RMX2156 (Android 12) with pranav28.nair@gmail.com: Supabase user created, `profiles` + `subscriptions` (free/active) rows auto-created by trigger, app routed to onboarding
- [ ] **Decision 3 Nov: connect-only onboarding (option C).** A business exists only after Google Business Profile connect proves the owner manages it; no search/manual fallback. Migration `20261103000000_gbp_connect_only.sql` pushed: `gbp_connections` (service-role only, tokens to be AES-GCM encrypted), `businesses.gbp_account/gbp_location/verified_at`, one RevYne business per Google location, clients can no longer INSERT businesses and may only edit products/review_languages/reply_tone (verified via privilege checks). **Built 4 Nov:** `gbp-connect` edge function deployed (server auth code → encrypted refresh token, list locations, ownership-checked claim; anon calls rejected; secrets `GBP_TOKEN_KEY` + `GOOGLE_OAUTH_CLIENT_ID` set) and onboarding rebuilt as connect → choose location → preferences → done with an honest "Google is still reviewing RevYne" state (10 controller tests). `GOOGLE_OAUTH_CLIENT_SECRET` set by owner 4 Nov (verified it is not a placeholder; correctness proven on first real connect). End-to-end connect test waits on GBP API approval. Places code and function removed; Google Score formula kept in `functions/_shared/google_score.ts` for Phase 3
- [x] Get Reviews tab: QR + review link (copy, WhatsApp share) and a single-customer WhatsApp request form (4 Nov)
- [x] Dev test business seeded for pranav28.nair@gmail.com ("RevYne Test Store", unverified) via `backend/supabase/dev-seed/test_business.sql` — dev only, lets the app be built before GBP approval
- [ ] ~~Onboarding via Places search~~ — superseded by connect-only. Built 2 Nov (4 steps, manual-entry fallback, 7 controller tests). `places` edge function deployed to revyne-dev with its own signed-in check (gateway let a bare publishable key through). Google search waits on: billing linked → Places API (New) enabled → restricted API key → `GOOGLE_PLACES_API_KEY` secret. App-language picker deferred until the UI is translated
- [ ] Customer review page — **built 4 Nov** (`apps/review-web`, plain HTML/JS): rate → highlights/own words/language → AI draft (optional) → Copy & post on Google, and "send private feedback" offered to every rating (no gating). Backed by migration `20261104000000_review_sessions.sql` (review_sessions, private_feedback, owner-read RLS) + `review-page` edge function (rate limits per visitor-hash and per business, CORS allowlist). Verified in browser against revyne-dev incl. a 2★ customer getting the Google option. `OPENAI_API_KEY` set by owner 4 Nov (model default gpt-5-mini); real drafts verified in English, Hinglish, Hindi incl. 2★ and a prompt-injection attempt. Prompt tightened after first run invented details ("will come back", remarks about staff) and assumed gender — every sentence must now trace to the customer's input, gender-neutral phrasing. **Still needed:** OpenAI monthly spend limit (owner, OpenAI dashboard); hosting + domain `revyneai.com` (Cloudflare Pages/Vercel with `/r/*` → index.html)
- [x] Found + fixed: service_role had no table privileges (auto-expose off) — `20261104000100_service_role_grants.sql`; rule added to backend README
- [x] Reviews tab: private feedback (unread, mark read, call/WhatsApp back) + review-page visits (4 Nov). Verified on phone: 2 private feedback with unread count, tap marks read (DB confirms), page visits show rating/highlights/text/"Went to Google"
- [ ] Google Score (Places: rating, review count, profile completeness, nearby competitors)
- [x] Home dashboard (4 Nov): `get_dashboard_stats` (security invoker — verified a stranger's session gets zeros, owner gets real numbers), this-week tiles with week-over-week change, reached-Google %, 30-day average rating, unread-feedback card, up to 3 next steps from real activity, On Google / Not connected badge. Verified on phone
- [ ] Notifications (push) — later, with FCM
- [ ] Reviews inbox (Places latest reviews + paste a review) + AI reply drafts (copy & open Google)
- [ ] Customer review web page (5 states, 10+ languages, no gating)
- [x] Private feedback inbox (Reviews tab: Private + Visits, Reply on WhatsApp / Call) (5 Nov)
- [x] QR & poster (A5/A4 PDF download), WhatsApp single request, review page settings (products, tone, languages) (5 Nov)
- [x] Help & support, settings, legal links, in-app account deletion (`account-delete` revokes the Google token, then deletes the user) (5 Nov)
- [ ] AI edge functions with server-side limits + rate limits
- [ ] Create upload keystore (back up key + password in 2 safe places) — only now, right before the first Play upload
- [ ] Internal testing release, then closed testing
- [ ] Register Play App Signing SHA-1 (from Play Console) as an Android OAuth client so Google sign-in works for Play installs

## Phase 2 — Plans & Play Store launch

- [ ] Plans & pricing finalised
- [ ] Play Billing subscriptions (+ server verification via Play Developer API / RTDN)
- [ ] Plans & upgrade, billing history, reply templates, scan stats screens
- [ ] Play listing, data safety form, privacy policy URL, content rating
- [ ] Production release

## Phase 3 — Google Business Profile integration (starts when Google approves API access)

- [x] Connect flow: incremental `business.manage` + server auth code → refresh token stored server-side (5 Nov, verified with a real profile)
- [x] Location picker; location stored as `accounts/{a}/locations/{l}`; an existing unlinked business is linked in place (keeps its review link) (5 Nov)
- [x] Reviews inbox (live from Google, not stored) + AI reply drafts (60/day/business) + reply posting with owner confirmation (5 Nov; draft + post verified on a real review)
- [ ] Pub/Sub new-review push notifications
- [x] Google Score (RevYne's own 0–100; Google's profile strength has no API) with fix-it tasks (5 Nov)
- [x] Profile editor (description with AI, hours, holiday hours, phone, website) with confirm before sending (5 Nov; real description edit accepted by Google, shown as pending review)
- [x] Posts (update/offer/event, AI text, photo, button) and photo upload/delete via private `gbp-media` bucket + signed URL (6 Nov; real post went Live, real photo added and listed)
- [ ] Scheduled posts (server-side, Google's API has no scheduling)
- [ ] Insights (Performance API: calls, directions, website clicks, search keywords)
- [ ] Activity log + change notifications (≤48 h)
- [ ] OAuth consent screen verification passed (demo video, privacy policy, domain verification)

## Phase 4 — Growth

- [ ] Bulk WhatsApp campaigns (WhatsApp Business Cloud API)
- [ ] More Indian languages + regional-language support
- [ ] Multi-location + location switcher, team members
- [ ] Monthly WhatsApp report, competitor tracking, NFC standee orders

## Phase 5 — Browser

- [ ] Owner web dashboard (same backend)
- [ ] Internal admin panel (support, users, payments, abuse flags)

---

## Log

| Date | Item | Notes |
|---|---|---|
| 2026-10-31 | Plan created | Old repo (`main` @ e7645e7) kept only as reference |
| 2026-10-31 | Leftover folders moved out | `.codex-git_backup_*`, `.git_broken_*`, `_revyne_push`, temp PNGs → `E:\AI REVIEW-old-backups-20261031`. `_git_meta` is the live git dir — keep |
| 2026-10-31 | 7 Google APIs enabled on `revyne-513306` | v4 "Google My Business API" not listable before approval (expected) |
| 2026-10-31 | OAuth consent screen wizard filled | Owner accepted User Data Policy and created config |
| 2026-10-31 | Scopes, test user, Web OAuth client created | `business.manage` shows as non-sensitive in console |
| 2026-10-31 | Package name decided: `com.revyne.revyne_app` | Android debug OAuth client created in `revyne-513306` |
| 2026-11-02 | Old Supabase `revyne-prod` (`dbqizpephewiefvghenr`) reviewed | Region Tokyo (cannot be changed), Free plan, paused (resumable until 15 Oct 2027), org "RevYne" owned by revyneai@gmail.com, schema never fully in migrations → create a fresh project in Mumbai; keep old one paused until its backup is downloaded |
| 2026-11-02 | Supabase org "Vistrow Technologies" + `revyne-dev` created | Mumbai region, secure defaults (no auto-expose, auto RLS) |
| 2026-11-02 | Google sign-in connected to `revyne-dev` | Callback URL on Web client; Google provider enabled in Supabase |
| 2026-11-02 | Foundation migrations pushed to `revyne-dev` | Supabase CLI logged in + linked on this PC (owner ran login/link) |
| 2026-11-04 | Connect-only onboarding + gbp-connect + Get Reviews tab | Verified on phone: test account opens Home ("RevYne Test Store"), Get Reviews shows QR/link/WhatsApp form |
| 2026-11-05 | Logo-palette redesign of every screen | Palette in `design/brand/PALETTE.md`; Plus Jakarta Sans bundled (500-800); gradient hero per screen, raised Get Reviews tab, 7-day chart (`dashboard_daily` migration). Verified all 5 tabs on the Realme (arm64 release build, 21 MB - phone too full for the 192 MB debug APK) |
| 2026-11-05 | First real Business Profile linked | Google's Business Profile APIs answered for pranav28.nair@gmail.com (access appears approved). Test store linked to a real Pune profile: name, category, address, phone, place ID, review URL from Google; review page shows it |
| 2026-11-05 | Google reviews inbox live | Needed the v4 `Google My Business API` enabled in `revyne-513306` (owner enabled it). New reviews reached the API ~25 min after showing on Search (count first, list later). `gbp-reviews` function + `owner_actions` table |
| 2026-11-06 | GBP API access approved | Account Management quota 300 req/min; v4, Business Information, Performance, Notifications, Verifications APIs all enabled in `revyne-513306` |
| 2026-11-04 | GBP API access requested | Case 0-6496000041329; build continues on the seeded test business meanwhile |
| 2026-11-03 | Connect-only onboarding decided | Migration pushed; test business seeded for pranav28.nair@gmail.com |
| 2026-11-02 | First real sign-in on phone | Debug APK on Realme RMX2156; user + profile + free subscription created |
| 2026-11-02 | Phase 1 started on branch `rebuild` | `apps/mobile` (Flutter) + `backend/` (Supabase) scaffolded; old code left untouched at repo root; half-merged old edits reset (still in `stash@{0}`) |
