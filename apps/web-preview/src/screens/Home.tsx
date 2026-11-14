// lib/features/home/home_screen.dart
import { useStore } from '../store';
import { business, dashboard, greeting, MONTHS, owner, weekDelta } from '../data';
import { BrandMark, Card, Gap, GradientCard, Icon, IconTile, InitialsAvatar, SectionHeader, StatusPill } from '../ui';

export default function HomeScreen() {
  const s = useStore();
  const unread = s.feedback.filter((f) => f.unread).length;
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

  return (
    <div className="page home">
      <div className="row hide-wide" style={{ minHeight: 48, marginBottom: 24 }}>
        <BrandMark />
        <div className="grow" />
        <button onClick={() => s.go('account')} aria-label="Account">
          <InitialsAvatar name={owner.name} size={40} photo={s.photo} />
        </button>
      </div>
      <h1 className="h-medium">{greeting()}, {owner.name.split(' ')[0]}</h1>
      <Gap h={6} />
      <div className="row" style={{ gap: 6 }}>
        <Icon name="storefront" size={18} color="var(--muted)" />
        <span className="muted ellipsis" style={{ fontSize: 15 }}>{business.name}, {business.city}</span>
        <span style={{ width: 2 }} />
        <StatusPill label="On Google" bg="var(--success-soft)" fg="var(--success)" dot />
      </div>
      <Gap h={24} />

      <div className="wide-2">
        <div className="col">
          <WeekHero />
          {unread > 0 && (
            <>
              <Gap h={16} />
              <Card pad={16} onClick={() => s.go('reviews', 'tab=private')}>
                <div className="row" style={{ gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <IconTile icon="mark_email_unread" />
                    <span style={{ position: 'absolute', right: -2, top: -2, width: 12, height: 12, borderRadius: '50%', background: 'var(--magenta)', border: '2px solid #fff' }} />
                  </div>
                  <div className="grow">
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{unread} private message{unread === 1 ? '' : 's'} waiting</div>
                    <div className="muted" style={{ fontSize: 13.5 }}>Only you can see these</div>
                  </div>
                  <span style={{ padding: '9px 16px', background: 'var(--violet50)', borderRadius: 999, color: 'var(--violet)', fontWeight: 800 }}>Read</span>
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="col">
          <Gap h={24} />
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
        </div>
      </div>
    </div>
  );
}

function WeekHero() {
  const s = useStore();
  const d = dashboard;
  const max = Math.max(...d.daily.map((x) => x.visits));
  const wd = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const up = d.google7d >= d.googlePrev7d;
  return (
    <GradientCard onClick={() => s.go('reviews')}>
      <div className="row">
        <span style={{ color: 'rgba(255,255,255,.82)', fontWeight: 800, fontSize: 12.5, letterSpacing: 1 }}>THIS WEEK</span>
        <div className="grow" />
        <span className="row" style={{ gap: 4, padding: '5px 10px', background: 'rgba(255,255,255,.18)', borderRadius: 999, fontWeight: 700, fontSize: 12.5 }}>
          <Icon name={up ? 'trending_up' : 'trending_down'} size={16} />
          {weekDelta(d.google7d, d.googlePrev7d)}
        </span>
      </div>
      <Gap h={8} />
      <div className="row" style={{ alignItems: 'flex-end', gap: 10 }}>
        <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{d.google7d}</span>
        <span style={{ fontSize: 18, fontWeight: 700, paddingBottom: 6 }}>went to Google</span>
      </div>
      <Gap h={24} />
      <div className="bars">
        {d.daily.map((x, i) => (
          <div key={i} className={`bar-col${i === d.daily.length - 1 ? ' last' : ''}`}>
            <div className="bar" style={{ height: 6 + (62 * x.visits) / max }} />
            <span>{wd[x.day.getDay()]}</span>
          </div>
        ))}
      </div>
      <Gap h={16} />
      <div style={{ height: 1, background: 'rgba(255,255,255,.22)' }} />
      <Gap h={12} />
      <div className="row" style={{ gap: 8, fontWeight: 700 }}>
        <Icon name="visibility" size={18} />
        <span className="grow">{d.visits7d} review page visits</span>
        <Icon name="star" fill size={18} color="var(--star)" />
        <span style={{ fontWeight: 800 }}>{d.avgRating30d.toFixed(1)}</span>
      </div>
    </GradientCard>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <Card pad="18px 8px" onClick={onClick} style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><IconTile icon={icon} size={48} /></div>
      <div style={{ marginTop: 10, fontWeight: 700, fontSize: 14, lineHeight: 1.25, whiteSpace: 'pre-line' }}>{label}</div>
    </Card>
  );
}
