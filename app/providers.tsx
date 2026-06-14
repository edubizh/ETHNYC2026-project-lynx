"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { wagmiConfig } from "@/lib/wagmi";
import { ArcProvider } from "@/lib/arc/context";
import { SearchProvider } from "@/lib/browse/search-context";

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <ArcProvider>
          <SearchProvider>{children}</SearchProvider>
        </ArcProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
