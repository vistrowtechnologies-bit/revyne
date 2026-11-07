// Firebase Cloud Messaging (HTTP v1) sender, server only.
// Secret: FCM_SERVICE_ACCOUNT_B64 (base64 of the Firebase service-account JSON,
// set with backend/scripts/set-fcm-secret.ps1) or FCM_SERVICE_ACCOUNT (raw JSON).
// Firebase console → Project settings → Service accounts → Generate new private key.
// Tokens Google reports as gone are deleted from device_tokens.

import { db } from "./http.ts";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

export type Push = {
  title: string;
  body: string;
  route?: string; // app screen to open on tap, e.g. "/reviews"
  tag?: string; // same tag replaces an earlier notification
};

let cached: { token: string; expires: number } | null = null;

function account(): ServiceAccount | null {
  // FCM_SERVICE_ACCOUNT_B64 (set by backend/scripts/set-fcm-secret.ps1) avoids shell quoting of the JSON.
  const b64 = Deno.env.get("FCM_SERVICE_ACCOUNT_B64");
  const raw = b64 ? new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))) : Deno.env.get("FCM_SERVICE_ACCOUNT");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    console.error("FCM_SERVICE_ACCOUNT is not valid JSON");
    return null;
  }
}

const b64url = (data: Uint8Array | string) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** OAuth access token for FCM, from a self-signed service-account JWT (cached ~55 min). */
async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cached && cached.expires > Date.now()) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`)));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`FCM auth ${res.status} ${(await res.text()).slice(0, 200)}`);
  const { access_token, expires_in } = await res.json() as { access_token: string; expires_in: number };
  cached = { token: access_token, expires: Date.now() + (expires_in - 300) * 1000 };
  return access_token;
}

/** Sends to every device of one user. Returns how many devices got it. Never throws. */
export async function pushToUser(userId: string, push: Push): Promise<number> {
  const sa = account();
  if (!sa) {
    console.error("push skipped: FCM_SERVICE_ACCOUNT not set");
    return 0;
  }
  try {
    const res = await db(`device_tokens?user_id=eq.${userId}&select=token`);
    const tokens = res.ok ? (await res.json() as { token: string }[]).map((t) => t.token) : [];
    if (!tokens.length) return 0;
    const bearer = await accessToken(sa);
    let sent = 0;
    for (const token of tokens) {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          // Data-only: the app draws the alert itself (AlertNotifier) so it can
          // show the colour RevYne logo, which Firebase's own notifications can't.
          message: {
            token,
            data: { title: push.title, body: push.body, route: push.route ?? "/home", tag: push.tag ?? "" },
            android: { priority: "HIGH" },
          },
        }),
      });
      if (r.ok) {
        sent++;
      } else {
        const text = await r.text();
        if (r.status === 404 || /UNREGISTERED|registration-token-not-registered/.test(text)) {
          await db(`device_tokens?token=eq.${encodeURIComponent(token)}`, { method: "DELETE" });
        } else {
          console.error("fcm send failed", r.status, text.slice(0, 300));
        }
      }
    }
    return sent;
  } catch (e) {
    console.error("push failed", e instanceof Error ? e.message.slice(0, 300) : e);
    return 0;
  }
}
