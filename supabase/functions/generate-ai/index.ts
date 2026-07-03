const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type BusinessInput = {
  name?: string;
  category?: string;
  city?: string;
  services?: string;
  keywords?: string;
  language?: string;
  tone?: string;
};

type RequestBody = {
  action?: "review_suggestions" | "smart_replies" | "save_review_request" | "mark_review_copied";
  rating?: number;
  experience?: string;
  selectedService?: string;
  selectedProduct?: string;
  depth?: "standard" | "seo_deep";
  customerName?: string;
  reviewText?: string;
  business?: BusinessInput;
  // save_review_request fields
  business_id?: string;
  customer_experience?: string | null;
  customer_language?: string;
  suggestions?: string[];
  // mark_review_copied fields
  request_id?: string;
};

const FIELD_LIMITS = {
  businessName: 120,
  businessCategory: 80,
  city: 80,
  services: 500,
  keywords: 300,
  language: 40,
  tone: 40,
  customerName: 80,
  selectedService: 120,
  selectedProduct: 120,
  experience: 1200,
  reviewText: 1200
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeRating(value: unknown) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

function normalizeBody(body: RequestBody) {
  const business = body.business || {};
  const rating = normalizeRating(body.rating);

  return {
    ...body,
    rating: rating || undefined,
    experience: cleanText(body.experience, FIELD_LIMITS.experience),
    selectedService: cleanText(body.selectedService, FIELD_LIMITS.selectedService),
    selectedProduct: cleanText(body.selectedProduct, FIELD_LIMITS.selectedProduct),
    customerName: cleanText(body.customerName, FIELD_LIMITS.customerName),
    reviewText: cleanText(body.reviewText, FIELD_LIMITS.reviewText),
    business: {
      name: cleanText(business.name, FIELD_LIMITS.businessName),
      category: cleanText(business.category, FIELD_LIMITS.businessCategory),
      city: cleanText(business.city, FIELD_LIMITS.city),
      services: cleanText(business.services, FIELD_LIMITS.services),
      keywords: cleanText(business.keywords, FIELD_LIMITS.keywords),
      language: cleanText(business.language, FIELD_LIMITS.language) || "English",
      tone: cleanText(business.tone, FIELD_LIMITS.tone) || "Professional"
    }
  };
}

async function saveReviewRequest(body: RequestBody): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration missing" }, 500);
  }

  const businessId = typeof body.business_id === "string" ? body.business_id.trim() : "";
  const rating = normalizeRating(body.rating);

  if (!businessId || !rating) {
    return jsonResponse({ error: "business_id and rating are required" }, 400);
  }

  // Go through the save_review_request RPC — it validates that the business
  // exists with public reviews enabled AND enforces the 200/hour per-business
  // spam guard. Direct table inserts here would bypass both.
  const suggestions = Array.isArray(body.suggestions)
    ? body.suggestions.filter((s) => typeof s === "string" && s.trim()).slice(0, 3).map((s) => s.trim())
    : [];

  const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/save_review_request`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      p_business_id: businessId,
      p_rating: rating,
      p_experience: body.customer_experience || null,
      p_language: typeof body.customer_language === "string" ? body.customer_language.slice(0, 40) : "English",
      p_suggestions: suggestions
    })
  });

  if (!rpcRes.ok) {
    const errText = await rpcRes.text();
    console.error("save_review_request RPC failed:", errText);
    return jsonResponse({ error: "Could not save review request" }, 500);
  }

  const requestId = await rpcRes.json().catch(() => null);
  return jsonResponse({ saved: true, request_id: requestId });
}

async function markReviewCopied(body: RequestBody): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Server config missing" }, 500);

  const requestId = typeof body.request_id === "string" ? body.request_id.trim() : "";
  if (!requestId) return jsonResponse({ error: "request_id required" }, 400);

  // Ownership guard: only allow marking if the request was created in the last 24 h.
  // This prevents arbitrary callers from falsifying analytics on old / unrelated rows.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const checkRes = await fetch(
    `${supabaseUrl}/rest/v1/review_requests?id=eq.${encodeURIComponent(requestId)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: "application/json" } }
  );
  if (!checkRes.ok) return jsonResponse({ error: "Could not verify request" }, 500);
  const rows = await checkRes.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) {
    return jsonResponse({ error: "Request not found or expired" }, 404);
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${encodeURIComponent(requestId)}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      draft_copied: true,
      copied_at: new Date().toISOString()
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("mark_review_copied failed:", errText);
    return jsonResponse({ error: "Could not mark review copied" }, 500);
  }

  return jsonResponse({ marked: true });
}

function validateBody(body: RequestBody) {
  if (body.action !== "review_suggestions" && body.action !== "smart_replies") {
    return "Invalid action";
  }

  if (!normalizeRating(body.rating)) {
    return "Rating must be a whole number from 1 to 5";
  }

  if (body.action === "review_suggestions" && cleanText(body.experience, FIELD_LIMITS.experience).length < 3) {
    return "Customer experience is required";
  }

  if (body.action === "smart_replies" && cleanText(body.reviewText, FIELD_LIMITS.reviewText).length < 3) {
    return "Review text is required";
  }

  return null;
}

