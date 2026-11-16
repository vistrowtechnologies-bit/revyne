// Mirrors the Dart repositories in apps/mobile/lib/features/*: same tables,
// selects, RLS-backed writes and edge-function actions/status handling.
import { invoke, supabase } from './supabase';

// ── Business (business_repository.dart) ────────────────────────────────────
export type Business = {
  id: string;
  ownerId: string;
  name: string;
  publicSlug: string;
  category?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  googleReviewUrl?: string | null;
  gbpLocation?: string | null;
  verifiedAt?: string | null;
  products: string[];
  reviewLanguages: string[];
  replyTone: string;
  isVerified: boolean;
};

export function toBusiness(j: any): Business {
  return {
    id: j.id,
    ownerId: j.owner_id,
    name: j.name,
    publicSlug: j.public_slug,
    category: j.category,
    city: j.city,
    address: j.address,
    phone: j.phone,
    googleReviewUrl: j.google_review_url,
    gbpLocation: j.gbp_location,
    verifiedAt: j.verified_at,
    products: j.products ?? [],
    reviewLanguages: j.review_languages ?? ['en'],
    replyTone: j.reply_tone ?? 'friendly',
    isVerified: j.verified_at != null,
  };
}

export async function fetchMyBusiness(): Promise<Business | null> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase.from('businesses').select().eq('owner_id', userId).order('created_at').limit(1).maybeSingle();
  if (error) throw error;
  return data ? toBusiness(data) : null;
}

export async function updatePreferences(id: string, p: { products: string[]; reviewLanguages: string[]; replyTone: string }) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ products: p.products, review_languages: p.reviewLanguages, reply_tone: p.replyTone })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toBusiness(data);
}

// ── Dashboard (dashboard.dart) ─────────────────────────────────────────────
export type DashboardStats = {
  visits7d: number;
  visitsPrev7d: number;
  google7d: number;
  googlePrev7d: number;
  avgRating30d: number | null;
  visitsTotal: number;
  unreadFeedback: number;
  daily: { day: Date; visits: number; google: number }[];
};

export async function dashboardStats(businessId: string): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats', { p_business_id: businessId });
  if (error) throw error;
  const j = (data ?? {}) as Record<string, any>;
  const i = (k: string) => Number(j[k] ?? 0);
  return {
    visits7d: i('visits_7d'),
    visitsPrev7d: i('visits_prev_7d'),
    google7d: i('google_7d'),
    googlePrev7d: i('google_prev_7d'),
    avgRating30d: j.avg_rating_30d == null ? null : Number(j.avg_rating_30d),
    visitsTotal: i('visits_total'),
    unreadFeedback: i('unread_feedback'),
    daily: ((j.daily_7d as any[]) ?? []).map((d) => ({ day: new Date(`${d.day}T00:00:00`), visits: Number(d.visits ?? 0), google: Number(d.google ?? 0) })),
  };
}

export function weekDelta(cur: number, prev: number) {
  if (cur === prev) return 'same as last week';
  if (prev === 0) return 'new this week';
  const d = cur - prev;
  return `${d > 0 ? '+' : '−'}${Math.abs(d)} vs last week`;
}

// ── Private feedback + visits (reviews_repository.dart) ────────────────────
export type Feedback = { id: string; message: string; createdAt: Date; rating?: number | null; contactName?: string | null; contact?: string | null; readAt?: string | null; unread: boolean };
export type Visit = { id: string; createdAt: Date; rating?: number | null; highlights: string[]; text?: string | null; copied: boolean; openedGoogle: boolean };

export async function feedback(businessId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('private_feedback')
    .select('id,message,created_at,rating,contact_name,contact,read_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((j: any) => ({
    id: j.id,
    message: j.message,
    createdAt: new Date(j.created_at),
    rating: j.rating,
    contactName: j.contact_name,
    contact: j.contact,
    readAt: j.read_at,
    unread: j.read_at == null,
  }));
}

export async function visits(businessId: string): Promise<Visit[]> {
  const { data, error } = await supabase
    .from('review_sessions')
    .select('id,created_at,rating,highlights,language,draft,copied_at,opened_google_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((j: any) => ({
    id: j.id,
    createdAt: new Date(j.created_at),
    rating: j.rating,
    highlights: j.highlights ?? [],
    text: j.draft,
    copied: j.copied_at != null,
    openedGoogle: j.opened_google_at != null,
  }));
}

