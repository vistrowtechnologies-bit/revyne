// lib/features/notifications/notifications_screen.dart — the in-app list (no push on the web).
import { useNotifications, useStore } from '../store';
import { invalidate } from '../lib/query';
import * as api from '../lib/api';
import { timeAgo } from '../lib/format';
import { Card, EmptyState, Gap, IconTile } from '../ui';
import { Loading, LoadError } from '../widgets';
import { AppBar } from './AppBar';

export default function NotificationsScreen() {
  const s = useStore();
  const q = useNotifications();
  const unread = q.data?.filter((n) => n.unread).length ?? 0;

  const open = async (n: api.AppNotification) => {
    if (n.unread) {
      await api.markNotificationRead(n.id).catch(() => {});
      invalidate('notifications');
    }
    s.go(n.route || '/home');
  };

  return (
    <>
      <AppBar
        title="Notifications"
        maxWidth={680}
        action={
          unread > 0 && (
            <button
              className="tbtn"
              onClick={async () => {
                await api.markAllNotificationsRead().catch(() => {});
                invalidate('notifications');
              }}
            >
              Mark all read
            </button>
          )
        }
      />
      <div className="page pushed" style={{ maxWidth: 680 }}>
        <Gap h={8} />
        {q.error ? (
          <LoadError title="Couldn't load notifications" error={q.error} onRetry={q.reload} />
        ) : !q.data ? (
          <Loading />
        ) : q.data.length === 0 ? (
          <EmptyState icon="notifications" title="No notifications yet" body="New Google reviews, private messages and scheduled posts will show up here." />
        ) : (
          <div className="col" style={{ gap: 8 }}>
            {q.data.map((n) => (
              <Card key={n.id} pad={14} border={n.unread ? 'var(--violet200)' : undefined} onClick={() => open(n)}>
                <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <IconTile icon={api.notificationIcon(n.kind)} fill={n.kind === 'review'} />
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}>
                      <span className="grow" style={{ fontWeight: n.unread ? 800 : 700, fontSize: 15 }}>{n.title}</span>
                      <span className="muted" style={{ fontSize: 12.5 }}>{timeAgo(n.createdAt)}</span>
                    </div>
                    {n.body && <div className="muted clamp" style={{ WebkitLineClamp: 3, fontSize: 14, marginTop: 2 }}>{n.body}</div>}
                  </div>
                  {n.unread && <span style={{ marginTop: 6, width: 9, height: 9, borderRadius: '50%', background: 'var(--magenta)', flexShrink: 0 }} />}
                </div>
              </Card>
            ))}
            <div className="muted" style={{ textAlign: 'center', fontSize: 12.5, paddingTop: 8 }}>Notifications are kept for 30 days.</div>
          </div>
        )}
      </div>
    </>
  );
}
