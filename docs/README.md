# Project-Lynx — Build Knowledge Package (migrate to the new repo)

> **Project name:** Project-Lynx
> **Event:** ETHGlobal New York 2026 (June 12–14, 2026), Metropolitan Pavilion. ~36h build.
> **Created:** 2026-06-13. This folder is a self-contained briefing meant to be **copied into a fresh hackathon repo** (forking is not allowed).

## What Project-Lynx is, in one sentence

> A **non-custodial, thematic prediction-market index + intelligence dashboard**: browse themed buckets (US Politics, Military, AI, …), see a dashboard that compares **what belief-markets imply vs. what real assets are pricing in** (the "divergence" signal), and **enter a theme in one signature** — buying a curated basket of real prediction-market positions + tokenized stocks straight into your own wallet.

## Sponsors (locked): Arc + LI.FI + Uniswap

- **Arc (Circle)** — the account/money layer + chain-abstracted USDC hub. Hits Arc Target A *and* Target B.
- **LI.FI** — the one-signature cross-chain **assembly/entry** (Composer + Widget).
- **Uniswap** — the **tokenized-securities** basket legs + the `/quote` price oracle for the dashboard + UniswapX exit.

## How a new session should use this folder

Read in order:

1. **`CLAUDE.md`** — copy this to the **new repo root**. It's the auto-loaded project briefing.
2. **`01-product-and-design.md`** — the product, the MVP demo, the architecture, MVP-vs-stretch.
3. **`02-sponsor-integration.md`** — deep technical guide for Arc, LI.FI, Uniswap (endpoints, SDKs, chains, prize requirements). This is your build reference.
4. **`03-decisions-and-constraints.md`** — every locked decision + the rationale + the **DO-NOT** list. Read this so you don't relitigate settled choices.
5. **`04-build-plan-and-derisk.md`** — Day-1 booth checklist, MVP build order, per-prize deliverables, the demo script.
6. **`05-implementation-plan.md`** — the task-by-task, TDD implementation plan for the MVP (execute this in the new repo).

## Status

Design is **locked and approved**. Next step in the new repo: run the Day-1 de-risk checks (`04`), then execute `05-implementation-plan.md` task by task.
