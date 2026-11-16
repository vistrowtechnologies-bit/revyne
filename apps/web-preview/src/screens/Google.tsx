// lib/features/google_profile/google_profile_screen.dart + profile_panel.dart + google_content/content_sections.dart
import { useRef, useState } from 'react';
import { useBusiness, useGoogleReviews, useInsights, usePhotos, usePosts, useProfile, useScheduled, useStore } from '../store';
import { invalidate } from '../lib/query';
import * as api from '../lib/api';
import { connectGoogleProfile, GoogleCancelled } from '../lib/google';
import { timeAgo, timeLabel, whenLabel } from '../lib/format';
import { Card, ConfirmDialog, EmptyState, Gap, GradientButton, GradientCard, Icon, IconTile, ScoreRing, SectionHeader, SelectChip, Sheet, StatusPill, useToast } from '../ui';
import { CardLoading } from '../widgets';
import { ProfileEditor, type EditorKind } from './Editors';

const UNLOCKS: [string, string, string][] = [
  ['reviews', 'Google reviews & AI replies', 'Every review in one inbox. AI drafts a warm reply in your tone — it is posted only after you approve it.'],
  ['add_photo_alternate', 'Posts & photos', 'Share offers, festival updates and fresh photos to your Google profile from your phone.'],
  ['insights', 'Calls, directions & searches', 'See how many people called you, asked for directions or found you on Google each week.'],
];

