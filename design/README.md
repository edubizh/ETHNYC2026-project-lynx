# Traditional Predictions — Design Package (for Claude design)

This folder + the two root files are a **self-contained design system and brief**. Hand the repo to Claude design, point it here, and ask it to produce high-fidelity mockups for the three surfaces below. Paste the mocks back into this repo (e.g. `design/mocks/`) when they return.

## What this is
**Traditional Predictions** — a non-custodial *index fund for prediction markets*. Each **bucket** (theme) fuses the **prediction markets** of a narrative with the **tokenized real-world securities of the same narrative**, so a traditional-finance newcomer gets the *full-circle picture*: belief markets crossed with the real assets they already understand. The hero is the **Sentiment Gap** — where the crowd's belief sits vs. where the related asset sits in its published analyst band.

## Read in this order
1. **`/PRODUCT.md`** (repo root) — who/what/why: register, users (tradfi-curious newcomers), purpose, brand personality, anti-references, design principles, accessibility.
2. **`/DESIGN.md`** (repo root) — the visual system in Google-Stitch six-section format: tokens (frontmatter), colors, typography, elevation, components, do's & don'ts. **This is normative.**
3. **`/.impeccable/design.json`** — machine-readable sidecar: tonal ramps, shadows, motion, breakpoints, and **drop-in component HTML/CSS** (buttons, bucket card, badges, search, and the signature **Sentiment Gap meter**). Use these as the component truth.
4. **`design/content-model.md`** — the bucket taxonomy + the **securities availability vocabulary** + realistic data ranges. The content to render.
5. **`design/surfaces/`** — the three screens to mock, each a full UX brief:
   - `01-browse.md` — discovery / theme grid.
   - `02-bucket-dashboard.md` — **the centerpiece** (most craft here).
   - `03-enter-and-account.md` — one-signature entry + Arc account/NAV.

## What to produce
High-fidelity mockups (desktop-first, with a responsive read) for, in priority order:
1. **Bucket dashboard** (`surfaces/02`) — the flagship **AI** bucket, fully populated, with the Sentiment Gap hero, analyst band, prediction-legs table, related-securities table (with honest availability badges), and the Enter panel.
2. **Browse** (`surfaces/01`) — the non-uniform bucket grid (flagship AI larger; demo-ready full; aspirational dimmed).
3. **Enter flow + account** (`surfaces/03`) — connect → review → one signature → result (tx hashes), plus the Arc passkey/NAV bar.

Render the flagship **AI** bucket as the worked example (its real values are in `content-model.md`), and show one demo-ready contrast bucket (Crypto or Geopolitics) on the browse grid.

## Non-negotiables (carry these into every mock)
- **Use the DESIGN.md tokens** — graphite surface (`#0A0C10` page / `#14171E` panels), the two-voice color argument (**amber = real asset**, **azure = belief**), IBM Plex Mono for **every number** (tabular figures), neo-grotesque for words.
- **The Hue-Plus Rule:** belief vs. asset always carry glyph (● / ◆) + label + position, never hue alone.
- **Honesty is visual:** every security shows an availability badge; the `display-only · gated` badge is **mandatory** on any security that isn't Uniswap-tradeable. **Never** a one-click "Buy NVDA." **Never** the words "implied probability."
- **Flat by default:** depth from tonal steps + hairlines; shadow only on floating overlays. No ghost-card (border + shadow). No 24px+ radii.
- **Avoid:** crypto-degen neon, generic AI-SaaS (cream bg, gradient text, uppercase eyebrow kickers, identical icon-card grids), sterile legacy-bank gray, gamified-Robinhood confetti. (Full list: DESIGN.md §6.)
- **Source everything:** `live` / `fallback` pills on values; real on-chain tx hashes where they exist (see `surfaces/03` + repo README).

## Signature components to get right
The **Sentiment Gap meter** (two markers on one track + gap segment), the **Analyst Band** (bear→bull track + live-price marker), the dense **Data Table** (mono, tabular, hairline rules), and the **availability/source badges**. Drop-in HTML/CSS for several of these is in `/.impeccable/design.json` → `components`.

## After mocks return
Drop them in `design/mocks/` and we'll critique against `DESIGN.md` (impeccable `critique`/`audit`) and translate the approved direction into the existing Next.js app (`app/`, `components/`, `app/globals.css`), replacing the current MVP terminal styling.
