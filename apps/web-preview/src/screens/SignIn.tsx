// lib/features/auth/sign_in_screen.dart — Google sign-in through Supabase Auth.
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GradientButton, IconTile, useToast } from '../ui';
import { usePalette } from '../store';
import SoftAurora from '../components/reactbits/SoftAurora';

const POINTS: [string, string][] = [
  ['qr_code_2', 'More genuine Google reviews from a QR code and WhatsApp'],
  ['auto_awesome', 'AI reply drafts in Hindi, Hinglish or English'],
  ['verified_user', 'Nothing is posted to Google without your approval'],
];

export default function SignInScreen() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const p = usePalette();

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
    <div className="signin">
      <div className="signin-card">
        <div className="signin-hero">
          {/* Calm moving light over the brand gradient (React Bits Soft Aurora; slows down for reduced motion). */}
          <SoftAurora className="signin-aurora" color1="#ffffff" color2={p.shade200} speed={0.35} spectrum={0} brightness={1} enableMouseInteraction={false} clickPulse={false} opacity={0.75} />
          <img src="/logo.png" alt="RevYne" width={84} height={84} style={{ borderRadius: 24, border: '2px solid rgba(255,255,255,.6)', boxShadow: '0 14px 30px rgba(18,7,49,.33)' }} />
          <h1 style={{ color: '#fff', fontSize: 34, fontWeight: 800, lineHeight: 1.12, letterSpacing: -0.6, margin: '24px 0 8px' }}>
            Grow your business
            <br />
            on Google
          </h1>
          <div style={{ color: 'rgba(255,255,255,.9)', fontSize: 16.5 }}>More reviews, faster replies, a stronger profile.</div>
        </div>
        <div className="signin-body">
          {POINTS.map(([icon, text]) => (
            <div key={icon} className="row" style={{ gap: 12, marginBottom: 16 }}>
              <IconTile icon={icon} size={40} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{text}</span>
            </div>
          ))}
          <div className="grow" />
          <GradientButton label="Continue with Google" icon="login" busy={busy} onClick={signIn} />
          <div className="muted" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, marginTop: 12 }}>Free to start. No sales calls, ever.</div>
        </div>
      </div>
    </div>
  );
}
