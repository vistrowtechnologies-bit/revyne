import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { clearAll, useQuery } from './lib/query';
import * as api from './lib/api';
import { applyPalette, loadPaletteId, palettes } from './theme';

// Hash router: #/home, #/reviews?tab=private, #/get-reviews, #/google, #/account,
// plus pushed screens. Notification routes ("/reviews?tab=private") map 1:1.
export type Route =
  | 'home' | 'reviews' | 'get-reviews' | 'google' | 'account'
  | 'stats' | 'report' | 'new-post' | 'activity' | 'notifications' | 'templates';
export const TABS: Route[] = ['home', 'reviews', 'get-reviews', 'google', 'account'];
const ALL: Route[] = [...TABS, 'stats', 'report', 'new-post', 'activity', 'notifications', 'templates'];

function readHash(): { route: Route; query: URLSearchParams } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, q] = raw.split('?');
  return { route: (ALL.includes(path as Route) ? path : 'home') as Route, query: new URLSearchParams(q ?? '') };
}

function useStoreState() {
  const [{ route, query }, setLoc] = useState(readHash);
  const [paletteId, setPaletteId] = useState(() => applyPalette(loadPaletteId()).id);
  const [lastTab, setLastTab] = useState<Route>(() => (TABS.includes(readHash().route) ? readHash().route : 'home'));

  useEffect(() => {
    const on = () => {
      const l = readHash();
      setLoc(l);
      if (TABS.includes(l.route)) setLastTab(l.route);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  return {
    route,
    query,
    tab: TABS.includes(route) ? route : lastTab,
    /** go('reviews', 'tab=private') or go('/reviews?tab=private') */
    go: (r: string, q?: string) => {
      const path = r.replace(/^\//, '');
      window.location.hash = `/${path}${q ? `?${q}` : ''}`;
    },
    back: () => (window.history.length > 1 ? window.history.back() : (window.location.hash = '/home')),
    paletteId,
    setPalette: (id: string) => setPaletteId(applyPalette(id).id),
  };
}

type Store = ReturnType<typeof useStoreState>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const s = useStoreState();
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}
export const useStore = () => useContext(Ctx)!;

/** The active colour palette (hex values, for components that take colour props). */
export const usePalette = () => {
  const id = useStore().paletteId;
  return palettes.find((p) => p.id === id) ?? palettes[0];
};

// ── Session ────────────────────────────────────────────────────────────────
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession((prev) => {
        if (prev?.user.id !== s?.user.id) clearAll(); // fresh data for each signed-in user
        return s;
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

export const SessionContext = createContext<Session | null>(null);
export const useUser = () => useContext(SessionContext)!.user;

// ── Business (the shell only renders with one) ─────────────────────────────
export const BusinessContext = createContext<api.Business | null>(null);
export const useBusiness = () => useContext(BusinessContext)!;

const notLinked = () => Promise.reject(new api.BlockedError('Link your Google Business Profile first.', 'not_linked'));

// ── Query hooks (the Dart FutureProviders) ─────────────────────────────────
export const useDashboard = () => {
  const b = useBusiness();
  return useQuery('dashboard', () => api.dashboardStats(b.id));
};
export const useFeedback = () => {
  const b = useBusiness();
  return useQuery('feedback', () => api.feedback(b.id));
};
export const useVisits = () => {
  const b = useBusiness();
  return useQuery('visits', () => api.visits(b.id));
};
export const useGoogleReviews = () => {
  const b = useBusiness();
  return useQuery('greviews', () => (b.isVerified ? api.listReviews() : (notLinked() as Promise<api.ReviewsPage>)));
};
export const useProfile = () => {
  const b = useBusiness();
  return useQuery('profile', () => (b.isVerified ? api.getProfile() : (notLinked() as Promise<api.ProfileView>)));
};
export const usePosts = () => {
  const b = useBusiness();
  return useQuery('posts', () => (b.isVerified ? api.listPosts() : (notLinked() as Promise<api.GbpPost[]>)));
};
export const useScheduled = () => {
  const b = useBusiness();
  return useQuery('scheduled', () => (b.isVerified ? api.scheduledPosts(b.id) : Promise.resolve([])));
};
export const usePhotos = () => {
  const b = useBusiness();
  return useQuery('photos', () => (b.isVerified ? api.listPhotos() : (notLinked() as Promise<{ photos: api.GbpPhoto[]; total: number }>)));
};
export const useInsights = (range: { days: number; start?: Date; end?: Date }) => {
  const b = useBusiness();
  const k = range.start && range.end ? `${api.isoDate(range.start)}_${api.isoDate(range.end)}` : `${range.days}`;
  return useQuery(`insights:${k}`, () => (b.isVerified ? api.insights(range) : (notLinked() as Promise<api.Insights>)));
};
export const useReport = (month: Date) => useQuery(`report:${month.getFullYear()}-${month.getMonth() + 1}`, () => api.monthlyReport(month));
export const useActivity = () => {
  const b = useBusiness();
  return useQuery('activity', () => api.activity(b.id));
};
export const useNotifications = () => useQuery('notifications', api.notifications);
export const useTemplates = () => {
  const b = useBusiness();
  return useQuery('templates', () => api.templates(b.id));
};
export const useMyPhoto = () => useQuery('photo', api.myPhotoUrl);
