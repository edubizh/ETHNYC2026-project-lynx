---
name: Traditional Predictions
description: A non-custodial index fund for prediction markets — belief markets crossed with the real equities of the same narrative, in a refined research terminal.
colors:
  terminal-black: "#0A0C10"
  graphite: "#14171E"
  graphite-raised: "#1B1F28"
  hairline: "#2A2F3A"
  ink: "#F4F6F9"
  ink-muted: "#A6AFBE"
  ink-dim: "#737C8A"
  amber: "#E0A33C"
  amber-deep: "#C9882A"
  azure: "#5B8DEF"
  azure-bright: "#7AA2F2"
  signal-green: "#3FBE85"
  signal-red: "#E5544B"
typography:
  display:
    fontFamily: "Neue Haas Grotesk Display, Inter Tight, Helvetica Neue, Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.06em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.terminal-black}"
    rounded: "{rounded.sm}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.ink-muted}"
    textColor: "{colors.terminal-black}"
  button-secondary:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "11px 18px"
  button-enter:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.terminal-black}"
    rounded: "{rounded.sm}"
    padding: "13px 22px"
  bucket-card:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
  badge-live:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.signal-green}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  badge-display-only:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  input-search:
    backgroundColor: "{colors.terminal-black}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Traditional Predictions

## 1. Overview

**Creative North Star: "The Research Terminal"**

Traditional Predictions looks like the screen of a great research desk — graphite, precise, every number sourced — but legible enough that someone who has only ever bought an index fund can read it like a one-page fact sheet. It borrows the gravitas of a Bloomberg terminal (dark surface, tabular numerics, density on demand) and refines it: more whitespace where a newcomer needs to breathe, one confident accent instead of a wall of color, type set with care. The interface should feel *engineered*, not decorated — the way a precision instrument earns trust by doing exactly what it says.

The whole product is one relationship: **belief markets crossed with the real equities of the same narrative.** The palette encodes that literally. **Amber is the traditional, real-asset, "this is the part you already understand" side. Azure is the belief, prediction, market-implied side.** The gap between amber and azure *is* the product, so the two colors are never decorative — they are the argument. Everything else is graphite and ink, so those two voices carry meaning the moment they appear.

This system explicitly rejects three things. It is **not crypto-degen** — no neon-on-black, no glow, no casino energy. It is **not generic AI SaaS** — no cream/sand backgrounds, no gradient text, no uppercase eyebrow kicker floating above every section, no grid of identical icon cards. And it is **not a sterile legacy bank** — not gray, not corporate-dead, not point-of-view-less. The line it walks: serious finance that happens to be about predictions.

**Key Characteristics:**
- Dark graphite surface, cool-neutral, never pure black.
- Tabular monospace for every number; clean neo-grotesque for every word.
- Two-color argument (amber = real asset, azure = belief), graphite for all else.
- Flat by default — depth from tonal steps and hairlines, not shadow.
- Evidence on the surface: source/freshness tags, on-chain hashes, the analyst band drawn in place.
- Legible in five seconds; dense and drill-able one layer down.

## 2. Colors

A cool-graphite terminal carrying a deliberate two-color argument — amber for the real-world asset side, azure for the belief side — with green and red reserved strictly for live state and error.

### Primary
- **Amber** (`#E0A33C` · `oklch(0.78 0.13 75)`): The brand signature and the *real-asset / traditional-finance* voice. Used for the wordmark, the active/selected state, focus rings, the "Enter" execute moment, and the **asset/security** series in every data visualization. It is the "Traditional" in Traditional Predictions and a quiet nod to the amber-on-black trading terminal. **Amber-deep** (`#C9882A` · `oklch(0.70 0.13 75)`) is its pressed/hover shade.

