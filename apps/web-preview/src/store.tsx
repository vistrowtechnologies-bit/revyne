import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as data from './data';
import { applyPalette, loadPaletteId } from './theme';

// Tiny hash router: #/home, #/reviews, #/get-reviews, #/google, #/account,
// plus pushed screens #/stats, #/report, #/new-post, #/activity.
export type Route = 'home' | 'reviews' | 'get-reviews' | 'google' | 'account' | 'stats' | 'report' | 'new-post' | 'activity';
export const TABS: Route[] = ['home', 'reviews', 'get-reviews', 'google', 'account'];

function readHash(): { route: Route; query: URLSearchParams } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, q] = raw.split('?');
  const all: Route[] = [...TABS, 'stats', 'report', 'new-post', 'activity'];
  return { route: (all.includes(path as Route) ? path : 'home') as Route, query: new URLSearchParams(q ?? '') };
}

type Store = ReturnType<typeof useStoreState>;
const Ctx = createContext<Store | null>(null);

function useStoreState() {
  const [{ route, query }, setLoc] = useState(readHash);
  const [paletteId, setPaletteId] = useState(() => applyPalette(loadPaletteId()).id);
  const [photo, setPhoto] = useState<string | null>(null);
  const [reviews, setReviews] = useState(data.googleReviews);
  const [feedback, setFeedback] = useState(data.privateFeedback);
  const [posts, setPosts] = useState(data.posts);
  const [scheduled, setScheduled] = useState(data.scheduled);
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
    /** Highlighted nav item: the tab, or the tab a pushed screen came from. */
    tab: TABS.includes(route) ? route : lastTab,
    go: (r: Route, q?: string) => {
      window.location.hash = `/${r}${q ? `?${q}` : ''}`;
    },
    back: () => (window.history.length > 1 ? window.history.back() : (window.location.hash = '/home')),
    paletteId,
    setPalette: (id: string) => setPaletteId(applyPalette(id).id),
    photo,
    setPhoto,
    reviews,
    setReviews,
    feedback,
    setFeedback,
    posts,
    setPosts,
    scheduled,
    setScheduled,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const s = useStoreState();
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx)!;
