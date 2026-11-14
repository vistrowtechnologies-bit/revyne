// Sample data for the preview — a neutral made-up business, no real customers.

const now = Date.now();
const H = 3600e3;
const D = 24 * H;
const ago = (ms: number) => new Date(now - ms);

export const owner = { name: 'Rohan Sharma', email: 'rohan@example.com' };

export const business = {
  name: 'Sharma Sweets',
  city: 'Pune',
  slug: 'sharma-sweets',
  verified: true,
};

export const reviewLink = `https://revyneai.com/r/${business.slug}`;

export function reviewRequestMessage(customerName?: string) {
  const n = (customerName ?? '').trim();
  return `Namaste${n ? ` ${n}` : ''}! Thank you for visiting ${business.name}. We'd love to hear about your experience: ${reviewLink}`;
}

// ── Home dashboard (get_dashboard_stats) ────────────────────────────────────
const dailyVisits = [9, 14, 11, 18, 13, 22, 17];
export const dashboard = {
  google7d: 23,
  googlePrev7d: 17,
  visits7d: dailyVisits.reduce((a, b) => a + b, 0),
  avgRating30d: 4.7,
  unreadFeedback: 2,
  daily: dailyVisits.map((v, i) => ({ day: new Date(now - (6 - i) * D), visits: v })),
};

export function weekDelta(cur: number, prev: number) {
  if (cur === prev) return 'same as last week';
  if (prev === 0) return 'new this week';
  const d = cur - prev;
  return `${d > 0 ? '+' : '−'}${Math.abs(d)} vs last week`;
}

// ── Google reviews ──────────────────────────────────────────────────────────
export type GoogleReview = { id: string; reviewer: string; rating: number; comment: string; createdAt: Date; reply?: string };

export const googleReviews: GoogleReview[] = [
  { id: 'g1', reviewer: 'Ananya Kulkarni', rating: 5, createdAt: ago(3 * H), comment: 'Best kaju katli in Pune! Fresh every time and the staff packed a Diwali box beautifully for us. Will be back for the festive orders.' },
  { id: 'g2', reviewer: 'Vikram Joshi', rating: 4, createdAt: ago(1 * D + 2 * H), comment: 'Lovely motichoor ladoos and quick service. Parking near the shop is a bit tight on weekends.' },
  { id: 'g3', reviewer: 'Meera Patil', rating: 5, createdAt: ago(2 * D + 5 * H), comment: 'Ordered 5 kg of mixed mithai for my sister\'s wedding. Everyone loved it. Thank you!' },
  { id: 'g4', reviewer: 'Sandeep Rao', rating: 3, createdAt: ago(4 * D), comment: 'Taste is good but the samosas were a little cold when I picked them up in the evening.' },
  { id: 'g5', reviewer: 'Fatima Shaikh', rating: 5, createdAt: ago(6 * D), comment: 'Rasmalai is outstanding — soft and not too sweet.', reply: 'Thank you so much, Fatima! We make the rasmalai fresh every morning. See you again soon.' },
  { id: 'g6', reviewer: 'Arjun Deshmukh', rating: 5, createdAt: ago(9 * D), comment: 'Always my first stop for festival sweets. Clean shop and polite staff.', reply: 'Thank you, Arjun! It means a lot that you choose us for every festival.' },
  { id: 'g7', reviewer: 'Kavya Nair', rating: 4, createdAt: ago(13 * D), comment: 'Great dry fruit barfi. Would love a sugar-free option too.', reply: 'Thanks Kavya! Sugar-free barfi is coming this month — do ask at the counter.' },
];
export const googleTotals = { average: 4.7, total: 186 };

/** Sample AI drafts (the real app asks the server). */
export function aiDraft(r: GoogleReview, n: number) {
  const first = r.reviewer.split(' ')[0];
  const drafts =
    r.rating >= 4
      ? [
          `Thank you so much, ${first}! We're delighted you enjoyed it. Our team will be happy to hear this — see you again soon at Sharma Sweets.`,
          `Dhanyavaad ${first}! Your kind words made our day. We look forward to serving you again this festive season.`,
        ]
      : [
          `Thank you for the honest feedback, ${first}. We're sorry the samosas weren't hot — we've asked the team to fry fresh batches in the evening. Please visit again and let us know.`,
          `Hi ${first}, thank you for telling us. We want every visit to be great, so we've changed our evening routine. Hope to serve you better next time.`,
        ];
  return drafts[n % drafts.length];
}

