import {
  createConfig,
  EVM,
  getContractCallsQuote,
  convertQuoteToRoute,
  executeRoute,
  type ContractCallsQuoteRequest,
  type LiFiStep,
  type RouteExtended,
} from "@lifi/sdk";
import { ADDR } from "@/lib/addresses"; // client-safe public constants (NOT the server-only config)
import type { ContractCall } from "./basket";

/** (Re)configure the LI.FI SDK with an EVM provider backed by the CURRENT wallet client.
 *  Safe to call per action — reconfiguring picks up account/chain changes (no stale signer).
 *  v3.x uses createConfig({ integrator }); v4.0.0 renamed it to createClient (same SDKConfig). */
export function initLifi(opts: {
  getWalletClient: () => Promise<unknown>;
  switchChain?: (chainId: number) => Promise<unknown>;
}): void {
  createConfig({
    integrator: "project-lynx",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providers: [EVM({ getWalletClient: opts.getWalletClient as any, switchChain: opts.switchChain as any })],
  });
}

export type EnterQuoteParams = {
  /** Source chain — Polygon (137, same-chain demo spine) or Ethereum (1)/Base (8453, cross-chain stretch).
   *  NEVER Arc (Arc→Polygon routing is dead). */
  fromChainId: 1 | 8453 | 137;
  fromToken: string;
  fromAddress: string;
  /** Total source-token amount the user funds with (base units of fromToken) — covers every call + fees. */
  fromAmount: string;
  /** One weighted call per market (from buildBasketContractCalls). Composer splits the deposit across them. */
  contractCalls: ContractCall[];
};

/** Build the one-signature destination-contract-calls quote (the LI.FI Composer "zap").
 *  Composer splits the bridged capital across EVERY contractCall — i.e. across the bucket's markets per
 *  our strategy weights (an index allocation, not a parlay). Bridge toToken = native USDC on Polygon; each
 *  call consumes USDC.e, so LI.FI inserts the native-USDC → USDC.e hop before invoking EnterBasket.
 *  Returns a LiFiStep — convert it with convertQuoteToRoute() before executeRoute().
 *  NOTE: there is NO LI.FI pre-sim (integrator_not_allowed) and the destination calls are NOT atomic;
 *  EnterBasket is revert-safe (refunds USDC.e to the recipient on internal failure).
 *  CAVEAT: source-vs-destination amount reconciliation (bridge/swap fees) should be confirmed against a
 *  live get-quote-with-calls; set the deposit below the guaranteed-arrival floor or use exact-output. */
export async function buildEnterQuote(p: EnterQuoteParams): Promise<LiFiStep> {
  const req: ContractCallsQuoteRequest = {
    fromChain: p.fromChainId,
    fromToken: p.fromToken,
    fromAddress: p.fromAddress,
    toChain: 137,
    toToken: ADDR.usdcNative,
    fromAmount: p.fromAmount,
    contractCalls: p.contractCalls,
  };
  return getContractCallsQuote(req);
}

export { convertQuoteToRoute, executeRoute };
export type { LiFiStep, RouteExtended };
