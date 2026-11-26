# RevYne handoff (rebuild, November 2026)

Last updated: 21 November 2026. Written for a Claude Code session on a new
account that has never seen this project. Read it all once, then keep
`CLAUDE.md` (the working rules) in mind on every task.

> `REVYNE_PROJECT_HANDOFF.md` and `REVYNE_CUSTOM_GPT_CONTEXT.txt` describe the
> **old** July 2026 static web app at the repo root. They are out of date.
> This file replaces them. `IMPLEMENTATION_PLAN.md` is still the phase plan,
> but its checkboxes stop around 7 November. The checklist in section 8 is newer.

---

## 1. What RevYne is

RevYne, by Vistrow Technologies (Pune), helps Indian small businesses get
more genuine Google reviews and run their Google Business Profile (GBP).

- **Owners** use the app to:
  - share a QR code or link for reviews;
  - answer Google reviews with AI drafts they approve;
  - edit their Google profile, post updates and photos, and schedule posts;
  - see Google stats and monthly PDF reports;
  - read customers' private messages.
- **Customers** open a public review page (`/r/<code>`). They pick a rating,
  get an optional AI draft built only from their own words, then copy it and
  post it on Google themselves. They can also send the owner a private message.

**Rules that are never broken (Google policy and the brand):**

- No review gating. Every rating, 1 to 5, gets the "post on Google" option.
- We never ask for 5 stars, and nothing is posted automatically.
- Whatever reaches Google (a reply, post, photo or profile edit) is approved
  by the owner first, with a confirm step.
- Google review content isn't stored beyond what's needed. Reviews are read
  live from Google, and notifications are purged after 30 days.
- A business can only join RevYne by connecting a Google profile the owner
  really manages ("connect-only onboarding"). There is no manual or search
  fallback.

---

## 2. Repository map

GitHub: `vistrowtechnologies-bit/revyne` (private), remote `origin`.
**Active branch: `main`.** On 26 Nov `main` was fast-forwarded to `rebuild`,
so the two are identical. Work on `main` from now on; `rebuild` can be deleted
later. `master` still holds the old static app. Don't build on it.
Vercel blocks deploys from git pushes on this repo, so pushing doesn't change
the live sites. Deploy with the Vercel CLI (section 5).
`old-origin` (`prophuntllp-bit/revyne`) is the previous remote, kept for history.

| Path | What it is | State |
|---|---|---|
| `apps/mobile` | **Android owner app**, Flutter (package `com.revyne.revyne_app`) | Main product. Release APK tested on a phone. Not on the Play Store yet |
| `apps/web-preview` | **Owner web app**, React 18 + Vite + TypeScript. Same features as the Android app, same backend. The folder name is historical | Live at https://revyne-app.vercel.app (Vercel project `revyne-app`). Chosen as the web version |
| `apps/review-web` | Customer review page (plain HTML/JS). **Source of truth** | Copied into the website by a sync script |
| `apps/website` | Public marketing site (plain static HTML): home, pricing, about, contact, privacy, terms, delete-account, `/r/<code>` | Merged into `rebuild` on 21 Nov, from branch `claude/website-39e4a8`. Deployed to https://revyne-pied.vercel.app (Vercel project `revyne`) |
| `apps/mobile/web` | Flutter web build target | Superseded by the React web app. Can be removed once nobody needs it |
| `backend/supabase` | Migrations, edge functions (Deno/TypeScript), dev seeds | Everything is pushed and deployed to `revyne-dev` |
| `backend/scripts/set-fcm-secret.ps1` | Sets the FCM secret from the key file without printing it | |
| `design/` | Earlier Stitch design exports | Reference only |
| Root `index.html`, `app.js`, `styles.css`, `sw.js`, `api/`, `supabase/`, `mobile/`, `supabase-config.js` | **Old July app** | Legacy. Don't edit. Remove after the new website replaces it in production |
| `backup-before-codex-reset.patch`, `tmp_qr_pdf_page.png` | Old scratch files | Safe to delete after a check |

