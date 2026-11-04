// ─────────────────────────────────────────────────────────────────────────────
// gbp-connect — the only way a business enters RevYne (connect-only onboarding).
//
// Actions (POST JSON, signed-in users only):
//   exchange  { serverAuthCode }      store the Google refresh token, then list locations
//   locations {}                      list locations for the stored connection
//   claim     { account, location }   create the user's verified business from Google data
//
// Expected outcomes come back as 200 { status } so the app can show the right
// screen: ok | api_not_approved | missing_scope | no_refresh_token | reconnect |
// already_has_business | location_taken | not_found.
// Secrets: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GBP_TOKEN_KEY
// ─────────────────────────────────────────────────────────────────────────────

import { decrypt, encrypt } from "../_shared/crypto.ts";
import {
  BUSINESS_MANAGE,
  exchangeServerAuthCode,
  GbpLocation,
  GoogleApiError,
  listAccountLocations,
  listAllLocations,
  refreshAccessToken,
} from "../_shared/google.ts";
import { db, getUserId, json, str } from "../_shared/http.ts";

type Connection = {
  refresh_token_enc: string;
  access_token_enc: string | null;
  access_token_expires_at: string | null;
};

function expiresAt(seconds: number) {
  return new Date(Date.now() + (seconds - 60) * 1000).toISOString();
}

async function loadConnection(userId: string): Promise<Connection | null> {
  const res = await db(`gbp_connections?user_id=eq.${userId}&select=refresh_token_enc,access_token_enc,access_token_expires_at`);
  const rows = res.ok ? await res.json() as Connection[] : [];
  return rows[0] ?? null;
}

/** A valid access token for the user's connection, refreshing (and re-storing) when expired. */
async function accessTokenFor(userId: string): Promise<string | null> {
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

/** Locations plus whether each is already a RevYne business (by this user or someone else). */
async function describeLocations(userId: string, locations: GbpLocation[]) {
  const claimed = new Map<string, string>();
  if (locations.length) {
    const list = locations.map((l) => `"${l.location}"`).join(",");
    const res = await db(`businesses?select=gbp_location,owner_id&gbp_location=in.(${encodeURIComponent(list)})`);
    for (const row of res.ok ? await res.json() as { gbp_location: string; owner_id: string }[] : []) {
      claimed.set(row.gbp_location, row.owner_id);
    }
  }
  return locations.map((l) => ({
    account: l.account,
    location: l.location,
    title: l.title,
    city: l.city,
    takenByOther: claimed.has(l.location) && claimed.get(l.location) !== userId,
  }));
}

async function listFor(userId: string, accessToken: string) {
  const locations = await listAllLocations(accessToken);
  return json({ status: "ok", locations: await describeLocations(userId, locations) });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const userId = await getUserId(req);
  if (!userId) return json({ error: "Please sign in again." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    switch (str(body.action, 32)) {
      case "exchange": {
        const code = str(body.serverAuthCode, 2048);
        if (!code) return json({ error: "serverAuthCode is required" }, 400);

        const tokens = await exchangeServerAuthCode(code);
        if (!tokens.scope?.split(" ").includes(BUSINESS_MANAGE)) return json({ status: "missing_scope" });

        const existing = await loadConnection(userId);
        if (!tokens.refresh_token && !existing) return json({ status: "no_refresh_token" });

        const row: Record<string, unknown> = {
          user_id: userId,
          access_token_enc: await encrypt(tokens.access_token),
          access_token_expires_at: expiresAt(tokens.expires_in),
          scope: tokens.scope,
        };
        if (tokens.refresh_token) row.refresh_token_enc = await encrypt(tokens.refresh_token);
        const saved = await db("gbp_connections?on_conflict=user_id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify(row),
        });
        if (!saved.ok) throw new Error(`store connection: ${saved.status} ${await saved.text()}`);

        return await listFor(userId, tokens.access_token);
      }

      case "locations": {
        const token = await accessTokenFor(userId);
        if (!token) return json({ status: "reconnect" });
        return await listFor(userId, token);
      }

      case "claim": {
        const account = str(body.account, 64);
        const location = str(body.location, 64);
        if (!/^accounts\/\d+$/.test(account) || !/^locations\/\d+$/.test(location)) {
          return json({ error: "Invalid location" }, 400);
        }

        const mine = await db(`businesses?owner_id=eq.${userId}&select=id&limit=1`);
        if (mine.ok && (await mine.json() as unknown[]).length) return json({ status: "already_has_business" });

        const token = await accessTokenFor(userId);
        if (!token) return json({ status: "reconnect" });

        // Ownership check: the location must be in this Google user's own account.
        const loc = (await listAccountLocations(account, token)).find((l) => l.location === location);
        if (!loc) return json({ status: "not_found" });

        const g = loc.raw;
        const address = g.storefrontAddress
          ? [...(g.storefrontAddress.addressLines ?? []), g.storefrontAddress.locality].filter(Boolean).join(", ")
          : null;
        const created = await db("businesses", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            owner_id: userId,
            name: loc.title.slice(0, 120) || "My business",
            category: g.categories?.primaryCategory?.displayName ?? null,
            city: loc.city,
            address,
            phone: g.phoneNumbers?.primaryPhone ?? null,
            google_place_id: g.metadata?.placeId ?? null,
            google_review_url: g.metadata?.newReviewUri ?? null,
            gbp_account: account,
            gbp_location: location,
            verified_at: new Date().toISOString(),
          }),
        });
        if (created.status === 409) return json({ status: "location_taken" });
        if (!created.ok) throw new Error(`create business: ${created.status} ${await created.text()}`);
        const [business] = await created.json();
        return json({ status: "ok", business });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof GoogleApiError) {
      if (e.kind === "api_not_approved") return json({ status: "api_not_approved" });
      if (e.kind === "unauthorized") return json({ status: "reconnect" });
    }
    console.error("gbp-connect failed", e);
    return json({ error: "Could not reach Google right now. Please try again." }, 502);
  }
});
