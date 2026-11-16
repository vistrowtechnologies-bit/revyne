// Google OAuth + Business Profile API helpers (server only).
// Secrets: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET (the Web client).

export const BUSINESS_MANAGE = "https://www.googleapis.com/auth/business.manage";

const ACCOUNTS_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const LOCATION_FIELDS = "name,title,storefrontAddress,phoneNumbers,categories,websiteUri,metadata";

export type GoogleTokens = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

/** Distinguishes "Google hasn't approved our API access yet" from real failures. */
export class GoogleApiError extends Error {
  constructor(readonly kind: "api_not_approved" | "unauthorized" | "failed", detail: string) {
    super(detail);
  }
}

async function tokenRequest(params: Record<string, string>): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "",
      client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "",
      ...params,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new GoogleApiError(res.status === 400 || res.status === 401 ? "unauthorized" : "failed", body);
  return JSON.parse(body);
}

/** Exchanges a one-time server auth code. Android sends an empty redirect_uri;
 * the web app (Google Identity Services popup code flow) uses "postmessage". */
export function exchangeServerAuthCode(code: string, redirectUri: "" | "postmessage" = "") {
  return tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri });
}

export function refreshAccessToken(refreshToken: string) {
  return tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
}

async function gbpGet(url: string, accessToken: string, init: RequestInit = {}): Promise<Record<string, any>> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.text();
  if (res.ok) return body ? JSON.parse(body) : {};
  // Before approval the project's quota is 0 → 429, or the API reports itself disabled → 403.
  const notApproved = res.status === 429 || (res.status === 403 && /SERVICE_DISABLED|accessNotConfigured|quota/i.test(body));
  if (notApproved) throw new GoogleApiError("api_not_approved", body);
  if (res.status === 401) throw new GoogleApiError("unauthorized", body);
  throw new GoogleApiError("failed", `${res.status} ${body}`);
}

export type GbpLocation = {
  account: string; // accounts/{id}
  location: string; // locations/{id}
  title: string;
  city: string | null;
  raw: Record<string, any>;
};

function toLocation(account: string, l: Record<string, any>): GbpLocation {
  return { account, location: l.name, title: l.title ?? "", city: l.storefrontAddress?.locality ?? null, raw: l };
}

export async function listAccountLocations(account: string, accessToken: string): Promise<GbpLocation[]> {
  const data = await gbpGet(`${INFO_API}/${account}/locations?readMask=${LOCATION_FIELDS}&pageSize=100`, accessToken);
  return ((data.locations ?? []) as Record<string, any>[]).map((l) => toLocation(account, l));
}

// ── Reviews (Google My Business API v4 — reviews were never moved to the newer APIs) ──

const REVIEWS_API = "https://mybusiness.googleapis.com/v4";
const STARS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export type GbpReview = {
  id: string;
  reviewer: string | null; // null when anonymous
  photoUrl: string | null;
  rating: number; // 0 when Google sends none
  comment: string;
  createdAt: string;
  updatedAt: string;
  reply: { comment: string; updatedAt: string } | null;
};

export function toReview(r: Record<string, any>): GbpReview {
  const reviewer = r.reviewer ?? {};
  return {
    id: r.reviewId,
    reviewer: reviewer.isAnonymous ? null : (reviewer.displayName ?? null),
    photoUrl: reviewer.isAnonymous ? null : (reviewer.profilePhotoUrl ?? null),
    rating: STARS[r.starRating] ?? 0,
    comment: r.comment ?? "",
    createdAt: r.createTime,
    updatedAt: r.updateTime ?? r.createTime,
    reply: r.reviewReply ? { comment: r.reviewReply.comment ?? "", updatedAt: r.reviewReply.updateTime } : null,
  };
}

const reviewsPath = (account: string, location: string) => `${REVIEWS_API}/${account}/${location}/reviews`;

export async function listReviews(account: string, location: string, accessToken: string, pageToken?: string) {
  // Google's default order is newest update first.
  const qs = new URLSearchParams({ pageSize: "50", ...(pageToken ? { pageToken } : {}) });
  const data = await gbpGet(`${reviewsPath(account, location)}?${qs}`, accessToken);
  return {
    reviews: ((data.reviews ?? []) as Record<string, any>[]).map(toReview),
    averageRating: typeof data.averageRating === "number" ? data.averageRating : null,
    totalReviewCount: typeof data.totalReviewCount === "number" ? data.totalReviewCount : 0,
    nextPageToken: (data.nextPageToken as string | undefined) ?? null,
  };
}

export async function getReview(account: string, location: string, reviewId: string, accessToken: string) {
  return toReview(await gbpGet(`${reviewsPath(account, location)}/${encodeURIComponent(reviewId)}`, accessToken));
}

/** Creates or replaces the owner's public reply. */
export async function putReply(account: string, location: string, reviewId: string, comment: string, accessToken: string) {
  await gbpGet(`${reviewsPath(account, location)}/${encodeURIComponent(reviewId)}/reply`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ comment }),
  });
}

export async function deleteReply(account: string, location: string, reviewId: string, accessToken: string) {
  await gbpGet(`${reviewsPath(account, location)}/${encodeURIComponent(reviewId)}/reply`, accessToken, { method: "DELETE" });
}

// ── Profile (Business Information API) + activity signals (v4 media, posts) ──

const PROFILE_FIELDS = "name,title,phoneNumbers,categories,websiteUri,regularHours,specialHours,profile,openInfo,metadata";

export function getLocation(location: string, accessToken: string) {
  return gbpGet(`${INFO_API}/${location}?readMask=${PROFILE_FIELDS}`, accessToken);
}

