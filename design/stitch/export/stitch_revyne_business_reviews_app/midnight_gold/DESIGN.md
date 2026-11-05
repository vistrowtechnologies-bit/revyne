---
name: Midnight Gold
colors:
  surface: '#13121f'
  surface-dim: '#13121f'
  surface-bright: '#393846'
  surface-container-lowest: '#0e0d1a'
  surface-container-low: '#1b1a28'
  surface-container: '#1f1e2c'
  surface-container-high: '#2a2837'
  surface-container-highest: '#353342'
  on-surface: '#e4e0f3'
  on-surface-variant: '#d4c4af'
  inverse-surface: '#e4e0f3'
  inverse-on-surface: '#302f3d'
  outline: '#9d8f7c'
  outline-variant: '#504535'
  surface-tint: '#fcbb49'
  primary: '#ffd698'
  on-primary: '#432c00'
  primary-container: '#f5b544'
  on-primary-container: '#6a4800'
  inverse-primary: '#7f5700'
  secondary: '#4fe088'
  on-secondary: '#00391b'
  secondary-container: '#03b563'
  on-secondary-container: '#003e1e'
  tertiary: '#ffd882'
  on-tertiary: '#3f2e00'
  tertiary-container: '#e7bb53'
  on-tertiary-container: '#644b00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdead'
  primary-fixed-dim: '#fcbb49'
  on-primary-fixed: '#281900'
  on-primary-fixed-variant: '#604100'
  secondary-fixed: '#6ffda1'
  secondary-fixed-dim: '#4fe088'
  on-secondary-fixed: '#00210d'
  on-secondary-fixed-variant: '#005229'
  tertiary-fixed: '#ffdf9b'
  tertiary-fixed-dim: '#edc157'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#13121f'
  on-background: '#e4e0f3'
  surface-variant: '#353342'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies elite consumer fintech, drawing deep aesthetic lineage from progressive Indian high-trust platforms. It merges the psychological security of private wealth management with the kinetic reward loops of modern neo-banking. 

The aesthetic is dark-mode maximalist minimalism: deep, light-absorbing indigo-black voids punctuated by luminous radiant metallics, jewel-tone status beacons, and meticulously calibrated frosted glass. The emotional goal is immediate prestige, financial composure, and exclusivity. Interfaces should feel weightless yet physically valuable, evoking tactile matte titanium cards, precision chamfered edges, and ambient golden backlights.

## Colors

The palette leverages an atmospheric nocturnal foundation offset by radiant warm metallics:

- **Canvas & Surfaces:**
  - Base Canvas: `#0E0D1A` (Near-black saturated indigo)
  - Surface Level 1: `#151329` (Deep obsidian indigo)
  - Elevated Glass: `rgba(255, 255, 255, 0.05)` coupled with fine structural borders `rgba(245, 181, 68, 0.15)`
- **Accents & Metallics:**
  - Primary Core: `#F5B544` (Warm radiant gold)
  - Amber Lustre: `#FFD166` (Specular highlight for badges, active states, and halo gradients)
- **Semantic Accents:**
  - Growth / Wealth / Positive Delta: `#20BF6B` (Soft vibrant emerald)
  - Alert / Friction / Debit: `#FF6B6B` (Muted coral crimson)
- **Typography & Content:**
  - High Contrast / Primary Numbers: `#FAF9F6` (Crisp ivory)
  - Supporting / Secondary Meta: `#9E9AA7` (Cool lavender-grey)

## Typography

The typographic hierarchy implements a high-performance duo-font configuration:

- **Headings & Financial Telemetry:** Plus Jakarta Sans delivers structural modernism, geometric authority, and tight tracking for high-impact numerical figures, balances, and executive headings.
- **Body & Multilingual Continuity:** Noto Sans provides exceptional neutrality and high legibility across dense transactional statements, micro-copy, and localized vernacular strings.
- **Numerical Formatting:** All numeric values must use tabular numerals (`font-variant-numeric: tabular-nums`) to prevent horizontal layout shift during dynamic counter animations.

## Layout & Spacing

The structural layout relies on an adaptive fluid-column paradigm:
- **Mobile (< 768px):** 4-column fluid layout with `margin: 1rem` (16px) and `gutter: 1rem` (16px). High vertical density prioritizing thumb reach zones.
- **Tablet (768px - 1024px):** 8-column fluid layout with `margin-tablet: 2rem` (32px).
- **Desktop (> 1024px):** 12-column layout with a capped max content boundary of 1240px, anchored by `margin-desktop: 3rem` (48px) and `gutter-desktop: 1.5rem` (24px).

