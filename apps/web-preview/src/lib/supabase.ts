import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const configMissing = !url || !key;

// PKCE puts the OAuth result in ?code=…, which leaves our #/ hash routes alone.
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
});

export const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;

/** Public review page base (Env.reviewBaseUrl in the app). */
export const REVIEW_BASE_URL = 'https://revyneai.com';
export const reviewLink = (slug: string) => `${REVIEW_BASE_URL}/r/${slug}`;

/**
 * Calls an edge function. Returns its JSON body; on a non-2xx reply throws
 * Error(body.error ?? fallback) like the Dart FunctionException handling.
 */
export async function invoke(name: string, body: Record<string, unknown>, fallback = 'Could not reach Google right now. Please try again.') {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message: string | undefined;
    if (error instanceof FunctionsHttpError) {
      try {
        const j = await error.context.json();
        if (typeof j?.error === 'string') message = j.error;
      } catch {
        /* not JSON */
      }
    }
    throw new Error(message ?? fallback);
  }
  return (data ?? {}) as Record<string, any>;
}
