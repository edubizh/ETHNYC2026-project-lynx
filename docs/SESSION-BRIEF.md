# Project-Lynx — Fresh Session Brief (READ-ONLY onboarding)

> Paste-target for a new Claude Code session. **This is read-only onboarding.** Read it top to bottom,
> read the files it lists, then **STOP and wait for the next instruction.** Do NOT edit, create, run,
> build, deploy, commit, push, or change anything until explicitly told to.

You are taking over **Project-Lynx**, an ETHGlobal New York 2026 hackathon project. **The MVP is already BUILT and LIVE on-chain.** Your job right now is to fully understand it, then confirm your understanding and wait.

## What it is (one line)
A non-custodial, thematic prediction-market index + intelligence dashboard. Hero feature = the **"AI Sentiment Gap"**: Polymarket belief-market odds vs. where an AI-correlated asset (NVDA) sits as a **percentile within a published analyst bear/bull band**. "Enter a theme" = one signature buys a curated basket (real Polymarket NegRisk YES+NO set in USDC.e + an on-chain asset leg) into the user's own wallet. Three sponsors: **Arc (Circle)**, **LI.FI**, **Uniswap**.

## STEP 1 — Read these files in this order (do not skip)
1. `CLAUDE.md` — auto-loaded project briefing + hard constraints.
2. `docs/README.md`, then `docs/01-product-and-design.md` → `docs/06-mcp-servers.md` — full design, sponsor integration, locked decisions, build plan, implementation plan, MCP setup. **These are design-time docs (the plan).**
3. `README.md` (repo root) — **the CURRENT live status + recorded tx hashes.** Authoritative for "what's actually done."
4. `docs/architecture.md`, `docs/demo-script.md`, `docs/go-live.md`.
5. `tasks/todo.md` (live build tracker) and `tasks/lessons.md` (hard-won lessons + gotchas).
6. The code: `lib/` (config, addresses, baskets/registry, divergence engine, adapters, dashboard service, lifi/enter, arc/wallet, uniswap/prizeSwap), `app/` (Next.js App Router), `components/`, and `contracts/src/EnterBasket.sol` + `contracts/test/EnterBasket.t.sol`.

## STEP 2 — Critical CURRENT-STATE facts (docs are design-time; THIS is what's true now)
- **Architecture = Approach B+:** Polygon mainnet (137) = execution; Arc Testnet (5042002) = account/NAV layer only; LI.FI entry originates on Ethereum (1)/Base (8453), **never Arc** (Arc→Polygon LI.FI route is verified dead, `{connections:[]}`).
- **It is LIVE.** Real on-chain artifacts:
  - **EnterBasket deployed (Polygon 137):** `0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0` (deploy tx `0xb71430e8a5baa6b616ae8dc06c13597ff33c31ad89561263b42fe94d08cde4b7`). On-chain-verified wiring: `adapter()`=NegRiskAdapter, `usdce()`=USDC.e.
  - **Uniswap $7k swap (Polygon 137):** tx `0x23a05c509b64c36ef38671d19a965f8464ca1c2876848637924972a72327cbde` — real USDC→wstETH via the Trading API, status 1, through Universal Router `0x1095692A6237d83C6a72F3F5eFEdb9A670C49223`.
  - **Arc:** Circle Modular Wallet **passkey** smart account creates in-app on Arc Testnet; unified NAV renders. (The smart-account address is passkey-derived per session, not a fixed artifact.)
  - **Dashboard pulls all-live data:** Polymarket Gamma odds + Finnhub NVDA price + Uniswap `/quote` (wstETH) → the AI Sentiment Gap, every value tagged `live`.
- **Tests/build green:** 23 vitest unit tests; 6/6 Foundry fork tests against the REAL NegRiskAdapter on a Polygon fork; `tsc` clean; `next build` green (4 routes).
- **Git:** branch `main` == `build/lynx-mvp` (the MVP is merged to `main`). The app runs at repo root (single Next.js project), `@/*` → repo root.
- **A concurrent/parallel process commits brand assets** to this repo (commits like "v1 stack", "assets: Lynx brand logo") and has switched branches mid-work before. If `git status`/branch looks unexpected, check `git reflog`; commits are safe on the branch refs. **Leave `assets/` alone unless told.**
- **Secrets live in `.env.local` (gitignored):** `UNISWAP_API_KEY`, `EQUITIES_API_KEY` (Finnhub), `NEXT_PUBLIC_CIRCLE_CLIENT_KEY`, `POLYGON_RPC`, `PRIVATE_KEY`, `NEXT_PUBLIC_ENTER_BASKET`. Never echo, commit, or move secrets. The deploy/swap wallet `0x67d9A60578c931b322C85b980723631f8914Dc14` had its private key shared in plaintext earlier → treat it as **compromised/throwaway; never reuse for real funds.**

