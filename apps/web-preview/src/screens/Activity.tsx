// lib/features/activity/activity_screen.dart
import { useActivity } from '../store';
import { activityDisplay } from '../lib/api';
import { clock, dayLabel } from '../lib/format';
import { Card, EmptyState, Gap, IconTile, SectionHeader } from '../ui';
import { Loading, LoadError } from '../widgets';
import { AppBar } from './AppBar';

export default function ActivityScreen() {
  const q = useActivity();
  let last: string | null = null;
  return (
    <>
      <AppBar title="Activity log" maxWidth={680} />
      <div className="page pushed" style={{ maxWidth: 680 }}>
        <Gap h={8} />
        {q.error ? (
          <LoadError title="Couldn't load activity" error={q.error} onRetry={q.reload} />
        ) : !q.data ? (
          <Loading />
        ) : q.data.length === 0 ? (
          <EmptyState icon="history" title="Nothing yet" body="Replies, profile edits, posts and photos you make through RevYne will be listed here." />
        ) : (
          <>
            <div className="muted" style={{ fontSize: 14, padding: '0 4px 8px' }}>Everything changed on your Google profile through RevYne.</div>
            {q.data.map((e, i) => {
              const label = dayLabel(e.at);
              const head = label !== last;
              last = label;
              const [icon, text] = activityDisplay(e.kind, e.detail);
              return (
                <div key={i}>
                  {head && (
                    <>
                      <Gap h={8} />
                      <SectionHeader title={label} />
                      <Gap h={6} />
                    </>
                  )}
                  <Card pad="12px 14px" style={{ marginBottom: 8 }}>
                    <div className="row" style={{ gap: 12 }}>
                      <IconTile icon={icon} />
                      <span className="grow" style={{ fontWeight: 700, fontSize: 15 }}>{text}</span>
                      <span className="muted" style={{ fontSize: 13 }}>{clock(e.at)}</span>
                    </div>
                  </Card>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
