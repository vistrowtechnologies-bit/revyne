import type { ReactNode } from 'react';
import { useStore } from '../store';
import { Icon } from '../ui';

/** Flutter AppBar for pushed screens: back arrow, bold title, optional action. */
export function AppBar({ title, action, maxWidth }: { title: string; action?: ReactNode; maxWidth?: number }) {
  const s = useStore();
  return (
    <header className="appbar" style={maxWidth ? { maxWidth } : undefined}>
      <button className="ibtn" aria-label="Back" onClick={s.back}><Icon name="arrow_back" /></button>
      <h1 style={{ paddingLeft: 8 }}>{title}</h1>
      {action}
    </header>
  );
}
