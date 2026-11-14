// lib/features/reviews/reviews_screen.dart + google_reviews/*
import { useState } from 'react';
import { useStore } from '../store';
import { aiDraft, googleTotals, timeAgo, visits, type GoogleReview } from '../data';
import { Card, ConfirmDialog, EmptyState, Gap, GradientButton, GradientCard, Icon, InitialsAvatar, SectionHeader, SelectChip, Sheet, Stars, StatusPill, useToast } from '../ui';

type Tab = 'google' | 'private' | 'visits';

export default function ReviewsScreen() {
  const s = useStore();
  const [picked, setPicked] = useState<Tab>(() => (s.query.get('tab') as Tab) || 'google');
  const unread = s.feedback.filter((f) => f.unread).length;
  const waiting = s.reviews.filter((r) => !r.reply).length;

  const seg = (t: Tab, icon: string, label: string, badge?: number) => (
    <button className={`seg${picked === t ? ' on' : ''}`} onClick={() => setPicked(t)}>
      <Icon name={icon} fill={t === 'google'} />
      {label}
      {!!badge && <span className="badge">{badge}</span>}
    </button>
  );

  return (
    <div className="page narrow">
      <h1 className="h-medium">Reviews</h1>
      <Gap h={16} />
      <div className="segmented">
        {seg('google', 'star', 'Google', waiting)}
        {seg('private', 'forum', 'Private', unread)}
        {seg('visits', 'visibility', 'Visits')}
      </div>
      <Gap h={16} />
      {picked === 'google' && <GoogleInbox />}
      {picked === 'private' && <FeedbackList />}
      {picked === 'visits' && <VisitList />}
    </div>
  );
}

