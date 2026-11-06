// ─────────────────────────────────────────────────────────────────────────────
// gbp-scheduler — publishes scheduled Google posts that are due. Called only by
// the `gbp-publish-scheduled` cron job (every 5 minutes) with the vault secret
// in `x-scheduler-secret`; deployed without gateway JWT checks, so that secret
// is the only way in.
// ─────────────────────────────────────────────────────────────────────────────

import { accessTokenFor } from "../_shared/gbp_auth.ts";
import { createPost, GoogleApiError } from "../_shared/google.ts";
import { db, json } from "../_shared/http.ts";
import { signedMediaUrl } from "../_shared/media.ts";
import { PostInput, postBody } from "../_shared/post_edit.ts";
import { EditError } from "../_shared/profile_edit.ts";

type Due = { id: string; business_id: string; post: PostInput; media_path: string | null };
type Business = { id: string; owner_id: string; gbp_account: string | null; gbp_location: string | null };

async function secretOk(req: Request): Promise<boolean> {
  const secret = req.headers.get("x-scheduler-secret") ?? "";
  if (secret.length < 32) return false;
  const res = await db("rpc/scheduler_secret_ok", { method: "POST", body: JSON.stringify({ p: secret }) });
  return res.ok && (await res.json()) === true;
}

async function finish(id: string, fields: Record<string, unknown>) {
  await db(`scheduled_posts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(fields) });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!(await secretOk(req))) return json({ error: "Forbidden" }, 403);

  // Claim due posts in one statement so overlapping runs can't double-publish.
  const now = new Date().toISOString();
  const claimed = await db(`scheduled_posts?status=eq.pending&publish_at=lte.${now}&select=id,business_id,post,media_path`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: "publishing" }),
  });
  const due = claimed.ok ? await claimed.json() as Due[] : [];
  let published = 0;

  for (const item of due) {
    try {
      const bRes = await db(`businesses?id=eq.${item.business_id}&select=id,owner_id,gbp_account,gbp_location`);
      const [b] = bRes.ok ? await bRes.json() as Business[] : [];
      if (!b?.gbp_account || !b.gbp_location) {
        await finish(item.id, { status: "failed", error: "This business is no longer linked to Google." });
        continue;
      }
      const token = await accessTokenFor(b.owner_id);
      if (!token) {
        await finish(item.id, { status: "failed", error: "Google access expired. Connect your Google profile again." });
        continue;
      }
      const body = postBody(item.post, item.media_path ? await signedMediaUrl(item.media_path) : null);
      const post = await createPost(b.gbp_account, b.gbp_location, body, token);
      await finish(item.id, { status: "published", google_name: post.name, published_at: new Date().toISOString(), error: null });
      await db("owner_actions", { method: "POST", body: JSON.stringify({ business_id: b.id, kind: "post_created", detail: `scheduled ${post.type}` }) });
      published++;
    } catch (e) {
      // Never retry automatically: a half-finished attempt could post twice.
      const message = e instanceof EditError
        ? e.message
        : e instanceof GoogleApiError && e.kind === "unauthorized"
        ? "Google access expired. Connect your Google profile again."
        : e instanceof GoogleApiError && /^400 /.test(e.message)
        ? "Google didn't accept this post. Check the text, dates and photo."
        : "Couldn't reach Google at the scheduled time.";
      console.error("gbp-scheduler item failed", item.id, e instanceof Error ? e.message.slice(0, 500) : e);
      await finish(item.id, { status: "failed", error: message });
    }
  }

  return json({ ok: true, due: due.length, published });
});
