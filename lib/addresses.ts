import { getAddress } from "viem";

/** Verified, PUBLIC Polygon 137 addresses (on-chain confirmed 2026-06-13). These are not secrets and
 *  are safe to ship client-side, so they live here as plain checksummed constants — separate from the
 *  server-only secret config (lib/config.ts), which hard-fails on a missing UNISWAP_API_KEY at import. */
export const ADDR = {
  usdce: getAddress("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"), // NegRiskAdapter collateral (verified .col())
  usdcNative: getAddress("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"), // LI.FI destination token on Polygon
  negRiskAdapter: getAddress("0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296"),
  wcol: getAddress("0x3A3BD7bb9528E159577F7C2e685CC81A765002E2"),
  ctf: getAddress("0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"),
  wsteth: getAddress("0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD"),
  wbtc: getAddress("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"), // 8 decimals
  weth: getAddress("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"),
  link: getAddress("0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"),
  swapRouter02: getAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"), // Uniswap V3 SwapRouter02 (verified deployed on Polygon)
  universalRouter: getAddress("0x1095692A6237d83C6a72F3F5eFEdb9A670C49223"), // V4 / Universal Router 2.0 on Polygon
  permit2: getAddress("0x000000000022D473030F116dDEE9F6B43aC78BA3"),
} as const;
