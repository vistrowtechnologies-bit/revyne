// lib/features/reviews/reviews_screen.dart + google_reviews/* + templates chips
import { useEffect, useState } from 'react';
import { useBusiness, useFeedback, useGoogleReviews, useStore, useTemplates, useVisits } from '../store';
import { invalidate } from '../lib/query';
import * as api from '../lib/api';
import { timeAgo } from '../lib/format';
import { openWhatsApp } from '../lib/options';
import { Card, ConfirmDialog, EmptyState, Gap, GradientButton, GradientCard, Icon, InitialsAvatar, SectionHeader, SelectChip, Sheet, Stars, StatusPill, useToast } from '../ui';
import { Loading, LoadError } from '../widgets';
import { TemplateEditor } from './Templates';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';

type ReviewTab = 'google' | 'private' | 'visits';

export default function ReviewsScreen() {
  const s = useStore();
  const b = useBusiness();
  const fb = useFeedback();
  const gr = useGoogleReviews();
  const linked = b.isVerified;
  const [picked, setPicked] = useState<ReviewTab | null>(null);
  const qTab = s.query.get('tab') as ReviewTab | null;
  useEffect(() => {
    if (qTab === 'private' || qTab === 'google' || qTab === 'visits') setPicked(qTab);
  }, [qTab]);
  const tab: ReviewTab = picked ?? (linked ? 'google' : 'private');
  const unread = fb.data?.filter((f) => f.unread).length ?? 0;
  const waiting = linked ? gr.data?.reviews.filter((r) => r.needsReply).length : undefined;

  const seg = (t: ReviewTab, icon: string, label: string, badge?: number) => (
    <Tab id={t} className={({ isSelected }) => `seg${isSelected ? ' on' : ''}`}>
      <Icon name={icon} fill={t === 'google' && linked} />
      {label}
      {!!badge && <span className="badge" aria-label={`${badge} new`}>{badge}</span>}
    </Tab>
  );

  return (
    <div className="page narrow">
      <h1 className="h-medium">Reviews</h1>
      <Gap h={16} />
      {/* React Aria tabs: arrow keys move between them, screen readers hear "tab, 1 of 3". */}
      <Tabs selectedKey={tab} onSelectionChange={(k) => setPicked(k as ReviewTab)}>
        <TabList aria-label="Review type" className="segmented">
          {seg('google', linked ? 'star' : 'lock', 'Google', waiting)}
          {seg('private', 'forum', 'Private', unread)}
          {seg('visits', 'visibility', 'Visits')}
        </TabList>
        <Gap h={16} />
        <TabPanel id="google" className="tab-panel"><GoogleInbox /></TabPanel>
        <TabPanel id="private" className="tab-panel"><FeedbackList /></TabPanel>
        <TabPanel id="visits" className="tab-panel"><VisitList /></TabPanel>
      </Tabs>
    </div>
  );
}