// ── Private messages and visits ────────────────────────────────────────────
export type Feedback = { id: string; name?: string; rating?: number; message: string; contact?: string; createdAt: Date; unread: boolean };
export const privateFeedback: Feedback[] = [
  { id: 'f1', name: 'Rahul M', rating: 2, createdAt: ago(5 * H), unread: true, contact: '+91 98000 00012', message: 'The gulab jamun box I bought yesterday was not fresh. Please check your stock.' },
  { id: 'f2', name: 'Pooja', rating: 4, createdAt: ago(1 * D + 6 * H), unread: true, message: 'Could you start home delivery in Kothrud? Would order every week.' },
  { id: 'f3', name: 'Nikhil S', rating: 3, createdAt: ago(5 * D), unread: false, contact: 'nikhil@example.com', message: 'Billing counter was slow on Sunday evening, otherwise sweets are great.' },
];

export type Visit = { id: string; rating?: number; highlights: string[]; text?: string; openedGoogle: boolean; copied: boolean; createdAt: Date };
export const visits: Visit[] = [
  { id: 'v1', rating: 5, highlights: ['Fresh sweets', 'Friendly staff'], text: 'Loved the kaju katli and the festive packing!', openedGoogle: true, copied: true, createdAt: ago(2 * H) },
  { id: 'v2', rating: 5, highlights: ['Great taste'], openedGoogle: true, copied: false, createdAt: ago(7 * H) },
  { id: 'v3', rating: 4, highlights: ['Good value', 'Clean shop'], text: 'Good ladoos, reasonable prices.', openedGoogle: false, copied: true, createdAt: ago(1 * D) },
  { id: 'v4', highlights: [], openedGoogle: false, copied: false, createdAt: ago(2 * D) },
];

// ── Google profile ──────────────────────────────────────────────────────────
export const profile = {
  description: 'Family-run sweet shop in Pune since 1987. Fresh mithai, namkeen and festive gift boxes made every morning.',
  hoursSummary: 'Every day · 8:00 am – 10:00 pm',
  holidays: 'None coming up',
  phone: '',
  website: 'sharmasweets.example.com',
  category: 'Sweet shop, Indian sweets shop, Caterer',
};

export const score = {
  value: 72,
  tasks: [
    { gain: 10, label: 'Add your phone number', tip: 'Customers call straight from Google.' },
    { gain: 8, label: 'Reply to 4 reviews', tip: 'Replies show customers you care.' },
    { gain: 6, label: 'Post an update this week', tip: 'Fresh posts keep your profile active.' },
    { gain: 4, label: 'Add 3 more photos', tip: 'Profiles with photos get more calls.' },
  ],
};

export type Post = { id: string; type: 'Update' | 'Offer' | 'Event'; state: 'LIVE' | 'PENDING' | 'REJECTED'; title?: string; summary: string; createdAt: Date; photo?: string };
export const posts: Post[] = [
  { id: 'p1', type: 'Offer', state: 'LIVE', title: 'Diwali gift boxes', summary: 'Pre-book your Diwali mithai boxes and get 10% off on orders above ₹2,000. Valid till 10 Nov.', createdAt: ago(4 * D), photo: 'linear-gradient(135deg,#F59E0B,#EA580C 55%,#9A3412)' },
  { id: 'p2', type: 'Update', state: 'PENDING', summary: 'Fresh batch of kesar peda is ready today. Visit us on FC Road!', createdAt: ago(2 * H) },
];
export const scheduled = [
  { id: 's1', type: 'Update', at: new Date(now + 2 * D), title: undefined as string | undefined, summary: 'Sunday special: hot jalebi and fafda from 8 am. Come early!' },
];

