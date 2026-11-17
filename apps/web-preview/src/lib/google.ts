// Web connect for the Google Business Profile: Google Identity Services code
// flow in a popup; gbp-connect exchanges the code with redirect "postmessage".
import { GOOGLE_WEB_CLIENT_ID } from './supabase';
import { exchangeCode, type ConnectResult } from './api';

export const BUSINESS_MANAGE = 'https://www.googleapis.com/auth/business.manage';

/** Thrown when the owner closes the Google popup (GoogleCancelled in Dart). */
export class GoogleCancelled extends Error {}

declare global {
  interface Window {
    google?: any;
  }
}

let gisLoading: Promise<void> | null = null;
function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisLoading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisLoading = null;
      reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
    };
    document.head.appendChild(s);
  });
  return gisLoading;
}

/** Account picker → consent for business.manage (offline) → server stores the refresh token and lists locations. */
export async function connectGoogleProfile(): Promise<ConnectResult> {
  if (!GOOGLE_WEB_CLIENT_ID) throw new Error('Google connect is not configured (VITE_GOOGLE_WEB_CLIENT_ID).');
  await loadGis();
  const code = await new Promise<string>((resolve, reject) => {
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_WEB_CLIENT_ID,
      scope: BUSINESS_MANAGE,
      ux_mode: 'popup',
      select_account: true,
      callback: (resp: { code?: string; error?: string; scope?: string }) => {
        if (resp.code) resolve(resp.code);
        else if (resp.error === 'access_denied') reject(new Error('Google did not grant access. Please try again.'));
        else reject(new Error('Google did not grant access. Please try again.'));
      },
      error_callback: (err: { type?: string }) => {
        if (err?.type === 'popup_closed') reject(new GoogleCancelled());
        else if (err?.type === 'popup_failed_to_open') reject(new Error('Allow pop-ups for this site, then try again.'));
        else reject(new Error('Could not open Google. Please try again.'));
      },
    });
    client.requestCode();
  });
  return exchangeCode(code);
}
