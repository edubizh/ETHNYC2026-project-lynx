import type { Theme, Security } from "./types";

// Illustrative published analyst bear/bull band for NVDA, shared by display.analystBand and the NVDA
// security so they never drift. Widened from the stale {100,210} (which pinned a live ~$200 price at the
// top and produced a misleading ~45-pt gap) so the price now sits mid-band. Refresh/source over time.
const AI_BAND: { low: number; high: number } = { low: 105, high: 305 };

// conditionIds, questionIds, outcomeTokenIds, seedBeliefProb and the asset token are all VERIFIED
// on-chain / via Gamma (2026-06-13). The OpenAI-not-IPO leg (ends 2027-01-01) is the PRIMARY
// always-valid leg and drives the headline odds; the Anthropic leg (ends 2026-06-30) is the
// secondary/vivid demo leg.
const THEMES: Record<string, Theme> = {
  ai: {
    slug: "ai",
    title: "AI",
    legs: [
      // PRIMARY / always-valid prediction leg (~51% YES).
      {
        kind: "prediction",
        label: "OpenAI does NOT IPO by Dec 2026",
        gammaMarketId: "608368",
        conditionId: "0x3849e1d62e0807801913d3e2427e8caf3cc6dd1c8ef42d8d5c08c6f9c449dc5e",
        questionId: "0xd2c21cbb9d2cb407ab3dcf619d93f6d65b7967154cd6ee930f7758baa2b4bf06",
        outcomeTokenIds: {
          yes: "56615676606297588259337956203332341775475048285080710344367729433788967812170",
          no: "8070607953656787024050950499598687532281829563384949938603247089607814583142",
        },
        seedBeliefProb: 0.51,
        weight: 0.35,
        relevance: 0.3, // "no IPO" is only a weak AI-sentiment signal — low weight in the belief index
      },
      // SECONDARY / vivid prediction leg (~89.5% YES) — great demo number, may resolve sooner.
      {
        kind: "prediction",
        label: "Anthropic has the top AI model",
        gammaMarketId: "631121",
        conditionId: "0x0811ed7f71c2466d04f9ba801c0e21c9cfb016385cdff97b5c9984df0fa5801e",
        questionId: "0x3dcd0f5c7c6df89336a87be866327c862646e18b5deee05f31c250451b3a2901",
        outcomeTokenIds: {
          yes: "64887172491629329116501561142670952112197574356607923997934182163296576951634",
          no: "12813183214224132107278873250345740614275647031034326420266129033763649478747",
        },
        seedBeliefProb: 0.895,
        weight: 0.15,
      },
      // NVDA is display-only (equities API); the on-chain sleeve is WETH + LINK.
      { kind: "asset", label: "Risk-on (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.3, fallbackPriceUsd: 4300 },
      { kind: "asset", label: "Data/oracle infra proxy (LINK on Polygon)", token: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", ticker: "LINK", swapFee: 3000, weight: 0.2, fallbackPriceUsd: 15 },
    ],
    display: {
      assetSymbol: "NVDA",
      analystBand: AI_BAND,
      // Seed values for the offline/no-key demo.
      fallback: { beliefProb: 0.51, equityPrice: 165, assetLegPriceUsd: 4300 },
      // Extra (non-buyable) belief markets, oriented bullish = AI progress/valuations up. Live-verified ids
      // 2026-06-14; seeds are the live values then (a bad id degrades to its seed, never breaks the index).
      beliefMarkets: [
        { venue: "polymarket", id: "631181", label: "NVIDIA is the largest company by market cap", polarity: 1, relevance: 0.8, seedProb: 0.95, seedVolume: 2_810_000 },
        { venue: "polymarket", id: "653788", label: "OpenAI announces AGI before 2027", polarity: 1, relevance: 0.6, seedProb: 0.125, seedVolume: 79_800 },
        { venue: "polymarket", id: "2110294", label: "A new Gemini flagship model is released", polarity: 1, relevance: 0.4, seedProb: 0.82, seedVolume: 36_000 },
        { venue: "kalshi", id: "KXLLM1-26DEC31-OAI", label: "OpenAI has the top LLM (LMArena) at EOY", polarity: 1, relevance: 0.6, seedProb: 0.155, seedVolume: 1_099_000 },
        { venue: "kalshi", id: "KXAGICO-COMP-26Q4", label: "Any company announces AGI before 2027", polarity: 1, relevance: 0.5, seedProb: 0.13, seedVolume: 7_800 },
      ],
      // Thematically-related securities — display/anchor only. NVDA is not Uniswap-tradeable for a
      // US/ungated user (xStocks NVDAx live on Solana, US-gated), so it renders an honest badge, not a buy.
      securities: [
        {
          ticker: "NVDA",
          name: "NVIDIA",
          analystBand: AI_BAND,
          availability: "DISPLAY-ONLY",
          chain: "solana/CEX",
          note: "Tradeable for eligible users as NVDAx (xStocks, Solana) / CEX — no EVM-Uniswap venue, so it's the analyst anchor here.",
        },
        { ticker: "MSFT", name: "Microsoft", analystBand: { low: 380, high: 600 }, priceUsd: 480, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "AI/cloud bellwether (Azure + OpenAI stake) — tokenized as MSFTx on Solana; coming soon to our rails." },
        { ticker: "GOOGL", name: "Alphabet", analystBand: { low: 150, high: 260 }, priceUsd: 200, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Gemini / DeepMind AI exposure — tokenized as GOOGLx on Solana; coming soon." },
        { ticker: "TSM", name: "Taiwan Semiconductor", analystBand: { low: 160, high: 300 }, priceUsd: 230, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Fabricates the AI accelerators — tokenized as TSMx on Solana; coming soon." },
        { ticker: "AMD", name: "Advanced Micro Devices", analystBand: { low: 110, high: 220 }, priceUsd: 160, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "AI-GPU challenger — tokenized as AMDx on Solana; coming soon." },
        // On-chain AI tokens (display-only; MCP-verified addresses; not on our Polygon basket rails yet).
        { ticker: "FET", name: "Artificial Superintelligence Alliance", token: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "high", note: "AI-agents alliance (Fetch.ai/SingularityNET/Ocean) — deep on Ethereum + CEX; Polygon bridge is thin, not a basket leg yet." },
        { ticker: "RENDER", name: "Render Network", availability: "DISPLAY-ONLY", chain: "solana", liquidity: "high", note: "Decentralized GPU rendering for AI/3D — primary market migrated to Solana (legacy ERC-20 0x6De0…7e4Aeb24 on Ethereum); not on our EVM rails yet." },
        { ticker: "TAO", name: "Bittensor", availability: "DISPLAY-ONLY", chain: "bittensor", liquidity: "high", note: "Decentralized machine-learning network on its own L1 — trades via CEX; thin ETH wrapper WTAO 0x77E0…b0A44; not bridgeable to our rails." },
        { ticker: "GRT", name: "The Graph", token: "0x5fe2B58c013d7601147DcdD68C143A77499f5531", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "medium", note: "AI/data indexing protocol — live on Polygon-Uniswap (medium depth); a near-term basket-integration candidate." },
        { ticker: "wstETH", name: "Lido Wrapped Staked ETH", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "low", note: "Routable via Uniswap (it powers our standalone prize swap) but has no direct USDC.e pool for the fixed-fee sleeve — not a basket leg yet." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk-on asset on Uniswap (Polygon)." },
        { ticker: "LINK", name: "Chainlink", token: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable data/oracle-infra risk proxy on Uniswap (Polygon)." },
      ],
    },
  },

  // CRYPTO — executable NegRisk "best performer 2026" leg + buyable WBTC asset leg.
  crypto: {
    slug: "crypto",
    title: "Crypto",
    legs: [
      {
        kind: "prediction",
        label: "Bitcoin is the best performer in 2026 (vs Gold & S&P 500)",
        gammaMarketId: "950852",
        conditionId: "0xb276435811dc77171602f790db2b5900e780adfadb7cff57e547d58fb1a8215f",
        questionId: "0x339a89111ad048709ef27ac9da11e70a28ceaae3a4f494e949c9d68be7c39a00",
        outcomeTokenIds: {
          yes: "108251591904413063139495882252154135107497878738832930637657538583440424739851",
          no: "95097331309577172647133042426866339261719483395475071583274489760894986349855",
        },
        seedBeliefProb: 0.165,
        weight: 0.4,
      },
      { kind: "asset", label: "BTC exposure (WBTC on Polygon)", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 500, weight: 0.4, decimals: 8, fallbackPriceUsd: 64317 },
      { kind: "asset", label: "ETH exposure (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.2, fallbackPriceUsd: 4300 },
    ],
    display: {
      assetSymbol: "WBTC",
      analystBand: { low: 40000, high: 130000 },
      fallback: { beliefProb: 0.165, equityPrice: 64317, assetLegPriceUsd: 64317 },
      // Oriented bullish = crypto/BTC up. Live-verified ids 2026-06-14.
      beliefMarkets: [
        { venue: "polymarket", id: "701496", label: "Bitcoin reaches $100,000 in 2026", polarity: 1, relevance: 0.8, seedProb: 0.155, seedVolume: 1_920_000 },
        { venue: "polymarket", id: "701486", label: "Bitcoin reaches $200,000 in 2026", polarity: 1, relevance: 0.4, seedProb: 0.02, seedVolume: 1_800_000 },
        { venue: "polymarket", id: "701539", label: "Ethereum reaches $10,000 in 2026", polarity: 1, relevance: 0.4, seedProb: 0.0145, seedVolume: 516_000 },
        { venue: "kalshi", id: "KXCRYPTORETURNY-26-BTC", label: "Bitcoin has a positive return in 2026", polarity: 1, relevance: 0.7, seedProb: 0.31, seedVolume: 119_200 },
        { venue: "kalshi", id: "KXCRYPTORETURNY-26-SOL", label: "Solana has a positive return in 2026", polarity: 1, relevance: 0.4, seedProb: 0.13, seedVolume: 69_700 },
      ],
      securities: [
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, analystBand: { low: 40000, high: 130000 }, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Headline. Buyable BTC exposure on Uniswap (Polygon)." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable ETH exposure on Uniswap (Polygon)." },
        // On-chain DeFi blue-chips (display-only; deep Polygon liquidity; near-term integration candidates).
        { ticker: "UNI", name: "Uniswap", token: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Governance token of our swap venue — deep Polygon liquidity; a near-term basket-integration candidate." },
        { ticker: "AAVE", name: "Aave", token: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Leading lending protocol — deep Polygon liquidity; integration candidate." },
        { ticker: "POL", name: "Polygon Ecosystem Token", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Polygon's native gas/staking token (native asset, not an ERC-20 here) — also ERC-20 on Ethereum 0x455e…fFC3F6." },
        { ticker: "COIN", name: "Coinbase Global", analystBand: { low: 150, high: 400 }, priceUsd: 260, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Crypto-exchange beta — tokenized as COINx on Solana; coming soon." },
        { ticker: "MSTR", name: "Strategy (MicroStrategy)", analystBand: { low: 200, high: 600 }, priceUsd: 380, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Leveraged BTC-treasury proxy — tokenized as MSTRx on Solana; coming soon." },
        { ticker: "HOOD", name: "Robinhood Markets", analystBand: { low: 30, high: 110 }, priceUsd: 65, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Retail crypto brokerage — tokenized as HOODx on Solana; coming soon." },
        { ticker: "MARA", name: "MARA Holdings", analystBand: { low: 12, high: 40 }, priceUsd: 22, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Bitcoin miner — no EVM-Uniswap venue; tokenized version coming soon." },
      ],
    },
  },

  // MACRO & FED — executable NegRisk "no Fed cuts in 2026" leg + buyable WETH + WBTC sleeve.
  macro: {
    slug: "macro",
    title: "Macro & Fed",
    legs: [
      {
        kind: "prediction",
        label: "No Fed rate cuts in 2026",
        gammaMarketId: "616902",
        conditionId: "0xd4e77ba6f29fc093509d24f508631abd445ecf506bbdc9c4c80e60256a318527",
        questionId: "0xdcd7daabcacdc4ecf4f9a48d0a2708b52f356dd086c8070992136da62eb72b00",
        outcomeTokenIds: {
          yes: "12403602920039269077597917340921667997547115084613238528792639013246536343316",
          no: "21294592205022969346730955103773391901993330222644504059576935265667917187903",
        },
        seedBeliefProb: 0.7685,
        weight: 0.5,
        polarity: -1, // "no cuts" is hawkish → bearish for TLT (belief axis = dovish / rates-down)
        relevance: 0.7,
      },
      { kind: "asset", label: "Rate-sensitive risk (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.3, fallbackPriceUsd: 4300 },
      { kind: "asset", label: "Store-of-value hedge (WBTC on Polygon)", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 500, weight: 0.2, decimals: 8, fallbackPriceUsd: 64317 },
    ],
    display: {
      assetSymbol: "TLT",
      analystBand: { low: 76, high: 112 },
      fallback: { beliefProb: 0.7685, equityPrice: 95, assetLegPriceUsd: 4300 },
      // Oriented bullish = TLT up = DOVISH (rates down). Hawkish markets get polarity -1. Verified 2026-06-14.
      beliefMarkets: [
        { venue: "polymarket", id: "616903", label: "At least one Fed rate cut in 2026 (dovish)", polarity: 1, relevance: 0.7, seedProb: 0.145, seedVolume: 1_510_000 },
        { venue: "polymarket", id: "609655", label: "US recession by end of 2026 (flight to bonds)", polarity: 1, relevance: 0.6, seedProb: 0.175, seedVolume: 1_560_000 },
        { venue: "kalshi", id: "KXFEDDECISION-26JUL-H0", label: "Fed holds rates at the July 2026 meeting (hawkish)", polarity: -1, relevance: 0.5, seedProb: 0.91, seedVolume: 346_600 },
        { venue: "kalshi", id: "KXNBERRECESSQ-Q1-2026", label: "A US recession starts in Q1 2026", polarity: 1, relevance: 0.4, seedProb: 0.033, seedVolume: 81_800 },
      ],
      securities: [
        { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", analystBand: { low: 76, high: 112 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Headline rates anchor — no EVM-Uniswap venue; shown for the belief-vs-rates cross (illustrative band)." },
        { ticker: "GLD", name: "SPDR Gold Shares", analystBand: { low: 300, high: 460 }, priceUsd: 380, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Real-asset hedge vs higher-for-longer — no EVM-Uniswap venue (no analyst-target feed; illustrative band)." },
        { ticker: "SPY", name: "SPDR S&P 500 ETF", analystBand: { low: 600, high: 860 }, priceUsd: 720, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Broad risk gauge vs the rate path — no EVM-Uniswap venue (illustrative band)." },
        { ticker: "HYG", name: "iShares iBoxx High Yield Bond ETF", analystBand: { low: 70, high: 92 }, priceUsd: 80, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Credit-spread proxy — no EVM-Uniswap venue (illustrative band)." },
        // On-chain macro / RWA (display-only; MCP-verified addresses; not on our basket rails yet).
        { ticker: "PAXG", name: "PAX Gold", token: "0x45804880De22913dAFE09f4980848ECE6EcbAf78", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "medium", note: "Tokenized gold (1 troy oz) — the on-chain inflation/rates hedge; deep on Ethereum, thin Polygon bridge — not a basket leg yet." },
        { ticker: "USDY", name: "Ondo US Dollar Yield", token: "0x96F6eF951840721AdBF46Ac996b59E0235CB985C", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "low", note: "Tokenized short-term US Treasuries — the marquee on-chain rates RWA; KYC/permissioned, not freely swappable." },
        { ticker: "sDAI", name: "Savings DAI", token: "0x83F20F44975D03b1b09e64809B757c47f942BEeA", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "low", note: "Maker savings-rate token — a pure on-chain proxy for the policy rate; meaningful depth on Ethereum only." },
        { ticker: "wstETH", name: "Lido Wrapped Staked ETH", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "low", note: "Routable via Uniswap (it powers our standalone prize swap) but has no direct USDC.e pool for the fixed-fee sleeve — not a basket leg yet." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable rate-sensitive risk asset on Uniswap (Polygon)." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable store-of-value hedge on Uniswap (Polygon)." },
      ],
    },
  },

  // GEOPOLITICS & CONFLICT — executable NegRisk "next leader" ladders (Iran, Venezuela) + buyable WBTC + WETH sleeve.
  geopolitics: {
    slug: "geopolitics",
    title: "Geopolitics & Conflict",
    legs: [
      {
        kind: "prediction",
        label: "Mojtaba Khamenei is Iran's head of state at end of 2026",
        gammaMarketId: "1469737",
        conditionId: "0x25fb28382075f418a944a781a9f8840e2f541152eea0d9798d1cabfa1466adbb",
        questionId: "0xd72f68ada62aff9ba67dd2cbb56fabec9928aa198daafbd8042ac18ccabec003",
        outcomeTokenIds: {
          yes: "111988618077786263362718284278451225707405623288593888751575373086664059387290",
          no: "42006549920912635238720143234628794318400295281074422564226738635663399130499",
        },
        seedBeliefProb: 0.793,
        weight: 0.25,
      },
      {
        kind: "prediction",
        label: "Nicolás Maduro is Venezuela's leader at end of 2026",
        gammaMarketId: "1105744",
        conditionId: "0x67f3f8d0a0ecdfc008c99650284a4674388a8c3029b0eb7ca0abd65dde8d996f",
        questionId: "0x45ec1f7704d0ddd047e70443e830028d8801671283883ad1b46a29659488b604",
        outcomeTokenIds: {
          yes: "37090128566507509913630589460372620352013766554886380785463533062224343545231",
          no: "21527446005162722668702146847806837944786417986794925592709069062391666573103",
        },
        seedBeliefProb: 0.7295,
        weight: 0.25,
      },
      { kind: "asset", label: "Digital safe-haven (WBTC on Polygon)", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 500, weight: 0.3, decimals: 8, fallbackPriceUsd: 64317 },
      { kind: "asset", label: "Risk asset (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.2, fallbackPriceUsd: 4300 },
    ],
    display: {
      assetSymbol: "ITA",
      analystBand: { low: 150, high: 300 },
      fallback: { beliefProb: 0.793, equityPrice: 230, assetLegPriceUsd: 4300 },
      // Oriented bullish = ITA defense up = MORE conflict. De-escalation markets get polarity -1. Verified 2026-06-14.
      beliefMarkets: [
        { venue: "polymarket", id: "567621", label: "China invades Taiwan before 2027", polarity: 1, relevance: 0.8, seedProb: 0.0615, seedVolume: 34_700_000 },
        { venue: "polymarket", id: "2243897", label: "Russia–Ukraine ceasefire in 2026 (de-escalation)", polarity: -1, relevance: 0.8, seedProb: 0.475, seedVolume: 1_780_000 },
        { venue: "polymarket", id: "2126516", label: "Israel–Iran permanent peace deal (de-escalation)", polarity: -1, relevance: 0.5, seedProb: 0.165, seedVolume: 7_700 },
        { venue: "kalshi", id: "KXVENEZUELALEADER-26DEC31-NMAD", label: "Maduro is Venezuela's head of state at EOY 2026", polarity: 1, relevance: 0.4, seedProb: 0.59, seedVolume: 708_000 },
      ],
      securities: [
        { ticker: "ITA", name: "iShares U.S. Aerospace & Defense ETF", analystBand: { low: 150, high: 300 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Headline conflict-beta anchor — no EVM-Uniswap venue." },
        { ticker: "LMT", name: "Lockheed Martin", analystBand: { low: 400, high: 600 }, priceUsd: 480, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Defense prime — no EVM-Uniswap venue." },
        { ticker: "RTX", name: "RTX (Raytheon)", analystBand: { low: 110, high: 180 }, priceUsd: 145, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Missiles / defense systems — no EVM-Uniswap venue." },
        { ticker: "NOC", name: "Northrop Grumman", analystBand: { low: 450, high: 650 }, priceUsd: 540, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Defense prime — no EVM-Uniswap venue." },
        // On-chain safe-havens (display-only; MCP-verified addresses; not on our basket rails yet).
        { ticker: "PAXG", name: "PAX Gold", token: "0x45804880De22913dAFE09f4980848ECE6EcbAf78", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "medium", note: "Tokenized gold — the classic geopolitical safe-haven; deep on Ethereum, thin Polygon bridge — not a basket leg yet." },
        { ticker: "XAUT", name: "Tether Gold", token: "0x68749665FF8D2d112Fa859AA293F07A622782F38", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "medium", note: "Tokenized gold safe-haven — trades on CEX + Ethereum DEXes; no Polygon venue yet." },
        { ticker: "wstETH", name: "Lido Wrapped Staked ETH", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "low", note: "Routable via Uniswap (it powers our standalone prize swap) but has no direct USDC.e pool for the fixed-fee sleeve — not a basket leg yet." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable digital safe-haven on Uniswap (Polygon)." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk asset on Uniswap (Polygon)." },
      ],
    },
  },

  // US POLITICS — executable NegRisk 2028 nomination legs (Newsom, AOC) + buyable WETH + WBTC sleeve.
  "us-politics": {
    slug: "us-politics",
    title: "US Politics",
    legs: [
      {
        kind: "prediction",
        label: "Newsom wins the 2028 Democratic nomination",
        gammaMarketId: "559652",
        conditionId: "0x0f49db97f71c68b1e42a6d16e3de93d85dbf7d4148e3f018eb79e88554be9f75",
        questionId: "0x2c3d7e0eee6f058be3006baabf0d54a07da254ba47fe6e3e095e7990c7814700",
        outcomeTokenIds: {
          yes: "54533043819946592547517511176940999955633860128497669742211153063842200957669",
          no: "87854174148074652060467921081181402357467303721471806610111179101805869578687",
        },
        seedBeliefProb: 0.2325,
        weight: 0.25,
        relevance: 0.2, // a Dem-primary race barely signals DJT/GOP-strength — low weight
      },
      {
        kind: "prediction",
        label: "AOC wins the 2028 Democratic nomination",
        gammaMarketId: "559653",
        conditionId: "0xe6bcc2f1dd025ce5e1833190f7c60a71171c94f805df55b9ab0ded695ec93565",
        questionId: "0x2c3d7e0eee6f058be3006baabf0d54a07da254ba47fe6e3e095e7990c7814701",
        outcomeTokenIds: {
          yes: "107064985435494333113391038470401719113272800530429703182710416066774068907304",
          no: "65176072261324737856085688071627118509549293922582857186996392180609764586527",
        },
        seedBeliefProb: 0.0885,
        weight: 0.25,
        relevance: 0.2, // a Dem-primary race barely signals DJT/GOP-strength — low weight
      },
      { kind: "asset", label: "Risk-on (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.3, fallbackPriceUsd: 4300 },
      { kind: "asset", label: "Risk asset (WBTC on Polygon)", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 500, weight: 0.2, decimals: 8, fallbackPriceUsd: 64317 },
    ],
    display: {
      assetSymbol: "DJT",
      analystBand: { low: 3, high: 14 },
      fallback: { beliefProb: 0.2325, equityPrice: 8, assetLegPriceUsd: 4300 },
      // Oriented bullish = DJT up = GOP/Trump strength. Dem-strength markets get polarity -1. Verified 2026-06-14.
      beliefMarkets: [
        { venue: "polymarket", id: "1389021", label: "Democrats win the House in the 2026 midterms", polarity: -1, relevance: 0.7, seedProb: 0.825, seedVolume: 3_930_000 },
        { venue: "kalshi", id: "KXBALANCEPOWERCOMBO-27FEB-RR", label: "Republicans hold the House AND Senate after 2026", polarity: 1, relevance: 0.7, seedProb: 0.22, seedVolume: 2_600_000 },
        { venue: "kalshi", id: "KXTRUMPAPPROVALBELOW-26DEC31-36", label: "Trump approval is below 36% in 2026", polarity: -1, relevance: 0.4, seedProb: 0.53, seedVolume: 37_000 },
      ],
      securities: [
        { ticker: "DJT", name: "Trump Media & Technology Group", analystBand: { low: 3, high: 14 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Headline politically-correlated equity — no EVM-Uniswap venue." },
        { ticker: "GEO", name: "GEO Group", analystBand: { low: 18, high: 40 }, priceUsd: 28, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Immigration-policy-sensitive equity — no EVM-Uniswap venue." },
        { ticker: "CXW", name: "CoreCivic", analystBand: { low: 15, high: 35 }, priceUsd: 23, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Policy-sensitive equity — no EVM-Uniswap venue." },
        { ticker: "PLTR", name: "Palantir Technologies", analystBand: { low: 30, high: 120 }, priceUsd: 70, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Government / defense data — tokenized as PLTRx on Solana; coming soon." },
        // On-chain political tokens (display-only; MCP-verified where EVM; not on our basket rails).
        { ticker: "TRUMP", name: "Official Trump", availability: "DISPLAY-ONLY", chain: "solana", liquidity: "high", note: "The flagship political memecoin — trades on Solana (Raydium/Jupiter) + CEX; not bridgeable to our EVM rails. Mint 6p6x…GiPN." },
        { ticker: "MAGA", name: "MAGA", token: "0x6aA56e1D98b3805921C170EB4B3fe7D4Fda6D89b", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "low", note: "Pro-Trump memecoin on Ethereum — low-cap, ETH-only liquidity; not on our Polygon rails." },
        { ticker: "WLFI", name: "World Liberty Financial", token: "0xdA5e1988097297dCdc1f90D4dFE7909e847CBeF6", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "low", note: "Trump-family DeFi governance token — currently non-transferable (not freely swappable); shown as a political on-chain signal." },
        { ticker: "wstETH", name: "Lido Wrapped Staked ETH", token: "0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "low", note: "Routable via Uniswap (it powers our standalone prize swap) but has no direct USDC.e pool for the fixed-fee sleeve — not a basket leg yet." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk-on asset on Uniswap (Polygon)." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk asset on Uniswap (Polygon)." },
      ],
    },
  },

  // SPORTS — 2026 FIFA World Cup (US-co-hosted, live tournament). Executable NegRisk host-nation legs
  // (US + Mexico furthest-advancing) + a buyable risk-on sleeve. IDs VERIFIED on-chain via NegRiskAdapter
  // (getConditionId/getPositionId, 2026-06-14). Market ends 2026-07-20 — live through a summer demo.
  sports: {
    slug: "sports",
    title: "Sports",
    legs: [
      {
        kind: "prediction",
        label: "USA advances furthest among World Cup hosts",
        gammaMarketId: "2431124",
        conditionId: "0x5a947653669c8f71ac7b8951f53e3e538dc39025f91482bc606231cf017a3f25",
        questionId: "0xbbaffe8a92195a7b8d10a27773046a39cac1476b83f32c1cf977acda5899e102",
        outcomeTokenIds: {
          yes: "4391078153559435086542619876453393392199283918586303869903053007663182843626",
          no: "111555218263464253724497326424651025239314748563188397976415977729253038502017",
        },
        seedBeliefProb: 0.5,
        weight: 0.25,
      },
      {
        kind: "prediction",
        label: "Mexico advances furthest among World Cup hosts",
        gammaMarketId: "2431123",
        conditionId: "0x0cbee01c8bb40d5a4fc93e08818554e229a424eff354aa189cec4172dcc6ad4c",
        questionId: "0xbbaffe8a92195a7b8d10a27773046a39cac1476b83f32c1cf977acda5899e101",
        outcomeTokenIds: {
          yes: "101844044997051617416234592739470878083158048174554481118636775336857776610729",
          no: "114629841464098573391788038098856049205552895670597119763067381707691487771324",
        },
        seedBeliefProb: 0.4,
        weight: 0.25,
      },
      { kind: "asset", label: "Risk-on (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.3, fallbackPriceUsd: 4300 },
      { kind: "asset", label: "Risk asset (WBTC on Polygon)", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 500, weight: 0.2, decimals: 8, fallbackPriceUsd: 64317 },
    ],
    display: {
      assetSymbol: "DKNG",
      analystBand: { low: 30, high: 60 },
      fallback: { beliefProb: 0.5, equityPrice: 44, assetLegPriceUsd: 4300 },
      // Oriented bullish = DKNG up = betting engagement/drama (upsets, first-time runs). Verified 2026-06-14.
      beliefMarkets: [
        { venue: "polymarket", id: "563698", label: "A first-time nation wins the 2026 World Cup (upset)", polarity: 1, relevance: 0.5, seedProb: 0.315, seedVolume: 119_000 },
        { venue: "kalshi", id: "KXWC1STTIMEWIN-26-Y", label: "A first-time nation wins the 2026 World Cup", polarity: 1, relevance: 0.5, seedProb: 0.3, seedVolume: 91_000 },
        { venue: "kalshi", id: "KXWCFIFATOP10-26SF-Y", label: "A non-top-10 nation reaches the World Cup semis", polarity: 1, relevance: 0.4, seedProb: 0.67, seedVolume: 112_000 },
      ],
      securities: [
        { ticker: "DKNG", name: "DraftKings", analystBand: { low: 30, high: 60 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Sports-betting beta anchor — no EVM-Uniswap venue; shown for the belief-vs-attention cross." },
        { ticker: "FLUT", name: "Flutter Entertainment", analystBand: { low: 200, high: 320 }, priceUsd: 250, availability: "DISPLAY-ONLY", chain: "off-rail", note: "FanDuel parent — sports-betting leader; no EVM-Uniswap venue." },
        { ticker: "PENN", name: "PENN Entertainment", analystBand: { low: 14, high: 32 }, priceUsd: 22, availability: "DISPLAY-ONLY", chain: "off-rail", note: "ESPN Bet operator — no EVM-Uniswap venue." },
        { ticker: "MANU", name: "Manchester United", analystBand: { low: 12, high: 28 }, priceUsd: 18, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Listed football club — World-Cup-cycle attention proxy; no EVM-Uniswap venue." },
        // On-chain fan tokens (display-only; CHZ verified on Ethereum; Socios fan tokens live on Chiliz Chain).
        { ticker: "CHZ", name: "Chiliz", token: "0x3506424F91fD33084466F402d5D97f05F8e3b4AF", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "high", note: "Fan-token platform powering Socios — deep on Ethereum + CEX; Polygon bridge inactive, not on our rails yet." },
        { ticker: "PSG", name: "Paris Saint-Germain Fan Token", availability: "DISPLAY-ONLY", chain: "chiliz", liquidity: "medium", note: "Socios club fan token on Chiliz Chain + Binance — a World-Cup-cycle attention proxy; not on any EVM DEX rail." },
        { ticker: "BAR", name: "FC Barcelona Fan Token", availability: "DISPLAY-ONLY", chain: "chiliz", liquidity: "low", note: "Socios club fan token on Chiliz Chain — CEX-listed; not on our rails." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk-on asset on Uniswap (Polygon)." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk asset on Uniswap (Polygon)." },
      ],
    },
  },

  // ENTERTAINMENT — 2026 box office (highest-grossing film). Executable NegRisk legs (Spider-Man:
  // Brand New Day + Toy Story 5) + a buyable risk-on sleeve. IDs VERIFIED on-chain via NegRiskAdapter
  // (getConditionId/getPositionId, 2026-06-14). Market ends 2026-12-31 — resolution-safe through judging.
  entertainment: {
    slug: "entertainment",
    title: "Entertainment",
    legs: [
      {
        kind: "prediction",
        label: "Spider-Man: Brand New Day is 2026's highest-grossing film",
        gammaMarketId: "678414",
        conditionId: "0xc4b07998e8f9bf6b95f079d6dc0529f3c6f59698d4e168817ad5f99304de6c57",
        questionId: "0x1ce409cd4dcd5ff2162b678656d921b8113055f62febc3eb0a32f749980a7207",
        outcomeTokenIds: {
          yes: "28161183422242370392388296744035422249088647252796713903067039294971789722479",
          no: "80757130658075377588211268321341672637109151783616954046136590997276659075008",
        },
        seedBeliefProb: 0.545,
        weight: 0.25,
      },
      {
        kind: "prediction",
        label: "Toy Story 5 is 2026's highest-grossing film",
        gammaMarketId: "678412",
        conditionId: "0xcd57f3ad3bbbdaa96aacabd35f50c2d6e30f777e4a33876a4ab2dcd9f0b8c170",
        questionId: "0x1ce409cd4dcd5ff2162b678656d921b8113055f62febc3eb0a32f749980a7205",
        outcomeTokenIds: {
          yes: "19377648420863951364493422584672339128541444345359183847394616194343658816499",
          no: "102302020717202222629161440676477763071644396668223362756157787237764563386738",
        },
        seedBeliefProb: 0.21,
        weight: 0.25,
      },
      { kind: "asset", label: "Risk-on (WETH on Polygon)", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", ticker: "WETH", swapFee: 500, weight: 0.3, fallbackPriceUsd: 4300 },
      { kind: "asset", label: "Risk asset (WBTC on Polygon)", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", ticker: "WBTC", swapFee: 500, weight: 0.2, decimals: 8, fallbackPriceUsd: 64317 },
    ],
    display: {
      assetSymbol: "DIS",
      analystBand: { low: 85, high: 135 },
      fallback: { beliefProb: 0.545, equityPrice: 108, assetLegPriceUsd: 4300 },
      // Oriented bullish = DIS up = strong box office / studio prestige. Verified 2026-06-14.
      beliefMarkets: [
        { venue: "polymarket", id: "678419", label: "Super Mario Galaxy is 2026's top-grossing film (big box office)", polarity: 1, relevance: 0.5, seedProb: 0.045, seedVolume: 346_000 },
        { venue: "kalshi", id: "KXOSCARNOMPIC-27-PRO", label: "'Project Hail Mary' is nominated for Best Picture", polarity: 1, relevance: 0.5, seedProb: 0.77, seedVolume: 72_000 },
        { venue: "kalshi", id: "KXOSCARNOMPIC-27-DIS", label: "'Disclosure Day' is nominated for Best Picture", polarity: 1, relevance: 0.3, seedProb: 0.16, seedVolume: 22_000 },
      ],

      securities: [
        { ticker: "DIS", name: "The Walt Disney Company", analystBand: { low: 85, high: 135 }, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Box-office/studio beta anchor (makes the marquee 2026 tentpoles) — no EVM-Uniswap venue." },
        { ticker: "NFLX", name: "Netflix", analystBand: { low: 600, high: 1300 }, priceUsd: 950, availability: "DISPLAY-ONLY", chain: "solana/CEX", note: "Streaming / box-office beta — tokenized as NFLXx on Solana; coming soon." },
        { ticker: "WBD", name: "Warner Bros. Discovery", analystBand: { low: 8, high: 20 }, priceUsd: 13, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Studio behind major 2026 tentpoles — no EVM-Uniswap venue." },
        { ticker: "CMCSA", name: "Comcast (Universal)", analystBand: { low: 30, high: 55 }, priceUsd: 42, availability: "DISPLAY-ONLY", chain: "off-rail", note: "Universal / Illumination parent — no EVM-Uniswap venue." },
        // On-chain entertainment / metaverse tokens (display-only; SAND+MANA live on Polygon; APE on Ethereum).
        { ticker: "SAND", name: "The Sandbox", token: "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Metaverse/gaming token — live, deep Polygon-Uniswap liquidity; the strongest near-term basket-integration candidate." },
        { ticker: "MANA", name: "Decentraland", token: "0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4", availability: "DISPLAY-ONLY", chain: "polygon", liquidity: "high", note: "Metaverse land/economy token — live Polygon-Uniswap depth; an integration candidate." },
        { ticker: "APE", name: "ApeCoin", token: "0x4d224452801ACEd8B2F0aebE155379bb5D594381", availability: "DISPLAY-ONLY", chain: "ethereum", liquidity: "medium", note: "Yuga Labs entertainment/NFT ecosystem token — deep on Ethereum, thin on Polygon; not a basket leg yet." },
        { ticker: "WETH", name: "Wrapped Ether", token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk-on asset on Uniswap (Polygon)." },
        { ticker: "WBTC", name: "Wrapped Bitcoin", token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, availability: "LIVE-UNISWAP", chain: "polygon", liquidity: "high", note: "Buyable risk asset on Uniswap (Polygon)." },
      ],
    },
  },
};

export function getTheme(slug: string): Theme {
  const t = THEMES[slug];
  if (!t) throw new Error(`Unknown theme: ${slug}`);
  return t;
}

export function listThemes(): Theme[] {
  return Object.values(THEMES);
}

export function themeWeightsSumToOne(slug: string): boolean {
  const sum = getTheme(slug).legs.reduce((a, l) => a + l.weight, 0);
  return Math.abs(sum - 1) < 1e-9;
}

/** The thematically-related securities shown inside a bucket (display/anchor layer). */
export function getSecurities(slug: string): Security[] {
  return getTheme(slug).display.securities;
}

/** The headline security (the one whose analyst band drives the hero gap) — matched by `assetSymbol`. */
export function getHeadlineSecurity(slug: string): Security {
  const t = getTheme(slug);
  const sec = t.display.securities.find((s) => s.ticker === t.display.assetSymbol);
  if (!sec) throw new Error(`No headline security (${t.display.assetSymbol}) in theme: ${slug}`);
  return sec;
}