export default function GoogleScreen() {
  const b = useBusiness();
  const toast = useToast();
  const verified = b.isVerified;
  const [busy, setBusy] = useState(false);
  const [locations, setLocations] = useState<api.LocationOption[] | null>(null);
  const [editor, setEditor] = useState<EditorKind | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  /** Stored connection first (no second consent), otherwise the Google popup; then pick a profile. */
  const connect = async () => {
    setBusy(true);
    let message = '';
    try {
      let r = await api.gbpLocations();
      if (r.status !== 'ok' || r.locations.length === 0) r = await connectGoogleProfile();
      if (r.status === 'api_not_approved') message = "Your Google account is linked. Google is still reviewing RevYne — we'll finish setup once approved.";
      else if (r.status === 'missing_scope') message = 'Please allow RevYne to manage your Business Profile and try again.';
      else if (r.status === 'ok' && r.locations.length === 0) message = "This Google account doesn't manage a Business Profile. Try the account that does.";
      else if (r.status === 'ok') setLocations(r.locations);
      else message = 'Could not connect right now. Please try again.';
    } catch (e) {
      if (!(e instanceof GoogleCancelled)) message = (e as Error).message || 'Could not connect right now. Please try again.';
    }
    setBusy(false);
    if (message) toast(message);
  };

  const pick = async (choice: api.LocationOption) => {
    setLocations(null);
    try {
      const r = await api.claimLocation(choice);
      if (r.status === 'ok') {
        toast(`${choice.title} is now linked to RevYne.`);
        invalidate('business');
      } else
        toast(
          r.status === 'location_taken'
            ? 'This profile is already linked to another RevYne account.'
            : r.status === 'already_has_business'
              ? 'Your RevYne account is already linked to a Google profile.'
              : r.status === 'not_found'
                ? 'Google no longer lists this profile for your account.'
                : 'Could not link right now. Please try again.',
        );
    } catch (e) {
      toast((e as Error).message || 'Could not link right now. Please try again.');
    }
  };

  return (
    <div className="page">
      <div className="row">
        <h1 className="h-medium grow">Google Profile</h1>
        {verified && (
          <button className="ibtn" title="Refresh" onClick={() => invalidate('profile', 'greviews', 'posts', 'photos', 'scheduled', 'insights')}>
            <Icon name="refresh" color="var(--muted)" />
          </button>
        )}
      </div>
      <Gap h={24} />
      <GradientCard>
        <div className="row">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center' }}>
            <Icon name="storefront" fill />
          </div>
          <div className="grow" />
          <span style={{ padding: '5px 10px', background: 'rgba(255,255,255,.18)', borderRadius: 999, fontWeight: 700, fontSize: 12.5 }}>{verified ? 'Connected' : 'Not connected'}</span>
        </div>
        <Gap h={16} />
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25 }}>{verified ? b.name : 'Connect your Google Business Profile'}</div>
        <div style={{ marginTop: 6, color: 'rgba(255,255,255,.9)', fontSize: 15 }}>
          {verified ? [b.city, 'Linked to your Google Business Profile'].filter(Boolean).join(' · ') : 'Use the Google account that manages your business on Google Maps.'}
        </div>
        {!verified && (
          <button className="obtn" disabled={busy} onClick={connect} style={{ marginTop: 16, background: '#fff', border: 0 }}>
            {busy ? <span className="spinner" /> : <Icon name="link" />}
            Connect Google Profile
          </button>
        )}
      </GradientCard>

      {!verified ? (
        <>
          <Gap h={24} />
          <SectionHeader title="What you unlock" />
          <Gap h={8} />
          <div className="col" style={{ gap: 12 }}>
            {UNLOCKS.map(([icon, title, body]) => (
              <Card key={title} pad={18}>
                <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
                  <IconTile icon={icon} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
                    <div className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>{body}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="wide-2">
            <div className="col">
              <Gap h={32} />
              <SectionHeader title="Google stats" />
              <Gap h={8} />
              <InsightsCard />
              <Gap h={24} />
              <ProfilePanel onEdit={setEditor} onAddPhoto={() => photoInput.current?.click()} />
            </div>
            <div className="col">
              <div className="hide-wide"><Gap h={24} /></div>
              <div className="show-wide"><Gap h={32} /></div>
              <ProfileDetailsSection onEdit={setEditor} />
              <Gap h={24} />
              <SectionHeader title="Google reviews" />
              <Gap h={8} />
              <ReviewsShortcut />
            </div>
          </div>
          <div className="wide-2">
            <div className="col">
              <Gap h={24} />
              <SectionHeader title="Posts" />
              <Gap h={8} />
              <PostsSection />
            </div>
            <div className="col">
              <Gap h={16} />
              <div className="show-wide"><Gap h={8} /></div>
              <SectionHeader title="Photos" />
              <Gap h={8} />
              <PhotosSection onAdd={() => photoInput.current?.click()} />
            </div>
          </div>
          <PhotoAdder inputRef={photoInput} />
          {editor && <EditorHost kind={editor} onClose={() => setEditor(null)} />}
        </>
      )}

      {locations && (
        <Sheet onClose={() => setLocations(null)}>
          <h2 className="h-small">Choose your business</h2>
          <div className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>Google profiles this account manages. RevYne links one business per account.</div>
          <Gap h={16} />
          <div className="col" style={{ gap: 12 }}>
            {locations.map((l) => (
              <Card key={l.location} pad={16} onClick={l.takenByOther ? undefined : () => pick(l)}>
                <div className="row" style={{ gap: 16 }}>
                  <IconTile icon="storefront" fill />
                  <div className="grow">
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{l.title || 'Unnamed business'}</div>
                    {(l.city || l.takenByOther) && <div style={{ color: l.takenByOther ? 'var(--danger)' : 'var(--muted)', fontSize: 14 }}>{l.takenByOther ? 'Linked to another RevYne account' : l.city}</div>}
                  </div>
                  {!l.takenByOther && <Icon name="chevron_right" color="var(--muted)" />}
                </div>
              </Card>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function EditorHost({ kind, onClose }: { kind: EditorKind; onClose: () => void }) {
  const p = useProfile();
  if (!p.data) return null;
  return <ProfileEditor kind={kind} profile={p.data.profile} onClose={onClose} />;
}

function InsightsCard() {
  const s = useStore();
  const q = useInsights({ days: 28 });
  const v = q.data;
  return (
    <Card pad={18} onClick={() => s.go('stats')}>
      <div className="row" style={{ gap: 16 }}>
        <IconTile icon="insights" />
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 16 }}>{v ? `${v.totals.views.toLocaleString('en-IN')} views · ${v.totals.actions} actions` : q.error ? 'Calls, directions & searches' : 'Loading stats…'}</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>
            {v ? `Last 28 days · ${v.totals.calls} calls, ${v.totals.directions} directions` : q.error ? q.error.message || 'Tap to try again' : 'Last 28 days on Google'}
          </div>
        </div>
        <Icon name="chevron_right" color="var(--muted)" />
      </div>
    </Card>
  );
}

/** Opens what fixes a score task (openProfileAction). */
function useScoreAction(onEdit: (k: EditorKind) => void, onAddPhoto: () => void) {
  const s = useStore();
  return (a: api.ScoreAction) => {
    if (a === 'description' || a === 'hours' || a === 'phone' || a === 'website') onEdit(a);
    else if (a === 'get_reviews') s.go('get-reviews');
    else if (a === 'reply') s.go('reviews');
    else if (a === 'photos') onAddPhoto();
    else if (a === 'posts') s.go('new-post');
  };
}

function ProfilePanel({ onEdit, onAddPhoto }: { onEdit: (k: EditorKind) => void; onAddPhoto: () => void }) {
  const p = useProfile();
  const act = useScoreAction(onEdit, onAddPhoto);
  const [all, setAll] = useState(false);
  if (p.error) return <EmptyState icon="cloud_off" title="Couldn't load your profile" body={p.error.message || 'Please try again.'} />;
  if (!p.data) return <CardLoading />;
  const v = p.data;
  const tasks = v.tasks;
  const shown = all ? tasks : tasks.slice(0, 3);
  const verdict = v.score >= 80 ? 'Strong profile' : v.score >= 55 ? 'Good — a few quick wins left' : 'Room to grow';
  return (
    <Card pad={18}>
      <div className="row" style={{ gap: 16 }}>
        <ScoreRing score={v.score} size={76} />
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 18 }}>Google Score</div>
          <div className="muted" style={{ fontSize: 14.5, marginTop: 2 }}>{verdict}</div>
          {tasks.length > 0 && <div style={{ color: 'var(--violet)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{tasks.length} way{tasks.length === 1 ? '' : 's'} to improve</div>}
        </div>
      </div>
      {shown.length > 0 && (
        <>
          <Gap h={16} />
          <hr className="divider" />
          {shown.map((t) => (
            <button key={t.key} className="row" disabled={t.action === 'none'} onClick={() => act(t.action)} style={{ width: '100%', padding: '10px 0', textAlign: 'left', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ padding: '3px 8px', background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 800, fontSize: 12.5, borderRadius: 999 }}>+{t.max - t.earned}</span>
              <div className="grow">
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t.label}</div>
                {t.tip && <div className="muted" style={{ fontSize: 13.5 }}>{t.tip}</div>}
              </div>
              {t.action !== 'none' && <Icon name="chevron_right" color="var(--muted)" />}
            </button>
          ))}
          {tasks.length > 3 && (
            <div style={{ textAlign: 'center' }}>
              <button className="tbtn" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${tasks.length}`}</button>
            </div>
          )}
        </>
      )}
      <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>RevYne's score, based on what Google rewards. Google's own "profile strength" isn't shared with apps.</div>
    </Card>
  );
}

function hoursSummary(h: api.DayHours[]) {
  if (!h.length) return 'Not set';
  const open = new Set(h.map((x) => x.day));
  const f = h[0];
  const same = h.every((x) => x.open === f.open && x.close === f.close);
  const days = open.size === 7 ? 'Every day' : `${open.size} days a week`;
  return same ? `${days} · ${timeLabel(f.open)} – ${timeLabel(f.close)}` : `${days} · varies by day`;
}

function ProfileDetailsSection({ onEdit }: { onEdit: (k: EditorKind) => void }) {
  const q = useProfile();
  if (!q.data) return null;
  const p = q.data.profile;
  const rows: [string, string, string, EditorKind, boolean][] = [
    ['notes', 'Description', p.description || 'Not set', 'description', !p.description],
    ['schedule', 'Opening hours', hoursSummary(p.hours), 'hours', !p.hours.length],
    ['event_busy', 'Holiday hours', p.specialHours.length ? `${p.specialHours.length} date${p.specialHours.length === 1 ? '' : 's'} set` : 'None coming up', 'specialHours', false],
    ['call', 'Phone', p.phone || 'Not set', 'phone', !p.phone],
    ['language', 'Website', p.website || 'Not set', 'website', !p.website],
  ];
  return (
    <>
      <SectionHeader title="Your profile on Google" />
      <Gap h={8} />
      <Card pad="6px 0">
        {p.hasPendingEdits && (
          <div className="row" style={{ gap: 8, margin: '8px 12px 4px', padding: 12, background: 'var(--amber-soft)', borderRadius: 14, fontSize: 13.5, color: '#5C3D00' }}>
            <Icon name="hourglass_top" size={18} color="var(--amber-ink)" />
            Google is reviewing a recent change. It shows once approved.
          </div>
        )}
        {p.googleUpdated && (
          <div className="row" style={{ gap: 8, margin: '8px 12px 4px', padding: '10px 4px 10px 12px', background: 'var(--danger-soft)', borderRadius: 14, fontSize: 13.5 }}>
            <Icon name="info" size={18} color="var(--danger)" />
            <span className="grow">Google changed some of your details (often from public suggestions). Check they're right.</span>
            {p.mapsUri && <button className="tbtn" onClick={() => window.open(p.mapsUri!, '_blank', 'noopener')}>Check</button>}
          </div>
        )}
        {rows.map(([icon, label, value, kind, missing], i) => (
          <div key={label}>
            {i > 0 && <hr className="divider" style={{ marginLeft: 56 }} />}
            <button className="list-row tap" onClick={() => onEdit(kind)} style={{ padding: '12px 16px' }}>
              <Icon name={icon} color="var(--violet)" />
              <div className="grow" style={{ paddingLeft: 2 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
                <div className="clamp" style={{ WebkitLineClamp: 2, color: missing ? 'var(--danger)' : 'var(--muted)', fontSize: 14 }}>{value}</div>
              </div>
              <Icon name="edit" size={20} color="var(--muted)" />
            </button>
          </div>
        ))}
        {p.primaryCategory && (
          <>
            <hr className="divider" style={{ marginLeft: 56 }} />
            <div className="list-row" style={{ padding: '12px 16px' }}>
              <Icon name="category" color="var(--violet)" />
              <div className="grow" style={{ paddingLeft: 2 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Category</div>
                <div className="muted" style={{ fontSize: 14 }}>{[p.primaryCategory, ...p.additionalCategories].join(', ')}</div>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}

function ReviewsShortcut() {
  const s = useStore();
  const q = useGoogleReviews();
  const v = q.data;
  const waiting = v?.reviews.filter((r) => r.needsReply).length ?? 0;
  return (
    <Card pad={18} onClick={() => s.go('reviews', 'tab=google')}>
      <div className="row" style={{ gap: 16 }}>
        <IconTile icon="star" fill />
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {!v ? (q.error ? 'Open your reviews inbox' : 'Loading reviews…') : v.totalCount === 0 ? 'No Google reviews yet' : `${v.averageRating?.toFixed(1) ?? '–'} ★ · ${v.totalCount} review${v.totalCount === 1 ? '' : 's'}`}
          </div>
          <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>
            {!v || v.totalCount === 0 ? 'Read and reply to Google reviews' : waiting > 0 ? `${waiting} waiting for your reply` : 'All replied — nice work'}
          </div>
        </div>
        <Icon name="chevron_right" color="var(--muted)" />
      </div>
    </Card>
  );
}

function PostsSection() {
  const s = useStore();
  const toast = useToast();
  const posts = usePosts();
  const sched = useScheduled();
  const [confirm, setConfirm] = useState<{ kind: 'post' | 'sched'; id: string } | null>(null);
  const run = async () => {
    const c = confirm!;
    setConfirm(null);
    try {
      if (c.kind === 'post') await api.deletePost(c.id);
      else await api.cancelScheduled(c.id);
      invalidate(c.kind === 'post' ? 'posts' : 'scheduled', 'profile', 'activity');
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <div className="col">
      <GradientButton label="Create a post" icon="edit_note" onClick={() => s.go('new-post')} />
      <Gap h={12} />
      <div className="col" style={{ gap: 12 }}>
        {(sched.data ?? []).map((x) => {
          const failed = x.status === 'failed';
          return (
            <Card key={x.id} pad="12px 4px 14px 16px" border={failed ? 'rgba(208,47,53,.35)' : 'var(--violet200)'}>
              <div className="row" style={{ gap: 8 }}>
                {failed ? (
                  <StatusPill label="Not posted" bg="var(--danger-soft)" fg="var(--danger)" dot />
                ) : (
                  <StatusPill label={x.status === 'publishing' ? 'Posting now' : 'Scheduled'} bg="var(--violet50)" fg="var(--violet700)" dot />
                )}
                <span className="grow muted ellipsis" style={{ fontSize: 13 }}>{api.postTypeLabel(x.type)} · {whenLabel(x.publishAt)}</span>
                {x.status === 'pending' && <button className="ibtn" title="Cancel" onClick={() => setConfirm({ kind: 'sched', id: x.id })}><Icon name="close" color="var(--muted)" /></button>}
              </div>
              {x.title && <div style={{ fontWeight: 800, fontSize: 16 }}>{x.title}</div>}
              <div className="clamp" style={{ WebkitLineClamp: 3, fontSize: 14.5, lineHeight: 1.45, paddingRight: 12 }}>{x.summary}</div>
              {failed && x.error && <div style={{ color: 'var(--danger)', fontSize: 13.5, marginTop: 6 }}>{x.error}</div>}
            </Card>
          );
        })}
        {posts.error ? (
          <div className="muted">{posts.error.message || "Couldn't load posts."}</div>
        ) : !posts.data ? (
          <CardLoading />
        ) : posts.data.length === 0 ? (
          <EmptyState icon="campaign" title="No posts yet" body="A weekly update or festival offer keeps your profile fresh on Google." />
        ) : (
          posts.data.slice(0, 5).map((p) => <PostCard key={p.name} post={p} onDelete={() => setConfirm({ kind: 'post', id: p.name })} />)
        )}
      </div>
      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'post' ? 'Delete this post?' : 'Cancel this scheduled post?'}
          body={confirm.kind === 'post' ? 'It will be removed from your Google profile.' : "It won't be posted on Google."}
          action={confirm.kind === 'post' ? 'Delete' : 'Cancel post'}
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={run}
        />
      )}
    </div>
  );
}

function PostCard({ post: p, onDelete }: { post: api.GbpPost; onDelete: () => void }) {
  const [label, bg, fg] =
    p.state === 'LIVE' ? ['Live', 'var(--success-soft)', 'var(--success)'] : p.state === 'REJECTED' ? ['Rejected by Google', 'var(--danger-soft)', 'var(--danger)'] : ['Google is checking', 'var(--amber-soft)', 'var(--amber-ink)'];
  const [imgOk, setImgOk] = useState(true);
  return (
    <Card pad={0} className={`flat${p.searchUrl ? ' tap' : ''}`} onClick={p.searchUrl ? () => window.open(p.searchUrl!, '_blank', 'noopener') : undefined}>
      {p.photoUrl && imgOk && <img src={p.photoUrl} alt="" onError={() => setImgOk(false)} style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />}
      <div style={{ padding: '12px 4px 14px 16px' }}>
        <div className="row" style={{ gap: 8 }}>
          <StatusPill label={label} bg={bg} fg={fg} dot />
          <span className="muted" style={{ fontSize: 13 }}>{api.postTypeLabel(p.type)} · {timeAgo(p.createdAt)}</span>
          <div className="grow" />
          <button className="ibtn" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Icon name="delete" color="var(--muted)" /></button>
        </div>
        {p.title && <div style={{ fontWeight: 800, fontSize: 16 }}>{p.title}</div>}
        <div className="clamp" style={{ WebkitLineClamp: 4, fontSize: 14.5, lineHeight: 1.45, paddingRight: 12 }}>{p.summary}</div>
      </div>
    </Card>
  );
}

function PhotosSection({ onAdd }: { onAdd: () => void }) {
  const toast = useToast();
  const q = usePhotos();
  const [del, setDel] = useState<string | null>(null);
  return (
    <Card pad={14}>
      <div className="row">
        <div className="grow" style={{ fontWeight: 800, fontSize: 16 }}>{q.data ? `${q.data.total} photo${q.data.total === 1 ? '' : 's'} on Google` : 'Photos'}</div>
        <button className="tbtn" onClick={onAdd}><Icon name="add_a_photo" />Add</button>
      </div>
      <Gap h={8} />
      {q.error ? (
        <div className="muted">{q.error.message || "Couldn't load photos."}</div>
      ) : !q.data ? (
        <div style={{ height: 80 }} />
      ) : q.data.photos.length === 0 ? (
        <div className="muted">Add photos of your shop, work and team — profiles with photos get more calls.</div>
      ) : (
        <>
          <div className="photo-grid">
            {q.data.photos.slice(0, 9).map((p) => (
              <div key={p.name} className="photo-tile" onContextMenu={(e) => { e.preventDefault(); setDel(p.name); }}>
                <img src={p.thumbnailUrl ?? p.url} alt="" loading="lazy" />
                <button className="photo-del" title="Delete photo" onClick={() => setDel(p.name)}><Icon name="delete" size={18} /></button>
              </div>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 12.5, paddingTop: 6 }}>Use the bin on a photo to delete it.</div>
        </>
      )}
      {del && (
        <ConfirmDialog
          title="Delete this photo?"
          body="It will be removed from your Google profile."
          action="Delete"
          danger
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            const name = del;
            setDel(null);
            try {
              await api.deletePhoto(name);
              invalidate('photos', 'profile', 'activity');
            } catch (e) {
              toast((e as Error).message);
            }
          }}
        />
      )}
    </Card>
  );
}

/** Pick → choose where it belongs → upload → send to Google (startAddPhoto). */
function PhotoAdder({ inputRef }: { inputRef: React.RefObject<HTMLInputElement> }) {
  const b = useBusiness();
  const toast = useToast();
  const [photo, setPhoto] = useState<{ blob: Blob; png: boolean; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const send = async (category: string) => {
    if (!photo) return;
    setBusy(true);
    toast('Uploading photo…');
    try {
      const path = await api.uploadMedia(b.id, photo.blob, photo.png);
      await api.addPhoto(path, category);
      invalidate('photos', 'profile', 'activity');
      toast('Photo added to Google. It may take a little while to appear.');
      setPhoto(null);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) setPhoto(await api.shrinkImage(f, 2048).catch(() => null));
        }}
      />
      {photo && (
        <Sheet onClose={() => !busy && setPhoto(null)}>
          <img src={photo.url} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 16, display: 'block' }} />
          <Gap h={16} />
          <h2 className="h-small">What does it show?</h2>
          <Gap h={8} />
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {api.PHOTO_CATEGORIES.map((c) => <SelectChip key={c.api} label={c.label} selected={false} onClick={() => !busy && send(c.api)} />)}
          </div>
          <Gap h={8} />
          <div className="muted" style={{ fontSize: 13.5 }}>{busy ? 'Uploading…' : 'Tapping a type adds the photo to your Google profile.'}</div>
        </Sheet>
      )}
    </>
  );
}
