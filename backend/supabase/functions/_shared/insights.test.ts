// Run: node --experimental-strip-types --test insights.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { customPeriods, dateRange, keywords, periods, seriesByMetric, summarise } from "./insights.ts";

test("custom range: same-length comparison, clamped to Google's data window", () => {
  const today = new Date("2026-11-06T10:00:00Z");
  assert.deepEqual(customPeriods("2026-10-01", "2026-10-31", today), {
    start: "2026-10-01", end: "2026-10-31", prevStart: "2026-08-31", prevEnd: "2026-09-30", days: 31,
  });
  // End is pulled back to two days ago.
  assert.equal(customPeriods("2026-11-01", "2026-11-06", today)?.end, "2026-11-04");
  // Reversed, junk, too long, or entirely too recent → null.
  assert.equal(customPeriods("2026-10-31", "2026-10-01", today), null);
  assert.equal(customPeriods("yesterday", "2026-10-01", today), null);
  assert.equal(customPeriods("2025-01-01", "2026-10-01", today), null);
  assert.equal(customPeriods("2026-11-05", "2026-11-06", today), null);
});

const day = (d: number) => ({ year: 2026, month: 11, day: d });

const resp = {
  multiDailyMetricTimeSeries: [{
    dailyMetricTimeSeries: [
      { dailyMetric: "BUSINESS_IMPRESSIONS_MOBILE_SEARCH", timeSeries: { datedValues: [{ date: day(1), value: "10" }, { date: day(2) }] } },
      { dailyMetric: "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", timeSeries: { datedValues: [{ date: day(1), value: "2" }] } },
      { dailyMetric: "BUSINESS_IMPRESSIONS_MOBILE_MAPS", timeSeries: { datedValues: [{ date: day(2), value: "5" }] } },
      { dailyMetric: "CALL_CLICKS", timeSeries: { datedValues: [{ date: day(1), value: "3" }] } },
      { dailyMetric: "BUSINESS_DIRECTION_REQUESTS", timeSeries: { datedValues: [{ date: day(2), value: "1" }] } },
      { dailyMetric: "WEBSITE_CLICKS", timeSeries: {} },
    ],
  }],
};

test("adds Search and Maps views and actions per day; missing values are 0", () => {
  const { totals, daily } = summarise(seriesByMetric(resp), dateRange("2026-11-01", "2026-11-03"));
  assert.deepEqual(totals, { searchViews: 12, mapsViews: 5, calls: 3, directions: 1, websiteClicks: 0, chats: 0 });
  assert.deepEqual(daily, [
    { date: "2026-11-01", views: 12, actions: 3 },
    { date: "2026-11-02", views: 5, actions: 1 },
    { date: "2026-11-03", views: 0, actions: 0 },
  ]);
});

test("empty response gives zeros, not errors", () => {
  const { totals, daily } = summarise(seriesByMetric({}), dateRange("2026-11-01", "2026-11-02"));
  assert.equal(totals.calls, 0);
  assert.equal(daily.length, 2);
});

test("periods end two days ago and the previous period sits right before", () => {
  assert.deepEqual(periods(7, new Date("2026-11-06T10:00:00Z")), {
    start: "2026-10-29",
    end: "2026-11-04",
    prevStart: "2026-10-22",
    prevEnd: "2026-10-28",
  });
  assert.equal(dateRange("2026-10-29", "2026-11-04").length, 7);
});

test("keywords: sorted by count, thresholds kept as 'fewer than'", () => {
  const k = keywords({
    searchKeywordsCounts: [
      { searchKeyword: "fabrication moshi", insightsValue: { threshold: "15" } },
      { searchKeyword: "gate fabricator", insightsValue: { value: "42" } },
      { searchKeyword: "", insightsValue: { value: "99" } },
    ],
  });
  assert.deepEqual(k, [
    { keyword: "gate fabricator", count: 42, below: null },
    { keyword: "fabrication moshi", count: null, below: 15 },
  ]);
});
