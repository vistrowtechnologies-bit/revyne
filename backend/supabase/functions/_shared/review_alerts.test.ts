// Run: node --experimental-strip-types --test review_alerts.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { newReviews, reviewPush, reviewPushes } from "./review_alerts.ts";

const r = (id: string, createdAt: string, rating = 5, comment = "", reviewer: string | null = "Priya") => ({
  id, reviewer, photoUrl: null, rating, comment, createdAt, updatedAt: createdAt, reply: null,
});

test("first run only starts watching", () => {
  const { fresh, watermark } = newReviews([r("a", "2026-11-06T10:00:00Z"), r("b", "2026-11-05T10:00:00Z")], null);
  assert.equal(fresh.length, 0);
  assert.equal(watermark, "2026-11-06T10:00:00Z");
});

test("later runs return only newer reviews, oldest first, and move the watermark", () => {
  const { fresh, watermark } = newReviews(
    [r("c", "2026-11-06T12:00:00Z"), r("a", "2026-11-06T10:00:00Z"), r("b", "2026-11-06T11:00:00Z")],
    "2026-11-06T10:00:00Z",
  );
  assert.deepEqual(fresh.map((x) => x.id), ["b", "c"]);
  assert.equal(watermark, "2026-11-06T12:00:00Z");
  assert.deepEqual(newReviews([r("a", "2026-11-06T10:00:00Z")], "2026-11-06T10:00:00Z").fresh, []);
  // A removed newest review never moves the watermark backwards.
  assert.equal(newReviews([r("a", "2026-11-01T10:00:00Z")], "2026-11-06T10:00:00Z").watermark, "2026-11-06T10:00:00Z");
});

test("alert text: stars, reviewer, short comment; rating-only and anonymous fallbacks", () => {
  const p = reviewPush(r("x", "2026-11-06T10:00:00Z", 4, "Great gate work, delivered on time"));
  assert.equal(p.title, "New 4★ Google review");
  assert.equal(p.body, "Priya: “Great gate work, delivered on time”");
  assert.equal(p.route, "/reviews");
  assert.equal(reviewPush(r("y", "2026-11-06T10:00:00Z", 5, "", null)).body, "A customer left a rating. Tap to reply.");
  assert.ok(reviewPush(r("z", "2026-11-06T10:00:00Z", 5, "a".repeat(300))).body.length < 130);
  assert.equal(reviewPush(r("t", "2026-11-06T10:00:00Z", 5, "(Translated by Google) Nice\n\n(Original)\nछान")).body, "Priya: “Nice”");
});

test("a burst of reviews becomes one summary", () => {
  const four = ["1", "2", "3", "4"].map((i) => r(i, `2026-11-06T1${i}:00:00Z`));
  assert.equal(reviewPushes(four).length, 1);
  assert.equal(reviewPushes(four)[0].title, "4 new Google reviews");
  assert.equal(reviewPushes(four.slice(0, 2)).length, 2);
});