### Secondary
- **Azure** (`#5B8DEF` · `oklch(0.68 0.15 260)`): The *belief / prediction-market* voice. Used for the belief series in data viz, belief-odds figures, and informational links. **Azure-bright** (`#7AA2F2` · `oklch(0.75 0.13 260)`) is the small-text variant when azure must sit on graphite at body size and clear 4.5:1. Amber (hue ~75) and azure (hue ~260) are ~185° apart — a colorblind-safe pairing (the blue/orange axis), so the two voices stay distinct for dichromatic users; we still never rely on hue alone (see the Two-Voice Rule).

### Tertiary
- **Signal Green** (`#3FBE85` · `oklch(0.74 0.14 158)`): Live data, positive/confirmed state, and successful execution only. Never decorative.
- **Signal Red** (`#E5544B` · `oklch(0.64 0.18 25)`): Errors, reverts, negative deltas, destructive confirmation only.

### Neutral
- **Terminal Black** (`#0A0C10` · `oklch(0.15 0.008 255)`): The page background and the well behind inset inputs. Cool, near-black, never `#000`.
- **Graphite** (`#14171E` · `oklch(0.22 0.010 255)`): The default panel/surface — one tonal step up from the page.
- **Graphite Raised** (`#1B1F28` · `oklch(0.26 0.012 255)`): Rows, raised cards, hovered surfaces, badges — one more step up.
- **Hairline** (`#2A2F3A` · `oklch(0.33 0.012 255)`): All 1px borders, dividers, table rules, grid lines.
- **Ink** (`#F4F6F9` · `oklch(0.97 0.004 255)`): Primary text and the primary-button fill. ~16:1 on graphite.
- **Ink Muted** (`#A6AFBE` · `oklch(0.74 0.013 255)`): Secondary text, labels, captions. ~7:1 on graphite — AA for body.
- **Ink Dim** (`#737C8A` · `oklch(0.57 0.015 255)`): Tertiary, non-essential labels only (≥ large text). ~3.7:1 — never small body text.

### Named Rules
**The Two-Voice Rule.** The surface speaks in exactly two saturated voices: amber (real asset) and azure (belief). They appear only where they carry that meaning. If a third saturated color shows up as decoration, delete it. Green and red are *state*, not voices.

**The Hue-Plus Rule.** Belief and asset are never distinguished by color alone. Wherever the two cross (the Sentiment Gap, the legend, the table), each is also carried by **label, position, and a glyph** (● belief / ◆ asset) so the meaning survives colorblindness and grayscale print.

## 3. Typography

**Display Font:** Neue Haas Grotesk Display (institutional neo-grotesque; free fallback: Inter Tight, then Helvetica Neue)
**Body / UI Font:** IBM Plex Sans (with Helvetica Neue, Arial)
**Data / Mono Font:** IBM Plex Mono (with `ui-monospace`, SFMono-Regular, Menlo)

**Character:** A neo-grotesque carries every word with institutional calm — the typographic equivalent of a well-set prospectus — while a true monospace carries every *number*, id, and hash, giving the terminal its tabular precision and its "this is real, here are the receipts" texture. The contrast axis (grotesque prose + mono data) is the pairing; the two are never blurred.

### Hierarchy
- **Display** (700, `2.25rem`, line-height 1.05, tracking `-0.02em`): Page titles and the single hero statement per surface. Tracking floor is `-0.04em` — never tighter.
- **Headline** (600, `1.5rem`, 1.15): Section and panel titles.
- **Title** (600, `1.125rem`, 1.3): Card titles, sub-section headers.
- **Body** (400, `0.9375rem`, 1.55): Prose and descriptions. Cap measure at 65–75ch.
- **Label** (500, `0.75rem`, tracking `0.06em`): Stat keys, table headers, metadata. May be uppercase **in functional UI labels only** (a table header, a stat key) — never as a decorative eyebrow above a section.
- **Data** (IBM Plex Mono, 500, `0.8125rem`, `tnum`): Every odds %, price, gap value, percentile, conditionId, and tx hash. Always tabular figures. Hero data figures step up to `1.75rem`–`2.75rem` but stay mono.

