// Monthly report helpers: month ranges and review/post tallies. Pure, tested.

import type { GbpPost, GbpReview } from "./google.ts";

export type MonthRange = { month: string; start: string; end: string; statsEnd: string | null; complete: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "2026-10" → its first/last day. `statsEnd` is the last day Google stats
 * exist for (2 days lag), or null when the month has none yet. Only months
 * from 18 months ago up to the current one are allowed.
 */
export function monthRange(month: string, today = new Date(), lagDays = 2): MonthRange | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mon = Number(m[2]);
  if (mon < 1 || mon > 12) return null;
  const first = Date.UTC(year, mon - 1, 1);
  const last = Date.UTC(year, mon, 0);
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (first > todayUtc) return null;
  if (first < Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 18, 1)) return null;
  const latestStats = todayUtc - lagDays * 86400_000;
  const d = (t: number) => new Date(t).toISOString().slice(0, 10);
  return {
    month: `${year}-${pad(mon)}`,
    start: d(first),
    end: d(last),
    statsEnd: latestStats < first ? null : d(Math.min(last, latestStats)),
    complete: last < todayUtc,
  };
}

export function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
}

const inMonth = (iso: string, r: MonthRange) => iso.slice(0, 10) >= r.start && iso.slice(0, 10) <= r.end;

export function reviewTally(reviews: GbpReview[], r: MonthRange) {
  const got = reviews.filter((x) => inMonth(x.createdAt, r));
  const rated = got.filter((x) => x.rating > 0);
  return {
    received: got.length,
    averageRating: rated.length ? Math.round((rated.reduce((s, x) => s + x.rating, 0) / rated.length) * 10) / 10 : null,
    replied: got.filter((x) => x.reply).length,
    byStars: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: rated.filter((x) => x.rating === stars).length })),
  };
}

export function postTally(posts: GbpPost[], r: MonthRange) {
  const got = posts.filter((p) => p.createdAt && inMonth(p.createdAt, r));
  return { published: got.length, offers: got.filter((p) => p.type === "OFFER").length, events: got.filter((p) => p.type === "EVENT").length };
}
