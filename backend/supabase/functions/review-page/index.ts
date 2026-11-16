// ─────────────────────────────────────────────────────────────────────────────
// review-page — public endpoint behind the customer review page (/r/<slug>).
// No sign-in: customers are anonymous. Abuse is limited per visitor (hashed
// IP + business + day, never the raw IP) and per business per day.
//
// Actions (POST JSON):
//   draft    { slug, sessionId?, rating, highlights, words, language } → { sessionId, draft }
//   event    { slug, sessionId?, type: copied|opened_google, rating?, highlights?, words?, language?, text? } → { sessionId }
//   feedback { slug, sessionId?, rating?, message, contactName?, contact? } → { ok }
//
// Secrets: OPENAI_API_KEY (+ optional OPENAI_MODEL / OPENAI_REASONING_EFFORT),
// REVIEW_PAGE_ORIGINS (comma list; defaults to revyneai.com + local dev).
// ─────────────────────────────────────────────────────────────────────────────

import { notifyUser } from "../_shared/fcm.ts";
import { db, str } from "../_shared/http.ts";
import { AiUnavailable, generateText } from "../_shared/openai.ts";
import { buildReviewPrompt, REVIEW_LANGUAGES } from "../_shared/review_prompt.ts";

const LIMITS = {
  draftsPerSession: 3,
  draftsPerVisitorHour: 8,
  draftsPerBusinessDay: 300,
  feedbackPerVisitorHour: 5,
};

