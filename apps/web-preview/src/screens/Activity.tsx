// lib/features/activity/activity_screen.dart
import { activity, clock, dayLabel } from '../data';
import { Card, Gap, IconTile, SectionHeader } from '../ui';
import { AppBar } from './AppBar';

export default function ActivityScreen() {
  let last: string | null = null;
  return (
    <>
      <AppBar title="Activity log" maxWidth={680} />
      <div className="page pushed" style={{ maxWidth: 680 }}>
        <Gap h={8} />
        <div className="muted" style={{ fontSize: 14, padding: '0 4px 8px' }}>Everything changed on your Google profile through RevYne.</div>
        {activity.map((e, i) => {
          const label = dayLabel(e.at);
          const head = label !== last;
          last = label;
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
                  <IconTile icon={e.icon} />
                  <span className="grow" style={{ fontWeight: 700, fontSize: 15 }}>{e.text}</span>
                  <span className="muted" style={{ fontSize: 13 }}>{clock(e.at)}</span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </>
  );
}