export async function deleteFeedback(id: string) {
  const { error } = await supabase.from('private_feedback').delete().eq('id', id);
  if (error) throw error;
}

export async function markFeedbackRead(id: string) {
  const { error } = await supabase.from('private_feedback').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ── Shared status handling for the gbp-* functions ─────────────────────────
export type Block = 'not_linked' | 'reconnect' | 'api_not_approved';
export class BlockedError extends Error {
  constructor(message: string, readonly block?: Block) {
    super(message);
  }
}

function check(data: Record<string, any>, messages: { not_linked: string; reconnect: string; api_not_approved: string }) {
  switch (data.status) {
    case 'ok':
      return data;
    case 'not_linked':
      throw new BlockedError(messages.not_linked, 'not_linked');
    case 'reconnect':
      throw new BlockedError(messages.reconnect, 'reconnect');
    case 'api_not_approved':
      throw new BlockedError(messages.api_not_approved, 'api_not_approved');
    default:
      throw new BlockedError(data.message ?? 'Something went wrong. Please try again.');
  }
}

const RECONNECT = 'Google access expired. Please connect your Google profile again.';
const LINK_FIRST = 'Link your Google Business Profile first.';

// ── Google reviews (google_reviews_repository.dart) ────────────────────────
export type GoogleReview = { id: string; reviewer?: string | null; photoUrl?: string | null; rating: number; comment: string; createdAt: Date; reply?: string | null; needsReply: boolean; displayComment: string };
export type ReviewsPage = { reviews: GoogleReview[]; averageRating: number | null; totalCount: number; nextPageToken?: string | null };

function toReview(j: any): GoogleReview {
  const comment: string = j.comment ?? '';
  const m = /^\(Translated by Google\)\s*([\s\S]*?)\s*\(Original\)/.exec(comment);
  const reply = j.reply?.comment ?? null;
  return {
    id: j.id,
    reviewer: j.reviewer,
    photoUrl: j.photoUrl,
    rating: Number(j.rating ?? 0),
    comment,
    createdAt: new Date(j.createdAt),
    reply,
    needsReply: !reply,
    displayComment: (m?.[1] ?? comment).trim(),
  };
}

async function reviewsCall(body: Record<string, unknown>) {
  const data = await invoke('gbp-reviews', body);
  if (data.status === 'api_not_approved') {
    throw new BlockedError(
      data.reason === 'service_disabled' ? "RevYne's reviews access is being switched on. Please check back soon." : 'Google has not switched on reviews access for RevYne yet.',
      'api_not_approved',
    );
  }
  return check(data, { not_linked: 'Link your Google Business Profile to see reviews.', reconnect: RECONNECT, api_not_approved: '' });
}

export async function listReviews(pageToken?: string | null): Promise<ReviewsPage> {
  const j = await reviewsCall({ action: 'list', ...(pageToken ? { pageToken } : {}) });
  return {
    reviews: ((j.reviews as any[]) ?? []).map(toReview),
    averageRating: j.averageRating == null ? null : Number(j.averageRating),
    totalCount: Number(j.totalReviewCount ?? 0),
    nextPageToken: j.nextPageToken,
  };
}
export const draftReply = async (reviewId: string) => (await reviewsCall({ action: 'draft', reviewId })).draft as string;
export const postReply = (reviewId: string, comment: string) => reviewsCall({ action: 'reply', reviewId, comment });
export const deleteReply = (reviewId: string) => reviewsCall({ action: 'unreply', reviewId });

// ── Google profile + score (profile_repository.dart) ───────────────────────
export type DayHours = { day: string; open: string; close: string };
export type SpecialDay = { date: string; closed: boolean; open?: string; close?: string };
export type GbpProfile = {
  title: string;
  description: string;
  phone: string;
  website: string;
  hours: DayHours[];
  specialHours: SpecialDay[];
  primaryCategory?: string | null;
  additionalCategories: string[];
  splitHours: boolean;
  hasPendingEdits: boolean;
  googleUpdated: boolean;
  mapsUri?: string | null;
};
export type ScoreAction = 'description' | 'hours' | 'phone' | 'website' | 'get_reviews' | 'reply' | 'photos' | 'posts' | 'none';
export type ScoreItem = { key: string; label: string; earned: number; max: number; tip?: string | null; action: ScoreAction };
export type ProfileView = { profile: GbpProfile; score: number; items: ScoreItem[]; tasks: ScoreItem[] };

function toProfileView(j: any): ProfileView {
  const p = j.profile ?? {};
  const items: ScoreItem[] = (j.score?.items ?? []).map((i: any) => ({
    key: i.key,
    label: i.label,
    earned: Number(i.earned),
    max: Number(i.max),
    tip: i.tip,
    action: (['description', 'hours', 'phone', 'website', 'get_reviews', 'reply', 'photos', 'posts'].includes(i.action) ? i.action : 'none') as ScoreAction,
  }));
  return {
    profile: {
      title: p.title ?? '',
      description: p.description ?? '',
      phone: p.phone ?? '',
      website: p.website ?? '',
      hours: p.hours ?? [],
      specialHours: p.specialHours ?? [],
      primaryCategory: p.primaryCategory,
      additionalCategories: p.additionalCategories ?? [],
      splitHours: !!p.splitHours,
      hasPendingEdits: !!p.hasPendingEdits,
      googleUpdated: !!p.googleUpdated,
      mapsUri: p.mapsUri,
    },
    score: Number(j.score?.score ?? 0),
    items,
    tasks: items.filter((i) => i.earned < i.max).sort((a, b) => b.max - b.earned - (a.max - a.earned)),
  };
}

async function profileCall(body: Record<string, unknown>) {
  return check(await invoke('gbp-profile', body), { not_linked: LINK_FIRST, reconnect: RECONNECT, api_not_approved: 'Google has not switched on profile access for RevYne yet.' });
}
export const getProfile = async () => toProfileView(await profileCall({ action: 'get' }));
export const updateProfile = async (field: string, value: unknown) => toProfileView(await profileCall({ action: 'update', field, value }));
export const draftDescription = async () => (await profileCall({ action: 'draft_description' })).draft as string;

/** Details Google changed itself (e.g. from public suggestions): yours vs Google's version. */
export type GoogleChange = { field: string; label: string; editable: boolean; mine: string; google: string; mineValue?: unknown; googleValue?: unknown };
export async function googleChanges(): Promise<{ changes: GoogleChange[]; mapsUri?: string | null }> {
  const j = await profileCall({ action: 'google_changes' });
  return { changes: (j.changes as GoogleChange[]) ?? [], mapsUri: j.mapsUri };
}

// ── Posts + photos (content_repository.dart) ───────────────────────────────
export const POST_TYPES = [
  { api: 'STANDARD', label: 'Update' },
  { api: 'OFFER', label: 'Offer' },
  { api: 'EVENT', label: 'Event' },
] as const;
export type PostTypeApi = (typeof POST_TYPES)[number]['api'];
export const postTypeLabel = (api?: string) => POST_TYPES.find((t) => t.api === api)?.label ?? 'Update';

export const POST_BUTTONS = [
  { api: 'NONE', label: 'No button', needsLink: false },
  { api: 'CALL', label: 'Call now', needsLink: false },
  { api: 'LEARN_MORE', label: 'Learn more', needsLink: true },
  { api: 'ORDER', label: 'Order online', needsLink: true },
  { api: 'BOOK', label: 'Book', needsLink: true },
  { api: 'SHOP', label: 'Shop', needsLink: true },
] as const;

export const PHOTO_CATEGORIES = [
  { api: 'EXTERIOR', label: 'Outside' },
  { api: 'INTERIOR', label: 'Inside' },
  { api: 'PRODUCT', label: 'Products' },
  { api: 'AT_WORK', label: 'At work' },
  { api: 'TEAMS', label: 'Team' },
  { api: 'COVER', label: 'Cover photo' },
  { api: 'LOGO', label: 'Logo' },
] as const;

export type GbpPost = { name: string; type: string; summary: string; title?: string | null; state: string; createdAt: Date; photoUrl?: string | null; searchUrl?: string | null };
export type ScheduledPost = { id: string; type: string; summary: string; title?: string | null; publishAt: Date; status: string; error?: string | null };
export type GbpPhoto = { name: string; url: string; thumbnailUrl?: string | null; category?: string | null };

export type PostForm = {
  type: PostTypeApi;
  summary: string;
  title: string;
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;
  couponCode: string;
  terms: string;
  button: string;
  buttonUrl: string;
};

export function postFormJson(f: PostForm) {
  const btn = POST_BUTTONS.find((b) => b.api === f.button)!;
  return {
    type: f.type,
    summary: f.summary.trim(),
    ...(f.type !== 'STANDARD' ? { title: f.title.trim(), startDate: f.startDate, endDate: f.endDate } : {}),
    ...(f.type === 'OFFER' ? { couponCode: f.couponCode.trim(), terms: f.terms.trim() } : {}),
    ...(f.type !== 'OFFER' ? { button: f.button, ...(btn.needsLink ? { buttonUrl: f.buttonUrl.trim() } : {}) } : {}),
  };
}

async function contentCall(body: Record<string, unknown>) {
  return check(await invoke('gbp-content', body), { not_linked: LINK_FIRST, reconnect: RECONNECT, api_not_approved: 'Google has not switched on this feature for RevYne yet.' });
}

export async function listPosts(): Promise<GbpPost[]> {
  const j = await contentCall({ action: 'posts' });
  return ((j.posts as any[]) ?? []).map((p) => ({ ...p, state: p.state ?? 'PROCESSING', summary: p.summary ?? '', createdAt: new Date(p.createdAt) }));
}
export const draftPost = async (type: string, brief: string, title?: string) =>
  (await contentCall({ action: 'post_draft', type, brief, ...(title ? { title } : {}) })).draft as string;
export const createPost = (form: PostForm, mediaPath?: string) => contentCall({ action: 'post_create', post: postFormJson(form), ...(mediaPath ? { mediaPath } : {}) });
export const deletePost = (name: string) => contentCall({ action: 'post_delete', name });
export const schedulePost = (form: PostForm, publishAt: Date, mediaPath?: string) =>
  contentCall({ action: 'post_schedule', post: postFormJson(form), publishAt: publishAt.toISOString(), ...(mediaPath ? { mediaPath } : {}) });
export const cancelScheduled = (id: string) => contentCall({ action: 'schedule_cancel', id });

export async function scheduledPosts(businessId: string): Promise<ScheduledPost[]> {
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('id,post,publish_at,status,error')
    .eq('business_id', businessId)
    .or(`status.in.(pending,publishing),and(status.eq.failed,publish_at.gte.${weekAgo})`)
    .order('publish_at');
  if (error) throw error;
  return (data ?? []).map((j: any) => ({
    id: j.id,
    type: j.post?.type,
    summary: j.post?.summary ?? '',
    title: j.post?.title || null,
    publishAt: new Date(j.publish_at),
    status: j.status,
    error: j.error,
  }));
}

export async function listPhotos(): Promise<{ photos: GbpPhoto[]; total: number }> {
  const j = await contentCall({ action: 'photos' });
  return { photos: j.photos ?? [], total: Number(j.total ?? 0) };
}
export const addPhoto = (mediaPath: string, category: string) => contentCall({ action: 'photo_add', mediaPath, category });
export const deletePhoto = (name: string) => contentCall({ action: 'photo_delete', name });

const randomId = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');

/** Uploads a picked photo to the private bucket; returns its path for Google. */
export async function uploadMedia(businessId: string, blob: Blob, png: boolean) {
  const path = `${businessId}/${randomId(20)}.${png ? 'png' : 'jpg'}`;
  const { error } = await supabase.storage.from('gbp-media').upload(path, blob, { contentType: png ? 'image/png' : 'image/jpeg' });
  if (error) {
    const status = (error as any).statusCode ?? (error as any).status;
    throw new Error(String(status) === '413' ? 'That photo is too large (5 MB max).' : 'Could not upload the photo. Please try again.');
  }
  return path;
}

// ── Insights + report (insights_repository.dart, report_repository.dart) ───
export type Totals = { searchViews: number; mapsViews: number; calls: number; directions: number; websiteClicks: number; chats: number; views: number; actions: number };
export type Keyword = { keyword: string; label: string };
export type Insights = { days: number; start: Date; end: Date; totals: Totals; previous: Totals; daily: { date: Date; views: number; actions: number }[]; keywords: Keyword[] };

function toTotals(j: any): Totals {
  const n = (k: string) => Number(j?.[k] ?? 0);
  const t = { searchViews: n('searchViews'), mapsViews: n('mapsViews'), calls: n('calls'), directions: n('directions'), websiteClicks: n('websiteClicks'), chats: n('chats') };
  return { ...t, views: t.searchViews + t.mapsViews, actions: t.calls + t.directions + t.websiteClicks + t.chats };
}
const toKeyword = (k: any): Keyword => ({ keyword: k.keyword, label: k.count != null ? `${k.count}` : k.below != null ? `< ${k.below}` : '–' });
const day = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00`);
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function insights(range: { days: number; start?: Date; end?: Date }): Promise<Insights> {
  const body = range.start && range.end ? { action: 'get', start: isoDate(range.start), end: isoDate(range.end) } : { action: 'get', days: range.days };
  const j = check(await invoke('gbp-insights', body), { not_linked: LINK_FIRST, reconnect: RECONNECT, api_not_approved: 'Google has not switched on stats for RevYne yet.' });
  return {
    days: Number(j.range.days),
    start: day(j.range.start),
    end: day(j.range.end),
    totals: toTotals(j.totals),
    previous: toTotals(j.previous),
    daily: (j.daily as any[]).map((d) => ({ date: day(d.date), views: Number(d.views), actions: Number(d.actions) })),
    keywords: ((j.keywords as any[]) ?? []).map(toKeyword),
  };
}

export function percentChange(now: number, before?: number | null): number | null {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
}

export type MonthlyReport = {
  month: Date;
  businessName: string;
  city?: string | null;
  complete: boolean;
  statsThrough?: Date | null;
  google?: Totals | null;
  previousGoogle?: Totals | null;
  reviews?: { received: number; replied: number; averageRating?: number | null } | null;
  ratingAverage?: number | null;
  ratingTotal?: number | null;
  postsPublished?: number | null;
  offers: number;
  events: number;
  searches: Keyword[];
  pageVisits?: number | null;
  wentToGoogle?: number | null;
  privateMessages?: number | null;
};

export async function monthlyReport(month: Date): Promise<MonthlyReport> {
  const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const j = await invoke('gbp-report', { action: 'get', month: key }, 'Could not load the report. Please try again.');
  if (j.status !== 'ok') throw new Error(j.message ?? 'Could not load the report.');
  return {
    month: new Date(month.getFullYear(), month.getMonth(), 1),
    businessName: j.business?.name ?? '',
    city: j.business?.city,
    complete: j.complete ?? true,
    statsThrough: j.statsThrough ? day(j.statsThrough) : null,
    google: j.google ? toTotals(j.google) : null,
    previousGoogle: j.previousGoogle ? toTotals(j.previousGoogle) : null,
    reviews: j.reviews ? { received: Number(j.reviews.received), replied: Number(j.reviews.replied), averageRating: j.reviews.averageRating } : null,
    ratingAverage: j.rating?.average,
    ratingTotal: j.rating?.total,
    postsPublished: j.posts?.published,
    offers: Number(j.posts?.offers ?? 0),
    events: Number(j.posts?.events ?? 0),
    searches: ((j.searches as any[]) ?? []).map(toKeyword),
    pageVisits: j.revyne?.pageVisits,
    wentToGoogle: j.revyne?.wentToGoogle,
    privateMessages: j.revyne?.privateMessages,
  };
}

// ── Google connect (gbp_repository.dart) ───────────────────────────────────
export type ConnectStatus = 'ok' | 'api_not_approved' | 'missing_scope' | 'no_refresh_token' | 'reconnect' | 'already_has_business' | 'location_taken' | 'not_found';
export type LocationOption = { account: string; location: string; title: string; city?: string | null; takenByOther: boolean };
export type ConnectResult = { status: ConnectStatus; locations: LocationOption[]; business?: Business | null };

const STATUSES: ConnectStatus[] = ['ok', 'api_not_approved', 'missing_scope', 'no_refresh_token', 'already_has_business', 'location_taken', 'not_found'];
async function connectCall(body: Record<string, unknown>): Promise<ConnectResult> {
  const j = await invoke('gbp-connect', body);
  return {
    status: STATUSES.includes(j.status) ? j.status : 'reconnect',
    locations: ((j.locations as any[]) ?? []).map((l) => ({ account: l.account, location: l.location, title: l.title ?? '', city: l.city, takenByOther: !!l.takenByOther })),
    business: j.business ? toBusiness(j.business) : null,
  };
}
export const exchangeCode = (code: string) => connectCall({ action: 'exchange', serverAuthCode: code, redirectUri: 'postmessage' });
export const gbpLocations = () => connectCall({ action: 'locations' });
export const claimLocation = (o: LocationOption) => connectCall({ action: 'claim', account: o.account, location: o.location });

// ── Activity (activity_screen.dart) ────────────────────────────────────────
const SHOWN = ['reply_posted', 'reply_deleted', 'profile_edit', 'post_created', 'post_deleted', 'post_scheduled', 'post_schedule_cancelled', 'photo_added', 'photo_deleted'];
export async function activity(businessId: string) {
  const { data, error } = await supabase
    .from('owner_actions')
    .select('kind,detail,created_at')
    .eq('business_id', businessId)
    .in('kind', SHOWN)
    .order('created_at', { ascending: false })
    .limit(150);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ kind: r.kind as string, detail: r.detail as string | null, at: new Date(r.created_at) }));
}

const FIELDS: Record<string, string> = { description: 'description', hours: 'opening hours', specialHours: 'holiday hours', phone: 'phone number', website: 'website' };
const PHOTO_TYPES: Record<string, string> = { COVER: 'cover', PROFILE: 'profile', LOGO: 'logo', EXTERIOR: 'outside', INTERIOR: 'inside', PRODUCT: 'product', AT_WORK: 'at-work', TEAMS: 'team' };
const POST_NOUNS: Record<string, string> = { STANDARD: 'update', OFFER: 'offer', EVENT: 'event' };
const postNoun = (d?: string | null) => {
  const n = POST_NOUNS[(d ?? '').split(' ').pop() ?? ''] ?? 'post';
  return n === 'post' ? 'a post' : `an ${n}`;
};
const photoNoun = (d?: string | null) => {
  const t = PHOTO_TYPES[d ?? ''];
  if (!t) return 'a photo';
  return `${'aeiou'.includes(t[0]) ? 'an' : 'a'} ${t} photo`;
};

/** Plain-language line + icon, e.g. "Updated opening hours on Google". */
export function activityDisplay(kind: string, detail?: string | null): [string, string] {
  switch (kind) {
    case 'reply_posted':
      return ['reply', 'Replied to a Google review'];
    case 'reply_deleted':
      return ['delete', 'Deleted a review reply'];
    case 'profile_edit':
      return ['edit', `Updated ${FIELDS[detail ?? ''] ?? 'profile details'} on Google`];
    case 'post_created':
      return (detail ?? '').startsWith('scheduled') ? ['schedule_send', 'Published a scheduled post on Google'] : ['campaign', `Posted ${postNoun(detail)} on Google`];
    case 'post_deleted':
      return ['delete', 'Deleted a Google post'];
    case 'post_scheduled':
      return ['event_available', `Scheduled ${postNoun(detail)}`];
    case 'post_schedule_cancelled':
      return ['event_busy', 'Cancelled a scheduled post'];
    case 'photo_added':
      return ['add_photo_alternate', `Added ${photoNoun(detail)} on Google`];
    case 'photo_deleted':
      return ['hide_image', 'Deleted a photo'];
    default:
      return ['history', 'Changed something on Google'];
  }
}

// ── Notifications (notifications_screen.dart) ─────────────────────────────
export type AppNotification = { id: number; kind: string; title: string; body: string; route: string; createdAt: Date; unread: boolean };
export async function notifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase.from('notifications').select('id,kind,title,body,route,created_at,read_at').order('created_at', { ascending: false }).limit(60);
  if (error) throw error;
  return (data ?? []).map((j: any) => ({
    id: Number(j.id),
    kind: j.kind ?? 'system',
    title: j.title ?? '',
    body: j.body ?? '',
    route: j.route ?? '/home',
    createdAt: new Date(j.created_at),
    unread: j.read_at == null,
  }));
}
export async function markNotificationRead(id: number) {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
export async function markAllNotificationsRead() {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  if (error) throw error;
}
export const notificationIcon = (kind: string) => ({ review: 'star', message: 'forum', post: 'campaign', profile: 'storefront' })[kind] ?? 'notifications';

// ── Reply templates (templates/reply_templates.dart) ───────────────────────
export type ReplyTemplate = { id: string; title: string; body: string };
export async function templates(businessId: string): Promise<ReplyTemplate[]> {
  const { data, error } = await supabase.from('reply_templates').select('id,title,body').eq('business_id', businessId).order('created_at');
  if (error) throw error;
  return data ?? [];
}
export async function saveTemplate(businessId: string, t: { id?: string; title: string; body: string }) {
  const row = { title: t.title.trim(), body: t.body.trim() };
  const { error } = t.id ? await supabase.from('reply_templates').update(row).eq('id', t.id) : await supabase.from('reply_templates').insert({ ...row, business_id: businessId });
  if (error) throw error;
}
export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('reply_templates').delete().eq('id', id);
  if (error) throw error;
}
export const STARTER_TEMPLATES: [string, string][] = [
  ['Thank you', "Thank you, {name}! We're glad you chose {business} and hope to see you again soon."],
  ["Sorry it wasn't great", "Thank you for telling us, {name}. We're sorry your experience wasn't what it should be. Please speak to our team directly so we can put it right."],
  ['Rating only', 'Thank you for the rating, {name}! It means a lot to everyone at {business}.'],
];
export async function addStarterTemplates(businessId: string) {
  const { error } = await supabase.from('reply_templates').insert(STARTER_TEMPLATES.map(([title, body]) => ({ business_id: businessId, title, body })));
  if (error) throw error;
}

/** {business} → name; {name} → first name, or dropped with its leading comma/space. */
export function fillTemplate(body: string, reviewer: string | null | undefined, business: string) {
  const first = (reviewer ?? '').trim().split(/\s+/)[0] ?? '';
  const usable = /^\p{L}[\p{L}\p{M}'.-]{1,30}$/u.test(first) && first.toLowerCase() !== 'google';
  let out = body.split('{business}').join(business);
  out = usable ? out.split('{name}').join(first) : out.replace(/[,\s]*\{name\}/g, '');
  return out.trim();
}

// ── Profile photo (profile/user_avatar.dart) ───────────────────────────────
export function googlePhotoUrl(meta: Record<string, any> | undefined) {
  const url = (meta?.avatar_url ?? meta?.picture) as string | undefined;
  if (!url) return null;
  return url.replace(/=s\d+-c$/, '=s256-c');
}

export async function myPhotoUrl(): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from('profiles').select('avatar_url').eq('id', u.user.id).maybeSingle();
  const url = data?.avatar_url as string | undefined;
  return url ? url : googlePhotoUrl(u.user.user_metadata);
}

/** Uploads to the public avatars bucket and points profiles.avatar_url at it (or back to Google). */
export async function setProfilePhoto(blob: Blob | 'google') {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user!;
  const { data: row } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();
  const current = row?.avatar_url as string | undefined;
  const google = googlePhotoUrl(user.user_metadata);
  const usingOwn = !!current && current !== google && current.includes('/avatars/');
  let newUrl: string | null;
  if (blob === 'google') {
    newUrl = (user.user_metadata?.avatar_url as string) ?? null;
  } else {
    const path = `${user.id}/${randomId(16)}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw new Error('Could not upload the photo. Please try a smaller one.');
    newUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  }
  const { error } = await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
  if (error) throw new Error('Could not change the photo right now. Please try again.');
  if (usingOwn) {
    const old = /\/avatars\/(.+)$/.exec(current!)?.[1];
    if (old) await supabase.storage.from('avatars').remove([old]).catch(() => {});
  }
}

export async function deleteAccount() {
  await invoke('account-delete', {}, 'Could not delete your account. Please try again.');
  await supabase.auth.signOut();
}

// ── Images: shrink like image_picker (maxWidth/maxHeight, JPEG 85) ─────────
export async function shrinkImage(file: File, max: number): Promise<{ blob: Blob; png: boolean; url: string }> {
  const png = file.type === 'image/png';
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not read the photo.'))), png ? 'image/png' : 'image/jpeg', 0.85));
  return { blob, png, url: URL.createObjectURL(blob) };
}
