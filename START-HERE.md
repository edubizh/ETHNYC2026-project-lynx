# START HERE — Project-Lynx build kickoff

> Paste-or-read this into a **fresh Claude Code session** to begin the build. It is self-contained and authoritative. Read it top to bottom, then begin with the Day-0/1 de-risk.

You are starting the BUILD phase of Project-Lynx for ETHGlobal New York 2026 (~36h hackathon, ends 2026-06-14). Today is 2026-06-13. Work in this repo. FIRST read CLAUDE.md and docs/README.md + docs/01-06.

## STEP 0: CONTEXT — DOCS ARE ALREADY CORRECTED (Approach B+), committed 2026-06-13 (commit 7917217)

CLAUDE.md + docs/01-06 are ALREADY corrected to Approach B+ and are AUTHORITATIVE — read them to load context; do NOT re-apply corrections. Go straight to the Day-0/1 de-risk below. The load-bearing facts now baked into the docs, for quick reference:

1. **ARCHITECTURE = "Approach B+".** Polygon mainnet (137) = execution chain (all real tx IDs). Arc Testnet (5042002) = ACCOUNT/NAV layer ONLY. LI.FI entry originates on ETHEREUM (1) or BASE (8453), NOT Arc — VERIFIED: LI.FI Arc->Polygon get-connections = {connections:[]} (dead). Approach A is feature-flagged in case Arc ships a route mid-event.
2. **PREDICTION LEG collateral = USDC.e** (0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174), NOT pUSD/native USDC. VERIFIED: NegRiskAdapter.col() = USDC.e.
3. **POSITION IDs — THE #1 DEMO-KILLER.** NegRiskAdapter wraps USDC.e into WrappedCollateral wcol (0x3A3BD7bb9528E159577F7C2e685CC81A765002E2); CTF outcome tokens mint against wcol, NOT USDC.e. DO NOT compute ids via ctf.getPositionId(USDCe, getCollectionId(0x0, conditionId, indexSet)). READ them: yesId = NegRiskAdapter.getPositionId(questionId, true); noId = NegRiskAdapter.getPositionId(questionId, false). It takes the QUESTION id, not the condition id.
4. **UNISWAP $7k PRIZE IS DECOUPLED FROM THE BASKET.** VERIFIED: LI.FI routes USDC->wstETH and USDC->USDC.e on Polygon via Fly/SushiSwap and 404s when constrained to Uniswap-only. The $7k artifact = a SEPARATE standalone Uniswap Trading-API /swap (tiny USDC<->WETH or USDC->wstETH) with its own captured tx hash + the Developer Feedback Form. Universal Router 0x1095692A6237d83C6a72F3F5eFEdb9A670C49223 on Polygon is the V4 router — prefer the Trading-API /swap. Uniswap /quote stays the dashboard price oracle.
5. **LI.FI CALL SHAPE:** getContractCallsQuote (top-level contractCalls array; each envelope: toContractAddress, toContractCallData, toContractGasLimit, fromAmount, fromTokenAddress) -> executeRoute. NOT getRoutes + options.destinationCall. fromChain=1 or 8453, toChain=137, toToken = native USDC 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359. Wrap ALL addresses in viem getAddress(). VERIFIED: LI.FI stepSimulation = integrator_not_allowed — NO LI.FI pre-sim; the cross-chain destination call is NOT atomic. Never claim 'can't half-fail'.
6. **GAMMA:** outcomePrices is a STRINGIFIED JSON array — JSON.parse it. **UNISWAP /quote:** q.quote is a STRING amount (no nested output.token.decimals); require a swapper field + x-api-key header. Pin a real response Day 1; write mocks to match. Seed mocks with verified odds: Anthropic 0.895/0.105, OpenAI-not-IPO 0.51/0.49.
7. **DROPPED from scope:** USYC and StableFX/EURC. Arc = Modular Wallet passkey + USDC balance + USDC-gas (Paymaster) + unified NAV = Target B. CONFIRM @circle-fin/modular-wallets-core version + rpcPath '/arcTestnet' against current Circle docs Day 0.
8. **DROPPED Chainlink as a dependency.** NVDA = display-only via a plain equities price API. Hero = the 'AI SENTIMENT GAP': belief-market odds vs the AI-correlated asset's percentile within a PUBLISHED analyst bear/bull band shown in the UI. Never say 'implied probability'.
9. **Kalshi = optional cross-venue panel only.**

