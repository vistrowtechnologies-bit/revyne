// lib/features/get_reviews/get_reviews_screen.dart
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useBusiness } from '../store';
import { reviewLink } from '../lib/supabase';
import { openWhatsApp, reviewRequestMessage } from '../lib/options';
import { downloadPoster } from '../lib/pdf';
import { BrandMark, Card, Gap, GradientButton, Icon, SectionHeader, SelectChip, useToast } from '../ui';

export default function GetReviewsScreen() {
  return (
    <div className="page">
      <h1 className="h-medium">Get Reviews</h1>
      <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>
        Ask every customer — happy or not — to share their experience. They post it on Google themselves.
      </div>
      <Gap h={24} />
      <div className="wide-2">
        <PosterCard />
        <div className="col">
          <div className="hide-wide"><Gap h={24} /></div>
          <SectionHeader title="Ask a customer on WhatsApp" />
          <Gap h={8} />
          <WhatsAppForm />
        </div>
      </div>
    </div>
  );
}

function PosterCard() {
  const b = useBusiness();
  const toast = useToast();
  const link = reviewLink(b.publicSlug);
  const [format, setFormat] = useState<'A5' | 'A4'>('A5');
  const [busy, setBusy] = useState(false);
  return (
    <Card pad={16}>
      {/* Poster preview — mirrors the printed PDF. */}
      <div style={{ padding: 14, background: 'var(--gradient)', borderRadius: 18 }}>
        <div style={{ padding: '22px 20px', background: '#fff', borderRadius: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{b.name}</div>
          {b.city && <div className="muted" style={{ fontSize: 13 }}>{b.city}</div>}
          <Gap h={14} />
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--violet)', lineHeight: 1.25 }}>Share your experience<br />on Google</div>
          <Gap h={14} />
          <div style={{ padding: 10, border: '1.5px solid var(--line)', borderRadius: 16 }}>
            <QRCodeSVG value={link} size={150} level="M" />
          </div>
          <Gap h={10} />
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>Scan with your phone camera</div>
          <Gap h={10} />
          <BrandMark size={18} />
        </div>
      </div>
      <Gap h={16} />
      <div className="row" style={{ gap: 8 }}>
        {(['A5', 'A4'] as const).map((f) => <SelectChip key={f} label={f} selected={format === f} onClick={() => setFormat(f)} />)}
        <div className="grow" />
        <button className="ibtn" title="Copy link" onClick={() => { navigator.clipboard?.writeText(link); toast('Review link copied'); }}>
          <Icon name="link" color="var(--violet)" />
        </button>
      </div>
      <Gap h={8} />
      <GradientButton
        label="Download poster PDF"
        icon="download"
        busy={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await downloadPoster(b, link, format);
          } catch {
            toast('Could not create the poster. Please try again.');
          } finally {
            setBusy(false);
          }
        }}
      />
    </Card>
  );
}

function WhatsAppForm() {
  const b = useBusiness();
  const link = reviewLink(b.publicSlug);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const valid = phone.replace(/\D/g, '').length >= 10;
  const message = reviewRequestMessage(b.name, link, name);
  return (
    <Card>
      <div className="field">
        <span className="lead"><Icon name="person" /></span>
        <input className="input has-icon" placeholder="Customer name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Gap h={12} />
      <div className="field">
        <span className="lead"><Icon name="call" /><b>+91</b></span>
        <input className="input" style={{ paddingLeft: 92 }} inputMode="tel" placeholder="WhatsApp number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Gap h={16} />
      <div style={{ padding: 14, background: 'var(--violet50)', borderRadius: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--violet700)', letterSpacing: 0.8 }}>MESSAGE PREVIEW</div>
        <div style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.45, wordBreak: 'break-word' }}>{message}</div>
      </div>
      <Gap h={16} />
      <GradientButton
        label="Open in WhatsApp"
        icon="send"
        onClick={valid ? () => { openWhatsApp(message, phone); setName(''); setPhone(''); } : undefined}
      />
      <Gap h={8} />
      <div className="muted" style={{ fontSize: 12.5, textAlign: 'center' }}>You press send in your own WhatsApp. Only message customers who visited you.</div>
    </Card>
  );
}
