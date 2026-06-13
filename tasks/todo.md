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
- [x] Lock model: securities = display/anchor only (not buyable in-app); each carries an availability tag (LIVE-UNISWAP / TOKENIZED-BUT-GATED / NO-TOKENIZED-VERSION).
- [ ] Slice 1 (in progress): data model — `Security`+`Availability` types + `securities[]`; AI bucket on new shape; fix the stale analyst band. (TDD)
- [ ] Slice 2: add demo-ready buckets (Crypto, Macro/Fed, Geopolitics/Conflict, US Politics) from verified ids (bg verification agent).
- [ ] Slice 3: wire `securities[]` into the dashboard service/view (per-security pricing, availability passthrough, gap from headline security).
- [ ] Slice 4: multi-leg one-signature entry (EnterBasket batch fn + LI.FI contractCalls) — buy the whole index in one sig.
