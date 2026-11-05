// ─────────────────────────────────────────────────────────────────────────────
// account-delete — permanently deletes the signed-in user's account
// (Google Play requires in-app account deletion).
//
// Deleting the auth user cascades to profiles → businesses → review sessions,
// private feedback, subscriptions and gbp_connections. The stored Google
// refresh token is revoked first (best effort) so RevYne loses access too.
// ─────────────────────────────────────────────────────────────────────────────

import { decrypt } from "../_shared/crypto.ts";
import { db, getUserId, json } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const userId = await getUserId(req);
  if (!userId) return json({ error: "Please sign in again." }, 401);

  // Revoke Google Business Profile access, if connected.
  try {
    const res = await db(`gbp_connections?user_id=eq.${userId}&select=refresh_token_enc`);
    const rows = res.ok ? await res.json() as { refresh_token_enc: string }[] : [];
    if (rows[0]) {
      const token = await decrypt(rows[0].refresh_token_enc);
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" });
    }
  } catch (e) {
    console.error("google revoke failed (continuing with deletion)", e);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const del = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!del.ok) {
    console.error("delete user failed", del.status, await del.text());
    return json({ error: "Could not delete your account. Please try again." }, 500);
  }
  return json({ deleted: true });
});
