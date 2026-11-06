// Run: node --experimental-strip-types --test report.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { monthRange, postTally, previousMonth, reviewTally } from "./report.ts";

const today = new Date("2026-11-06T10:00:00Z");

test("month ranges: complete past month, current partial month, limits", () => {
  assert.deepEqual(monthRange("2026-10", today), { month: "2026-10", start: "2026-10-01", end: "2026-10-31", statsEnd: "2026-10-31", complete: true });
  assert.deepEqual(monthRange("2026-11", today), { month: "2026-11", start: "2026-11-01", end: "2026-11-30", statsEnd: "2026-11-04", complete: false });
  assert.equal(monthRange("2026-12", today), null); // future
  assert.equal(monthRange("2024-01", today), null); // older than 18 months
  assert.equal(monthRange("2026-13", today), null);
  assert.equal(monthRange("Oct", today), null);
  // First two days of a month: no Google stats yet.
  assert.equal(monthRange("2026-11", new Date("2026-11-01T10:00:00Z"))?.statsEnd, null);
});

test("previous month wraps the year", () => {
  assert.equal(previousMonth("2026-01"), "2025-12");
  assert.equal(previousMonth("2026-11"), "2026-10");
});

const review = (createdAt: string, rating: number, reply = false) => ({
  id: createdAt, reviewer: null, photoUrl: null, rating, comment: "", createdAt, updatedAt: createdAt,
  reply: reply ? { comment: "Thanks", updatedAt: createdAt } : null,
});

test("review tally counts only the month, with average and replies", () => {
  const r = monthRange("2026-11", today)!;
  const t = reviewTally([review("2026-11-05T09:00:00Z", 5, true), review("2026-11-02T09:00:00Z", 4), review("2026-10-30T09:00:00Z", 1)], r);
  assert.equal(t.received, 2);
  assert.equal(t.averageRating, 4.5);
  assert.equal(t.replied, 1);
  assert.deepEqual(t.byStars.find((b) => b.stars === 5), { stars: 5, count: 1 });
  assert.equal(reviewTally([], r).averageRating, null);
});

test("post tally by type within the month", () => {
  const r = monthRange("2026-11", today)!;
  const post = (createdAt: string, type: string) => ({ name: "n", type, summary: "", title: null, state: "LIVE", createdAt, photoUrl: null, searchUrl: null, button: null });
  assert.deepEqual(postTally([post("2026-11-06T09:00:00Z", "STANDARD"), post("2026-11-03T09:00:00Z", "OFFER"), post("2026-10-01T09:00:00Z", "EVENT")], r), {
    published: 2, offers: 1, events: 0,
  });
});
