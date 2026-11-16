// lib/features/home/home_screen.dart
import { useBusiness, useDashboard, useFeedback, useStore, useUser } from '../store';
import { weekDelta, type DashboardStats } from '../lib/api';
import { firstName, greeting, MONTHS } from '../lib/format';
import { BrandMark, Card, EmptyState, Gap, GradientButton, GradientCard, Icon, IconTile, SectionHeader, StatusPill } from '../ui';
import { Loading, NotificationBell, UserAvatar } from '../widgets';
import { usePalette } from '../store';
import CountUp from '../components/reactbits/CountUp';
import SpotlightCard from '../components/reactbits/SpotlightCard';

export default function HomeScreen() {
  const s = useStore();
  const b = useBusiness();
  const user = useUser();
  const stats = useDashboard();
  useFeedback(); // keep the Reviews badge warm
  const name = firstName(user.user_metadata?.full_name as string | undefined);

  return (
    <div className="page home">
      <div className="row" style={{ minHeight: 48, marginBottom: 24 }}>
        <span className="hide-wide"><BrandMark /></span>
        <div className="grow" />
        <NotificationBell />
        <span style={{ width: 4 }} />
        <button className="hide-wide" onClick={() => s.go('account')} aria-label="Account"><UserAvatar size={40} /></button>
      </div>
      <h1 className="h-medium">{name ? `${greeting()}, ${name}` : greeting()}</h1>
      <Gap h={6} />
      <div className="row" style={{ gap: 6 }}>
        <Icon name="storefront" size={18} color="var(--muted)" />
        <span className="muted ellipsis" style={{ fontSize: 15 }}>{[b.name, b.city].filter(Boolean).join(', ')}</span>
        <span style={{ width: 2 }} />
        {b.isVerified ? <StatusPill label="On Google" bg="var(--success-soft)" fg="var(--success)" dot /> : <StatusPill label="Not connected" bg="var(--amber-soft)" fg="var(--amber-ink)" dot />}
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
    <div className="wide-2">
      <div className="col">
        <WeekHero stats={d} />
        {d.unreadFeedback > 0 && (
          <>
            <Gap h={16} />
            <Card pad={16} onClick={() => s.go('reviews', 'tab=private')}>
              <div className="row" style={{ gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <IconTile icon="mark_email_unread" />
                  <span style={{ position: 'absolute', right: -2, top: -2, width: 12, height: 12, borderRadius: '50%', background: 'var(--magenta)', border: '2px solid #fff' }} />
                </div>
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{d.unreadFeedback} private message{d.unreadFeedback === 1 ? '' : 's'} waiting</div>
                  <div className="muted" style={{ fontSize: 13.5 }}>Only you can see these</div>
                </div>
                <span style={{ padding: '9px 16px', background: 'var(--violet50)', borderRadius: 999, color: 'var(--violet)', fontWeight: 800 }}>Read</span>
              </div>
            </Card>
          </>
        )}
      </div>
      <div className="col">
        <div className="hide-wide"><Gap h={24} /></div>
        <SectionHeader title="Customer actions" />
        <Gap h={8} />
        <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
          <QuickAction icon="qr_code_2" label="Share QR" onClick={() => s.go('get-reviews')} />
          <QuickAction icon="send" label={'Ask on\nWhatsApp'} onClick={() => s.go('get-reviews')} />
          <QuickAction icon="forum" label="Messages" onClick={() => s.go('reviews', 'tab=private')} />
        </div>
        <Gap h={24} />
        <SectionHeader title="Reports" />
        <Gap h={8} />
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
        {!verified && (
          <>
            <Gap h={24} />
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
          </>
        )}
      </div>
    </div>
  );
}

function WeekHero({ stats: d }: { stats: DashboardStats }) {
  const s = useStore();
  const max = Math.max(0, ...d.daily.map((x) => x.visits));
  const wd = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const up = d.google7d >= d.googlePrev7d;
  return (
    <GradientCard onClick={() => s.go('reviews')}>
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
      <div className="bars">
        {d.daily.map((x, i) => (
          <div key={i} className={`bar-col${i === d.daily.length - 1 ? ' last' : ''}`}>
            <div className="bar" style={{ height: max === 0 ? 6 : 6 + (62 * x.visits) / max }} />
            <span>{wd[x.day.getDay()]}</span>
          </div>
        ))}
      </div>
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
