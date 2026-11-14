// lib/features/google_profile/google_profile_screen.dart + profile_panel.dart + google_content/content_sections.dart
import { useState } from 'react';
import { useStore } from '../store';
import { business, googleTotals, insights, photos, photoTotal, profile, score, timeAgo, whenLabel, type Post } from '../data';
import { Card, ConfirmDialog, Gap, GradientButton, GradientCard, Icon, IconTile, ScoreRing, SectionHeader, StatusPill, useToast } from '../ui';

export default function GoogleScreen() {
  const s = useStore();
  const t = insights(28).totals;
  const waiting = s.reviews.filter((r) => !r.reply).length;

  return (
    <div className="page">
      <h1 className="h-medium">Google Profile</h1>
      <Gap h={24} />
      <GradientCard>
        <div className="row">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center' }}>
            <Icon name="storefront" fill />
          </div>
          <div className="grow" />
          <span style={{ padding: '5px 10px', background: 'rgba(255,255,255,.18)', borderRadius: 999, fontWeight: 700, fontSize: 12.5 }}>Connected</span>
        </div>
        <Gap h={16} />
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25 }}>{business.name}</div>
        <div style={{ marginTop: 6, color: 'rgba(255,255,255,.9)', fontSize: 15 }}>{business.city} · Linked to your Google Business Profile</div>
      </GradientCard>

      <div className="wide-2">
        <div className="col">
          <Gap h={32} />
          <SectionHeader title="Google stats" />
          <Gap h={8} />
          <Card pad={18} onClick={() => s.go('stats')}>
            <div className="row" style={{ gap: 16 }}>
              <IconTile icon="insights" />
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 16 }}>{t.views.toLocaleString('en-IN')} views · {t.actions} actions</div>
                <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>Last 28 days · {t.calls} calls, {t.directions} directions</div>
              </div>
              <Icon name="chevron_right" color="var(--muted)" />
            </div>
          </Card>
          <Gap h={24} />
          <ScoreCard />
        </div>
        <div className="col">
          <Gap h={24} />
          <div className="show-wide"><Gap h={8} /></div>
          <SectionHeader title="Your profile on Google" />
          <Gap h={8} />
          <ProfileDetails />
          <Gap h={24} />
          <SectionHeader title="Google reviews" />
          <Gap h={8} />
          <Card pad={18} onClick={() => s.go('reviews')}>
            <div className="row" style={{ gap: 16 }}>
              <IconTile icon="star" fill />
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 16 }}>{googleTotals.average.toFixed(1)} ★ · {googleTotals.total} reviews</div>
                <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{waiting > 0 ? `${waiting} waiting for your reply` : 'All replied — nice work'}</div>
              </div>
              <Icon name="chevron_right" color="var(--muted)" />
            </div>
          </Card>
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
          <PhotosSection />
        </div>
      </div>
    </div>
  );
}

