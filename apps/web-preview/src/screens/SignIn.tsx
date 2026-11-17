// Sign-in (lib/features/auth/sign_in_screen.dart), redesigned for the web:
// a brand panel with a live mini-demo of what RevYne does, and a clean
// sign-in panel with Google's own button style.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BrandMark, Icon, useToast } from '../ui';

const POINTS: [string, string][] = [
  ['qr_code_2', 'More genuine Google reviews from a QR code and WhatsApp'],
  ['auto_awesome', 'AI reply drafts in Hindi, Hinglish or English'],
  ['verified_user', 'Nothing is posted to Google without your approval'],
];

const REPLY = 'Thank you so much, Ananya! So glad the Diwali box made your day — see you again soon.';

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/**
 * The product loop in a few seconds: a review arrives → AI drafts a reply →
 * the owner approves → posted. Static (final frame) for reduced motion.
 */
function ReviewDemo() {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // 0 empty · 1 review in · 2 drafting · 3 typing · 4 posted
  const [phase, setPhase] = useState(reduce ? 4 : 0);
  const [typed, setTyped] = useState(reduce ? REPLY.length : 0);

  useEffect(() => {
    if (reduce) return;
    let t: number;
    if (phase === 0) t = window.setTimeout(() => setPhase(1), 500);
    else if (phase === 1) t = window.setTimeout(() => setPhase(2), 1300);
    else if (phase === 2) t = window.setTimeout(() => setPhase(3), 1200);
    else if (phase === 3) {
      if (typed < REPLY.length) t = window.setTimeout(() => setTyped((n) => Math.min(REPLY.length, n + 2)), 28);
      else t = window.setTimeout(() => setPhase(4), 700);
    } else t = window.setTimeout(() => { setTyped(0); setPhase(0); }, 3600);
    return () => window.clearTimeout(t);
  }, [phase, typed, reduce]);

  return (
    <div className="demo" aria-hidden>
      <div className={`demo-card${phase >= 1 ? ' in' : ''}`}>
        <div className="row" style={{ gap: 10 }}>
          <span className="demo-avatar">AK</span>
          <div className="grow">
            <div style={{ fontWeight: 800, fontSize: 14 }}>Ananya K.</div>
            <div className="demo-stars">★★★★★ <span>just now</span></div>
          </div>
          <span className="demo-pill">New Google review</span>
        </div>
        <div className="demo-text">Best kaju katli in Pune! The team packed our Diwali gift box beautifully.</div>
      </div>

      <div className={`demo-card reply${phase >= 2 ? ' in' : ''}`}>
        <div className="row" style={{ gap: 8 }}>
          <span className={`demo-ai${phase === 2 ? ' busy' : ''}`}><Icon name="auto_awesome" fill size={15} /> AI draft</span>
          <span className="grow" />
          {phase === 4 ? (
            <span className="demo-posted"><Icon name="check_circle" fill size={15} /> Approved &amp; posted</span>
          ) : (
            <span className="demo-wait">You approve before posting</span>
          )}
        </div>
        <div className="demo-text reply-text">
          {phase === 2 ? <span className="demo-dots"><i /><i /><i /></span> : REPLY.slice(0, typed)}
          {phase === 3 && <span className="demo-caret" />}
        </div>
      </div>

      <div className={`demo-stat${phase >= 4 ? ' in' : ''}`}>
        <Icon name="trending_up" size={16} /> 23 customers went to Google this week
      </div>
    </div>
  );
}

export default function SignInScreen() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) {
      setBusy(false);
      toast(error.message || 'Could not sign in with Google. Please check your connection and try again.');
    }
    // Otherwise the browser leaves for Google and comes back signed in.
  };

  return (
    <div className="auth">
      <section className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <img src="/logo.png" alt="" width={40} height={40} />
            <span>RevYne</span>
          </div>
          <h1 className="auth-title">
            More Google reviews.
            <br />
            Replies in seconds.
          </h1>
          <p className="auth-sub">RevYne helps local businesses collect genuine reviews, reply with AI drafts you approve, and keep their Google profile strong.</p>
          <ReviewDemo />
        </div>
        <div className="auth-foot">Made in India for local businesses · Vistrow Technologies</div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="hide-wide-auth"><BrandMark size={34} /></div>
          <h2 className="auth-h2">Sign in to RevYne</h2>
          <p className="muted" style={{ margin: '6px 0 24px', fontSize: 15 }}>Use the Google account you want for RevYne. New here? Your account is set up when you first sign in.</p>
          <button className="google-btn" onClick={signIn} disabled={busy}>
            {busy ? <span className="spinner" style={{ color: 'var(--violet)' }} /> : <GoogleG />}
            <span>{busy ? 'Opening Google…' : 'Continue with Google'}</span>
          </button>
          <div className="muted" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, marginTop: 12 }}>Free to start. No sales calls, ever.</div>
          <div className="auth-points">
            {POINTS.map(([icon, text]) => (
              <div key={icon} className="row" style={{ gap: 12 }}>
                <span className="auth-point-icon"><Icon name={icon} size={18} /></span>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{text}</span>
              </div>
            ))}
          </div>
          <div className="auth-legal">
            By continuing you agree to the <a href="https://vistrow.com/terms" target="_blank" rel="noopener">Terms</a> and{' '}
            <a href="https://vistrow.com/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>.
          </div>
        </div>
      </section>
    </div>
  );
}
