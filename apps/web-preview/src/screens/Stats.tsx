// lib/features/insights/insights_screen.dart
import { useState } from 'react';
import { useInsights, useStore } from '../store';
import { invalidate } from '../lib/query';
import { type Insights } from '../lib/api';
import { ChangeBadge } from '../widgets';
import { shortDate } from '../lib/format';
import { Card, Gap, GradientCard, Icon, SectionHeader, SelectChip, useToast } from '../ui';
import { Loading, LoadError } from '../widgets';
import { AppBar } from './AppBar';
import RangeCalendar, { CLEARED, type Range } from './RangeCalendar';
import CountUp from '../components/reactbits/CountUp';
import { HeroBars, TrendArea, type Point } from '../charts';


const DAY = 864e5;

export default function StatsScreen() {
  const s = useStore();
  const toast = useToast();
  const [days, setDays] = useState(28);
  const [custom, setCustom] = useState<Range | null>(null);
  const [picking, setPicking] = useState(false);
  const q = useInsights(custom ? { days: 0, start: custom.start, end: custom.end } : { days });

  // Google's window: ~18 months back, ending 2 days ago.
  const today = new Date();
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
  const first = new Date(last.getTime() - 538 * DAY);

  return (
    <>
      <AppBar title="Google stats" action={<button className="tbtn" onClick={() => s.go('report')}><Icon name="description" size={20} />Reports</button>} />
      <div className="page pushed">
        <div className="row" style={{ gap: 8, paddingTop: 8 }}>
          {[7, 28, 90].map((d) => (
            <SelectChip key={d} label={`${d} days`} selected={!custom && days === d} onClick={() => { setCustom(null); setDays(d); }} />
          ))}
          <button
            title="Pick dates"
            onClick={() => setPicking(true)}
            style={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', background: custom ? 'var(--violet)' : '#fff', border: `1px solid ${custom ? 'var(--violet)' : 'var(--line)'}`, color: custom ? '#fff' : 'var(--violet)' }}
          >
            <Icon name="calendar_month" fill size={22} />
          </button>
          <div className="grow" />
          <button className="ibtn" title="Refresh" onClick={() => invalidate('insights')}><Icon name="refresh" color="var(--muted)" /></button>
        </div>
        <Gap h={16} />
        {q.data ? <Content v={q.data} /> : q.error ? <LoadError title="Couldn't load stats" error={q.error} onRetry={q.reload} /> : <Loading />}
      </div>
      {picking && (
        <RangeCalendar
          first={first}
          last={last}
          initial={custom}
          title="Google stats for"
          onClose={(r) => {
            setPicking(false);
            if (!r) return;
            if (r === CLEARED) return setCustom(null);
            if ((r.end.getTime() - r.start.getTime()) / DAY > 365) return toast('Pick up to one year at a time.');
            setCustom(r);
          }}
        />
      )}
    </>
  );
}

function Content({ v }: { v: Insights }) {
  const t = v.totals;
  const p = v.previous;
  const tiles: [string, string, number, number][] = [
    ['call', 'Calls', t.calls, p.calls],
    ['directions', 'Directions', t.directions, p.directions],
    ['language', 'Website clicks', t.websiteClicks, p.websiteClicks],
    ['chat_bubble', 'Chats', t.chats, p.chats],
  ];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const views: Point[] = v.daily.map((d) => ({
    label: shortDate(d.date),
    title: `${WD[d.date.getDay()]} ${shortDate(d.date)}`,
    value: d.views,
    lines: [`${d.views} profile view${d.views === 1 ? '' : 's'}`, `${d.actions} action${d.actions === 1 ? '' : 's'}`],
  }));
  const actions: Point[] = v.daily.map((d) => ({ label: shortDate(d.date), title: `${WD[d.date.getDay()]} ${shortDate(d.date)}`, value: d.actions, lines: [`${d.actions} action${d.actions === 1 ? '' : 's'} on Google`] }));
  return (
    <>
      <GradientCard>
        <div style={{ color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>{shortDate(v.start)} – {shortDate(v.end)}</div>
        <Gap h={6} />
        <div className="row" style={{ alignItems: 'flex-end', gap: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}><CountUp key={`${v.start.getTime()}-${v.end.getTime()}`} to={t.views} separator="," duration={1} trigger="load" /></span>
          <span style={{ fontWeight: 700, fontSize: 15, paddingBottom: 4 }}>people saw your profile</span>
        </div>
        <Gap h={4} />
        <ChangeBadge now={t.views} before={p.views} onDark />
        <Gap h={16} />
        <HeroBars data={views} height={120} highlightLast={false} ariaLabel={`Profile views per day, ${shortDate(v.start)} to ${shortDate(v.end)}`} />
        <Gap h={16} />
        <div className="row">
          {([['Google Search', t.searchViews], ['Google Maps', t.mapsViews]] as [string, number][]).map(([l, n]) => (
            <div key={l} className="grow">
              <div style={{ fontSize: 20, fontWeight: 800 }}>{n.toLocaleString('en-IN')}</div>
              <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13 }}>{l}</div>
            </div>
          ))}
        </div>
      </GradientCard>
      <Gap h={24} />
      <SectionHeader title={`What they did · ${t.actions}`} />
      <Gap h={8} />
      <div className="stat-grid four">
        {tiles.map(([icon, label, n, b]) => (
          <Card key={label} pad={14} style={{ minHeight: 104, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="row"><Icon name={icon} size={20} color="var(--violet)" /><div className="grow" /><ChangeBadge now={n} before={b} /></div>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{n}</div>
            <div className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
          </Card>
        ))}
      </div>
      <Gap h={12} />
      <Card pad="16px 12px 8px 12px">
        <div className="row" style={{ padding: '0 6px 6px' }}>
          <span className="grow" style={{ fontWeight: 800, fontSize: 15 }}>Actions per day</span>
          <span className="muted" style={{ fontSize: 13 }}>Calls, directions, website & chats</span>
        </div>
        <TrendArea data={actions} ariaLabel="Actions per day on Google" />
      </Card>
      <Gap h={24} />
      <SectionHeader title="What people searched" />
      <Gap h={8} />
      <Card pad="6px 0">
        {v.keywords.length === 0 ? (
          <div className="muted" style={{ padding: 16 }}>Not enough searches yet. Google shows search terms once enough people find you.</div>
        ) : (
          v.keywords.map((k, i) => (
            <div key={k.keyword + i}>
              {i > 0 && <hr className="divider" style={{ margin: '0 16px' }} />}
              <div className="row" style={{ gap: 16, padding: '12px 16px' }}>
                <Icon name="search" size={20} color="var(--muted)" />
                <span className="grow" style={{ fontWeight: 700, fontSize: 15 }}>{k.keyword}</span>
                <span style={{ fontWeight: 800, color: 'var(--violet700)' }}>{k.label}</span>
              </div>
            </div>
          ))
        )}
      </Card>
      <Gap h={8} />
      <div className="muted" style={{ fontSize: 12.5 }}>From Google. Numbers run 2–3 days behind; search terms cover the last 3 whole months, and small counts show as "&lt; N".</div>
    </>
  );
}
