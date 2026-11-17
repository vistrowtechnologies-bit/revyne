// lib/features/onboarding/* — connect Google Business Profile → choose location
// → products, tone and languages → QR ready.
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase, reviewLink } from '../lib/supabase';
import * as api from '../lib/api';
import { connectGoogleProfile, GoogleCancelled } from '../lib/google';
import { MAX_PRODUCTS, MAX_REVIEW_LANGUAGES, openWhatsApp, REPLY_TONES, REVIEW_LANGUAGES, reviewRequestMessage } from '../lib/options';
import { Card, Gap, GradientButton, Icon, SectionHeader, SelectChip, useToast } from '../ui';
import { usePalette } from '../store';
import StatusMark from '../components/reactbits/StatusMark';
import ShinyText from '../components/reactbits/ShinyText';

type Step = 'connect' | 'choose' | 'preferences' | 'done';
const STEPS: Step[] = ['connect', 'choose', 'preferences', 'done'];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>('connect');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<api.ConnectStatus | null>(null);
  const [locations, setLocations] = useState<api.LocationOption[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [business, setBusiness] = useState<api.Business | null>(null);
  const [products, setProducts] = useState<string[]>([]);
  const [tone, setTone] = useState('friendly');
  const [languages, setLanguages] = useState<string[]>(['en', 'hi']);
  const [error, setError] = useState<string | null>(null);
  const pal = usePalette();

  const apply = (r: api.ConnectResult) => {
    if (r.status === 'already_has_business') {
      setBusy(false);
      onDone(); // finished elsewhere — open the app
      return;
    }
    const has = r.status === 'ok' && r.locations.length > 0;
    setBusy(false);
    setStatus(r.status);
    setLocations(r.locations);
    setStep(has ? 'choose' : 'connect');
  };

  const run = async (call: () => Promise<api.ConnectResult>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      apply(await call());
    } catch (e) {
      setBusy(false);
      if (!(e instanceof GoogleCancelled)) setError((e as Error).message || 'Could not connect to Google. Check your connection and try again.');
    }
  };

  const claim = async (o: api.LocationOption) => {
    if (claiming || o.takenByOther) return;
    setClaiming(o.location);
    setError(null);
    try {
      const r = await api.claimLocation(o);
      if (r.status === 'ok' && r.business) {
        setBusiness(r.business);
        setProducts(r.business.products);
        setTone(r.business.replyTone);
        setLanguages(r.business.reviewLanguages);
        setStep('preferences');
      } else if (r.status === 'already_has_business') onDone();
      else if (r.status === 'location_taken') setError('This business is already connected to another RevYne account.');
      else if (r.status === 'api_not_approved' || r.status === 'reconnect') {
        setStatus(r.status);
        setStep('connect');
      } else setError('Google could not confirm you manage this business. Try reconnecting.');
    } catch (e) {
      setError((e as Error).message || 'Could not connect this business. Please try again.');
    } finally {
      setClaiming(null);
    }
  };

  const save = async () => {
    if (!business || busy) return;
    setBusy(true);
    setError(null);
    try {
      setBusiness(await api.updatePreferences(business.id, { products, reviewLanguages: languages, replyTone: tone }));
      setStep('done');
    } catch {
      setError('Could not save. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="appbar" style={{ maxWidth: 640 }}>
        {step === 'choose' && <button className="ibtn" aria-label="Back" onClick={() => setStep('connect')}><Icon name="arrow_back" /></button>}
        <h1 style={{ paddingLeft: 8 }}>Set up your business</h1>
        {step !== 'done' && <button className="ibtn" title="Sign out" onClick={() => supabase.auth.signOut()}><Icon name="logout" /></button>}
      </header>
      <div className="page pushed" style={{ maxWidth: 640 }}>
        <div className="row" style={{ gap: 6 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 5, borderRadius: 999, background: i <= STEPS.indexOf(step) ? 'var(--gradient)' : 'var(--violet100)' }} />
          ))}
        </div>
        <Gap h={24} />
        {step === 'connect' && <ConnectStep busy={busy} status={status} error={error} onConnect={() => run(connectGoogleProfile)} onRetry={() => run(api.gbpLocations)} />}
        {step === 'choose' && (
          <>
            <h2 className="h-small">Choose your business</h2>
            <div className="muted" style={{ marginTop: 4 }}>These are the Business Profiles your Google account manages.</div>
            <Gap h={16} />
            <div className="col" style={{ gap: 8 }}>
              {locations.map((l) => (
                <Card key={l.location} pad={16} onClick={l.takenByOther || claiming ? undefined : () => claim(l)} style={{ opacity: l.takenByOther ? 0.6 : 1 }}>
                  <div className="row" style={{ gap: 16 }}>
                    <Icon name="storefront" fill color="var(--violet)" />
                    <div className="grow">
                      <div style={{ fontWeight: 600 }}>{l.title || 'Unnamed business'}</div>
                      <div className="muted" style={{ fontSize: 14 }}>{l.takenByOther ? 'Already connected to another RevYne account' : l.city ?? ''}</div>
                    </div>
                    {claiming === l.location ? <span className="spinner" style={{ color: 'var(--violet)' }} /> : <Icon name="chevron_right" />}
                  </div>
                </Card>
              ))}
            </div>
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button className="tbtn" onClick={() => setStep('connect')}>Use a different Google account</button>
            </div>
          </>
        )}
        {step === 'preferences' && (
          <Preferences
            products={products}
            setProducts={setProducts}
            tone={tone}
            setTone={setTone}
            languages={languages}
            setLanguages={setLanguages}
            error={error}
            busy={busy}
            onSave={save}
          />
        )}
        {step === 'done' && business && (
          <>
            <StatusMark status="done" size={44} strokeWidth={2.4} color={pal.primary} doneColor={pal.primary} fillOpacity={0.1} label="" />
            <h2 className="h-small" style={{ marginTop: 8 }}>
              {business.name} <ShinyText text="is connected!" color={pal.primary} shineColor={pal.shade200} speed={2.4} />
            </h2>
            <div className="muted" style={{ marginTop: 4 }}>Customers scan this QR code to share their experience and post it on Google themselves.</div>
            <Gap h={16} />
            <ReviewLinkCard business={business} />
            <Gap h={24} />
            <GradientButton label="Go to my dashboard" onClick={onDone} />
          </>
        )}
      </div>
    </div>
  );
}

