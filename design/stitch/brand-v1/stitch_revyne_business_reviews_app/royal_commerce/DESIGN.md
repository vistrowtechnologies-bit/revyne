---
name: Royal Commerce
colors:
  surface: '#fdf8ff'
  surface-dim: '#ddd5fc'
  surface-bright: '#fdf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f1ff'
  surface-container: '#f1ebff'
  surface-container-high: '#ece4ff'
  surface-container-highest: '#e6deff'
  on-surface: '#1c1734'
  on-surface-variant: '#494455'
  inverse-surface: '#312c4b'
  inverse-on-surface: '#f4eeff'
  outline: '#7a7487'
  outline-variant: '#cac3d8'
  surface-tint: '#6638e5'
  primary: '#4b00cb'
  on-primary: '#ffffff'
  primary-container: '#6334e2'
  on-primary-container: '#daceff'
  inverse-primary: '#ccbdff'
  secondary: '#9500ca'
  on-secondary: '#ffffff'
  secondary-container: '#b232e7'
  on-secondary-container: '#fffbff'
  tertiary: '#1e22cc'
  on-tertiary: '#ffffff'
  tertiary-container: '#3c44e2'
  on-tertiary-container: '#cfd1ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e7deff'
  primary-fixed-dim: '#ccbdff'
  on-primary-fixed: '#1f0060'
  on-primary-fixed-variant: '#4d0acd'
  secondary-fixed: '#f8d8ff'
  secondary-fixed-dim: '#ecb2ff'
  on-secondary-fixed: '#320046'
  on-secondary-fixed-variant: '#75009e'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bfc2ff'
  on-tertiary-fixed: '#01006e'
  on-tertiary-fixed-variant: '#2227ce'
  background: '#fdf8ff'
  on-background: '#1c1734'
  surface-variant: '#e6deff'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 24px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.25rem
  margin-tablet: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system delivers an authoritative, high-trust Android experience crafted specifically for Indian local business proprietors—from generational confectioners to boutique clinic specialists. It reconciles high-velocity daily operations with executive poise. The visual aesthetic reflects a modern Indo-European luxury: disciplined restraint, deep royal violet hues, and an unhurried, generous allocation of spatial canvas. 

The emotional tone balances institutional legitimacy with operational optimism. Interfaces discard clutter, complex data tables, and loud gamification in favor of single-concept focus: one card, one metric, one decisive action. Visual communication relies exclusively on disciplined typography, precise tonal boundaries, and bespoke vector iconography—strictly excluding colloquialisms and emoji.

## Colors
The color architecture relies on a dominant royal violet signature balanced against pure, luminous backgrounds and ink-toned legibility.

- **Primary Signature**: Royal Violet (`#6334E2`) commands key functional interactions, prominent indicators, and active states.
- **Brand Signature Gradient**: Applied sparingly to high-leverage hero elements and primary action buttons at a `135deg` linear blend from violet-magenta (`#B02FE5`) through royal violet (`#6334E2`) to deep indigo (`#363DDD`).
- **Surface Tints**: `#F7F6FC` forms the continuous canvas background. Micro-surfaces, pill chips, and subtle focus states leverage soft violet tints: Level 1 (`#F5F2FC`) and Level 2 (`#E8E2F9`).
- **Typography & Structural Inks**: Body and headline text strictly apply high-density Ink (`#16112E`). Secondary descriptors, timestamps, and metadata employ Muted Secondary Text (`#5B5577`). 
- **Dividers & Outlines**: Clean separation is achieved with hairline borders set to `#E4E1F2`.
- **System Accents**: 
  - Amber (`#F5A524`) is strictly reserved for customer review star metrics and numerical rating symbols.
  - Success (`#0B7F57`) designates verified status badges, inbound positive reviews, and completed syncs.
  - Danger (`#D02F35`) marks escalations, flagged feedback, or disconnect notices.

## Typography
Plus Jakarta Sans powers the entire hierarchy, leveraging its rounded geometric chassis to marry approachability with structural authority.

- **Numerics & Big Headings**: Key business metrics (e.g., "4.9", "+142") utilize weight `800` with tight letter-tracking (`-0.03em`), instantly projecting confidence on handheld screens.
- **Reading Comfort**: Body copy never dips below `15px` (`body-md`), ensuring immediate scanning under bright shop-floor lighting or rapid counter transactions. Body weight stays anchored at `500` for standard descriptions and `600` for emphasized summaries.
- **Scale Adaptations**: Extreme displays step down smoothly for compact Android screens (`display-hero-mobile` and `headline-lg-mobile`) to prevent awkward line breaks on localized business names.

## Layout & Spacing
The layout adheres to an Android-first fluid column structure prioritizing vertical cadence and strict thumb-zone ergonomics.

