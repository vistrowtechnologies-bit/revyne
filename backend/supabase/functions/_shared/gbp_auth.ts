// The signed-in user's stored Google Business Profile connection (server only).
// Secrets: GBP_TOKEN_KEY (via crypto.ts), Google OAuth client (via google.ts).

import { decrypt, encrypt } from "./crypto.ts";
import { refreshAccessToken } from "./google.ts";
import { db } from "./http.ts";

type Connection = {
  refresh_token_enc: string;
  access_token_enc: string | null;
  access_token_expires_at: string | null;
};

export function expiresAt(seconds: number) {
  return new Date(Date.now() + (seconds - 60) * 1000).toISOString();
}

export async function loadConnection(userId: string): Promise<Connection | null> {
  const res = await db(`gbp_connections?user_id=eq.${userId}&select=refresh_token_enc,access_token_enc,access_token_expires_at`);
  const rows = res.ok ? await res.json() as Connection[] : [];
  return rows[0] ?? null;
}

/** A valid access token for the user's connection, refreshing (and re-storing) when expired. */
export async function accessTokenFor(userId: string): Promise<string | null> {
  const conn = await loadConnection(userId);
  if (!conn) return null;
  if (conn.access_token_enc && conn.access_token_expires_at && new Date(conn.access_token_expires_at) > new Date()) {
    return decrypt(conn.access_token_enc);
  }
  const tokens = await refreshAccessToken(await decrypt(conn.refresh_token_enc));
  await db(`gbp_connections?user_id=eq.${userId}`, {
    method: "PATCH",
    body: JSON.stringify({
      access_token_enc: await encrypt(tokens.access_token),
      access_token_expires_at: expiresAt(tokens.expires_in),
    }),
  });
  return tokens.access_token;
}
