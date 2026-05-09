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
  action?: "review_suggestions" | "smart_replies";
  rating?: number;
  experience?: string;
  selectedService?: string;
  selectedProduct?: string;
  depth?: "standard" | "seo_deep";
  customerName?: string;
  reviewText?: string;
  business?: BusinessInput;
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

function getClientIdentifier(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) return `auth:${authHeader.slice(-32)}`;
  const forwardedFor = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "";
  const ip = forwardedFor.split(",")[0]?.trim();
  return `ip:${ip || "unknown"}`;
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

  const validationError = validateBody(body);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }
  body = normalizeBody(body);

  const rate = await checkRateLimit(req, `generate-ai:${body.action}`, 60, 60 * 60);
  if (!rate.allowed) {
    return jsonResponse({ error: "Too many AI requests. Please try again later." }, 429);
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
    return jsonResponse({ [key]: items });
  } catch {
    return jsonResponse({ error: "Could not parse AI response", raw: outputText }, 502);
  }
});
