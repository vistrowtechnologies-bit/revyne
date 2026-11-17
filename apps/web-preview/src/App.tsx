import { useCallback, useRef, useState } from 'react';
import { BusinessContext, SessionContext, StoreProvider, TABS, useSession, useStore, useUser, type Route } from './store';
import { useQuery } from './lib/query';
import { fetchMyBusiness } from './lib/api';
import { configMissing } from './lib/supabase';
import { BrandMark, GradientButton, Icon, ToastContext } from './ui';
import { UserAvatar } from './widgets';
import SignInScreen from './screens/SignIn';
import OnboardingScreen from './screens/Onboarding';
import HomeScreen from './screens/Home';
import ReviewsScreen from './screens/Reviews';
import GetReviewsScreen from './screens/GetReviews';
import GoogleScreen from './screens/Google';
import StatsScreen from './screens/Stats';
import ReportScreen from './screens/Report';
import CreatePostScreen from './screens/CreatePost';
import AccountScreen from './screens/Account';
import ActivityScreen from './screens/Activity';
import NotificationsScreen from './screens/Notifications';
import TemplatesScreen from './screens/Templates';

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
  const user = useUser();

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
    notifications: <NotificationsScreen />,
    templates: <TemplatesScreen />,
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
        <button className="side-foot" onClick={() => s.go('account')} style={{ textAlign: 'left' }}>
          <UserAvatar size={36} />
          <div className="grow">
            <div style={{ fontWeight: 800, fontSize: 14 }} className="ellipsis">{(user.user_metadata?.full_name as string) ?? 'Your account'}</div>
            <div className="muted ellipsis" style={{ fontSize: 12.5 }}>{user.email}</div>
          </div>
        </button>
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
    </div>
  );
}

/** Splash while the account loads (router.dart _LoadingScreen). */
export function Splash() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient)', display: 'grid', placeItems: 'center', color: '#fff' }}>
      <div className="col" style={{ alignItems: 'center' }}>
        <img src="/logo.png" alt="" width={104} height={104} style={{ borderRadius: 28 }} />
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.4, marginTop: 16 }}>RevYne</div>
        <span className="spinner" style={{ width: 24, height: 24, marginTop: 32 }} />
      </div>
    </div>
  );
}

/** Gate (router.dart): signed out → sign-in; business unknown → loading/error; none → onboarding. */
function Gate() {
  const session = useSession();
  const business = useQuery(session ? `business:${session.user.id}` : null, fetchMyBusiness);

  if (configMissing) {
    return (
      <div className="page narrow" style={{ paddingTop: 80 }}>
        <h1 className="h-small">Missing configuration</h1>
        <p className="muted">Create apps/web-preview/.env.local from .env.example (Supabase URL and publishable key), then restart the dev server.</p>
      </div>
    );
  }
  if (session === undefined) return <Splash />;
  if (!session) return <SignInScreen />;

  return (
    <SessionContext.Provider value={session}>
      {business.data === undefined && business.error ? (
        <div className="page narrow" style={{ paddingTop: 80, textAlign: 'center' }}>
          <Icon name="cloud_off" size={48} color="var(--outline)" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Couldn't load your account</h2>
          <p className="muted">Check your internet connection and try again.</p>
          <div style={{ maxWidth: 240, margin: '0 auto' }}><GradientButton label="Try again" onClick={business.reload} /></div>
        </div>
      ) : business.data === undefined ? (
        <Splash />
      ) : business.data === null ? (
        <OnboardingScreen onDone={business.reload} />
      ) : (
        <BusinessContext.Provider value={business.data}>
          <Shell />
        </BusinessContext.Provider>
      )}
    </SessionContext.Provider>
  );
}

export default function App() {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setToast(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);
  return (
    <StoreProvider>
      <ToastContext.Provider value={show}>
        <Gate />
        {toast && <div className="toast" key={toast}>{toast}</div>}
      </ToastContext.Provider>
    </StoreProvider>
  );
}

