# Lessons (Project-Lynx build)

- **blockscout `read_contract` coerces uint256 → JS float** (scientific notation, precision lost). For exact 256-bit ids, cross-check against a known source (Gamma clobTokenIds) or capture exact values via Tenderly `get_vnet_simulation_asset_changes` / a raw eth_call. Don't paste a float into code.
- **OpenAI and Anthropic are separate NegRisk markets**, each with its own negRiskMarketID. The docs implied one shared "AI-model" market — verify market grouping from Gamma's `negRiskMarketID` per market, not assumptions.
- **Gamma `questionID` (capital ID)** is the field that drives `getPositionId`. `outcomes`/`outcomePrices`/`clobTokenIds` are stringified JSON arrays — `JSON.parse` before indexing.
- **Never weaken a failing test to make it green** (the false-green USDC-balance trap). The EnterBasket fork test must assert recipient holds BOTH outcome tokens AND the contract retains zero wcol/USDC.e/tokens.
