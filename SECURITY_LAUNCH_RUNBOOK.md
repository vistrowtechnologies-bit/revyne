# RevYne Security Launch Runbook

Last updated: 2026-05-04

This runbook is the operational checklist for taking RevYne from MVP to production. Keep it updated whenever auth, payments, AI generation, storage, or deployment changes.

## Current Stack

- Frontend: static HTML/CSS/JavaScript hosted on Vercel
- Backend: Supabase Auth, Postgres, Row Level Security, and Edge Functions
- AI: OpenAI API through Supabase Edge Function `generate-ai`
- Payments: Razorpay subscription Edge Functions
- Support: Supabase `support_tickets` table and in-app admin support queue
- Analytics: Supabase `analytics_events` table

## Production Domains

Current temporary production URL:

- `https://revyne-pied.vercel.app`

Final domain to configure after purchase:

- `https://revyneai.com`
- `https://www.revyneai.com`

Do not finalize Google OAuth production redirects until the final domain is purchased and pointed to Vercel.

## Environment Secrets

Secrets must only live in Supabase/Vercel environment settings. Never put these in frontend files, GitHub, APKs, or screenshots.

Required Supabase Edge Function secrets:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_PLAN_PRO_MONTHLY`
- `RAZORPAY_PLAN_PRO_MAX_MONTHLY`
- `RAZORPAY_PLAN_PRO_YEARLY`

Rotation policy:

- Rotate OpenAI and Razorpay keys every 90 days.
- Rotate immediately if a key is pasted into chat, GitHub, a frontend file, or a public screenshot.
- After rotation, redeploy affected Edge Functions and test checkout/AI generation.

## Supabase Checklist

Authentication:

- Google OAuth enabled.
- Site URL should be final production domain after purchase.
- Redirect URLs should include final production domain and local development URLs.
- Disable auth providers that are not used.

Database:

- RLS must be enabled on all customer/business/support/payment/analytics tables.
- Users should only read/write their own records unless they are admin.
- Public review tables may allow anonymous inserts only for businesses with enabled public review links.
- Never add policies with `using (true)` or `with check (true)` for private user data.

Backups:

- Enable Supabase backups before accepting paid customers.
- Confirm restore process once on a non-production project.
- Export a schema backup after every major migration.

Admin:

- Only `revyneai@gmail.com` should be admin unless another owner is intentionally added.
- Review admin users monthly.

## Vercel Checklist

Deployment:

- Production project should be owned by the RevYne Vercel account.
- GitHub repo should be connected to the RevYne GitHub account.
- Production deploy must be verified after each change.

Headers:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Domain:

- Add final domain in Vercel.
- Point DNS to Vercel.
- Verify HTTPS.
- Update Supabase Auth and Google OAuth after DNS is active.

## OpenAI Checklist

- Keep OpenAI key server-side only.
- Use low-cost model for review generation.
- Set monthly hard budget/spend limits in OpenAI dashboard.
- Keep Edge Function token caps low:
  - Standard review/reply generation: compact output.
  - SEO deep generation: higher cap but only for Pro Max users.
- Monitor failed requests and unusual spikes.

## Razorpay Checklist

- Use live keys only after test mode is fully verified.
- Configure webhook URL to Supabase Edge Function:
  - `https://dbqizpephewiefvghenr.supabase.co/functions/v1/razorpay-webhook`
- Webhook secret must match `RAZORPAY_WEBHOOK_SECRET`.
- Test subscription lifecycle:
  - Create subscription
  - Payment success
  - Payment failure
  - Cancel subscription
  - Expired subscription
  - Plan downgrade to free

## Monitoring Checklist

Current basic monitoring:

- Page and action events go to `analytics_events`.
- Frontend JS errors are logged as `client_error`.
- Supabase and Vercel platform logs are available in dashboards.

Recommended before paid launch:

- Add Sentry or equivalent error monitoring.
- Add email/Slack alert for repeated `client_error` events.
- Monitor AI request rate and 429 responses.
- Monitor support ticket spikes.
- Monitor Razorpay webhook failures.

## Abuse Limits

Current limits:

- AI generation: 60 requests/hour per identifier.
- Payment subscription creation: 5 attempts/hour per user.
- Support tickets: 5/hour and 20/day per user.

Before scale:

- Add CAPTCHA to support and public review flows if spam appears.
- Add stricter per-plan AI limits at the database or Edge Function layer.
- Add IP reputation or firewall rules if abusive traffic appears.

## File Upload Checklist

Current profile image handling:

- Client-side data URL only.
- Allows JPG, PNG, WebP.
- Max size: 500 KB.

Before moving to cloud storage:

- Use Supabase Storage bucket with RLS policies.
- Use signed uploads or authenticated uploads.
- Restrict MIME types and file extensions.
- Enforce file size limits server-side.
- Do not allow SVG, JavaScript, HTML, or executable uploads.

## Manual Security Test Before Launch

Use two separate Google accounts.

Account A:

- Create profile.
- Add business.
- Generate reviews.
- Generate smart replies.
- Raise support ticket.

Account B:

- Confirm Account B cannot see Account A profile/business/support/payment records.
- Confirm public review link only allows intended public review actions.
- Confirm business dashboard is empty for new users.

Unauthenticated tests:

- Try calling AI function without login.
- Try reading private REST tables with publishable key.
- Try creating payment subscription without login.
- Try admin support page without admin account.

Browser/DevTools audit:

- Open Network tab.
- Confirm no OpenAI/Razorpay secret keys are visible.
- Confirm private table responses do not overfetch unnecessary data.
- Confirm failed requests do not reveal sensitive stack traces.

## Incident Response

If OpenAI cost spikes:

1. Disable or rotate `OPENAI_API_KEY`.
2. Check `rate_limit_events` and `analytics_events`.
3. Lower AI rate limit.
4. Redeploy `generate-ai`.

If payment webhook breaks:

1. Check Razorpay webhook logs.
2. Check Supabase Edge Function logs.
3. Verify `RAZORPAY_WEBHOOK_SECRET`.
4. Manually correct affected user plan in Supabase only after confirming payment.

If data leak is suspected:

1. Disable affected public route or function.
2. Review RLS policy.
3. Rotate Supabase service role if exposed.
4. Export logs and affected IDs.
5. Notify affected users if personal data was exposed.

If Google login breaks:

1. Check Supabase Auth provider settings.
2. Check Google OAuth redirect URI.
3. Confirm final domain is in authorized JavaScript origins.
4. Confirm Supabase callback URL is in Google authorized redirect URIs.

## Launch Decision

Do not accept paid users until these are complete:

- Final domain connected and verified.
- Supabase/Google OAuth redirects updated for final domain.
- OpenAI spend limit configured.
- Supabase backups enabled.
- Razorpay test lifecycle passed.
- Two-account RLS security test passed.
- Support ticket flow verified.