export const photos = [
  { label: 'Outside', icon: 'storefront', bg: 'linear-gradient(135deg,#F59E0B,#B45309)' },
  { label: 'Kaju katli', icon: 'cake', bg: 'linear-gradient(135deg,#FDE68A,#D97706)' },
  { label: 'Counter', icon: 'shopping_basket', bg: 'linear-gradient(135deg,#FB7185,#BE123C)' },
  { label: 'Ladoos', icon: 'bakery_dining', bg: 'linear-gradient(135deg,#FDBA74,#C2410C)' },
  { label: 'Team', icon: 'groups', bg: 'linear-gradient(135deg,#A78BFA,#6D28D9)' },
  { label: 'Gift boxes', icon: 'redeem', bg: 'linear-gradient(135deg,#F472B6,#9D174D)' },
];
export const photoTotal = 24;

// ── Google stats (insights) ────────────────────────────────────────────────
function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}
export function insights(days: number, start?: Date, end?: Date) {
  const e = end ?? new Date(now - 2 * D);
  const s = start ?? new Date(e.getTime() - (days - 1) * D);
  const n = Math.round((e.getTime() - s.getTime()) / D) + 1;
  const r = rand(n * 7 + s.getDate());
  const daily = Array.from({ length: n }, (_, i) => {
    const wd = new Date(s.getTime() + i * D).getDay();
    return Math.round(28 + r() * 26 + (wd === 0 || wd === 6 ? 18 : 0));
  });
  const views = daily.reduce((a, b) => a + b, 0);
  const k = n / 28;
  const t = {
    views,
    searchViews: Math.round(views * 0.62),
    mapsViews: views - Math.round(views * 0.62),
    calls: Math.round(41 * k),
    directions: Math.round(96 * k),
    websiteClicks: Math.round(23 * k),
    chats: Math.round(7 * k),
  };
  const p = { views: Math.round(views * 0.88), calls: Math.round(t.calls * 0.9), directions: Math.round(t.directions * 1.06), websiteClicks: Math.round(t.websiteClicks * 0.8), chats: t.chats };
  return { start: s, end: e, daily, totals: { ...t, actions: t.calls + t.directions + t.websiteClicks + t.chats }, previous: p };
}
export const keywords = [
  { keyword: 'sweet shop near me', label: '1,240' },
  { keyword: 'sharma sweets pune', label: '612' },
  { keyword: 'kaju katli', label: '188' },
  { keyword: 'diwali sweets box', label: '96' },
  { keyword: 'mithai shop fc road', label: '< 15' },
];

export function percentChange(nowV: number, before: number): number | null {
  if (!before) return null;
  return Math.round(((nowV - before) * 100) / before);
}

// ── Activity log ───────────────────────────────────────────────────────────
export const activity = [
  { icon: 'reply', text: 'Replied to a Google review', at: ago(1 * H) },
  { icon: 'campaign', text: 'Posted an update on Google', at: ago(2 * H + 10 * 60e3) },
  { icon: 'event_available', text: 'Scheduled an update', at: ago(1 * D + 3 * H) },
  { icon: 'edit', text: 'Updated opening hours on Google', at: ago(1 * D + 5 * H) },
  { icon: 'add_photo_alternate', text: 'Added a product photo on Google', at: ago(3 * D) },
  { icon: 'campaign', text: 'Posted an offer on Google', at: ago(4 * D) },
  { icon: 'reply', text: 'Replied to a Google review', at: ago(6 * D) },
  { icon: 'delete', text: 'Deleted a photo', at: ago(8 * D) },
];

// ── Formatting — lib/core/format.dart ───────────────────────────────────────
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function timeAgo(t: Date) {
  const diff = Date.now() - t.getTime();
  if (diff < 60e3) return 'just now';
  if (diff < H) return `${Math.floor(diff / 60e3)}m ago`;
  if (diff < D) return `${Math.floor(diff / H)}h ago`;
  if (diff < 7 * D) return `${Math.floor(diff / D)}d ago`;
  return `${t.getDate()} ${SHORT[t.getMonth()]}`;
}
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
export const shortDate = (d: Date) => `${d.getDate()} ${SHORT[d.getMonth()]}`;
export const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export function clock(d: Date) {
  const h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`;
}
export function whenLabel(d: Date) {
  return `${WEEK[d.getDay()]} ${d.getDate()} ${SHORT[d.getMonth()]}, ${clock(d)}`;
}
export function dayLabel(d: Date) {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  const diff = Math.round((today - day) / D);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${WEEK[d.getDay()]} ${d.getDate()} ${SHORT[d.getMonth()]}`;
}
