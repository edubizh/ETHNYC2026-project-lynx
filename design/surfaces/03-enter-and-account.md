# Surface 03 — Enter Flow & Account (Arc)

> The one-signature entry and the account/NAV layer. Where the basket actually executes — honestly.
> Anchored by `PRODUCT.md`/`DESIGN.md`. Mirrors the live architecture (LI.FI from Ethereum/Base → EnterBasket on Polygon; Arc = account/NAV only).

## 1. Feature Summary
Two linked pieces. **Enter:** a single-signature flow that buys the bucket's prediction basket (real Polymarket NegRisk neutral YES+NO set in USDC.e + a crypto asset leg) into the user's own wallet, funded from Ethereum/Base via LI.FI. **Account:** the Arc passkey wallet showing USDC balance, **unified NAV across Arc + Polygon**, and gas paid in USDC. The flow must feel like signing one clear instruction at a brokerage, not assembling a crypto transaction.

## 2. Primary User Action
**Sign once to enter the basket** — and immediately see what landed (positions + tx hashes) in their own wallet.

## 3. Design Direction
- **Color strategy:** Restrained; amber only on the execute button and the success/live confirmations (green for confirmed state). Calm and reassuring at the moment of commitment.
- **Scene sentence:** *A first-timer is about to commit real money on a desktop, a little anxious, wanting to know exactly what happens and that they stay in control — so the flow is plain, sourced, and reversible-feeling.* → dark, low-noise, high-clarity.
- **Anchor references:** Stripe Checkout (one clear action, evident state), a brokerage order-confirmation screen (you know exactly what you're buying), Rainbow/Coinbase wallet confirmations (clean signing, plain language) — but stripped of degen energy.

## 4. Scope
High-fidelity, **a short flow** (connect → review → sign → result) plus a persistent **account bar/panel**. Responsive. Production-ready intent. The flow is modal-light: prefer an inline sheet over a stack of modals.

## 5. Layout Strategy
- **Account bar** (persistent, top of bucket dashboard): passkey state, `USDC on Arc`, `Unified NAV (Arc + Polygon)` — all mono. When not signed in: `Sign in with passkey` / `Create passkey wallet`.
- **Enter flow** as an inline sheet / expanding panel (overlay shadow is allowed here — it floats):
  1. **Connect / chain guard** — connect a wallet on **Ethereum or Base**; if on the wrong chain, a clear instruction ("Switch to Ethereum or Base — entry never originates on Arc/Polygon"). Never block silently.
  2. **Review** — a plain order summary: "You're buying: the [Bucket] basket — a neutral YES+NO set on [N markets] (USDC.e) + [asset leg]. Delivered to your wallet `0x…`. Non-custodial." Amount, est. fees, the legs.
  3. **Sign** — one signature; the LI.FI route (swap → bridge → EnterBasket) shown as **step chips with live status** (PENDING → DONE), not hidden.
  4. **Result** — success state: positions delivered, **tx hashes** (Polygonscan links, mono, truncated), and the `Sell to go directional →` follow-up.

## 6. Key States
- **Disconnected:** connect prompt; account bar shows passkey options.
- **Wrong chain:** explicit switch instruction (Ethereum/Base only).
- **Review:** the order summary above; Enter is amber + enabled.
- **Building route:** route step chips appear; button → "Building one-signature route…" then "Executing (one signature)…".
- **Pending:** per-step PENDING/DONE; a calm progress read, no spinner-in-the-void.
- **Success:** green confirmation, positions list, tx hashes, NAV updates.
- **Error / revert-safe refund:** if a leg fails, show the honest outcome — `EnterBasket` is revert-safe and refunds USDC.e to the recipient; surface "Funds returned to your wallet," never a stuck state.
- **Demo fallback:** support a "pre-funded (already-bridged) Polygon wallet" path so a live demo never waits on a bridge — design a subtle "demo mode" affordance the presenter can use.
- **Display-only reminder:** if the user came from a securities row, reinforce that securities aren't part of this on-chain execution (the basket is); no fake security purchase.

## 7. Interaction Model
- **Connect:** injected wallet; chain detection drives the guard.
- **Passkey (Arc):** `Create` (register, unique username) / `Sign in` (login) → smart account address + USDC balance render; gas is sponsored in USDC (Paymaster) — state it.
- **One signature:** a single sign; route progress streams into the step chips (`updateRouteHook`).
- **Result:** tx hashes are copy-on-click and link out; NAV recomputes (Arc USDC + Polygon basket value).
- **Motion:** state transitions 160–220ms ease-out; the success check is a single tasteful confirm, not confetti; reduced-motion = instant.

## 8. Content Requirements
- **Order summary copy:** the plain-language "You're buying…" block above; explicit non-custodial + never-create-markets line.
- **Chain-guard copy:** "Switch your wallet to Ethereum or Base — LI.FI entry never originates on Arc/Polygon."
- **Route steps:** "Swap → Bridge (from Base) → EnterBasket on Polygon."
- **Success copy:** "Positions delivered to your wallet." + tx-hash table (EnterBasket entry; the standalone Uniswap $7k swap shown separately as evidence, clearly labeled "separate from the basket").
- **Refund copy:** "A leg didn't complete — your USDC.e was returned to your wallet. Nothing was stranded."
- **Account copy:** "USDC on Arc", "Unified NAV (Arc + Polygon)", "Gas paid in USDC".
- **Recorded real hashes (for evidence panel):** EnterBasket deploy `0xb71430…cde4b7`; Uniswap $7k swap `0x23a05c…27cbde` (status 1). (See repo README.)

## 9. Recommended References (impeccable)
`interaction-design.md` (the sign flow, step chips, form/guard states), `harden.md` (wrong-chain, pending, error/refund, demo-fallback — the edge states are the work here), `clarify.md` (the plain-language order/refund/guard copy), `onboard.md` (passkey first-run / empty NAV).

## 10. Open Questions
None blocking. **Defaults asserted:** inline sheet over stacked modals; route steps always visible (transparency builds trust); the standalone Uniswap swap is shown as labeled evidence, never conflated with the basket asset leg; "demo mode" (pre-funded Polygon wallet) is a presenter affordance, clearly separate from the real one-signature path.
