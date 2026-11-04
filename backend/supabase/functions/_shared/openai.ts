// Minimal OpenAI Responses API client (server only).
// Secrets: OPENAI_API_KEY; optional OPENAI_MODEL (default gpt-5-mini),
// OPENAI_REASONING_EFFORT (default "minimal"; set to "" for models without reasoning).

export class AiUnavailable extends Error {}

/** Concatenates the output_text parts. The raw REST response has no top-level
 *  `output_text` (that is an SDK convenience), so read `output[].content[]`. */
export function extractText(data: Record<string, any>): string {
  if (typeof data.output_text === "string") return data.output_text;
  return ((data.output ?? []) as Record<string, any>[])
    .filter((o) => o.type === "message")
    .flatMap((o) => (o.content ?? []) as Record<string, any>[])
    .filter((c) => c.type === "output_text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("")
    .trim();
}

export async function generateText(instructions: string, input: string, maxOutputTokens = 400): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new AiUnavailable("OPENAI_API_KEY is not set");

  const effort = Deno.env.get("OPENAI_REASONING_EFFORT") ?? "minimal";
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-5-mini",
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
      ...(effort ? { reasoning: { effort } } : {}),
    }),
  });
  if (!res.ok) {
    console.error("openai failed", res.status, await res.text());
    throw new AiUnavailable(`OpenAI ${res.status}`);
  }
  const text = extractText(await res.json());
  if (!text) throw new AiUnavailable("empty response");
  return text;
}
