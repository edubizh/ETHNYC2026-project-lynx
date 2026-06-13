# Surface 02 — Bucket Dashboard (the centerpiece)

> The full-circle picture: the belief markets of a narrative, the real securities of the same narrative,
> and the cross between them — then enter the basket in one signature.
> This is the hero surface. Anchored by `PRODUCT.md`/`DESIGN.md`; content shape in `design/content-model.md`.

## 1. Feature Summary
Inside a bucket, a tradfi-curious user sees everything about a theme's prediction markets (odds, stats, the data) **next to the real equities of that same narrative**, with the **Sentiment Gap** as the hero — where the crowd's belief sits versus where the related asset sits in its published analyst band. They can read the whole picture in five seconds, drill into the evidence, and **enter the curated prediction basket in one signature**.

## 2. Primary User Action
**Understand the cross, then enter the basket.** The screen must make "belief vs. the real asset of this story" instantly legible, and put a single confident "Enter basket" action within reach.

## 3. Design Direction
- **Color strategy:** Restrained surface with **one Committed moment** — the Sentiment Gap hero earns the two-voice color (azure belief / amber asset) and the gap segment between them. Everything else graphite + ink.
- **Scene sentence:** *An analyst-minded newcomer studies one narrative on a wide desktop screen, focused and slightly skeptical, wanting the receipts before they act — a research terminal they can actually read.* → dark, dense-but-calm.
- **Anchor references:** a Bloomberg security page (the data spine, tabular numerics), an ETF fact sheet (holdings table + a single hero chart + plain-language summary), Stripe's dashboard detail views (calm hierarchy, evidence over chrome).

## 4. Scope
High-fidelity, **one rich surface** with several modules, responsive (desktop-first; modules stack on narrow). Production-ready intent. This is the screen judges and users remember — most craft goes here.

## 5. Layout Strategy
Single column, generous max-width (~1040px), modules top→bottom, each a flat graphite panel separated by space (not boxes-in-boxes):

1. **Bucket header** — back-to-themes, bucket title (Display), one-line thesis (Body muted), status chip.
2. **Account / NAV bar** — Arc passkey state, USDC on Arc, **unified NAV (Arc + Polygon)**. Persistent; see Surface 03.
3. **HERO — Sentiment Gap meter** — the `sentiment-gap` signature component: two markers on one 0–100 track (● azure belief, ◆ amber asset percentile), the gap segment + value (`8 pts`, mono), and a plain-language read ("belief runs hotter than the asset"). The screen nobody else has.
4. **Analyst Band** — the headline security's bear→bull track with a live-price marker and `bear $X / $price / bull $Y` (mono). This is the "receipts" behind the asset-side percentile.
5. **The cross, in one sentence** — e.g. *"Belief markets price the event at 51%; NVDA sits at the 59th percentile of its published analyst bear→bull band — an 8-point gap."* Never "implied probability."
6. **Prediction legs table (executable)** — the basket holdings: label · YES odds (azure, mono, source tag) · weight. This is what you buy.
7. **Related securities table (the anchor layer)** — ticker · name · price (mono, source tag) · band percentile · **availability badge** (`display-only · gated` etc.). This is the legibility layer — explicitly *not* buyable here.
8. **Enter panel** — the `Enter basket · one signature` CTA (amber), a one-line plain explanation of what lands in the wallet (neutral YES+NO set + asset leg, non-custodial), and a secondary `Sell to go directional →` (disabled/stretch). Links to Surface 03.

## 6. Key States
- **Default (all live):** every module populated, values tagged `live`.
- **Loading:** per-module skeletons (gap meter, band, tables) — page frame renders immediately.
- **Partial fallback:** any feed down → that value shows its seed with an `○ fallback` pill; the page never half-breaks. (This is a real product behavior — design it, don't hide it.)
- **Resolved/closed market:** a prediction leg whose market resolved shows a "resolved" state and is excluded from a fresh entry (the contract reverts on resolved markets) — surface this honestly.
- **Empty securities (e.g. US Politics):** the securities table shows a calm "No tradeable tokenized security maps to this narrative — the asset leg is a crypto proxy (wstETH)" rather than a blank table.
- **Aspirational bucket:** thesis + intended legs shown, Enter disabled with a "coming soon" note.
- **Error / 404:** unknown slug → a clean not-found that routes back to browse.

## 7. Interaction Model
- **Gap meter:** static by default; on hover/focus of a marker, a tooltip gives the exact figure + source. No decorative motion; a single 220ms reveal when the module first loads (with reduced-motion fallback = instant).
- **Tables:** row hover → graphite-raised; numeric columns right-aligned, mono, tabular; conditionId/tx cells are copy-on-click with a truncated `0x3849…dc5e` display.
- **Drill-down (legible→deep):** a quiet "details" affordance per prediction leg reveals conditionId / questionId / on-chain ids for the power user — collapsed by default.
- **Availability badge:** hover explains why a security is display-only (chain / gating), reinforcing trust.
- **Enter:** opens the one-signature flow (Surface 03).

## 8. Content Requirements
- **Bucket header:** title + thesis (content-model), status chip.
- **Gap read sentence:** dynamic, templated from belief% + percentile + gap + direction. Forbidden phrase: "implied probability."
- **Prediction legs:** label, YES odds, weight, source.
- **Securities:** ticker, name, price, band, availability badge + a one-line `note` (e.g. "xStocks on Solana; US-gated").
- **Enter explanation:** *"One signature buys a real Polymarket neutral YES+NO set (USDC.e) plus the on-chain asset leg, delivered into your own wallet. We never custody funds and never create markets."*
- **Fallback / resolved / empty** microcopy as above.
- **Dynamic ranges:** per `design/content-model.md` (odds 0–100%, gap 0–60 pts, percentile 0–100th).

## 9. Recommended References (impeccable)
`layout.md` (module rhythm, the spine), `interaction-design.md` (tables, drill-down, tooltips), `typeset.md` (the mono/sans data hierarchy), `harden.md` (the fallback / resolved / empty / error states), `animate.md` (the single tasteful gap-meter reveal).

## 10. Open Questions
None blocking. **Defaults asserted:** single-column spine (not a multi-column dashboard grid — it reads more like a fact sheet, which suits newcomers); the gap meter is the one Committed-color moment; power-user ids are collapsed by default; the securities table always renders an availability badge even when there's only a crypto proxy.
