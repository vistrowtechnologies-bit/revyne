// lib/features/google_profile/profile_editors.dart — each edit is confirmed, then sent to Google.
import { useState, type ReactNode } from 'react';
import { invalidate } from '../lib/query';
import * as api from '../lib/api';
import { timeLabel } from '../lib/format';
import { Card, ConfirmDialog, Gap, GradientButton, Icon, SelectChip, Sheet, useToast } from '../ui';

const WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const WEEK_LABEL: Record<string, string> = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday' };

export type EditorKind = 'description' | 'hours' | 'specialHours' | 'phone' | 'website';

function Frame({ title, subtitle, field, value, canSave = true, onClose, children }: { title: string; subtitle?: string; field: string; value: () => unknown; canSave?: boolean; onClose: () => void; children: ReactNode }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const save = async () => {
    setConfirm(false);
    setSaving(true);
    try {
      await api.updateProfile(field, value());
      invalidate('profile', 'activity');
      toast('Sent to Google. It can take a few minutes to show.');
      onClose();
    } catch (e) {
      toast((e as Error).message || 'Could not update right now. Please try again.');
      setSaving(false);
    }
  };
  return (
    <Sheet onClose={() => !saving && onClose()}>
      <h2 className="h-small">{title}</h2>
      {subtitle && <div className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>{subtitle}</div>}
      <Gap h={16} />
      {children}
      <Gap h={16} />
      <GradientButton label="Update on Google" icon="cloud_upload" busy={saving} disabled={!canSave} onClick={() => setConfirm(true)} />
      {confirm && (
        <ConfirmDialog
          title="Update your Google profile?"
          body="Customers will see this on Google Search and Maps. Google may take a few minutes, or review the change first."
          action="Update"
          onCancel={() => setConfirm(false)}
          onConfirm={save}
        />
      )}
    </Sheet>
  );
}

export function ProfileEditor({ kind, profile, onClose }: { kind: EditorKind; profile: api.GbpProfile; onClose: () => void }) {
  if (kind === 'description') return <DescriptionEditor current={profile.description} onClose={onClose} />;
  if (kind === 'hours') return <HoursEditor current={profile.hours} split={profile.splitHours} onClose={onClose} />;
  if (kind === 'specialHours') return <HolidayEditor current={profile.specialHours} onClose={onClose} />;
  return <TextEditor field={kind} current={kind === 'phone' ? profile.phone : profile.website} onClose={onClose} />;
}

function DescriptionEditor({ current, onClose }: { current: string; onClose: () => void }) {
  const toast = useToast();
  const [text, setText] = useState(current);
  const [drafting, setDrafting] = useState(false);
  return (
    <Frame title="Business description" subtitle="What you do and who you serve. No links or offers — Google removes those." field="description" value={() => text.trim()} canSave={text.trim() !== current.trim()} onClose={onClose}>
      <div style={{ textAlign: 'right' }}>
        <button
          className="tbtn"
          disabled={drafting}
          onClick={async () => {
            setDrafting(true);
            try {
              setText(await api.draftDescription());
            } catch (e) {
              toast((e as Error).message);
            } finally {
              setDrafting(false);
            }
          }}
        >
          {drafting ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Icon name="auto_awesome" fill />}
          {text ? 'Improve with AI' : 'Write with AI'}
        </button>
      </div>
      <textarea className="input" rows={6} maxLength={750} value={text} onChange={(e) => setText(e.target.value)} placeholder="We make…" />
      <div className="counter">{text.length}/750</div>
    </Frame>
  );
}

function TextEditor({ field, current, onClose }: { field: 'phone' | 'website'; current: string; onClose: () => void }) {
  const phone = field === 'phone';
  const [text, setText] = useState(phone ? current.replace(/^\+91\s*/, '') : current);
  return (
    <Frame
      title={phone ? 'Phone number' : 'Website'}
      subtitle={phone ? 'The number customers call from Google.' : 'Your website, or a social media page like Instagram or Facebook.'}
      field={field}
      value={() => text.trim()}
      canSave={!phone || !!text.trim()}
      onClose={onClose}
    >
      <div className="field">
        <span className="lead"><Icon name={phone ? 'call' : 'language'} />{phone && <b>+91</b>}</span>
        <input autoFocus className="input" style={{ paddingLeft: phone ? 92 : 48 }} inputMode={phone ? 'tel' : 'url'} value={text} onChange={(e) => setText(e.target.value)} placeholder={phone ? '98765 43210' : 'yourshop.in'} />
      </div>
    </Frame>
  );
}

