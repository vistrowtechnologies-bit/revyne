// A tiny cache for server data: useQuery(key, fn) + invalidate(prefix).
// Keeps the last data while reloading; no automatic retry (errors are shown).
import { useEffect, useReducer } from 'react';

type Entry = { data?: unknown; error?: unknown; loading: boolean; promise?: Promise<unknown>; fn: () => Promise<unknown>; subs: Set<() => void>; gen: number };
const cache = new Map<string, Entry>();

function notify(e: Entry) {
  e.subs.forEach((s) => s());
}

function load(key: string, e: Entry) {
  const gen = ++e.gen;
  e.loading = true;
  const p = e.fn().then(
    (d) => {
      if (gen !== e.gen) return;
      e.data = d;
      e.error = undefined;
      e.loading = false;
      notify(e);
    },
    (err) => {
      if (gen !== e.gen) return;
      e.error = err;
      e.loading = false;
      notify(e);
    },
  );
  e.promise = p;
  cache.set(key, e);
  return p;
}

export function useQuery<T>(key: string | null, fn: () => Promise<T>) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  let e = key ? cache.get(key) : undefined;
  if (key && !e) {
    e = { loading: true, fn, subs: new Set(), gen: 0 };
    cache.set(key, e);
    load(key, e);
  }
  if (e) e.fn = fn;

  useEffect(() => {
    if (!key) return;
    const entry = cache.get(key)!;
    entry.subs.add(force);
    return () => {
      entry.subs.delete(force);
    };
  }, [key]);

  return {
    data: e?.data as T | undefined,
    error: e?.error as Error | undefined,
    loading: !!e?.loading,
    reload: () => (key && e ? load(key, e) : Promise.resolve()),
  };
}

/** Reloads (or drops, when unused) every cached query whose key starts with a prefix. */
export function invalidate(...prefixes: string[]) {
  const all: Promise<unknown>[] = [];
  for (const [key, e] of cache) {
    if (!prefixes.some((p) => key === p || key.startsWith(p + ':'))) continue;
    if (e.subs.size > 0) all.push(load(key, e));
    else cache.delete(key);
  }
  return Promise.all(all);
}

export function clearAll() {
  cache.clear();
}

/** Reads a cached value without subscribing (e.g. the business in an action). */
export function peek<T>(key: string) {
  return cache.get(key)?.data as T | undefined;
}
