"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SearchState = { query: string; setQuery: (q: string) => void };

// Default is a no-op so the TopBar search input is harmless on pages with no treemap to filter
// (e.g. the theme dashboard). The browse page is wrapped in <SearchProvider> so its treemap reacts.
const Ctx = createContext<SearchState>({ query: "", setQuery: () => {} });

/** App-wide header-search state so the TopBar input and the browse treemap share one query. */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return <Ctx.Provider value={{ query, setQuery }}>{children}</Ctx.Provider>;
}

export function useSearch(): SearchState {
  return useContext(Ctx);
}
