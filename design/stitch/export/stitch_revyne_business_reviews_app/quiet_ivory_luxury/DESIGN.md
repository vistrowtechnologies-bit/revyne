---
name: Quiet Ivory Luxury
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#534434'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#867461'
  outline-variant: '#d8c3ad'
  surface-tint: '#855300'
  primary: '#855300'
  on-primary: '#ffffff'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#ffb95f'
  secondary: '#5f5c73'
  on-secondary: '#ffffff'
  secondary-container: '#e1dcf8'
  on-secondary-container: '#636078'
  tertiary: '#00658b'
  on-tertiary: '#ffffff'
  tertiary-container: '#1abdff'
  on-tertiary-container: '#004966'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#e4dffb'
  secondary-fixed-dim: '#c8c3df'
  on-secondary-fixed: '#1b192d'
  on-secondary-fixed-variant: '#47445b'
  tertiary-fixed: '#c5e7ff'
  tertiary-fixed-dim: '#7fd0ff'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#004c6a'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  display-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  numeral-stat:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system embodies an understated, quiet luxury tailored for high-end commerce. Rooted in minimalist restraint, the aesthetic blends Apple-caliber precision with warm, tactile editorial composure. The tone is deliberate, unhurried, and reassuring—a direct counter to hyper-saturated, discount-heavy marketplace noise. 

The visual strategy leans entirely on expansive whitespace, pristine ivory layers, and whisper-quiet structural lines. Rather than shouting, hierarchy is built through scale, air, and exacting typography. Material surfaces evoke fine uncoated archival paper, punctuated with surgical touches of sunlit marigold. The resulting atmosphere evokes discerning taste, trust, and absolute clarity.

## Colors

The color palette operates under strict discipline to preserve its gallery-like serenity:

- **Warm Ivory (`#FBF8F3`)**: The absolute canvas foundation. Every view sits atop this warm, natural tint. Harsh stark whites (`#FFFFFF`) are restricted solely to elevated foreground cards to create subtle organic separation.
- **Deep Ink (`#14122B`)**: The primary text and key contour tone. A profound, blue-black pigment offering deep contrast without the clinical sharpness of pure `#000000`.
- **Muted Slate (`#6B6880`)**: Secondary and metadata typography. Provides soft, legible guidance for subtitles, specifications, timestamps, and resting iconography.
- **Hairline Border (`#EAE4D9`)**: A soft, neutral contour applied at 1px thickness to articulate structure without cutting the page into hard cells.
- **Accent Marigold (`#F59E0B`)**: Handled with extreme scarcity. Reserved strictly for three functional moments:
  1. Primary CTA buttons.
  2. Star ratings.
  3. Active states within transactional bar charts and step progress.
  It must never be used for backgrounds, broad fills, decorative badges, or large banners.

Never incorporate dark hero sections, dense black headers, or vivid full-bleed promotional backdrops.

## Typography

The type hierarchy is powered exclusively by Plus Jakarta Sans to combine modern geometric clarity with humanist warmth. 

Large numerals (`numeral-stat` and `display-xl`) serve as signature design anchors—curated for currency pricing, product dimensions, transaction summaries, and metric totals. They command attention not through loud colors, but through sheer scale and generous breathing room. 

Body and caption styles utilize generous line heights to mimic high-end editorial magazines. Headings maintain tight, negative tracking (`-0.01em` to `-0.03em`), while labels and sub-captions sit with slight positive tracking for crisp utility legibility.

## Layout & Spacing

A fluid grid architecture establishes clear horizontal discipline while vertical rhythm is deliberately loose, spacious, and relaxed:

- **Desktop & Tablet (>768px)**: 12-column layout with 24px (`1.5rem`) gutters and 32px (`2rem`) outer screen margins. Max content container is capped at 1240px to retain intimate editorial proportions.
- **Mobile (<=768px)**: 4-column layout with 16px (`1rem`) gutters and 24px (`1.5rem`) outer screen margins.

