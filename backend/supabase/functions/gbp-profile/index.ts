// ─────────────────────────────────────────────────────────────────────────────
// gbp-profile — the owner's Google Business Profile details, Google Score, and
// edits (signed-in owners of a linked business only). Read live from Google;
// nothing from Google is stored except the phone kept in sync on `businesses`.
//
// Actions (POST JSON):
//   get                                profile + score
//   update { field, value, validateOnly? }   field: description | phone | website | hours | specialHours
//   draft_description                  AI description draft (owner edits/approves)
//   google_changes                     details Google changed: owner's vs Google's version (read only)
//
// Expected outcomes come back as 200 { status }: ok | not_linked | reconnect |
// api_not_approved | invalid (with message) | limit.
// ─────────────────────────────────────────────────────────────────────────────

import { accessTokenFor } from "../_shared/gbp_auth.ts";
import { computeGoogleScore } from "../_shared/google_score.ts";
import { getGoogleUpdated, getLocation, GoogleApiError, lastPostTime, listReviews, mediaCount, patchLocation } from "../_shared/google.ts";
import { db, getUserId, json, str, serveOwner } from "../_shared/http.ts";
import { AiUnavailable, generateText } from "../_shared/openai.ts";
import {
  buildDescriptionPrompt,
  DayHours,
  descriptionPatch,
  EditError,
  hoursPatch,
  phonePatch,
  ProfilePatch,
  SpecialDay,
  specialHoursPatch,
  websitePatch,
} from "../_shared/profile_edit.ts";

const DESCRIPTION_DRAFTS_PER_DAY = 10;

type LinkedBusiness = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  products: string[];
  gbp_account: string;
  gbp_location: string;
};

async function linkedBusiness(userId: string): Promise<LinkedBusiness | null> {
  const res = await db(
    `businesses?owner_id=eq.${userId}&gbp_location=not.is.null&select=id,name,category,city,products,gbp_account,gbp_location&limit=1`,
  );
  const rows = res.ok ? await res.json() as LinkedBusiness[] : [];
  return rows[0] ?? null;
}

async function record(businessId: string, kind: string, detail: string) {
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

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (t: Record<string, number> | undefined) => `${pad(t?.hours ?? 0)}:${pad(t?.minutes ?? 0)}`;
const isoDate = (d: Record<string, number>) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;

/** The slice of a Google location the app shows and edits. */
function profileView(loc: Record<string, any>) {
  const periods = (loc.regularHours?.periods ?? []) as Record<string, any>[];
  const perDay = new Map<string, number>();
  for (const p of periods) perDay.set(p.openDay, (perDay.get(p.openDay) ?? 0) + 1);
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: loc.title ?? "",
    description: loc.profile?.description ?? "",
    phone: loc.phoneNumbers?.primaryPhone ?? "",
    additionalPhones: loc.phoneNumbers?.additionalPhones ?? [],
    website: loc.websiteUri ?? "",
    primaryCategory: loc.categories?.primaryCategory?.displayName ?? null,
    additionalCategories: ((loc.categories?.additionalCategories ?? []) as Record<string, any>[]).map((c) => c.displayName),
    hours: periods.map((p) => ({ day: p.openDay, open: hhmm(p.openTime), close: hhmm(p.closeTime) })),
    splitHours: [...perDay.values()].some((n) => n > 1), // more than one period a day: the app's editor replaces them
    specialHours: ((loc.specialHours?.specialHourPeriods ?? []) as Record<string, any>[])
      .filter((s) => s.startDate && isoDate(s.startDate) >= today)
      .map((s) => ({ date: isoDate(s.startDate), closed: !!s.closed, ...(s.closed ? {} : { open: hhmm(s.openTime), close: hhmm(s.closeTime) }) })),
    openStatus: loc.openInfo?.status ?? "OPEN",
    hasPendingEdits: !!loc.metadata?.hasPendingEdits,
    // Google itself changed some details (e.g. from user suggestions); the owner should check them.
    googleUpdated: !!loc.metadata?.hasGoogleUpdated,
    mapsUri: loc.metadata?.mapsUri ?? null,
  };
}

/** Optional signals: a failure in one must not break the whole screen. */
async function optional<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    console.error("gbp-profile optional signal failed", e instanceof Error ? e.message.slice(0, 300) : e);
    return null;
  }
}