function ConnectStep({ busy, status, error, onConnect, onRetry }: { busy: boolean; status: api.ConnectStatus | null; error: string | null; onConnect: () => void; onRetry: () => void }) {
  const access: [string, string][] = [
    ['reviews', 'Read your Google reviews'],
    ['reply', 'Post replies — only the ones you approve'],
    ['photo_library', 'Publish posts, offers and photos you create'],
    ['insights', 'Show calls, directions and searches insights'],
  ];
  const notice: [string, string, string] | null =
    status === 'api_not_approved'
      ? ['hourglass_top', 'Google is still reviewing RevYne', 'Your account is connected. Google is reviewing RevYne\'s access to Business Profiles — once approved, tap "Check again" to finish setup.']
      : status === 'ok'
        ? ['search_off', 'No Business Profile on this account', "This Google account doesn't manage any Business Profile. Connect the account that does."]
        : status === 'missing_scope'
          ? ['lock', 'Permission needed', 'RevYne needs permission to manage your Business Profile. Please connect again and allow access.']
          : status === 'no_refresh_token'
            ? ['refresh', 'Reconnect needed', 'Remove RevYne at myaccount.google.com/permissions, then connect again.']
            : status === 'reconnect'
              ? ['link_off', 'Please connect again', 'Your Google connection expired.']
              : null;
  return (
    <>
      <h2 className="h-small">Connect your Google Business Profile</h2>
      <div className="muted" style={{ marginTop: 4 }}>Choose the Google account that manages your business on Google. It can be different from the one you signed in with.</div>
      <Gap h={16} />
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>RevYne will be able to:</div>
        {access.map(([icon, text]) => (
          <div key={icon} className="row" style={{ gap: 12, marginBottom: 8 }}>
            <Icon name={icon} fill size={20} color="var(--violet)" />
            <span>{text}</span>
          </div>
        ))}
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Nothing is changed on Google without your approval. You can disconnect anytime.</div>
      </Card>
      {notice && (
        <>
          <Gap h={16} />
          <Card pad={16} style={{ background: 'var(--amber-soft)', boxShadow: 'none' }}>
            <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <Icon name={notice[0]} />
              <div>
                <div style={{ fontWeight: 700 }}>{notice[1]}</div>
                <div style={{ fontSize: 13, marginTop: 2 }}>{notice[2]}</div>
              </div>
            </div>
          </Card>
        </>
      )}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Gap h={24} />
      <GradientButton label={status == null ? 'Connect Google Business Profile' : 'Connect a different account'} icon="storefront" busy={busy} onClick={onConnect} />
      {status === 'api_not_approved' && (
        <>
          <Gap h={8} />
          <button className="obtn" disabled={busy} onClick={onRetry}>Check again</button>
        </>
      )}
    </>
  );
}

