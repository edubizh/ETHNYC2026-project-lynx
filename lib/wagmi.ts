import { http, createConfig } from "wagmi";
import { mainnet, base, polygon } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// LI.FI entry originates on Ethereum (1) or Base (8453); Polygon (137) is the execution chain.
// (Arc Testnet is the account/NAV layer and is handled by the Circle Modular Wallet, not wagmi.)
export const wagmiConfig = createConfig({
  chains: [mainnet, base, polygon],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
  },
});