### Named Rules
**The Numbers-Are-Mono Rule.** Every quantity the user might compare, copy, or verify — odds, prices, percentiles, gap points, ids, hashes — is set in IBM Plex Mono with tabular figures. Numbers never render in the prose sans. This is what makes columns align and the surface read as an instrument.

**The No-Eyebrow Rule.** Uppercase tracked text is allowed only as a *functional* micro-label (stat key, column header). It is forbidden as the decorative kicker above section headings. One section title, set plainly, is the cadence.

## 4. Elevation

Flat by default. Depth is built from **tonal layering** — terminal-black page → graphite panel → graphite-raised row — separated by 1px hairlines, not drop shadows. The terminal reads as a set of precisely registered planes, not floating cards. Shadow exists only for elements that genuinely float above the page: dropdowns, popovers, the Enter sheet, tooltips, toasts.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 8px 28px rgba(0,0,0,0.45)`): Dropdowns, popovers, the Enter confirmation sheet, modals. The only place shadow appears.
- **Focus Ring** (`box-shadow: 0 0 0 2px var(--terminal-black), 0 0 0 4px var(--amber)`): Keyboard focus on interactive elements — amber ring, offset by the page color.

### Named Rules
**The Flat Terminal Rule.** Surfaces are flat at rest; depth comes from tonal steps and hairlines. A resting card with a soft drop shadow is forbidden. Shadow is a property of *floating*, and only overlays float.

**The No Ghost-Card Rule.** Never pair a 1px border with a soft wide drop shadow on the same resting element. Pick one job: a hairline border defines a plane; a shadow lifts an overlay. Buttons and cards at rest get the border, never both.

## 5. Components

Every interactive component ships all of: default, hover, focus-visible, active, disabled, and (where it loads) loading + error. Skeletons for loading, never centered spinners. Empty states teach the next action.

### Buttons
- **Shape:** Gently squared (`6px` radius, `rounded.sm`). Cards top out at `10px`; pills (`999px`) only for tags. Radii of 24px+ are forbidden.
- **Primary:** Ink fill (`#F4F6F9`) on terminal-black text — crisp, neutral, high-contrast. Used for the main affordance on a surface that isn't the execute moment. Padding `11px 18px`.
- **Enter (execute):** Solid **amber** (`#E0A33C`) with terminal-black text — the one Committed moment of brand color, reserved for "Enter basket." Padding `13px 22px`.
- **Secondary / Ghost:** Graphite fill or transparent with a hairline border, ink text. For secondary and tertiary actions.
- **Hover / Focus:** Hover shifts fill one tonal step (or amber→amber-deep); transitions 150–180ms ease-out. Focus-visible draws the amber ring. Active drops 1px. Disabled at 45% opacity, no pointer.

### Chips / Tags (Source & Availability — signature)
- **Style:** Pill (`999px`), graphite-raised fill, `0.75rem` label, a leading status glyph.
- **`live`** — signal-green text + ● : value is from a live feed this request.
- **`fallback`** — ink-muted text + ○ : verified seed shown because a feed was unavailable.
- **`display-only · gated`** — ink-muted text + ◇ : a tokenized security that is NOT buyable on Uniswap (US-gated / wrong chain). This badge is mandatory on every security that isn't `LIVE-UNISWAP`.
- **`live · uniswap`** — amber text + ◆ : an asset leg genuinely tradeable on Uniswap now.

### Cards / Containers (Bucket Card — signature)
- **Corner Style:** `10px` (`rounded.md`).
- **Background:** Graphite (`#14171E`) on the terminal-black page; graphite-raised on hover.
- **Border:** 1px hairline. **No shadow at rest** (see Flat Terminal Rule).
- **Internal Padding:** `20px` (`spacing.lg`-ish).
- **Bucket card content:** theme name (Title) + one-line thesis (Body, muted) + a compact dual readout (belief ● azure / asset ◆ amber) + the gap value (mono) + counts ("4 prediction legs · 3 related securities") + a demo-ready/aspirational status. Cards are **not** identical — the flagship reads larger; do not ship a uniform icon-card grid.

