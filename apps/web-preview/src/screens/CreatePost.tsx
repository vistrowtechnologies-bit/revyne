// lib/features/google_content/create_post_screen.dart
import { useRef, useState } from 'react';
import { useBusiness, useStore } from '../store';
import { invalidate } from '../lib/query';
import * as api from '../lib/api';
import { whenLabel } from '../lib/format';
import { ConfirmDialog, Gap, GradientButton, Icon, SectionHeader, SelectChip, useToast } from '../ui';
import { AppBar } from './AppBar';

const HINT: Record<api.PostTypeApi, string> = {
  STANDARD: 'News, new work, or anything customers should know.',
  OFFER: 'A discount or deal, with dates. Only offer what you will honour.',
  EVENT: 'Something happening on set dates.',
};

function Counted({ value, max, rows, onChange, placeholder }: { value: string; max: number; rows?: number; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      {rows ? (
        <textarea className="input" rows={rows} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      <div className="counter">{value.length}/{max}</div>
    </div>
  );
}

const localInput = (d: Date) => `${api.isoDate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const pretty = (iso: string) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN') : 'Pick date');

export default function CreatePostScreen() {
  const s = useStore();
  const b = useBusiness();
  const toast = useToast();
  const [form, setForm] = useState<api.PostForm>({ type: 'STANDARD', summary: '', title: '', startDate: '', endDate: '', couponCode: '', terms: '', button: 'CALL', buttonUrl: '' });
  const set = (p: Partial<api.PostForm>) => setForm((f) => ({ ...f, ...p }));
  const [brief, setBrief] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; png: boolean; url: string } | null>(null);
  const [scheduleAt, setScheduleAt] = useState<Date | null>(null);
  const [picking, setPicking] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [posting, setPosting] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const t = form.type;
  const needsLink = api.POST_BUTTONS.find((x) => x.api === form.button)?.needsLink;
  const today = api.isoDate(new Date());

  const draft = async () => {
    if (!brief.trim()) return toast('Write a line about what you want to share.');
    setDrafting(true);
    try {
      set({ summary: await api.draftPost(t, brief, form.title.trim()) });
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setDrafting(false);
    }
  };

  const post = async () => {
    setConfirm(false);
    setPosting(true);
    try {
      const path = photo ? await api.uploadMedia(b.id, photo.blob, photo.png) : undefined;
      if (!scheduleAt) {
        await api.createPost(form, path);
        invalidate('posts', 'profile', 'activity');
        toast('Posted. Google checks posts first — usually a few minutes.');
      } else {
        await api.schedulePost(form, scheduleAt, path);
        invalidate('scheduled', 'activity');
        toast('Scheduled. RevYne will post it at the time you picked.');
      }
      s.back();
    } catch (e) {
      toast((e as Error).message || 'Could not post right now. Please try again.');
      setPosting(false);
    }
  };

  return (
    <>
      <AppBar title="New Google post" maxWidth={680} />
      <div className="page pushed" style={{ maxWidth: 680 }}>
        <Gap h={8} />
        <div className="row" style={{ gap: 8 }}>
          {api.POST_TYPES.map((x) => <SelectChip key={x.api} label={x.label} selected={t === x.api} onClick={() => set({ type: x.api })} />)}
        </div>
        <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>{HINT[t]}</div>
        {t !== 'STANDARD' && (
          <>
            <Gap h={16} />
            <Counted value={form.title} max={58} onChange={(v) => set({ title: v })} placeholder={t === 'OFFER' ? 'Offer title, e.g. Diwali offer' : 'Event title'} />
            <div className="row" style={{ gap: 8 }}>
              <label className="obtn" style={{ flex: 1, cursor: 'pointer', position: 'relative' }}>
                <Icon name="event" />From {pretty(form.startDate)}
                <input type="date" min={today} value={form.startDate} onChange={(e) => set({ startDate: e.target.value, endDate: form.endDate && form.endDate < e.target.value ? e.target.value : form.endDate })} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </label>
              <label className="obtn" style={{ flex: 1, cursor: 'pointer', position: 'relative' }}>
                <Icon name="event" />To {pretty(form.endDate)}
                <input type="date" min={form.startDate || today} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </label>
            </div>
          </>
        )}
        <Gap h={24} />
        <SectionHeader title="Write it with AI" />
        <Gap h={8} />
        <Counted value={brief} max={600} rows={2} onChange={setBrief} placeholder="In a line: e.g. new designs of safety grills are ready" />
        <button className="tbtn" onClick={draft} disabled={drafting} style={{ marginLeft: -12 }}>
          {drafting ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Icon name="auto_awesome" fill />}
          {form.summary ? 'Rewrite with AI' : 'Write with AI'}
        </button>
        <Gap h={8} />
        <SectionHeader title="Post text" />
        <Gap h={8} />
        <Counted value={form.summary} max={1500} rows={5} onChange={(v) => set({ summary: v })} placeholder="What customers will read. No phone numbers or links — use a button." />
        <Gap h={16} />
        <SectionHeader title="Photo" />
        <Gap h={8} />
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) setPhoto(await api.shrinkImage(f, 2048).catch(() => null));
          }}
        />
        {!photo ? (
          <button className="obtn" onClick={() => file.current?.click()}><Icon name="add_photo_alternate" />Add a photo (recommended)</button>
        ) : (
          <div style={{ position: 'relative' }}>
            <img src={photo.url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16, display: 'block' }} />
            <button onClick={() => setPhoto(null)} className="ibtn" title="Remove photo" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.54)', color: '#fff' }}><Icon name="close" /></button>
          </div>
        )}
        <Gap h={24} />
        {t === 'OFFER' ? (
          <>
            <SectionHeader title="Offer details (optional)" />
            <Gap h={8} />
            <Counted value={form.couponCode} max={58} onChange={(v) => set({ couponCode: v })} placeholder="Coupon code" />
            <Counted value={form.terms} max={500} rows={3} onChange={(v) => set({ terms: v })} placeholder="Terms and conditions" />
          </>
        ) : (
          <>
            <SectionHeader title="Button" />
            <Gap h={8} />
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {api.POST_BUTTONS.map((x) => <SelectChip key={x.api} label={x.label} selected={form.button === x.api} onClick={() => set({ button: x.api })} />)}
            </div>
            {needsLink && (
              <>
                <Gap h={8} />
                <div className="field">
                  <span className="lead"><Icon name="link" /></span>
                  <input className="input has-icon" inputMode="url" value={form.buttonUrl} onChange={(e) => set({ buttonUrl: e.target.value })} placeholder="Link, e.g. instagram.com/yourshop" />
                </div>
              </>
            )}
          </>
        )}
        <Gap h={24} />
        <SectionHeader title="When" />
        <Gap h={8} />
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <SelectChip label="Post now" selected={!scheduleAt} onClick={() => setScheduleAt(null)} />
          <SelectChip label={scheduleAt ? whenLabel(scheduleAt) : 'Schedule'} selected={!!scheduleAt} onClick={() => setPicking(true)} />
        </div>
        {picking && (
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <input
              type="datetime-local"
              className="input"
              style={{ maxWidth: 280 }}
              min={localInput(new Date(Date.now() + 10 * 60e3))}
              max={localInput(new Date(Date.now() + 90 * 864e5))}
              defaultValue={localInput(scheduleAt ?? new Date(Date.now() + 3600e3))}
              onChange={(e) => {
                if (!e.target.value) return;
                const at = new Date(e.target.value);
                if (at.getTime() < Date.now() + 10 * 60e3) return toast('Pick a time at least 10 minutes from now.');
                setScheduleAt(at);
              }}
            />
            <button className="tbtn" onClick={() => setPicking(false)}>Done</button>
          </div>
        )}
        <Gap h={24} />
        <GradientButton
          label={scheduleAt ? 'Schedule post' : 'Post on Google'}
          icon={scheduleAt ? 'schedule_send' : 'send'}
          busy={posting}
          onClick={() => (form.summary.trim() ? setConfirm(true) : toast('Write the post text, or use AI to draft it.'))}
        />
      </div>
      {confirm && (
        <ConfirmDialog
          title={scheduleAt ? 'Schedule this post?' : 'Post this on Google?'}
          body={
            scheduleAt
              ? `RevYne will post it on your Google profile on ${whenLabel(scheduleAt)} (within 5 minutes of that time). You can cancel it until then.`
              : 'It appears on your Google profile in Search and Maps. Google checks posts first — usually a few minutes.'
          }
          action={scheduleAt ? 'Schedule' : 'Post'}
          onCancel={() => setConfirm(false)}
          onConfirm={post}
        />
      )}
    </>
  );
}
