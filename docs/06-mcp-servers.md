# 06 — MCP Servers (setup & handoff)

> Verified live on 2026-06-13 via a real MCP `initialize` handshake against each server (not just "listed"). Config lives in `/.mcp.json` (5 servers) + `/.npmrc`.

## Working servers (committed in `.mcp.json`)

| Server | Type | Endpoint / package | Verified as | Notes |
|---|---|---|---|---|
| **circle** | remote HTTP | `https://api.circle.com/v1/codegen/mcp` | `Circle AI Codegen MCP Server V2 v3.3.1` | Official Circle (USDC/Arc). No auth. **Codegen/SDK-reference only — does NOT sign or move funds.** |
| **lifi** | remote HTTP | `https://mcp.li.quest/mcp` | `lifi-mcp v2.0.0` | Official LI.FI. Read-only quotes/status/chains. **Does NOT assemble/sign `EnterBasket`** — that stays in the LI.FI SDK/Composer app code. API key optional. |
| **context7** | stdio (npx) | `@upstash/context7-mcp` | `Context7 v3.2.0` | Official Upstash. Up-to-date SDK docs lookup. Optional `CONTEXT7_API_KEY` for higher limits. |
| **polymarket** | stdio (npx) | `@iqai/mcp-polymarket` | `mcp-polymarket v0.0.18` | Community. **Read-only** (no `POLYMARKET_PRIVATE_KEY`) → odds/market data for the divergence signal. **Requires the `.npmrc` JSR fix below.** |
| **foundry** | stdio (npx) | `@pranesh.asp/foundry-mcp-server` | boots | Community/experimental. **Needs Foundry installed (`foundryup`)** or every tool errors "Foundry is not installed". No PRIVATE_KEY (build/read only). |

### `.npmrc` (required for polymarket — committed)

```
@jsr:registry=https://npm.jsr.io
```

Reason: `@iqai/mcp-polymarket` depends on a JSR module; without this mapping, `npx` 404s on `@jsr/hk__polymarket`.

## Gotchas / traps

- ⚠️ **`api.circle.so/mcp` is the WRONG Circle** — that's Circle**.so** (community-platform software); it returns HTTP 405 and is not an MCP endpoint. The correct USDC/Arc Circle is `api.circle.com`. Do not switch.
- Community stdio servers auto-run via `npx` at startup. Project-scoped servers show **"pending approval"** until approved via `/mcp` or on restart.
- **No private keys anywhere** (matches the non-custodial design + org credential policy). Secrets expand from shell env via `${VAR}`; nothing secret is stored in `.mcp.json`.

## Deliberately NOT installed (don't re-research)

- **EVM-read MCP** — `@jamesanz/evm-mcp@1.0.1` is broken as published (its bin lacks a Node shebang → the shell runs JS as a script: `const: command not found`). If on-chain reads are needed, use Chainstack's vendor-hosted remote `https://mcp.chainstack.com/mcp` (needs a Chainstack API key). In-app reads use viem regardless.
- **Uniswap MCP** — no trustworthy Uniswap MCP server exists. "Uniswap AI" is a Claude Code *plugin/skill* marketplace (`/plugin marketplace add uniswap/uniswap-ai`), **not** an MCP. The real integration uses the Uniswap **Trading API REST** (`/quote`, `/swap`), already in the build plan (`docs/02`, `docs/05`).

## Verify any server live (handshake)

```bash
init='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"v","version":"0.0.1"}}}'

# remote (circle / lifi):
curl -sS -X POST <url> \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' -d "$init"

# stdio (context7 / polymarket / foundry):  macOS has no `timeout`; use a perl alarm
printf '%s\n' "$init" | perl -e 'alarm 120; exec @ARGV' npx -y <package>
```

## Setup for a fresh session / clone

1. **Approve** the 5 project servers on restart (Claude Code gates project-scoped MCP servers for security).
2. **Foundry server only:** `curl -L https://foundry.paradigm.xyz | bash && foundryup`.
3. **Optional** (higher rate limits, not required): set `CONTEXT7_API_KEY`, `LIFI_API_KEY`. The 4 non-foundry servers work with zero setup.
