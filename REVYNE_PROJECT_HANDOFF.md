# RevYne AI Project Handoff

Last updated: 7 July 2026
Workspace: `/Users/mac15/BRANDS/Revyen` (macOS)
Live web app: `https://revyne-pied.vercel.app/`
Planned brand domain: `revyneai.com` (not wired up yet — see Blockers)
Product name: **RevYne / RevYne AI**
GitHub: `vistrowtechnologies-bit/revyne` (branch `main`)

This doc is written for a cold handoff — assume the reader (human or AI) has never seen this project before.

---

## 1. Product Summary

RevYne is an AI-powered review assistant for small and medium businesses, focused on the Indian market. It has two audiences:

1. **Business owners** — the primary app users. They get a QR/link customers scan to leave reviews, an AI Smart Reply tool for responding to reviews professionally, and (new) direct Google Business Profile management (health score, post updates, reply to Google reviews from inside the app).
2. **Customers** — a lightweight public page (no login) where they rate their experience and get AI-drafted review text they can copy onto Google.

**Positioning, non-negotiable:** RevYne helps people write *honest* reviews faster. It must never be framed as generating fake reviews, gating negative feedback, or manipulating ratings. AI output is always an editable draft, never auto-posted without the human's explicit action.

Target customers: local Indian SMBs — restaurants, salons, clinics, real estate agents, hotels, gyms, retail, etc. Free plan + three paid tiers (₹149/mo, ₹199/mo, ₹999/yr) via Razorpay.

---

## 2. Two Codebases — Both Live, Both Maintained

### 2a. Web app (repo root)
Static HTML/CSS/JS, no build step, no framework.
- `index.html`, `styles.css`, `app.js` (~5,900 lines — all app logic and rendering lives here), `supabase-config.js`, `manifest.webmanifest`, `sw.js` (service worker)
- Hosted on **Vercel**, deploys automatically on push to `main`
- `api/` folder: three Vercel serverless functions that proxy to Supabase edge functions (Razorpay create/cancel subscription, support email) — kept thin, just auth-header passthrough
- This is a PWA (installable, has a service worker) but is **not** what people mean by "the app" going forward — the native Android app (below) is the primary mobile product now.

