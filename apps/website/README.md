# RevYne website

Public site for RevYne (operated by Vistrow Technologies). Plain static
HTML/CSS/JS — no build step, no dependencies. Planned host: Cloudflare Pages at
`revyneai.com` (not bought/deployed yet).

| URL | File |
|---|---|
| `/` | `index.html` — marketing home |
| `/pricing` | `pricing/index.html` — "plans coming soon" |
| `/privacy` | `privacy/index.html` — privacy policy (**draft, needs legal review**) |
| `/terms` | `terms/index.html` — terms (**draft, needs legal review**) |
| `/delete-account` | `delete-account/index.html` — Play Store account-deletion page |
| `/r/<code>` | `r/index.html` + `review/*` — customer review page (copied from `apps/review-web`) |

## Preview locally

```bash
node apps/website/dev-server.mjs
```

Opens on http://localhost:5176 (also the `website` entry in `.claude/launch.json`).
The server mirrors Cloudflare Pages: clean URLs, the `/r/*` rewrite, and `404.html`.

## Customer review page

`apps/review-web` is the source of truth. After changing it, re-sync the copy:

```bash
node apps/website/tools/sync-review-web.mjs
```

The page lives at `r/index.html` and its assets under `review/` (paths rewritten),
so the `/r/*` rewrite in `_redirects` never catches a JS or CSS request.

The review page's `review-page` edge function only allows CORS from the origins
in its `REVIEW_PAGE_ORIGINS` secret (default: revyneai.com, www, and
`http://localhost:5173`). On `localhost:5176` the page loads the business fine
(that call goes through PostgREST), but AI polish / private messages need
`http://localhost:5176` added to that secret to work locally.

## Config

`site.config.js` is the one place for the domain, Play Store link and contact
email. `origin` is currently `https://revyne-pied.vercel.app` because
`revyneai.com` doesn't resolve yet. Links are relative, so the origin only
appears in canonical/OG tags, structured data, `sitemap.xml`, `robots.txt` and
the review page's share card; after changing `origin`, run:

```bash
node apps/website/tools/apply-config.mjs
```

`playStoreUrl` is empty until the Play listing is live, so every `[data-play]`
button reads "Get early access" and opens an email. Set it and `site.js` turns
them all into "Get the app" links (and hides `[data-prelaunch]` notes).

## Deploying (Vercel)

`revyneai.com` and `www` belong to the Vercel project `revyne` (account
revyneai-4419). Git-push deploys are blocked on that Hobby account, so deploy
with the CLI from this folder, logged in as revyneai-4419:

```bash
cd apps/website
npx vercel link --project revyne
npx vercel deploy
npx vercel deploy --prod
```

`npx vercel deploy` gives a preview URL to check first; `--prod` replaces the old
repo-root site. `vercel.json` here sets clean URLs, the `/r/:code` rewrite, a
few redirects and security headers (the CSP allows only the Supabase project and
Google Fonts). `.vercelignore` keeps the dev server and tools out of the upload.
`dev-server.mjs` sends the same headers, so CSP problems show up locally.

The domain still needs its DNS pointed at Vercel at the registrar
(`npx vercel domains inspect revyneai.com` shows the records).

`_redirects` / `_headers` are the equivalent config for Cloudflare Pages, kept in
case hosting moves there.
