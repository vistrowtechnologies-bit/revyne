// PDFs with jsPDF: the counter poster (poster_pdf.dart) and the monthly
// report (report_pdf.dart). Both download straight away.
import type { jsPDF as JsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Business, MonthlyReport } from './api';
import { percentChange } from './api';
import { MONTHS, monthLabel } from './format';

const VIOLET = '#6334E2';
const INK = '#16112E';
const MUTED = '#5B5577';
const LINE = '#E4E1F2';
const SOFT = '#F5F2FC';

async function base64(url: string) {
  const buf = await (await fetch(url)).arrayBuffer();
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function newDoc(format: 'a4' | 'a5') {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format });
  const [medium, bold] = await Promise.all([base64('/fonts/PlusJakartaSans-Medium.ttf'), base64('/fonts/PlusJakartaSans-ExtraBold.ttf')]);
  doc.addFileToVFS('PJS-Medium.ttf', medium);
  doc.addFont('PJS-Medium.ttf', 'PJS', 'normal');
  doc.addFileToVFS('PJS-Bold.ttf', bold);
  doc.addFont('PJS-Bold.ttf', 'PJS', 'bold');
  doc.setFont('PJS', 'normal');
  return doc;
}

const logo = () => base64('/logo.png').then((b) => `data:image/png;base64,${b}`);

/** Three-stop left→right gradient, painted as thin strips (jsPDF has no gradients). */
function gradient(doc: JsPDF, w: number, h: number, stops: [number, number, number][]) {
  const n = 160;
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const [a, b, k] = t < 0.5 ? [stops[0], stops[1], t * 2] : [stops[1], stops[2], (t - 0.5) * 2];
    doc.setFillColor(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k));
    doc.rect((i * w) / n, 0, w / n + 0.6, h, 'F');
  }
}

/** Printable poster (A5/A4) for the review link — asks for an experience, never a rating. */
export async function downloadPoster(b: Business, link: string, size: 'A5' | 'A4') {
  const doc = await newDoc(size === 'A4' ? 'a4' : 'a5');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const k = W / 420; // designed at A5 width
  gradient(doc, W, H, [[0xb0, 0x2f, 0xe5], [0x63, 0x34, 0xe2], [0x36, 0x3d, 0xdd]]);
  const m = 28 * k;
  doc.setFillColor('#FFFFFF');
  doc.roundedRect(m, m, W - 2 * m, H - 2 * m, 22 * k, 22 * k, 'F');
  const cx = W / 2;

  doc.setFont('PJS', 'bold').setFontSize(26 * k).setTextColor(INK);
  doc.text(doc.splitTextToSize(b.name, W - 4 * m), cx, m + 58 * k, { align: 'center' });
  if (b.city) doc.setFont('PJS', 'normal').setFontSize(13 * k).setTextColor(MUTED).text(b.city, cx, m + 80 * k, { align: 'center' });
  doc.setFont('PJS', 'bold').setFontSize(22 * k).setTextColor(VIOLET);
  doc.text('Share your experience', cx, m + 122 * k, { align: 'center' });
  doc.text('on Google', cx, m + 150 * k, { align: 'center' });

  const qr = await QRCode.toDataURL(link, { margin: 0, width: 760, color: { dark: INK, light: '#FFFFFF' } });
  const q = 190 * k;
  const qy = H / 2 - q / 2 + 30 * k;
  doc.setDrawColor(LINE).setLineWidth(1.5);
  doc.roundedRect(cx - q / 2 - 14 * k, qy - 14 * k, q + 28 * k, q + 28 * k, 18 * k, 18 * k, 'S');
  doc.addImage(qr, 'PNG', cx - q / 2, qy, q, q);

  const by = H - m - 80 * k;
  doc.setFont('PJS', 'bold').setFontSize(14 * k).setTextColor(INK).text('Scan with your phone camera', cx, by, { align: 'center' });
  doc.setFont('PJS', 'normal').setFontSize(10 * k).setTextColor(MUTED).text(link, cx, by + 16 * k, { align: 'center' });
  const label = 'Powered by RevYne';
  const lw = doc.setFontSize(10 * k).getTextWidth(label);
  const lx = cx - (lw + 24 * k) / 2;
  doc.addImage(await logo(), 'PNG', lx, by + 34 * k, 18 * k, 18 * k);
  doc.text(label, lx + 24 * k, by + 47 * k);
  doc.save(`revyne-poster-${size}.pdf`);
}

