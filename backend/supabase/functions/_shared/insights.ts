// Turns Business Profile Performance API responses into the numbers the app
// shows: how many people saw the profile (Search vs Maps), what they did
// (calls, directions, website, chats), a daily series, and the change versus
// the previous period. Pure functions, unit-tested.

export const DAILY_METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "CALL_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "WEBSITE_CLICKS",
  "BUSINESS_CONVERSATIONS",
] as const;

export type Totals = {
  searchViews: number;
  mapsViews: number;
  calls: number;
  directions: number;
  websiteClicks: number;
  chats: number;
};

export type Day = { date: string; views: number; actions: number };

const iso = (d: { year: number; month: number; day: number }) =>
  `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

/** Flattens the API response into metric → (date → value). Missing values are 0. */
export function seriesByMetric(resp: Record<string, any>): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const multi of (resp.multiDailyMetricTimeSeries ?? []) as Record<string, any>[]) {
    for (const s of (multi.dailyMetricTimeSeries ?? []) as Record<string, any>[]) {
      const byDate = out.get(s.dailyMetric) ?? new Map<string, number>();
      for (const v of (s.timeSeries?.datedValues ?? []) as Record<string, any>[]) {
        if (v.date) byDate.set(iso(v.date), Number(v.value ?? 0) || 0);
      }
      out.set(s.dailyMetric, byDate);
    }
  }
  return out;
}

/** Every date from start to end inclusive, as YYYY-MM-DD (UTC). */
export function dateRange(start: string, end: string): string[] {
  const days: string[] = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${end}T00:00:00Z`); t += 86400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

export function summarise(series: Map<string, Map<string, number>>, dates: string[]): { totals: Totals; daily: Day[] } {
  const v = (metric: string, date: string) => series.get(metric)?.get(date) ?? 0;
  const totals: Totals = { searchViews: 0, mapsViews: 0, calls: 0, directions: 0, websiteClicks: 0, chats: 0 };
  const daily: Day[] = dates.map((date) => {
    const search = v("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", date) + v("BUSINESS_IMPRESSIONS_MOBILE_SEARCH", date);
    const maps = v("BUSINESS_IMPRESSIONS_DESKTOP_MAPS", date) + v("BUSINESS_IMPRESSIONS_MOBILE_MAPS", date);
    const calls = v("CALL_CLICKS", date);
    const directions = v("BUSINESS_DIRECTION_REQUESTS", date);
    const web = v("WEBSITE_CLICKS", date);
    const chats = v("BUSINESS_CONVERSATIONS", date);
    totals.searchViews += search;
    totals.mapsViews += maps;
    totals.calls += calls;
    totals.directions += directions;
    totals.websiteClicks += web;
    totals.chats += chats;
    return { date, views: search + maps, actions: calls + directions + web + chats };
  });
  return { totals, daily };
}

export type Keyword = { keyword: string; count: number | null; below: number | null };

/** Monthly search keywords; Google hides small counts behind a threshold ("fewer than N"). */
export function keywords(resp: Record<string, any>, limit = 10): Keyword[] {
  return ((resp.searchKeywordsCounts ?? []) as Record<string, any>[])
    .map((k) => ({
      keyword: String(k.searchKeyword ?? ""),
      count: k.insightsValue?.value != null ? Number(k.insightsValue.value) : null,
      below: k.insightsValue?.threshold != null ? Number(k.insightsValue.threshold) : null,
    }))
    .filter((k) => k.keyword)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, limit);
}

/**
 * A range the owner picked. Clamped to Google's limits (about 18 months back,
 * nothing newer than `lagDays` ago); the comparison period is the same length
 * just before. Returns null for nonsense input.
 */
export function customPeriods(start: string, end: string, today = new Date(), lagDays = 2) {
  const ok = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
  if (!ok(start) || !ok(end)) return null;
  const day = 86400_000;
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const latest = todayUtc - lagDays * day;
  const earliest = todayUtc - 540 * day;
  const s = Math.max(Date.parse(`${start}T00:00:00Z`), earliest);
  const e = Math.min(Date.parse(`${end}T00:00:00Z`), latest);
  if (e < s) return null;
  const days = Math.round((e - s) / day) + 1;
  if (days > 366) return null;
  const d = (t: number) => new Date(t).toISOString().slice(0, 10);
  return { start: d(s), end: d(e), prevStart: d(s - days * day), prevEnd: d(s - day), days };
}

/** The period shown ends `lagDays` before today, since Google's data runs a few days behind. */
export function periods(days: number, today = new Date(), lagDays = 2) {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - lagDays * 86400_000);
  const start = new Date(end.getTime() - (days - 1) * 86400_000);
  const prevEnd = new Date(start.getTime() - 86400_000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400_000);
  const d = (x: Date) => x.toISOString().slice(0, 10);
  return { start: d(start), end: d(end), prevStart: d(prevStart), prevEnd: d(prevEnd) };
}