`.claude/` is gitignored. Worktrees and `.claude/launch.json` don't travel with
the repo, so section 5 lists the preview commands.

---

## 3. Architecture

```
Android app (Flutter) ─┐
Owner web app (React) ─┼─► Supabase revyne-dev ── Postgres (RLS on every table)
Review page (static) ──┘        │                 Auth (Google)
                                │                 Storage: gbp-media (private), avatars (public read)
                                │                 pg_cron: publish scheduled posts (5 min),
                                │                          review watcher (10 min), 30-day cleanup
                                └─ Edge functions ──► Google Business Profile APIs (v1 + v4)
                                                   ──► OpenAI (drafts)
                                                   ──► FCM (push to Android)
```

**Supabase project `revyne-dev`:** ref `qokgcupkabyzdqmgtgdp`, Mumbai,
Free plan, org "Vistrow Technologies". `revyne-prod` doesn't exist yet. Create
it only right before the Play launch.

**Edge functions** (`backend/supabase/functions/`):

| Function | Job |
|---|---|
| `gbp-connect` | Exchange the Google code: Android sends `redirectUri` `""`, web sends `"postmessage"`. Stores the encrypted refresh token, lists locations and claims one |
| `gbp-reviews` | List reviews, AI reply draft (60/day/business), post or delete a reply |
| `gbp-profile` | Google Score, profile edits, Google changes (`google_changes`) |
| `gbp-content` | Posts and photos |
| `gbp-insights` | Performance stats and keywords |
| `gbp-report` | Monthly report data |
| `gbp-scheduler` | Publishes scheduled posts. `--no-verify-jwt`; checks the vault secret via `scheduler_secret_ok()` |
| `gbp-review-watch` | New-review alerts. `--no-verify-jwt` plus the same vault check |
| `review-page` | Public customer page: AI draft and private message, with rate limits and a CORS allowlist |
| `account-delete` | Revokes the Google token, then deletes the user |

Shared code lives in `_shared/`, with Deno tests next to it.
`_shared/http.ts` `serveOwner()` adds CORS for `OWNER_APP_ORIGINS`.

**Migrations:** 16 files, `20261102…` to `20261114000100_reply_templates.sql`,
all pushed. Change the schema only through a new migration file, never in
the dashboard. Follow the security rules in `backend/README.md`: RLS plus
explicit grants, and `service_role` grants on every table.

**Key app tech:**

- **Android app:**
  - Flutter 3.44.4, Riverpod 3, go_router (StatefulShellRoute), supabase_flutter, google_sign_in 7.
  - firebase_messaging 17 and flutter_local_notifications **22**. Don't upgrade to 23: it needs compileSdk 37.
  - Riverpod providers use `retry: (_, _) => null`.
  - 5 colour themes (`BrandPalette`: royal, ocean, emerald, coral, midnight).
- **Web app:** React Aria, Recharts, motion, jsPDF, a self-hosted icon font
  (`npm run icons`, checked at build time), and Supabase JS with PKCE.

---

## 4. Accounts, consoles and secrets

**No secret values are in git or in this file.** The owner holds them and
pastes them into consoles themselves. Never read, print or copy a key file;
use the scripts.

| Service | Account / ID | Notes |
|---|---|---|
| GitHub | `vistrowtechnologies-bit/revyne` | The new Claude account needs push access |
| Supabase | org "Vistrow Technologies", project `qokgcupkabyzdqmgtgdp` | The owner logs in with the **RevYne** Chrome profile. The owner holds the DB password |
| Google Cloud | project `revyne-513306` (Vistrow org, vistrowtechnologies@gmail.com) | **Prophunt** Chrome profile. OAuth consent screen is External, **status Testing**: only listed test users can sign in. GBP API approved, 300 QPM |
| Firebase (FCM) | project `revyne-234e1` | **RevYne** Chrome profile. A separate project from `revyne-513306` |
| Vercel | account `revyneai-4419` | Projects `revyne` (owns revyneai.com and www; serves the website) and `revyne-app` (owner web app). Git-push deploys are blocked on this Hobby account, so deploy with the CLI |
| OpenAI | owner's account | Model default `gpt-5-mini`. A monthly spend limit isn't set yet |
| Domain | `revyneai.com` | Added to Vercel, but **DNS not pointed** at the registrar |

