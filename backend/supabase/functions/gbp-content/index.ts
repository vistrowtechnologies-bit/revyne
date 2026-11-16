// ─────────────────────────────────────────────────────────────────────────────
// gbp-content — Google posts and photos for the owner's linked business
// (signed-in owners only). Read live from Google; photos travel from the app to
// the private `gbp-media` bucket and Google fetches them via a signed URL.
//
// Actions (POST JSON):
//   posts                                  latest posts
//   post_draft  { type, brief, title? }    AI post text (owner edits/approves)
//   post_create { post, mediaPath? }       publish a post (see _shared/post_edit.ts)
//   post_delete { name }
//   photos                                 latest photos + total
//   photo_add   { mediaPath, category }
//   photo_delete { name }
//   post_schedule { post, mediaPath?, publishAt }   stored; gbp-scheduler publishes it
//   schedule_cancel { id }
//   (the app lists scheduled posts directly from `scheduled_posts`, owner-only RLS)
//
// Expected outcomes come back as 200 { status }: ok | not_linked | reconnect |
// api_not_approved | invalid (with message) | limit.
// ─────────────────────────────────────────────────────────────────────────────

import { accessTokenFor } from "../_shared/gbp_auth.ts";
import { addPhoto, createPost, deleteByName, GoogleApiError, listPhotos, listPosts } from "../_shared/google.ts";
import { db, getUserId, json, str, serveOwner } from "../_shared/http.ts";
import { signedMediaUrl } from "../_shared/media.ts";
import { AiUnavailable, generateText } from "../_shared/openai.ts";
import { buildPostPrompt, ownMediaPath, PHOTO_CATEGORIES, PostInput, postBody, PostType } from "../_shared/post_edit.ts";
import { EditError } from "../_shared/profile_edit.ts";

const POST_DRAFTS_PER_DAY = 20;

type LinkedBusiness = { id: string; name: string; category: string | null; city: string | null; gbp_account: string; gbp_location: string };

async function linkedBusiness(userId: string): Promise<LinkedBusiness | null> {
  const res = await db(
    `businesses?owner_id=eq.${userId}&gbp_location=not.is.null&select=id,name,category,city,gbp_account,gbp_location&limit=1`,
  );
  const rows = res.ok ? await res.json() as LinkedBusiness[] : [];
  return rows[0] ?? null;
}

async function record(businessId: string, kind: string, detail: string | null = null) {
  await db("owner_actions", { method: "POST", body: JSON.stringify({ business_id: businessId, kind, detail }) });
}

async function countToday(businessId: string, kind: string): Promise<number> {
  const since = new Date(Date.now() - 86400_000).toISOString();
  const res = await db(`owner_actions?business_id=eq.${businessId}&kind=eq.${kind}&created_at=gte.${since}&select=id`, {
    method: "HEAD",
    headers: { Prefer: "count=exact" },
  });
  return res.ok ? Number(res.headers.get("content-range")?.split("/")[1] ?? 999) : 999;
}

const signedUrl = signedMediaUrl;

const MIN_LEAD_MS = 10 * 60_000; // schedule at least 10 minutes ahead
const MAX_LEAD_MS = 90 * 86400_000;
const MAX_PENDING = 30;

