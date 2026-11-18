// React versions of lib/core/widgets/ui.dart.
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { Button, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';

export function Icon({ name, fill, size, color, style }: { name: string; fill?: boolean; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <span className={`ms${fill ? ' fill' : ''}`} style={{ fontSize: size, color, ...style }} aria-hidden>
      {name}
    </span>
  );
}

export function Card({ children, pad = 20, onClick, border, style, className = '' }: { children: ReactNode; pad?: number | string; onClick?: () => void; border?: string; style?: CSSProperties; className?: string }) {
  const s: CSSProperties = { padding: pad, borderColor: border, ...style };
  if (onClick) {
    return (
      <div role="button" tabIndex={0} className={`card tap ${className}`} style={s} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        {children}
      </div>
    );
  }
  return <div className={`card ${className}`} style={s}>{children}</div>;
}

export function GradientCard({ children, pad = 22, onClick, style }: { children: ReactNode; pad?: number | string; onClick?: () => void; style?: CSSProperties }) {
  return (
    <div className={`gcard${onClick ? ' tap' : ''}`} style={{ padding: pad, ...style }} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
}

export function GradientButton({ label, icon, onClick, disabled, busy }: { label: string; icon?: string; onClick?: () => void; disabled?: boolean; busy?: boolean }) {
  return (
    <button className="gbtn" onClick={onClick} disabled={disabled || busy || !onClick}>
      {busy ? <span className="spinner" style={{ width: 22, height: 22 }} /> : <>{icon && <Icon name={icon} />}{label}</>}
    </button>
  );
}

export function BrandMark({ size = 32, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <div className="row" style={{ gap: 10 }}>
      <img src="/logo.png" alt="RevYne" width={size} height={size} style={{ borderRadius: size * 0.26, display: 'block' }} />
      {wordmark && <span style={{ fontSize: size * 0.62, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.3 }}>RevYne</span>}
    </div>
  );
}

export function IconTile({ icon, size = 44, bg, fg, fill }: { icon: string; size?: number; bg?: string; fg?: string; fill?: boolean }) {
  return (
    <div className="icon-tile" style={{ width: size, height: size, borderRadius: size * 0.32, background: bg, color: fg }}>
      <Icon name={icon} fill={fill} size={size * 0.5} />
    </div>
  );
}

export function StatusPill({ label, bg, fg, dot }: { label: string; bg: string; fg: string; dot?: boolean }) {
  return (
    <span className="pill" style={{ background: bg, color: fg }}>
      {dot && <span className="dot" />}
      {label}
    </span>
  );
}

export function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" fill={i <= rating} size={size} />
      ))}
    </span>
  );
}

export function SelectChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button className={`chip${selected ? ' on' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

export function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const color = score >= 80 ? 'var(--success)' : score >= 55 ? 'var(--star)' : 'var(--danger)';
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--violet100)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: 'stroke-dashoffset .6s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: size * 0.32, fontWeight: 800, color }}>{score}</div>
    </div>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-row">
      <span className="section">{title}</span>
      {action && <button className="tbtn" onClick={onAction}>{action}</button>}
    </div>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: string }) {
  return (
    <Card pad={24} style={{ textAlign: 'center' }}>
      {icon && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><IconTile icon={icon} size={56} /></div>}
      <div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div>
      <div className="muted" style={{ fontSize: 14.5, marginTop: 6 }}>{body}</div>
    </Card>
  );
}

export function InitialsAvatar({ name, size = 44, photo }: { name?: string; size?: number; photo?: string | null }) {
  const initials = (name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {photo ? <img src={photo} alt="" /> : initials || <Icon name="person" fill size={size * 0.5} color="var(--violet)" />}
    </div>
  );
}

export function Gap({ h = 16 }: { h?: number }) {
  return <div style={{ height: h, flexShrink: 0 }} />;
}

// ── Sheets, dialogs, toasts ────────────────────────────────────────────────

/**
 * Bottom sheet (a centred card on wide screens). React Aria handles focus
 * trapping, Escape, outside-click, scroll lock and screen-reader semantics.
 */
export function Sheet({ onClose, children, label = 'Details' }: { onClose: () => void; children: ReactNode; label?: string }) {
  return (
    <ModalOverlay className="scrim" isOpen isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="sheet-modal">
        <Dialog className="sheet" aria-label={label}>
          {/* The body scrolls inside the rounded card, so the scrollbar and
              content never run into the corners. */}
          <div className="handle" />
          <div className="sheet-body">{children}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

export function ConfirmDialog({ title, body, action, danger, onCancel, onConfirm }: { title: string; body: string; action: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <ModalOverlay className="scrim scrim-center" isOpen isDismissable onOpenChange={(open) => !open && onCancel()}>
      <Modal className="dialog-modal">
        <Dialog className="dialog" role="alertdialog">
          <Heading slot="title">{title}</Heading>
          <p>{body}</p>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
            {/* Focus starts on Cancel so a stray Enter never posts or deletes. */}
            <Button className="tbtn" onPress={onCancel} autoFocus>Cancel</Button>
            <Button className={`tbtn${danger ? ' danger' : ''}`} onPress={onConfirm}>{action}</Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

export const ToastContext = createContext<(m: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);
