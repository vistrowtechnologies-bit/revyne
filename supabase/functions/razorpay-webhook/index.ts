type RazorpayPayload = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: Record<string, unknown>;
    };
    payment?: {
      entity?: Record<string, unknown>;
    };
  };
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

async function verifySignature(rawBody: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

function timestampToIso(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function mapStatusToPlanStatus(status: unknown) {
  if (status === "active" || status === "authenticated") return "active";
  if (status === "cancelled" || status === "completed" || status === "expired") return "inactive";
  if (status === "halted") return "past_due";
  return "pending";
}

function shouldDowngrade(eventName: string, status: unknown) {
  return [
    "subscription.cancelled",
    "subscription.completed",
    "subscription.expired"
  ].includes(eventName) || ["cancelled", "completed", "expired"].includes(String(status));
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

async function findProfileBySubscription(subscriptionId: string) {
  const response = await supabaseRequest(
    `profiles?select=id,plan,plan_status,plan_current_end&razorpay_subscription_id=eq.${encodeURIComponent(subscriptionId)}&limit=1`,
    { method: "GET" }
  );

  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] as Record<string, unknown> : null;
}

async function syncBusinessPlanSnapshot(userId: string, plan: string, status: string, currentEnd: string | null) {
  await supabaseRequest(`businesses?owner_id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      owner_plan: plan,
      owner_plan_status: status,
      owner_plan_current_end: currentEnd,
      updated_at: new Date().toISOString()
    })
  });
}

async function insertPaymentEvent(eventRow: Record<string, unknown>) {
  return await supabaseRequest("payment_events", {
    method: "POST",
    headers: {
      Prefer: "resolution=ignore-duplicates"
    },
    body: JSON.stringify(eventRow)
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return jsonResponse({ error: "Webhook secret is not configured" }, 500);
  }

  const signature = req.headers.get("x-razorpay-signature") || "";
  const rawBody = await req.text();
  const valid = await verifySignature(rawBody, signature, webhookSecret);
  if (!valid) {
    return jsonResponse({ error: "Invalid signature" }, 401);
  }

  let payload: RazorpayPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const eventName = payload.event || "unknown";
  const subscription = payload.payload?.subscription?.entity || {};
  const payment = payload.payload?.payment?.entity || {};
  const notes = typeof subscription.notes === "object" && subscription.notes
    ? subscription.notes as Record<string, unknown>
    : {};
  let userId = typeof notes.user_id === "string" ? notes.user_id : null;
  let plan = typeof notes.plan === "string" ? notes.plan : null;
  const subscriptionId = typeof subscription.id === "string"
    ? subscription.id
    : typeof payment.subscription_id === "string"
      ? payment.subscription_id
      : null;
  const status = subscription.status || (eventName === "payment.captured" ? "active" : null);

  if ((!userId || !plan) && subscriptionId) {
    const existingProfile = await findProfileBySubscription(subscriptionId);
    if (existingProfile) {
      userId = userId || (typeof existingProfile.id === "string" ? existingProfile.id : null);
      plan = plan || (typeof existingProfile.plan === "string" ? existingProfile.plan : null);
    }
  }

  const nextPlan = shouldDowngrade(eventName, status) ? "free" : plan;
  let processingStatus = "received";
  let processingError: string | null = null;
  let profileUpdated = false;

  if (userId && nextPlan && subscriptionId) {
    const nextStatus = mapStatusToPlanStatus(status);
    const currentEnd = timestampToIso(subscription.current_end);
    const profileUpdate = {
      plan: nextPlan,
      plan_status: nextStatus,
      razorpay_subscription_id: subscriptionId,
      razorpay_customer_id: subscription.customer_id || null,
      plan_current_start: timestampToIso(subscription.current_start),
      plan_current_end: currentEnd,
      updated_at: new Date().toISOString()
    };

    const response = await supabaseRequest(`profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify(profileUpdate)
    });

    if (!response.ok) {
      processingStatus = "profile_update_failed";
      processingError = await response.text();
    } else {
      profileUpdated = true;
      processingStatus = "profile_updated";
      await syncBusinessPlanSnapshot(userId, nextPlan, nextStatus, currentEnd);
    }
  } else {
    processingStatus = "unmatched_profile";
    processingError = "Could not match Razorpay event to a RevYne profile";
  }

  const eventRow = {
    user_id: userId,
    event_id: typeof payment.id === "string" ? `${eventName}:${payment.id}` : `${eventName}:${subscriptionId || crypto.randomUUID()}`,
    event_name: eventName,
    plan,
    razorpay_subscription_id: subscriptionId,
    razorpay_payment_id: typeof payment.id === "string" ? payment.id : null,
    status: typeof status === "string" ? status : null,
    processing_status: processingStatus,
    processing_error: processingError,
    profile_updated: profileUpdated,
    payload
  };

  await insertPaymentEvent(eventRow);

  if (processingStatus === "profile_update_failed") {
    return jsonResponse({ error: "Could not update profile", detail: processingError }, 500);
  }

  return jsonResponse({ received: true });
});
