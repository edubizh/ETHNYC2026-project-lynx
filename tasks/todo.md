# Project-Lynx build — todo

Branch: `build/lynx-mvp` (off `main`). Architecture = Approach B+. Plan = `docs/05`.

## Day-0 de-risk (on-chain verification — read-only MCP, no keys)
- [x] Tenderly MCP authenticated (can fork + simulate)
- [x] `NegRiskAdapter.col()` = USDC.e (on-chain)
- [x] `getDetermined(marketId)` selector works; both markets unresolved
- [x] questionId + gammaMarketId + clobTokenIds for both legs (Gamma)
- [x] `getPositionId(questionId, bool)` == documented clobTokenIds (15+ sig figs)
- [x] EXACT-integer `getPositionId` == clobTokenIds (cast, full 256-bit) — #1 demo-killer fully de-risked
- [x] Working public Polygon RPC for fork test: `polygon-bor-rpc.publicnode.com` (alts: drpc, 1rpc, tenderly.gateway). Tenderly VNet skipped (account slug not reachable via MCP); Foundry fork test against real adapter is the gold-standard proof instead.

## Cannot do this session (require secrets the org policy forbids me to hold)
- [ ] (USER) Register Uniswap Trading API key; capture live `/quote` + `/swap` (de-risk A/C) → $7k artifact tx hash
- [ ] (USER) Arc Modular Wallet passkey + real USDC-gas Paymaster tx (de-risk D)
- [ ] (USER) Live LI.FI executeRoute real tx from a funded ETH/Base wallet
→ I build all these code paths + document exactly what to run.

## Build (docs/05, TDD) — ALL DONE + committed + pushed to origin
- [x] Task 0: root tooling (vitest+viem+ts) + `lib/config.ts` + `.env.example`
- [x] Task 1: basket registry (real questionIds/gammaIds/clobTokenIds pinned) + test
- [x] Task 2: divergence engine (AI Sentiment Gap) + test
- [x] Task 3: Polymarket + Uniswap adapters + test
- [x] Task 4: dashboard service + test (+ equities adapter + resilient buildDashboard)
- [x] Task 5: Next.js app (root App Router) + theme dashboard + DivergencePanel/AnalystBand/BasketTable
- [x] Task 6: `EnterBasket.sol` + Foundry fork test — recipient holds YES+NO, contract holds zero (6/6 green)
- [x] Task 6b: standalone Uniswap prize `/swap` code + script (USER runs live)
- [x] Task 7: LI.FI `getContractCallsQuote` → convertQuoteToRoute → executeRoute + EnterButton
- [x] Task 8: Arc account layer (Circle passkey + USDC balance + NAV) code
- [x] Task 9: README + architecture diagram + demo script

## Post-build: 2-engine adversarial review (Claude + Codex) → fixes applied
- [x] contract: reject mismatched conditionId/questionId (fund-stranding) + asset-leg minAmountOut floor
- [x] adapters: fetch timeouts + strict YES detection
- [x] integration: LI.FI per-call config + EnterButton chain detection + Permit2 primaryType from API
- [x] env/docs: NEXT_PUBLIC_CIRCLE_* var names (was a dead-Arc-demo bug) + LI.FI amount caveat elevated

## Verify before done — DONE
- [x] All vitest unit tests green (23/23)
- [x] Foundry fork test green (6/6; recipient holds both outcome tokens; contract retains nothing)
- [x] No `REPLACE_*` / placeholder logic remains (real on-chain-verified values)
- [x] `tsc` clean + `next build` green (4 routes)
- [x] Honest README on what is live-verified vs. needs-keys

## LIVE (executed on-chain / in-app)
- [x] EnterBasket deployed to Polygon mainnet: `0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0` (tx `0xb71430…cde4b7`); wiring verified on-chain
- [x] Uniswap $7k swap (USDC→wstETH): tx `0x23a05c…27cbde` (status 1, Universal Router, wstETH delivered)
- [x] Arc passkey smart account creates in-app on Arc Testnet + unified NAV renders
- [x] Dashboard pulls ALL-LIVE data (Gamma odds + Finnhub NVDA + Uniswap /quote wstETH) — AI Sentiment Gap live

## Remaining (submission polish only)
- [ ] (USER) Submit the Uniswap Developer Feedback Form with swap hash `0x23a05c…27cbde` (required for $7k)
- [ ] (USER, optional) Fund Arc smart account from faucet.circle.com + one USDC-gas Paymaster userOp
- [ ] (USER) LI.FI live entry — tune the amount/fee floor first (demo uses pre-funded Polygon wallet fallback)
- [ ] (USER) Record 90s demo video (docs/demo-script.md), naming each sponsor tool

