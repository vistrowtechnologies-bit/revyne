// ─────────────────────────────────────────────────────────────────────────────
// gmb-api  — Google Business Profile API proxy
//
// Actions
//   get_profile       Fetch the GMB location profile
//   list_reviews      Fetch + cache up to 50 reviews from GMB
//   post_reply        Post an AI-generated or manual reply to a review
//   delete_reply      Delete an existing reply
//   health_score      Compute a health score from profile + review data
//   optimize_profile  Ask OpenAI to suggest SEO-friendly description improvements
// ─────────────────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type TokenRow = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  location_id: string | null;
  account_name: string | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function serviceHeaders() {
  return {
    apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

async function supabaseRequest(path: string, init: RequestInit) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("Supabase URL not configured");
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders(), ...(init.headers || {}) }
  });
}

async function getUserFromToken(authHeader: string): Promise<{ id: string } | null> {
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return null;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: serviceRoleKey }
  });
  if (!res.ok) return null;
  return await res.json().catch(() => null);
}

// Fetch the token row + refresh the access_token if it has expired (or expires soon)
async function getValidToken(userId: string): Promise<TokenRow | null> {
  const res = await supabaseRequest(
    `gmb_tokens?user_id=eq.${encodeURIComponent(userId)}&select=access_token,refresh_token,expires_at,location_id,account_name&limit=1`,
    { method: "GET" }
  );
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []) as TokenRow[];
  if (!rows.length) return null;

  const row = rows[0];

  // Refresh if token expires within 5 minutes
  const expiresMs = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const needsRefresh = Date.now() > expiresMs - 5 * 60 * 1000;

  if (needsRefresh && row.refresh_token) {
    const clientId     = Deno.env.get("GOOGLE_GMB_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_GMB_CLIENT_SECRET");
    if (!clientId || !clientSecret) return row; // use potentially-expired token as fallback

    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: row.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token"
      })
    });

    if (refreshRes.ok) {
      const newTokens = await refreshRes.json() as Record<string, unknown>;
      const newAccess  = newTokens.access_token as string;
      const newExpires = new Date(Date.now() + ((newTokens.expires_in as number) || 3600) * 1000).toISOString();

      await supabaseRequest(`gmb_tokens?user_id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: JSON.stringify({ access_token: newAccess, expires_at: newExpires, updated_at: new Date().toISOString() })
      });

      row.access_token = newAccess;
      row.expires_at   = newExpires;
    }
  }

  return row;
}

// Map GMB star rating string to a number
function starToNum(s: string | undefined): number {
  const map: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return map[s ?? ""] ?? 0;
}

// Compute a 0-100 health score from profile + review metrics
function computeHealthScore(profile: Record<string, unknown>, reviews: Array<Record<string, unknown>>) {
  let score = 0;
  const details: Record<string, { earned: number; max: number; label: string; tip?: string }> = {};

  // ── Profile completeness (60 pts) ──────────────────────────────
  const hasTitle       = Boolean(profile.title);
  const hasDesc        = Boolean(profile.profile?.description ?? profile.description);
  const hasCategory    = Boolean(profile.primaryCategory);
  const hasPhone       = Boolean((profile.phoneNumbers as Record<string, unknown> | undefined)?.primaryPhone);
  const hasWebsite     = Boolean(profile.websiteUri);
  const hasAddress     = Boolean(profile.storefrontAddress);
  const hasHours       = Boolean(profile.regularHours);
  const hasPhotos      = Boolean((profile.metadata as Record<string, unknown> | undefined)?.hasGoogleUpdated !== undefined);

  details.title       = { earned: hasTitle    ? 10 : 0, max: 10, label: "Business name",    tip: hasTitle    ? undefined : "Add your business name in GMB." };
  details.description = { earned: hasDesc     ? 20 : 0, max: 20, label: "Business description", tip: hasDesc ? undefined : "Add a keyword-rich description (up to 750 characters)." };
  details.category    = { earned: hasCategory ? 10 : 0, max: 10, label: "Business category", tip: hasCategory ? undefined : "Select the most relevant primary category." };
  details.phone       = { earned: hasPhone    ? 5  : 0, max: 5,  label: "Phone number",     tip: hasPhone    ? undefined : "Add a local phone number." };
  details.website     = { earned: hasWebsite  ? 5  : 0, max: 5,  label: "Website URL",      tip: hasWebsite  ? undefined : "Link your website for better visibility." };
  details.address     = { earned: hasAddress  ? 5  : 0, max: 5,  label: "Address",          tip: hasAddress  ? undefined : "Add your physical address." };
  details.hours       = { earned: hasHours    ? 5  : 0, max: 5,  label: "Business hours",   tip: hasHours    ? undefined : "Set your opening hours." };

  score += Object.values(details).reduce((s, d) => s + d.earned, 0);

  // ── Reviews (25 pts) ──────────────────────────────────────────
  const totalReviews  = reviews.length;
  const avgRating     = totalReviews > 0
    ? reviews.reduce((s, r) => s + starToNum(r.starRating as string), 0) / totalReviews
    : 0;
  const ratingScore   = avgRating >= 4.5 ? 15 : avgRating >= 4.0 ? 10 : avgRating >= 3.5 ? 5 : 0;
  const countScore    = totalReviews >= 50 ? 10 : totalReviews >= 20 ? 7 : totalReviews >= 5 ? 4 : totalReviews >= 1 ? 2 : 0;

  details.rating = { earned: ratingScore, max: 15, label: `Avg rating (${avgRating.toFixed(1)}★)`, tip: ratingScore < 15 ? "Encourage satisfied customers to leave reviews." : undefined };
  details.count  = { earned: countScore,  max: 10, label: `Total reviews (${totalReviews})`,        tip: countScore  < 10 ? "Aim for 50+ reviews to boost search ranking." : undefined };
  score += ratingScore + countScore;

  // ── Response rate (15 pts) ────────────────────────────────────
  const withReply    = reviews.filter(r => r.reviewReply).length;
  const responseRate = totalReviews > 0 ? withReply / totalReviews : 0;
  const responseScore = responseRate >= 0.9 ? 15 : responseRate >= 0.6 ? 10 : responseRate >= 0.3 ? 5 : 0;

  details.responseRate = {
    earned: responseScore,
    max: 15,
    label: `Response rate (${Math.round(responseRate * 100)}%)`,
    tip: responseScore < 15 ? "Reply to all reviews — especially negative ones — to show you care." : undefined
  };
  score += responseScore;

  return { score: Math.min(100, score), details };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

  const user = await getUserFromToken(authHeader);
  if (!user?.id) return jsonResponse({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400); }

  const action = typeof body.action === "string" ? body.action : "";

  const tokenRow = await getValidToken(user.id);
  if (!tokenRow?.location_id) {
    return jsonResponse({ error: "Google Business Profile not connected" }, 403);
  }

  const { access_token: accessToken, location_id: locationId } = tokenRow;
  const gmb = (path: string, init?: RequestInit) =>
    fetch(`https://mybusiness.googleapis.com/v4/${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers || {})
      }
    });

  // ── get_profile ─────────────────────────────────────────────────────────────
  if (action === "get_profile") {
    // Use Business Information API
    const res = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?readMask=name,title,storefrontAddress,websiteUri,regularHours,phoneNumbers,profile,primaryCategory,categories,metadata`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("GMB get_profile failed:", err);
      return jsonResponse({ error: "Could not fetch profile from Google" }, 502);
    }
    const profile = await res.json();
    return jsonResponse({ profile });
  }

  // ── list_reviews ────────────────────────────────────────────────────────────
  if (action === "list_reviews") {
    const res = await gmb(`${locationId}/reviews?pageSize=50&orderBy=updateTime+desc`);
    if (!res.ok) {
      const err = await res.text();
      console.error("GMB list_reviews failed:", err);
      return jsonResponse({ error: "Could not fetch reviews from Google" }, 502);
    }
    const data = await res.json() as Record<string, unknown>;
    const reviews = (data.reviews as Array<Record<string, unknown>>) || [];

    // Cache reviews in gmb_reviews table
    if (reviews.length > 0) {
      const rows = reviews.map((r) => ({
        id: r.name as string,
        user_id: user.id,
        location_id: locationId,
        reviewer_name: (r.reviewer as Record<string, unknown>)?.displayName ?? null,
        reviewer_photo: (r.reviewer as Record<string, unknown>)?.profilePhotoUrl ?? null,
        star_rating: r.starRating ?? null,
        comment: r.comment ?? null,
        create_time: r.createTime ?? null,
        update_time: r.updateTime ?? null,
        reply_comment: (r.reviewReply as Record<string, unknown>)?.comment ?? null,
        reply_update_time: (r.reviewReply as Record<string, unknown>)?.updateTime ?? null,
        synced_at: new Date().toISOString()
      }));

      await supabaseRequest("gmb_reviews", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(rows)
      });
    }

    return jsonResponse({ reviews, totalReviewCount: data.totalReviewCount ?? reviews.length });
  }

  // ── post_reply ──────────────────────────────────────────────────────────────
  if (action === "post_reply") {
    const reviewName = typeof body.review_name === "string" ? body.review_name.trim() : "";
    const comment    = typeof body.comment     === "string" ? body.comment.trim()     : "";

    if (!reviewName || !comment) {
      return jsonResponse({ error: "review_name and comment are required" }, 400);
    }
    if (comment.length > 4096) {
      return jsonResponse({ error: "Reply too long (max 4096 characters)" }, 400);
    }

    const res = await gmb(`${reviewName}/reply`, {
      method: "PUT",
      body: JSON.stringify({ comment })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("GMB post_reply failed:", err);
      return jsonResponse({ error: "Could not post reply to Google" }, 502);
    }

    // Update local cache
    await supabaseRequest(
      `gmb_reviews?id=eq.${encodeURIComponent(reviewName)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ reply_comment: comment, reply_update_time: new Date().toISOString() })
      }
    );

    return jsonResponse({ posted: true });
  }

  // ── delete_reply ────────────────────────────────────────────────────────────
  if (action === "delete_reply") {
    const reviewName = typeof body.review_name === "string" ? body.review_name.trim() : "";
    if (!reviewName) return jsonResponse({ error: "review_name is required" }, 400);

    const res = await gmb(`${reviewName}/reply`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) {
      return jsonResponse({ error: "Could not delete reply" }, 502);
    }

    await supabaseRequest(
      `gmb_reviews?id=eq.${encodeURIComponent(reviewName)}`,
      { method: "PATCH", body: JSON.stringify({ reply_comment: null, reply_update_time: null }) }
    );

    return jsonResponse({ deleted: true });
  }

  // ── health_score ────────────────────────────────────────────────────────────
  if (action === "health_score") {
    // Fetch profile
    const profileRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?readMask=name,title,storefrontAddress,websiteUri,regularHours,phoneNumbers,profile,primaryCategory,metadata`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const profile: Record<string, unknown> = profileRes.ok ? await profileRes.json() : {};

    // Fetch reviews (up to 50)
    const reviewsRes = await gmb(`${locationId}/reviews?pageSize=50`);
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() as Record<string, unknown> : {};
    const reviews = (reviewsData.reviews as Array<Record<string, unknown>>) ?? [];

    const { score, details } = computeHealthScore(profile, reviews);

    return jsonResponse({ score, details, profile, reviewCount: reviews.length });
  }

  // ── optimize_profile ────────────────────────────────────────────────────────
  if (action === "optimize_profile") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const model  = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    if (!apiKey) return jsonResponse({ error: "OpenAI not configured" }, 500);

    const currentDescription = typeof body.current_description === "string" ? body.current_description.trim() : "";
    const businessName     = typeof body.business_name     === "string" ? body.business_name.trim()     : "";
    const businessCategory = typeof body.business_category === "string" ? body.business_category.trim() : "";
    const city             = typeof body.city              === "string" ? body.city.trim()              : "";
    const services         = typeof body.services          === "string" ? body.services.trim()          : "";
    const keywords         = typeof body.keywords          === "string" ? body.keywords.trim()          : "";

    const prompt = [
      "You are an expert Google Business Profile SEO consultant.",
      "Generate 2 improved business descriptions for a Google Business Profile.",
      "Requirements: under 750 characters each, naturally include relevant local SEO keywords,",
      "sound genuine and customer-focused, highlight unique selling points.",
      "Do NOT keyword-stuff or make it sound like an advertisement.",
      `Business name: ${businessName || "not provided"}.`,
      `Category: ${businessCategory || "not provided"}.`,
      `City: ${city || "not provided"}.`,
      `Services: ${services || "not provided"}.`,
      `Keywords to include naturally: ${keywords || "not provided"}.`,
      `Current description: ${currentDescription || "none"}.`,
      'Return JSON: {"descriptions":["...","..."]}'
    ].join("\n");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a Google Business Profile SEO expert. Return compact valid JSON only." },
          { role: "user", content: prompt }
        ],
        max_tokens: 600
      })
    });

    if (!aiRes.ok) return jsonResponse({ error: "AI request failed" }, 502);
    const aiData = await aiRes.json() as Record<string, unknown>;
    const rawText = ((aiData.choices as Array<Record<string, unknown>>)?.[0]?.message as Record<string, unknown>)?.content as string ?? "";

    try {
      const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      const descriptions = (parsed.descriptions as string[]).filter(d => typeof d === "string").slice(0, 2);
      return jsonResponse({ descriptions });
    } catch {
      return jsonResponse({ error: "Could not parse AI response", raw: rawText }, 502);
    }
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
