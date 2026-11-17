// Small app-aware widgets (they read the session / server data).
import { useState } from 'react';
import { useMyPhoto, useNotifications, usePalette, useStore, useUser } from './store';
import LatticeLoader from './components/reactbits/LatticeLoader';
import { percentChange } from './lib/api';
import { Card, EmptyState, Icon, InitialsAvatar } from './ui';

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

/** Small "card-sized" spinner used inside sections. */
export function CardLoading() {
  return (
    <Card>
      <Loading pad={12} />
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
