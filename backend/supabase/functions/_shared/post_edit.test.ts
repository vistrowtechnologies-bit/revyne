// Run: node --experimental-strip-types --test post_edit.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPostPrompt, ownMediaPath, postBody } from "./post_edit.ts";

const today = new Date("2026-11-06T08:00:00Z");

test("update post: text, Call button and photo", () => {
  const body = postBody({ type: "STANDARD", summary: " New gate designs ready. ", button: "CALL" }, "https://x.supabase.co/sign/a.jpg", today);
  assert.deepEqual(body, {
    languageCode: "en",
    summary: "New gate designs ready.",
    topicType: "STANDARD",
    callToAction: { actionType: "CALL" },
    media: [{ mediaFormat: "PHOTO", sourceUrl: "https://x.supabase.co/sign/a.jpg" }],
  });
});

test("link buttons need a valid link, https is added", () => {
  const body = postBody({ type: "STANDARD", summary: "See our work", button: "LEARN_MORE", buttonUrl: "instagram.com/swamykripa" }, null, today);
  assert.deepEqual(body.callToAction, { actionType: "LEARN_MORE", url: "https://instagram.com/swamykripa" });
  assert.throws(() => postBody({ type: "STANDARD", summary: "x", button: "ORDER" }, null, today), /link/);
});

test("offer: title, dates, coupon and terms; no button", () => {
  const body = postBody({
    type: "OFFER",
    summary: "Diwali offer on grills",
    title: "Diwali offer",
    startDate: "2026-11-06",
    endDate: "2026-11-15",
    couponCode: "DIWALI",
    terms: "Orders above one gate",
    button: "CALL",
  }, null, today);
  assert.deepEqual(body.event, { title: "Diwali offer", schedule: { startDate: { year: 2026, month: 11, day: 6 }, endDate: { year: 2026, month: 11, day: 15 } } });
  assert.deepEqual(body.offer, { couponCode: "DIWALI", termsConditions: "Orders above one gate" });
  assert.equal(body.callToAction, undefined);
});

test("event and offer need a title and sensible dates", () => {
  const base = { type: "EVENT" as const, summary: "Open house", title: "Open house" };
  assert.throws(() => postBody({ ...base, title: "" , startDate: "2026-11-10", endDate: "2026-11-10" }, null, today), /title/);
  assert.throws(() => postBody({ ...base, startDate: "2026-11-10", endDate: "2026-11-09" }, null, today), /on or after/);
  assert.throws(() => postBody({ ...base, startDate: "2026-11-01", endDate: "2026-11-02" }, null, today), /passed/);
  assert.throws(() => postBody({ ...base, startDate: "2026-11-10" }, null, today), /end date/);
});

test("rejects phone numbers and links in the text, and empty or long posts", () => {
  assert.throws(() => postBody({ type: "STANDARD", summary: "Call 88559 67773 now" }, null, today), /phone numbers/);
  assert.throws(() => postBody({ type: "STANDARD", summary: "Call +91-9876543210" }, null, today), /phone numbers/);
  assert.throws(() => postBody({ type: "STANDARD", summary: "Visit www.x.com" }, null, today), /links/);
  assert.throws(() => postBody({ type: "STANDARD", summary: "  " }, null, today), /Write/);
  assert.throws(() => postBody({ type: "STANDARD", summary: "a".repeat(1501) }, null, today), /1500/);
  // Short numbers like sizes or years are fine.
  assert.doesNotThrow(() => postBody({ type: "STANDARD", summary: "Gates from 6 ft to 12 ft, since 2015" }, null, today));
});

test("media paths must sit in the owner's own business folder", () => {
  const id = "41b61fc2-0384-4a7b-a29c-f8c19d5c2c04";
  assert.ok(ownMediaPath(`${id}/a1b2c3d4e5.jpg`, id));
  assert.ok(!ownMediaPath(`other-id/a1b2c3d4e5.jpg`, id));
  assert.ok(!ownMediaPath(`${id}/../x/a1b2c3d4e5.jpg`, id));
  assert.ok(!ownMediaPath(`${id}/a1b2c3d4e5.gif`, id));
});

test("AI post prompt sticks to the owner's words", () => {
  const { instructions, input } = buildPostPrompt({ businessName: "Swamy Kripa", category: "Metal fabricator", city: "Pune", type: "OFFER", brief: "10% off grills till Diwali", title: "Diwali offer" });
  assert.match(instructions, /Never invent prices, discounts/);
  assert.match(instructions, /no phone numbers, links/);
  assert.match(input, /"10% off grills till Diwali"/);
  assert.match(input, /Title: Diwali offer/);
});
