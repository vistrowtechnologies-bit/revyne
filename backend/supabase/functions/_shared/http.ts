export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Returns the signed-in user's id, or null for anonymous / invalid tokens.
 * Needed because the gateway lets a bare publishable key through.
 */
export async function getUserId(req: Request): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !url || !anonKey) return null;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: anonKey } });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null) as { id?: string } | null;
  return user?.id ?? null;
}

/** PostgREST call with the service role (bypasses RLS — server use only). */
export function db(path: string, init: RequestInit = {}) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
}

// ── CORS for the owner web app ───────────────────────────────────────────────
// Browsers send a preflight OPTIONS and need Access-Control-* headers; the
// Android app sends no Origin and is unaffected. Only listed origins are allowed.
const ownerOrigins = (Deno.env.get("OWNER_APP_ORIGINS") ??
  "https://revyneai.com,https://www.revyneai.com,https://app.revyneai.com,https://revyne-app.vercel.app,http://localhost:5175,http://localhost:5177")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function ownerCors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  if (!ownerOrigins.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Deno.serve for owner-facing functions: answers preflight and adds CORS headers. */
export function serveOwner(handler: (req: Request) => Response | Promise<Response>) {
  return Deno.serve(async (req) => {
    const headers = ownerCors(req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const res = await handler(req);
    if (!Object.keys(headers).length) return res;
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
    return out;
  });
}