Spacing principles mandate standard structural vertical gaps of 24px (`space-lg`) to 32px (`space-xl`) between stacked components. Dense, edge-to-edge listing layouts are forbidden. Negative space is considered a luxury material: white space frames the merchandise and allows each product silhouette to command the screen.

## Elevation & Depth

Visual depth is achieved through delicate surface transitions and ethereal ambient diffusion rather than standard drop shadows:

- **Tonal Stepping**: The canvas is Warm Ivory (`#FBF8F3`). Raised elements (cards, bottom sheets, search overlays) use pure Milk White (`#FFFFFF`).
- **Hairline Framing**: Every raised surface is outlined with a 1px solid hairline in `#EAE4D9` to ensure crisp definition against the ivory foundation.
- **Ambient Shadows**: Shadows are feathered, multi-stop, and warm-tinted:
  - *Resting Card Elevation*: `0 2px 12px -2px rgba(20, 18, 43, 0.03), 0 1px 3px 0 rgba(20, 18, 43, 0.02)`.
  - *Floating / Modal Elevation*: `0 16px 36px -6px rgba(20, 18, 43, 0.06), 0 6px 16px -4px rgba(20, 18, 43, 0.03)`.
- **Hero Containers**: No dark hero sections, gradient overlays, or high-contrast backings are permitted. All banners and media cards remain soft ivory or pristine white.

## Shapes

The interface embraces a measured, balanced curvature:

- Base cards, containers, and dialogs utilize an 8px (`0.5rem`) to 16px (`1rem`) border radius, striking a balance between Apple-like fluidity and architectural poise.
- Interactive elements such as buttons, inputs, and chips share the consistent 8px (`0.5rem`) boundary.
- Full pills (`9999px`) are reserved exclusively for compact, inline tags or standalone floating floating action bars. Sharp, right-angled corners are avoided.

## Components

- **Primary Buttons**:
  - Background: Solid Marigold (`#F59E0B`).
  - Text: Deep Ink (`#14122B`), 15px Semi-bold.
  - Border: None.
  - Padding: 14px vertical, 28px horizontal. Radius: 8px.
  - Usage: Strictly limited to one per major viewport (e.g., "Add to Bag", "Proceed to Payment").

- **Secondary & Ghost Buttons**:
  - Background: Pure White (`#FFFFFF`) or transparent.
  - Text: Deep Ink (`#14122B`), 15px Medium.
  - Border: 1px hairline `#EAE4D9`.

- **Pristine Cards**:
  - Background: Pure White (`#FFFFFF`).
  - Border: 1px hairline `#EAE4D9`.
  - Padding: 24px interior padding (`space-lg`).
  - Image staging: Product imagery must sit against warm ivory or light grey transparent cutouts; no harsh saturated backsplashes.

- **Chips & Filters**:
  - Default: Warm Ivory surface, 1px border `#EAE4D9`, Muted Slate text (`#6B6880`).
  - Selected: Deep Ink surface (`#14122B`), Milk White text (`#FFFFFF`), no border. Marigold is explicitly prohibited here.

- **Input Fields**:
  - Background: Pure White (`#FFFFFF`).
  - Border: 1px `#EAE4D9`, transitioning to 1.5px Deep Ink (`#14122B`) on focus.
  - Label: Deep Ink (`#14122B`), placeholder in Muted Slate (`#6B6880`).
  - Height: 52px with 16px horizontal inset.

- **Star Ratings**:
  - Rendered with filled geometric vector stars in Accent Marigold (`#F59E0B`), followed by count labels in Muted Slate (`#6B6880`).

- **Form Controls (Checkboxes & Radios)**:
  - Resting: 1.5px outline in `#EAE4D9` on a white core.
  - Checked: Deep Ink (`#14122B`) fill with white check/dot. 

- **Data Visualizations & Active Chart Bars**:
  - Baseline/historical bars: Muted Ivory (`#EAE4D9`).
  - Active/selected bar: Marigold (`#F59E0B`).