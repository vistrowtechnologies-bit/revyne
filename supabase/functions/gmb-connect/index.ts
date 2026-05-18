// ─────────────────────────────────────────────────────────────────────────────
// gmb-connect  — Google Business Profile OAuth helper
//
// Actions
//   exchange_token   PKCE code → access/refresh tokens → list GMB locations
//   select_location  Save the chosen GMB location to gmb_tokens
//   disconnect       Delete the user's gmb_tokens row + cached reviews
//   get_status       Return connection info (no secrets exposed)
// ─────────────────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function supabaseRequest(path: string, init: RequestInit) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase not configured");
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {})
    }
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

  // ── get_status ──────────────────────────────────────────────────────────────
  if (action === "get_status") {
    const res = await supabaseRequest(
      `gmb_tokens?user_id=eq.${encodeURIComponent(user.id)}&select=location_id,location_name,account_name,expires_at&limit=1`,
      { method: "GET" }
    );
    if (!res.ok) return jsonResponse({ connected: false });
    const rows = await res.json().catch(() => []);
    if (!Array.isArray(rows) || rows.length === 0) return jsonResponse({ connected: false });
    const tok = rows[0] as Record<string, unknown>;
    return jsonResponse({
      connected: Boolean(tok.location_id),
      location_id: tok.location_id ?? null,
      location_name: tok.location_name ?? null,
      account_name: tok.account_name ?? null,
      expires_at: tok.expires_at ?? null
    });
  }

  // ── use_provider_token ──────────────────────────────────────────────────────
  // Called after Supabase Google sign-in when business.manage scope was requested.
  // The provider_token (Google access token) is available in the Supabase session
  // immediately after OAuth redirect — no separate PKCE dance needed.
  if (action === "use_provider_token") {
    const providerToken        = typeof body.provider_token         === "string" ? body.provider_token.trim()         : "";
    const providerRefreshToken = typeof body.provider_refresh_token === "string" ? body.provider_refresh_token.trim() : null;

    if (!providerToken) return jsonResponse({ error: "provider_token is required" }, 400);

    const accessToken  = providerToken;
    const refreshToken = providerRefreshToken;
    const expiresAt    = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hr; refreshed by gmb-api

    // Verify the token has the right scope by attempting to list accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!accountsRes.ok) {
      const errText = await accountsRes.text();
      console.error("GMB accounts fetch (provider_token) failed:", errText);
      // Return empty rather than error — user may not have a GMB account
      return jsonResponse({ locations: [] });
    }

    const accountsData = await accountsRes.json() as Record<string, unknown>;
    const accounts = (accountsData.accounts as Array<Record<string, unknown>>) || [];
    if (!accounts.length) return jsonResponse({ locations: [] });

    // Fetch locations for each account (up to 5 accounts, 20 locations each)
    const locations: Array<{ locationId: string; locationName: string; accountName: string; address?: string }> = [];
    for (const account of accounts.slice(0, 5)) {
      const accountName = account.name as string;
      const locRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (locRes.ok) {
        const locData = await locRes.json() as Record<string, unknown>;
        const locs = (locData.locations as Array<Record<string, unknown>>) || [];
        for (const loc of locs.slice(0, 20)) {
          const addr = loc.storefrontAddress as Record<string, unknown> | undefined;
          const city = addr?.locality as string ?? "";
          locations.push({
            locationId: loc.name as string,
            locationName: (loc.title as string) || (loc.name as string),
            accountName,
            address: city || undefined
          });
        }
      }
    }

    // Persist tokens (location not yet selected)
    const firstAccount = accounts[0]?.name as string ?? null;
    await supabaseRequest("gmb_tokens", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        account_name: firstAccount,
        location_id: null,
        location_name: null,
        updated_at: new Date().toISOString()
      })
    });

    return jsonResponse({ locations });
  }

  // ── exchange_token ──────────────────────────────────────────────────────────
  if (action === "exchange_token") {
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const codeVerifier = typeof body.code_verifier === "string" ? body.code_verifier.trim() : "";
    const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri.trim() : "";

    if (!code || !codeVerifier || !redirectUri) {
      return jsonResponse({ error: "code, code_verifier, and redirect_uri are required" }, 400);
    }

    const clientId = Deno.env.get("GOOGLE_GMB_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_GMB_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return jsonResponse({ error: "Google GMB credentials not configured on server" }, 500);
    }

    // Exchange authorization code for tokens (PKCE)
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        grant_type: "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("GMB token exchange failed:", errText);
      return jsonResponse({ error: "Token exchange failed. Please try connecting again." }, 502);
    }

    const tokens = await tokenRes.json() as Record<string, unknown>;
    const accessToken = tokens.access_token as string;
    const refreshToken = (tokens.refresh_token as string) ?? null;
    const expiresAt = new Date(Date.now() + ((tokens.expires_in as number) || 3600) * 1000).toISOString();

    // Fetch GMB accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!accountsRes.ok) {
      console.error("GMB accounts fetch failed:", await accountsRes.text());
      return jsonResponse({ error: "Could not fetch Google Business accounts" }, 502);
    }

    const accountsData = await accountsRes.json() as Record<string, unknown>;
    const accounts = (accountsData.accounts as Array<Record<string, unknown>>) || [];

    // Fetch locations for each account (up to 5 accounts, 20 locations each)
    const locations: Array<{ locationId: string; locationName: string; accountName: string; address?: string }> = [];

    for (const account of accounts.slice(0, 5)) {
      const accountName = account.name as string;
      const locRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (locRes.ok) {
        const locData = await locRes.json() as Record<string, unknown>;
        const locs = (locData.locations as Array<Record<string, unknown>>) || [];
        for (const loc of locs.slice(0, 20)) {
          const addr = loc.storefrontAddress as Record<string, unknown> | undefined;
          const city = addr?.locality as string ?? "";
          locations.push({
            locationId: loc.name as string,
            locationName: (loc.title as string) || (loc.name as string),
            accountName,
            address: city || undefined
          });
        }
      }
    }

    // Persist tokens (location not yet selected — save with first account name)
    const firstAccount = accounts[0]?.name as string ?? null;
    await supabaseRequest("gmb_tokens", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        account_name: firstAccount,
        location_id: null,
        location_name: null,
        updated_at: new Date().toISOString()
      })
    });

    return jsonResponse({ locations });
  }

  // ── select_location ─────────────────────────────────────────────────────────
  if (action === "select_location") {
    const locationId   = typeof body.location_id   === "string" ? body.location_id.trim()   : "";
    const locationName = typeof body.location_name === "string" ? body.location_name.trim() : "";
    const accountName  = typeof body.account_name  === "string" ? body.account_name.trim()  : "";

    if (!locationId) return jsonResponse({ error: "location_id is required" }, 400);

    const res = await supabaseRequest(
      `gmb_tokens?user_id=eq.${encodeURIComponent(user.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          location_id: locationId,
          location_name: locationName || null,
          account_name: accountName || null,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!res.ok) return jsonResponse({ error: "Could not save location selection" }, 500);
    return jsonResponse({ saved: true, location_id: locationId, location_name: locationName });
  }

  // ── disconnect ──────────────────────────────────────────────────────────────
  if (action === "disconnect") {
    // Revoke the access token with Google (best-effort)
    const checkRes = await supabaseRequest(
      `gmb_tokens?user_id=eq.${encodeURIComponent(user.id)}&select=access_token&limit=1`,
      { method: "GET" }
    );
    if (checkRes.ok) {
      const rows = await checkRes.json().catch(() => []) as Array<Record<string, unknown>>;
      if (rows.length > 0 && rows[0].access_token) {
        fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(rows[0].access_token as string)}`, {
          method: "POST"
        }).catch(() => {});
      }
    }

    await supabaseRequest(`gmb_tokens?user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" });
    await supabaseRequest(`gmb_reviews?user_id=eq.${encodeURIComponent(user.id)}`, { method: "DELETE" });
    return jsonResponse({ disconnected: true });
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
