import {
  WebAuthnMode,
  toPasskeyTransport,
  toWebAuthnCredential,
  toModularTransport,
  toCircleSmartAccount,
  ContractAddress,
} from "@circle-fin/modular-wallets-core";
import { createPublicClient, defineChain, getContract, erc20Abi, type Transport, type PublicClient } from "viem";
import { createBundlerClient, toWebAuthnAccount } from "viem/account-abstraction";

// Arc Testnet — account/NAV layer ONLY (native gas token is USDC, 18dp). Verified: id 5042002.
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_ARC_TESTNET_RPC ?? "https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
  testnet: true,
});

const CLIENT_URL = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL ?? "https://modular-sdk.circle.com/v1/rpc/w3s/buidl";

function clientKey(): string {
  const k = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY;
  if (!k) throw new Error("NEXT_PUBLIC_CIRCLE_CLIENT_KEY is required for the Arc Modular Wallet");
  return k;
}

/** Create (register) or restore (login) a Circle Modular Wallet (passkey) on Arc Testnet.
 *  Browser-only (WebAuthn). USDC-gas comes from the Circle Gas Station via `paymaster: true` on userOps.
 *  Pin @circle-fin/modular-wallets-core@1.0.13. rpcPath '/arcTestnet' is appended to the modular transport. */
export async function createArcPasskeyAccount(username: string, mode: "register" | "login") {
  const key = clientKey();
  const passkeyTransport = toPasskeyTransport(CLIENT_URL, key); // bare clientUrl
  const modularTransport = toModularTransport(`${CLIENT_URL}/arcTestnet`, key); // url WITH rpcPath

  const credential = await toWebAuthnCredential({
    transport: passkeyTransport,
    mode: mode === "register" ? WebAuthnMode.Register : WebAuthnMode.Login,
    username,
  });

  const client = createPublicClient({ chain: arcTestnet, transport: modularTransport as Transport });
  const account = await toCircleSmartAccount({ client, owner: toWebAuthnAccount({ credential }), name: username });
  const bundlerClient = createBundlerClient({ account, chain: arcTestnet, transport: modularTransport as Transport });
  return { client, account, bundlerClient, credential };
}

/** Read the smart account's USDC balance on Arc Testnet (ERC-20 USDC reads in 6dp). */
export async function readArcUsdcBalance(client: PublicClient, owner: `0x${string}`): Promise<bigint> {
  const usdc = getContract({ client, address: ContractAddress.ArcTestnet_USDC as `0x${string}`, abi: erc20Abi });
  return usdc.read.balanceOf([owner]);
}

/** The Circle Modular Wallet bundle returned by createArcPasskeyAccount (passkey smart account + bundler). */
export type ArcWallet = Awaited<ReturnType<typeof createArcPasskeyAccount>>;

/** Send a minimal gasless userOp (zero-value self-call) on Arc Testnet with gas paid via Circle's
 *  paymaster (`paymaster: true` → USDC-gas, no native token). Returns the on-chain TX hash (not the userOp
 *  hash) for the explorer (testnet.arcscan.app). This is the load-bearing Arc qualification artifact: Arc
 *  performs a real ERC-4337 operation, not just NAV display. The bundlerClient is already account-bound. */
export async function sendArcGaslessUserOp(wallet: ArcWallet): Promise<`0x${string}`> {
  const hash = await wallet.bundlerClient.sendUserOperation({
    calls: [{ to: wallet.account.address, value: 0n, data: "0x" }],
    paymaster: true,
  });
  const { receipt } = await wallet.bundlerClient.waitForUserOperationReceipt({ hash });
  return receipt.transactionHash;
}
