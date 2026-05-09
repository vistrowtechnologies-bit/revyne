const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
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

async function supabaseRequest(path: string, init: RequestInit) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase service role is not configured");

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

async function getCurrentUser(authHeader: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase service role is not configured");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: authHeader
    }
  });

  if (!response.ok) return null;
  return await response.json();
}

async function getProfile(userId: string) {
  const response = await supabaseRequest(
    `profiles?select=id,plan,plan_status,razorpay_subscription_id,plan_current_end&id=eq.${encodeURIComponent(userId)}&limit=1`,
    { method: "GET" }
  );

  if (!response.ok) throw new Error(await response.text());
  const rows = await response.json();
  return Array.isArray(rows) && rows.length ? rows[0] as Record<string, unknown> : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    return jsonResponse({ error: "Razorpay keys are not configured" }, 500);
  }

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Login required" }, 401);
  }

  const user = await getCurrentUser(authHeader);
  if (!user?.id) return jsonResponse({ error: "Login required" }, 401);

  const profile = await getProfile(String(user.id));
  const subscriptionId = typeof profile?.razorpay_subscription_id === "string"
    ? profile.razorpay_subscription_id
    : "";

  if (!subscriptionId) {
    return jsonResponse({ error: "No active Razorpay subscription found" }, 400);
  }

  const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ cancel_at_cycle_end: 1 })
  });

  const result = await response.json();
  if (!response.ok) {
    return jsonResponse({ error: "Could not cancel Razorpay subscription", detail: result }, 502);
  }

  const currentEnd = typeof profile?.plan_current_end === "string" ? profile.plan_current_end : null;
  await supabaseRequest(`profiles?id=eq.${encodeURIComponent(String(user.id))}`, {
    method: "PATCH",
    body: JSON.stringify({
      plan_status: "cancel_requested",
      updated_at: new Date().toISOString()
    })
  });

  await supabaseRequest(`businesses?owner_id=eq.${encodeURIComponent(String(user.id))}`, {
    method: "PATCH",
    body: JSON.stringify({
      owner_plan_status: "cancel_requested",
      owner_plan_current_end: currentEnd,
      updated_at: new Date().toISOString()
    })
  });

  await supabaseRequest("payment_events", {
    method: "POST",
    body: JSON.stringify({
      user_id: String(user.id),
      event_id: `cancel_requested:${subscriptionId}:${Date.now()}`,
      event_name: "subscription.cancel_requested",
      plan: typeof profile?.plan === "string" ? profile.plan : null,
      razorpay_subscription_id: subscriptionId,
      status: "cancel_requested",
      processing_status: "profile_updated",
      profile_updated: true,
      payload: { razorpay: result, requested_at: new Date().toISOString() }
    })
  });

  return jsonResponse({
    cancelled: true,
    subscriptionId,
    status: "cancel_requested",
    currentEnd
  });
});
