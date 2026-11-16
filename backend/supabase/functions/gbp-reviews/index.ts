// ─────────────────────────────────────────────────────────────────────────────
// gbp-reviews — the owner's Google reviews inbox (signed-in owners of a linked
// business only). Reviews are read live from Google and not stored.
//
// Actions (POST JSON):
//   list   { pageToken? }            reviews + average rating + total count
//   draft  { reviewId }              AI reply draft (owner edits/approves in the app)
//   reply  { reviewId, comment }     post or replace the public reply
//   unreply { reviewId }             delete the public reply
//
// Expected outcomes come back as 200 { status }: ok | not_linked | reconnect |
// api_not_approved | limit. Secrets: as gbp-connect, plus OPENAI_API_KEY.
// ─────────────────────────────────────────────────────────────────────────────

import { accessTokenFor } from "../_shared/gbp_auth.ts";
import { deleteReply, getReview, GoogleApiError, listReviews, putReply } from "../_shared/google.ts";
import { db, getUserId, json, str, serveOwner } from "../_shared/http.ts";
import { AiUnavailable, generateText } from "../_shared/openai.ts";
import { buildReplyPrompt, replyFits } from "../_shared/reply_prompt.ts";

const DRAFTS_PER_DAY = 60;

type LinkedBusiness = { id: string; name: string; category: string | null; reply_tone: string; gbp_account: string; gbp_location: string };

async function linkedBusiness(userId: string): Promise<LinkedBusiness | null> {
  const res = await db(
    `businesses?owner_id=eq.${userId}&gbp_location=not.is.null&select=id,name,category,reply_tone,gbp_account,gbp_location&limit=1`,
  );
  const rows = res.ok ? await res.json() as LinkedBusiness[] : [];
  return rows[0] ?? null;
}

async function record(businessId: string, kind: string, reviewId: string) {
  await db("owner_actions", { method: "POST", body: JSON.stringify({ business_id: businessId, kind, review_id: reviewId }) });
}

async function draftsToday(businessId: string): Promise<number> {
  const since = new Date(Date.now() - 86400_000).toISOString();
  const res = await db(`owner_actions?business_id=eq.${businessId}&kind=eq.reply_draft&created_at=gte.${since}&select=id`, {
    method: "HEAD",
    headers: { Prefer: "count=exact" },
  });
  // A failed count must not silently allow unlimited use.
  return res.ok ? Number(res.headers.get("content-range")?.split("/")[1] ?? DRAFTS_PER_DAY) : DRAFTS_PER_DAY;
}

const REVIEW_ID = /^[A-Za-z0-9_-]{8,200}$/;

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

  const business = await linkedBusiness(userId);
  if (!business) return json({ status: "not_linked" });
  const { gbp_account: account, gbp_location: location } = business;

  const action = str(body.action, 16);
  const reviewId = str(body.reviewId, 200);
  if (action !== "list" && !REVIEW_ID.test(reviewId)) return json({ error: "Invalid review" }, 400);

  try {
    const token = await accessTokenFor(userId);
    if (!token) return json({ status: "reconnect" });

    switch (action) {
      case "list": {
        const page = await listReviews(account, location, token, str(body.pageToken, 512) || undefined);
        return json({ status: "ok", ...page });
      }

      case "draft": {
        if (await draftsToday(business.id) >= DRAFTS_PER_DAY) {
          return json({ status: "limit", message: "You've used today's AI drafts. You can still write replies yourself." });
        }
        // Fetched server-side so the draft is always about the owner's real review.
        const review = await getReview(account, location, reviewId, token);
        const { instructions, input } = buildReplyPrompt({
          businessName: business.name,
          category: business.category,
          tone: business.reply_tone,
          reviewer: review.reviewer,
          rating: review.rating,
          comment: review.comment,
        });
        const draft = (await generateText(instructions, input, 300)).slice(0, 1500);
        await record(business.id, "reply_draft", reviewId);
        return json({ status: "ok", draft });
      }

      case "reply": {
        const comment = str(body.comment, 4096);
        if (!comment) return json({ error: "Write a reply first." }, 400);
        if (!replyFits(comment)) return json({ error: "This reply is too long for Google. Please shorten it." }, 400);
        await putReply(account, location, reviewId, comment, token);
        await record(business.id, "reply_posted", reviewId);
        return json({ status: "ok" });
      }

      case "unreply": {
        await deleteReply(account, location, reviewId, token);
        await record(business.id, "reply_deleted", reviewId);
        return json({ status: "ok" });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof GoogleApiError) {
      if (e.kind === "api_not_approved") {
        console.error("gbp-reviews not approved", e.message.slice(0, 500));
        // service_disabled: the v4 API must be enabled in the Cloud project;
        // quota: Google has not granted quota yet. No Google details leak here.
        return json({ status: "api_not_approved", reason: /SERVICE_DISABLED|accessNotConfigured/.test(e.message) ? "service_disabled" : "quota" });
      }
      if (e.kind === "unauthorized") return json({ status: "reconnect" });
    }
    if (e instanceof AiUnavailable) return json({ error: "AI drafts are unavailable right now. You can write the reply yourself." }, 503);
    console.error("gbp-reviews failed", e);
    return json({ error: "Could not reach Google right now. Please try again." }, 502);
  }
});
