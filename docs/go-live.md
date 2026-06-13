# Go-Live Runbook — Project-Lynx

Everything here needs a real key / funded wallet (org policy keeps keys out of the repo + my hands).
Run top to bottom. Use a **throwaway wallet** funded with a few $ of POL + USDC on Polygon.

## 0. Prereqs (collect at the booths)
- `UNISWAP_API_KEY` — Uniswap Trading API Developer Platform (the $7k gate).
- `NEXT_PUBLIC_CIRCLE_CLIENT_KEY` — Circle Modular Wallets console (Arc account layer).
- `EQUITIES_API_KEY` — optional (NVDA display; dashboard falls back to seeds without it).
- A throwaway `PRIVATE_KEY` + a Polygon RPC (`POLYGON_RPC`, e.g. a Tenderly admin RPC to dodge rate limits).
- Fund the wallet: ~2 POL (gas) + ~5 USDC + a little USDC.e on Polygon.

```bash
npm install && cp .env.example .env.local   # fill the keys above
npm test                                     # 23 green
cd contracts && forge test -vv && cd ..      # 6/6 green (real Polygon fork)
```

## 1. Deploy EnterBasket → Polygon (the gating step)
```bash
cd contracts
# dry-run (no key) to sanity-check, then broadcast:
forge script script/DeployEnterBasket.s.sol --rpc-url $POLYGON_RPC
forge script script/DeployEnterBasket.s.sol --rpc-url $POLYGON_RPC --private-key $PRIVATE_KEY --broadcast
cd ..
# copy the printed address into .env.local:
echo "NEXT_PUBLIC_ENTER_BASKET=0x<deployed>" >> .env.local
```
Record the deploy tx hash. (~1.8M gas; verified deployable against the real adapter.)

## 2. Uniswap $7k swap (decoupled standalone artifact)
```bash
UNISWAP_API_KEY=… POLYGON_RPC=… PRIVATE_KEY=0x… PRIZE_SWAP_AMOUNT=1000000 npx tsx scripts/runPrizeSwap.ts
```
The script runs `/check_approval` → (approval tx) → `/quote` → `/swap` → broadcast, and prints the **tx hash**.
→ Paste the hash into the README table **and submit the Uniswap Developer Feedback Form** (required for the prize).

## 3. Arc passkey + USDC-gas (browser, account/NAV layer)
- `npm run dev` → open `/theme/ai` → **Create passkey wallet** in the Account bar.
- Fund the Arc smart account from `https://faucet.circle.com`; confirm the USDC balance + unified NAV render.
- Do one `paymaster: true` userOp (USDC-gas) and screenshot the ArcScan tx.

## 4. LI.FI one-signature entry (after deploy)
- **Tune the amount first** (see README ⚠️): bridge + swap fees mean the destination receives slightly less
  USDC.e than a fixed call demands. Set the basket amount below the guaranteed-arrival floor, or switch
  `buildEnterQuote` to exact-output (`toAmount`), confirmed against a live `get-quote-with-calls`.
- Connect a wallet on **Ethereum or Base**, click **Enter basket**, sign once.
- Confirm on Polygonscan: native USDC arrives → `EnterBasket` mints the neutral YES+NO set → both land in
  the recipient wallet. Record the tx hash.
- **Demo safety:** keep a pre-funded "already-bridged" Polygon wallet ready so no 90s beat waits on a live bridge.

## 5. Host + submit
- Deploy the app (e.g. Vercel): set all env vars from `.env.local` (server: `UNISWAP_API_KEY`, `POLYGON_RPC`,
  `EQUITIES_API_KEY`; public: `NEXT_PUBLIC_*`). `next build` is already green.
- Fill the README tx-hash table; record the 90s demo video naming each sponsor tool on screen.
- Submit to the 5 tracks: Arc A + Arc B + LI.FI Composer + LI.FI Best UX + Uniswap Best API Integration.
