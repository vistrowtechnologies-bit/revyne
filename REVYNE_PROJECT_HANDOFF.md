# RevYne AI Project Handoff

Last updated: 9 May 2026  
Workspace: `E:\AI REVIEW`  
Live app/testing URL: `https://revyne-pied.vercel.app/`  
Planned brand domain: `revyneai.com`  
Product name: **RevYne / RevYne AI**

## 1. Product Summary

RevYne is an AI-powered review assistant for businesses. The product helps real customers express genuine experiences clearly and helps businesses draft professional replies to customer reviews.

Important positioning:

- Do not present the product as generating fake reviews.
- It should help customers write honest, real feedback.
- It should stay aligned with Google review policies.
- AI output should be framed as editable suggestions, not guaranteed or fabricated reviews.

Target customers include local Indian businesses such as doctors, clinics, hotels, real estate, salons, restaurants, service providers, and similar SMBs.

## 2. Current Technology Stack

Frontend:

- Static HTML/CSS/JavaScript app.
- Main files:
  - `index.html`
  - `styles.css`
  - `app.js`
  - `supabase-config.js`
  - `manifest.webmanifest`
  - `sw.js`
- No React/Next.js yet.

Hosting:

- Vercel.
- Production deploy is done through Vercel CLI.
- `vercel.json` contains basic security headers.

Backend:

- Supabase Auth.
- Supabase Postgres.
- Supabase Edge Functions.
- Vercel serverless API routes in `/api`.

Payments:

- Razorpay test mode integration.
- Subscription creation and webhook handling have been implemented.

AI:

- OpenAI API is called from Supabase Edge Function `generate-ai`.
- Model secret was set to a low-cost model, currently intended as `gpt-5-nano`.

PWA/App:

- PWA manifest and service worker exist.
- PWABuilder package was generated for Android testing.
- App icon assets exist in `assets/`.

## 3. Key Project Files

Core app:

- `index.html`: App shell, meta tags, scripts, manifest, favicon links.
- `styles.css`: All UI styling, responsive desktop/mobile behavior, bottom nav, cards, pricing, profile, business forms.
- `app.js`: Main application logic, state, routing, Supabase auth/data, AI calls, Razorpay flows, support tickets, rendering.
- `supabase-config.js`: Public Supabase URL and publishable key.

PWA/assets:

- `manifest.webmanifest`: PWA metadata, icons, screenshots, shortcuts, share target, launch handler.
- `sw.js`: Service worker cache strategy.
- `assets/favicon.png`
- `assets/apple-touch-icon.png`
- `assets/revyne-icon-192.png`
- `assets/revyne-icon-512.png`
- `assets/screenshot-mobile.png`
- `assets/screenshot-wide.png`

Vercel API routes:

- `api/create-razorpay-subscription.js`
- `api/cancel-razorpay-subscription.js`
- `api/send-support-email.js`

Supabase Edge Functions:

- `supabase/functions/generate-ai/index.ts`
- `supabase/functions/create-razorpay-subscription/index.ts`
- `supabase/functions/cancel-razorpay-subscription/index.ts`
- `supabase/functions/razorpay-webhook/index.ts`
- `supabase/functions/send-support-email/index.ts`

Supabase migrations:

- `supabase/migrations/20260430000000_support_tickets.sql`
- `supabase/migrations/20260430001000_admin_support_queue.sql`
- `supabase/migrations/20260430002000_security_advisor_cleanup.sql`
- `supabase/migrations/20260502000000_analytics_events.sql`
- `supabase/migrations/20260502001000_rate_limits_and_bug_reports.sql`
- `supabase/migrations/20260505000000_payments_schema.sql`
- `supabase/migrations/20260505001000_service_role_payment_grants.sql`
- `supabase/migrations/20260508000000_payment_lifecycle_hardening.sql`
- `supabase/migrations/20260508001000_security_warning_followup.sql`
- `supabase/migrations/20260508002000_business_persistence_fix.sql`

