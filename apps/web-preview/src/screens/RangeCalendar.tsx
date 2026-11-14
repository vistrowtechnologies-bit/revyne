// lib/core/widgets/range_calendar.dart — presets, one month at a time,
// filled start/end circles joined by a soft band, Clear button.
import { useState } from 'react';
import { MONTHS, shortDate } from '../data';
import { Gap, GradientButton, Icon, SelectChip, Sheet } from '../ui';

export type Range = { start: Date; end: Date };
export const CLEARED: Range = { start: new Date(1970, 0, 1), end: new Date(1970, 0, 1) };

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && a.getTime() === b.getTime();

export default function RangeCalendar({ first, last, initial, title = 'Pick dates', onClose }: { first: Date; last: Date; initial?: Range | null; title?: string; onClose: (r: Range | null) => void }) {
  const f = day(first);
  const l = day(last);
  const [start, setStart] = useState<Date | null>(initial ? day(initial.start) : null);
  const [end, setEnd] = useState<Date | null>(initial ? day(initial.end) : null);
  const anchor = end ?? l;
  const [month, setMonth] = useState(new Date(anchor.getFullYear(), anchor.getMonth(), 1));

  const allowed = (d: Date) => d >= f && d <= l;
  const clamp = (d: Date) => (d < f ? f : d > l ? l : d);
  const tap = (d: Date) => {
    if (!start || end) {
      setStart(d);
      setEnd(null);
    } else if (d < start) setStart(d);
    else setEnd(d);
  };

  const presets: [string, Date, Date][] = (
    [
      ['This month', new Date(l.getFullYear(), l.getMonth(), 1), l],
      ['Last month', new Date(l.getFullYear(), l.getMonth() - 1, 1), new Date(l.getFullYear(), l.getMonth(), 0)],
      ['Last 3 months', new Date(l.getFullYear(), l.getMonth() - 3, 1), new Date(l.getFullYear(), l.getMonth(), 0)],
    ] as [string, Date, Date][]
  )
    .filter(([, s, e]) => !(e < f) && !(s > l))
    .map(([n, s, e]) => [n, clamp(s), clamp(e)]);

  const canPrev = month > new Date(f.getFullYear(), f.getMonth(), 1);
  const canNext = month < new Date(l.getFullYear(), l.getMonth(), 1);
  const effEnd = end ?? start;
  const days = start && effEnd ? Math.round((effEnd.getTime() - start.getTime()) / 864e5) + 1 : 0;
  const summary = !start ? 'Tap a start date' : !end ? `${shortDate(start)} – tap an end date` : same(start, end) ? shortDate(start) : `${shortDate(start)} – ${shortDate(end)}`;

  const lead = month.getDay(); // Sunday-first weeks
  const inMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = day(new Date());

  return (
    <Sheet onClose={() => onClose(null)}>
      <div className="row" style={{ minHeight: 36 }}>
        <span className="grow muted" style={{ fontWeight: 700, fontSize: 13.5 }}>{title}</span>
        {(start || initial) && (
          <button className="tbtn" style={{ padding: '6px 10px' }} onClick={() => onClose(CLEARED)}>
            <Icon name="close" />
            Clear
          </button>
        )}
      </div>
      <div className="row" style={{ alignItems: 'flex-end', marginTop: 2 }}>
        <span className="grow" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{summary}</span>
        {end && days > 1 && <span style={{ color: 'var(--violet)', fontWeight: 800, paddingBottom: 3 }}>{days} days</span>}
      </div>
      <Gap h={16} />
      <div className="row no-scrollbar" style={{ gap: 8, overflowX: 'auto' }}>
        {presets.map(([n, s, e]) => (
          <SelectChip key={n} label={n} selected={same(start, s) && same(end, e)} onClick={() => { setStart(s); setEnd(e); setMonth(new Date(e.getFullYear(), e.getMonth(), 1)); }} />
        ))}
      </div>
      <Gap h={16} />
      <div className="row">
        <button className="ibtn" title="Previous month" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="chevron_left" /></button>
        <span className="grow" style={{ textAlign: 'center', fontWeight: 800, fontSize: 16 }}>{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
        <button className="ibtn" title="Next month" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="chevron_right" /></button>
      </div>
      <Gap h={4} />
      <div className="cal-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => <div key={i} className="cal-head">{w}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={`x${i}`} className="cal-cell" />)}
        {Array.from({ length: inMonth }, (_, i) => {
          const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
          const ok = allowed(d);
          const isS = same(d, start);
          const isE = same(d, effEnd);
          const endpoint = isS || isE;
          const inside = !!start && !!end && d > start && d < end;
          const band = !!start && !!end && !same(start, end) && (inside || endpoint);
          return (
            <div key={i} className="cal-cell">
              {band && <div className={`cal-band${isS ? ' s' : ''}${same(d, end) ? ' e' : ''}`} />}
              <button
                className={`cal-day${endpoint ? ' end' : ''}${!ok ? ' off' : ''}${inside ? ' inside' : ''}${!endpoint && same(d, today) ? ' today' : ''}`}
                disabled={!ok}
                onClick={() => tap(d)}
              >
                {i + 1}
              </button>
            </div>
          );
        })}
      </div>
      <Gap h={16} />
      <div className="row" style={{ gap: 12 }}>
        <div style={{ flex: 1 }}><button className="obtn" onClick={() => onClose(null)}>Cancel</button></div>
        <div style={{ flex: 2 }}>
          <GradientButton label="Show stats" onClick={start ? () => onClose({ start, end: effEnd! }) : undefined} />
        </div>
      </div>
    </Sheet>
  );
}