function GoogleInbox() {
  const s = useStore();
  const [needsOnly, setNeedsOnly] = useState(false);
  const [open, setOpen] = useState<GoogleReview | null>(null);
  const waiting = s.reviews.filter((r) => !r.reply).length;
  const shown = needsOnly ? s.reviews.filter((r) => !r.reply) : s.reviews;

  return (
    <>
      <GradientCard pad={20}>
        <div className="row" style={{ gap: 16 }}>
          <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{googleTotals.average.toFixed(1)}</span>
          <div className="grow">
            <Stars rating={Math.round(googleTotals.average)} size={20} />
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{googleTotals.total} Google reviews</div>
          </div>
          {waiting > 0 && (
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,.18)', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{waiting}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>to reply</div>
            </div>
          )}
        </div>
      </GradientCard>
      <Gap h={16} />
      <div className="row" style={{ gap: 8 }}>
        <SelectChip label="All" selected={!needsOnly} onClick={() => setNeedsOnly(false)} />
        <SelectChip label={waiting > 0 ? `Needs reply · ${waiting}` : 'Needs reply'} selected={needsOnly} onClick={() => setNeedsOnly(true)} />
      </div>
      <Gap h={12} />
      {shown.length === 0 && <EmptyState icon="task_alt" title="All caught up" body="You have replied to every review loaded here." />}
      <div className="col" style={{ gap: 12 }}>
        {shown.map((r) => (
          <Card key={r.id} pad={18} border={!r.reply ? 'var(--violet200)' : undefined} onClick={() => setOpen(r)}>
            <div className="row" style={{ gap: 12 }}>
              <InitialsAvatar name={r.reviewer} />
              <div className="grow">
                <div className="ellipsis" style={{ fontWeight: 800, fontSize: 16 }}>{r.reviewer}</div>
                <div className="muted" style={{ fontSize: 13 }}>{timeAgo(r.createdAt)}</div>
              </div>
              <Stars rating={r.rating} size={17} />
            </div>
            <div className="clamp" style={{ WebkitLineClamp: 5, marginTop: 12, fontSize: 15.5, lineHeight: 1.5 }}>{r.comment}</div>
            <Gap h={12} />
            {!r.reply ? (
              <div className="row">
                <StatusPill label="Needs reply" bg="var(--violet50)" fg="var(--violet700)" dot />
                <div className="grow" />
                <Icon name="auto_awesome" fill size={18} color="var(--violet)" />
                <span style={{ marginLeft: 4, color: 'var(--violet)', fontWeight: 800 }}>Reply</span>
              </div>
            ) : (
              <div style={{ padding: 12, background: 'var(--violet50)', borderRadius: 14 }}>
                <div style={{ color: 'var(--violet700)', fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6 }}>YOUR REPLY</div>
                <div className="clamp" style={{ WebkitLineClamp: 3, marginTop: 4, fontSize: 14.5 }}>{r.reply}</div>
              </div>
            )}
          </Card>
        ))}
      </div>
      {open && <ReplySheet review={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/** lib/features/google_reviews/reply_sheet.dart — AI only drafts; owner approves. */
function ReplySheet({ review, onClose }: { review: GoogleReview; onClose: () => void }) {
  const s = useStore();
  const toast = useToast();
  const [text, setText] = useState(review.reply ?? '');
  const [drafting, setDrafting] = useState(false);
  const [n, setN] = useState(0);
  const [confirm, setConfirm] = useState<'post' | 'delete' | null>(null);
  const needs = !review.reply;

  const draft = () => {
    setDrafting(true);
    window.setTimeout(() => {
      setText(aiDraft(review, n));
      setN(n + 1);
      setDrafting(false);
    }, 900);
  };

  const save = (reply?: string) => {
    s.setReviews(s.reviews.map((r) => (r.id === review.id ? { ...r, reply } : r)));
    onClose();
    toast(reply ? 'Reply posted on Google. (Preview — nothing was posted.)' : 'Reply deleted.');
  };

  return (
    <Sheet onClose={onClose}>
      <div className="row" style={{ gap: 12 }}>
        <InitialsAvatar name={review.reviewer} />
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 16 }}>{review.reviewer}</div>
          <div className="muted" style={{ fontSize: 13 }}>{timeAgo(review.createdAt)}</div>
        </div>
        <Stars rating={review.rating} />
      </div>
      <div style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.5 }}>{review.comment}</div>
      <Gap h={16} />
      <div className="row">
        <div className="grow"><SectionHeader title="Your reply" /></div>
        <button className="tbtn" onClick={draft} disabled={drafting}>
          {drafting ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Icon name="auto_awesome" fill />}
          {text ? 'New AI draft' : 'Draft with AI'}
        </button>
      </div>
      <textarea className="input" rows={5} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Thank them and respond to what they said" />
      <div className="counter">{text.length}/1500</div>
      <div className="muted" style={{ fontSize: 13 }}>Check the draft before posting — RevYne never posts without your approval.</div>
      <Gap h={16} />
      <GradientButton label={needs ? 'Post reply on Google' : 'Update reply'} icon="send" onClick={() => setConfirm('post')} disabled={!text.trim() || drafting} />
      {!needs && (
        <>
          <Gap h={8} />
          <div style={{ textAlign: 'center' }}>
            <button className="tbtn danger" onClick={() => setConfirm('delete')}>Delete reply</button>
          </div>
        </>
      )}
      {confirm === 'post' && (
        <ConfirmDialog
          title="Post this reply on Google?"
          body="Everyone who sees your Google profile will see it. You can edit or delete it later."
          action="Post reply"
          onCancel={() => setConfirm(null)}
          onConfirm={() => save(text.trim())}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog title="Delete your reply?" body="It will be removed from your Google profile." action="Delete" danger onCancel={() => setConfirm(null)} onConfirm={() => save(undefined)} />
      )}
    </Sheet>
  );
}

function PillAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="row" style={{ gap: 6, padding: '10px 14px', background: 'var(--violet50)', borderRadius: 999, color: 'var(--violet)', fontWeight: 700 }}>
      <Icon name={icon} size={18} />
      {label}
    </button>
  );
}

