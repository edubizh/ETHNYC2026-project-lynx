/**
 * Standalone Uniswap prize swap runner — the $7k "Best Uniswap API Integration" artifact.
 *
 *   UNISWAP_API_KEY=...  POLYGON_RPC=...  PRIVATE_KEY=0x...  npx tsx scripts/runPrizeSwap.ts
 *
 * SECURITY: PRIVATE_KEY is read from the shell env ONLY. Never commit a key (org policy +
 * non-custodial design). Use a throwaway wallet pre-funded with a tiny amount of USDC + POL on Polygon,
 * and approve USDC to Permit2 / the Universal Router first (Trading API /check_approval).
 * Record the printed tx hash and submit it with the Uniswap Developer Feedback Form.
 */
import { privateKeyToAccount } from "viem/accounts";
import { runPrizeSwap } from "../lib/uniswap/prizeSwap";

async function main() {
  const pk = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) throw new Error("PRIVATE_KEY env var required (throwaway wallet, never commit it)");
  const account = privateKeyToAccount(pk);
  const amount = process.env.PRIZE_SWAP_AMOUNT ?? "1000000"; // 1 USDC (6dp)
  console.log(`Running Uniswap prize swap (USDC->wstETH, ${amount} base units) as ${account.address} on Polygon…`);
  const hash = await runPrizeSwap(account, amount);
  console.log(`\n✅ PRIZE TX HASH: ${hash}`);
  console.log(`   polygonscan: https://polygonscan.com/tx/${hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