// Decode the JWT payload to get a stable user id. The gateway (verify_jwt)
// validates the signature; we only read claims here. Returns null for the
// anon key or malformed tokens.
function getAuthenticatedUserId(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const parts = authHeader.slice(7).split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.role !== "authenticated") return null;
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function getClientIdentifier(req: Request) {
  // Stable per-user key — the raw token changes on every refresh, which reset
  // the rate-limit window and made it useless for logged-in users.
  const userId = getAuthenticatedUserId(req);
  if (userId) return `user:${userId}`;
  // cf-connecting-ip is set by the edge proxy and not client-forgeable.
  // In x-forwarded-for, clients can PREPEND values — the last entry is the one
  // appended by the trusted proxy, so use that, never the first.
  const cfIp = req.headers.get("cf-connecting-ip") || "";
  if (cfIp) return `ip:${cfIp.trim()}`;
  const forwardedFor = (req.headers.get("x-forwarded-for") || "").split(",");
  const ip = forwardedFor[forwardedFor.length - 1]?.trim();
  return `ip:${ip || "unknown"}`;
}

// ── Server-side monthly plan limits ──────────────────────────────────────────
// These were previously enforced only in the browser, so any direct caller
// could generate unlimited drafts on a free plan.
const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  free: 20,
  pro: 1000,
  pro_max: 2500,
  pro_yearly: 2500
};

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

async function serviceRoleFetch(path: string, init: RequestInit = {}) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return null;
  return await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
}

async function checkPlanUsage(userId: string, action: string): Promise<{ allowed: boolean; used?: number; limit?: number }> {
  try {
    const profileRes = await serviceRoleFetch(
      `profiles?id=eq.${encodeURIComponent(userId)}&select=plan,plan_status,plan_current_end&limit=1`
    );
    if (!profileRes?.ok) return { allowed: true }; // fail open — availability over strictness
    const [profile] = await profileRes.json().catch(() => [null]);

    let plan = typeof profile?.plan === "string" ? profile.plan : "free";
    const status = profile?.plan_status || "free";
    const usableStatuses = ["active", "authenticated"];
    const cancelStillValid = status === "cancel_requested" &&
      (!profile?.plan_current_end || new Date(profile.plan_current_end).getTime() > Date.now());
    if (plan !== "free" && !usableStatuses.includes(status) && !cancelStillValid) plan = "free";

    const limit = PLAN_MONTHLY_LIMITS[plan] ?? PLAN_MONTHLY_LIMITS.free;
    const usageRes = await serviceRoleFetch(
      `usage_limits?user_id=eq.${encodeURIComponent(userId)}&month_key=eq.${monthKey()}&select=review_generations,reply_generations&limit=1`
    );
    if (!usageRes?.ok) return { allowed: true };
    const [usage] = await usageRes.json().catch(() => [null]);
    const used = action === "review_suggestions"
      ? (usage?.review_generations ?? 0)
      : (usage?.reply_generations ?? 0);

    return { allowed: used < limit, used, limit };
  } catch {
    return { allowed: true };
  }
}

async function incrementServerUsage(userId: string, action: string) {
  try {
    const usageRes = await serviceRoleFetch(
      `usage_limits?user_id=eq.${encodeURIComponent(userId)}&month_key=eq.${monthKey()}&select=review_generations,reply_generations&limit=1`
    );
    const [usage] = usageRes?.ok ? await usageRes.json().catch(() => [null]) : [null];
    await serviceRoleFetch(`usage_limits?on_conflict=user_id,month_key`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: userId,
        month_key: monthKey(),
        review_generations: (usage?.review_generations ?? 0) + (action === "review_suggestions" ? 1 : 0),
        reply_generations: (usage?.reply_generations ?? 0) + (action === "smart_replies" ? 1 : 0),
        updated_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.warn("usage increment failed:", err);
  }
}

async function checkRateLimit(req: Request, bucket: string, limit: number, windowSeconds: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return { allowed: true };

  const identifier = getClientIdentifier(req);
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const query = new URL(`${supabaseUrl}/rest/v1/rate_limit_events`);
  query.searchParams.set("select", "id");
  query.searchParams.set("bucket", `eq.${bucket}`);
  query.searchParams.set("identifier", `eq.${identifier}`);
  query.searchParams.set("created_at", `gte.${since}`);

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json"
  };

  const countResponse = await fetch(query, {
    headers: {
      ...headers,
      Prefer: "count=exact"
    }
  });

  const contentRange = countResponse.headers.get("content-range") || "";
  const count = Number(contentRange.split("/")[1] || "0");
  if (Number.isFinite(count) && count >= limit) {
    return { allowed: false, retryAfter: windowSeconds };
  }

  await fetch(`${supabaseUrl}/rest/v1/rate_limit_events`, {
    method: "POST",
    headers,
    body: JSON.stringify({ bucket, identifier })
  });

  return { allowed: true };
}

