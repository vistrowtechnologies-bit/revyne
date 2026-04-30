const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type PlanId = "pro" | "pro_max" | "pro_yearly";

const planConfig: Record<PlanId, { env: string; cycles: number; label: string }> = {
  pro: { env: "RAZORPAY_PLAN_PRO_MONTHLY", cycles: 120, label: "Pro Monthly" },
  pro_max: { env: "RAZORPAY_PLAN_PRO_MAX_MONTHLY", cycles: 120, label: "Pro Max Monthly" },
  pro_yearly: { env: "RAZORPAY_PLAN_PRO_YEARLY", cycles: 10, label: "Pro Yearly" }
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

async function upsertPendingProfile(user: Record<string, unknown>, plan: PlanId, subscription: Record<string, unknown>) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase service role is not configured");

  const email = typeof user.email === "string" ? user.email : null;
  const metadata = typeof user.user_metadata === "object" && user.user_metadata
    ? user.user_metadata as Record<string, unknown>
    : {};
  const fullName = typeof metadata.full_name === "string"
    ? metadata.full_name
    : typeof metadata.name === "string"
      ? metadata.name
      : null;

  const profile = {
    id: user.id,
    email,
    full_name: fullName,
    plan,
    plan_status: "pending",
    razorpay_subscription_id: subscription.id,
    updated_at: new Date().toISOString()
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(profile)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Could not update pending profile: ${detail}`);
  }
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

  let body: { plan?: PlanId; returnUrl?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const selectedPlan = body.plan;
  if (!selectedPlan || !planConfig[selectedPlan]) {
    return jsonResponse({ error: "Invalid plan" }, 400);
  }

  const user = await getCurrentUser(authHeader);
  if (!user?.id) {
    return jsonResponse({ error: "Login required" }, 401);
  }

  const config = planConfig[selectedPlan];
  const razorpayPlanId = Deno.env.get(config.env);
  if (!razorpayPlanId) {
    return jsonResponse({ error: `${config.env} is not configured` }, 500);
  }

  const notes = {
    app: "revyne",
    user_id: String(user.id),
    plan: selectedPlan,
    return_url: body.returnUrl || ""
  };

  const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      plan_id: razorpayPlanId,
      total_count: config.cycles,
      quantity: 1,
      customer_notify: true,
      notes
    })
  });

  const subscription = await response.json();
  if (!response.ok) {
    return jsonResponse({ error: "Could not create Razorpay subscription", detail: subscription }, 502);
  }

  await upsertPendingProfile(user, selectedPlan, subscription);

  return jsonResponse({
    subscriptionId: subscription.id,
    shortUrl: subscription.short_url,
    plan: selectedPlan,
    label: config.label
  });
});
