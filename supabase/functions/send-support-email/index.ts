type SupportEmailBody = {
  type?: "new_ticket" | "admin_reply";
  ticket?: Record<string, unknown>;
};

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

async function getAuthenticatedUser(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") || "";

  if (!supabaseUrl || !serviceRoleKey || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: authHeader
    }
  });

  if (!response.ok) return null;
  return await response.json();
}

async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return false;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=is_admin&id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json"
      }
    }
  );
  if (!res.ok) return false;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 && rows[0].is_admin === true;
}

function clean(value: unknown, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function makePlainText(type: string, ticket: Record<string, unknown>) {
  const subject = clean(ticket.subject, "Support ticket");
  const category = clean(ticket.category, "general");
  const priority = clean(ticket.priority, "normal");
  const customerName = clean(ticket.customer_name, "Customer");
  const customerEmail = clean(ticket.customer_email, "No email");
  const message = String(ticket.message || "").trim();
  const response = String(ticket.admin_response || "").trim();
  const ticketId = clean(ticket.id, "local").slice(0, 12);

  if (type === "admin_reply") {
    return [
      `Hi ${customerName},`,
      "",
      "RevYne support has replied to your ticket.",
      "",
      `Ticket: ${subject}`,
      `Status: ${clean(ticket.status, "updated")}`,
      "",
      response || "Your ticket has been updated.",
      "",
      "You can open Help & Support in the RevYne app to view this update.",
      "",
      `Ticket ID: ${ticketId}`
    ].join("\n");
  }

  return [
    "A new RevYne support ticket was created.",
    "",
    `Subject: ${subject}`,
    `Category: ${category}`,
    `Priority: ${priority}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    `Ticket ID: ${ticketId}`,
    "",
    "Message:",
    message || "-"
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const user = await getAuthenticatedUser(req);
  if (!user?.id) {
    return jsonResponse({ error: "Login required" }, 401);
  }

  let body: SupportEmailBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const type = body.type || "new_ticket";

  // admin_reply emails are privileged — verify the caller is actually an admin
  if (type === "admin_reply") {
    const isAdmin = await checkIsAdmin(user.id);
    if (!isAdmin) {
      return jsonResponse({ error: "Admin privileges required" }, 403);
    }
  }

  const ticket = body.ticket || {};
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("SUPPORT_EMAIL_FROM");
  const supportTo = Deno.env.get("SUPPORT_EMAIL_TO") || "revyneai@gmail.com";

  if (!resendApiKey || !from) {
    return jsonResponse({
      sent: false,
      reason: "Email provider is not configured yet"
    });
  }

  const subject = type === "admin_reply"
    ? `RevYne support update: ${clean(ticket.subject, "your ticket")}`
    : `New RevYne support ticket: ${clean(ticket.subject, "Support ticket")}`;
  const to = type === "admin_reply"
    ? clean(ticket.customer_email)
    : supportTo;

  if (!to || !to.includes("@")) {
    return jsonResponse({ sent: false, reason: "No valid recipient email" });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: makePlainText(type, ticket)
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return jsonResponse({ sent: false, error: result?.message || "Email provider rejected the request" }, 502);
  }

  return jsonResponse({ sent: true, id: result?.id || null });
});
