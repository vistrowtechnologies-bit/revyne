// lib/core/widgets/range_calendar.dart — presets, one month at a time,
// filled start/end circles joined by a soft band, Clear button.
// The calendar grid is React Aria's RangeCalendar: full keyboard support
// (arrows, Page Up/Down, Enter), screen-reader labels, and min/max limits.
import { useState } from 'react';
import {
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  I18nProvider,
  RangeCalendar as AriaRangeCalendar,
} from 'react-aria-components';
import { CalendarDate, getLocalTimeZone, today as todayIn } from '@internationalized/date';
import { shortDate } from '../lib/format';
import { Gap, GradientButton, Icon, SelectChip, Sheet } from '../ui';

export type Range = { start: Date; end: Date };
export const CLEARED: Range = { start: new Date(1970, 0, 1), end: new Date(1970, 0, 1) };

type CalRange = { start: CalendarDate; end: CalendarDate };

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toCal = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
const toDate = (c: CalendarDate) => new Date(c.year, c.month - 1, c.day);
const sameCal = (a?: CalendarDate | null, b?: CalendarDate | null) => !!a && !!b && a.compare(b) === 0;

export default function RangeCalendar({ first, last, initial, title = 'Pick dates', onClose }: { first: Date; last: Date; initial?: Range | null; title?: string; onClose: (r: Range | null) => void }) {
  const f = toCal(day(first));
  const l = toCal(day(last));
  const [value, setValue] = useState<CalRange | null>(initial ? { start: toCal(day(initial.start)), end: toCal(day(initial.end)) } : null);
  const [focused, setFocused] = useState<CalendarDate>(value?.end ?? l);
  const today = todayIn(getLocalTimeZone());

  const clamp = (c: CalendarDate) => (c.compare(f) < 0 ? f : c.compare(l) > 0 ? l : c);
  const thisStart = l.set({ day: 1 });
  const lastStart = thisStart.subtract({ months: 1 });
  const lastEnd = thisStart.subtract({ days: 1 });
  const presets: [string, CalendarDate, CalendarDate][] = (
    [
      ['This month', thisStart, l],
      ['Last month', lastStart, lastEnd],
      ['Last 3 months', thisStart.subtract({ months: 3 }), lastEnd],
    ] as [string, CalendarDate, CalendarDate][]
  )
    .filter(([, s, e]) => e.compare(f) >= 0 && s.compare(l) <= 0)
    .map(([n, s, e]) => [n, clamp(s), clamp(e)]);

  const days = value ? value.end.compare(value.start) + 1 : 0;
  const summary = !value
    ? 'Tap a start date, then an end date'
    : sameCal(value.start, value.end)
      ? shortDate(toDate(value.start))
      : `${shortDate(toDate(value.start))} – ${shortDate(toDate(value.end))}`;

  return (
    <Sheet label={title} onClose={() => onClose(null)}>
      <div className="row" style={{ minHeight: 36 }}>
        <span className="grow muted" style={{ fontWeight: 700, fontSize: 13.5 }}>{title}</span>
        {(value || initial) && (
          <button className="tbtn" style={{ padding: '6px 10px' }} onClick={() => onClose(CLEARED)}>
            <Icon name="close" />
            Clear
          </button>
        )}
      </div>
      <div className="row" style={{ alignItems: 'flex-end', marginTop: 2 }}>
        <span className="grow" style={{ fontSize: value ? 22 : 19, fontWeight: 800, lineHeight: 1.2 }}>{summary}</span>
        {value && days > 1 && <span style={{ color: 'var(--violet)', fontWeight: 800, paddingBottom: 3 }}>{days} days</span>}
      </div>
      <Gap h={16} />
      <div className="row no-scrollbar" style={{ gap: 8, overflowX: 'auto' }}>
        {presets.map(([n, s, e]) => (
          <SelectChip
            key={n}
            label={n}
            selected={!!value && sameCal(value.start, s) && sameCal(value.end, e)}
            onClick={() => {
              setValue({ start: s, end: e });
              setFocused(e);
            }}
          />
        ))}
      </div>
      <Gap h={16} />
      <I18nProvider locale="en-IN">
        <AriaRangeCalendar
          aria-label={title}
          className="rac-cal"
          value={value}
          onChange={(v) => setValue(v as CalRange)}
          minValue={f}
          maxValue={l}
          focusedValue={focused}
          onFocusChange={(d) => setFocused(d as CalendarDate)}
          firstDayOfWeek="sun"
        >
          <header className="row">
            <Button slot="previous" className="ibtn" aria-label="Previous month"><Icon name="chevron_left" /></Button>
            <Heading className="grow cal-title" />
            <Button slot="next" className="ibtn" aria-label="Next month"><Icon name="chevron_right" /></Button>
          </header>
          <Gap h={4} />
          <CalendarGrid className="cal-table" weekdayStyle="narrow">
            <CalendarGridHeader>{(d) => <CalendarHeaderCell className="cal-head">{d}</CalendarHeaderCell>}</CalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell date={date} className="cal-cell">
                  {({ formattedDate, isSelected, isSelectionStart, isSelectionEnd, isOutsideMonth, isDisabled }) => {
                    if (isOutsideMonth) return <span className="cal-day" aria-hidden />; // hidden by CSS
                    const endpoint = isSelectionStart || isSelectionEnd;
                    const single = isSelectionStart && isSelectionEnd;
                    return (
                      <>
                        {isSelected && !single && <span className={`cal-band${isSelectionStart ? ' s' : ''}${isSelectionEnd ? ' e' : ''}`} />}
                        <span
                          className={`cal-day${endpoint ? ' end' : ''}${isDisabled ? ' off' : ''}${isSelected && !endpoint ? ' inside' : ''}${!endpoint && sameCal(date as CalendarDate, today) ? ' today' : ''}`}
                        >
                          {formattedDate}
                        </span>
                      </>
                    );
                  }}
                </CalendarCell>
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </AriaRangeCalendar>
      </I18nProvider>
      <Gap h={16} />
      <div className="row" style={{ gap: 12 }}>
        <div style={{ flex: 1 }}><button className="obtn" onClick={() => onClose(null)}>Cancel</button></div>
        <div style={{ flex: 2 }}>
          <GradientButton label="Show stats" onClick={value ? () => onClose({ start: toDate(value.start), end: toDate(value.end) }) : undefined} />
        </div>
      </div>
    </Sheet>
  );
}
