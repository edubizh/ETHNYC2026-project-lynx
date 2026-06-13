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

let configured = false;

/** Initialize the LI.FI SDK ONCE with an EVM provider backed by the app's wallet client.
 *  v3.6.4 uses createConfig({ integrator }); v4.0.0 renamed it to createClient (same SDKConfig). */
export function initLifi(opts: {
  getWalletClient: () => Promise<unknown>;
  switchChain?: (chainId: number) => Promise<unknown>;
}): void {
  if (configured) return;
  createConfig({
    integrator: "project-lynx",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providers: [EVM({ getWalletClient: opts.getWalletClient as any, switchChain: opts.switchChain as any })],
  });
  configured = true;
}

export type EnterQuoteParams = {
  /** Source chain — Ethereum (1) or Base (8453). NEVER Arc (Arc→Polygon routing is dead). */
  fromChainId: 1 | 8453;
  fromToken: string;
  fromAddress: string;
  /** Source-token amount the user funds with (base units of fromToken). */
  fromAmount: string;
  /** USDC.e amount the destination EnterBasket call consumes (6dp). */
  basketUsdceAmount: string;
  enterBasketAddress: string;
  enterBasketCalldata: string;
  enterBasketGasLimit?: string;
};

/** Build the one-signature destination-contract-call quote (the LI.FI Composer "zap").
 *  Bridge destination toToken = native USDC on Polygon (per design). The contract call consumes USDC.e,
 *  so LI.FI inserts the native-USDC → USDC.e hop on Polygon before invoking EnterBasket.
 *  Returns a LiFiStep — convert it with convertQuoteToRoute() before executeRoute().
 *  NOTE: there is NO LI.FI pre-sim (integrator_not_allowed) and the destination call is NOT atomic;
 *  EnterBasket is revert-safe (refunds USDC.e to the recipient on internal failure).
 *  CAVEAT: the exact source-vs-destination amount reconciliation for an exact-output basket should be
 *  confirmed against a live get-quote-with-calls at the LI.FI booth. */
export async function buildEnterQuote(p: EnterQuoteParams): Promise<LiFiStep> {
  const req: ContractCallsQuoteRequest = {
    fromChain: p.fromChainId,
    fromToken: p.fromToken,
    fromAddress: p.fromAddress,
    toChain: 137,
    toToken: ADDR.usdcNative,
    fromAmount: p.fromAmount,
    contractCalls: [
      {
        fromAmount: p.basketUsdceAmount,
        fromTokenAddress: ADDR.usdce, // call consumes USDC.e -> LI.FI swaps native USDC -> USDC.e
        toContractAddress: p.enterBasketAddress,
        toContractCallData: p.enterBasketCalldata,
        toContractGasLimit: p.enterBasketGasLimit ?? "500000",
        toApprovalAddress: p.enterBasketAddress, // executor approves USDC.e to EnterBasket before the call
      },
    ],
  };
  return getContractCallsQuote(req);
}

export { convertQuoteToRoute, executeRoute };
export type { LiFiStep, RouteExtended };
