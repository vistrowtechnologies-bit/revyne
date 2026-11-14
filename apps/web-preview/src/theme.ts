// Copied from apps/mobile/lib/core/theme/palettes.dart. Applied as CSS variables
// on <html>, so switching palette recolours the whole preview instantly.

export type Palette = {
  id: string;
  name: string;
  start: string;
  primary: string;
  end: string;
  shade50: string;
  shade100: string;
  shade200: string;
  shade600: string;
  shade700: string;
  shade900: string;
  background: string;
  line: string;
};

export const palettes: Palette[] = [
  {
    id: 'royal', name: 'Royal',
    start: '#B02FE5', primary: '#6334E2', end: '#363DDD',
    shade50: '#F5F2FC', shade100: '#E8E2F9', shade200: '#CFC1F6', shade600: '#461BBB', shade700: '#391698', shade900: '#1E0B50',
    background: '#F7F6FC', line: '#E4E1F2',
  },
  {
    id: 'ocean', name: 'Ocean',
    start: '#0891B2', primary: '#2563EB', end: '#1E3A8A',
    shade50: '#EFF6FF', shade100: '#DBEAFE', shade200: '#BFDBFE', shade600: '#1D4ED8', shade700: '#1E40AF', shade900: '#172554',
    background: '#F5F8FD', line: '#E0E7F3',
  },
  {
    id: 'emerald', name: 'Emerald',
    start: '#0D9488', primary: '#047857', end: '#064E3B',
    shade50: '#ECFDF5', shade100: '#D1FAE5', shade200: '#A7F3D0', shade600: '#065F46', shade700: '#064E3B', shade900: '#022C22',
    background: '#F4FAF7', line: '#DCEBE4',
  },
  {
    id: 'coral', name: 'Coral',
    start: '#F97316', primary: '#BE123C', end: '#881337',
    shade50: '#FFF1F2', shade100: '#FFE4E6', shade200: '#FECDD3', shade600: '#9F1239', shade700: '#881337', shade900: '#4C0519',
    background: '#FCF7F7', line: '#F1E1E4',
  },
  {
    id: 'midnight', name: 'Midnight',
    start: '#475569', primary: '#1E293B', end: '#0B1120',
    shade50: '#F1F5F9', shade100: '#E2E8F0', shade200: '#CBD5E1', shade600: '#0F172A', shade700: '#0F172A', shade900: '#020617',
    background: '#F6F7F9', line: '#E2E5EA',
  },
];

export const gradientOf = (p: Palette) => `linear-gradient(135deg, ${p.start}, ${p.primary}, ${p.end})`;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

const KEY = 'revyne-preview-palette';

export function loadPaletteId(): string {
  try {
    return localStorage.getItem(KEY) ?? 'royal';
  } catch {
    return 'royal';
  }
}

export function applyPalette(id: string) {
  const p = palettes.find((x) => x.id === id) ?? palettes[0];
  const s = document.documentElement.style;
  s.setProperty('--magenta', p.start);
  s.setProperty('--violet', p.primary);
  s.setProperty('--indigo', p.end);
  s.setProperty('--violet50', p.shade50);
  s.setProperty('--violet100', p.shade100);
  s.setProperty('--violet200', p.shade200);
  s.setProperty('--violet600', p.shade600);
  s.setProperty('--violet700', p.shade700);
  s.setProperty('--violet900', p.shade900);
  s.setProperty('--bg', p.background);
  s.setProperty('--line', p.line);
  s.setProperty('--gradient', gradientOf(p));
  s.setProperty('--glow-rgb', hexToRgb(p.shade600));
  try {
    localStorage.setItem(KEY, p.id);
  } catch {
    /* preview only */
  }
  return p;
}
