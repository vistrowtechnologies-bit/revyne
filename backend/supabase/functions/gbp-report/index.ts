// ─────────────────────────────────────────────────────────────────────────────
// gbp-report — one month's report for the owner's business: Google stats (vs
// the month before), reviews received and replied, posts, top searches, and
// RevYne activity (review-page visits, sent to Google, private messages).
// Signed-in owners only. Google data read live; nothing stored.
//
// Action (POST JSON):  get { month: "YYYY-MM" }
// Sections that fail come back as null so the rest of the report still shows.
// ─────────────────────────────────────────────────────────────────────────────

import { accessTokenFor } from "../_shared/gbp_auth.ts";
import { dailyMetrics, GbpReview, GoogleApiError, listPosts, listReviews, monthlyKeywords } from "../_shared/google.ts";
import { db, getUserId, json, str, serveOwner } from "../_shared/http.ts";
import { DAILY_METRICS, dateRange, keywords, seriesByMetric, summarise } from "../_shared/insights.ts";
import { monthRange, postTally, previousMonth, reviewTally } from "../_shared/report.ts";

type Business = { id: string; name: string; city: string | null; gbp_account: string | null; gbp_location: string | null };

async function optional<T>(label: string, p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    console.error(`gbp-report ${label} failed`, e instanceof Error ? e.message.slice(0, 300) : e);
    return null;
  }
}

async function count(path: string): Promise<number> {
  const res = await db(path, { method: "HEAD", headers: { Prefer: "count=exact" } });
  if (!res.ok) throw new Error(`count ${res.status}`);
  return Number(res.headers.get("content-range")?.split("/")[1] ?? 0);
}

/** Reviews newest-first until we pass the month's start (at most 5 pages). */
async function reviewsSince(account: string, location: string, start: string, token: string) {
  const all: GbpReview[] = [];
  let pageToken: string | undefined;
  let summary = { averageRating: null as number | null, totalReviewCount: 0 };
  for (let i = 0; i < 5; i++) {
    const page = await listReviews(account, location, token, pageToken);
    if (i === 0) summary = { averageRating: page.averageRating, totalReviewCount: page.totalReviewCount };
    all.push(...page.reviews);
    const oldest = page.reviews.at(-1)?.createdAt ?? "";
    if (!page.nextPageToken || oldest.slice(0, 10) < start) break;
    pageToken = page.nextPageToken;
  }
  return { reviews: all, ...summary };
}

serveOwner(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const userId = await getUserId(req);
  if (!userId) return json({ error: "Please sign in again." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (body.action !== "get") return json({ error: "Unknown action" }, 400);
  const range = monthRange(str(body.month, 7));
  if (!range) return json({ status: "invalid", message: "Pick a month from the last 18 months." });
  const prev = monthRange(previousMonth(range.month));

  const bRes = await db(`businesses?owner_id=eq.${userId}&select=id,name,city,gbp_account,gbp_location&limit=1`);
  const [b] = bRes.ok ? await bRes.json() as Business[] : [];
  if (!b) return json({ status: "not_linked" });

  // RevYne's own numbers (India time boundaries).
  const from = `${range.start}T00:00:00%2B05:30`;
  const toDay = new Date(Date.parse(`${range.end}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10);
  const to = `${toDay}T00:00:00%2B05:30`;
  const within = `created_at=gte.${from}&created_at=lt.${to}`;
  const revyne = await optional("revyne", (async () => ({
    pageVisits: await count(`review_sessions?business_id=eq.${b.id}&${within}&select=id`),
    wentToGoogle: await count(`review_sessions?business_id=eq.${b.id}&${within}&opened_google_at=not.is.null&select=id`),
    privateMessages: await count(`private_feedback?business_id=eq.${b.id}&${within}&select=id`),
  }))());

  let google = null, previousGoogle = null, reviews = null, posts = null, searches = null, rating = null;
  if (b.gbp_account && b.gbp_location) {
    try {
      const token = await accessTokenFor(userId);
      if (token) {
        const statsFrom = prev?.statsEnd ? prev.start : range.start;
        const [series, rv, ps, kw] = await Promise.all([
          range.statsEnd ? optional("stats", dailyMetrics(b.gbp_location, DAILY_METRICS, statsFrom, range.statsEnd, token)) : Promise.resolve(null),
          optional("reviews", reviewsSince(b.gbp_account, b.gbp_location, range.start, token)),
          optional("posts", listPosts(b.gbp_account, b.gbp_location, token)),
          range.complete
            ? optional("keywords", monthlyKeywords(b.gbp_location, ym(range.month), ym(range.month), token))
            : Promise.resolve(null),
        ]);
        if (series) {
          const byMetric = seriesByMetric(series);
          google = summarise(byMetric, dateRange(range.start, range.statsEnd!)).totals;
          if (prev?.statsEnd) previousGoogle = summarise(byMetric, dateRange(prev.start, prev.end)).totals;
        }
        if (rv) {
          reviews = reviewTally(rv.reviews, range);
          rating = { average: rv.averageRating, total: rv.totalReviewCount };
        }
        if (ps) posts = postTally(ps, range);
        if (kw) searches = keywords(kw, 5);
      }
    } catch (e) {
      if (!(e instanceof GoogleApiError)) throw e;
      console.error("gbp-report google failed", e.message.slice(0, 300));
    }
  }

  return json({
    status: "ok",
    business: { name: b.name, city: b.city, linked: !!b.gbp_location },
    month: range.month,
    complete: range.complete,
    statsThrough: range.statsEnd,
    google,
    previousGoogle,
    reviews,
    rating,
    posts,
    searches,
    revyne,
  });
});

function ym(month: string) {
  const [year, m] = month.split("-").map(Number);
  return { year, month: m };
}