## Functionality v2 — buckets + securities (display/anchor model)
> This session = data/contracts. Frontend (visual + branding Project-Lynx→Traditional Predictions) = separate Claude Code session. Design system in PRODUCT.md/DESIGN.md/design/.
- [x] Lock model: **non-US** (Polymarket-style geo) + **EVM-only, conform to sponsors**. Securities buyable in-app only when EVM/Uniswap-liquid (`LIVE-UNISWAP`); single-name stocks have no EVM venue → `DISPLAY-ONLY` anchor (tradeable for users off-rail, just not on our rails). Prediction baskets are the executable instrument.
- [x] Slice 1: data model — `Security`+`Availability` types + `securities[]`; AI bucket on new shape; fix the stale NVDA band. (TDD) — commit a2f25d0
- [x] Slice 2: all 5 buckets executable (verified NegRisk legs) + `securities[]`; 2-state availability (LIVE-UNISWAP | DISPLAY-ONLY); fixed pinned ITA/DJT bands. 28/28 green. (TDD)
- [x] Slice 3: `securities[]` exposed in DashboardView (per-security pricing routed by availability — LIVE-UNISWAP via Uniswap /quote, else equities feed; crypto headline now Uniswap-priced; fixed WBTC 8-decimal /quote bug that quoted ~10B WBTC → $584k). availability/badge data flows to the API for the frontend. 35/35 green. (TDD)
- [x] Slice 4: capital-splitting basket entry — `buildBasketContractCalls` splits the deposit across ALL the bucket's prediction MARKETS per our strategy weights (one weighted LI.FI Composer contractCall each — an index allocation, NOT a parlay); `buildEnterQuote` + `EnterButton` rewired to N calls. No contract redeploy (uses the deployed `EnterBasket`). (TDD, 32/32 green)
- [ ] Slice 4b: fold the on-chain asset leg (wstETH/WBTC) into the entry route (needs swap calldata / LI.FI token delivery); today the deposit splits across the prediction markets only.
- [ ] Reconcile design docs (PRODUCT.md / DESIGN.md / design/content-model.md) to the non-US + EVM availability framing (currently say "US-gated / display-only").
- [ ] Known refinement: the Sentiment Gap is a naive |belief − bandPercentile|; for inversely-correlated pairs (e.g. "no Fed cuts" ↔ TLT) it can read large even when consistent. Consider a correlation-aware gap later.

## Design implementation (from Claude design handoff bundle)
> Bundle in `design/mocks/` (gitignored — heavy PNGs). MONOCHROME system: white #FFFFFF = numbers/headings, silver #E8EBEF = asset voice (◆), steel #8A95A6 = belief voice (●); green/red functional only; never red/green heat. This SUPERSEDES the amber/azure in DESIGN.md (the user retheme'd in Claude design). Fonts: Inter Tight + IBM Plex Sans + IBM Plex Mono.
- [x] Fonts wired (layout) + **BROWSE mindshare treemap** (app/page.tsx): tiles sized by mindshare (lib/mindshare.ts seeds), up/down via graphite brightness + sparkline tone + ▲/▼ (no red/green); AI flagship + Others tile; every tile links to its bucket. tsc clean, 35/35 green, renders.
- [x] DASHBOARD redesign (app/theme/[slug]/page.tsx): graph-forward + buy-at-top — Arc NAV bar (ArcAccountBar, passkey), inline buy w/ allocation split (BuyBox → LI.FI multi-call), Sentiment Gap meter, Analyst Band, prediction-market cards + asset-leg card, ANCHOR security row w/ honest non-US badge. Generalized to every bucket, wired to live buildDashboard. Retired the 5 old MVP components. tsc clean, renders 200.
- [x] Full 4-step Enter SHEET modal (EnterSheet.tsx: Connect → Review → Sign route-chips → Result/Refund) wired to the real LI.FI multi-call; opened by BuyBox. + slide-over **account panel** (AccountPanel.tsx) + interactive **TopBar** header, all sharing one Arc passkey via a small ArcProvider context (lib/arc/context.tsx); ArcAccountBar refactored onto it. tsc clean, 35/35 green, both screens 200.
- [ ] globals.css → monochrome tokens (the new pages are self-contained inline-styled; globals cleanup optional).
- [ ] Replace mindshare SEEDS with real 24h activity; wire timeframe filter + search.
