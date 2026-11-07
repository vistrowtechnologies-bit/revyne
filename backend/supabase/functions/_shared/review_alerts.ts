// Which Google reviews are new since the last check, and how to word the alert.
// Pure functions, unit-tested.

import type { GbpReview } from "./google.ts";
import type { Push } from "./fcm.ts";

/**
 * Reviews created after `seenAt` (oldest first) and the new watermark. On the
 * first run (`seenAt` null) nothing is "new" — we only start watching.
 */
export function newReviews(reviews: GbpReview[], seenAt: string | null): { fresh: GbpReview[]; watermark: string | null } {
  const newest = reviews.reduce<string | null>((m, r) => (r.createdAt && (!m || r.createdAt > m) ? r.createdAt : m), null);
  const watermark = newest && (!seenAt || newest > seenAt) ? newest : seenAt;
  if (!seenAt) return { fresh: [], watermark };
  const fresh = reviews.filter((r) => r.createdAt > seenAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
