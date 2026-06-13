/**
 * Standalone Uniswap prize swap runner — the $7k "Best Uniswap API Integration" artifact.
 *
 *   npx tsx scripts/runPrizeSwap.ts          # reads .env.local automatically
 *
 * Needs in .env.local (or your shell): UNISWAP_API_KEY, POLYGON_RPC, PRIVATE_KEY (throwaway wallet).
 * SECURITY: .env.local is gitignored — never commit a real key. Use a throwaway wallet pre-funded with
 * a little USDC + POL on Polygon. The script runs /check_approval -> /quote -> /swap and prints the tx hash;
 * submit it with the Uniswap Developer Feedback Form.
 */
import { existsSync } from "node:fs";

// Load .env.local (or .env) so you only edit ONE file (Node 20.6+ / 24 ships process.loadEnvFile).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
else if (existsSync(".env")) process.loadEnvFile(".env");

async function main() {
  const { privateKeyToAccount } = await import("viem/accounts");
  const { runPrizeSwap } = await import("../lib/uniswap/prizeSwap");

  const pk = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) throw new Error("PRIVATE_KEY required in .env.local or your shell (throwaway wallet — never commit it)");
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