export function Preferences(p: {
  products: string[];
  setProducts: (v: string[]) => void;
  tone: string;
  setTone: (v: string) => void;
  languages: string[];
  setLanguages: (v: string[]) => void;
  error: string | null;
  busy: boolean;
  onSave: () => void;
  saveLabel?: string;
  compact?: boolean;
}) {
  const [text, setText] = useState('');
  const atLimit = p.products.length >= MAX_PRODUCTS;
  const add = () => {
    const v = text.trim();
    if (!v || v.length > 60 || atLimit || p.products.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    p.setProducts([...p.products, v]);
    setText('');
  };
  const toggle = (code: string) => {
    if (p.languages.includes(code)) {
      if (p.languages.length > 1) p.setLanguages(p.languages.filter((c) => c !== code));
    } else if (p.languages.length < MAX_REVIEW_LANGUAGES) p.setLanguages([...p.languages, code]);
  };
  return (
    <>
      {p.compact ? <SectionHeader title="Products & services" /> : (
        <>
          <h2 className="h-small">What do customers come to you for?</h2>
          <div className="muted" style={{ marginTop: 4 }}>Customers can tap these when writing their review, so it reflects their real visit.</div>
        </>
      )}
      <Gap h={p.compact ? 8 : 16} />
      <div className="field">
        <input
          className="input"
          style={{ paddingRight: 52 }}
          disabled={atLimit}
          value={text}
          maxLength={60}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={atLimit ? `Limit of ${MAX_PRODUCTS} reached` : 'e.g. Kaju katli, Haircut, Eye test'}
        />
        <button className="ibtn" onClick={add} disabled={atLimit} style={{ position: 'absolute', right: 8, top: 7 }}><Icon name="add" color="var(--violet)" /></button>
      </div>
      <Gap h={8} />
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {p.products.map((x) => (
          <span key={x} className="row" style={{ gap: 4, padding: '6px 8px 6px 14px', borderRadius: 999, background: 'var(--violet50)', fontWeight: 600, fontSize: 14 }}>
            {x}
            <button className="ibtn" style={{ width: 24, height: 24 }} title="Remove" onClick={() => p.setProducts(p.products.filter((y) => y !== x))}><Icon name="close" size={16} /></button>
          </span>
        ))}
      </div>
      <Gap h={24} />
      <SectionHeader title={p.compact ? 'Reply tone' : 'How should replies sound?'} />
      <Gap h={8} />
      {p.compact ? (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {REPLY_TONES.map(([v, l]) => <SelectChip key={v} label={l} selected={p.tone === v} onClick={() => p.setTone(v)} />)}
        </div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {REPLY_TONES.map(([v, l, ex]) => (
            <Card key={v} pad="12px 16px" onClick={() => p.setTone(v)} style={{ background: p.tone === v ? 'var(--violet50)' : undefined }}>
              <div className="row" style={{ gap: 12 }}>
                <Icon name={p.tone === v ? 'radio_button_checked' : 'radio_button_unchecked'} color="var(--violet)" />
                <div>
                  <div style={{ fontWeight: 700 }}>{l}</div>
                  <div className="muted" style={{ fontSize: 13 }}>"{ex}"</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Gap h={p.compact ? 24 : 16} />
      <SectionHeader title="Review languages for customers" />
      {!p.compact && <div className="muted" style={{ fontSize: 13 }}>{p.languages.length} selected (up to {MAX_REVIEW_LANGUAGES})</div>}
      <Gap h={8} />
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {REVIEW_LANGUAGES.map(([c, l]) => <SelectChip key={c} label={l} selected={p.languages.includes(c)} onClick={() => toggle(c)} />)}
      </div>
      {p.error && <p style={{ color: 'var(--danger)' }}>{p.error}</p>}
      <Gap h={24} />
      <GradientButton label={p.saveLabel ?? 'Save and finish'} busy={p.busy} onClick={p.onSave} />
    </>
  );
}

/** QR code + link for the review page, with copy and WhatsApp (review_link_card.dart). */
function ReviewLinkCard({ business }: { business: api.Business }) {
  const toast = useToast();
  const link = reviewLink(business.publicSlug);
  return (
    <Card style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><QRCodeSVG value={link} size={200} /></div>
      <div className="muted" style={{ fontSize: 13, marginTop: 8, userSelect: 'all' }}>{link}</div>
      <Gap h={16} />
      <div className="row" style={{ gap: 12 }}>
        <button className="obtn" style={{ flex: 1 }} onClick={() => { navigator.clipboard?.writeText(link); toast('Link copied'); }}><Icon name="content_copy" />Copy</button>
        <div style={{ flex: 1 }}><GradientButton label="WhatsApp" icon="share" onClick={() => openWhatsApp(reviewRequestMessage(business.name, link))} /></div>
      </div>
    </Card>
  );
}
