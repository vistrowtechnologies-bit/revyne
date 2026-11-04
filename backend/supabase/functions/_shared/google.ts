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

/** Exchanges the one-time server auth code from the Android app (redirect_uri is empty for Android). */
export function exchangeServerAuthCode(code: string) {
  return tokenRequest({ code, grant_type: "authorization_code", redirect_uri: "" });
}

export function refreshAccessToken(refreshToken: string) {
  return tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
}

async function gbpGet(url: string, accessToken: string): Promise<Record<string, any>> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await res.text();
  if (res.ok) return JSON.parse(body);
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

/** Every location the Google user manages, across up to 20 accounts. */
export async function listAllLocations(accessToken: string): Promise<GbpLocation[]> {
  const data = await gbpGet(`${ACCOUNTS_API}/accounts?pageSize=20`, accessToken);
  const accounts = ((data.accounts ?? []) as Record<string, any>[]).map((a) => a.name as string);
  const all: GbpLocation[] = [];
  for (const account of accounts) all.push(...await listAccountLocations(account, accessToken));
  return all;
}
