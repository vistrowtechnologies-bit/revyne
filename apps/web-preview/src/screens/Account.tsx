// lib/features/account/account_screen.dart + theme_picker.dart + business_settings_sheet.dart
import { useRef, useState, type ReactNode } from 'react';
import { useBusiness, useMyPhoto, useStore, useUser } from '../store';
import { invalidate } from '../lib/query';
import { supabase } from '../lib/supabase';
import * as api from '../lib/api';
import { palettes, gradientOf } from '../theme';
import { BrandMark, Card, ConfirmDialog, Gap, Icon, SectionHeader, Sheet, StatusPill, useToast } from '../ui';
import { UserAvatar } from '../widgets';
import { Preferences } from './Onboarding';

function Row({ icon, label, value, onClick, color }: { icon: string; label: string; value?: string; onClick?: () => void; color?: string }) {
  return (
    <button className={`list-row${onClick ? ' tap' : ''}`} onClick={onClick} disabled={!onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <Icon name={icon} size={22} color={color ?? 'var(--violet)'} />
      <span className="grow" style={{ fontWeight: 700, fontSize: 15.5, color: color ?? 'var(--ink)' }}>{label}</span>
      {value && <span className="muted">{value}</span>}
      {onClick && <Icon name="chevron_right" color="var(--outline)" style={{ marginLeft: 6 }} />}
    </button>
  );
}

function Group({ rows }: { rows: ReactNode[] }) {
  return (
    <Card pad={0} className="flat">
      {rows.map((r, i) => (
        <div key={i}>
          {r}
          {i !== rows.length - 1 && <hr className="divider" style={{ marginLeft: 54 }} />}
        </div>
      ))}
    </Card>
  );
}

export default function AccountScreen() {
  const s = useStore();
  const b = useBusiness();
  const user = useUser();
  const photo = useMyPhoto();
  const toast = useToast();
  const [sheet, setSheet] = useState<'theme' | 'photo' | 'settings' | null>(null);
  const [dialog, setDialog] = useState<'delete' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const current = palettes.find((p) => p.id === s.paletteId)!;
  const google = api.googlePhotoUrl(user.user_metadata);
  const usingOwn = !!photo.data && photo.data !== google && photo.data.includes('/avatars/');

  const changePhoto = async (blob: Blob | 'google') => {
    try {
      await api.setProfilePhoto(blob);
      invalidate('photo');
      toast(blob === 'google' ? 'Using your Google photo.' : 'Profile photo updated.');
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <h1 className="h-medium">Account</h1>
      <Gap h={24} />
      <Card>
        <div className="row" style={{ gap: 16 }}>
          <button onClick={() => setSheet('photo')} style={{ position: 'relative' }} aria-label="Change profile photo">
            <UserAvatar size={60} />
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: '50%', background: 'var(--violet)', border: '2px solid #fff', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <Icon name="photo_camera" fill size={13} />
            </span>
          </button>
          <div className="grow" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{(user.user_metadata?.full_name as string) ?? 'Your account'}</div>
            <div className="muted ellipsis">{user.email}</div>
            <div style={{ marginTop: 6 }}><StatusPill label="Free plan" bg="var(--violet50)" fg="var(--violet700)" /></div>
          </div>
        </div>
      </Card>
      <Gap h={24} />
      <SectionHeader title="Business" />
      <Gap h={8} />
      <Group
        rows={[
          <Row icon="storefront" label={b.name} value={b.city ?? undefined} />,
          <Row icon="tune" label="Products, tone & languages" onClick={() => setSheet('settings')} />,
          <Row icon="description" label="Monthly reports" onClick={() => s.go('report')} />,
          <Row icon="bookmarks" label="Reply templates" onClick={() => s.go('templates')} />,
          <Row icon="palette" label="App colour" value={current.name} onClick={() => setSheet('theme')} />,
          <Row icon="history" label="Activity log" onClick={() => s.go('activity')} />,
          <Row icon="notifications" label="Notifications" onClick={() => s.go('notifications')} />,
        ]}
      />
      <Gap h={24} />
      <SectionHeader title="Help & legal" />
      <Gap h={8} />
      <Group
        rows={[
          <Row icon="support_agent" label="Contact support" onClick={() => (window.location.href = 'mailto:hello@vistrow.com?subject=RevYne%20help')} />,
          <Row icon="privacy_tip" label="Privacy policy" onClick={() => window.open('https://vistrow.com/privacy-policy', '_blank', 'noopener')} />,
          <Row icon="description" label="Terms of service" onClick={() => window.open('https://vistrow.com/terms', '_blank', 'noopener')} />,
        ]}
      />
      <Gap h={24} />
      <Group
        rows={[
          <Row icon="logout" label="Sign out" onClick={() => supabase.auth.signOut()} />,
          <Row icon="delete" label={deleting ? 'Deleting…' : 'Delete account'} color="var(--danger)" onClick={deleting ? undefined : () => setDialog('delete')} />,
        ]}
      />
      <Gap h={24} />
      <div style={{ display: 'flex', justifyContent: 'center' }}><BrandMark size={22} /></div>
      <div className="muted" style={{ textAlign: 'center', fontSize: 12.5, marginTop: 6 }}>Made by Vistrow Technologies</div>

      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            const { blob } = await api.shrinkImage(new File([f], f.name, { type: 'image/jpeg' }), 512);
            await changePhoto(blob);
          } catch {
            toast('Could not change the photo right now. Please try again.');
          }
        }}
      />

      {sheet === 'photo' && (
        <Sheet onClose={() => setSheet(null)}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Profile photo</div>
          <Row icon="photo_library" label="Choose a photo" onClick={() => { setSheet(null); file.current?.click(); }} />
          {google && usingOwn && <Row icon="account_circle" label="Use my Google photo" onClick={() => { setSheet(null); changePhoto('google'); }} />}
        </Sheet>
      )}

      {sheet === 'settings' && <SettingsSheet onClose={() => setSheet(null)} />}

      {sheet === 'theme' && (
        <Sheet onClose={() => setSheet(null)}>
          <h2 className="h-small">App colour</h2>
          <div className="muted" style={{ fontSize: 14.5, marginTop: 2 }}>Choose the look of your RevYne. Only changes this browser.</div>
          <Gap h={16} />
          <div className="col" style={{ gap: 8 }}>
            {palettes.map((p) => {
              const on = p.id === s.paletteId;
              return (
                <button
                  key={p.id}
                  className="row"
                  onClick={() => { setSheet(null); s.setPalette(p.id); }}
                  style={{ padding: 12, gap: 16, borderRadius: 18, background: on ? p.shade50 : '#fff', border: `${on ? 2 : 1}px solid ${on ? p.primary : 'var(--line)'}`, textAlign: 'left' }}
                >
                  <span style={{ width: 64, height: 44, borderRadius: 12, background: gradientOf(p), padding: 7, display: 'flex', alignItems: 'flex-end' }}>
                    <span style={{ width: 26, height: 8, borderRadius: 4, background: '#fff' }} />
                  </span>
                  <span className="grow" style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</span>
                  {[p.shade100, p.primary, p.shade700].map((c, i) => <span key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, marginLeft: 4 }} />)}
                  <Icon name={on ? 'check_circle' : 'radio_button_unchecked'} fill={on} color={on ? p.primary : 'var(--line)'} style={{ marginLeft: 8 }} />
                </button>
              );
            })}
          </div>
        </Sheet>
      )}

      {dialog === 'delete' && (
        <ConfirmDialog
          title="Delete your account?"
          body="This permanently deletes your RevYne account, your business, review page visits and private messages, and removes RevYne's access to your Google profile. This cannot be undone."
          action="Delete forever"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            setDialog(null);
            setDeleting(true);
            try {
              await api.deleteAccount();
            } catch (e) {
              toast((e as Error).message || 'Could not delete your account. Please try again.');
              setDeleting(false);
            }
          }}
        />
      )}
    </div>
  );
}

/** Products, reply tone and review languages (the only columns owners edit directly). */
function SettingsSheet({ onClose }: { onClose: () => void }) {
  const b = useBusiness();
  const toast = useToast();
  const [products, setProducts] = useState(b.products);
  const [tone, setTone] = useState(b.replyTone);
  const [languages, setLanguages] = useState(b.reviewLanguages);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet onClose={() => !busy && onClose()}>
      <h2 className="h-small">Business settings</h2>
      <Gap h={24} />
      <Preferences
        compact
        products={products}
        setProducts={setProducts}
        tone={tone}
        setTone={setTone}
        languages={languages}
        setLanguages={setLanguages}
        error={null}
        busy={busy}
        saveLabel="Save changes"
        onSave={async () => {
          setBusy(true);
          try {
            await api.updatePreferences(b.id, { products, reviewLanguages: languages, replyTone: tone });
            invalidate('business');
            onClose();
          } catch {
            setBusy(false);
            toast('Could not save. Check your connection.');
          }
        }}
      />
    </Sheet>
  );
}
