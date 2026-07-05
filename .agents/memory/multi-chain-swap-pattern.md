---
name: Multi-chain 0x swap support (Base + Robinhood Chain)
description: How SuperSwap added a second EVM chain (Robinhood Chain) to the existing Base-only 0x-powered swap without breaking the fee model, and why swaps on that chain still don't fill.
---

The swap backend and frontend hooks were hardcoded to a single chainId. To support a second chain sharing the same 0x router and fee wallet:

- Server: replace the hardcoded chainId constant with a small allow-list (`SUPPORTED_CHAIN_IDS`) and a `resolveChainId()` helper that defaults to the primary chain if the client passes an invalid/missing value. Both `/api/swap/price` and `/api/swap/quote` read `chainId` from query params. The fee recipient wallet is untouched — 0x lets the same fee wallet receive fees on any chain it's deployed on.
- Client hooks (`useSwapPrice`, `fetchSwapQuote`) take an explicit `chainId` argument threaded from the page state, not inferred from `window.ethereum` — this keeps quotes correct even before the wallet has switched networks.
- Network selection state should sync FROM the wallet's connected chain (via effect) but also be independently settable by the user (toggle UI) so users can browse quotes for a chain before switching their wallet to it.
- New chain lacked any indexed token list (no DexScreener-style coverage). Solution: ship native ETH only by default, and let users paste an ERC-20 address; look up symbol/name/decimals via a direct JSON-RPC `eth_call` to the chain's public RPC (not `window.ethereum`, so it works regardless of the wallet's current network).
- Pitfall: any "default buy token" fallback logic that hardcodes a Base-only address (e.g. Base USDC) must be branched per-network — falling through to a Base token object when the other chain has no second token yet silently selects a token that doesn't exist on that chain, breaking quotes with no obvious error.

**Robinhood Chain has no real DEX liquidity as of 2026-07-05**: confirmed via direct RPC `eth_getCode` calls that none of the canonical Uniswap V2/V3 contract addresses (factory, SwapRouter, SwapRouter02, QuoterV2, NFPositionManager, UniversalRouter) are deployed there, and the 0x API returns `liquidityAvailable: false` for every pair on chainId 4663. The "Add LP on Uniswap" link in the Robinhood Playground points to Uniswap's frontend but has nothing to actually create a pool against. Swap UI must surface `data.liquidityAvailable === false` from 0x responses as an explicit "no liquidity yet" error/banner rather than silently showing a zero quote — this is an infrastructure gap, not a code bug, and re-checking it is cheap (one RPC call) before assuming a swap fix is possible.

**Why:** keeps the two chains' data sources cleanly separated (Base token list must never leak into the other chain's picker) while reusing 100% of the swap execution path (0x router, approve/allowance flow, fee wallet).

**How to apply:** when adding a further chain, extend `SUPPORTED_CHAIN_IDS` server-side, add its constants/token list client-side, add a case to the network toggle, and verify real DEX liquidity exists on-chain before promising working swaps.
