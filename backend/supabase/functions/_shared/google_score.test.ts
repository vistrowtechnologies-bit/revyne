// Run: node --experimental-strip-types --test google_score.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeGoogleScore } from "./google_score.ts";

const base = {
  rating: null,
  ratingCount: 0,
  repliedShare: null,
  hasDescription: false,
  hasHours: false,
  hasPhone: false,
  hasWebsite: false,
  additionalCategories: 0,
  photoCount: 0,
  daysSinceLastPost: null,
};

const full = {
  rating: 4.7,
  ratingCount: 250,
  repliedShare: 1,
  hasDescription: true,
  hasHours: true,
  hasPhone: true,
  hasWebsite: true,
  additionalCategories: 2,
  photoCount: 25,
  daysSinceLastPost: 3,
};

test("max points add up to 100", () => {
  assert.equal(computeGoogleScore(base).items.reduce((s, i) => s + i.max, 0), 100);
});

test("a complete, active, well-reviewed profile scores 100 with no tips", () => {
  const r = computeGoogleScore(full);
  assert.equal(r.score, 100);
  assert.ok(r.items.every((i) => i.tip === null));
});

test("a bare profile scores 0 and every item has a tip", () => {
  const r = computeGoogleScore(base);
  assert.equal(r.score, 0);
  assert.ok(r.items.every((i) => i.tip));
});

test("a new shop with 2 five-star reviews, half replied", () => {
  const r = computeGoogleScore({ ...base, rating: 5, ratingCount: 2, repliedShare: 0.5, hasPhone: true, hasHours: true, photoCount: 4 });
  assert.equal(r.score, 20 + 3 + 5 + 0 + 6 + 8 + 0 + 6 + 0 + 0);
  assert.equal(r.items.find((i) => i.key === "description")?.action, "description");
});

test("posting recency decays: this week, this month, older", () => {
  const pts = (d: number | null) => computeGoogleScore({ ...base, daysSinceLastPost: d }).items.find((i) => i.key === "posts")?.earned;
  assert.deepEqual([pts(2), pts(20), pts(45), pts(null)], [6, 3, 0, 0]);
});

test("rating counts for nothing until there is at least one review", () => {
  assert.equal(computeGoogleScore({ ...base, rating: 5 }).items.find((i) => i.key === "rating")?.earned, 0);
});

test("unknown photo count earns nothing but doesn't break the label", () => {
  const photos = computeGoogleScore({ ...base, photoCount: null }).items.find((i) => i.key === "photos");
  assert.equal(photos?.label, "Photos");
  assert.equal(photos?.earned, 0);
});