function parseJsonArray(text: string, key: "suggestions" | "replies") {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  const items = parsed?.[key];
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function systemPrompt() {
  return [
    "You are RevYne, an AI review assistant for honest customer feedback.",
    "Never fabricate visits, purchases, ratings, outcomes, names, dates, discounts, or service details.",
    "Use only the provided customer experience and business context.",
    "Do not pressure users to post positive reviews.",
    "If the rating or experience is negative, preserve the concern in a constructive, natural way.",
    "Return valid compact JSON only. No markdown. Keep wording concise."
  ].join(" ");
}

function reviewPrompt(body: RequestBody) {
  const business = body.business || {};
  const seoDeep = body.depth === "seo_deep";
  return [
    "Generate exactly 3 customer review suggestions.",
    "Each suggestion must be suitable for a real customer to edit before posting.",
    seoDeep
      ? "Create richer, service-specific review wording with natural local SEO phrases. Keep each suggestion under 90 words."
      : "Keep each suggestion under 45 words.",
    "Do not keyword-stuff. The wording must sound like a real customer, not an advertisement.",
    `Language: ${business.language || "English"}.`,
    `Tone: ${business.tone || "Professional"}.`,
    `Rating: ${body.rating || "not provided"} stars.`,
    `Business name: ${business.name || ""}.`,
    `Category: ${business.category || ""}.`,
    `City: ${business.city || ""}.`,
    `Services: ${business.services || ""}.`,
    `Keywords: ${business.keywords || ""}.`,
    `Selected service: ${body.selectedService || ""}.`,
    `Selected product or type: ${body.selectedProduct || ""}.`,
    `Customer's own experience: ${body.experience || ""}.`,
    'Return JSON in this exact shape: {"suggestions":["...","...","..."]}'
  ].join("\n");
}

function replyPrompt(body: RequestBody) {
  const business = body.business || {};
  return [
    "Generate exactly 2 professional business replies to a customer review.",
    "Keep replies warm, concise, and suitable for Google Business Profile.",
    "Keep each reply under 45 words.",
    "Do not offer compensation or make operational promises unless already stated.",
    `Language: ${business.language || "English"}.`,
    `Tone: ${business.tone || "Professional"}.`,
    `Business name: ${business.name || ""}.`,
    `Category: ${business.category || ""}.`,
    `City: ${business.city || ""}.`,
    `Customer name: ${body.customerName || "there"}.`,
    `Rating: ${body.rating || "not provided"} stars.`,
    `Review text: ${body.reviewText || ""}.`,
    'Return JSON in this exact shape: {"replies":["...","..."]}'
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-5-nano";

  if (!apiKey) {
    return jsonResponse({ error: "OPENAI_API_KEY is not configured" }, 500);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // save_review_request: persist public QR review submissions using service role (bypasses RLS)
  if (body.action === "save_review_request") {
    return saveReviewRequest(body);
  }

  // mark_review_copied: called when customer clicks Copy on a draft (tracks completed sessions)
  if (body.action === "mark_review_copied") {
    return markReviewCopied(body);
  }

  const validationError = validateBody(body);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }
  body = normalizeBody(body);

  const rate = await checkRateLimit(req, `generate-ai:${body.action}`, 60, 60 * 60);
  if (!rate.allowed) {
    return jsonResponse({ error: "Too many AI requests. Please try again later." }, 429);
  }

  // Enforce monthly plan limits server-side for logged-in users.
  const authedUserId = getAuthenticatedUserId(req);
  if (authedUserId) {
    const planUsage = await checkPlanUsage(authedUserId, body.action);
    if (!planUsage.allowed) {
      return jsonResponse({
        error: `Monthly limit reached (${planUsage.used}/${planUsage.limit}). Upgrade your plan for more generations.`
      }, 429);
    }
  }

  const key = body.action === "review_suggestions" ? "suggestions" : "replies";
  const input = [
    { role: "system", content: systemPrompt() },
    {
      role: "user",
      content: body.action === "review_suggestions" ? reviewPrompt(body) : replyPrompt(body)
    }
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input,
      max_output_tokens: body.depth === "seo_deep" ? 520 : 260
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return jsonResponse({ error: "OpenAI request failed", detail: errorText }, 502);
  }

  const data = await response.json();
  const outputText = data.output_text || "";

  try {
    const items = parseJsonArray(outputText, key);
    if (authedUserId && items.length > 0) {
      await incrementServerUsage(authedUserId, body.action);
    }
    return jsonResponse({ [key]: items });
  } catch {
    return jsonResponse({ error: "Could not parse AI response", raw: outputText }, 502);
  }
});