function FeedbackList() {
  const s = useStore();
  const toast = useToast();
  const [del, setDel] = useState<string | null>(null);
  return (
    <>
      <div className="muted" style={{ fontSize: 14, padding: '4px 4px 12px' }}>Messages customers chose to send only to you from your review page.</div>
      {s.feedback.length === 0 && (
        <EmptyState icon="mark_email_unread" title="No private messages yet" body="Every customer can message you privately from your review page. Only you see these." />
      )}
      <div className="col" style={{ gap: 12 }}>
        {s.feedback.map((f) => {
          const isPhone = (f.contact ?? '').replace(/\D/g, '').length >= 10;
          return (
            <Card key={f.id} pad={18} border={f.unread ? 'var(--violet200)' : undefined} onClick={() => s.setFeedback(s.feedback.map((x) => (x.id === f.id ? { ...x, unread: false } : x)))}>
              <div className="row" style={{ gap: 12 }}>
                <InitialsAvatar name={f.name} />
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{f.name ?? 'Customer'}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{timeAgo(f.createdAt)}</div>
                </div>
                {f.rating && <Stars rating={f.rating} size={17} />}
                {f.unread && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--magenta)', marginLeft: 8 }} />}
                <button className="ibtn" style={{ width: 36, height: 36 }} title="Delete message" onClick={(e) => { e.stopPropagation(); setDel(f.id); }}>
                  <Icon name="delete" size={20} color="var(--muted)" />
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.5 }}>"{f.message}"</div>
              {isPhone ? (
                <div className="row" style={{ gap: 8, marginTop: 16 }} onClick={(e) => e.stopPropagation()}>
                  <PillAction icon="chat" label="Reply on WhatsApp" onClick={() => toast('Opens WhatsApp on the phone.')} />
                  <PillAction icon="call" label="Call" onClick={() => toast('Opens the dialler on the phone.')} />
                </div>
              ) : (
                f.contact && <div className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>{f.contact}</div>
              )}
            </Card>
          );
        })}
      </div>
      {del && (
        <ConfirmDialog
          title="Delete this message?"
          body="It will be removed for good. This can't be undone."
          action="Delete"
          danger
          onCancel={() => setDel(null)}
          onConfirm={() => {
            s.setFeedback(s.feedback.filter((f) => f.id !== del));
            setDel(null);
          }}
        />
      )}
    </>
  );
}

function VisitList() {
  return (
    <div className="col" style={{ gap: 12 }}>
      {visits.length === 0 && <EmptyState icon="qr_code_2" title="No visits yet" body="When customers open your review link or scan your QR code, their visits show up here." />}
      {visits.map((v) => (
        <Card key={v.id} pad={18}>
          <div className="row">
            {v.rating ? <Stars rating={v.rating} /> : <span className="muted">No rating</span>}
            <div className="grow" />
            <span className="muted" style={{ fontSize: 13 }}>{timeAgo(v.createdAt)}</span>
          </div>
          {v.highlights.length > 0 && (
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {v.highlights.map((h) => (
                <span key={h} style={{ padding: '4px 10px', background: 'var(--violet50)', borderRadius: 999, color: 'var(--violet700)', fontSize: 12.5, fontWeight: 700 }}>{h}</span>
              ))}
            </div>
          )}
          {v.text && <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5 }}>"{v.text}"</div>}
          <Gap h={12} />
          {v.openedGoogle ? (
            <StatusPill label="Went to Google" bg="var(--success-soft)" fg="var(--success)" dot />
          ) : v.copied ? (
            <StatusPill label="Copied the review" bg="var(--violet50)" fg="var(--violet700)" />
          ) : (
            <StatusPill label="Did not finish" bg="var(--violet50)" fg="var(--muted)" />
          )}
        </Card>
      ))}
    </div>
  );
}