### Inputs / Fields
- **Style:** Inset well — terminal-black fill, 1px hairline, `6px` radius, ink text, ink-dim placeholder (placeholder still ≥4.5:1).
- **Focus:** Border shifts to amber + amber focus ring; no glow.
- **Error:** Border + helper text in signal-red. Disabled at 45% opacity.

### Navigation
- **Style:** A slim top bar — wordmark (amber mark + ink "Traditional Predictions") left, theme search center/left, account/NAV right. Hairline underline, terminal-black fill.
- **States:** Nav/tab items in ink-muted; current item in ink with a 2px amber underline. Hover lifts to ink. On mobile, search collapses to an icon; the bar stays one row.

### Signature Component — The Sentiment Gap Meter
The hero of every bucket. A single horizontal scale (0–100%) with **two markers on one track**: a ● azure marker at the belief odds and a ◆ amber marker at the asset's analyst-band percentile. The span between them is the **gap**, rendered as a connecting segment with the gap value in mono (`14 pts`) centered above it, and a plain-language reading below ("belief runs hotter than the asset"). Direction is shown by *which marker leads* + the label, never by color alone. Never labelled "implied probability."

### Signature Component — The Analyst Band
A horizontal track from **bear (low)** to **bull (high)** analyst price target, with a marker at the live equity price and the figure in mono. The band is literally drawn (gradient track from graphite toward a faint amber at the bull end), with `bear $X` / `$price` / `bull $Y` labels beneath. This is the "show the receipts" object behind the asset-side percentile.

### Signature Component — The Data Table
The dense workhorse for basket legs and securities. Mono tabular figures, right-aligned numerics, hairline row rules, ink-muted uppercase column labels, row hover to graphite-raised. Each prediction row shows label · YES odds (azure, mono) · source tag · weight. Each security row shows ticker · price (mono) · analyst-band percentile · **availability badge**. No zebra stripes; hairlines do the separating.

## 6. Do's and Don'ts

### Do:
- **Do** keep the surface dark graphite (`#0A0C10` page, `#14171E` panels), cool-neutral, never pure black.
- **Do** set every number in IBM Plex Mono with tabular figures so columns align and values are copy/verify-able.
- **Do** restrict saturated color to the two voices — amber (real asset) and azure (belief) — plus green/red for state. Reach for graphite/ink for everything else.
- **Do** carry belief vs. asset with **glyph + label + position**, not hue alone (● belief / ◆ asset).
- **Do** show the source and freshness of every value (`live` / `fallback`) and a real on-chain tx/hash where one exists.
- **Do** render an honest **`display-only · gated`** badge on any tokenized security that isn't tradeable on Uniswap. Make honesty visible.
- **Do** keep surfaces flat at rest; build depth from tonal steps + hairlines.
- **Do** use radii of 4–10px on cards/inputs; pills only for tags.

### Don't:
- **Don't** go crypto-degen: no neon-on-black, no glow/bloom, no casino energy, no hype color.
- **Don't** look like generic AI SaaS: no cream/sand backgrounds, no gradient text (`background-clip: text`), no uppercase eyebrow kicker above every section, no grid of identical icon cards.
- **Don't** look like a sterile legacy bank: no flat gray, no corporate-dead layouts with no point of view.
- **Don't** imply a tokenized security is buyable on Uniswap — as of 2026 they are display-only / US-gated; show the badge, never a one-click "Buy NVDA."
- **Don't** ever label the analyst-band percentile an "implied probability."
- **Don't** pair a 1px border with a soft drop shadow on a resting element (the ghost-card tell); no resting card shadows at all.
- **Don't** over-round (no 24px+ radii on cards/inputs), and don't use side-stripe `border-left` accents.
- **Don't** add gamified-Robinhood confetti, oversized green/red dopamine, or "investing is a game" flourishes.
- **Don't** animate decoratively; motion conveys state only (150–250ms, ease-out), with a `prefers-reduced-motion` alternative.
