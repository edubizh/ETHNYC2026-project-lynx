import { config } from "@/lib/config";
import { createWalletClient, http, type Account, type Address, type Hex } from "viem";
import { polygon } from "viem/chains";

type SwapTx = { to: Address; data: Hex; value?: string };

/** Build the standalone Uniswap PRIZE swap (USDC → wstETH) via the Trading API /quote → /swap.
 *  This is the $7k artifact — a SEPARATE standalone swap, NOT the basket's asset leg (Sushi-routed).
 *  VERIFIED shapes: /quote returns { routing, quote, permitData }; /swap returns { swap: { to, data, value } }.
 *  If permitData is present it is EIP-712 signed and returned to /swap with the signature. */
export async function buildPrizeSwap(account: Account, amountUsdc = "1000000"): Promise<SwapTx> {
  const headers = { "Content-Type": "application/json", "x-api-key": config.uniswap.key() };

  const quoteRes = await fetch(`${config.uniswap.base()}/quote`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "EXACT_INPUT",
      tokenIn: config.addrs.usdcNative(),
      tokenOut: config.addrs.wsteth(),
      amount: amountUsdc,
      tokenInChainId: 137,
      tokenOutChainId: 137,
      swapper: account.address,
    }),
  });
  if (!quoteRes.ok) throw new Error(`Uniswap /quote ${quoteRes.status}`);
  const q = await quoteRes.json();

  const body: Record<string, unknown> = { quote: q.quote };
  if (q.permitData) {
    if (!account.signTypedData) throw new Error("account cannot sign the Permit2 typed data");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sig = await account.signTypedData({
      domain: q.permitData.domain,
      types: q.permitData.types,
      primaryType: "PermitSingle",
      message: q.permitData.values,
    } as any);
    body.permitData = q.permitData;
    body.signature = sig;
  }

  const swapRes = await fetch(`${config.uniswap.base()}/swap`, {
    method: "POST",
    headers: { ...headers, "x-universal-router-version": "2.0" },
    body: JSON.stringify(body),
  });
  if (!swapRes.ok) throw new Error(`Uniswap /swap ${swapRes.status}`);
  const { swap } = await swapRes.json();
  return swap as SwapTx;
}

/** Execute the standalone Uniswap prize swap on Polygon mainnet; returns the tx hash (the $7k artifact).
 *  Prerequisite: USDC approved to Permit2 / Universal Router (use the /check_approval endpoint first). */
export async function runPrizeSwap(account: Account, amountUsdc = "1000000"): Promise<Hex> {
  const swap = await buildPrizeSwap(account, amountUsdc);
  const wallet = createWalletClient({ account, chain: polygon, transport: http(config.polygonRpc()) });
  return wallet.sendTransaction({ to: swap.to, data: swap.data, value: BigInt(swap.value ?? 0) });
}
