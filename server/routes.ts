import type { Express } from "express";
import { createServer, type Server } from "http";
import { rewardsStorage } from "./storage";
import { verifyTransaction } from "./basescan";

const ZEROX_API_KEY = process.env.ZEROX_API_KEY || "";
const ZEROX_BASE_URL = "https://api.0x.org";
const CHAIN_ID = 8453;

// ─── NEW FEE LOGIC ─────────────────────────────────────────────

// Platform wallet receives 0.15%
const FEE_RECIPIENT = "0xea8d70f2e7e577160b1c5a2c6e33bfd8ad6dde5e";

// 15 BPS = 0.15%
const PLATFORM_FEE_BPS = 15;
const USER_CASHBACK_BPS = 15;

// ───────────────────────────────────────────────────────────────

// Simple in-memory price cache
let priceCache: { data: any; ts: number } | null = null;
const PRICE_TTL = 30_000;

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ─── 0x Swap proxy ──────────────────────────────────────────────────────────
  app.get("/api/swap/price", async (req, res) => {
    try {
      const {
        sellToken,
        buyToken,
        sellAmount,
        taker,
        slippageBps,
        includedSources,
        excludedSources
      } = req.query;

      if (!sellToken || !buyToken || !sellAmount || !taker)
        return res.status(400).json({ error: "Missing required parameters" });

      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        sellToken: String(sellToken),
        buyToken: String(buyToken),
        sellAmount: String(sellAmount),

        // 0.15% to platform
        // 0.15% cashback to swapper
        swapFeeRecipient: `${FEE_RECIPIENT},${taker}`,

        // total = 0.30%
        swapFeeBps: `${PLATFORM_FEE_BPS},${USER_CASHBACK_BPS}`,

        // fee token
        swapFeeToken: `${sellToken},${sellToken}`,
      });

      if (slippageBps)
        params.set("slippageBps", String(slippageBps));

      if (includedSources)
        params.set("includedSources", String(includedSources));

      if (excludedSources)
        params.set("excludedSources", String(excludedSources));

      const response = await fetch(
        `${ZEROX_BASE_URL}/swap/allowance-holder/price?${params}`,
        {
          headers: {
            "0x-api-key": ZEROX_API_KEY,
            "0x-version": "v2",
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok)
        return res.status(response.status).json(data);

      return res.json(data);

    } catch (err: any) {
      console.error("0x price error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/swap/quote", async (req, res) => {
    try {
      const {
        sellToken,
        buyToken,
        sellAmount,
        taker,
        slippageBps,
        includedSources,
        excludedSources
      } = req.query;

      if (!sellToken || !buyToken || !sellAmount || !taker)
        return res.status(400).json({ error: "Missing required parameters" });

      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        sellToken: String(sellToken),
        buyToken: String(buyToken),
        sellAmount: String(sellAmount),
        taker: String(taker),

        // 0.15% to platform
        // 0.15% cashback to swapper
        swapFeeRecipient: `${FEE_RECIPIENT},${taker}`,

        // total = 0.30%
        swapFeeBps: `${PLATFORM_FEE_BPS},${USER_CASHBACK_BPS}`,

        // fee token
        swapFeeToken: `${sellToken},${sellToken}`,
      });

      if (slippageBps)
        params.set("slippageBps", String(slippageBps));

      if (includedSources)
        params.set("includedSources", String(includedSources));

      if (excludedSources)
        params.set("excludedSources", String(excludedSources));

      const response = await fetch(
        `${ZEROX_BASE_URL}/swap/allowance-holder/quote?${params}`,
        {
          headers: {
            "0x-api-key": ZEROX_API_KEY,
            "0x-version": "v2",
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok)
        return res.status(response.status).json(data);

      return res.json(data);

    } catch (err: any) {
      console.error("0x quote error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Market prices (CoinGecko) ──────────────────────────────────────────────
  app.get("/api/market/prices", async (_req, res) => {
    try {
      if (priceCache && Date.now() - priceCache.ts < PRICE_TTL) {
        return res.json(priceCache.data);
      }

      const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,coinbase-wrapped-btc&vs_currencies=usd&include_24hr_change=true";
      const resp = await fetch(url, { headers: { Accept: "application/json" } });

      let prices: any[] = [];

      if (resp.ok) {
        const d = await resp.json();

        prices = [
          {
            symbol: "ETH",
            price: d.ethereum?.usd ?? 0,
            change24h: d.ethereum?.usd_24h_change ?? 0,
            iconSrc: "/figmaAssets/image-7.png",
          },
          {
            symbol: "cbBTC",
            price: d["coinbase-wrapped-btc"]?.usd ?? 0,
            change24h: d["coinbase-wrapped-btc"]?.usd_24h_change ?? 0,
            iconSrc: "/figmaAssets/image-6.png",
          },
          {
            symbol: "USDC",
            price: d["usd-coin"]?.usd ?? 1,
            change24h: d["usd-coin"]?.usd_24h_change ?? 0,
            iconSrc: "/figmaAssets/image-5.png",
          },
        ];
      } else {
        prices = [
          { symbol: "ETH", price: 0, change24h: 0, iconSrc: "/figmaAssets/image-7.png" },
          { symbol: "cbBTC", price: 0, change24h: 0, iconSrc: "/figmaAssets/image-6.png" },
          { symbol: "USDC", price: 1, change24h: 0, iconSrc: "/figmaAssets/image-5.png" },
        ];
      }

      priceCache = { data: prices, ts: Date.now() };

      return res.json(prices);

    } catch (err: any) {
      console.error("Market prices error:", err);

      return res.json([
        { symbol: "ETH", price: 0, change24h: 0, iconSrc: "/figmaAssets/image-7.png" },
        { symbol: "cbBTC", price: 0, change24h: 0, iconSrc: "/figmaAssets/image-6.png" },
        { symbol: "USDC", price: 1, change24h: 0, iconSrc: "/figmaAssets/image-5.png" },
      ]);
    }
  });

  return httpServer;
}