(If `git status` ever shows uncommitted doc changes, commit them before coding.)

## RESOLVED DECISIONS (locked)

- **D1:** prediction leg = NegRiskAdapter.splitPosition (neutral YES+NO, USDC.e); directional CLOB = labeled stretch CTA only.
- **D2:** basket asset leg via Sushi (don't call it Uniswap) + a SEPARATE standalone Uniswap /swap for the $7k.
- **D3:** Polygon mainnet tiny ($1-5) for real txs + Tenderly VNet fork (Polygon) for dev/pre-sim; Arc Testnet for the account layer; pre-fund a Polygon demo wallet.
- **D4:** agentic = Day-2 stretch only.
- **Submit to 5 tracks:** Arc Target A + Arc Target B + LI.FI Composer + LI.FI Best UX + Uniswap Best API Integration ($7k).

## VERIFIED ADDRESSES / IDS (pin in lib/config.ts, all viem getAddress()-checksummed)

- NEGRISK_ADAPTER=0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296
- WCOL=0x3A3BD7bb9528E159577F7C2e685CC81A765002E2
- CTF=0x4D97DCd97eC945f40cF65F87097ACe5EA0476045
- USDCe=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
- USDC_NATIVE=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
- WSTETH=0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD
- UNIVERSAL_ROUTER(V4)=0x1095692A6237d83C6a72F3F5eFEdb9A670C49223
- PERMIT2=0x000000000022D473030F116dDEE9F6B43aC78BA3

Basket conditionIds:
- Anthropic-top-AI-model 0x0811ed7f71c2466d04f9ba801c0e21c9cfb016385cdff97b5c9984df0fa5801e (ends 2026-06-30, secondary/vivid leg)
- OpenAI-not-IPO-by-Dec-2026 0x3849e1d62e0807801913d3e2427e8caf3cc6dd1c8ef42d8d5c08c6f9c449dc5e (ends 2027-01-01, PRIMARY always-valid leg)
- AI-model negRiskMarketID=0x3dcd0f5c7c6df89336a87be866327c862646e18b5deee05f31c250451b3a2900

clobTokenIds to assert in the fork test:
- Anthropic YES=64887172491629329116501561142670952112197574356607923997934182163296576951634 NO=12813183214224132107278873250345740614275647031034326420266129033763649478747
- OpenAI-not-IPO YES=56615676606297588259337956203332341775475048285080710344367729433788967812170 NO=8070607953656787024050950499598687532281829563384949938603247089607814583142

## EXECUTION METHOD

Use superpowers:subagent-driven-development (or superpowers:executing-plans) to run docs/05 task-by-task, and superpowers:test-driven-development for every pure-logic unit and the contract (test -> fail -> implement -> pass -> commit). Use superpowers:systematic-debugging on any failure. Commit incrementally. Use superpowers:verification-before-completion before claiming any task done — evidence before assertions, and NEVER weaken a failing test to make it green (the exact trap that ships a contract delivering zero outcome tokens).

## DAY-0/DAY-1 DE-RISK — DO THESE FIRST, before touching the UI (all green by hour 8)

- **A)** Register the Uniswap Trading API key; capture ONE live /quote AND /swap on Polygon (pin the response shapes); make lib/config.ts hard-fail at startup if UNISWAP_API_KEY is missing. _[Uniswap Trading API REST; context7 for @uniswap/sdk-core; NO Uniswap MCP]_
- **B)** On a Tenderly VNet Polygon fork: create_vnet, set_erc20_balance USDC.e to EnterBasket, approve the adapter, call NegRiskAdapter.splitPosition(conditionId, amount), then READ the EXACT minted ERC-1155 ids via get_vnet_simulation_asset_changes AND cross-check adapter.getPositionId(questionId, true/false). Extract questionId for both legs from QuestionPrepared events / the Gamma questionID field. Write transfer logic + fork-test assertions against these REAL ids. _[tenderly MCP; blockscout read_contract; deepwiki Polymarket/neg-risk-ctf-adapter]_
- **C)** Execute the standalone Uniswap /swap tiny real tx on Polygon mainnet; capture the tx hash NOW as THE $7k artifact. _[Uniswap Trading API]_
- **D)** Stand up the Arc Modular Wallet passkey on Arc Testnet (rpcPath '/arcTestnet'); land ONE real USDC-gas Paymaster tx and screenshot it. _[circle MCP]_