**Edge-function secrets** (Supabase → Edge Functions → Secrets; names only):
`GBP_TOKEN_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`,
`FCM_SERVICE_ACCOUNT_B64`, `OWNER_APP_ORIGINS`, `REVIEW_PAGE_ORIGINS`.
`SUPABASE_*` are built in. Vault holds `scheduler_secret` for the cron jobs.

**Local files that are gitignored and must be copied by hand** to a new machine:

- `apps/mobile/env/dev.json` (template: `env/example.json`)
- `apps/web-preview/.env.local` (template: `.env.example`)
- The Android **debug keystore**. Its SHA-1 is registered as the Android OAuth
  client, and Google sign-in fails on builds signed with any other key unless
  you register the new SHA-1 in `revyne-513306`.
- The Firebase service-account JSON. Only needed to rotate the FCM secret.

**Test accounts:**

- Owner test accounts: `prophuntllp@gmail.com` and `pranav28.nair@gmail.com`.
  `vistrowtechnologies@gmail.com` is also an OAuth test user.
- The real Google profile linked during testing belongs to a **real business**
  (Arthaleads). Nothing may be posted, replied to or edited there without the
  owner's explicit OK in chat.
- Dev seeds: `backend/supabase/dev-seed/test_business.sql` and `test_business_prophunt.sql`.

---

## 5. Run, build, deploy

**Android app** (Windows PC):

- Flutter is at `E:\dev\flutter`, the SDK at `E:\dev\android-sdk`, JDK 17 is Temurin.

```bash
cd apps/mobile
flutter run --dart-define-from-file=env/dev.json
flutter test
flutter analyze
flutter build apk --release --target-platform android-arm64 --dart-define-from-file=env/dev.json
```

- Set `ANDROID_HOME=E:\dev\android-sdk` and `JAVA_HOME` to the JDK 17.
- The test phone is a Realme RMX2156 on Android 12. It is low on storage, so
  install arm64 release APKs, not debug builds.
- Before tapping on the phone, check that RevYne is the app in front.
  Don't keep or describe screenshots that show other apps or notifications.

**Owner web app:**

```bash
cd apps/web-preview
npm install
npm run dev     # http://localhost:5175
npm run build   # icon check + tsc + vite
```

Deploy from `apps/web-preview`, linked to project `revyne-app`:

```bash
npx vercel deploy
npx vercel deploy --prod
```

The web origin must be in:

- the Supabase Auth redirect URLs,
- the Google web OAuth client's Authorized JavaScript origins,
- the `OWNER_APP_ORIGINS` secret.

**Website:**

```bash
node apps/website/dev-server.mjs     # http://localhost:5176
node apps/website/tools/sync-review-web.mjs
node apps/website/tools/apply-config.mjs
```

- Run `sync-review-web.mjs` after changing `apps/review-web`.
- Run `apply-config.mjs` after changing `site.config.js` (domain, Play link, email).
- Deploy from `apps/website` with the Vercel CLI, linked to project `revyne`.
  See `apps/website/README.md`.

**Review page alone:**

```bash
npx -y serve@14.2.4 -s apps/review-web -l 5173
```

**Backend** (from `backend/`):

```bash
npx supabase link --project-ref qokgcupkabyzdqmgtgdp
npx supabase db push
npx supabase functions deploy <name>
npx supabase functions deploy gbp-scheduler --no-verify-jwt
npx supabase functions deploy gbp-review-watch --no-verify-jwt
deno test supabase/functions/_shared
```