Reference/security:

- `SECURITY_LAUNCH_RUNBOOK.md`
- `robots.txt`
- `sitemap.xml`

## 4. Supabase Project

Project ref:

```text
dbqizpephewiefvghenr
```

Project URL:

```text
https://dbqizpephewiefvghenr.supabase.co
```

Public publishable key is stored in `supabase-config.js`.

Do not commit or expose these secrets:

- Supabase service role key
- OpenAI API key
- Razorpay key secret
- Razorpay webhook secret
- Email provider secret/API key

## 5. Database Tables Currently Used

Main tables:

- `profiles`
- `businesses`
- `review_requests`
- `generated_reviews`
- `smart_replies`
- `usage_limits`
- `support_tickets`
- `analytics_events`
- `payment_events`

Important behavior:

- `profiles` stores auth/profile/payment plan data.
- `businesses` stores each user business profile and public review page data.
- `review_requests` stores customer public review attempts.
- `generated_reviews` stores AI review suggestions generated for public review flow.
- `smart_replies` stores AI business reply drafts.
- `usage_limits` tracks usage/rate limiting.
- `support_tickets` stores customer support tickets and admin replies.
- `analytics_events` stores page/event tracking.
- `payment_events` stores Razorpay webhook/payment/subscription events.

## 6. Auth Flow

Current auth:

- Google login through Supabase Auth.
- Guest/demo login still exists for testing.
- On Google login, the app fetches the user profile and business profile from Supabase.
- A `profiles` row is created/updated for the user.

Known recent fix:

- Business details were vanishing after login/refresh because the app reset `state.business` before Supabase business data loaded.
- This was fixed by not clearing business state during session restore and by loading the latest business by `owner_id`.
- Migration `20260508002000_business_persistence_fix.sql` added persistence support for:
  - `service_types`
  - `business_logo`
  - owner select/insert/update policies on `businesses`

Important follow-up:

- If a user's old business existed only in localStorage and was never saved to Supabase, that user must save it once again.
- After saving, the same Google account should retain business details.

## 7. App Routing and Views

The app uses client-side state and hash-based public routing.

Main authenticated views:

- Dashboard
- Smart Reply
- Pricing
- My Business
- Profile
- About RevYne
- Order History
- Help & Support
- Terms & Privacy
- Admin Support for admin user

Public route:

- `/#review` opens the public customer review page.

Navigation:

- Desktop uses top header navigation.
- Mobile uses sticky header and bottom tab navigation.
- The header should stay sticky on mobile.
- Avoid adding large desktop sidebars or huge hero blocks; the user wants a clean dashboard.

## 8. Business Profile Logic

The business profile supports:

- Profile picture/logo upload
- Business name
- Category dropdown
- City
- Google Review URL
- Keywords
- Services
- Service/type personalization for Pro Max
- Language
- Tone
- Mobile number

Categories include Indian SMB categories such as:

- Real Estate
- Restaurant
- Salon & Beauty
- Healthcare Clinic
- Education & Coaching
- Car & Bike Service
- Electronics & Appliances
- Home Services
- Travel & Transport
- Hotel & Stay
- Fitness & Gym
- Retail Store
- Jewellery
- Event & Wedding Services
- Legal & Finance
- IT & Digital Services
- Driver Service
- Other

Pro Max personalization:

- Pro Max users can define up to 5 main services.
- The second field changes based on category. Example:
  - Real Estate -> property type
  - Restaurant -> cuisine/order type
  - Healthcare -> consultation/treatment type
  - Other -> type or requirement
- These fields should only appear on the public customer page when the business owner has an active Pro Max or Pro Yearly plan.
- Free/Pro customers should not show locked Pro Max fields to end customers.

Google Review URL info button:

- An info button was added near the Google Review URL field.
- It should explain how the business owner can get their Google review link.

## 9. Public Review Page