Components follow an 8pt baseline rhythm, using `space-xs` (4px) and `space-sm` (8px) for internal pill padding, and `space-lg` (24px) for card interiors to balance luxury breathing room with critical data density.

## Elevation & Depth

Visual depth is achieved through ambient illumination and layered translucency rather than heavy dropshadows:

1. **Sub-surface (Base):** Flat `#0E0D1A` with subtle linear top-to-bottom radial gradient overlays.
2. **Surface Level 1 (Resting Cards):** Background `#151329` with a subtle inner border (`1px solid rgba(255, 255, 255, 0.04)`).
3. **Elevated Glass Tier (Interactive Panels):** Translucent fill `rgba(255, 255, 255, 0.05)` reinforced with a hardware-accelerated `backdrop-filter: blur(16px)` and perimeter stroke `1px solid rgba(245, 181, 68, 0.15)`.
4. **Radiant Halos & Auroras:** Key metric displays, active financial assets, and progress nodes use diffused ambient glows:
   - Primary Golden Halo: `box-shadow: 0 0 32px -8px rgba(245, 181, 68, 0.25)`
   - Growth Aura: `box-shadow: 0 0 24px -6px rgba(32, 191, 107, 0.25)`

## Shapes

The design system employs a two-tier signature geometry:
- **Pill Geometry (`9999px`):** Used universally across interactive touch targets, including primary action buttons, chips, status pills, filter toggles, and swipe controllers.
- **Luxury Card Radii (`24px`):** Structural containers, balance cards, modal bottoms, and elevated sheets standardize on a soft, fluid `24px` corner curve (`rounded-3xl`), evoking physical credit cards and high-spec hardware screens.

## Components

### Buttons & Interactive Controls
- **Primary CTA:** Full-pill silhouette (`border-radius: 9999px`), background gradient from `#F5B544` to `#FFD166`, rich black typography (`#0E0D1A`), accompanied by subtle directional golden glow on hover/active.
- **Secondary Glass CTA:** Translucent fill `rgba(255, 255, 255, 0.06)`, perimeter border `1px solid rgba(245, 181, 68, 0.3)`, crisp ivory label (`#FAF9F6`).
- **Interactive States:** Micro-scale transformation of `scale(0.98)` on touch-down with an elastic return.

### Cards & Container Panels
- Base padding of `space-lg` (24px) with corner radii of `24px`.
- Composed of frosted translucent surface fills (`rgba(255, 255, 255, 0.05)`), blur radii of `16px`, and an outer hair-thin stroke `rgba(245, 181, 68, 0.15)`.
- Cards housing tier rewards feature an angled top-right specular gradient streak `linear-gradient(135deg, rgba(255, 209, 102, 0.12) 0%, transparent 60%)`.

### Chips & Filter Pills
- Compact height (32px), full pill radius, filled with `#151329` and a boundary border of `rgba(255, 255, 255, 0.08)`.
- Selected state activates a `rgba(245, 181, 68, 0.15)` amber background with an active border in `#F5B544` and gold typography.

### Input Fields & Amount Editors
- Understated container backgrounds set to `#151329` with `16px` border radius or full pill form factor.
- Default border `1px solid rgba(255, 255, 255, 0.1)`, transitioning to `1px solid #F5B544` with a localized `0 0 12px rgba(245, 181, 68, 0.2)` glow on focus.
- Currency symbols (₹) utilize Plus Jakarta Sans medium weight in gold `#F5B544`, while user inputs render in high-contrast ivory `#FAF9F6`.

### Checkboxes, Toggles & Radios
- Toggles feature a deep pill track `#151329` with an ivory thumb. When switched to active, the track illuminates in emerald `#20BF6B` or gold `#F5B544`.
- Checkboxes feature rounded corners (`6px`) with golden checked states and subtle inset shadows.

### Specialized Fintech Components
- **Metric Highlight Halo:** High-tier net worth or credit limit blocks set against a radial ambient blur mask (`radial-gradient(circle, rgba(245, 181, 68, 0.15) 0%, transparent 70%)`).
- **Swipe-to-Pay Slider:** Glassmorphic pill track with a tactile golden dragging handle, unlocking dynamic haptic feedback upon completion.