`supabase link` asks for the DB password, which the owner holds.

---

## 6. What is built (all on `main`, all against revyne-dev)

- **Sign-in:** Google sign-in. Native on Android; Supabase OAuth with PKCE on web.
- **Onboarding:** connect-only. Connect GBP, choose a location, set preferences.
- **Home:** the dashboard.
- **Google reviews:**
  - inbox with AI reply drafts in English, Hindi or Hinglish;
  - reply templates;
  - post a reply after confirming.
- **Google profile:**
  - Google Score with fix-it tasks;
  - editor for description (with AI), hours, holiday hours, phone and website;
  - "Google changed your profile" with keep or accept.
- **Posts and photos:**
  - update, offer and event posts, with AI text, a photo and a button;
  - photo upload, delete and full-size view;
  - scheduled posts.
- **Stats and reports:** Google stats (7/28/90 days or a custom calendar
  range) and monthly reports as PDF.
- **Get Reviews:** QR code and A5/A4 poster PDF, review link, WhatsApp single
  request, review-page settings (products, tone, languages).
- **Customer review page:** rate, highlights, AI draft, copy and post on
  Google, or send a private message. No gating.
- **Private messages:** inbox with read/unread, call or WhatsApp back, and delete.
- **Notifications:**
  - push for new Google reviews, private messages and scheduled-post results;
  - in-app notifications list with a bell.
- **Account:**
  - activity log, colour themes and profile photo (Google's or the user's own);
  - help, legal links, in-app account deletion.
- **Android only:** branded splash, Back navigation, 12-hour clock dial, app icon.
- **Web:** sidebar layout on wide screens and phone layout when narrow.
- **Website:** home with live phone mockups in all 5 themes,
  pricing ("coming soon"), about, contact, privacy and terms (drafts),
  delete-account, `/r/<code>`.

---

## 7. Known issues and gotchas

- **CORS for the review page:** `REVIEW_PAGE_ORIGINS` may not include
  `https://revyne-pied.vercel.app` or `http://localhost:5176`. Without them,
  AI drafts and private messages on those origins fail. Check the current
  value and ask the owner before overwriting the secret.
- **Account deletion leaves files:** `account-delete` doesn't remove the
  user's files in the `gbp-media` and `avatars` buckets.
- **Legal links:** the Android app still points to vistrow.com. See
  `account_screen.dart:25-27` and `sign_in_screen.dart:128-130`. Move them to
  revyneai.com once the domain is live.
- **Delay on new reviews:** a new Google review can take about 25 minutes to
  appear in the API.
- **Encoding:** never rewrite source files with PowerShell
  `Get-Content`/`Set-Content`. It corrupts `· – — ★ ₹` into mojibake. Use the
  editor tools or Python with UTF-8.
- **Git stash:** `stash@{0}` is a known-bad script output kept for reference;
  `stash@{1}` is an old backup. Don't apply either.
- **Untracked folder:** `.well-known/` is deliberately never committed.
- **Snackbars:** Flutter keeps a snackbar that has an action on screen; we set
  `persist: false`.

---

## 8. Checklist: not done yet

### A. Before or while switching accounts (do these first)

1. [x] Website branch merged into `rebuild` (21 Nov).
2. [x] `HANDOFF.md` and `CLAUDE.md` committed and `rebuild` pushed (21 Nov).
3. [x] `main` fast-forwarded to `rebuild` and pushed (26 Nov). `main` is now the working branch.
3. [ ] Give the new Claude account access: GitHub push access, and Vercel /
   Supabase CLI logins done by the owner.
4. [ ] Copy the gitignored local files in section 4 to the new machine. If
   the debug keystore can't move, register the new SHA-1 in `revyne-513306`.
5. [ ] Recreate `.claude/launch.json` if previews are wanted. Ports:
   - review-web 5173
   - stitch-designs 5174
   - web app 5175
   - website 5176
   - flutter-web 5177

