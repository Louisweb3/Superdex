/**
 * SuperSwap Base MCP Plugin
 *
 * Exposes SuperSwap as a custom plugin for Base MCP so AI agents can:
 *   1. Discover available tokens
 *   2. Get price quotes
 *   3. Build unsigned swap transactions → handed to the user's Base Account for signing
 *   4. Look up user reward stats
 *
 * Endpoints
 *   GET  /api/mcp/plugin        — Plugin manifest (Base MCP plugin.json format)
 *   GET  /api/mcp/openapi.json  — OpenAPI 3.0 spec (AI reads this to understand the API)
 *   GET  /api/mcp/spec          — Markdown spec (human-readable + AI-readable description)
 *   GET  /api/mcp/tokens        — Popular tokens list (DB-driven with fallback)
 *   POST /api/mcp/quote         — Get price quote (no wallet needed)
 *   POST /api/mcp/build-swap    — Build unsigned swap transaction payload
 *   GET  /api/mcp/user/:address — User XP, rank, cashback stats
 */

import type { Express, Request, Response } from "express";
import { adminStorage, rewardsStorage } from "./storage";

const ZEROX_API_KEY  = process.env.ZEROX_API_KEY || "";
const ZEROX_BASE_URL = "https://api.0x.org";
const CHAIN_ID       = 8453; // Base Mainnet
const FEE_RECIPIENT  = "0xea8d70f2e7e577160b1c5a2c6e33bfd8ad6dde5e";
const FEE_BPS        = 30; // 0.30 % protocol fee

// Well-known Base token addresses
const NATIVE_ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const USDC       = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH       = "0x4200000000000000000000000000000000000006";

// Quote cache – 15 s TTL per "sell:buy:amount" key to avoid hammering 0x
const quoteCache = new Map<string, { data: any; ts: number }>();
const QUOTE_TTL  = 15_000;

function baseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host  = req.headers["x-forwarded-host"] || req.headers.host || "superswap.fi";
  return `${proto}://${host}`;
}

