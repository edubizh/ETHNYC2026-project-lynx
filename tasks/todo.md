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

## Build (docs/05, TDD)
- [ ] Task 0: root tooling (vitest+viem+ts) + `lib/config.ts` + `.env.example`
- [ ] Task 1: basket registry (real questionIds/gammaIds pinned) + test
- [ ] Task 2: divergence engine (AI Sentiment Gap) + test
- [ ] Task 3: Polymarket + Uniswap adapters + test
- [ ] Task 4: dashboard service + test
- [ ] Task 5: Next.js app scaffold + theme dashboard + DivergencePanel
- [ ] Task 6: `EnterBasket.sol` + Foundry fork test (Tenderly RPC) — recipient holds YES+NO, contract holds zero
- [ ] Task 6b: standalone Uniswap prize `/swap` code + script (USER runs live)
- [ ] Task 7: LI.FI `getContractCallsQuote` → executeRoute + EnterButton
- [ ] Task 8: Arc account layer (passkey + USDC balance + NAV) code
- [ ] Task 9: README + architecture diagram + demo script

## Verify before done
- [ ] All vitest unit tests green
- [ ] Foundry fork test green (recipient holds both outcome tokens; contract retains nothing)
- [ ] No `REPLACE_*` / placeholder logic remains
- [ ] Honest README on what is live-verified vs. needs-keys
