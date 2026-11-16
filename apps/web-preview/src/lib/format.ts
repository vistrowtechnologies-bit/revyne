// lib/core/format.dart + small date helpers.
const H = 3600e3;
const D = 24 * H;

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

export function firstName(full?: string | null) {
  const p = (full ?? '').trim().split(/\s+/)[0];
  return p ? p : null;
}

/** "09:30" → "9:30 am"; "24:00" → "midnight" (profile_editors.dart). */
export function timeLabel(s: string) {
  if (s === '24:00' || s === '00:00') return 'midnight';
  const [hh, mm] = s.split(':').map(Number);
  const h = hh % 12 === 0 ? 12 : hh % 12;
  return `${h}${mm === 0 ? '' : `:${String(mm).padStart(2, '0')}`} ${hh < 12 ? 'am' : 'pm'}`;
}
