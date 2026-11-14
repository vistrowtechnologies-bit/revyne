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
email. Links are relative, so the domain only appears in canonical/OG tags,
`sitemap.xml` and `robots.txt`; after changing `origin`, run:

```bash
node apps/website/tools/apply-config.mjs
```

The Play Store URL is a placeholder until the listing is live; `site.js` applies
it to every `[data-play]` link.

## Deploying later (Cloudflare Pages)

- Build command: none. Output directory: `apps/website`.
- `_redirects` and `_headers` are picked up automatically.
- `dev-server.mjs`, `tools/` and this README are harmless if uploaded, but can be
  excluded.