### 2b. Native Android app (`mobile/`)
**Flutter** — compiles to real native ARM machine code, no webview, no PWA wrapper of any kind. This was a deliberate migration away from a PWA/TWA approach.
- Package: `com.revyne.revyne_app`
- Entry point: `mobile/lib/main.dart` → `AuthGate` routes between login → onboarding → `HomeShell` (5-tab bottom nav) based on Supabase session + whether a `businesses` row exists for the user (server-side truth, never a local flag — this was a deliberate fix for a recurring "onboarding wizard shows again" bug in the web app).
- UI was redesigned end-to-end from a Google Stitch export to match an exact design system (colors, type scale, component library) — see `mobile/lib/config.dart` (`AppColors`, `AppRadius`, `AppSpacing`, `RevyneTheme`) and `mobile/lib/widgets/ui.dart` (shared components: `AppCard`, `MetricTile`, `ScoreRing`, `StepDots`, `SelectChip`, `StatusPill`, `EmptyState`).
- Screens (`mobile/lib/screens/`): `auth_screen`, `onboarding_screen` (3-step wizard), `dashboard_screen`, `smart_reply_screen`, `business_screen`, `gmb_screen`, `pricing_screen`, `order_history_screen`, `support_screen`, `profile_screen`, `home_shell` (the 5-tab scaffold: Home / AI Reply / Business / Google / Profile).
- Services (`mobile/lib/services/`): `business_service.dart` (Business/UserProfile/DashboardStats/SupportTicket/PaymentEvent models + all Supabase table CRUD), `gmb_service.dart` (Google Business Profile integration, see §4).
- Talks to the **same Supabase backend** as the web app — no server-side duplication. Razorpay checkout on mobile opens the hosted Razorpay payment link in the system browser (via `create-razorpay-subscription`'s `shortUrl`) rather than embedding the native Razorpay SDK.

---

## 3. Backend (shared by both apps)

- **Supabase** (project ref `dbqizpephewiefvghenr`, project name `revyne-prod`): Postgres, Auth (Google OAuth provider), Edge Functions, Storage.
  - Migrations: `supabase/migrations/*.sql` — 17 migrations, latest is `20260703000000_protect_billing_columns.sql` (see §5, Security).
  - Edge functions (`supabase/functions/`): `generate-ai` (OpenAI calls for review suggestions + smart replies, server-side plan-limit enforcement, rate limiting), `gmb-connect` (Google Business Profile OAuth/session management), `gmb-api` (reviews, health score, posts, replies, SEO description), `create-razorpay-subscription`, `cancel-razorpay-subscription`, `razorpay-webhook` (signature-verified, idempotent), `send-support-email`.
  - Key tables: `profiles`, `businesses`, `review_requests`, `generated_reviews`, `smart_replies`, `support_tickets`, `payment_events`, `usage_limits`, `analytics_events`, `gmb_tokens` (service-role only), `gmb_reviews`.
- **OpenAI** (`gpt-5-nano` via `generate-ai`) for review suggestions and smart replies.
- **Razorpay** — subscriptions, currently believed to be in test mode; full payment lifecycle (failed/abandoned/refund) is **not yet tested**, only the happy path.
- **Google Cloud project**: `revyne-494711` (owned by `revyneai@gmail.com`), project number `390263564292`. Has two Android OAuth clients registered ("RevYne Android Debug" — SHA-1 of `~/.android/debug.keystore`; "RevYne Android Release" — SHA-1 of `~/.android-keys/revyne-upload-keystore.jks`) plus a Web OAuth client used as `serverClientId`. OAuth consent screen is in **Testing** status with test users added (see §6).

---

## 4. Google Sign-In & GMB Architecture (native app) — read this before touching auth code

Both the app's login and its Google Business Profile connect flow use **`google_sign_in` v7's native Credential Manager API** — `GoogleSignIn.instance.authenticate()` for login, `account.authorizationClient.authorizeScopes([...])` for incremental GMB authorization. **This is not a browser redirect flow.**

This was a deliberate architecture correction (was originally built as browser-based OAuth with a custom URL scheme redirect, then rebuilt): **Google blocks custom-scheme redirects (`io.revyne.app://...`) for "Android"-type OAuth clients** on the classic browser/PKCE flow — it throws `Error 400: invalid_request... doesn't comply with Google's OAuth 2.0 policy`. Native Credential Manager sidesteps this entirely and is also the modern recommended approach (one-tap sign-in, no browser bounce).

Practical implications:
- `mobile/lib/config.dart` has `googleWebClientId` (a Web-type OAuth client ID, used as `serverClientId` so the ID token audience matches what Supabase's Google provider expects) — this is the **only** client ID referenced anywhere in the Dart code.
- There is **no Android client ID anywhere in the code**, and there doesn't need to be — Google's Credential Manager matches the calling app by package name + signing certificate SHA-1 against whichever Android-type OAuth clients are registered in Cloud Console. Debug builds match the Debug client, release builds match the Release client, automatically, with zero code difference. (An earlier note in this doc/memory claiming "swap `googleGmbClientId` to release before shipping" was based on a misunderstanding — that field was dead code and has been removed. Nothing needs to change in code for release builds.)
- `mobile/lib/services/gmb_service.dart`'s `startConnect()` requests the `business.manage` scope via `authorizeScopes()`, gets an access token, and hands it to the `gmb-connect` edge function's `use_provider_token` action (which verifies the scope server-side and lists the account's GMB locations). The `exchange_token` action in `gmb-connect` still exists in the edge function but is now **dead code** — it was for the old browser-PKCE flow and nothing calls it anymore.
- The `io.revyne.app://login-callback` deep link intent-filter is still declared in `AndroidManifest.xml` but its browser-redirect purpose no longer applies now that login is native Credential Manager — it may be vestigial (not yet cleaned up, not causing harm).

---

## 5. Native App Build & Signing

Toolchain lives entirely outside package managers (no Homebrew on this Mac):
- Flutter SDK: `~/development/flutter` (3.44.4 stable)
- JDK 17: `~/development/jdk17/Contents/Home`
- Android SDK: `~/development/android-sdk`
- Supabase CLI: `~/development/supabase-cli/supabase` (manually downloaded — the official tarball's default `supabase` binary is broken/Bun-based; the `supabase-go` binary from the same tarball, renamed, works)

Build command pattern:
```
cd mobile
JAVA_HOME=~/development/jdk17/Contents/Home ~/development/flutter/bin/flutter build apk --release
JAVA_HOME=~/development/jdk17/Contents/Home ~/development/flutter/bin/flutter build appbundle --release
```

**Release signing is fully configured and working.** A real upload keystore was generated at `~/.android-keys/revyne-upload-keystore.jks` (password in `~/.android-keys/revyne-keystore-credentials.txt`, both outside the repo, both `chmod 600`, both git-ignored by Flutter's default `.gitignore` rules). `mobile/android/app/build.gradle.kts` reads `android/key.properties` (also git-ignored) for the release `signingConfig`, falling back to the debug key if that file is absent. Both `app-release.apk` and `app-release.aab` build and verify correctly (`apksigner verify` confirms v2 scheme signing).

**Do not lose the keystore file or its password** — Google Play will not allow app updates to the same listing without it; there is no recovery path.

Tested end-to-end on a real device (Android 15) and an emulator: app renders correctly, Google Sign-In button correctly opens the native account picker and reaches Google's real consent screen for this Supabase project.

---

## 6. Current Blockers (ranked by what's actually stopping progress)

1. **GBP API access request was rejected** (submitted 2026-07-06 via the official request form using Marketix Studio's verified 60+ day GBP as the qualifying business; rejected ~15 hours later with a generic "did not pass internal quality checks" message, case ID `2-3234000040978`). Best-guess cause: the company website field was filled with the bare Vercel URL (`revyne-pied.vercel.app`) rather than a real custom domain, which likely reads as untrustworthy to Google's automated quality check. **Until this is approved, every GMB connect attempt in the app will succeed at auth but return "no business found" for anyone** — `mybusinessaccountmanagement.googleapis.com` / `mybusinessbusinessinformation.googleapis.com` quota is hard-capped at 0 until Google approves. Do not resubmit immediately (looks worse to automated review); fix the underlying issue first.
2. **Custom domain `revyneai.com` is not live.** This is the fix for #1, and also needed generally for a credible production launch (OAuth consent screen branding, Play Store listing, etc. all reference this domain eventually). Currently everything points at the Vercel-assigned subdomain.
3. **Razorpay payment lifecycle is only happy-path tested.** Failed payments, abandoned checkouts, refunds, upgrade/downgrade transitions are unverified.
4. **OAuth consent screen cosmetic bug**: "Authorized domain 1" has a typo (`dbqizpepheview fvghenr.supabase.co` vs. the real `dbqizpephewiefvghenr.supabase.co`, which is correctly listed as domain 2). Harmless, not yet fixed.
5. Consent screen is still in **Testing** status (not published) — test users added: `prophuntllp@gmail.com`, `7777abhighadge@gmail.com`, `marketixstudio@gmail.com`, `abhighadge1509@gmail.com`. Needs to move to production/verified once ready to launch publicly.

---

## 7. Security Work Already Done (as of this handoff)

These were real vulnerabilities found and fixed, not hypothetical:
- **Client-side plan self-upgrade**: users could previously run `supabase.from('profiles').update({plan:'pro_max'})` from the browser console to get a paid plan for free. Fixed via `20260703000000_protect_billing_columns.sql` — a Postgres trigger locks `plan`/`plan_status`/`is_admin`/Razorpay ID columns (and `businesses.owner_plan*`) to service-role-only writes. Deployed to production.
- **Monthly AI generation limits were browser-only** (bypassable by calling the edge function directly). Now enforced server-side in `generate-ai` with a stable per-user rate-limit key (JWT `sub`, not a token fragment that resets on refresh).
- **Exposed credentials rotated**: a Supabase personal access token and the database password that had been pasted into a terminal session were both revoked/reset and replaced. New values are stored in `~/.supabase-keys/` (chmod 600, outside the repo) — never re-paste these into any chat, doc, or commit.
- Razorpay webhook signature check upgraded to constant-time comparison.
- Public review page now looks up the business strictly by public token (was previously look-up-by-name, which could misattribute reviews to a same-named business).

Still on the list, not yet done: full Supabase Security Advisor pass, RLS policy audit beyond what's covered above.

---

## 8. What's Fully Working Right Now

- Web app: full onboarding, business profile CRUD, public QR review page, AI review suggestions, Smart Reply, Razorpay checkout (happy path), support tickets, admin ticket queue, GMB integration (browser-based on web, unaffected by the native app's architecture change), analytics events.
- Native Android app: Google Sign-In (native, verified working on real hardware), server-truth onboarding, dashboard with live stats/QR/WhatsApp share, Smart Reply, Business Profile editor, Pricing/Order History/Support screens, Profile with a genuinely functional 5-theme switcher. GMB screen UI and API plumbing are complete and correct — only blocked by Google's pending API approval (§6.1), not by anything in this codebase.
- Signed release APK/AAB, ready to sideload or eventually submit to Play Store once the domain and GBP approval land.

## 9. What Codex (or anyone else picking this up) Should NOT Assume

- Don't assume the web app and native app share UI code — they don't; they're two independent frontends against one Supabase backend, kept in sync by convention, not by shared code.
- Don't re-add a browser-based OAuth flow for GMB or login on the native app — read §4 first, it explains exactly why that was replaced.
- Don't treat `googleGmbClientId` or any Android client ID as something to configure in Dart — there isn't one, by design.
- Don't assume secrets are recoverable from this doc or from chat history — the actual values live only in `~/.android-keys/` and `~/.supabase-keys/` on this Mac, both outside the repo.
