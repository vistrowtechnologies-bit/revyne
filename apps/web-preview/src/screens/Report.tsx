// lib/features/reports/report_screen.dart
import { useState, type ReactNode } from 'react';
import { keywords, MONTHS, monthLabel } from '../data';
import { Card, Gap, GradientButton, GradientCard, Icon, useToast } from '../ui';
import { AppBar } from './AppBar';
import { ChangeBadge } from './Stats';

function sample(m: Date) {
  const k = 0.8 + ((m.getMonth() * 37) % 40) / 100;
  const r = (n: number) => Math.round(n * k);
  return {
    g: { views: r(1720), calls: r(44), directions: r(102), website: r(25), search: r(1066), maps: r(654), chats: r(8) },
    pg: { views: r(1540), search: r(980), maps: r(560) },
    reviews: { received: r(14), avg: 4.8, replied: r(12) },
    page: { visits: r(118), google: r(71), privateMsgs: r(6) },
    posts: { published: 4, offers: 1, events: 0 },
  };
}

export default function ReportScreen() {
  const toast = useToast();
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const oldest = new Date(now.getFullYear(), now.getMonth() - 17, 1);
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const [sharing, setSharing] = useState(false);
  const isThis = month.getTime() === thisMonth.getTime();
  const r = sample(month);
  const through = isThis ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2) : new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  const stat = (label: string, value: string, n?: number, before?: number) => (
    <div key={label} className="row" style={{ padding: '6px 0', gap: 8 }}>
      <span className="grow muted" style={{ fontSize: 14.5, fontWeight: 600 }}>{label}</span>
      {n != null && <ChangeBadge now={n} before={before} />}
      <span style={{ fontWeight: 800, fontSize: 16 }}>{value}</span>
    </div>
  );
  const card = (title: string, icon: string, rows: ReactNode[]) => (
    <Card pad="14px 16px 10px">
      <div className="row" style={{ gap: 8 }}>
        <Icon name={icon} fill={icon === 'star'} size={20} color="var(--violet)" />
        <span style={{ fontWeight: 800, fontSize: 16 }}>{title}</span>
      </div>
      <Gap h={6} />
      {rows}
    </Card>
  );

  return (
    <>
      <AppBar title="Monthly report" />
      <div className="page pushed">
        <Gap h={8} />
        <Card pad={4}>
          <div className="row">
            <button className="ibtn" title="Previous month" disabled={month <= oldest} onClick={() => shift(-1)}><Icon name="chevron_left" /></button>
            <div className="grow" style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{monthLabel(month)}</div>
              {isThis && <div className="muted" style={{ fontSize: 12.5 }}>So far this month</div>}
            </div>
            <button className="ibtn" title="Next month" disabled={month >= thisMonth} onClick={() => shift(1)}><Icon name="chevron_right" /></button>
          </div>
        </Card>
        <Gap h={16} />
        <GradientCard>
          <div style={{ color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>On Google</div>
          <Gap h={4} />
          <div className="row" style={{ alignItems: 'flex-end', gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{r.g.views.toLocaleString('en-IN')}</span>
            <span style={{ fontWeight: 700, fontSize: 15, paddingBottom: 4 }}>people saw your profile</span>
          </div>
          <Gap h={4} />
          <ChangeBadge now={r.g.views} before={r.pg.views} onDark />
          <Gap h={16} />
          <div className="row">
            {[['Calls', r.g.calls], ['Directions', r.g.directions], ['Website', r.g.website]].map(([l, n]) => (
              <div key={l} className="grow">
                <div style={{ fontSize: 20, fontWeight: 800 }}>{n}</div>
                <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13 }}>{l}</div>
              </div>
            ))}
          </div>
        </GradientCard>
        <Gap h={12} />
        <div className="wide-2" style={{ rowGap: 12 }}>
          <div className="col" style={{ gap: 12 }}>
            {card('Where they found you', 'travel_explore', [
              stat('Google Search', `${r.g.search}`, r.g.search, r.pg.search),
              stat('Google Maps', `${r.g.maps}`, r.g.maps, r.pg.maps),
              stat('Chats', `${r.g.chats}`),
            ])}
            {card('Reviews', 'star', [
              stat('New Google reviews', `${r.reviews.received}`),
              stat('Average rating this month', `${r.reviews.avg} ★`),
              stat('Replied', `${r.reviews.replied} of ${r.reviews.received}`),
              stat('Overall rating now', '4.7 ★ · 186'),
            ])}
            {card('Your RevYne review page', 'qr_code_2', [
              stat('Opened your review link', `${r.page.visits}`),
              stat('Went on to Google', `${r.page.google}`),
              stat('Private messages to you', `${r.page.privateMsgs}`),
            ])}
          </div>
          <div className="col" style={{ gap: 12 }}>
            {card('Posts', 'campaign', [stat('Published', `${r.posts.published}`), stat('Offers · Events', `${r.posts.offers} · ${r.posts.events}`)])}
            {!isThis && card('Top searches', 'search', keywords.map((k) => stat(k.keyword, k.label)))}
          </div>
        </div>
        <Gap h={8} />
        <div className="muted" style={{ fontSize: 12.5 }}>
          Google figures up to {through.getDate()} {MONTHS[through.getMonth()]}.{isThis ? ' Search terms appear once the month ends.' : ''}
        </div>
        <Gap h={16} />
        <GradientButton
          label="Share as PDF"
          icon="ios_share"
          busy={sharing}
          onClick={() => {
            setSharing(true);
            window.setTimeout(() => { setSharing(false); toast('Preview only — the app shares the report as a PDF.'); }, 700);
          }}
        />
      </div>
    </>
  );
}
