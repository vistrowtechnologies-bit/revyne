// lib/features/home/home_screen.dart — plus a wider desktop dashboard: key
// numbers, reviews waiting for a reply, Google Score and recent activity.
import type { ReactNode } from 'react';
import { useActivity, useBusiness, useDashboard, useFeedback, useGoogleReviews, useInsights, usePalette, useProfile, useStore, useUser } from '../store';
import { activityDisplay, weekDelta, type DashboardStats } from '../lib/api';
import { clock, dayLabel, firstName, greeting, MONTHS, timeAgo } from '../lib/format';
import { BrandMark, Card, EmptyState, Gap, GradientButton, GradientCard, Icon, IconTile, InitialsAvatar, ScoreRing, StatusPill, Stars } from '../ui';
import { Loading, NotificationBell, UserAvatar } from '../widgets';
import { ChangeBadge } from './Stats';
import CountUp from '../components/reactbits/CountUp';
import { HeroBars } from '../charts';
import SpotlightCard from '../components/reactbits/SpotlightCard';

export default function HomeScreen() {
  const s = useStore();
  const b = useBusiness();
  const user = useUser();
  const stats = useDashboard();
  const name = firstName(user.user_metadata?.full_name as string | undefined);

  return (
    <div className="page home wide">
      {/* Phones: brand row like the Android app. */}
      <div className="row hide-wide" style={{ minHeight: 48, marginBottom: 20 }}>
        <BrandMark />
        <div className="grow" />
        <NotificationBell />
        <span style={{ width: 4 }} />
        <button onClick={() => s.go('account')} aria-label="Account"><UserAvatar size={40} /></button>
      </div>

      <div className="row home-head">
        <div className="grow" style={{ minWidth: 0 }}>
          <h1 className="h-medium">{name ? `${greeting()}, ${name}` : greeting()}</h1>
          <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Icon name="storefront" size={18} color="var(--muted)" />
            <span className="muted ellipsis" style={{ fontSize: 15 }}>{[b.name, b.city].filter(Boolean).join(', ')}</span>
            {b.isVerified ? <StatusPill label="On Google" bg="var(--success-soft)" fg="var(--success)" dot /> : <StatusPill label="Not connected" bg="var(--amber-soft)" fg="var(--amber-ink)" dot />}
          </div>
        </div>
        <div className="row show-wide-flex" style={{ gap: 8 }}>
          <button className="obtn" style={{ width: 'auto', minHeight: 44, padding: '0 18px', fontSize: 15 }} onClick={() => s.go('report')}>
            <Icon name="description" />Monthly report
          </button>
          <NotificationBell />
        </div>
      </div>
      <Gap h={24} />

      {stats.data ? (
        <Dashboard stats={stats.data} verified={b.isVerified} />
      ) : stats.error ? (
        <div className="col" style={{ gap: 12 }}>
          <EmptyState icon="cloud_off" title="Couldn't load your numbers" body="Please try again." />
          <div style={{ textAlign: 'center' }}><button className="tbtn" onClick={stats.reload}><Icon name="refresh" />Try again</button></div>
        </div>
      ) : (
        <Loading pad={80} />
      )}
    </div>
  );
}