/** Applies a patch; with validateOnly Google checks it without changing anything. */
export function patchLocation(location: string, body: Record<string, unknown>, updateMask: string, accessToken: string, validateOnly = false) {
  const qs = new URLSearchParams({ updateMask, ...(validateOnly ? { validateOnly: "true" } : {}) });
  return gbpGet(`${INFO_API}/${location}?${qs}`, accessToken, { method: "PATCH", body: JSON.stringify(body) });
}

export async function mediaCount(account: string, location: string, accessToken: string): Promise<number> {
  const data = await gbpGet(`${REVIEWS_API}/${account}/${location}/media?pageSize=1`, accessToken);
  return typeof data.totalMediaItemCount === "number" ? data.totalMediaItemCount : (data.mediaItems?.length ?? 0);
}

/** Create time of the newest post, or null when there are none. */
export async function lastPostTime(account: string, location: string, accessToken: string): Promise<string | null> {
  const data = await gbpGet(`${REVIEWS_API}/${account}/${location}/localPosts?pageSize=10`, accessToken);
  const times = ((data.localPosts ?? []) as Record<string, any>[]).map((p) => p.createTime as string).filter(Boolean).sort();
  return times.at(-1) ?? null;
}

// ── Posts and photos (v4) ────────────────────────────────────────────────────

export type GbpPost = {
  name: string;
  type: string; // STANDARD | OFFER | EVENT
  summary: string;
  title: string | null;
  state: string; // LIVE | PROCESSING | REJECTED
  createdAt: string;
  photoUrl: string | null;
  searchUrl: string | null;
  button: string | null;
};

export function toPost(p: Record<string, any>): GbpPost {
  return {
    name: p.name,
    type: p.topicType ?? "STANDARD",
    summary: p.summary ?? "",
    title: p.event?.title ?? null,
    state: p.state ?? "PROCESSING",
    createdAt: p.createTime,
    photoUrl: p.media?.[0]?.googleUrl ?? null,
    searchUrl: p.searchUrl ?? null,
    button: p.callToAction?.actionType ?? null,
  };
}

const v4 = (account: string, location: string) => `${REVIEWS_API}/${account}/${location}`;

export async function listPosts(account: string, location: string, accessToken: string): Promise<GbpPost[]> {
  const data = await gbpGet(`${v4(account, location)}/localPosts?pageSize=20`, accessToken);
  return ((data.localPosts ?? []) as Record<string, any>[]).map(toPost);
}

export async function createPost(account: string, location: string, body: Record<string, unknown>, accessToken: string) {
  return toPost(await gbpGet(`${v4(account, location)}/localPosts`, accessToken, { method: "POST", body: JSON.stringify(body) }));
}

/** `name` must already be checked to belong to this location. */
export async function deleteByName(name: string, accessToken: string) {
  await gbpGet(`${REVIEWS_API}/${name}`, accessToken, { method: "DELETE" });
}

export type GbpPhoto = { name: string; url: string; thumbnailUrl: string | null; category: string | null; createdAt: string };

export async function listPhotos(account: string, location: string, accessToken: string) {
  const data = await gbpGet(`${v4(account, location)}/media?pageSize=24`, accessToken);
  const photos: GbpPhoto[] = ((data.mediaItems ?? []) as Record<string, any>[])
    .filter((m) => m.mediaFormat === "PHOTO" && m.googleUrl)
    .map((m) => ({
      name: m.name,
      url: m.googleUrl,
      thumbnailUrl: m.thumbnailUrl ?? null,
      category: m.locationAssociation?.category ?? null,
      createdAt: m.createTime,
    }));
  return { photos, total: typeof data.totalMediaItemCount === "number" ? data.totalMediaItemCount : photos.length };
}

export async function addPhoto(account: string, location: string, sourceUrl: string, category: string, accessToken: string) {
  return gbpGet(`${v4(account, location)}/media`, accessToken, {
    method: "POST",
    body: JSON.stringify({ mediaFormat: "PHOTO", locationAssociation: { category }, sourceUrl }),
  });
}

// ── Performance (stats) ──────────────────────────────────────────────────────

const PERF_API = "https://businessprofileperformance.googleapis.com/v1";

const dateParams = (prefix: string, iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return [[`${prefix}.year`, String(y)], [`${prefix}.month`, String(m)], [`${prefix}.day`, String(d)]];
};

export function dailyMetrics(location: string, metrics: readonly string[], start: string, end: string, accessToken: string) {
  const qs = new URLSearchParams([
    ...metrics.map((m) => ["dailyMetrics", m]),
    ...dateParams("dailyRange.startDate", start),
    ...dateParams("dailyRange.endDate", end),
  ]);
  return gbpGet(`${PERF_API}/${location}:fetchMultiDailyMetricsTimeSeries?${qs}`, accessToken);
}

/** Search terms people used to find the business, for whole months (inclusive). */
export function monthlyKeywords(location: string, start: { year: number; month: number }, end: { year: number; month: number }, accessToken: string) {
  const qs = new URLSearchParams({
    "monthlyRange.startMonth.year": String(start.year),
    "monthlyRange.startMonth.month": String(start.month),
    "monthlyRange.endMonth.year": String(end.year),
    "monthlyRange.endMonth.month": String(end.month),
    pageSize: "50",
  });
  return gbpGet(`${PERF_API}/${location}/searchkeywords/impressions/monthly?${qs}`, accessToken);
}

/** Every location the Google user manages, across up to 20 accounts. */
export async function listAllLocations(accessToken: string): Promise<GbpLocation[]> {
  const data = await gbpGet(`${ACCOUNTS_API}/accounts?pageSize=20`, accessToken);
  const accounts = ((data.accounts ?? []) as Record<string, any>[]).map((a) => a.name as string);
  const all: GbpLocation[] = [];
  for (const account of accounts) all.push(...await listAccountLocations(account, accessToken));
  return all;
}
