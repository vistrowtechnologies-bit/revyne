// lib/features/insights/insights_screen.dart
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { insights, keywords, percentChange, shortDate } from '../data';
import { Card, Gap, GradientCard, Icon, SectionHeader, SelectChip, useToast } from '../ui';
import { AppBar } from './AppBar';
import RangeCalendar, { CLEARED, type Range } from './RangeCalendar';

export function ChangeBadge({ now, before, onDark }: { now: number; before?: number; onDark?: boolean }) {
  const pct = before == null ? null : percentChange(now, before);
  if (pct == null) return null;
  const up = pct >= 0;
  return <span style={{ color: onDark ? '#fff' : up ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: 12.5 }}>{up ? '▲' : '▼'} {Math.abs(pct)}%</span>;
}

const DAY = 24 * 3600e3;

export default function StatsScreen() {
  const s = useStore();
  const toast = useToast();
  const [days, setDays] = useState(28);
  const [custom, setCustom] = useState<Range | null>(null);
  const [picking, setPicking] = useState(false);

  const v = useMemo(() => (custom ? insights(0, custom.start, custom.end) : insights(days)), [days, custom]);
  const t = v.totals;
  const p = v.previous;
  const today = new Date();
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
  const first = new Date(last.getTime() - 538 * DAY);

  const tiles: [string, string, number, number][] = [
    ['call', 'Calls', t.calls, p.calls],
    ['directions', 'Directions', t.directions, p.directions],
    ['language', 'Website clicks', t.websiteClicks, p.websiteClicks],
    ['chat_bubble', 'Chats', t.chats, p.chats],
  ];
  const max = Math.max(...v.daily);

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
        </div>
        <Gap h={16} />
        <GradientCard>
          <div style={{ color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>{shortDate(v.start)} – {shortDate(v.end)}</div>
          <Gap h={6} />
          <div className="row" style={{ alignItems: 'flex-end', gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{t.views.toLocaleString('en-IN')}</span>
            <span style={{ fontWeight: 700, fontSize: 15, paddingBottom: 4 }}>people saw your profile</span>
          </div>
          <Gap h={4} />
          <ChangeBadge now={t.views} before={p.views} onDark />
          <Gap h={16} />
          <div className="row" style={{ alignItems: 'flex-end', height: 64 }}>
            {v.daily.map((x, i) => (
              <div key={i} style={{ flex: 1, padding: `0 ${v.daily.length > 40 ? 0.5 : 1.5}px` }}>
                <div style={{ height: 3 + 61 * (x / max), background: 'rgba(255,255,255,.85)', borderRadius: 3, transition: 'height .4s' }} />
              </div>
            ))}
          </div>
          <Gap h={16} />
          <div className="row">
            {[['Google Search', t.searchViews], ['Google Maps', t.mapsViews]].map(([l, n]) => (
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
        <Gap h={24} />
        <SectionHeader title="What people searched" />
        <Gap h={8} />
        <Card pad="6px 0">
          {keywords.map((k, i) => (
            <div key={k.keyword}>
              {i > 0 && <hr className="divider" style={{ margin: '0 16px' }} />}
              <div className="row" style={{ gap: 16, padding: '12px 16px' }}>
                <Icon name="search" size={20} color="var(--muted)" />
                <span className="grow" style={{ fontWeight: 700, fontSize: 15 }}>{k.keyword}</span>
                <span style={{ fontWeight: 800, color: 'var(--violet700)' }}>{k.label}</span>
              </div>
            </div>
          ))}
        </Card>
        <Gap h={8} />
        <div className="muted" style={{ fontSize: 12.5 }}>
          From Google. Numbers run 2–3 days behind; search terms cover the last 3 whole months, and small counts show as "&lt; N".
        </div>
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
