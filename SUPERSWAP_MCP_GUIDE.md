# SuperSwap DEX — Base MCP Plugin Guide

Complete guide for registering, integrating, and using the SuperSwap DEX as a Base MCP custom plugin. Every AI-routed swap earns you the same **0.30% protocol fee** as a regular UI swap.

---

## Table of Contents

1. [What is the SuperSwap MCP Plugin?](#1-what-is-the-superswap-mcp-plugin)
2. [Live Plugin URLs](#2-live-plugin-urls)
3. [Registering with Base MCP](#3-registering-with-base-mcp)
4. [All Endpoints — Reference](#4-all-endpoints--reference)
5. [Step-by-Step: Swap ETH → USDC via AI Agent](#5-step-by-step-swap-eth--usdc-via-ai-agent)
6. [Transaction Safety Rules](#6-transaction-safety-rules)
7. [Error Handling](#7-error-handling)
8. [Fee Architecture](#8-fee-architecture)
9. [Token Addresses (Base Mainnet)](#9-token-addresses-base-mainnet)
10. [Testing the Endpoints Locally](#10-testing-the-endpoints-locally)
11. [Using with Claude / ChatGPT / Other AI Agents](#11-using-with-claude--chatgpt--other-ai-agents)
12. [Deploying to Production](#12-deploying-to-production)

---

## 1. What is the SuperSwap MCP Plugin?

The **Model Context Protocol (MCP)** is an open standard that lets AI agents (Claude, GPT-4, Base Agent Kit, etc.) discover and call external APIs using natural language.

By registering SuperSwap as a Base MCP custom plugin, any AI agent that uses Base MCP can:

- **Ask** "What tokens can I swap on SuperSwap?" → agent calls `/api/mcp/tokens`
- **Ask** "How much USDC do I get for 1 ETH?" → agent calls `/api/mcp/quote`
- **Say** "Swap 0.1 ETH for USDC on SuperSwap" → agent calls `/api/mcp/build-swap` and hands the unsigned transaction to the user's Base Account for signing

You never hold private keys. Base MCP presents the unsigned transaction to the user for approval before anything is signed or submitted.

---

## 2. Live Plugin URLs

Replace `YOUR_DOMAIN` with your deployed domain (e.g. `superswap.replit.app`).

| Resource | URL |
|---|---|
| **Plugin Manifest** | `https://YOUR_DOMAIN/api/mcp/plugin` |
| **OpenAPI Spec** | `https://YOUR_DOMAIN/api/mcp/openapi.json` |
| **Markdown Spec** | `https://YOUR_DOMAIN/api/mcp/spec` |
| **Token List** | `https://YOUR_DOMAIN/api/mcp/tokens` |
| **Quote** | `https://YOUR_DOMAIN/api/mcp/quote` |
| **Build Transaction** | `https://YOUR_DOMAIN/api/mcp/build-swap` |
| **User Stats** | `https://YOUR_DOMAIN/api/mcp/user/:address` |

> All endpoints have **open CORS** (`Access-Control-Allow-Origin: *`) so any AI agent or external caller can reach them.

---

## 3. Registering with Base MCP

### Step 1 — Deploy your app

Make sure your app is deployed and publicly accessible (not just running locally). In Replit, click **Deploy** → **Autoscale** to get a permanent `*.replit.app` URL.

### Step 2 — Submit to Base MCP

Go to the Base MCP developer portal and register a new custom plugin. You will be asked for two things:

**Plugin manifest URL:**
```
https://YOUR_DOMAIN/api/mcp/plugin
```

**OpenAPI spec URL (Base may auto-discover this from the manifest):**
```
https://YOUR_DOMAIN/api/mcp/openapi.json
```

### Step 3 — Verify registration

Base MCP will fetch your manifest and spec to validate the plugin. Your manifest at `/api/mcp/plugin` returns:

```json
{
  "schema_version": "v1",
  "name_for_human": "SuperSwap DEX",
  "name_for_model": "superswap_dex",
  "description_for_human": "Swap tokens on Base and earn XP + USDC cashback rewards with every trade.",
  "description_for_model": "SuperSwap is a reward-first DEX on Base network (chainId 8453)...",
  "auth": { "type": "none" },
  "api": {
    "type": "openapi",
    "url": "https://YOUR_DOMAIN/api/mcp/openapi.json"
  }
}
```

### Step 4 — Test it

Once registered, tell any Base MCP agent: *"Use SuperSwap to swap 0.1 ETH for USDC."*  
The agent will read your OpenAPI spec, discover the endpoints, and orchestrate the flow automatically.

---

## 4. All Endpoints — Reference

### `GET /api/mcp/plugin`
Returns the plugin manifest in Base MCP format.  
No parameters. No authentication required.

---

### `GET /api/mcp/openapi.json`
Returns the full OpenAPI 3.0 specification. AI agents read this to understand all available actions and required parameters.

---

### `GET /api/mcp/spec`
Returns the full markdown specification (this document's API section) as `text/markdown`. Useful for pasting directly into AI system prompts.

---

### `GET /api/mcp/tokens`
Returns the list of popular tokens available on SuperSwap.

**Response:**
```json
[
  {
    "symbol": "ETH",
    "name": "Ethereum",
    "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "decimals": 18,
    "icon_url": "https://dd.dexscreener.com/ds-data/tokens/base/0xeeee...png"
  },
  {
    "symbol": "USDC",
    "name": "USD Coin",
    "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "decimals": 6,
    "icon_url": "..."
  }
]
```

> The list is pulled from your Admin Panel → Popular Tokens. If empty, falls back to the top 6 Base tokens.  
> Manage this list at `/admin` → **Popular Tokens** tab.

---

### `POST /api/mcp/quote`
Get a real-time price quote. **No wallet address required.** Use this to show the user what they'll receive before asking for confirmation.

**Request body:**
```json
{
  "sellToken":   "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "buyToken":    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "sellAmount":  "1000000000000000000",
  "slippageBps": 50
}
```

| Field | Required | Description |
|---|---|---|
| `sellToken` | ✅ | Contract address of token to sell. Use `0xeeee...eeee` for native ETH. |
| `buyToken` | ✅ | Contract address of token to buy. |
| `sellAmount` | ✅ | Amount in **smallest units** (wei for ETH, 6-decimal units for USDC). |
| `slippageBps` | ❌ | Slippage in basis points. Default: `50` (0.5%). |

**Converting human amounts to wei:**

| Token | Formula | Example: 1 token |
|---|---|---|
| ETH | `amount × 10^18` | `1000000000000000000` |
| USDC | `amount × 10^6` | `1000000` |
| cbBTC | `amount × 10^8` | `100000000` |

**Response:**
```json
{
  "sellToken":    "0xeeee...eeee",
  "buyToken":     "0x8335...2913",
  "sellAmount":   "1000000000000000000",
  "buyAmount":    "1874000000",
  "price":        "1874.12",
  "priceImpact":  "0.08",
  "estimatedGas": "185000",
  "protocolFee":  "0.3%",
  "sources": [
    { "name": "Uniswap_V3",  "proportion": "0.75" },
    { "name": "Aerodrome_V2","proportion": "0.25" }
  ],
  "hint": "sellAmount and buyAmount are in smallest units"
}
```

> `buyAmount: "1874000000"` = 1874 USDC (divide by 10^6 = 1,874.00 USDC)

---

### `POST /api/mcp/build-swap` ⭐
**The primary action.** Builds a fully-encoded unsigned transaction payload. Base MCP hands this to the user's Base Account for approval and signing.

**Request body:**
```json
{
  "sellToken":    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "buyToken":     "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "sellAmount":   "1000000000000000000",
  "takerAddress": "0xUSER_WALLET_ADDRESS",
  "slippageBps":  50
}
```

| Field | Required | Description |
|---|---|---|
| `sellToken` | ✅ | Token to sell |
| `buyToken` | ✅ | Token to buy |
| `sellAmount` | ✅ | Amount in smallest units |
| `takerAddress` | ✅ | The **user's** wallet address. They sign and pay gas. |
| `slippageBps` | ❌ | Slippage in bps. Default: `50` |

**Response:**
```json
{
  "transaction": {
    "chainId": 8453,
    "from":    "0xUSER_WALLET_ADDRESS",
    "to":      "0x0000000000001ff3684f28c67538d4d072c22734",
    "data":    "0x2213bc0b...(encoded calldata)",
    "value":   "1000000000000000000",
    "gas":     "185000"
  },
  "allowanceRequired": false,
  "allowanceTransaction": null,
  "allowanceTarget": null,
  "quote": {
    "sellAmount":   "1000000000000000000",
    "buyAmount":    "1874000000",
    "price":        "1874.12",
    "priceImpact":  "0.08",
    "estimatedGas": "185000",
    "protocolFee":  "0.3%"
  }
}
```

**If `allowanceRequired` is `true`** (ERC-20 tokens that haven't been approved yet):
```json
{
  "transaction": { ... },
  "allowanceRequired": true,
  "allowanceTransaction": {
    "chainId": 8453,
    "from":    "0xUSER_WALLET",
    "to":      "0xTOKEN_CONTRACT",
    "data":    "0x095ea7b3...(approve calldata)",
    "value":   "0",
    "gas":     "60000"
  },
  "allowanceTarget": "0x0000000000001ff3684f28c67538d4d072c22734"
}
```

In this case, the AI agent must present **`allowanceTransaction` first**, then the main `transaction` after approval is confirmed.

---

### `GET /api/mcp/user/:address`
Get a user's SuperSwap reward stats.

**Example:**
```
GET /api/mcp/user/0x1234...abcd
```

**Response:**
```json
{
  "address":        "0x1234...abcd",
  "xp":             12500,
  "rank":           "Gold",
  "swapCount":      47,
  "cashbackEarned": 18.42,
  "cashbackToken":  "USDC"
}
```

**Rank thresholds:**

| Rank | XP Required |
|---|---|
| Bronze | 0 |
| Silver | 2,000 |
| Gold | 10,000 |
| Platinum | 50,000 |
| Diamond | 100,000 |

---

## 5. Step-by-Step: Swap ETH → USDC via AI Agent

This is the complete flow an AI agent follows when a user says *"Swap 0.1 ETH for USDC on SuperSwap".*

### Step 1 — Get quote
```bash
POST /api/mcp/quote
{
  "sellToken":  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "buyToken":   "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "sellAmount": "100000000000000000",
  "slippageBps": 50
}
```

### Step 2 — Present quote to user
```
You will receive approximately 187.41 USDC for 0.1 ETH.
Price impact: 0.08% | Protocol fee: 0.30% | Slippage: 0.5%
Confirm?
```

### Step 3 — Build transaction (after user confirms)
```bash
POST /api/mcp/build-swap
{
  "sellToken":    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "buyToken":     "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "sellAmount":   "100000000000000000",
  "takerAddress": "0xUSER_WALLET",
  "slippageBps":  50
}
```

### Step 4 — Base MCP hands transaction to user's Base Account
The user sees a confirmation dialog showing:
- Selling: 0.1 ETH
- Receiving: ~187 USDC
- Gas: ~$0.02

User approves → transaction is signed and submitted to Base Mainnet.

### Step 5 — XP and cashback auto-credited
After the transaction confirms on-chain, the user automatically earns XP and USDC cashback. No claiming needed.

---

## 6. Transaction Safety Rules

These rules are embedded in the plugin spec so AI agents follow them automatically:

1. **Always show the quote before building a transaction** — never skip straight to `build-swap`.
2. **Never submit a transaction without explicit user confirmation** — show sell amount, receive amount, USD value, fee, and gas.
3. **If `allowanceRequired: true`** — tell the user they need to approve the token first. Present `allowanceTransaction` before the swap transaction.
4. **Only operate on Base Mainnet** (chainId 8453). Never switch chains.
5. **Slippage recommendations:**
   - Stablecoin pairs (USDC/DAI): 10–25 bps
   - Large caps (ETH/cbBTC): 50 bps (default)
   - Small caps / meme coins: 100–200 bps

---

## 7. Error Handling

All errors return JSON in this format:

```json
{
  "error": "Human-readable description",
  "code":  "MACHINE_READABLE_CODE",
  "message": { ...upstream error details if available... }
}
```

**Error codes:**

| Code | Meaning | What to do |
|---|---|---|
| `MISSING_PARAMS` | Required field missing | Check request body — add missing fields |
| `ZEROX_ERROR` | 0x aggregator returned an error | Check `message` for details. Usually: token not supported, amount too small, or no liquidity |
| `INSUFFICIENT_LIQUIDITY` | No route found for this pair | Try a different token pair or larger amount |
| `INVALID_ADDRESS` | Wallet address format wrong | Ensure address starts with `0x` and is 42 chars |
| `INTERNAL` | Unexpected server error | Retry. If persistent, check server logs. |

**HTTP status codes used:**
- `200` — Success
- `400` — Bad request (missing/invalid params)
- `500` — Server or upstream error

---

## 8. Fee Architecture

Your 0.30% fee is enforced at the **0x transaction-encoding level** — it cannot be bypassed.

Every call to `/api/mcp/quote` and `/api/mcp/build-swap` passes these parameters to 0x:

```typescript
swapFeeRecipient: "0xea8d70f2e7e577160b1c5a2c6e33bfd8ad6dde5e",  // your wallet
swapFeeBps:       "30",   // 0.30%
swapFeeToken:     sellToken,  // fee taken from the sell token
```

This means:

| Swap | Fee deducted | Paid to |
|---|---|---|
| 1 ETH → USDC | 0.003 ETH | Your fee wallet |
| 1000 USDC → ETH | 3 USDC | Your fee wallet |
| 0.01 cbBTC → ETH | 0.00003 cbBTC | Your fee wallet |

The fee applies identically whether the swap comes from:
- Your website UI
- A Base MCP AI agent
- A direct API call
- Any other integration

---

## 9. Token Addresses (Base Mainnet)

| Token | Address | Decimals |
|---|---|---|
| ETH (native) | `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` | 18 |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| WETH | `0x4200000000000000000000000000000000000006` | 18 |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8 |
| DAI | `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` | 18 |
| USDT | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6 |
| AERO | `0x940181a94A35A4569E4529A3CDfB74e38FD98631` | 18 |
| BRETT | `0x532f27101965dd16442E59d40670FaF5eBB142E4` | 18 |
| VIRTUAL | `0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b` | 18 |
| cbETH | `0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22` | 18 |

> Add more tokens to the quick-select list via **Admin Panel → Popular Tokens**.  
> They'll automatically appear in `/api/mcp/tokens`.

---

## 10. Testing the Endpoints Locally

Start the dev server (`npm run dev`) then run these curl commands:

### Test plugin manifest
```bash
curl http://localhost:5000/api/mcp/plugin | jq .
```

### Test token list
```bash
curl http://localhost:5000/api/mcp/tokens | jq .
```

### Test a quote (1 ETH → USDC)
```bash
curl -X POST http://localhost:5000/api/mcp/quote \
  -H "Content-Type: application/json" \
  -d '{
    "sellToken":  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "buyToken":   "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "sellAmount": "1000000000000000000",
    "slippageBps": 50
  }' | jq .
```

### Test building a transaction
```bash
curl -X POST http://localhost:5000/api/mcp/build-swap \
  -H "Content-Type: application/json" \
  -d '{
    "sellToken":    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "buyToken":     "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "sellAmount":   "1000000000000000000",
    "takerAddress": "0xYOUR_WALLET_ADDRESS",
    "slippageBps":  50
  }' | jq '{tx: .transaction, allowanceRequired: .allowanceRequired, price: .quote.price}'
```

### Check user stats
```bash
curl http://localhost:5000/api/mcp/user/0xYOUR_WALLET | jq .
```

### Test CORS (simulating an AI agent call)
```bash
curl -I -X OPTIONS http://localhost:5000/api/mcp/quote \
  -H "Origin: https://agent.base.org" \
  -H "Access-Control-Request-Method: POST"
# Should return: Access-Control-Allow-Origin: *
```

### Fetch the OpenAPI spec
```bash
curl http://localhost:5000/api/mcp/openapi.json | jq '.paths | keys'
# Returns: ["/api/mcp/build-swap", "/api/mcp/quote", "/api/mcp/tokens", "/api/mcp/user/{address}"]
```

---

## 11. Using with Claude / ChatGPT / Other AI Agents

### With Claude (via MCP)
Add SuperSwap as a tool server in your Claude MCP config (`~/.claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "superswap": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://YOUR_DOMAIN/api/mcp/openapi.json"]
    }
  }
}
```

### With any OpenAI-compatible agent
Paste the contents of `https://YOUR_DOMAIN/api/mcp/spec` into the system prompt. The agent will know all available actions and how to call them.

### With Base Agent Kit (AgentKit)
```typescript
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";

const tools = await loadOpenApiTools("https://YOUR_DOMAIN/api/mcp/openapi.json");
// Agent now has: listTokens, getSwapQuote, buildSwapTransaction, getUserRewards
```

### With LangChain
```python
from langchain.tools import OpenAPISpec, APIOperation

spec = OpenAPISpec.from_url("https://YOUR_DOMAIN/api/mcp/openapi.json")
# Creates LangChain tools from the spec automatically
```

---

## 12. Deploying to Production

Your MCP plugin only works for external AI agents when it's deployed to a public URL.

### Deploy on Replit
1. Click the **Deploy** button in the top-right corner of Replit
2. Choose **Autoscale** deployment
3. Your app gets a permanent URL like `https://superswap.replit.app`
4. All MCP endpoints are immediately available at that URL
5. Update your Base MCP plugin registration with the new domain

### Environment variables needed in production
These should already be set in your Replit Secrets:
- `ZEROX_API_KEY` — Required for live swap quotes and transactions
- `SUPABASE_DATABASE_URL` — Required for popular tokens list and user stats
- `BASESCAN_API_KEY` — Optional, for on-chain swap verification

### Verify production deployment
```bash
curl https://YOUR_DOMAIN/api/mcp/plugin | jq .name_for_human
# Should return: "SuperSwap DEX"
```

---

## Summary

| What | Where |
|---|---|
| Plugin code | `server/mcp.ts` |
| Registered in server | `server/index.ts` → `registerMcpRoutes(app)` |
| Token list managed | Admin Panel → Popular Tokens → stored in `popular_tokens` DB table |
| Fee wallet | `0xea8d70f2e7e577160b1c5a2c6e33bfd8ad6dde5e` (set in `server/mcp.ts`) |
| Fee amount | 0.30% per swap (30 basis points) |
| Chain | Base Mainnet (chainId: 8453) |
| Aggregator | 0x Protocol v2 |