function Dashboard({ stats: d, verified }: { stats: DashboardStats; verified: boolean }) {
  const s = useStore();
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  return (
    <>
      {verified ? <GoogleKpis /> : <PageKpis d={d} />}
      <Gap h={20} />
      <div className="home-grid">
        <div className="span-7 col" style={{ gap: 20 }}>
          <WeekHero stats={d} />
          {verified ? <NeedsReply /> : <ConnectCard />}
          <RecentActivity />
        </div>
        <div className="span-5 col" style={{ gap: 20 }}>
          {verified && <ScorePeek />}
          <Section title="Customer actions">
            <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
              <QuickAction icon="qr_code_2" label="Share QR" onClick={() => s.go('get-reviews')} />
              <QuickAction icon="send" label={'Ask on\nWhatsApp'} onClick={() => s.go('get-reviews')} />
              <QuickAction icon="forum" label="Messages" onClick={() => s.go('reviews', 'tab=private')} />
            </div>
          </Section>
          <PrivateMessages unread={d.unreadFeedback} />
          <Section title="Reports">
            <Card pad={18} onClick={() => s.go('report')}>
              <div className="row" style={{ gap: 16 }}>
                <IconTile icon="description" />
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{MONTHS[lastMonth.getMonth()]} {lastMonth.getFullYear()} report</div>
                  <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>Views, calls, reviews and more — share as PDF</div>
                </div>
                <Icon name="chevron_right" color="var(--muted)" />
              </div>
            </Card>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return (
    <div className="col">
      <div className="section-row" style={{ minHeight: 28, marginBottom: 8 }}>
        <span className="section">{title}</span>
        {action && <button className="tbtn" style={{ padding: '4px 8px' }} onClick={onAction}>{action}<Icon name="chevron_right" /></button>}
      </div>
      {children}
    </div>
  );
}

// ── Key numbers ─────────────────────────────────────────────────────────────

function Kpi({ icon, label, value, sub, onClick, badge }: { icon: string; label: string; value: ReactNode; sub?: ReactNode; onClick?: () => void; badge?: ReactNode }) {
  return (
    <Card pad={16} onClick={onClick} className="kpi">
      <div className="row" style={{ gap: 8 }}>
        <IconTile icon={icon} size={36} fill={icon === 'star'} />
        <div className="grow" />
        {badge}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginTop: 14 }}>{value}</div>
      <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{label}</div>
      {sub && <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

const dash = <span className="muted">–</span>;

function GoogleKpis() {
  const s = useStore();
  const gr = useGoogleReviews();
  const ins = useInsights({ days: 28 });
  const fb = useFeedback();
  const waiting = gr.data?.reviews.filter((r) => r.needsReply).length;
  const unread = fb.data?.filter((f) => f.unread).length ?? 0;
  const t = ins.data?.totals;
  const p = ins.data?.previous;
  return (
    <div className="kpis">
      <Kpi
        icon="star"
        label="Google rating"
        value={gr.data?.averageRating != null ? <>{gr.data.averageRating.toFixed(1)} <span style={{ fontSize: 18, color: 'var(--star)' }}>★</span></> : dash}
        sub={gr.data ? `${gr.data.totalCount} review${gr.data.totalCount === 1 ? '' : 's'}` : gr.error ? 'Not available' : ' '}
        onClick={() => s.go('reviews', 'tab=google')}
      />
      <Kpi
        icon="rate_review"
        label="Waiting for a reply"
        value={waiting ?? dash}
        sub={unread > 0 ? `+ ${unread} private message${unread === 1 ? '' : 's'}` : 'Google reviews'}
        onClick={() => s.go('reviews', 'tab=google')}
      />
      <Kpi
        icon="visibility"
        label="Profile views"
        value={t ? <CountUp to={t.views} separator="," duration={1} trigger="load" /> : dash}
        sub="Last 28 days on Google"
        badge={t && p ? <ChangeBadge now={t.views} before={p.views} /> : undefined}
        onClick={() => s.go('stats')}
      />
      <Kpi
        icon="call"
        label="Calls & directions"
        value={t ? <CountUp to={t.calls + t.directions} duration={1} trigger="load" /> : dash}
        sub={t ? `${t.calls} calls · ${t.directions} directions` : 'Last 28 days'}
        badge={t && p ? <ChangeBadge now={t.calls + t.directions} before={p.calls + p.directions} /> : undefined}
        onClick={() => s.go('stats')}
      />
    </div>
  );
}

/** Before Google is linked: numbers from the RevYne review page. */
function PageKpis({ d }: { d: DashboardStats }) {
  const s = useStore();
  return (
    <div className="kpis">
      <Kpi icon="visibility" label="Review page visits" value={d.visits7d} sub="This week" onClick={() => s.go('reviews', 'tab=visits')} />
      <Kpi icon="open_in_new" label="Went to Google" value={d.google7d} sub={weekDelta(d.google7d, d.googlePrev7d)} onClick={() => s.go('reviews', 'tab=visits')} />
      <Kpi icon="star" label="Average rating" value={d.avgRating30d != null ? d.avgRating30d.toFixed(1) : dash} sub="Last 30 days" />
      <Kpi icon="forum" label="Unread messages" value={d.unreadFeedback} sub="Private, only you see these" onClick={() => s.go('reviews', 'tab=private')} />
    </div>
  );
}

// ── Sections ────────────────────────────────────────────────────────────────

function NeedsReply() {
  const s = useStore();
  const gr = useGoogleReviews();
  const waiting = gr.data?.reviews.filter((r) => r.needsReply) ?? [];
  return (
    <Section title="Needs your reply" action={waiting.length > 0 ? 'See all' : 'Reviews'} onAction={() => s.go('reviews', 'tab=google')}>
      {gr.error ? (
        <EmptyState icon="reviews" title="Reviews aren't available right now" body={gr.error.message} />
      ) : !gr.data ? (
        <Card><Loading pad={8} /></Card>
      ) : waiting.length === 0 ? (
        <Card pad={18}>
          <div className="row" style={{ gap: 14 }}>
            <IconTile icon="task_alt" bg="var(--success-soft)" fg="var(--success)" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>All caught up</div>
              <div className="muted" style={{ fontSize: 14 }}>You've replied to every recent Google review.</div>
            </div>
          </div>
        </Card>
      ) : (
        <Card pad={0} className="flat">
          {waiting.slice(0, 3).map((r, i) => (
            <div key={r.id}>
              {i > 0 && <hr className="divider" style={{ marginLeft: 72 }} />}
              <button className="list-row tap" style={{ alignItems: 'flex-start' }} onClick={() => s.go('reviews', 'tab=google')}>
                <InitialsAvatar name={r.reviewer ?? undefined} size={40} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="ellipsis" style={{ fontWeight: 800, fontSize: 15 }}>{r.reviewer ?? 'Google user'}</span>
                    {r.rating > 0 && <Stars rating={r.rating} size={15} />}
                    <span className="grow" />
                    <span className="muted" style={{ fontSize: 12.5, flexShrink: 0 }}>{timeAgo(r.createdAt)}</span>
                  </div>
                  <div className="muted clamp" style={{ WebkitLineClamp: 2, fontSize: 14, marginTop: 2 }}>{r.displayComment || 'Rating only — no written review.'}</div>
                </div>
                <span className="row" style={{ gap: 4, color: 'var(--violet)', fontWeight: 800, fontSize: 14, paddingTop: 2, flexShrink: 0 }}>
                  <Icon name="auto_awesome" fill size={16} />Reply
                </span>
              </button>
            </div>
          ))}
        </Card>
      )}
    </Section>
  );
}

function ScorePeek() {
  const s = useStore();
  const p = useProfile();
  if (p.error) return null;
  const v = p.data;
  return (
    <Section title="Google Score" action="Improve" onAction={() => s.go('google')}>
      <Card pad={18} onClick={() => s.go('google')}>
        {!v ? (
          <Loading pad={8} />
        ) : (
          <>
            <div className="row" style={{ gap: 16 }}>
              <ScoreRing score={v.score} size={64} />
              <div className="grow">
                <div style={{ fontWeight: 800, fontSize: 16 }}>{v.score >= 80 ? 'Strong profile' : v.score >= 55 ? 'Good — a few quick wins left' : 'Room to grow'}</div>
                <div className="muted" style={{ fontSize: 13.5 }}>{v.tasks.length ? `${v.tasks.length} way${v.tasks.length === 1 ? '' : 's'} to improve` : 'Nothing left to fix'}</div>
              </div>
            </div>
            {v.tasks.slice(0, 2).map((t) => (
              <div key={t.key} className="row" style={{ gap: 10, marginTop: 12 }}>
                <span style={{ padding: '2px 8px', background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 800, fontSize: 12, borderRadius: 999 }}>+{t.max - t.earned}</span>
                <span className="ellipsis" style={{ fontWeight: 700, fontSize: 14 }}>{t.label}</span>
              </div>
            ))}
          </>
        )}
      </Card>
    </Section>
  );
}

function ConnectCard() {
  const s = useStore();
  return (
    <Card>
      <div className="row" style={{ gap: 12 }}>
        <IconTile icon="lock" />
        <span style={{ fontWeight: 800, fontSize: 17 }}>Google reviews & insights</span>
      </div>
      <div className="muted" style={{ fontSize: 15, margin: '12px 0 16px' }}>
        Unlock your Google reviews, AI replies you approve, and calls, directions and search insights by connecting your Google Business Profile.
      </div>
      <GradientButton label="Connect Google Profile" icon="link" onClick={() => s.go('google')} />
    </Card>
  );
}

function PrivateMessages({ unread }: { unread: number }) {
  const s = useStore();
  const fb = useFeedback();
  const items = (fb.data ?? []).slice(0, 2);
  if (!fb.data || items.length === 0) return null;
  return (
    <Section title={unread > 0 ? `Private messages · ${unread} new` : 'Private messages'} action="All" onAction={() => s.go('reviews', 'tab=private')}>
      <Card pad={0} className="flat">
        {items.map((f, i) => (
          <div key={f.id}>
            {i > 0 && <hr className="divider" style={{ marginLeft: 72 }} />}
            <button className="list-row tap" style={{ alignItems: 'flex-start' }} onClick={() => s.go('reviews', 'tab=private')}>
              <InitialsAvatar name={f.contactName ?? undefined} size={40} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="ellipsis" style={{ fontWeight: f.unread ? 800 : 700, fontSize: 15 }}>{f.contactName ?? 'Customer'}</span>
                  <span className="grow" />
                  <span className="muted" style={{ fontSize: 12.5 }}>{timeAgo(f.createdAt)}</span>
                  {f.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--magenta)' }} />}
                </div>
                <div className="muted clamp" style={{ WebkitLineClamp: 2, fontSize: 14, marginTop: 2 }}>"{f.message}"</div>
              </div>
            </button>
          </div>
        ))}
      </Card>
    </Section>
  );
}

function RecentActivity() {
  const s = useStore();
  const q = useActivity();
  const items = (q.data ?? []).slice(0, 4);
  if (!q.data) return null;
  return (
    <Section title="Recent activity" action={items.length ? 'Activity log' : undefined} onAction={() => s.go('activity')}>
      {items.length === 0 ? (
        <Card pad={18}>
          <div className="muted" style={{ fontSize: 14 }}>Replies, profile edits, posts and photos you make through RevYne will show up here.</div>
        </Card>
      ) : (
        <Card pad="6px 0">
          {items.map((e, i) => {
            const [icon, text] = activityDisplay(e.kind, e.detail);
            return (
              <div key={i} className="row" style={{ gap: 12, padding: '10px 16px' }}>
                <IconTile icon={icon} size={34} />
                <span className="grow ellipsis" style={{ fontWeight: 700, fontSize: 14.5 }}>{text}</span>
                <span className="muted" style={{ fontSize: 12.5, flexShrink: 0 }}>{dayLabel(e.at)} · {clock(e.at)}</span>
              </div>
            );
          })}
        </Card>
      )}
    </Section>
  );
}

// ── Hero + quick actions (unchanged from the app) ───────────────────────────

function WeekHero({ stats: d }: { stats: DashboardStats }) {
  const s = useStore();
  const wd = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const up = d.google7d >= d.googlePrev7d;
  return (
    <GradientCard onClick={() => s.go('reviews', 'tab=visits')}>
      <div className="row">
        <span style={{ color: 'rgba(255,255,255,.82)', fontWeight: 800, fontSize: 12.5, letterSpacing: 1 }}>THIS WEEK</span>
        <div className="grow" />
        {(d.google7d > 0 || d.googlePrev7d > 0) && (
          <span className="row" style={{ gap: 4, padding: '5px 10px', background: 'rgba(255,255,255,.18)', borderRadius: 999, fontWeight: 700, fontSize: 12.5 }}>
            <Icon name={up ? 'trending_up' : 'trending_down'} size={16} />
            {weekDelta(d.google7d, d.googlePrev7d)}
          </span>
        )}
      </div>
      <Gap h={8} />
      <div className="row" style={{ alignItems: 'flex-end', gap: 10 }}>
        <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1 }}><CountUp to={d.google7d} duration={1.2} trigger="load" /></span>
        <span style={{ fontSize: 18, fontWeight: 700, paddingBottom: 6 }}>went to Google</span>
      </div>
      <Gap h={24} />
      <HeroBars
        height={96}
        ariaLabel="Review page visits per day this week"
        data={d.daily.map((x) => ({
          label: wd[x.day.getDay()],
          title: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][x.day.getDay()]} ${x.day.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][x.day.getMonth()]}`,
          value: x.visits,
          lines: [`${x.visits} review page visit${x.visits === 1 ? '' : 's'}`, `${x.google} went to Google`],
        }))}
      />
      <Gap h={16} />
      <div style={{ height: 1, background: 'rgba(255,255,255,.22)' }} />
      <Gap h={12} />
      <div className="row" style={{ gap: 8, fontWeight: 700 }}>
        <Icon name="visibility" size={18} />
        <span className="grow"><CountUp to={d.visits7d} duration={1.2} trigger="load" /> review page visits</span>
        {d.avgRating30d != null && (
          <>
            <Icon name="star" fill size={18} color="var(--star)" />
            <span style={{ fontWeight: 800 }}>{d.avgRating30d.toFixed(1)}</span>
          </>
        )}
      </div>
      {d.visitsTotal === 0 && <div style={{ color: 'rgba(255,255,255,.9)', marginTop: 8 }}>Share your QR code to start getting visits.</div>}
    </GradientCard>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const p = usePalette();
  return (
    <SpotlightCard
      theme="light"
      spotlightColor={p.primary}
      intensity={0.12}
      spotlightSize={180}
      flare={false}
      className="card tap qa-spot"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}><IconTile icon={icon} size={48} /></div>
      <div style={{ marginTop: 10, fontWeight: 700, fontSize: 14, lineHeight: 1.25, whiteSpace: 'pre-line' }}>{label}</div>
    </SpotlightCard>
  );
}
