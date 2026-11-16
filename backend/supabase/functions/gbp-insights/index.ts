// ─────────────────────────────────────────────────────────────────────────────
// gbp-insights — how customers found and contacted the owner's business on
// Google (Business Profile Performance API). Signed-in owners of a linked
// business only. Read live; nothing stored.
//
// Action (POST JSON):
//   get { days: 7 | 28 | 90 }      totals, previous-period totals, daily series, keywords
//   get { start, end }             same for a custom range (YYYY-MM-DD)
//
// Expected outcomes come back as 200 { status }: ok | not_linked | reconnect | api_not_approved.
// ─────────────────────────────────────────────────────────────────────────────

import { accessTokenFor } from "../_shared/gbp_auth.ts";
import { dailyMetrics, GoogleApiError, monthlyKeywords } from "../_shared/google.ts";
import { db, getUserId, json, serveOwner } from "../_shared/http.ts";
import { customPeriods, DAILY_METRICS, dateRange, keywords, periods, seriesByMetric, summarise } from "../_shared/insights.ts";

async function linkedLocation(userId: string): Promise<string | null> {
  const res = await db(`businesses?owner_id=eq.${userId}&gbp_location=not.is.null&select=gbp_location&limit=1`);
  const rows = res.ok ? await res.json() as { gbp_location: string }[] : [];
  return rows[0]?.gbp_location ?? null;
}

/** The three whole months before the current one. */
function lastThreeMonths(today = new Date()) {
  const m = (offset: number) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  };
  return { start: m(3), end: m(1) };
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
  let p: { start: string; end: string; prevStart: string; prevEnd: string };
  let days: number;
  if (typeof body.start === "string" && typeof body.end === "string") {
    const custom = customPeriods(body.start, body.end);
    if (!custom) return json({ status: "invalid", message: "Pick a range within the last 18 months, up to a year long, ending 2 or more days ago." });
    ({ days, ...p } = custom);
  } else {
    days = [7, 28, 90].includes(Number(body.days)) ? Number(body.days) : 28;
    p = periods(days);
  }

  const location = await linkedLocation(userId);
  if (!location) return json({ status: "not_linked" });

  try {
    const token = await accessTokenFor(userId);
    if (!token) return json({ status: "reconnect" });

    const months = lastThreeMonths();
    const [series, kw] = await Promise.all([
      dailyMetrics(location, DAILY_METRICS, p.prevStart, p.end, token),
      // Keywords are optional: a failure must not hide the main numbers.
      monthlyKeywords(location, months.start, months.end, token).catch((e) => {
        console.error("gbp-insights keywords failed", e instanceof Error ? e.message.slice(0, 300) : e);
        return {};
      }),
    ]);
    const byMetric = seriesByMetric(series);
    const current = summarise(byMetric, dateRange(p.start, p.end));
    const previous = summarise(byMetric, dateRange(p.prevStart, p.prevEnd));
    return json({
      status: "ok",
      range: { start: p.start, end: p.end, days },
      totals: current.totals,
      previous: previous.totals,
      daily: current.daily,
      keywords: keywords(kw),
      keywordMonths: months,
    });
  } catch (e) {
    if (e instanceof GoogleApiError) {
      if (e.kind === "api_not_approved") {
        console.error("gbp-insights not approved", e.message.slice(0, 500));
        return json({ status: "api_not_approved" });
      }
      if (e.kind === "unauthorized") return json({ status: "reconnect" });
    }
    console.error("gbp-insights failed", e);
    return json({ error: "Could not reach Google right now. Please try again." }, 502);
  }
});