async function view(b: LinkedBusiness, token: string) {
  const [loc, reviews, photos, lastPost] = await Promise.all([
    getLocation(b.gbp_location, token),
    optional(listReviews(b.gbp_account, b.gbp_location, token)),
    optional(mediaCount(b.gbp_account, b.gbp_location, token)),
    optional(lastPostTime(b.gbp_account, b.gbp_location, token)),
  ]);
  const profile = profileView(loc);
  const checked = reviews?.reviews ?? [];
  const score = computeGoogleScore({
    rating: reviews?.averageRating ?? null,
    ratingCount: reviews?.totalReviewCount ?? 0,
    repliedShare: checked.length ? checked.filter((r) => r.reply).length / checked.length : null,
    hasDescription: profile.description.trim().length > 0,
    hasHours: profile.hours.length > 0,
    hasPhone: profile.phone.length > 0,
    hasWebsite: profile.website.length > 0,
    additionalCategories: profile.additionalCategories.length,
    photoCount: photos,
    daysSinceLastPost: lastPost ? Math.floor((Date.now() - Date.parse(lastPost)) / 86400_000) : null,
  });
  return { profile, score };
}

// ── Google's changes (the "Google changed some of your details" banner) ─────

const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };

function hoursText(h: { day: string; open: string; close: string }[]) {
  if (!h.length) return "Not set";
  return h.map((x) => `${DAY_SHORT[x.day] ?? x.day} ${x.open}–${x.close}`).join(", ");
}

function specialText(s: { date: string; closed: boolean; open?: string; close?: string }[]) {
  if (!s.length) return "None";
  return s.map((x) => `${x.date}: ${x.closed ? "closed" : `${x.open}–${x.close}`}`).join(", ");
}

function addressText(loc: Record<string, any>) {
  const a = loc.storefrontAddress;
  if (!a) return "Not set";
  return [...(a.addressLines ?? []), a.locality, a.administrativeArea, a.postalCode].filter(Boolean).join(", ");
}

type Change = { field: string; label: string; editable: boolean; mine: string; google: string; mineValue?: unknown; googleValue?: unknown };

/** Which details Google changed, with the owner's and Google's versions side by side. */
async function googleChanges(b: LinkedBusiness, token: string) {
  const [mineLoc, updated] = await Promise.all([getLocation(b.gbp_location, token), getGoogleUpdated(b.gbp_location, token)]);
  const googleLoc = (updated.location ?? {}) as Record<string, any>;
  const mine = profileView(mineLoc);
  const google = profileView(googleLoc);
  const mask = String(updated.diffMask ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const touched = (prefix: string) => mask.some((m) => m === prefix || m.startsWith(prefix + "."));
  const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);
  // Without a diffMask, fall back to comparing the fields we show.
  const differs = (prefix: string, x: unknown, y: unknown) => (mask.length ? touched(prefix) : !same(x, y));

  const changes: Change[] = [];
  if (differs("title", mine.title, google.title))
    changes.push({ field: "title", label: "Business name", editable: false, mine: mine.title || "Not set", google: google.title || "Not set" });
  if (differs("profile", mine.description, google.description))
    changes.push({ field: "description", label: "Description", editable: true, mine: mine.description || "Not set", google: google.description || "Not set", mineValue: mine.description, googleValue: google.description });
  if (differs("phoneNumbers", mine.phone, google.phone))
    changes.push({ field: "phone", label: "Phone", editable: true, mine: mine.phone || "Not set", google: google.phone || "Not set", mineValue: mine.phone, googleValue: google.phone });
  if (differs("websiteUri", mine.website, google.website))
    changes.push({ field: "website", label: "Website", editable: true, mine: mine.website || "Not set", google: google.website || "Not set", mineValue: mine.website, googleValue: google.website });
  if (differs("regularHours", mine.hours, google.hours))
    changes.push({ field: "hours", label: "Opening hours", editable: true, mine: hoursText(mine.hours), google: hoursText(google.hours), mineValue: mine.hours, googleValue: google.hours });
  if (differs("specialHours", mine.specialHours, google.specialHours))
    changes.push({ field: "specialHours", label: "Holiday hours", editable: true, mine: specialText(mine.specialHours), google: specialText(google.specialHours), mineValue: mine.specialHours, googleValue: google.specialHours });
  if (differs("categories", [mine.primaryCategory, mine.additionalCategories], [google.primaryCategory, google.additionalCategories]))
    changes.push({
      field: "categories",
      label: "Category",
      editable: false,
      mine: [mine.primaryCategory, ...mine.additionalCategories].filter(Boolean).join(", ") || "Not set",
      google: [google.primaryCategory, ...google.additionalCategories].filter(Boolean).join(", ") || "Not set",
    });
  if (touched("storefrontAddress"))
    changes.push({ field: "address", label: "Address", editable: false, mine: addressText(mineLoc), google: addressText(googleLoc) });
  // Anything else Google lists that the app doesn't show.
  const known = ["title", "profile", "phoneNumbers", "websiteUri", "regularHours", "specialHours", "categories", "storefrontAddress"];
  for (const m of mask) {
    if (!known.some((k) => m === k || m.startsWith(k + "."))) changes.push({ field: m, label: m, editable: false, mine: "", google: "" });
  }
  return { changes, mapsUri: mine.mapsUri };
}

