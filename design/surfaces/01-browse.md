# Surface 01 — Browse / Discovery

> The entry. Where a tradfi-curious visitor finds the narrative they care about and opens its bucket.
> Anchored by `PRODUCT.md` and `DESIGN.md`; content from `design/content-model.md`.

## 1. Feature Summary
The home surface. A visitor lands, understands in one line what Traditional Predictions is, searches or scans the **theme buckets**, and opens the one that matches a narrative they follow (AI, defense, the Fed). It must feel like the front page of a serious research terminal — not a marketing splash, not a token list.

## 2. Primary User Action
**Open the bucket that matches the narrative the user cares about.** Everything else (the intro line, search, status chips) serves that single click.

## 3. Design Direction
- **Color strategy:** Restrained (product default). Graphite + ink; amber appears only on the wordmark, the flagship status chip, and the two-voice card readout. No drenched hero.
- **Scene sentence:** *A portfolio-curious professional opens this on a desktop in the evening, low ambient light, calm and scanning — deciding which narrative to dig into, the way they'd open a research terminal, not a casino.* → forces dark.
- **Anchor references:** Bloomberg Terminal home (authority, density-on-demand), Linear's project list (clean rows, restraint), an ETF screener / fact-sheet index (legibility, status at a glance). Not adjectives — these three.

## 4. Scope
High-fidelity, **one surface** (the home/browse page), responsive (desktop-first, graceful mobile). Static mock for Claude design to render; production-ready intent.

## 5. Layout Strategy
- **Top bar** (slim, hairline underline): amber wordmark + "Traditional Predictions" (ink) left · theme **search** center-left · **account** (passkey / NAV) right.
- **One intro line** under the bar (Body, muted, ≤75ch): what this is. No giant hero, no eyebrow kicker.
- **Bucket grid**, responsive `repeat(auto-fit, minmax(300px, 1fr))`, **deliberately non-uniform**: the **flagship (AI)** card spans wider / reads larger; demo-ready cards full-strength; **aspirational** cards visually dimmed with a "coming soon" status. Order: flagship → demo-ready → aspirational.
- A quiet **filter** row: `All · Demo-ready` toggle. No sidebar.
- Each card = the `bucket-card` component (see DESIGN.md / sidecar): title, status chip, one-line thesis, the two-voice readout (`● belief 51%` azure / `◆ NVDA 59th` amber / `8 pts` gap), and counts ("2 prediction legs · 1 related security").

## 6. Key States
- **Default:** grid populated, flagship emphasized, values source-tagged (`live`/`fallback`).
- **Loading:** skeleton cards (graphite blocks, no spinners) — never a blank page.
- **Search active / match:** grid filters live as the user types.
- **No match:** a calm empty state that teaches ("No theme matches 'X'. Try AI, defense, crypto, or the Fed.") — not "nothing here."
- **Aspirational card:** dimmed, status `aspirational`, click leads to a "this bucket is coming — here's the thesis" preview, not a broken dashboard.
- **Live vs fallback:** card readout numbers carry the source pill; if all feeds are seeds, the page still renders fully.

## 7. Interaction Model
- **Search:** filters buckets by title/thesis/ticker as you type (debounced); Enter opens the top match.
- **Card hover:** raises one tonal step (graphite → graphite-raised), border lightens; 160ms ease-out; reduced-motion = instant.
- **Card click / Enter:** navigates to the bucket dashboard (Surface 02).
- **Keyboard:** grid is tab-navigable; focus draws the amber ring; arrow-key roving optional.

## 8. Content Requirements
- **Wordmark:** "Traditional Predictions" (amber glyph + ink text).
- **Intro line:** e.g. *"Index funds for prediction markets. Each bucket pairs the belief markets of a narrative with the real equities of the same story — so you can see, and act on, where the crowd and the market disagree."* (≤75ch per line, never says "implied probability").
- **Search placeholder:** "Search a theme — AI, defense, the Fed…"
- **Card copy:** title, one-line thesis (from content-model), counts, status chip ("Flagship" / "Demo-ready" / "Coming soon").
- **Empty/no-match:** the teaching message above.
- **Dynamic:** odds + band percentile per card (live, ranges per content-model), refreshed per load.

## 9. Recommended References (impeccable)
`layout.md` (non-uniform grid rhythm, the anti-card-grid discipline), `typeset.md` (the wordmark + intro hierarchy), `interaction-design.md` (search-filter behavior).

## 10. Open Questions
None blocking. **Defaults asserted:** desktop-first; `All/Demo-ready` filter defaults to **Demo-ready**; flagship is always AI; aspirational buckets are visible-but-dimmed (not hidden) to show ambition without overpromising.