function HoursEditor({ current, split, onClose }: { current: api.DayHours[]; split: boolean; onClose: () => void }) {
  const [days, setDays] = useState<Record<string, api.DayHours | null>>(() => Object.fromEntries(WEEK.map((d) => [d, current.find((h) => h.day === d) ?? null])));
  const set = (d: string, v: api.DayHours | null) => setDays((x) => ({ ...x, [d]: v }));
  const copyMonday = () => {
    const mon = days.MONDAY;
    setDays((x) => {
      const n = { ...x };
      for (const d of WEEK.slice(1)) if (d !== 'SUNDAY' || x.SUNDAY) n[d] = mon ? { day: d, open: mon.open, close: mon.close } : null;
      return n;
    });
  };
  return (
    <Frame
      title="Opening hours"
      subtitle={split ? 'Your Google hours have breaks in some days. Saving here sets one opening time per day.' : 'Turn a day off to show it as closed.'}
      field="hours"
      value={() => WEEK.filter((d) => days[d]).map((d) => days[d])}
      onClose={onClose}
    >
      {WEEK.map((d) => {
        const h = days[d];
        return (
          <div key={d} className="row" style={{ gap: 8, minHeight: 46 }}>
            <span style={{ width: 96, fontWeight: 700, fontSize: 15 }}>{WEEK_LABEL[d]}</span>
            <button className={`switch${h ? ' on' : ''}`} aria-label={`${WEEK_LABEL[d]} open`} onClick={() => set(d, h ? null : { day: d, open: '09:00', close: '18:00' })} />
            {!h ? (
              <span className="muted" style={{ fontWeight: 600, marginLeft: 4 }}>Closed</span>
            ) : (
              <>
                <input type="time" className="time-input" value={h.open === '24:00' ? '00:00' : h.open} onChange={(e) => set(d, { ...h, open: e.target.value })} />
                <span>–</span>
                <input type="time" className="time-input" value={h.close === '24:00' ? '00:00' : h.close} onChange={(e) => set(d, { ...h, close: e.target.value })} />
              </>
            )}
          </div>
        );
      })}
      <button className="tbtn" style={{ marginLeft: -12 }} onClick={copyMonday}><Icon name="content_copy" />Copy Monday to other open days</button>
    </Frame>
  );
}

function HolidayEditor({ current, onClose }: { current: api.SpecialDay[]; onClose: () => void }) {
  const [days, setDays] = useState<api.SpecialDay[]>(() => [...current].sort((a, b) => a.date.localeCompare(b.date)));
  const [adding, setAdding] = useState('');
  const today = api.isoDate(new Date());
  const max = api.isoDate(new Date(Date.now() + 365 * 864e5));
  const pretty = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  const upd = (i: number, v: api.SpecialDay) => setDays((x) => x.map((y, j) => (j === i ? v : y)));
  return (
    <Frame title="Holiday hours" subtitle="Festivals and holidays when you close or keep different hours. Google shows these instead of your usual hours." field="specialHours" value={() => days} onClose={onClose}>
      {days.length === 0 && <div className="muted" style={{ marginBottom: 8 }}>No holiday hours set.</div>}
      <div className="col" style={{ gap: 8 }}>
        {days.map((d, i) => (
          <Card key={d.date} pad="10px 4px 12px 14px">
            <div className="row">
              <span className="grow" style={{ fontWeight: 800, fontSize: 15 }}>{pretty(d.date)}</span>
              <button className="ibtn" title="Remove" onClick={() => setDays((x) => x.filter((_, j) => j !== i))}><Icon name="delete" color="var(--muted)" /></button>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <SelectChip label="Closed" selected={d.closed} onClick={() => upd(i, { date: d.date, closed: true })} />
              <SelectChip label="Open" selected={!d.closed} onClick={() => upd(i, { date: d.date, closed: false, open: '10:00', close: '14:00' })} />
            </div>
            {!d.closed && (
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <input type="time" className="time-input" value={d.open} onChange={(e) => upd(i, { ...d, open: e.target.value })} />
                <span>–</span>
                <input type="time" className="time-input" value={d.close} onChange={(e) => upd(i, { ...d, close: e.target.value })} />
                <span className="muted" style={{ fontSize: 13 }}>{timeLabel(d.open ?? '10:00')} – {timeLabel(d.close ?? '14:00')}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Gap h={8} />
      <label className="obtn" style={{ position: 'relative', cursor: 'pointer' }}>
        <Icon name="add" />Add a date
        <input
          type="date"
          min={today}
          max={max}
          value={adding}
          onChange={(e) => {
            const v = e.target.value;
            setAdding('');
            if (v && !days.some((d) => d.date === v)) setDays((x) => [...x, { date: v, closed: true }].sort((a, b) => a.date.localeCompare(b.date)));
          }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        />
      </label>
    </Frame>
  );
}
