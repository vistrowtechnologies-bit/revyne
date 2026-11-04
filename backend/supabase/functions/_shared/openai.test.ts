// Run: node --experimental-strip-types --test openai.test.ts   (or: deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractText } from "./openai.ts";

test("reads text from the raw Responses API shape (output[].content[])", () => {
  const raw = {
    output: [
      { type: "reasoning", summary: [] },
      { type: "message", content: [{ type: "output_text", text: "Great sweets, " }, { type: "output_text", text: "friendly staff." }] },
    ],
  };
  assert.equal(extractText(raw), "Great sweets, friendly staff.");
});

test("an empty or reasoning-only response yields an empty string", () => {
  assert.equal(extractText({ output: [{ type: "reasoning", summary: [] }] }), "");
  assert.equal(extractText({}), "");
});

test("uses output_text when an SDK-style field is present", () => {
  assert.equal(extractText({ output_text: "Nice place." }), "Nice place.");
});
