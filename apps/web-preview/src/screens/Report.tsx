// lib/features/reports/report_screen.dart — opens on last month; share as PDF.
import { useState, type ReactNode } from 'react';
import { useReport } from '../store';
import type { MonthlyReport } from '../lib/api';
import { MONTHS, monthLabel } from '../lib/format';
import { downloadReport } from '../lib/pdf';
import { Card, EmptyState, Gap, GradientButton, GradientCard, Icon, useToast } from '../ui';
import { LoadError, StatsSkeleton } from '../widgets';
import { AppBar } from './AppBar';
import { ChangeBadge } from '../widgets';

export default function ReportScreen() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const oldest = new Date(now.getFullYear(), now.getMonth() - 17, 1);
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const q = useReport(month);
  const isThis = month.getTime() === thisMonth.getTime();
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

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
        {q.data ? <Content r={q.data} /> : q.error ? <LoadError title="Couldn't load the report" error={q.error} onRetry={q.reload} /> : <StatsSkeleton />}
      </div>
    </>
  );
}

function Content({ r }: { r: MonthlyReport }) {
  const toast = useToast();
  const [sharing, setSharing] = useState(false);
  const g = r.google;
  const pg = r.previousGoogle;

  const stat = (label: string, value: string, n?: number, before?: number | null) => (
    <div key={label} className="row" style={{ padding: '6px 0', gap: 8 }}>
      <span className="grow muted" style={{ fontSize: 14.5, fontWeight: 600 }}>{label}</span>
      {n != null && before != null && <ChangeBadge now={n} before={before} />}
      <span style={{ fontWeight: 800, fontSize: 16 }}>{value}</span>
    </div>
  );
  const card = (title: string, icon: string, rows: ReactNode[]) => (
    <Card key={title} pad="14px 16px 10px">
      <div className="row" style={{ gap: 8 }}>
        <Icon name={icon} fill={icon === 'star'} size={20} color="var(--violet)" />
        <span style={{ fontWeight: 800, fontSize: 16 }}>{title}</span>
      </div>
      <Gap h={6} />
      {rows}
    </Card>
  );
  const nothing = !g && !r.reviews && !r.pageVisits && !r.postsPublished;

  const left = [
    g && card('Where they found you', 'travel_explore', [stat('Google Search', `${g.searchViews}`, g.searchViews, pg?.searchViews), stat('Google Maps', `${g.mapsViews}`, g.mapsViews, pg?.mapsViews), stat('Chats', `${g.chats}`)]),
    r.reviews &&
      card('Reviews', 'star', [
        stat('New Google reviews', `${r.reviews.received}`),
        r.reviews.averageRating != null && stat('Average rating this month', `${r.reviews.averageRating} ★`),
        stat('Replied', `${r.reviews.replied} of ${r.reviews.received}`),
        r.ratingAverage != null && stat('Overall rating now', `${Number(r.ratingAverage).toFixed(1)} ★ · ${r.ratingTotal}`),
      ]),
    r.pageVisits != null && card('Your RevYne review page', 'qr_code_2', [stat('Opened your review link', `${r.pageVisits}`), stat('Went on to Google', `${r.wentToGoogle}`), stat('Private messages to you', `${r.privateMessages}`)]),
  ].filter(Boolean);
  const right = [
    r.postsPublished != null && card('Posts', 'campaign', [stat('Published', `${r.postsPublished}`), r.offers + r.events > 0 && stat('Offers · Events', `${r.offers} · ${r.events}`)]),
    r.searches.length > 0 && card('Top searches', 'search', r.searches.map((k) => stat(k.keyword, k.label))),
  ].filter(Boolean);

  return (
    <>
      {g && (
        <>
          <GradientCard>
            <div style={{ color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>On Google</div>
            <Gap h={4} />
            <div className="row" style={{ alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{g.views.toLocaleString('en-IN')}</span>
              <span style={{ fontWeight: 700, fontSize: 15, paddingBottom: 4 }}>people saw your profile</span>
            </div>
            {pg && <><Gap h={4} /><ChangeBadge now={g.views} before={pg.views} onDark /></>}
            <Gap h={16} />
            <div className="row">
              {([['Calls', g.calls], ['Directions', g.directions], ['Website', g.websiteClicks]] as [string, number][]).map(([l, n]) => (
                <div key={l} className="grow">
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{n}</div>
                  <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13 }}>{l}</div>
                </div>
              ))}
            </div>
          </GradientCard>
          <Gap h={12} />
        </>
      )}
      <div className="wide-2" style={{ rowGap: 12 }}>
        <div className="col" style={{ gap: 12 }}>{left}</div>
        <div className="col" style={{ gap: 12 }}>{right}</div>
      </div>
      {nothing && <EmptyState icon="insert_chart" title="Nothing to report yet" body="Activity for this month will show here." />}
      <Gap h={8} />
      <div className="muted" style={{ fontSize: 12.5 }}>
        {r.statsThrough
          ? `Google figures up to ${r.statsThrough.getDate()} ${MONTHS[r.statsThrough.getMonth()]}.${r.complete ? '' : ' Search terms appear once the month ends.'}`
          : "Google stats for this month aren't available yet — they run 2–3 days behind."}
      </div>
      <Gap h={16} />
      <GradientButton
        label="Share as PDF"
        icon="ios_share"
        busy={sharing}
        onClick={async () => {
          setSharing(true);
          try {
            await downloadReport(r);
          } catch {
            toast('Could not create the PDF. Please try again.');
          } finally {
            setSharing(false);
          }
        }}
      />
    </>
  );
}
