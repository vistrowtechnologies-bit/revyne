---
name: Marigold Commerce
colors:
  surface: '#fff8f0'
  surface-dim: '#dfd9d0'
  surface-bright: '#fff8f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f3ea'
  surface-container: '#f4ede4'
  surface-container-high: '#eee7de'
  surface-container-highest: '#e8e2d9'
  on-surface: '#1e1b16'
  on-surface-variant: '#47464e'
  inverse-surface: '#33302a'
  inverse-on-surface: '#f7f0e7'
  outline: '#78767f'
  outline-variant: '#c9c5cf'
  surface-tint: '#5d5986'
  primary: '#020017'
  on-primary: '#ffffff'
  primary-container: '#1b1740'
  on-primary-container: '#8480af'
  inverse-primary: '#c6c1f4'
  secondary: '#895100'
  on-secondary: '#ffffff'
  secondary-container: '#fd9d1a'
  on-secondary-container: '#663b00'
  tertiary: '#000201'
  on-tertiary: '#ffffff'
  tertiary-container: '#002213'
  on-tertiary-container: '#009863'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c6c1f4'
  on-primary-fixed: '#1a163f'
  on-primary-fixed-variant: '#45426d'
  secondary-fixed: '#ffdcbc'
  secondary-fixed-dim: '#ffb86b'
  on-secondary-fixed: '#2c1700'
  on-secondary-fixed-variant: '#683d00'
  tertiary-fixed: '#7ffaba'
  tertiary-fixed-dim: '#61dda0'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#005233'
  background: '#fff8f0'
  on-background: '#1e1b16'
  surface-variant: '#e8e2d9'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '800'
    lineHeight: 34px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.2px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.4px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.5px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for Indian neighborhood business owners—the sweet shop (mithai) proprietors, neighborhood salon directors, clinic founders, and local retail merchants. It intentionally breaks away from sterile, monochromatic Western SaaS tropes. Instead, it embodies the vibrancy, auspicious hospitality, and celebratory warmth of everyday Indian commerce (*shubh shuruat*, festive pride, and community trust).

The aesthetic marries **Tactile Festive Modernism** with structured Android ergonomics:
- **Atmosphere:** Warm, celebratory, prosperous, and encouraging. Milestones (e.g., reaching 100 reviews or hitting 4.9 stars) are treated like community triumphs with radiant golden glows, subtle marigold motifs, and joyful micro-interactions.
- **Tone:** Clear, respectful, empowering, and action-oriented. It prioritizes low visual friction for busy owners operating single-handedly from counter desks and busy shop floors.
- **Physicality:** Physical standee previews, direct WhatsApp sharing pathways, and tangible tactile cards bridge the gap between physical retail counters and digital Google Business Profile presence.

## Colors

The palette draws directly from cultural commerce cues: auspicious marigold garlands, deep twilight indigo ink used in trusted ledger books (*khata*), and flourishing leaf green.

### Palette Architecture
- **Primary (`#1B1740` - Deep Indigo Ink):** The anchor for high-contrast typographic hierarchy, deep-mode hero summary cards, focused bottom navigation states, and premium badge frames.
- **Secondary (`#FF9F1C` - Marigold Amber/Gold):** The energetic driver of primary conversion points (CTA buttons), Google star ratings, celebratory streaks, and luminous radial glows.
- **Tertiary (`#1FA971` - Leaf Green):** Represents business growth, upward review velocity, sentiment health markers, and official WhatsApp integration actions.
- **Accent Alert (`#FF5A5F` - Coral Vermilion):** Reserved for unaddressed negative reviews, pending dispute actions, and Google sync warnings.
- **Base Canvas (`#FFF8EF` - Warm Cream):** Provides a welcoming, eye-resting foundation that avoids harsh digital starkness.
- **Surface Elevation (`#FFFFFF` - Pure White):** Used for tactile foreground cards to create natural separation from the cream canvas.
- **Tonal Tints:** `#FFF1DE` (soft marigold wash for tag containers and active states) and `#E8F7F0` (soft verdant wash for positive feedback and growth chips).

## Typography

The type scale combines **Plus Jakarta Sans** for expressive, joyful display contexts and **Noto Sans** for high-clarity data display and multiline localized readability.

- **Plus Jakarta Sans** is leveraged across headings, stat counters, and interaction labels. Its wide apertures, friendly geometry, and confident terminal strokes provide an energetic and modern Indian commercial aesthetic.
- **Noto Sans** is utilized for consumer review text, body paragraphs, and transactional notes. It maintains exceptional rendering performance and high legibility across multilingual terms, currency denominations (₹), and dense shop reviews.
- Numerical statistics (star ratings, review totals, growth percentages) always render with `fontWeight: 700` or `800` using tabular figure spacing to prevent visual jitter during live tally updates.

## Layout & Spacing

