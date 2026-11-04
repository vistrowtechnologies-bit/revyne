// Run: node --experimental-strip-types --test score.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeGoogleScore } from "./google_score.ts";

const base = { rating: null, ratingCount: 0, photoCount: 0, hasHours: false, hasWebsite: false, hasPhone: false, isOperational: true };

test("max points add up to 100", () => {
  const { items } = computeGoogleScore(base);
  assert.equal(items.reduce((s, i) => s + i.max, 0), 100);
});

test("a complete, well-reviewed profile scores 100 with no tips", () => {
  const r = computeGoogleScore({ rating: 4.7, ratingCount: 250, photoCount: 10, hasHours: true, hasWebsite: true, hasPhone: true, isOperational: true });
  assert.equal(r.score, 100);
  assert.ok(r.items.every((i) => i.tip === null));
});

test("a bare profile with no reviews only earns the open-for-business points", () => {
  assert.equal(computeGoogleScore(base).score, 5);
});

test("a typical small shop lands in the middle", () => {
  const r = computeGoogleScore({ rating: 4.1, ratingCount: 23, photoCount: 4, hasHours: true, hasWebsite: false, hasPhone: true, isOperational: true });
  assert.equal(r.score, 18 + 14 + 9 + 10 + 0 + 10 + 5);
  assert.ok(r.items.find((i) => i.key === "website")?.tip);
});

test("rating counts for nothing until there is at least one review", () => {
  const r = computeGoogleScore({ ...base, rating: 5 });
  assert.equal(r.items.find((i) => i.key === "rating")?.earned, 0);
});
