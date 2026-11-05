// Run: node --experimental-strip-types --test profile_edit.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDescriptionPrompt,
  descriptionPatch,
  EditError,
  hoursPatch,
  phonePatch,
  specialHoursPatch,
  websitePatch,
} from "./profile_edit.ts";

test("description: trims, caps at 750 chars and rejects links", () => {
  assert.deepEqual(descriptionPatch("  We weld gates.  "), { body: { profile: { description: "We weld gates." } }, updateMask: "profile.description" });
  assert.throws(() => descriptionPatch("a".repeat(751)), EditError);
  assert.throws(() => descriptionPatch("Visit www.example.com"), /links/);
  assert.throws(() => descriptionPatch("See https://x.co"), /links/);
});

test("phone: normalises Indian numbers to +91 and keeps extra numbers", () => {
  assert.equal((phonePatch("088559 67773").body.phoneNumbers as any).primaryPhone, "+91 8855967773");
  assert.equal((phonePatch("+91 98765-43210").body.phoneNumbers as any).primaryPhone, "+91 9876543210");
  assert.deepEqual((phonePatch("9876543210", ["+91 2027130000"]).body.phoneNumbers as any).additionalPhones, ["+91 2027130000"]);
  assert.throws(() => phonePatch("12345"), EditError);
});

test("website: adds https, allows clearing, rejects junk", () => {
  assert.equal(websitePatch("swamykripa.in").body.websiteUri, "https://swamykripa.in");
  assert.equal(websitePatch("").body.websiteUri, "");
  assert.throws(() => websitePatch("not a site"), EditError);
});

test("hours: one period per day, overnight closes on the next day", () => {
  const { body, updateMask } = hoursPatch([
    { day: "MONDAY", open: "09:00", close: "18:30" },
    { day: "SATURDAY", open: "18:00", close: "02:00" },
    { day: "SUNDAY", open: "10:00", close: "24:00" },
  ]);
  const periods = (body.regularHours as any).periods;
  assert.equal(updateMask, "regularHours");
  assert.deepEqual(periods[0], { openDay: "MONDAY", openTime: { hours: 9 }, closeDay: "MONDAY", closeTime: { hours: 18, minutes: 30 } });
  assert.equal(periods[1].closeDay, "SUNDAY");
  assert.equal(periods[2].closeDay, "SUNDAY"); // 24:00 is end of the same day
  assert.throws(() => hoursPatch([{ day: "MONDAY", open: "9", close: "18:00" }]), EditError);
  assert.throws(() => hoursPatch([{ day: "MONDAY", open: "09:00", close: "09:00" }]), EditError);
  assert.throws(() => hoursPatch([{ day: "MONDAY", open: "09:00", close: "10:00" }, { day: "MONDAY", open: "11:00", close: "12:00" }]), EditError);
  assert.deepEqual((hoursPatch([]).body.regularHours as any).periods, []);
});

test("holiday hours: closed days, short days, and no past dates", () => {
  const today = new Date("2026-11-05T10:00:00Z");
  const { body } = specialHoursPatch(
    [{ date: "2026-11-08", closed: true }, { date: "2026-11-09", closed: false, open: "10:00", close: "14:00" }],
    today,
  );
  const p = (body.specialHours as any).specialHourPeriods;
  assert.deepEqual(p[0], { startDate: { year: 2026, month: 11, day: 8 }, closed: true });
  assert.deepEqual(p[1].openTime, { hours: 10 });
  assert.throws(() => specialHoursPatch([{ date: "2026-11-01", closed: true }], today), /today or later/);
  assert.throws(() => specialHoursPatch([{ date: "2026-11-09", closed: false }], today), EditError);
  assert.throws(() => specialHoursPatch([{ date: "2026-11-09", closed: false, open: "14:00", close: "10:00" }], today), EditError);
});

test("AI description prompt forbids invented facts and Google-banned content", () => {
  const { instructions, input } = buildDescriptionPrompt({
    businessName: "Swamy Kripa",
    category: "Metal fabricator",
    city: "Pune",
    products: ["Gates", "Grills"],
    current: "",
  });
  assert.match(instructions, /ONLY the facts given/);
  assert.match(instructions, /never pad/);
  const withSamples = buildDescriptionPrompt({ businessName: "X", category: null, city: null, products: ["Sample product A", "Test item", "Gates"], current: "" });
  assert.match(withSamples.input, /Products and services: Gates$/m);
  assert.match(buildDescriptionPrompt({ businessName: "X", category: null, city: null, products: ["Sample product B"], current: "" }).input, /Products and services: not given/);
  assert.match(instructions, /no links, phone numbers/);
  assert.match(input, /Gates, Grills/);
  assert.match(input, /Current description: none/);
});
