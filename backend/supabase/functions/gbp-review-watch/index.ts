// ─────────────────────────────────────────────────────────────────────────────
// gbp-review-watch — every 10 minutes (cron `gbp-review-watch`, vault secret in
// `x-scheduler-secret`), checks each linked business for new Google reviews,
// saves an in-app notification (deleted after 30 days) and pushes it to the
// owner's phones. On the business it stores only the newest review time.
// Deployed without gateway JWT checks; the secret is the only way in.
// ─────────────────────────────────────────────────────────────────────────────

import { notifyUser } from "../_shared/fcm.ts";
import { accessTokenFor } from "../_shared/gbp_auth.ts";
import { listReviews } from "../_shared/google.ts";
import { db, json } from "../_shared/http.ts";
import { newReviews, reviewPushes } from "../_shared/review_alerts.ts";

type Watched = { id: string; owner_id: string; gbp_account: string; gbp_location: string; review_watch_at: string | null };

async function secretOk(req: Request): Promise<boolean> {
  const secret = req.headers.get("x-scheduler-secret") ?? "";
  if (secret.length < 32) return false;
  const res = await db("rpc/scheduler_secret_ok", { method: "POST", body: JSON.stringify({ p: secret }) });
  return res.ok && (await res.json()) === true;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!(await secretOk(req))) return json({ error: "Forbidden" }, 403);

  // Every linked business: alerts also go to the in-app notifications list,
  // so owners without a registered phone still get them.
  const bRes = await db(`businesses?gbp_location=not.is.null&select=id,owner_id,gbp_account,gbp_location,review_watch_at`);
  const businesses = bRes.ok ? await bRes.json() as Watched[] : [];
  let alerts = 0;

  for (const b of businesses) {
    try {
      const token = await accessTokenFor(b.owner_id);
      if (!token) continue;
      const page = await listReviews(b.gbp_account, b.gbp_location, token);
      const { fresh, watermark } = newReviews(page.reviews, b.review_watch_at);
      for (const push of reviewPushes(fresh)) {
        await notifyUser(b.owner_id, { ...push, kind: "review" });
        alerts++;
      }
      if (watermark !== b.review_watch_at) {
        await db(`businesses?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ review_watch_at: watermark }) });
      }
    } catch (e) {
      // One business failing (expired access, Google hiccup) must not stop the rest.
      console.error("gbp-review-watch business failed", b.id, e instanceof Error ? e.message.slice(0, 300) : e);
    }
  }

  return json({ ok: true, checked: businesses.length, alerts });
});