// ── Token list fallback when DB is empty ──────────────────────────────────────
const FALLBACK_TOKENS = [
  { symbol: "ETH",     name: "Ethereum",             address: NATIVE_ETH, decimals: 18 },
  { symbol: "USDC",    name: "USD Coin",              address: USDC,       decimals: 6  },
  { symbol: "WETH",    name: "Wrapped Ether",         address: WETH,       decimals: 18 },
  { symbol: "cbBTC",   name: "Coinbase Bitcoin",      address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8  },
  { symbol: "AERO",    name: "Aerodrome Finance",     address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18 },
  { symbol: "VIRTUAL", name: "Virtuals Protocol",     address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", decimals: 18 },
];

// ── 0x helper ─────────────────────────────────────────────────────────────────
async function zeroXFetch(endpoint: string, params: URLSearchParams): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${ZEROX_BASE_URL}${endpoint}?${params}`, {
    headers: { "0x-api-key": ZEROX_API_KEY, "0x-version": "v2", "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── Markdown spec content ─────────────────────────────────────────────────────
function buildMarkdownSpec(base: string): string {
  return `# SuperSwap DEX — Base MCP Plugin Specification

## Overview
SuperSwap is a **reward-first DEX on Base network** (chainId: 8453).  
Every swap earns the user **XP points** and **cashback** in USDC — automatically, no claiming needed.

**Protocol fee:** 0.30% per swap (included in all quotes)  
**Network:** Base Mainnet (chainId: 8453)  
**Aggregator:** 0x Protocol v2 (best-price routing across Uniswap V3, Aerodrome, Curve, etc.)  
**Plugin base URL:** \`${base}\`

---

## Available Actions

### 1. List Available Tokens
Returns the curated list of popular tokens available for swapping.

\`\`\`
GET ${base}/api/mcp/tokens
\`\`\`

**Response:**
\`\`\`json
[
  { "symbol": "ETH",  "name": "Ethereum", "address": "${NATIVE_ETH}", "decimals": 18, "icon_url": "..." },
  { "symbol": "USDC", "name": "USD Coin", "address": "${USDC}",       "decimals": 6  }
]
\`\`\`

---

### 2. Get Price Quote
Get a real-time price quote for a swap — no wallet address required.

\`\`\`
POST ${base}/api/mcp/quote
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
  "sellToken":  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "buyToken":   "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "sellAmount": "1000000000000000000",
  "slippageBps": 50
}
\`\`\`

| Field        | Required | Description                                        |
|--------------|----------|----------------------------------------------------|
| sellToken    | ✅        | Token address to sell (use ${NATIVE_ETH} for ETH)   |
| buyToken     | ✅        | Token address to buy                               |
| sellAmount   | ✅        | Amount in smallest unit (e.g. wei for ETH)         |
| slippageBps  | ❌        | Slippage tolerance in basis points (default: 50)   |

**Response:**
\`\`\`json
{
  "sellToken":   "0xeeee...",
  "buyToken":    "0x8335...",
  "sellAmount":  "1000000000000000000",
  "buyAmount":   "3200000000",
  "price":       "3200.00",
  "priceImpact": "0.12",
  "estimatedGas": "185000",
  "sources": [
    { "name": "Uniswap_V3", "proportion": "0.7" },
    { "name": "Aerodrome",  "proportion": "0.3" }
  ]
}
\`\`\`

---

### 3. Build Unsigned Swap Transaction ⭐ (primary action)
Builds a fully-encoded, unsigned transaction payload ready for user signing.  
**Never submit this without the user's explicit approval.**  
Base MCP will hand this payload to the user's Base Account to review and sign.

\`\`\`
POST ${base}/api/mcp/build-swap
Content-Type: application/json
\`\`\`

**Body:**
\`\`\`json
{
  "sellToken":    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "buyToken":     "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "sellAmount":   "1000000000000000000",
  "takerAddress": "0xUserWalletAddress",
  "slippageBps":  50
}
\`\`\`

| Field         | Required | Description                                    |
|---------------|----------|------------------------------------------------|
| sellToken     | ✅        | Token to sell                                  |
| buyToken      | ✅        | Token to buy                                   |
| sellAmount    | ✅        | Amount in smallest unit (wei, etc.)            |
| takerAddress  | ✅        | The user's wallet address (tx sender)          |
| slippageBps   | ❌        | Slippage in bps (default: 50 = 0.5%)           |

**Response:**
\`\`\`json
{
  "transaction": {
    "chainId": 8453,
    "from":    "0xUserWalletAddress",
    "to":      "0xAllowanceHolderContract",
    "data":    "0x...",
    "value":   "1000000000000000000",
    "gas":     "185000"
  },
  "allowanceRequired": false,
  "allowanceTransaction": null,
  "quote": {
    "sellAmount":  "1000000000000000000",
    "buyAmount":   "3200000000",
    "price":       "3200.00",
    "priceImpact": "0.12"
  }
}
\`\`\`

If \`allowanceRequired\` is \`true\`, present the \`allowanceTransaction\` to the user for signing **before** the swap transaction.

---

### 4. Get User Rewards
Fetch a user's XP points, cashback earned, swap count, and rank on SuperSwap.

\`\`\`
GET ${base}/api/mcp/user/{address}
\`\`\`

**Response:**
\`\`\`json
{
  "address":       "0x...",
  "xp":            12500,
  "rank":          "Gold",
  "swapCount":     47,
  "cashbackEarned": 18.42,
  "cashbackToken": "USDC"
}
\`\`\`

---

## Transaction Safety Rules
1. **Never sign a transaction without user confirmation** — always show the full quote details.
2. **Show the user:** what they are selling, what they receive, the USD value, the 0.30% fee, and the estimated gas.
3. **If \`allowanceRequired\` is true** — explain that the user must first approve the token, then sign the swap.
4. **Slippage** — recommend 0.5% (50 bps) for stablecoins, 1% (100 bps) for volatile tokens.
5. **Only operate on Base Mainnet** (chainId 8453). Never switch chains.

---

## Error Handling
All endpoints return JSON errors in the format:
\`\`\`json
{ "error": "Human-readable error message", "code": "OPTIONAL_CODE" }
\`\`\`

Common error codes:
- \`INSUFFICIENT_LIQUIDITY\` — No route found for this pair
- \`MISSING_PARAMS\` — Required field missing in request body
- \`ZEROX_ERROR\` — Upstream 0x API error (details in \`message\`)

---

## Quick-Start Example

> **User:** "Swap 0.1 ETH for USDC on SuperSwap"

1. Call \`POST /api/mcp/quote\` with \`sellAmount = "100000000000000000"\` (0.1 ETH in wei)
2. Present the quote to the user: "You'll receive ~320 USDC. Fee: 0.30%. Slippage: 0.5%."
3. On user confirmation, call \`POST /api/mcp/build-swap\` with the user's wallet address
4. Hand the returned \`transaction\` object to Base MCP for user signing
5. If \`allowanceRequired\`, handle the approve transaction first
`;
}