## STEP 3 — Verified on-chain values (do not relitigate; full set in README/`docs/05`)
- USDC.e (NegRisk collateral) `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`; native USDC `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`; NegRiskAdapter `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296`; WrappedCollateral `0x3A3BD7bb9528E159577F7C2e685CC81A765002E2`; CTF `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045`; wstETH `0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD`; Permit2 `0x000000000022D473030F116dDEE9F6B43aC78BA3`.
- Basket prediction legs (NegRisk, `restricted=true`): **OpenAI-not-IPO** (PRIMARY) gammaId `608368`, conditionId `0x3849…dc5e`, questionId `0xd2c2…bf06`; **Anthropic-top-model** gammaId `631121`, conditionId `0x0811…801e`, questionId `0x3dcd…2901`. The #1 demo-killer is solved: read position ids from `NegRiskAdapter.getPositionId(questionId, bool)` (NOT `ctf.getPositionId(USDC.e, …)`) — verified == the Gamma clobTokenIds to full 256-bit precision.

## STEP 4 — Hard constraints (from `docs/03`, do not violate)
Tap existing markets (never create our own) · non-custodial (positions to the user's own wallet; never be the venue/fund) · prediction leg uses the permissionless `NegRiskAdapter.splitPosition` neutral YES+NO path, never the operator-gated CLOB · no team member touches the Polymarket UI/CLOB on US soil · the hero is the **"AI Sentiment Gap"**, never call it "implied probability" · submit to exactly 3 sponsors (5 tracks).

## STEP 5 — Known gotchas (from `tasks/lessons.md`)
- `EnterBasket` must inherit OZ `ERC1155Holder` (the adapter `safeBatchTransferFrom`s the set to it) — already done.
- Server-only `lib/config.ts` throws at import if `UNISWAP_API_KEY` missing → must NOT be imported by any `"use client"` component (client code uses `lib/addresses.ts`).
- Uniswap `/quote` shape: `quote.output.amount` + `quote.swapper` (NOT a top-level string). `/swap` returns `{swap:{to,data,value}}`. Permit2 sign uses `permitData.primaryType`.
- Circle Modular Wallets: needs BOTH a Client Key (Allowed Domain) AND a Passkey **Domain Name** set in the console (Modular Wallets → Configurator), matching exactly (`localhost` for dev). Register uses a unique username to avoid "username is duplicated".
- blockscout `read_contract` coerces uint256 → JS float (precision loss) — use `cast`/Tenderly for exact 256-bit values.

## STEP 6 — What remains (submission polish only — do NOT do until instructed)
Submit the **Uniswap Developer Feedback Form** with the swap hash (required for $7k) · record the 90s demo video (`docs/demo-script.md`) · optional: fund the Arc smart account + one USDC-gas Paymaster userOp · the **LI.FI live one-signature entry** still needs amount/fee tuning (`buildEnterQuote` sends equal src/dest amounts; bridge fees would make the fixed `EnterBasket` call revert — set the basket amount below the guaranteed-arrival floor or use exact-output `toAmount`); the demo uses a pre-funded "already-bridged" Polygon wallet as fallback.

## Environment
MCP servers available: `blockscout`, `tenderly`, `lifi`, `circle`, `polymarket`, `prediction`, `foundry`, `context7`, `deepwiki` (all read/codegen-only, no keys). Foundry (`forge`/`cast`) at `~/.foundry/bin` (add to PATH). Use `context7`/Circle/LI.FI MCP for SDK questions; blockscout for on-chain reads.

## Now do this
Read everything in Step 1, then reply with a concise summary proving you understand: (a) what the product is, (b) the Approach B+ architecture, (c) what's already live on-chain (with the tx hashes), (d) the repo/branch state, and (e) the top constraints. Then **STOP and wait** for the next task. Take no action until instructed.
