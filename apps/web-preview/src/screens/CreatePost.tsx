// lib/features/google_content/create_post_screen.dart
import { useRef, useState } from 'react';
import { useStore } from '../store';
import { whenLabel } from '../data';
import { ConfirmDialog, Gap, GradientButton, Icon, SectionHeader, SelectChip, useToast } from '../ui';
import { AppBar } from './AppBar';

type PostType = 'Update' | 'Offer' | 'Event';
const BUTTONS = [
  { label: 'No button', link: false },
  { label: 'Call now', link: false },
  { label: 'Learn more', link: true },
  { label: 'Order online', link: true },
  { label: 'Book', link: true },
  { label: 'Shop', link: true },
];

const HINT: Record<PostType, string> = {
  Update: 'News, new work, or anything customers should know.',
  Offer: 'A discount or deal, with dates. Only offer what you will honour.',
  Event: 'Something happening on set dates.',
};

function Counted({ value, max, ...rest }: { value: string; max: number; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  const Tag = rest.rows ? 'textarea' : 'input';
  return (
    <div>
      <Tag className="input" value={value} maxLength={max} rows={rest.rows} placeholder={rest.placeholder} onChange={(e) => rest.onChange(e.target.value)} />
      <div className="counter">{value.length}/{max}</div>
    </div>
  );
}

export default function CreatePostScreen() {
  const s = useStore();
  const toast = useToast();
  const [type, setType] = useState<PostType>('Update');
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [text, setText] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [button, setButton] = useState('No button');
  const [link, setLink] = useState('');
  const [coupon, setCoupon] = useState('');
  const [terms, setTerms] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState<Date | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [confirm, setConfirm] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const draft = () => {
    if (!brief.trim()) return toast('Write a line about what you want to share.');
    setDrafting(true);
    window.setTimeout(() => {
      setText(
        type === 'Offer'
          ? `This festive season, treat your family to Sharma Sweets! ${brief.trim().replace(/\.$/, '')}. Fresh mithai made every morning in Pune — visit us on FC Road.`
          : `${brief.trim().replace(/\.$/, '')}! Made fresh this morning at Sharma Sweets, Pune. Drop by and taste the difference — we're open 8 am to 10 pm every day.`,
      );
      setDrafting(false);
    }, 900);
  };

  const finish = () => {
    setConfirm(false);
    if (scheduleAt) {
      s.setScheduled([{ id: `s${Date.now()}`, type, at: scheduleAt, title: title || undefined, summary: text }, ...s.scheduled]);
      toast('Scheduled. RevYne will post it at the time you picked.');
    } else {
      s.setPosts([{ id: `p${Date.now()}`, type, state: 'PENDING', title: title || undefined, summary: text, createdAt: new Date() }, ...s.posts]);
      toast('Posted. Google checks posts first — usually a few minutes.');
    }
    s.back();
  };

  const needsLink = BUTTONS.find((b) => b.label === button)?.link;

  return (
    <>
      <AppBar title="New Google post" maxWidth={680} />
      <div className="page pushed" style={{ maxWidth: 680 }}>
        <Gap h={8} />
        <div className="row" style={{ gap: 8 }}>
          {(['Update', 'Offer', 'Event'] as PostType[]).map((t) => <SelectChip key={t} label={t} selected={type === t} onClick={() => setType(t)} />)}
        </div>
        <div className="muted" style={{ fontSize: 14, marginTop: 6 }}>{HINT[type]}</div>
        {type !== 'Update' && (
          <>
            <Gap h={16} />
            <Counted value={title} max={58} onChange={setTitle} placeholder={type === 'Offer' ? 'Offer title, e.g. Diwali offer' : 'Event title'} />
            <div className="row" style={{ gap: 8 }}>
              <label className="obtn" style={{ flex: 1, cursor: 'pointer', position: 'relative' }}>
                <Icon name="event" />From {from ? new Date(from).toLocaleDateString('en-IN') : 'Pick date'}
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </label>
              <label className="obtn" style={{ flex: 1, cursor: 'pointer', position: 'relative' }}>
                <Icon name="event" />To {to ? new Date(to).toLocaleDateString('en-IN') : 'Pick date'}
                <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </label>
            </div>
          </>
        )}
        <Gap h={24} />
        <SectionHeader title="Write it with AI" />
        <Gap h={8} />
        <Counted value={brief} max={600} rows={2} onChange={setBrief} placeholder="In a line: e.g. fresh kesar peda is ready today" />
        <button className="tbtn" onClick={draft} disabled={drafting} style={{ marginLeft: -12 }}>
          {drafting ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Icon name="auto_awesome" fill />}
          {text ? 'Rewrite with AI' : 'Write with AI'}
        </button>
        <Gap h={8} />
        <SectionHeader title="Post text" />
        <Gap h={8} />
        <Counted value={text} max={1500} rows={5} onChange={setText} placeholder="What customers will read. No phone numbers or links — use a button." />
        <Gap h={16} />
        <SectionHeader title="Photo" />
        <Gap h={8} />
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPhoto(URL.createObjectURL(f));
          }}
        />
        {!photo ? (
          <button className="obtn" onClick={() => file.current?.click()}><Icon name="add_photo_alternate" />Add a photo (recommended)</button>
        ) : (
          <div style={{ position: 'relative' }}>
            <img src={photo} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16, display: 'block' }} />
            <button onClick={() => setPhoto(null)} className="ibtn" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.54)', color: '#fff' }}><Icon name="close" /></button>
          </div>
        )}
        <Gap h={24} />
        {type === 'Offer' ? (
          <>
            <SectionHeader title="Offer details (optional)" />
            <Gap h={8} />
            <Counted value={coupon} max={58} onChange={setCoupon} placeholder="Coupon code" />
            <Counted value={terms} max={500} rows={3} onChange={setTerms} placeholder="Terms and conditions" />
          </>
        ) : (
          <>
            <SectionHeader title="Button" />
            <Gap h={8} />
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {BUTTONS.map((b) => <SelectChip key={b.label} label={b.label} selected={button === b.label} onClick={() => setButton(b.label)} />)}
            </div>
            {needsLink && (
              <>
                <Gap h={8} />
                <div className="field">
                  <span className="lead"><Icon name="link" /></span>
                  <input className="input has-icon" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link, e.g. instagram.com/yourshop" />
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
          <SelectChip
            label={scheduleAt ? whenLabel(scheduleAt) : 'Schedule'}
            selected={!!scheduleAt}
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              d.setHours(10, 0, 0, 0);
              setScheduleAt(d);
            }}
          />
        </div>
        <Gap h={24} />
        <GradientButton
          label={scheduleAt ? 'Schedule post' : 'Post on Google'}
          icon={scheduleAt ? 'schedule_send' : 'send'}
          onClick={() => (text.trim() ? setConfirm(true) : toast('Write the post text, or use AI to draft it.'))}
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
          onConfirm={finish}
        />
      )}
    </>
  );
}
