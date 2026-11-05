// Run: node --experimental-strip-types --test reply_prompt.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReplyPrompt, firstName, originalText, replyFits } from "./reply_prompt.ts";

const base = { businessName: "Sharma Sweets", category: "Sweet shop", tone: "friendly", reviewer: "Priya Sharma", rating: 5, comment: "Fresh kaju katli" };

test("passes rating, mood and review text to the model", () => {
  const { input } = buildReplyPrompt(base);
  assert.match(input, /Rating: 5\/5 \(positive\)/);
  assert.match(input, /"Fresh kaju katli"/);
});

test("uses only the first name, and none for anonymous or odd names", () => {
  assert.match(buildReplyPrompt(base).instructions, /first name: Priya\./);
  assert.equal(firstName(null), null);
  assert.equal(firstName("A Google User"), null);
  assert.equal(firstName("Google User"), null);
  assert.equal(firstName("9876543210"), null);
  assert.equal(firstName("राहुल वर्मा"), "राहुल");
  assert.match(buildReplyPrompt({ ...base, reviewer: null }).instructions, /Do not use a name/);
});

test("forbids invented offers, contact details and asking for rating changes", () => {
  const { instructions } = buildReplyPrompt(base);
  assert.match(instructions, /Never promise discounts, refunds/);
  assert.match(instructions, /never invent phone numbers/);
  assert.match(instructions, /Never ask the reviewer to change/);
  assert.match(instructions, /never ask anyone for 5 stars/);
});

test("negative reviews get an apology and an invitation to talk", () => {
  const { input, instructions } = buildReplyPrompt({ ...base, rating: 2, comment: "Rude staff" });
  assert.match(input, /2\/5 \(negative\)/);
  assert.match(instructions, /apologise sincerely/);
});

test("replies to the original text of a Google-translated review", () => {
  const comment = "(Translated by Google) Very tasty\n\n(Original)\nबहुत स्वादिष्ट";
  assert.equal(originalText(comment), "बहुत स्वादिष्ट");
  assert.match(buildReplyPrompt({ ...base, comment }).input, /"बहुत स्वादिष्ट"/);
  assert.equal(originalText("(Translated by Google) Nice"), "Nice");
});

test("rating-only reviews are marked as having no text", () => {
  assert.match(buildReplyPrompt({ ...base, comment: "" }).input, /none \(rating only\)/);
});

test("reply length is checked in bytes, as Google does", () => {
  assert.equal(replyFits("a".repeat(4096)), true);
  assert.equal(replyFits("अ".repeat(1400)), false); // 3 bytes each
});