serveOwner(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const userId = await getUserId(req);
  if (!userId) return json({ error: "Please sign in again." }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const b = await linkedBusiness(userId);
  if (!b) return json({ status: "not_linked" });
  const prefix = `${b.gbp_account}/${b.gbp_location}/`;

  try {
    const token = await accessTokenFor(userId);
    if (!token) return json({ status: "reconnect" });

    switch (str(body.action, 32)) {
      case "posts":
        return json({ status: "ok", posts: await listPosts(b.gbp_account, b.gbp_location, token) });

      case "post_draft": {
        const brief = str(body.brief, 600);
        if (!brief) return json({ status: "invalid", message: "Write a line about what you want to share." });
        if (await countToday(b.id, "post_draft") >= POST_DRAFTS_PER_DAY) {
          return json({ status: "limit", message: "You've used today's AI drafts. You can still write it yourself." });
        }
        const type = (["STANDARD", "OFFER", "EVENT"].includes(str(body.type, 16)) ? str(body.type, 16) : "STANDARD") as PostType;
        const { instructions, input } = buildPostPrompt({
          businessName: b.name,
          category: b.category,
          city: b.city,
          type,
          brief,
          title: str(body.title, 58) || undefined,
        });
        const draft = (await generateText(instructions, input, 400)).slice(0, 1500);
        await record(b.id, "post_draft");
        return json({ status: "ok", draft });
      }

      case "post_create": {
        const mediaPath = str(body.mediaPath, 200);
        if (mediaPath && !ownMediaPath(mediaPath, b.id)) return json({ status: "invalid", message: "That photo can't be used." });
        let request: Record<string, unknown>;
        try {
          request = postBody((body.post ?? {}) as PostInput, mediaPath ? await signedUrl(mediaPath) : null);
        } catch (e) {
          if (e instanceof EditError) return json({ status: "invalid", message: e.message });
          throw e;
        }
        const post = await createPost(b.gbp_account, b.gbp_location, request, token);
        await record(b.id, "post_created", post.type);
        return json({ status: "ok", post });
      }

      case "post_schedule": {
        const mediaPath = str(body.mediaPath, 200);
        if (mediaPath && !ownMediaPath(mediaPath, b.id)) return json({ status: "invalid", message: "That photo can't be used." });
        const publishAt = Date.parse(str(body.publishAt, 40));
        if (Number.isNaN(publishAt)) return json({ status: "invalid", message: "Pick when to publish." });
        if (publishAt < Date.now() + MIN_LEAD_MS) return json({ status: "invalid", message: "Pick a time at least 10 minutes from now." });
        if (publishAt > Date.now() + MAX_LEAD_MS) return json({ status: "invalid", message: "You can schedule up to 90 days ahead." });
        const post = (body.post ?? {}) as PostInput;
        try {
          // Checked as of the publish time (e.g. an offer must not have ended by then).
          postBody(post, mediaPath ? "https://scheduled.invalid/photo.jpg" : null, new Date(publishAt));
        } catch (e) {
          if (e instanceof EditError) return json({ status: "invalid", message: e.message });
          throw e;
        }
        const pending = await db(`scheduled_posts?business_id=eq.${b.id}&status=eq.pending&select=id`, { method: "HEAD", headers: { Prefer: "count=exact" } });
        if (Number(pending.headers.get("content-range")?.split("/")[1] ?? MAX_PENDING) >= MAX_PENDING) {
          return json({ status: "invalid", message: `You can have up to ${MAX_PENDING} scheduled posts.` });
        }
        const saved = await db("scheduled_posts", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ business_id: b.id, post, media_path: mediaPath || null, publish_at: new Date(publishAt).toISOString() }),
        });
        if (!saved.ok) throw new Error(`save schedule: ${saved.status} ${await saved.text()}`);
        await record(b.id, "post_scheduled", post.type);
        return json({ status: "ok", scheduled: (await saved.json())[0] });
      }

      case "schedule_cancel": {
        const id = str(body.id, 40);
        if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Invalid item" }, 400);
        const res = await db(`scheduled_posts?id=eq.${id}&business_id=eq.${b.id}&status=eq.pending`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ status: "cancelled" }),
        });
        const rows = res.ok ? await res.json() as unknown[] : [];
        if (!rows.length) return json({ status: "invalid", message: "This post is already being published or was removed." });
        await record(b.id, "post_schedule_cancelled");
        return json({ status: "ok" });
      }

      case "post_delete":
      case "photo_delete": {
        const name = str(body.name, 300);
        const kind = body.action === "post_delete" ? "localPosts" : "media";
        if (!name.startsWith(prefix) || !new RegExp(`^${prefix}${kind}/[A-Za-z0-9_-]+$`).test(name)) {
          return json({ error: "Invalid item" }, 400);
        }
        await deleteByName(name, token);
        await record(b.id, kind === "localPosts" ? "post_deleted" : "photo_deleted");
        return json({ status: "ok" });
      }

      case "photos":
        return json({ status: "ok", ...(await listPhotos(b.gbp_account, b.gbp_location, token)) });

      case "photo_add": {
        const mediaPath = str(body.mediaPath, 200);
        const category = str(body.category, 16);
        if (!ownMediaPath(mediaPath, b.id)) return json({ status: "invalid", message: "That photo can't be used." });
        if (!(PHOTO_CATEGORIES as readonly string[]).includes(category)) return json({ status: "invalid", message: "Pick where the photo belongs." });
        let source: string;
        try {
          source = await signedUrl(mediaPath);
        } catch (e) {
          if (e instanceof EditError) return json({ status: "invalid", message: e.message });
          throw e;
        }
        await addPhoto(b.gbp_account, b.gbp_location, source, category, token);
        await record(b.id, "photo_added", category);
        return json({ status: "ok" });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof GoogleApiError) {
      if (e.kind === "api_not_approved") {
        console.error("gbp-content not approved", e.message.slice(0, 500));
        return json({ status: "api_not_approved" });
      }
      if (e.kind === "unauthorized") return json({ status: "reconnect" });
      if (e.kind === "failed" && /^400 /.test(e.message)) {
        console.error("gbp-content rejected", e.message.slice(0, 800));
        return json({ status: "invalid", message: "Google didn't accept this. Check the text, dates and photo, then try again." });
      }
    }
    if (e instanceof AiUnavailable) return json({ error: "AI drafts are unavailable right now. You can write it yourself." }, 503);
    console.error("gbp-content failed", e);
    return json({ error: "Could not reach Google right now. Please try again." }, 502);
  }
});
