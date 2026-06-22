---
name: XP on-chain claim feature
description: How the Season 1 XP Claim page works — contracts, flow, DB flag, backend verification.
---

# XP On-chain Claim Feature

## Contracts (Base mainnet)
- Claim contract: `0xe1408047F2811fB213c305199cc51B68e7043cf6`
- XP token:       `0xAE3aE4734D03C26E6614fbEdd1d7EF5C30F68741`
- Claim fee:      `0.000040 ETH` = `40000000000000 wei` = `0x246139CA8000`
- XP reward:      `10,000 XP` per wallet (one-time)

## Frontend (client/src/pages/EarnPage.tsx)
- Uses `viem` (`encodeFunctionData`, `decodeFunctionResult`) for ABI encoding
- Reads via `eth_call` to `https://mainnet.base.org` (no wagmi/RainbowKit)
- Writes via existing `useWalletContext().sendTransaction()` (raw `window.ethereum`)
- Polls `eth_getTransactionReceipt` every 2.5 s to confirm TX
- After confirmed receipt → calls `POST /api/xp-claim` to award DB XP
- State machine: idle → checking → ready | already_claimed → confirming → sending → pending_receipt → awarding → success | error

## Backend (server/routes.ts POST /api/xp-claim)
- Verifies `eth_getTransactionReceipt` on Base public RPC: status=0x1, to=claim contract, from=wallet
- Then calls `rewardsStorage.awardXpClaim(wallet)` which is idempotent via `xp_claimed` flag

## DB
- `xp_claimed BOOLEAN NOT NULL DEFAULT false` added to `reward_users`
- Migration: ran `ALTER TABLE reward_users ADD COLUMN IF NOT EXISTS xp_claimed BOOLEAN NOT NULL DEFAULT false` via `npx tsx _migrate_xp_claimed.ts` (using getPoolConfig() with SSL)
- `executeSql` tool runs against LOCAL pg, NOT Supabase — always use tsx script for Supabase schema changes

**Why:** Contract prevents double on-chain claims; DB flag prevents double XP awards if user calls the API twice.