function patchFor(field: string, value: unknown, current: Record<string, any>): ProfilePatch {
  switch (field) {
    case "description":
      return descriptionPatch(str(value, 2000));
    case "phone":
      return phonePatch(str(value, 40), current.phoneNumbers?.additionalPhones ?? []);
    case "website":
      return websitePatch(str(value, 500));
    case "hours":
      if (!Array.isArray(value) || value.length > 7) throw new EditError("Invalid hours.");
      return hoursPatch(value as DayHours[]);
    case "specialHours":
      if (!Array.isArray(value) || value.length > 60) throw new EditError("Invalid holiday hours.");
      return specialHoursPatch(value as SpecialDay[]);
    default:
      throw new EditError("This can't be edited from RevYne yet.");
  }
}

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

  try {
    const token = await accessTokenFor(userId);
    if (!token) return json({ status: "reconnect" });

    switch (str(body.action, 32)) {
      case "get":
        return json({ status: "ok", ...(await view(business, token)) });

      case "update": {
        const field = str(body.field, 32);
        const validateOnly = body.validateOnly === true;
        let patch: ProfilePatch;
        try {
          patch = patchFor(field, body.value, field === "phone" ? await getLocation(business.gbp_location, token) : {});
        } catch (e) {
          if (e instanceof EditError) return json({ status: "invalid", message: e.message });
          throw e;
        }
        try {
          await patchLocation(business.gbp_location, patch.body, patch.updateMask, token, validateOnly);
        } catch (e) {
          // Google rejects some values (e.g. policy); show its reason in plain words.
          if (e instanceof GoogleApiError && e.kind === "failed" && /^400 /.test(e.message)) {
            console.error("gbp-profile rejected", field, e.message.slice(0, 800));
            return json({ status: "invalid", message: "Google didn't accept this change. Please check it and try again." });
          }
          throw e;
        }
        if (validateOnly) return json({ status: "ok", validated: true });
        await record(business.id, "profile_edit", field);
        if (field === "phone") {
          const phone = (patch.body.phoneNumbers as { primaryPhone: string }).primaryPhone;
          await db(`businesses?id=eq.${business.id}`, { method: "PATCH", body: JSON.stringify({ phone }) });
        }
        return json({ status: "ok", ...(await view(business, token)) });
      }

      case "google_changes":
        return json({ status: "ok", ...(await googleChanges(business, token)) });

      case "draft_description": {
        if (await countToday(business.id, "description_draft") >= DESCRIPTION_DRAFTS_PER_DAY) {
          return json({ status: "limit", message: "You've used today's AI drafts. You can still write it yourself." });
        }
        const loc = await getLocation(business.gbp_location, token);
        const { instructions, input } = buildDescriptionPrompt({
          businessName: business.name,
          category: loc.categories?.primaryCategory?.displayName ?? business.category,
          city: business.city,
          products: business.products ?? [],
          current: loc.profile?.description ?? "",
        });
        const draft = (await generateText(instructions, input, 400)).slice(0, 750);
        await record(business.id, "description_draft", "description");
        return json({ status: "ok", draft });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof GoogleApiError) {
      if (e.kind === "api_not_approved") {
        console.error("gbp-profile not approved", e.message.slice(0, 500));
        return json({ status: "api_not_approved" });
      }
      if (e.kind === "unauthorized") return json({ status: "reconnect" });
    }
    if (e instanceof AiUnavailable) return json({ error: "AI drafts are unavailable right now. You can write it yourself." }, 503);
    console.error("gbp-profile failed", e);
    return json({ error: "Could not reach Google right now. Please try again." }, 502);
  }
});