Purpose:

- A customer scans a QR/link and opens the business public review page.
- They choose a star rating and write their real experience.
- RevYne generates honest review suggestions.
- Customer can copy and post to Google.

Behavior:

- Uses business data loaded by public token.
- Customer review requests are saved to Supabase.
- Generated reviews are saved to Supabase.
- Google review button opens the owner's saved Google Review URL.

Important policy:

- Never imply fake reviews.
- Keep wording like "AI-generated suggestion, feel free to edit before posting."

## 10. Smart Reply Page

Purpose:

- Business owner pastes a real customer review.
- App generates professional business replies.

Current behavior:

- Uses OpenAI through `generate-ai`.
- Saves generated replies to `smart_replies`.
- Uses usage limits.
- Earlier bug where customer name vanished when star rating changed was fixed.

Remaining improvement:

- Continue optimizing AI speed and token cost.
- Add clearer loading state if generation takes 5-6 seconds.

## 11. Pricing and Plans

Current plan structure:

Free:

- Rs 0/month.
- Basic testing/review collection.
- Limited AI suggestions.

Pro Monthly:

- Rs 149/month.
- Active local businesses.
- More AI reviews/replies.
- Editable services and keywords.
- Multi-language support including Marathi.
- Tone customization.

Pro Max Monthly:

- Rs 199/month.
- Adds service/type selection on public review page.
- Adds deeper SEO-friendly review drafts.
- Intended for businesses wanting hyper-personalized review output.

Pro Yearly:

- Rs 999/year.
- Lower annual price for long-term use.
- Similar high-tier access.

Important:

- "Free Website" was removed from all feature lists.
- Pricing page has had UI work but still needs a final responsive QA pass.
- User reported bottom nav animation glitches in pricing earlier; some fixes were applied, but re-test on real mobile.

## 12. Razorpay Integration

Razorpay is currently in test mode.

Implemented:

- Create subscription checkout/payment link flow.
- Razorpay payment page opens.
- Test payment succeeded.
- Webhook updates the user's `profiles.plan`.
- Plan changed to Pro Monthly after payment.
- Payment events show in database/order history.
- Cancel subscription endpoint exists.

Relevant files:

- `api/create-razorpay-subscription.js`
- `api/cancel-razorpay-subscription.js`
- `supabase/functions/razorpay-webhook/index.ts`
- `supabase/functions/create-razorpay-subscription/index.ts`
- `supabase/functions/cancel-razorpay-subscription/index.ts`

Important known issue:

- Razorpay test mode can show payment success behavior unexpectedly during testing.
- Need a full test matrix:
  - successful payment
  - abandoned checkout
  - failed payment
  - webhook not received
  - duplicate webhook
  - cancel subscription
  - downgrade
  - upgrade Pro to Pro Max

Razorpay dashboard details:

- Website/app was approved for `https://revyne-pied.vercel.app`.
- API keys were saved by the user.
- Plan IDs were created and saved as Supabase/Vercel secrets.
- Webhook secret was created and saved.

Do not expose keys in code.

## 13. Support System

Implemented:

- Normal user Help & Support page.
- User can raise support tickets from profile.
- Support categories include:
  - general
  - bug report
  - login/account access
  - payment/subscription
  - AI generation
  - review page/QR
  - business profile
- Admin Support page exists for admin users.
- Admin can view tickets, change status, assign owner, add reply, and close tickets.
- `revyneai@gmail.com` was approved as admin.

Remaining:

- Add email notification when:
  - customer creates ticket
  - admin replies
  - ticket status changes
- Improve support ticket conversation thread model. Current implementation is more single-ticket plus admin response.

## 14. Analytics

Implemented:

- `analytics_events` table.
- Page tracking.
- User event tracking.
- Client error tracking.

Remaining:

- Build an admin analytics view.
- Track funnel metrics:
  - login started/completed
  - business profile saved
  - QR opened
  - review generated
  - copy clicked
  - Google button clicked
  - pricing viewed
  - checkout started/completed/failed

