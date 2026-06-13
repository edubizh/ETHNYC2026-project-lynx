"use client";

import { useState } from "react";
import { useAccount, useConnect, useWalletClient } from "wagmi";
import { initLifi, buildEnterQuote, convertQuoteToRoute, executeRoute } from "@/lib/lifi/enter";
import { buildBasketContractCalls } from "@/lib/lifi/basket";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // native USDC on Base (source)
const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // native USDC on Ethereum mainnet (source)
const ENTER_BASKET = process.env.NEXT_PUBLIC_ENTER_BASKET ?? "0x0000000000000000000000000000000000000000";
const BASKET_USDCE_AMOUNT = "10000000"; // 10 USDC.e (6dp) total deposit — split across the bucket's markets

export function EnterButton({ slug }: { slug: string }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function onEnter() {
    try {
      if (!isConnected) {
        const connector = connectors[0];
        if (!connector) {
          setStatus("No wallet connector available.");
          return;
        }
        connect({ connector });
        return;
      }
      if (!address || !walletClient) {
        setStatus("Connect a wallet on Ethereum or Base first.");
        return;
      }
      const chainId = walletClient.chain?.id;
      if (chainId !== 1 && chainId !== 8453) {
        setStatus("Switch your wallet to Ethereum or Base — LI.FI entry never originates on Arc/Polygon.");
        return;
      }
      if (ENTER_BASKET === "0x0000000000000000000000000000000000000000") {
        setStatus("Set NEXT_PUBLIC_ENTER_BASKET to the deployed EnterBasket address before executing.");
        return;
      }
      setBusy(true);
      setStatus("Building one-signature LI.FI route…");

      // Our strategy splits the deposit across the bucket's markets — one weighted call each (not a parlay).
      const contractCalls = buildBasketContractCalls(
        slug,
        BigInt(BASKET_USDCE_AMOUNT),
        address as `0x${string}`,
        ENTER_BASKET as `0x${string}`,
      );

      initLifi({
        getWalletClient: async () => walletClient,
        switchChain: async () => walletClient,
      });

      const step = await buildEnterQuote({
        fromChainId: chainId as 1 | 8453, // detected connected chain (Ethereum or Base)
        fromToken: chainId === 1 ? USDC_ETH : USDC_BASE,
        fromAddress: address,
        fromAmount: BASKET_USDCE_AMOUNT, // total deposit; LI.FI Composer splits it across the market calls
        contractCalls,
      });
      setStatus("Route built. Executing (one signature)…");

      const route = convertQuoteToRoute(step);
      await executeRoute(route, {
        updateRouteHook: (r) => {
          const steps = r.steps.map((s) => s.execution?.status ?? "PENDING").join(" → ");
          setStatus(`status: ${steps}`);
        },
      });
      setStatus("Done — positions delivered to your wallet.");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="row">
        <button className="cta" onClick={onEnter} disabled={busy}>
          {isConnected ? "Enter basket (one signature)" : "Connect wallet"}
        </button>
        <button className="cta secondary" disabled title="Stretch: gasless UniswapX intent on Ethereum/Base">
          Sell to go directional →
        </button>
      </div>
      {status && (
        <p className="subtle" style={{ marginTop: 12 }}>
          {status}
        </p>
      )}
    </div>
  );
}
