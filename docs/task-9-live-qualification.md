# Task 9 — Live 3-track qualification (hand-off runbook)

> **Prepared by Claude; executed by you.** These are the live/manual ops that *secure the three sponsor
> tracks*. They need your wallet, passkey, and booth API keys — Claude must not run them. Record every
> resulting tx hash in `README.md` (the "Recorded tx hashes" table, line ~62).
>
> **Wallet safety:** use a **throwaway** wallet only. The wallet `0x67d9A60578c931b322C85b980723631f8914Dc14`
> had its private key shared in plaintext earlier → treat it as compromised; never put real funds in it.
>
> Supersedes the entry/Arc specifics of `docs/go-live.md` §3–§4 (which predate the same-chain spine).

## Current state (already done — don't redo)
- ✅ **EnterBasket** deployed Polygon 137 `0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0` (revert-safe; `enterPredictionLeg` + `enterAssetLeg`).
- ✅ **Uniswap standalone $7k swap** on-chain: `0x23a05c509b64c36ef38671d19a965f8464ca1c2876848637924972a72327cbde` (status 1, Universal Router).
- ✅ **Arc passkey Modular Wallet** creates in-app on Arc Testnet; unified NAV renders.
- ✅ Same-chain (137) entry spine wired + verified buildable (LI.FI Composer, executor `0x2dfaDAB8266483beD9Fd9A292Ce56596a2D1378D`).
- ✅ Code green: 81/81 vitest, tsc clean, `next build` green, 7/7 Foundry fork tests.

## Prerequisites
- `.env.local` filled: `UNISWAP_API_KEY`, `NEXT_PUBLIC_CIRCLE_CLIENT_KEY`, `POLYGON_RPC`, `NEXT_PUBLIC_ENTER_BASKET=0x5c36C4F32C437420b8c8E1018E64C1496F69E1d0`, (optional `EQUITIES_API_KEY`).
- Throwaway wallet funded **on Polygon mainnet**: ~2 POL (gas) + ~5 **native USDC** (`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`) — the same-chain entry funds from native USDC.
- For Arc: the passkey wallet's Arc-Testnet USDC from `https://faucet.circle.com` (Arc Testnet USDC is also the gas token).

---

## Track A — Uniswap (Best API Integration, $7k)

The on-chain artifact already exists (`0x23a0…cbde`). The remaining gate is the **form**.

1. **Submit the Uniswap Developer Feedback Form** with tx hash `0x23a05c…27cbde` (get the form link at the Uniswap booth / Trading API developer portal). **This is required for the $7k** — the swap alone doesn't count.
2. *(Optional)* mint a fresh hash if you want a same-day artifact:
   ```bash
   npx tsx scripts/runPrizeSwap.ts        # reads .env.local; prints PRIZE TX HASH (USDC→wstETH)
   ```
3. Confirm `/quote` is powering the dashboard (the asset cards show "uniswap /quote oracle") and the sleeve `minOut` floors (server route `/api/basket-entry`).

**Acceptance:** swap tx status 1 on Polygon + feedback form submitted.

---

## Track B — LI.FI (Most Innovative Composer + Best UX)

Goal: **one live same-chain (137) Composer route** so the neutral YES+NO sets **and** ≥1 sleeve token land in your wallet from a single signature.

1. `npm run dev` → open `http://localhost:3000/theme/ai`.
2. In the Enter sheet, connect a wallet **on Polygon (137)** holding native USDC. (If on another chain, the sheet shows **"Switch to Polygon."**) The Sign step shows **2 chips** — `Swap · USDC→USDC.e` and `EnterBasket · split across legs` (no Bridge).
3. Enter a small amount (e.g. **5 USDC**), **Sign once**.
   - Under the hood: `POST /api/basket-entry` (real Uniswap `/quote` floors) → `buildEnterQuote({fromChainId:137, fromToken: nativeUSDC, toToken: USDC.e})` → `executeRoute`. The route swaps native USDC→USDC.e and fans across `enterPredictionLeg`×N + `enterAssetLeg`×M.