function ScoreCard() {
  const s = useStore();
  const toast = useToast();
  const [all, setAll] = useState(false);
  const tasks = score.tasks;
  const shown = all ? tasks : tasks.slice(0, 3);
  const v = score.value;
  const verdict = v >= 80 ? 'Strong profile' : v >= 55 ? 'Good — a few quick wins left' : 'Room to grow';
  const act = (label: string) => {
    if (label.startsWith('Reply')) s.go('reviews');
    else if (label.startsWith('Post')) s.go('new-post');
    else toast('Opens the editor in the app.');
  };
  return (
    <Card pad={18}>
      <div className="row" style={{ gap: 16 }}>
        <ScoreRing score={v} size={76} />
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: 18 }}>Google Score</div>
          <div className="muted" style={{ fontSize: 14.5, marginTop: 2 }}>{verdict}</div>
          <div style={{ color: 'var(--violet)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{tasks.length} ways to improve</div>
        </div>
      </div>
      <Gap h={16} />
      <hr className="divider" />
      {shown.map((t) => (
        <button key={t.label} className="row" onClick={() => act(t.label)} style={{ width: '100%', padding: '10px 0', textAlign: 'left', alignItems: 'flex-start', gap: 12, borderRadius: 12 }}>
          <span style={{ padding: '3px 8px', background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 800, fontSize: 12.5, borderRadius: 999 }}>+{t.gain}</span>
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t.label}</div>
            <div className="muted" style={{ fontSize: 13.5 }}>{t.tip}</div>
          </div>
          <Icon name="chevron_right" color="var(--muted)" />
        </button>
      ))}
      {tasks.length > 3 && (
        <div style={{ textAlign: 'center' }}>
          <button className="tbtn" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${tasks.length}`}</button>
        </div>
      )}
      <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
        RevYne's score, based on what Google rewards. Google's own "profile strength" isn't shared with apps.
      </div>
    </Card>
  );
}

function ProfileDetails() {
  const toast = useToast();
  const rows: [string, string, string, boolean][] = [
    ['notes', 'Description', profile.description, false],
    ['schedule', 'Opening hours', profile.hoursSummary, false],
    ['event_busy', 'Holiday hours', profile.holidays, false],
    ['call', 'Phone', profile.phone || 'Not set', !profile.phone],
    ['language', 'Website', profile.website, false],
  ];
  return (
    <Card pad="6px 0">
      {rows.map(([icon, label, value, missing], i) => (
        <div key={label}>
          {i > 0 && <hr className="divider" style={{ marginLeft: 56 }} />}
          <button className="list-row tap" onClick={() => toast(`Edit ${label.toLowerCase()} — opens the editor in the app.`)} style={{ padding: '12px 16px' }}>
            <Icon name={icon} color="var(--violet)" />
            <div className="grow" style={{ paddingLeft: 2 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
              <div className="clamp" style={{ WebkitLineClamp: 2, color: missing ? 'var(--danger)' : 'var(--muted)', fontSize: 14 }}>{value}</div>
            </div>
            <Icon name="edit" size={20} color="var(--muted)" />
          </button>
        </div>
      ))}
      <hr className="divider" style={{ marginLeft: 56 }} />
      <div className="list-row" style={{ padding: '12px 16px' }}>
        <Icon name="category" color="var(--violet)" />
        <div className="grow" style={{ paddingLeft: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Category</div>
          <div className="muted" style={{ fontSize: 14 }}>{profile.category}</div>
        </div>
      </div>
    </Card>
  );
}

function PostsSection() {
  const s = useStore();
  const [confirm, setConfirm] = useState<{ kind: 'post' | 'sched'; id: string } | null>(null);
  return (
    <div className="col">
      <GradientButton label="Create a post" icon="edit_note" onClick={() => s.go('new-post')} />
      <Gap h={12} />
      <div className="col" style={{ gap: 12 }}>
        {s.scheduled.map((x) => (
          <Card key={x.id} pad="12px 4px 14px 16px" border="var(--violet200)">
            <div className="row" style={{ gap: 8 }}>
              <StatusPill label="Scheduled" bg="var(--violet50)" fg="var(--violet700)" dot />
              <span className="grow muted ellipsis" style={{ fontSize: 13 }}>{x.type} · {whenLabel(x.at)}</span>
              <button className="ibtn" title="Cancel" onClick={() => setConfirm({ kind: 'sched', id: x.id })}><Icon name="close" color="var(--muted)" /></button>
            </div>
            {x.title && <div style={{ fontWeight: 800, fontSize: 16 }}>{x.title}</div>}
            <div className="clamp" style={{ WebkitLineClamp: 3, fontSize: 14.5, lineHeight: 1.45, paddingRight: 12 }}>{x.summary}</div>
          </Card>
        ))}
        {s.posts.slice(0, 5).map((p) => (
          <PostCard key={p.id} post={p} onDelete={() => setConfirm({ kind: 'post', id: p.id })} />
        ))}
      </div>
      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'post' ? 'Delete this post?' : 'Cancel this scheduled post?'}
          body={confirm.kind === 'post' ? 'It will be removed from your Google profile.' : "It won't be posted on Google."}
          action={confirm.kind === 'post' ? 'Delete' : 'Cancel post'}
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.kind === 'post') s.setPosts(s.posts.filter((p) => p.id !== confirm.id));
            else s.setScheduled(s.scheduled.filter((p) => p.id !== confirm.id));
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

function PostCard({ post: p, onDelete }: { post: Post; onDelete: () => void }) {
  const [label, bg, fg] =
    p.state === 'LIVE' ? ['Live', 'var(--success-soft)', 'var(--success)'] : p.state === 'REJECTED' ? ['Rejected by Google', 'var(--danger-soft)', 'var(--danger)'] : ['Google is checking', 'var(--amber-soft)', 'var(--amber-ink)'];
  return (
    <Card pad={0} className="flat">
      {p.photo && (
        <div style={{ height: 150, background: p.photo, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.7)' }}>
          <Icon name="redeem" size={54} />
        </div>
      )}
      <div style={{ padding: '12px 4px 14px 16px' }}>
        <div className="row" style={{ gap: 8 }}>
          <StatusPill label={label} bg={bg} fg={fg} dot />
          <span className="muted" style={{ fontSize: 13 }}>{p.type} · {timeAgo(p.createdAt)}</span>
          <div className="grow" />
          <button className="ibtn" title="Delete" onClick={onDelete}><Icon name="delete" color="var(--muted)" /></button>
        </div>
        {p.title && <div style={{ fontWeight: 800, fontSize: 16 }}>{p.title}</div>}
        <div className="clamp" style={{ WebkitLineClamp: 4, fontSize: 14.5, lineHeight: 1.45, paddingRight: 12 }}>{p.summary}</div>
      </div>
    </Card>
  );
}

function PhotosSection() {
  const toast = useToast();
  return (
    <Card pad={14}>
      <div className="row">
        <div className="grow" style={{ fontWeight: 800, fontSize: 16 }}>{photoTotal} photos on Google</div>
        <button className="tbtn" onClick={() => toast('Preview only — the app picks a photo, then asks what it shows.')}>
          <Icon name="add_a_photo" />
          Add
        </button>
      </div>
      <Gap h={8} />
      <div className="photo-grid">
        {photos.map((p) => (
          <div key={p.label} className="photo" style={{ background: p.bg }} title={p.label}>
            <Icon name={p.icon} fill />
            {p.label}
          </div>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 12.5, paddingTop: 6 }}>Press and hold a photo to delete it.</div>
    </Card>
  );
}