### B. Verify (built but not confirmed end to end)

- [ ] **On the phone:**
  - splash, notifications bell, reply templates;
  - the 17–18 Nov Android changes: new sign-in, Home dashboard, skeletons,
    charts, Google changes, photos viewer, sheet scrolling.
- [ ] **Scheduled posts:** a scheduled post publishing itself end to end. So
  far only scheduling, cancelling and the cron 200 response are confirmed.
- [ ] **Web connect:** connecting a Google profile on https://revyne-app.vercel.app,
  using the popup with `postmessage`. The origin needs the settings listed in
  section 5.
- [ ] **RLS:** a test with two different accounts.

### C. Launch blockers

- [ ] Point the `revyneai.com` DNS at Vercel (`npx vercel domains inspect revyneai.com`).
- [ ] Deploy the website to production in project `revyne`. This replaces
  the old root site.
- [ ] Set `site.config.js` `origin` to `https://revyneai.com`, then run `apply-config.mjs`.
- [ ] Optionally serve the web app at `app.revyneai.com`, which is already in
  `OWNER_APP_ORIGINS`.
- [ ] Legal review of the privacy and terms drafts. Point the app's legal
  links at revyneai.com.
- [ ] Google Search Console domain verification.
- [ ] OAuth branding: logo, homepage, policy links, authorised domain.
- [ ] **OAuth verification** with a demo video. Until then, sign-in is limited
  to test users (max 100).
- [ ] OpenAI monthly spend limit (owner).
- [ ] Create `revyne-prod` (Mumbai, Pro plan). Push migrations, deploy
  functions, set secrets, update the env files.
- [ ] Play Console organisation account for Vistrow (needs a D-U-N-S number).
- [ ] Upload keystore, backed up in 2 places.
- [ ] Register the Play App Signing SHA-1 as an Android OAuth client.
- [ ] Data safety form, content rating and listing, then internal → closed →
  production testing.
- [ ] Set `playStoreUrl` in the website config once the listing is live.

### D. Features not built

- [ ] **Plans and billing:**
  - Play Billing subscriptions with server verification (Play Developer API / RTDN);
  - plans/upgrade screen and billing history;
  - real pricing page;
  - the payment decision (Play Billing ± Razorpay) is not recorded yet.
- [ ] App language picker and translated UI (Hindi and others).
- [ ] Competitor or nearby comparison for the Google Score. Needs Places API
  (New), billing and a restricted key.
- [ ] Change alerts within 48 hours. The "Google changed your profile" screen
  exists, but there's no push alert yet.
- [ ] Crash monitoring (Crashlytics) and CI (tests and analyze on push).
- [ ] Phase 4:
  - bulk WhatsApp campaigns (WhatsApp Cloud API);
  - Pub/Sub instead of polling for review alerts;
  - other growth items in `IMPLEMENTATION_PLAN.md`.

### E. Clean-up

- [ ] Fix `account-delete` so it removes the user's storage files.
- [ ] Fix `REVIEW_PAGE_ORIGINS` (section 7).
- [ ] Remove the legacy root app, `backup-before-codex-reset.patch` and
  `tmp_qr_pdf_page.png` once the new website is live.
- [ ] Decide whether to drop `apps/mobile/web` (the Flutter web target),
  since React is the web app.
- [ ] Update `IMPLEMENTATION_PLAN.md` checkboxes from this file.

---

## 9. Suggested first session on the new account

1. Read `CLAUDE.md`, this file and `IMPLEMENTATION_PLAN.md`.
2. `git fetch` and check out `main`. Confirm `apps/website` is present.
3. Run the checks:
   - `flutter analyze` and `flutter test` in `apps/mobile`;
   - `npm run build` in `apps/web-preview`;
   - `deno test` in `backend/supabase/functions/_shared`.
4. Ask the owner which list to start: 8B (verify), 8C (launch) or 8D (features).