- **Grid Alignment**: Mobile form factors employ a 4-column fluid layout with an outer canvas edge margin of `1.25rem` (`20px`) and `0.75rem` (`12px`) gutters. Tablets expand to 8 columns with `2rem` margins and `1rem` gutters.
- **Whitespace Rhythm**: Whitespace is generous. Content flows as singular visual islands stacked along a continuous vertical scroll, eliminating cluttered multi-column arrangements on handheld devices.
- **Breathing Room**: Vertical distance between separate card entities defaults to `space-lg` (`20px`), while internal padding within cards enforces a strict `space-lg` padding to frame focal insights clearly.

## Elevation & Depth
Elevation eschews generic dark drop shadows in favor of a clean, ambient violet-tinted illumination layer:

- **Surface Depth**: Cards sit upon `#FFFFFF` bases elevated over the ambient `#F7F6FC` background. 
- **Shadow Profile**: The default card shadow utilizes a diffused, ambient violet signature: `0 8px 24px -4px rgba(99, 52, 226, 0.07), 0 2px 6px -1px rgba(22, 17, 46, 0.03)`.
- **Edge Definition**: Elevated surfaces combine this ambient illumination with a crisp 1px hairline border (`#E4E1F2`), providing tactile perimeter definition on high-density OLED and AMOLED displays.
- **Modal & Sheet Elevation**: Floating sheets and interactive drawers implement an expanded dispersion: `0 16px 40px -8px rgba(99, 52, 226, 0.16)`.

## Shapes
The visual identity embraces soft geometry calibrated for modern hand ergonomics:

- **Card Architecture**: White interaction cards feature an explicit, uniform corner radius of `20px`.
- **Pill Primitives**: Interactive controls, floating chips, indicators, and call-to-action buttons leverage fully rounded pill boundaries (`border-radius: 9999px`).
- **Internal Micro-elements**: Form input boxes and internal card highlight wells apply a balanced curvature of `12px` to sit naturally within their parent `20px` envelopes.

## Components

### Buttons
- **Primary Action**: Full pill geometry (`border-radius: 9999px`), styled with the signature 135deg gradient (`#B02FE5` through `#6334E2` to `#363DDD`), featuring white text (`#FFFFFF`) at `label-lg` (`weight 600`). Minimum touch target is 52px in height.
- **Secondary Action**: Pill geometry with a solid surface tint of `#F5F2FC`, royal violet text (`#6334E2`), and zero border. Active state shifts to `#E8E2F9`.
- **Tertiary / Utility**: Ghost pill, transparent base, bordered with 1px hairline `#E4E1F2`, text set to `#16112E`.

### Cards (Single Idea Principle)
- **Container**: White background (`#FFFFFF`), `20px` border radius, bounded by a 1px border (`#E4E1F2`), supported by the signature violet ambient shadow.
- **Composition**: Dedicated strictly to a single business concept (e.g., "Google Review Inflow", "NPS Velocity", or "Latest Customer Response").
- **Constraints**: Maximum of one badge allowed per card. Top right corner is reserved exclusively for status or categorization.

### Badges & Chips
- **Chips**: Compact pill structure (`border-radius: 9999px`), internal horizontal padding `12px`, vertical padding `6px`. Background `#F5F2FC`, text `#6334E2` (`label-sm`).
- **Semantic Badges**:
  - *Verified / Success*: Solid tint `#0B7F57` at 10% opacity, text `#0B7F57`.
  - *Attention / Action Required*: Solid tint `#D02F35` at 10% opacity, text `#D02F35`.
  - Strictly text and standard geometric iconography; no emojis permitted.

### Review Rating Display
- Star arrays render exclusively in Amber (`#F5A524`). Unfilled stars employ `#E4E1F2`.
- Accompanying numeric ratings (e.g., `4.9`) must display at `display-hero-mobile` or `headline-lg` in `#16112E` (`weight 800`).

### Input Fields
- Enclosed containers with `12px` rounded corners and height of 52px.
- Background set to `#FFFFFF` with a 1px hairline border in `#E4E1F2`. Focus state introduces a 1.5px border in Royal Violet (`#6334E2`) and an ambient highlight ring of `#F5F2FC`.
- Input text rendered in `#16112E` (`16px`, `weight 500`), placeholder text anchored in Muted Secondary (`#5B5577`).

### Selection Controls (Checkboxes & Radios)
- **Checkboxes**: Rounded squares (`6px` radius), 22px diameter. Selected state fills with `#6334E2` displaying a clean white stroke checkmark.
- **Radio Buttons**: Pill circular form (22px diameter), `#6334E2` outer ring and solid center dot on selection. Hairline `#E4E1F2` in neutral state.

### Lists & Feedback Rows
- Borderless internal rows cleanly segregated by generous vertical space (`space-md`) or a single hairline divider (`#E4E1F2`).
- Left-aligned avatar or business profile indicator, followed by customer name (`body-lg`, `weight 600`), relative time stamp (`label-sm`, `#5B5577`), and customer review content (`body-md`, `#16112E`).