/** One-page A4 monthly report for sharing. */
export async function downloadReport(r: MonthlyReport) {
  const doc = await newDoc('a4');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  let y = M;

  doc.addImage(await logo(), 'PNG', M, y, 26, 26);
  doc.setFont('PJS', 'bold').setFontSize(12).setTextColor(VIOLET).text('RevYne monthly report', M + 34, y + 17);
  y += 54;
  doc.setFontSize(22).setTextColor(INK).text(r.businessName, M, y);
  y += 18;
  doc.setFont('PJS', 'normal').setFontSize(12).setTextColor(MUTED).text(`${monthLabel(r.month)}${r.city ? ` · ${r.city}` : ''}${r.complete ? '' : ' · so far'}`, M, y);
  y += 8;

  const change = (now: number, before?: number | null) => {
    const p = before == null ? null : percentChange(now, before);
    return p == null ? '' : ` (${p >= 0 ? '+' : ''}${p}% vs last month)`;
  };

  const section = (title: string, rows: [string, string, string?][], hero?: [string, string]) => {
    const rowH = 19;
    const h = 34 + (hero ? 50 : 0) + rows.length * rowH;
    y += 14;
    doc.setDrawColor(LINE).setLineWidth(1).roundedRect(M, y, W - 2 * M, h, 12, 12, 'S');
    let iy = y + 22;
    doc.setFont('PJS', 'bold').setFontSize(9).setTextColor(MUTED).text(title.toUpperCase(), M + 14, iy);
    iy += 10;
    if (hero) {
      doc.setFillColor(SOFT).roundedRect(M + 14, iy, W - 2 * M - 28, 40, 8, 8, 'F');
      doc.setFont('PJS', 'bold').setFontSize(26).setTextColor(VIOLET).text(hero[0], M + 24, iy + 29);
      const hw = doc.getTextWidth(hero[0]);
      doc.setFont('PJS', 'normal').setFontSize(11).setTextColor(MUTED).text(hero[1], M + 32 + hw, iy + 26);
      iy += 50;
    }
    for (const [label, value, note] of rows) {
      iy += rowH;
      doc.setFont('PJS', 'normal').setFontSize(11).setTextColor(MUTED).text(label, M + 14, iy - 5);
      const right = W - M - 14;
      if (note) {
        doc.setFontSize(9).text(note, right, iy - 5, { align: 'right' });
        const nw = doc.getTextWidth(note);
        doc.setFont('PJS', 'bold').setFontSize(12).setTextColor(INK).text(value, right - nw - 2, iy - 5, { align: 'right' });
      } else doc.setFont('PJS', 'bold').setFontSize(12).setTextColor(INK).text(value, right, iy - 5, { align: 'right' });
    }
    y += h;
  };

  const g = r.google;
  const pg = r.previousGoogle;
  if (g)
    section(
      'On Google',
      [
        ['From Google Search', `${g.searchViews}`],
        ['From Google Maps', `${g.mapsViews}`],
        ['Calls', `${g.calls}`, change(g.calls, pg?.calls)],
        ['Direction requests', `${g.directions}`, change(g.directions, pg?.directions)],
        ['Website clicks', `${g.websiteClicks}`],
        ['Chats', `${g.chats}`],
      ],
      [`${g.views}`, `people saw your profile${change(g.views, pg?.views)}`],
    );
  if (r.reviews)
    section('Reviews', [
      ['New Google reviews', `${r.reviews.received}`],
      ...(r.reviews.averageRating != null ? [['Average rating this month', `${r.reviews.averageRating} / 5`] as [string, string]] : []),
      ['Replied', `${r.reviews.replied} of ${r.reviews.received}`],
      ...(r.ratingAverage != null ? [['Overall Google rating now', `${Number(r.ratingAverage).toFixed(1)} from ${r.ratingTotal} reviews`] as [string, string]] : []),
    ]);
  if (r.pageVisits != null)
    section('RevYne review page', [
      ['Customers who opened your review link', `${r.pageVisits}`],
      ['Went on to Google', `${r.wentToGoogle}`],
      ['Private messages to you', `${r.privateMessages}`],
    ]);
  if (r.postsPublished != null) section('Posts', [['Posts published', `${r.postsPublished}`, r.offers + r.events > 0 ? ` (${r.offers} offers, ${r.events} events)` : '']]);
  if (r.searches.length) section('Top searches', r.searches.map((k) => [k.keyword, k.label] as [string, string]));

  const foot = `Google figures are from your Google Business Profile${r.statsThrough ? `, up to ${r.statsThrough.getDate()} ${MONTHS[r.statsThrough.getMonth()]}` : ''}. Small search counts show as "< N".`;
  doc.setFont('PJS', 'normal').setFontSize(8.5).setTextColor(MUTED).text(doc.splitTextToSize(foot, W - 2 * M), M, H - M);

  const slug = r.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  doc.save(`${slug}-${r.month.getFullYear()}-${String(r.month.getMonth() + 1).padStart(2, '0')}.pdf`);
}