## 15. SEO and Legal

Implemented:

- Meta description and OG tags were added.
- `robots.txt`
- `sitemap.xml`
- Terms & Conditions page.
- Privacy Policy page.

Remaining:

- Update sitemap/domain once final domain `revyneai.com` is live and stable.
- Submit to Google Search Console after DNS is ready.
- Add cookie consent if targeting EU/GDPR users.
- Review legal pages with a legal professional before launch.

## 16. PWA and Android APK

Implemented:

- `manifest.webmanifest`
- `sw.js`
- App icon files
- Screenshots
- PWA shortcuts
- Share target
- Launch handler
- Protocol handler
- PWABuilder package was created successfully.

Remaining before Play Store:

- Buy/finalize domain.
- Configure production OAuth redirects.
- Verify Digital Asset Links for TWA if using PWABuilder/Trusted Web Activity.
- Create final package name, likely `com.revyneai.app`.
- Add Play Store listing assets:
  - short description
  - full description
  - screenshots
  - feature graphic
  - privacy policy URL
  - support email
- Ensure app opens in polished mobile layout and not raw unstyled HTML.

## 17. Deployment Workflow

Local workspace:

```powershell
cd "E:\AI REVIEW"
```

Deploy frontend to production:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npx vercel deploy --prod
```

Apply Supabase migrations:

```powershell
npx supabase db push --yes
```

Deploy Supabase function example:

```powershell
npx supabase functions deploy generate-ai --project-ref dbqizpephewiefvghenr
```

Some functions were deployed with JWT verification disabled because they are called by external services or need public callback access:

```powershell
npx supabase functions deploy razorpay-webhook --project-ref dbqizpephewiefvghenr --no-verify-jwt
```

Use care before disabling JWT verification. Only do it for endpoints that verify their own secret/signature, such as Razorpay webhooks.

## 18. Current UI Direction

The user prefers:

- Clean dashboard.
- No huge desktop left sidebar.
- Header with small favicon/logo before RevYne brand.
- Desktop top nav.
- Mobile sticky header and fixed bottom navigation.
- No skeleton screens in this app.
- No unnecessary page headings repeated for every menu.
- Rename desktop header "Edit Business" to "My Business".
- Remove "Order History" from desktop header menu but keep it accessible inside Profile.
- Fix desktop padding so content does not feel too narrow or floating with too much unused space.

Recent UI issues to re-check:

- Mobile scrolling got stuck after desktop UI edits.
- Header should be sticky on mobile.
- All pages should scroll normally.
- Desktop pricing page still looked too padded and had redundant page label.
- Profile desktop layout may need polish.

## 19. Security Notes

Already added:

- Vercel security headers:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Supabase RLS policies for main user-owned data.
- Security cleanup migrations.
- Rate limit related migration.

Still needs final review:

- Supabase Security Advisor warnings.
- RLS policy expressions that may be overly permissive.
- Security definer functions.
- Leaked password protection setting.
- Public read policy for business public review links.
- All no-JWT functions must verify a trusted secret/signature.
- Ensure service role key is never used in frontend.

## 20. Environment Variables and Secrets

Secrets exist in Supabase/Vercel but should be checked before production:

OpenAI:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Razorpay:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- Razorpay plan IDs for Pro Monthly, Pro Max Monthly, Pro Yearly

Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- public anon/publishable key

Email:

- Email API/provider key if using notification emails.

Never put private secrets in:

- `index.html`
- `app.js`
- `styles.css`
- `supabase-config.js`
- `manifest.webmanifest`

## 21. What Has Been Made So Far

Completed or mostly completed:

- Brand renamed from ReviewPilot AI to RevYne.
- Static MVP turned into a real connected app using Supabase.
- Google auth through Supabase.
- User profile creation and restoration.
- Business profile save/load.
- Public review page.
- QR/review link flow.
- AI review suggestion generation.
- Smart reply generation.
- AI outputs saved to Supabase.
- Pricing plans and Pro Max plan.
- Pro Max personalized service/type fields.
- Razorpay subscription creation and webhook plan update.
- Order/payment event storage.
- Basic order history.
- Help & Support ticket system.
- Admin support dashboard.
- Analytics events/page tracking.
- Legal pages.
- SEO basics.
- PWA manifest/service worker/icons/screenshots.
- APK/PWABuilder test package generation.
- Logo/favicon assets added.
- Mobile and desktop responsive work done in multiple rounds.

## 22. What Is Left Before Production

Highest priority:

1. Final UI QA on mobile and desktop.
   - Fix mobile scroll stuck issue.
   - Keep mobile header sticky.
   - Fix desktop padding.
   - Remove redundant menu headings.
   - Remove Order History from header.
   - Keep Order History inside Profile.

2. Payment lifecycle hardening.
   - Confirm checkout success/failure/abandoned cases.
   - Confirm webhook idempotency.
   - Confirm plan update after payment.
   - Confirm cancel/downgrade/upgrade flows.
   - Improve user-facing messages after returning from Razorpay.

3. Production domain setup.
   - Buy/configure `revyneai.com`.
   - Add Vercel DNS/domain.
   - Update Supabase site URL.
   - Update Supabase OAuth redirect URLs.
   - Update Google Cloud OAuth redirect URIs.
   - Update Razorpay approved website/app URL if needed.
   - Update sitemap and robots.

4. Play Store readiness.
   - Final APK/AAB.
   - Digital Asset Links.
   - Privacy policy URL.
   - Store listing assets.
   - Test on multiple Android phones.

5. Security final pass.
   - Resolve or document Supabase Security Advisor warnings.
   - Review every RLS policy.
   - Ensure no secrets in frontend.
   - Add stronger rate limits to AI/payment/support endpoints.

6. Support polish.
   - Email notifications for tickets and admin replies.
   - Better ticket conversation history.

7. Analytics/admin views.
   - Add admin dashboard for active users, events, payments, failed webhooks, support tickets.

8. Legal and compliance.
   - Legal review of Terms and Privacy.
   - Cookie consent if needed.
   - Business policy language for review generation.

## 23. Known Bugs / Risks

Recent reported or likely issues:

- Mobile view scroll can get stuck after desktop layout edits.
- Desktop pages have too much padding or narrow centered content in some views.
- Business details used to vanish; fix was deployed, but should be tested with same Google account after fresh login/refresh.
- `revyneai.com` DNS may not be fully stable yet.
- Vercel deployment URL may be protected while `revyne-pied.vercel.app` is the practical test URL.
- Razorpay test mode behavior can be confusing and must be tested carefully.
- If a user had old business data only in localStorage, they need to save it once to Supabase.

## 24. Suggested Next Steps for Claude

Start with these:

1. Open and understand `app.js`, `styles.css`, `index.html`.
2. Fix the current mobile scroll/header bug.
3. Polish desktop layout:
   - keep clean header
   - remove Order History from header
   - rename My Business
   - reduce padding/unused space
   - avoid redundant page labels
4. Test Google login refresh:
   - save business profile
   - refresh
   - logout/login same Gmail
   - verify data persists
5. Test public review route `/#review`.
6. Test Smart Reply generation and persistence.
7. Test Razorpay subscription in test mode.
8. Review Supabase Security Advisor and RLS policies.
9. Prepare final domain OAuth changes after domain purchase/DNS completion.

## 25. Important Product Rules

- Reviews must be honest and customer-led.
- AI suggestions should help clarity, not deception.
- Do not invent customer experiences.
- Always let users edit before posting.
- Do not hide that suggestions are AI-generated where relevant.
- Public review page should be simple for end customers.
- Business admin pages can be more detailed.