// ── OpenAPI 3.0 spec ──────────────────────────────────────────────────────────
function buildOpenApiSpec(base: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "SuperSwap DEX API",
      description: "Reward-first DEX on Base. Swap tokens and earn XP + USDC cashback. Returns unsigned transaction payloads for user signing via Base MCP.",
      version: "1.0.0",
      contact: { name: "SuperSwap", url: "https://superswap.fi" },
    },
    servers: [{ url: base, description: "SuperSwap API" }],
    paths: {
      "/api/mcp/tokens": {
        get: {
          operationId: "listTokens",
          summary: "List available tokens",
          description: "Returns the curated list of popular tokens available for swapping on SuperSwap (Base network).",
          responses: {
            "200": {
              description: "Array of token objects",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Token" } },
                },
              },
            },
          },
        },
      },
      "/api/mcp/quote": {
        post: {
          operationId: "getSwapQuote",
          summary: "Get a swap price quote",
          description: "Returns a real-time price quote for swapping one token to another. No wallet address required. Always show this to the user before building a transaction.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/QuoteRequest" },
                example: {
                  sellToken: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                  buyToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                  sellAmount: "1000000000000000000",
                  slippageBps: 50,
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Swap price quote",
              content: { "application/json": { schema: { $ref: "#/components/schemas/QuoteResponse" } } },
            },
            "400": { description: "Missing or invalid parameters" },
            "500": { description: "Upstream aggregator error" },
          },
        },
      },
      "/api/mcp/build-swap": {
        post: {
          operationId: "buildSwapTransaction",
          summary: "Build an unsigned swap transaction",
          description: "Builds a fully-encoded unsigned transaction payload for a token swap. The returned transaction must be handed to the user's Base Account for approval and signing. Never submit without explicit user confirmation. Protocol fee: 0.30%.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BuildSwapRequest" },
                example: {
                  sellToken: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                  buyToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                  sellAmount: "1000000000000000000",
                  takerAddress: "0xYourWalletAddress",
                  slippageBps: 50,
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Unsigned transaction payload + quote summary",
              content: { "application/json": { schema: { $ref: "#/components/schemas/BuildSwapResponse" } } },
            },
            "400": { description: "Missing required fields" },
            "500": { description: "Transaction build failed" },
          },
        },
      },
      "/api/mcp/user/{address}": {
        get: {
          operationId: "getUserRewards",
          summary: "Get user reward stats",
          description: "Returns a user's XP points, rank, total swaps, and cashback earned on SuperSwap.",
          parameters: [
            {
              name: "address",
              in: "path",
              required: true,
              description: "Ethereum address (0x...)",
              schema: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
            },
          ],
          responses: {
            "200": {
              description: "User reward stats",
              content: { "application/json": { schema: { $ref: "#/components/schemas/UserStats" } } },
            },
            "400": { description: "Invalid wallet address" },
          },
        },
      },
    },
    components: {
      schemas: {
        Token: {
          type: "object",
          properties: {
            symbol:   { type: "string", example: "ETH" },
            name:     { type: "string", example: "Ethereum" },
            address:  { type: "string", example: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" },
            decimals: { type: "integer", example: 18 },
            icon_url: { type: "string", example: "https://..." },
          },
        },
        QuoteRequest: {
          type: "object",
          required: ["sellToken", "buyToken", "sellAmount"],
          properties: {
            sellToken:   { type: "string", description: "Token contract address to sell (use 0xeeee...eeee for native ETH)" },
            buyToken:    { type: "string", description: "Token contract address to buy" },
            sellAmount:  { type: "string", description: "Amount in smallest unit (wei for ETH, e.g. '1000000000000000000' = 1 ETH)" },
            slippageBps: { type: "integer", description: "Slippage tolerance in basis points (50 = 0.5%). Default: 50", default: 50 },
          },
        },
        QuoteResponse: {
          type: "object",
          properties: {
            sellToken:    { type: "string" },
            buyToken:     { type: "string" },
            sellAmount:   { type: "string", description: "Exact sell amount in smallest unit" },
            buyAmount:    { type: "string", description: "Expected buy amount in smallest unit" },
            price:        { type: "string", description: "Price in terms of buyToken per sellToken unit" },
            priceImpact:  { type: "string", description: "Price impact percentage (e.g. '0.12' = 0.12%)" },
            estimatedGas: { type: "string" },
            sources:      { type: "array", items: { type: "object", properties: { name: { type: "string" }, proportion: { type: "string" } } } },
          },
        },
        BuildSwapRequest: {
          type: "object",
          required: ["sellToken", "buyToken", "sellAmount", "takerAddress"],
          properties: {
            sellToken:    { type: "string", description: "Token address to sell" },
            buyToken:     { type: "string", description: "Token address to buy" },
            sellAmount:   { type: "string", description: "Amount in smallest unit" },
            takerAddress: { type: "string", description: "The user's wallet address that will sign and submit the transaction" },
            slippageBps:  { type: "integer", description: "Slippage in basis points (default: 50)", default: 50 },
          },
        },
        UnsignedTransaction: {
          type: "object",
          properties: {
            chainId: { type: "integer", example: 8453, description: "Always 8453 (Base Mainnet)" },
            from:    { type: "string", description: "Sender (user's wallet address)" },
            to:      { type: "string", description: "Contract to call (0x Allowance Holder)" },
            data:    { type: "string", description: "Encoded calldata (hex)" },
            value:   { type: "string", description: "ETH value in wei (string). '0' for ERC-20 swaps." },
            gas:     { type: "string", description: "Estimated gas limit" },
          },
        },
        BuildSwapResponse: {
          type: "object",
          properties: {
            transaction:          { $ref: "#/components/schemas/UnsignedTransaction" },
            allowanceRequired:    { type: "boolean", description: "True if user must approve the token before swapping" },
            allowanceTransaction: {
              nullable: true,
              description: "If allowanceRequired is true, sign and submit this transaction FIRST",
              allOf: [{ $ref: "#/components/schemas/UnsignedTransaction" }],
            },
            allowanceTarget: { type: "string", nullable: true, description: "Spender address to approve" },
            quote: {
              type: "object",
              properties: {
                sellAmount:   { type: "string" },
                buyAmount:    { type: "string" },
                price:        { type: "string" },
                priceImpact:  { type: "string" },
                estimatedGas: { type: "string" },
              },
            },
          },
        },
        UserStats: {
          type: "object",
          properties: {
            address:        { type: "string" },
            xp:             { type: "integer", description: "Total XP points earned" },
            rank:           { type: "string", description: "User tier (Bronze / Silver / Gold / Platinum / Diamond)" },
            swapCount:      { type: "integer", description: "Total swaps completed" },
            cashbackEarned: { type: "number",  description: "Total USDC cashback earned" },
            cashbackToken:  { type: "string",  example: "USDC" },
          },
        },
      },
    },
  };
}