function GoogleInbox() {
  const s = useStore();
  const toast = useToast();
  const first = useGoogleReviews();
  const [needsOnly, setNeedsOnly] = useState(false);
  const [open, setOpen] = useState<api.GoogleReview | null>(null);
  const [more, setMore] = useState<api.GoogleReview[]>([]);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);

  // A fresh first page restarts paging from it.
  useEffect(() => {
    setMore([]);
    setToken(first.data?.nextPageToken ?? null);
  }, [first.data]);

  if (first.error) {
    const e = first.error as api.BlockedError;
    const [icon, title, body] =
      e.block === 'not_linked'
        ? ['lock', 'Connect Google to see your reviews', 'Read every Google review here and reply with AI drafts — nothing is posted until you approve it.']
        : e.block === 'reconnect'
          ? ['link_off', 'Reconnect Google', 'Google access for your profile expired. Connect again to keep replying.']
          : e.block === 'api_not_approved'
            ? ['hourglass_top', 'Reviews are on the way', `${e.message} Your profile stays linked.`]
            : ['cloud_off', "Couldn't load reviews", e.message || 'Please try again.'];
    const connect = e.block === 'not_linked' || e.block === 'reconnect';
    return (
      <div className="col" style={{ gap: 16 }}>
        <EmptyState icon={icon} title={title} body={body} />
        {connect ? (
          <GradientButton label="Connect Google Profile" icon="link" onClick={() => s.go('google')} />
        ) : (
          <div style={{ textAlign: 'center' }}><button className="tbtn" onClick={first.reload}><Icon name="refresh" />Try again</button></div>
        )}
      </div>
    );
  }
  if (!first.data) return <Loading />;

  const page = first.data;
  const all = [...page.reviews, ...more];
  const waiting = all.filter((r) => r.needsReply).length;
  const shown = needsOnly ? all.filter((r) => r.needsReply) : all;

  const loadMore = async () => {
    if (!token || loadingMore) return;
    setLoadingMore(true);
    try {
      const p = await api.listReviews(token);
      setMore((m) => [...m, ...p.reviews]);
      setToken(p.nextPageToken ?? null);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      {all.length > 0 && (
        <>
          <GradientCard pad={20}>
            <div className="row" style={{ gap: 16 }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{page.averageRating == null ? '–' : page.averageRating.toFixed(1)}</span>
              <div className="grow">
                <Stars rating={page.averageRating == null ? 0 : Math.round(page.averageRating)} size={20} />
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{page.totalCount} Google review{page.totalCount === 1 ? '' : 's'}</div>
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
            <div className="grow" />
            <button className="ibtn" title="Refresh" onClick={() => { setMore([]); first.reload(); }}><Icon name="refresh" color="var(--muted)" /></button>
          </div>
          <Gap h={12} />
        </>
      )}
      {shown.length === 0 && (
        <EmptyState
          icon={needsOnly ? 'task_alt' : 'reviews'}
          title={needsOnly ? 'All caught up' : 'No Google reviews yet'}
          body={needsOnly ? 'You have replied to every review loaded here.' : 'Share your QR poster or WhatsApp link — new reviews will show up here.'}
        />
      )}
      <div className="col" style={{ gap: 12 }}>
        {shown.map((r) => (
          <Card key={r.id} pad={18} border={r.needsReply ? 'var(--violet200)' : undefined} onClick={() => setOpen(r)}>
            <div className="row" style={{ gap: 12 }}>
              <InitialsAvatar name={r.reviewer ?? undefined} />
              <div className="grow">
                <div className="ellipsis" style={{ fontWeight: 800, fontSize: 16 }}>{r.reviewer ?? 'Google user'}</div>
                <div className="muted" style={{ fontSize: 13 }}>{timeAgo(r.createdAt)}</div>
              </div>
              {r.rating > 0 && <Stars rating={r.rating} size={17} />}
            </div>
            {r.displayComment && <div className="clamp" style={{ WebkitLineClamp: 5, marginTop: 12, fontSize: 15.5, lineHeight: 1.5 }}>{r.displayComment}</div>}
            <Gap h={12} />
            {r.needsReply ? (
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
      {token && (
        <>
          <Gap h={8} />
          <button className="obtn" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load older reviews'}</button>
        </>
      )}
      {open && (
        <ReplySheet
          review={open}
          onClose={(changed) => {
            setOpen(null);
            if (changed) {
              setMore([]);
              invalidate('greviews', 'profile', 'activity');
            }
          }}
        />
      )}
    </>
  );
}

/** reply_sheet.dart — AI only drafts; the owner edits, then confirms before posting. */
function ReplySheet({ review: r, onClose }: { review: api.GoogleReview; onClose: (changed: boolean) => void }) {
  const toast = useToast();
  const b = useBusiness();
  const tpl = useTemplates();
  const [text, setText] = useState(r.reply ?? '');
  const [drafting, setDrafting] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [confirm, setConfirm] = useState<'post' | 'delete' | null>(null);
  const [saveTemplate, setSaveTemplate] = useState<string | null>(null);
  const translated = r.displayComment !== r.comment.trim();
  const busy = drafting || posting;

  const draft = async () => {
    setDrafting(true);
    try {
      setText(await api.draftReply(r.id));
    } catch (e) {
      toast((e as Error).message || 'Could not write a draft right now. You can write the reply yourself.');
    } finally {
      setDrafting(false);
    }
  };

  const post = async () => {
    setConfirm(null);
    setPosting(true);
    try {
      await api.postReply(r.id, text.trim());
      toast('Reply posted on Google.');
      onClose(true);
    } catch (e) {
      toast((e as Error).message || 'Could not post right now. Please try again.');
      setPosting(false);
    }
  };

  const del = async () => {
    setConfirm(null);
    setPosting(true);
    try {
      await api.deleteReply(r.id);
      toast('Reply deleted.');
      onClose(true);
    } catch (e) {
      toast((e as Error).message || 'Could not delete right now. Please try again.');
      setPosting(false);
    }
  };

  return (
    <Sheet label="Reply to review" onClose={() => !posting && onClose(false)}>
      <div className="row" style={{ gap: 12 }}>
        <InitialsAvatar name={r.reviewer ?? undefined} />
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 16 }}>{r.reviewer ?? 'Google user'}</div>
          <div className="muted" style={{ fontSize: 13 }}>{timeAgo(r.createdAt)}</div>
        </div>
        {r.rating > 0 && <Stars rating={r.rating} />}
      </div>
      <div style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.5, color: r.comment.trim() ? 'var(--ink)' : 'var(--muted)', whiteSpace: 'pre-wrap' }}>
        {!r.comment.trim() ? 'Rating only — no written review.' : showOriginal ? r.comment.trim() : r.displayComment}
      </div>
      {translated && <button className="tbtn" style={{ marginLeft: -12 }} onClick={() => setShowOriginal(!showOriginal)}>{showOriginal ? 'Show translation' : 'Show original'}</button>}
      <Gap h={16} />
      <div className="row">
        <div className="grow"><SectionHeader title="Your reply" /></div>
        <button className="tbtn" onClick={draft} disabled={busy}>
          {drafting ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Icon name="auto_awesome" fill />}
          {text ? 'New AI draft' : 'Draft with AI'}
        </button>
      </div>
      <div className="chip-row">
        {(tpl.data ?? []).map((t) => (
          <button key={t.id} className="action-chip" onClick={() => setText(api.fillTemplate(t.body, r.reviewer, b.name))}>
            <Icon name="bookmark" />
            {t.title}
          </button>
        ))}
        <button className="action-chip" onClick={() => setSaveTemplate(text.trim())}>
          <Icon name={text.trim() ? 'bookmark_add' : 'add'} />
          {text.trim() ? 'Save as template' : 'New template'}
        </button>
      </div>
      <Gap h={8} />
      <textarea className="input" rows={5} maxLength={1500} disabled={posting} value={text} onChange={(e) => setText(e.target.value)} placeholder="Thank them and respond to what they said" />
      <div className="counter">{text.length}/1500</div>
      <div className="muted" style={{ fontSize: 13 }}>Check the draft before posting — RevYne never posts without your approval.</div>
      <Gap h={16} />
      <GradientButton label={r.needsReply ? 'Post reply on Google' : 'Update reply'} icon="send" busy={posting} onClick={() => setConfirm('post')} disabled={busy || !text.trim()} />
      {!r.needsReply && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="tbtn danger" disabled={busy} onClick={() => setConfirm('delete')}>Delete reply</button>
        </div>
      )}
      {confirm === 'post' && (
        <ConfirmDialog
          title="Post this reply on Google?"
          body="Everyone who sees your Google profile will see it. You can edit or delete it later."
          action="Post reply"
          onCancel={() => setConfirm(null)}
          onConfirm={post}
        />
      )}
      {confirm === 'delete' && <ConfirmDialog title="Delete your reply?" body="It will be removed from your Google profile." action="Delete" danger onCancel={() => setConfirm(null)} onConfirm={del} />}
      {saveTemplate !== null && <TemplateEditor initialBody={saveTemplate || undefined} onClose={() => setSaveTemplate(null)} />}
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
  const toast = useToast();
  const fb = useFeedback();
  const [del, setDel] = useState<string | null>(null);

  if (fb.error) return <LoadError error={fb.error} onRetry={fb.reload} />;
  if (!fb.data) return <Loading />;

  const markRead = async (f: api.Feedback) => {
    if (!f.unread) return;
    await api.markFeedbackRead(f.id).catch(() => {});
    invalidate('feedback', 'dashboard');
  };

  return (
    <>
      <div className="muted" style={{ fontSize: 14, padding: '4px 4px 12px' }}>Messages customers chose to send only to you from your review page.</div>
      {fb.data.length === 0 && <EmptyState icon="mark_email_unread" title="No private messages yet" body="Every customer can message you privately from your review page. Only you see these." />}
      <div className="col" style={{ gap: 12 }}>
        {fb.data.map((f) => {
          const phone = (f.contact ?? '').replace(/[^\d+]/g, '');
          const isPhone = phone.replace('+', '').length >= 10;
          return (
            <Card key={f.id} pad={18} border={f.unread ? 'var(--violet200)' : undefined} onClick={() => markRead(f)}>
              <div className="row" style={{ gap: 12 }}>
                <InitialsAvatar name={f.contactName ?? undefined} />
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{f.contactName ?? 'Customer'}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{timeAgo(f.createdAt)}</div>
                </div>
                {f.rating ? <Stars rating={f.rating} size={17} /> : null}
                {f.unread && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--magenta)', marginLeft: 8 }} />}
                <button className="ibtn" style={{ width: 36, height: 36 }} title="Delete message" onClick={(e) => { e.stopPropagation(); setDel(f.id); }}>
                  <Icon name="delete" size={20} color="var(--muted)" />
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.5 }}>"{f.message}"</div>
              {isPhone ? (
                <div className="row" style={{ gap: 8, marginTop: 16 }} onClick={(e) => e.stopPropagation()}>
                  <PillAction icon="chat" label="Reply on WhatsApp" onClick={() => openWhatsApp(`Hi${f.contactName ? ` ${f.contactName}` : ''}, thank you for your feedback.`, phone)} />
                  <PillAction icon="call" label="Call" onClick={() => window.open(`tel:${phone}`)} />
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
          onConfirm={async () => {
            const id = del;
            setDel(null);
            try {
              await api.deleteFeedback(id);
              invalidate('feedback', 'dashboard');
            } catch {
              toast('Could not delete right now. Please try again.');
            }
          }}
        />
      )}
    </>
  );
}

function VisitList() {
  const v = useVisits();
  if (v.error) return <LoadError error={v.error} onRetry={v.reload} />;
  if (!v.data) return <Loading />;
  return (
    <div className="col" style={{ gap: 12 }}>
      {v.data.length === 0 && <EmptyState icon="qr_code_2" title="No visits yet" body="When customers open your review link or scan your QR code, their visits show up here." />}
      {v.data.map((x) => (
        <Card key={x.id} pad={18}>
          <div className="row">
            {x.rating ? <Stars rating={x.rating} /> : <span className="muted">No rating</span>}
            <div className="grow" />
            <span className="muted" style={{ fontSize: 13 }}>{timeAgo(x.createdAt)}</span>
          </div>
          {x.highlights.length > 0 && (
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {x.highlights.map((h) => (
                <span key={h} style={{ padding: '4px 10px', background: 'var(--violet50)', borderRadius: 999, color: 'var(--violet700)', fontSize: 12.5, fontWeight: 700 }}>{h}</span>
              ))}
            </div>
          )}
          {x.text && <div className="clamp" style={{ WebkitLineClamp: 4, marginTop: 12, fontSize: 15, lineHeight: 1.5 }}>"{x.text}"</div>}
          <Gap h={12} />
          {x.openedGoogle ? (
            <StatusPill label="Went to Google" bg="var(--success-soft)" fg="var(--success)" dot />
          ) : x.copied ? (
            <StatusPill label="Copied the review" bg="var(--violet50)" fg="var(--violet700)" />
          ) : (
            <StatusPill label="Did not finish" bg="var(--violet50)" fg="var(--muted)" />
          )}
        </Card>
      ))}
    </div>
  );
}