const allowedOrigins = (Deno.env.get("REVIEW_PAGE_ORIGINS") ?? "https://revyneai.com,https://www.revyneai.com,http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

type Business = { id: string; owner_id: string; name: string; category: string | null };

async function businessBySlug(slug: string): Promise<Business | null> {
  if (!/^[a-z0-9]{6,32}$/.test(slug)) return null;
  const res = await db(`businesses?public_slug=eq.${slug}&select=id,owner_id,name,category&limit=1`);
  const rows = res.ok ? await res.json() as Business[] : [];
  return rows[0] ?? null;
}

async function visitorHash(req: Request, businessId: string): Promise<string> {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const salt = Deno.env.get("GBP_TOKEN_KEY") ?? "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}|${businessId}|${day}|${salt}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function count(path: string): Promise<number> {
  const res = await db(path, { method: "HEAD", headers: { Prefer: "count=exact" } });
  // A failed count must not silently allow unlimited use.
  if (!res.ok) return Number.MAX_SAFE_INTEGER;
  return Number(res.headers.get("content-range")?.split("/")[1] ?? Number.MAX_SAFE_INTEGER);
}

function since(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

function cleanInput(body: Record<string, unknown>) {
  const rating = Number(body.rating);
  const highlights = Array.isArray(body.highlights)
    ? body.highlights.filter((h): h is string => typeof h === "string").map((h) => h.trim().slice(0, 40)).filter(Boolean).slice(0, 12)
    : [];
  const language = str(body.language, 16);
  return {
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
    highlights,
    words: str(body.words, 500),
    language: language in REVIEW_LANGUAGES ? language : "en",
  };
}

async function sessionFor(businessId: string, sessionId: string): Promise<{ id: string; drafts_generated: number } | null> {
  if (!/^[0-9a-f-]{36}$/.test(sessionId)) return null;
  const res = await db(`review_sessions?id=eq.${sessionId}&business_id=eq.${businessId}&select=id,drafts_generated`);
  const rows = res.ok ? await res.json() as { id: string; drafts_generated: number }[] : [];
  return rows[0] ?? null;
}

async function upsertSession(existingId: string | null, values: Record<string, unknown>): Promise<string> {
  const res = existingId
    ? await db(`review_sessions?id=eq.${existingId}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(values) })
    : await db("review_sessions", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(values) });
  if (!res.ok) throw new Error(`session write ${res.status} ${await res.text()}`);
  const [row] = await res.json();
  return row.id;
}

Deno.serve(async (req) => {
  const headers = cors(req);
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Invalid JSON" }, 400);
  }

  const business = await businessBySlug(str(body.slug, 32));
  if (!business) return reply({ error: "This review link is not valid." }, 404);
  const visitor = await visitorHash(req, business.id);
  const existing = await sessionFor(business.id, str(body.sessionId, 36));

  try {
    switch (str(body.action, 16)) {
      case "draft": {
        const input = cleanInput(body);
        if (!input.rating) return reply({ error: "Please choose a star rating." }, 400);

        if ((existing?.drafts_generated ?? 0) >= LIMITS.draftsPerSession) {
          return reply({ error: "limit", message: "You've used all suggestions for this review. You can edit the text yourself." }, 429);
        }
        const visitorDrafts = await count(`review_sessions?visitor_hash=eq.${visitor}&created_at=gte.${since(3600_000)}&drafts_generated=gt.0`);
        const businessDrafts = await count(`review_sessions?business_id=eq.${business.id}&created_at=gte.${since(86400_000)}&drafts_generated=gt.0`);
        if (visitorDrafts >= LIMITS.draftsPerVisitorHour || businessDrafts >= LIMITS.draftsPerBusinessDay) {
          return reply({ error: "limit", message: "Too many requests right now. You can write your review yourself." }, 429);
        }

        const { instructions, input: prompt } = buildReviewPrompt({
          businessName: business.name,
          category: business.category,
          rating: input.rating,
          highlights: input.highlights,
          words: input.words,
          language: input.language,
        });
        const draft = (await generateText(instructions, prompt)).slice(0, 2000);

        const sessionId = await upsertSession(existing?.id ?? null, {
          business_id: business.id,
          rating: input.rating,
          highlights: input.highlights,
          customer_words: input.words || null,
          language: input.language,
          draft,
          drafts_generated: (existing?.drafts_generated ?? 0) + 1,
          visitor_hash: visitor,
        });
        return reply({ sessionId, draft });
      }

      case "event": {
        const type = str(body.type, 16);
        if (type !== "copied" && type !== "opened_google") return reply({ error: "Unknown event" }, 400);
        const input = cleanInput(body);
        const text = str(body.text, 2000);
        const values: Record<string, unknown> = {
          business_id: business.id,
          visitor_hash: visitor,
          [type === "copied" ? "copied_at" : "opened_google_at"]: new Date().toISOString(),
        };
        // Customers who write without AI still get a session, so owners see the visit.
        if (!existing) Object.assign(values, { rating: input.rating, highlights: input.highlights, customer_words: input.words || null, language: input.language });
        if (text) values.draft = text;
        return reply({ sessionId: await upsertSession(existing?.id ?? null, values) });
      }

      case "feedback": {
        const message = str(body.message, 1000);
        if (!message) return reply({ error: "Please write a message." }, 400);
        const recent = await count(`private_feedback?visitor_hash=eq.${visitor}&created_at=gte.${since(3600_000)}`);
        if (recent >= LIMITS.feedbackPerVisitorHour) return reply({ error: "Too many messages. Please try again later." }, 429);

        const res = await db("private_feedback", {
          method: "POST",
          body: JSON.stringify({
            business_id: business.id,
            session_id: existing?.id ?? null,
            rating: cleanInput(body).rating,
            message,
            contact_name: str(body.contactName, 80) || null,
            contact: str(body.contact, 120) || null,
            visitor_hash: visitor,
          }),
        });
        if (!res.ok) throw new Error(`feedback write ${res.status} ${await res.text()}`);
        // Tell the owner (never fails the customer's request).
        const who = str(body.contactName, 80) || "A customer";
        await notifyUser(business.owner_id, {
          kind: "message",
          title: "New private message",
          body: `${who}: “${message.length > 100 ? `${message.slice(0, 97)}…` : message}”`,
          route: "/reviews?tab=private",
        });
        return reply({ ok: true });
      }

      default:
        return reply({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof AiUnavailable) {
      return reply({ error: "ai_unavailable", message: "Suggestions aren't available right now — you can write your review yourself." }, 503);
    }
    console.error("review-page failed", e);
    return reply({ error: "Something went wrong. Please try again." }, 500);
  }
});