// ── ERC-20 approve calldata builder ──────────────────────────────────────────
function buildApproveCalldata(spender: string, amount: bigint): string {
  // approve(address,uint256) selector = 0x095ea7b3
  const sel    = "095ea7b3";
  const sp     = spender.slice(2).toLowerCase().padStart(64, "0");
  const amt    = amount.toString(16).padStart(64, "0");
  return "0x" + sel + sp + amt;
}

// ── Rank helper ───────────────────────────────────────────────────────────────
function xpToRank(xp: number): string {
  if (xp >= 100_000) return "Diamond";
  if (xp >= 50_000)  return "Platinum";
  if (xp >= 10_000)  return "Gold";
  if (xp >= 2_000)   return "Silver";
  return "Bronze";
}

// ── Register routes ───────────────────────────────────────────────────────────
export function registerMcpRoutes(app: Express): void {

  // CORS – allow any origin so AI agents / external callers can reach the API
  app.use("/api/mcp", (_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin",  "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  app.options("/api/mcp/{*path}", (_req, res) => res.sendStatus(204));

  // ── Plugin manifest ──────────────────────────────────────────────────────────
  app.get("/api/mcp/plugin", (req: Request, res: Response) => {
    const base = baseUrl(req);
    return res.json({
      schema_version: "v1",
      name_for_human: "SuperSwap DEX",
      name_for_model: "superswap_dex",
      description_for_human: "Swap tokens on Base and earn XP + USDC cashback rewards with every trade.",
      description_for_model:
        "SuperSwap is a reward-first DEX on Base network (chainId 8453). " +
        "Use it to get real-time swap quotes and build unsigned swap transactions. " +
        "Every swap earns XP and USDC cashback for the user automatically. " +
        "Protocol fee: 0.30%. Aggregator: 0x Protocol v2. " +
        "Always show quote details and get explicit user approval before building a transaction.",
      auth: { type: "none" },
      api: {
        type: "openapi",
        url: `${base}/api/mcp/openapi.json`,
        is_user_authenticated: false,
      },
      logo_url: `${base}/figmaAssets/token-logo.png`,
      contact_email: "support@superswap.fi",
      legal_info_url: `${base}/docs`,
    });
  });

  // ── OpenAPI spec ─────────────────────────────────────────────────────────────
  app.get("/api/mcp/openapi.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    return res.json(buildOpenApiSpec(baseUrl(req)));
  });

  // ── Markdown spec ─────────────────────────────────────────────────────────────
  app.get("/api/mcp/spec", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    return res.send(buildMarkdownSpec(baseUrl(req)));
  });

  // ── Token list ────────────────────────────────────────────────────────────────
  app.get("/api/mcp/tokens", async (_req: Request, res: Response) => {
    try {
      const dbTokens = await adminStorage.getPopularTokens(true);
      const tokens = dbTokens.length > 0
        ? dbTokens.map((t) => ({
            symbol:   t.symbol,
            name:     t.name,
            address:  t.address,
            decimals: t.decimals,
            icon_url: t.icon_url || `https://dd.dexscreener.com/ds-data/tokens/base/${t.address.toLowerCase()}.png`,
          }))
        : FALLBACK_TOKENS.map((t) => ({
            ...t,
            icon_url: `https://dd.dexscreener.com/ds-data/tokens/base/${t.address.toLowerCase()}.png`,
          }));
      return res.json(tokens);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ── Price quote (no wallet needed) ───────────────────────────────────────────
  app.post("/api/mcp/quote", async (req: Request, res: Response) => {
    const { sellToken, buyToken, sellAmount, slippageBps = 50 } = req.body ?? {};
    if (!sellToken || !buyToken || !sellAmount) {
      return res.status(400).json({ error: "Missing required fields: sellToken, buyToken, sellAmount", code: "MISSING_PARAMS" });
    }

    const cacheKey = `${sellToken}:${buyToken}:${sellAmount}:${slippageBps}`;
    const cached   = quoteCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < QUOTE_TTL) return res.json(cached.data);

    try {
      const params = new URLSearchParams({
        chainId:          String(CHAIN_ID),
        sellToken:        String(sellToken),
        buyToken:         String(buyToken),
        sellAmount:       String(sellAmount),
        slippageBps:      String(slippageBps),
        swapFeeRecipient: FEE_RECIPIENT,
        swapFeeBps:       String(FEE_BPS),
        swapFeeToken:     String(sellToken),
      });

      const { ok, status, data } = await zeroXFetch("/swap/allowance-holder/price", params);
      if (!ok) return res.status(status).json({ error: data?.reason ?? "Quote failed", code: "ZEROX_ERROR", message: data });

      // 0x returns `price` as human-readable "buyToken per 1 sellToken" already
      const price = data.price ?? "0";

      const result = {
        sellToken:    data.sellToken  ?? sellToken,
        buyToken:     data.buyToken   ?? buyToken,
        sellAmount:   data.sellAmount ?? String(sellAmount),
        buyAmount:    data.buyAmount  ?? "0",
        price,
        priceImpact:  data.estimatedPriceImpact ?? "0",
        estimatedGas: data.estimatedGas ?? data.gas ?? "200000",
        sources: (data.route?.fills ?? []).map((f: any) => ({
          name: f.source,
          proportion: f.proportionBps ? String(Number(f.proportionBps) / 10000) : "1",
        })),
        protocolFee: `${FEE_BPS / 100}%`,
        hint: "sellAmount and buyAmount are in smallest units (wei for ETH, 6-decimal units for USDC, etc.)",
      };

      quoteCache.set(cacheKey, { data: result, ts: Date.now() });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: "INTERNAL" });
    }
  });

  // ── Build unsigned swap transaction ───────────────────────────────────────────
  app.post("/api/mcp/build-swap", async (req: Request, res: Response) => {
    const { sellToken, buyToken, sellAmount, takerAddress, slippageBps = 50 } = req.body ?? {};
    if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
      return res.status(400).json({ error: "Missing required fields: sellToken, buyToken, sellAmount, takerAddress", code: "MISSING_PARAMS" });
    }

    try {
      const params = new URLSearchParams({
        chainId:          String(CHAIN_ID),
        sellToken:        String(sellToken),
        buyToken:         String(buyToken),
        sellAmount:       String(sellAmount),
        taker:            String(takerAddress),
        slippageBps:      String(slippageBps),
        swapFeeRecipient: FEE_RECIPIENT,
        swapFeeBps:       String(FEE_BPS),
        swapFeeToken:     String(sellToken),
      });

      const { ok, status, data } = await zeroXFetch("/swap/allowance-holder/quote", params);
      if (!ok) return res.status(status).json({ error: data?.reason ?? "Transaction build failed", code: "ZEROX_ERROR", message: data });

      const tx = data.transaction ?? {};
      const allowanceIssue = data.issues?.allowance;

      // If the token requires an allowance, build the approve transaction too
      let allowanceRequired    = false;
      let allowanceTransaction: any = null;
      let allowanceTarget: string | null = null;

      if (allowanceIssue && sellToken.toLowerCase() !== NATIVE_ETH.toLowerCase()) {
        allowanceRequired = true;
        allowanceTarget   = allowanceIssue.spender ?? tx.to;
        const approveAmount = BigInt(sellAmount) * 10n; // approve 10× for UX
        allowanceTransaction = {
          chainId: CHAIN_ID,
          from:    String(takerAddress),
          to:      String(sellToken),
          data:    buildApproveCalldata(String(allowanceTarget), approveAmount),
          value:   "0",
          gas:     "60000",
        };
      }

      const sellAmt = BigInt(data.sellAmount ?? sellAmount);
      const buyAmt  = BigInt(data.buyAmount  ?? "0");
      const price   = sellAmt > 0n ? (Number(buyAmt) / Number(sellAmt)).toFixed(6) : "0";

      return res.json({
        transaction: {
          chainId: CHAIN_ID,
          from:    String(takerAddress),
          to:      String(tx.to ?? ""),
          data:    String(tx.data ?? "0x"),
          value:   String(tx.value ?? "0"),
          gas:     String(tx.gas ?? data.estimatedGas ?? "200000"),
        },
        allowanceRequired,
        allowanceTransaction,
        allowanceTarget,
        quote: {
          sellAmount:   data.sellAmount ?? String(sellAmount),
          buyAmount:    data.buyAmount  ?? "0",
          price,
          priceImpact:  data.estimatedPriceImpact ?? "0",
          estimatedGas: tx.gas ?? data.estimatedGas ?? "200000",
          protocolFee:  `${FEE_BPS / 100}%`,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message, code: "INTERNAL" });
    }
  });

  // ── User reward stats ─────────────────────────────────────────────────────────
  app.get("/api/mcp/user/:address", async (req: Request, res: Response) => {
    const { address } = req.params;
    if (!address || !/^0x[0-9a-fA-F]{40}$/i.test(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address", code: "INVALID_ADDRESS" });
    }
    try {
      const user = await rewardsStorage.upsertUser(address);
      const xp   = (user as any).xp ?? (user as any).total_xp ?? 0;
      return res.json({
        address:        address.toLowerCase(),
        xp,
        rank:           xpToRank(xp),
        swapCount:      (user as any).swap_count ?? (user as any).swapCount ?? 0,
        cashbackEarned: Number(((user as any).cashback_earned ?? (user as any).cashbackEarned ?? 0).toFixed(4)),
        cashbackToken:  "USDC",
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
