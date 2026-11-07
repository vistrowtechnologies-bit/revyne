// Which Google reviews are new since the last check, and how to word the alert.
// Pure functions, unit-tested.

import type { GbpReview } from "./google.ts";
import type { Push } from "./fcm.ts";

/**
 * Reviews created after `seenAt` (oldest first) and the new watermark. On the
 * first run (`seenAt` null) nothing is "new" — we only start watching.
 */
export function newReviews(reviews: GbpReview[], seenAt: string | null): { fresh: GbpReview[]; watermark: string | null } {
  // Compare real times, never text: Google sends "2026-11-05T10:33:41Z" while the
  // database returns "2026-11-05 10:33:41+00", and as text "T" > " " made the
  // same review look new on every run.
  const t = (s: string | null) => (s ? Date.parse(s.replace(" ", "T").replace(/\+00$/, "Z")) : NaN);
  const seen = t(seenAt);
  const dated = reviews.filter((r) => !Number.isNaN(t(r.createdAt)));
  const newest = dated.reduce<GbpReview | null>((m, r) => (!m || t(r.createdAt) > t(m.createdAt) ? r : m), null);
  const watermark = newest && (Number.isNaN(seen) || t(newest.createdAt) > seen) ? newest.createdAt : seenAt;
  if (Number.isNaN(seen)) return { fresh: [], watermark };
  const fresh = dated
    .filter((r) => t(r.createdAt) > seen && !r.reply) // already answered (e.g. on Google) → no alert
    .sort((a, b) => t(a.createdAt) - t(b.createdAt));
  return { fresh, watermark };
}

const STARS = ["", "1★", "2★", "3★", "4★", "5★"];

export function reviewPush(r: GbpReview): Push {
  const who = r.reviewer ?? "A customer";
  const text = r.comment.replace(/^\(Translated by Google\)\s*/, "").replace(/\s*\(Original\)[\s\S]*$/, "").trim();
  return {
    title: `New ${STARS[r.rating] || ""} Google review`.replace("  ", " "),
    body: text ? `${who}: “${text.length > 110 ? `${text.slice(0, 107)}…` : text}”` : `${who} left a rating. Tap to reply.`,
    route: "/reviews",
    tag: `review-${r.id}`,
  };
}

/** More than 3 at once → one summary instead of a burst. */
export function reviewPushes(fresh: GbpReview[]): Push[] {
  if (fresh.length <= 3) return fresh.map(reviewPush);
  return [{ title: `${fresh.length} new Google reviews`, body: "Tap to read and reply.", route: "/reviews", tag: "reviews-batch" }];
}
