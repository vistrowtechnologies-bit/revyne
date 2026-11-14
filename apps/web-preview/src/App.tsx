import { useCallback, useRef, useState } from 'react';
import { StoreProvider, TABS, useStore, type Route } from './store';
import { BrandMark, GradientButton, Icon, InitialsAvatar, ToastContext } from './ui';
import { owner } from './data';
import HomeScreen from './screens/Home';
import ReviewsScreen from './screens/Reviews';
import GetReviewsScreen from './screens/GetReviews';
import GoogleScreen from './screens/Google';
import StatsScreen from './screens/Stats';
import ReportScreen from './screens/Report';
import CreatePostScreen from './screens/CreatePost';
import AccountScreen from './screens/Account';
import ActivityScreen from './screens/Activity';

// lib/features/shell/home_shell.dart — Home · Reviews · [Get Reviews] · Google · Account.
const NAV: { route: Route; icon: string; label: string }[] = [
  { route: 'home', icon: 'home', label: 'Home' },
  { route: 'reviews', icon: 'chat_bubble', label: 'Reviews' },
  { route: 'get-reviews', icon: 'qr_code_2', label: 'Get Reviews' },
  { route: 'google', icon: 'storefront', label: 'Google' },
  { route: 'account', icon: 'person', label: 'Account' },
];

function Shell() {
  const s = useStore();

  const screen = {
    home: <HomeScreen />,
    reviews: <ReviewsScreen />,
    'get-reviews': <GetReviewsScreen />,
    google: <GoogleScreen />,
    account: <AccountScreen />,
    stats: <StatsScreen />,
    report: <ReportScreen />,
    'new-post': <CreatePostScreen />,
    activity: <ActivityScreen />,
  }[s.route];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><BrandMark size={34} /></div>
        {NAV.map((n) =>
          n.route === 'get-reviews' ? (
            <div key={n.route} className="side-cta">
              <GradientButton label="Get Reviews" icon="qr_code_2" onClick={() => s.go('get-reviews')} />
            </div>
          ) : (
            <button key={n.route} className={`side-item${s.tab === n.route ? ' on' : ''}`} onClick={() => s.go(n.route)}>
              <Icon name={n.icon} fill={s.tab === n.route} />
              {n.label}
            </button>
          ),
        )}
        <div className="side-foot">
          <InitialsAvatar name={owner.name} size={36} photo={s.photo} />
          <div className="grow">
            <div style={{ fontWeight: 800, fontSize: 14 }} className="ellipsis">{owner.name}</div>
            <div className="muted ellipsis" style={{ fontSize: 12.5 }}>Sharma Sweets · Pune</div>
          </div>
        </div>
      </aside>

      <main key={s.route}>{screen}</main>

      {/* Pushed screens cover the bar on phones, like Flutter's root navigator. */}
      {TABS.includes(s.route) && (
      <nav className="bottom-nav">
        <div className="bar">
          {NAV.map((n) =>
            n.route === 'get-reviews' ? (
              <button key={n.route} className={`nav-item center${s.tab === n.route ? ' on' : ''}`} onClick={() => s.go(n.route)}>
                {n.label}
              </button>
            ) : (
              <button key={n.route} className={`nav-item${s.tab === n.route ? ' on' : ''}`} onClick={() => s.go(n.route)}>
                <Icon name={n.icon} fill={s.tab === n.route} />
                {n.label}
              </button>
            ),
          )}
        </div>
        <button className="fab" aria-label="Get Reviews" onClick={() => s.go('get-reviews')}>
          <Icon name="qr_code_2" />
        </button>
      </nav>
      )}
      <div className="preview-tag">PREVIEW · SAMPLE DATA</div>
    </div>
  );
}

export default function App() {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);
  return (
    <StoreProvider>
      <ToastContext.Provider value={show}>
        <Shell />
        {toast && <div className="toast" key={toast}>{toast}</div>}
      </ToastContext.Provider>
    </StoreProvider>
  );
}