Use POLYGON_RPC = a Tenderly VNet admin RPC in foundry.toml to avoid public-RPC rate limits.

## PER-TASK MCP CHECKPOINTS (docs/05 order)

- **Task 0 config:** pin all verified addresses; add NEGRISK_ADAPTER, WCOL, USDCE, WSTETH, equities-API key. _[circle]_
- **Task 1 registry:** PredictionLeg gains a questionId field; OpenAI-IPO is the PRIMARY leg. _[polymarket + prediction]_
- **Task 2 divergence:** rename to assetBandPercentile + 'AI Sentiment Gap'; surface the analyst band.
- **Task 3 adapters:** JSON.parse(outcomePrices); /quote q.quote is a string + swapper + x-api-key. _[Uniswap Trading API; Gamma]_
- **Task 6 EnterBasket.sol** (Foundry, fork TDD): splitPosition(conditionId, amount) with USDC.e; read yes/noId from adapter.getPositionId(questionId,bool); explicit `recipient` EOA calldata param (NOT msg.sender); ReentrancyGuard + checks-effects-interactions + exact-amount approvals + no persistent setApprovalForAll; getDetermined(marketId) guard reverting cleanly on resolved markets; revert-safe (forward USDC to recipient on any internal failure). Fork test MUST assert recipient.balanceOf(yesId)>0 AND balanceOf(noId)>0 AND EnterBasket holds zero wcol/USDC.e/outcome tokens. DELETE the false-green USDC-balance assertion. Asset leg = Universal Router/Sushi; do NOT call it the Uniswap prize swap. _[foundry + tenderly; deepwiki + blockscout]_
- **Task 6b (NEW):** standalone Uniswap prize /swap — wire the de-risk-C tx into the app + README with the tx hash. _[Uniswap Trading API]_
- **Task 7 LI.FI:** getContractCallsQuote -> executeRoute; pre-sim the EXACT calldata on the Tenderly fork; toToken = native USDC. _[lifi MCP; context7 @lifi/sdk; tenderly]_
- **Task 8 Arc:** Modular Wallet passkey + USDC balance + USDC-gas + unified NAV (Arc USDC + Polygon positions). _[circle]_
- **Task 9 deliverables** (schedule ~hour 28, NOT last): architecture diagram + demo video (name each sponsor tool on screen) + public repo + incremental git history + Uniswap Developer Feedback Form + recorded real tx hashes.

## DEMO SAFETY

Pre-fund the Polygon wallet as the 'already-bridged' state so no beat depends on a live cross-chain settlement in 90s. Own the neutral-set framing in the script ('we mint the full thematic exposure set non-custodially in one signature; the directional sell is one more click') and SHOW the sell CTA. No team member touches the Polymarket UI/CLOB on US soil (markets are restricted=true); narrate that you interact with the permissionless NegRisk/CTF protocol layer. If behind, ship dashboard (Arc Target A) + the standalone Uniswap tx ($7k) + Arc NAV (Target B) — a credible submission on its own.

## ORG / SECURITY NOTE

Non-custodial design — NO private keys in the repo or MCP config; never commit secrets; expand keys from shell env. Begin by reading the docs, then the Day-0/1 de-risk, then docs/05 task-by-task.