4. Confirm on Polygonscan (the sheet links it): the EnterBasket tx; your wallet now holds the YES+NO outcome tokens + the sleeve tokens (AI = WETH + LINK). **Record the tx hash.**

**Notes:**
- The route is revert-safe: a leg that under-delivers refunds that slice's USDC.e (no stranded funds).
- The `/api/basket-entry` route **refuses to build a 0-minOut swap**, so if `/quote` is down for a sleeve token the call errors rather than shipping an unprotected swap — fund/try when `/quote` is live.
- Cross-chain (Ethereum/Base) is a stretch behind `NEXT_PUBLIC_ENABLE_CROSSCHAIN_ENTRY=true` — keep it OFF for the primary demo; it's backup evidence only.

**Acceptance:** a real LI.FI route executes end-to-end on Polygon; sets + ≥1 sleeve token in the recipient wallet.

---

## Track C — Arc (Target A + Target B)

Done: passkey Modular Wallet on Arc Testnet + unified NAV (incl. sleeve tokens). The **load-bearing artifact** = a **USDC-gas userOp on Arc Testnet** (gas paid in USDC, not native) — this makes Arc do real work, not just display.

**Why this and not CCTP:** Circle Paymaster is **live on Arc Testnet** (verified — v0.8 `0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966`, v0.7 `0x31BE08D380A21fc740883c0BC434FcFc88740b58`; Modular Wallets are ERC-4337 so `paymaster:true` userOps work). **CCTP Arc→Polygon is impossible** — Arc is testnet, Polygon execution is mainnet, and CCTP can't cross that boundary (it only reaches Polygon Amoy / Eth Sepolia).

> ⚠️ **Code prerequisite (NOT a pure click — ~30 lines, Claude can do it).** Today `lib/arc/context.tsx` creates
> the `bundlerClient` in `createArcPasskeyAccount` but **discards it**; `useArc()` exposes only
> `connect/address/usdc/status`. There is no UI path to send a userOp yet. Needed:
> 1. In `lib/arc/context.tsx`: keep the `bundlerClient` + `account` in state and add a
>    `sendGaslessUserOp()` action.
> 2. A "Send USDC-gas test op" button in the Account panel that calls it.
>
> Wiring sketch (verify against Circle's "create-a-wallet-and-send-gasless-txn" quickstart):
> ```ts
> // returns the Arc tx hash for the README
> const hash = await bundlerClient.sendUserOperation({
>   account,
>   paymaster: true,                                   // gas in USDC via Circle Paymaster
>   calls: [{ to: account.address, value: 0n, data: "0x" }], // harmless self-call
> });
> const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash });
> // receipt.transactionHash → https://testnet.arcscan.app/tx/<hash>
> ```

**Steps once wired:**
1. `/theme/ai` → **Create passkey wallet** in the Account bar.
2. Fund the Arc smart account from `https://faucet.circle.com` (Arc Testnet USDC); confirm USDC balance + unified NAV render.
3. Click **Send USDC-gas test op**; confirm the userOp on `https://testnet.arcscan.app`. **Record the tx hash.**

**Acceptance:** wallet creates via passkey; NAV renders Arc USDC + Polygon basket; one USDC-gas userOp confirmed on Arc Testnet.

---

## Record the hashes (README)

Add rows to the `README.md` "Recorded tx hashes" table:

| Artifact | Chain | Tx hash |
| --- | --- | --- |
| **LI.FI same-chain Composer entry** | Polygon 137 | `0x…` ← from Track B |
| **Arc USDC-gas userOp (Paymaster)** | Arc Testnet | `0x…` ← from Track C |

And tick the "Submit the Uniswap Developer Feedback Form" item in the README "Verification status" section once submitted.

## Final regression gate (Claude can run; all currently green)
```bash
npx vitest run            # 81/81
npx tsc --noEmit          # clean
npm run build             # 5 routes incl. /api/basket-entry
export PATH="$HOME/.foundry/bin:$PATH"; export POLYGON_RPC="$(grep '^POLYGON_RPC=' .env.local | cut -d= -f2-)"; (cd contracts && forge test)   # 7/7 fork
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ ; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/theme/ai   # 200, 200
```
