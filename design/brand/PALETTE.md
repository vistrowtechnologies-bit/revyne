# RevYne colour palette (from the logo)

Source: `assets/revyne-icon-512.png` — white chat bubble + AI sparkle on a diagonal gradient.
Colours were sampled from the image, not eyeballed.

## Brand

| Token | Hex | From the logo | Use |
|---|---|---|---|
| `brand.gradient` | `#B02FE5 → #363DDD` (135°) | Full logo background | Hero card, splash, app icon, celebration moments — never body text |
| `violet.500` (primary) | `#6334E2` | Logo centre | Primary buttons, active tab, links, chart highlight |
| `magenta.500` | `#B02FE5` | Gradient start (top-left) | Gradient only; sparkle/AI accents |
| `indigo.500` | `#363DDD` | Gradient end (bottom-right) | Gradient only; secondary info accents |
| `violet.900` | `#1E0B50` | Logo shadow edge (`#361D86`) deepened | Dark surfaces |

### Violet ramp (primary)
50 `#F5F2FC` · 100 `#E8E2F9` · 200 `#CFC1F6` · 300 `#AD94F0` · 400 `#8A67E9` · **500 `#6334E2`** · 600 `#461BBB` · 700 `#391698` · 800 `#2B1174` · 900 `#1E0B50` · 950 `#120731`

## Neutrals (violet-tinted, so greys match the brand)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#16112E` | Headlines and body text |
| `muted` | `#5B5577` | Secondary text |
| `line` | `#E4E1F2` | Hairline borders, dividers |
| `bg` | `#F7F6FC` | App background |
| `surface` | `#FFFFFF` | Cards |

## Supporting

| Token | Hex | Use |
|---|---|---|
| `star` | `#F5A524` | Star ratings only — the one warm accent |
| `success` | `#0B7F57` | "Went to Google", connected, done |
| `danger` | `#D02F35` | Errors, destructive actions |

## Contrast checks (WCAG; 4.5 = AA for normal text)

| Pair | Ratio |
|---|---|
| ink on bg | 16.9 |
| muted on bg / on white | 6.5 / 7.0 |
| white on violet.500 | 6.7 |
| white on violet.600 | 9.8 |
| violet.600 text on bg | 9.2 |
| white on indigo.500 | 7.3 |
| white on magenta.500 | 4.8 |
| ink on star | 8.9 |
| white on success | 5.0 |
| white on danger | 5.1 |

## Rules
- One gradient moment per screen (the hero). Everything else is calm: white cards on `bg`, hairline `line` borders.
- `star` amber appears only on stars, never on buttons — it keeps ratings instantly recognisable.
- Text never sits directly on the gradient's magenta end at small sizes (4.8:1 is the floor).
