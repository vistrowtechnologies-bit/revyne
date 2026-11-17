// Small app-aware widgets (they read the session / server data).
import { useState } from 'react';
import { useMyPhoto, useNotifications, usePalette, useStore, useUser } from './store';
import LatticeLoader from './components/reactbits/LatticeLoader';
import { percentChange } from './lib/api';
import { Card, EmptyState, Gap, Icon, InitialsAvatar } from './ui';

/** Round profile photo with initials as the fallback (user_avatar.dart). */
export function UserAvatar({ size = 40 }: { size?: number }) {
  const user = useUser();
  const { data: url } = useMyPhoto();
  const [broken, setBroken] = useState<string | null>(null);
  const name = user.user_metadata?.full_name as string | undefined;
  if (!url || broken === url) return <InitialsAvatar name={name} size={size} />;
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      <img src={url.replace(/=s\d+-c$/, '=s256-c')} alt="" referrerPolicy="no-referrer" onError={() => setBroken(url)} />
    </div>
  );
}

/** Bell with an unread badge (notifications_screen.dart). */
export function NotificationBell() {
  const s = useStore();
  const { data } = useNotifications();
  const unread = data?.filter((n) => n.unread).length ?? 0;
  return (
    <button className="ibtn" title="Notifications" onClick={() => s.go('notifications')} style={{ position: 'relative', width: 44, height: 44 }}>
      <Icon name="notifications" size={26} color="var(--ink)" />
      {unread > 0 && (
        <span style={{ position: 'absolute', top: 4, right: 3, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: 'var(--magenta)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', border: '2px solid var(--bg)' }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

export function Loading({ pad = 40, label = 'Loading' }: { pad?: number; label?: string }) {
  const p = usePalette();
  return (
    <div style={{ padding: pad, display: 'grid', placeItems: 'center' }}>
      <LatticeLoader label={label} color={p.primary} glowColor={p.shade200} fontSize={14} />
    </div>
  );
}

export function LoadError({ title = "Couldn't load", error, onRetry }: { title?: string; error?: Error; onRetry?: () => void }) {
  return (
    <div className="col" style={{ gap: 12 }}>
      <EmptyState icon="cloud_off" title={title} body={error?.message || 'Please try again.'} />
      {onRetry && (
        <div style={{ textAlign: 'center' }}>
          <button className="tbtn" onClick={onRetry}><Icon name="refresh" />Try again</button>
        </div>
      )}
    </div>
  );
}

/** Card-sized placeholder used inside sections. */
export function CardLoading({ lines = 3 }: { lines?: number }) {
  return (
    <Card pad={18}>
      <div className="col" style={{ gap: 10 }} role="status" aria-label="Loading">
        <Sk w="45%" h={16} />
        {Array.from({ length: lines }, (_, i) => <Sk key={i} w={`${90 - i * 15}%`} />)}
      </div>
    </Card>
  );
}

/** Small "▲ 12%" / "▼ 5%" badge; nothing when there's no earlier data. */
export function ChangeBadge({ now, before, onDark }: { now: number; before?: number | null; onDark?: boolean }) {
  const pct = percentChange(now, before);
  if (pct == null) return null;
  const up = pct >= 0;
  return <span style={{ color: onDark ? '#fff' : up ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: 12.5 }}>{up ? '▲' : '▼'} {Math.abs(pct)}%</span>;
}

// ── Skeletons: grey shapes in the layout of what's loading ────────────────

export function Sk({ w = '100%', h = 14, r = 8, style }: { w?: number | string; h?: number; r?: number; style?: React.CSSProperties }) {
  return <span className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden />;
}

/** A card of skeleton rows: avatar/tile + two lines (reviews, messages, activity, notifications). */
export function ListSkeleton({ rows = 3, avatar = true, label = 'Loading' }: { rows?: number; avatar?: boolean; label?: string }) {
  return (
    <div className="col" style={{ gap: 12 }} role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i} pad={18}>
          <div className="row" style={{ gap: 12 }}>
            {avatar && <Sk w={44} h={44} r={22} />}
            <div className="grow col" style={{ gap: 8 }}>
              <Sk w="40%" h={14} />
              <Sk w="22%" h={11} />
            </div>
            <Sk w={84} h={14} />
          </div>
          <div className="col" style={{ gap: 8, marginTop: 14 }}>
            <Sk w="96%" />
            <Sk w="70%" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Gradient hero placeholder (same size as the real one). */
export function HeroSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="gcard sk-hero" style={{ height }} aria-hidden>
      <Sk w={110} h={12} style={{ opacity: 0.5 }} />
      <Sk w={160} h={40} r={10} style={{ marginTop: 14, opacity: 0.5 }} />
      <div className="row" style={{ alignItems: 'flex-end', gap: 8, marginTop: 'auto', height: 80 }}>
        {[40, 62, 35, 70, 48, 80, 56].map((h, i) => <Sk key={i} w="100%" h={h} r={8} style={{ opacity: 0.35 }} />)}
      </div>
    </div>
  );
}

export function TilesSkeleton({ n = 4, className = 'kpis' }: { n?: number; className?: string }) {
  return (
    <div className={className} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <Card key={i} pad={16}>
          <Sk w={36} h={36} r={12} />
          <Sk w="45%" h={26} r={8} style={{ marginTop: 14 }} />
          <Sk w="70%" h={12} style={{ marginTop: 8 }} />
        </Card>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard">
      <TilesSkeleton />
      <Gap h={20} />
      <div className="home-grid">
        <div className="span-7 col" style={{ gap: 20 }}>
          <HeroSkeleton />
          <ListSkeleton rows={2} />
        </div>
        <div className="span-5 col" style={{ gap: 20 }}>
          <Card pad={18}>
            <div className="row" style={{ gap: 16 }}>
              <Sk w={64} h={64} r={32} />
              <div className="grow col" style={{ gap: 8 }}><Sk w="70%" h={15} /><Sk w="40%" h={12} /></div>
            </div>
          </Card>
          <TilesSkeleton n={3} className="row sk-actions" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div role="status" aria-label="Loading stats">
      <HeroSkeleton height={250} />
      <Gap h={24} />
      <TilesSkeleton className="stat-grid four" />
      <Gap h={12} />
      <Card pad={16}><Sk w="30%" h={14} /><Sk w="100%" h={150} r={12} style={{ marginTop: 14 }} /></Card>
    </div>
  );
}

/** Generic page placeholder while a screen's code downloads. */
export function PageSkeleton() {
  return (
    <div className="page" role="status" aria-label="Loading">
      <Sk w={220} h={28} r={10} />
      <Gap h={24} />
      <HeroSkeleton height={200} />
      <Gap h={20} />
      <ListSkeleton rows={2} />
    </div>
  );
}