This design system adheres to a mobile-first, fluid column structure optimized for Android viewports (360dp to 412dp standard device widths):
- **Base Grid:** Single-column layout on standard mobile frames expanding to a 2-column masonry grid on tablet/foldable interfaces (>600dp).
- **Margins & Gutters:** A firm 16px (`1rem`) outer canvas margin anchors the interface, preventing accidental edge taps while holding the phone one-handed. Element groupings rely on an 8-point harmonic spacing rhythm.
- **Touch Targets:** Any interactive cell, review response field, or WhatsApp dispatch action holds a minimum physical height of 48px to accommodate quick merchant inputs between serving customers.
- **Safe Areas:** System bars and Android navigation gestures are protected with dynamic bottom padding (minimum 80px clearance above the 5-tab bar).

## Elevation & Depth

Depth is established through soft, warm-tinted illumination rather than cold, neutral shadows:
- **Canvas Base:** Flat, non-reflective `#FFF8EF`.
- **Card Elevation (Level 1):** `#FFFFFF` surfaces with `box-shadow: 0 8px 24px rgba(27, 23, 64, 0.06)`. This subtle indigo-tinted shadow anchors content softly over the cream canvas.
- **Floating Modals & Sheets (Level 2):** Quick reply trays and QR code previews carry `box-shadow: 0 16px 36px rgba(27, 23, 64, 0.12)`.
- **Celebratory Halo / Diya Glow:** Star milestones, hero badges, and primary Marigold buttons incorporate a warm, colored drop glow: `box-shadow: 0 6px 20px rgba(255, 159, 28, 0.35)`.
- **Hero Dark Cards:** Deep indigo cards (`#1B1740`) leverage internal subtle radial gradients (`radial-gradient(circle at top right, rgba(255,159,28,0.18), transparent 70%)`) to create a lustrous, premium finish.

## Shapes

The design system emphasizes gentle, hospitable contours:
- **Cards & Sheets:** Fixed at an organic 24px (`rounded-xl` equivalent in this system) corner radius, conveying softness and welcoming craftsmanship.
- **Action Triggers & Pills:** Interactive buttons, category filter tags, review chips, and bottom bar floating highlights use full pill styling (`border-radius: 9999px`).
- **Input Fields:** Form controls carry an 18px border radius, seamlessly balancing between the pill buttons and the 24px card structures.
- **Visual Tokens:** Standee preview mockups, QR containers, and business profile badges use continuous curved squircle boundaries to maintain an artisanal, high-end feel.

## Components

### Buttons
- **Primary (Marigold Action):** Fully pill-shaped, `#FF9F1C` fill, `#1B1740` text, bold `label-lg` typography. Carries an ambient warm glow (`0 6px 20px rgba(255, 159, 28, 0.35)`). Active state applies a subtle 0.98 scale transform.
- **WhatsApp Direct Action:** Fully pill-shaped, `#1FA971` fill, `#FFFFFF` text, paired with the WhatsApp icon. Highlights automated customer review request workflows.
- **Secondary (Indigo Outline):** Pill-shaped, transparent background, 1.5px border in `#1B1740`, text in `#1B1740`.
- **Tertiary / Ghost:** Pill-shaped, no border, text in `#FF9F1C` with subtle `#FFF1DE` active feedback.

### Cards
- **Standard White Card:** Pure `#FFFFFF` surface, 24px radius, 16px internal padding, indigo-tinted shadow (`0 8px 24px rgba(27, 23, 64, 0.06)`).
- **Milestone & Hero Card:** Rich `#1B1740` background, 24px radius, white and marigold typography, gold accent borders (0.5px solid `rgba(255, 159, 28, 0.3)`). Displays overall Google score, star cluster, and growth streak.

### Chips & Badges
- **Status Tags:** Pill-shaped, 6px vertical and 12px horizontal padding.
  - *Positive Sentiment:* Background `#E8F7F0`, text `#1FA971`.
  - *Needs Attention (1-3 Stars):* Background `#FFF0F0`, text `#FF5A5F`.
  - *Celebratory / High Velocity:* Background `#FFF1DE`, text `#FF9F1C`.
- **Filter Chips:** Unselected state has a `#FFFFFF` fill with a subtle 1px `#1B1740`/10% border; selected state features an `#1B1740` fill with `#FFFFFF` text.

### Input Fields & Search
- Surface in `#FFFFFF`, 18px border radius, 1px border in `rgba(27, 23, 64, 0.15)`, focused state shifts to 2px solid `#FF9F1C` with zero harsh shadow. Helper labels use `body-sm` in `#1B1740` with 60% opacity.

### Review Feed Items
- White cards containing: reviewer initial avatar in gold/cream tone, customer name (`headline-sm`), localized timestamp, solid marigold star rating group, review message (`body-md`), and a 1-tap "AI Reply with Namaste" quick action button.

### Bottom Navigation Bar (Android)
- Fixed at screen bottom, 72px base height, `#FFFFFF` surface with elevated top border tint.
- Contains 5 equal tab targets: **Home**, **Reviews**, **Get Reviews** (center highlighted action with Marigold pill icon container), **Google**, **Account**. Active tab triggers an indigo icon and bold label, with an ambient warm marigold dot indicator below.