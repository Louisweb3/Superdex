import type { Express } from "express";
import { createServer, type Server } from "http";
import { rewardsStorage } from "./storage";

const ZEROX_API_KEY = process.env.ZEROX_API_KEY || "";
const ZEROX_BASE_URL = "https://api.0x.org";
const CHAIN_ID = 8453;
const FEE_RECIPIENT = "0x07808cD830c5D599dF3CC95a9Cf43EBada5B373a";
const FEE_BPS = 30;

// Simple in-memory price cache
let priceCache: { data: any; ts: number } | null = null;
const PRICE_TTL = 30_000;

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ─── 0x Swap proxy ──────────────────────────────────────────────────────────
  app.get("/api/swap/price", async (req, res) => {
    try {
      const { sellToken, buyToken, sellAmount, slippageBps, includedSources, excludedSources } = req.query;
      if (!sellToken || !buyToken || !sellAmount)
        return res.status(400).json({ error: "Missing required parameters" });

      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        sellToken: String(sellToken),
        buyToken: String(buyToken),
        sellAmount: String(sellAmount),
        swapFeeRecipient: FEE_RECIPIENT,
        swapFeeBps: String(FEE_BPS),
        swapFeeToken: String(sellToken),
      });
      if (slippageBps) params.set("slippageBps", String(slippageBps));
      if (includedSources) params.set("includedSources", String(includedSources));
      if (excludedSources) params.set("excludedSources", String(excludedSources));

      const response = await fetch(`${ZEROX_BASE_URL}/swap/allowance-holder/price?${params}`, {
        headers: { "0x-api-key": ZEROX_API_KEY, "0x-version": "v2", "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);
      return res.json(data);
    } catch (err: any) {
      console.error("0x price error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/swap/quote", async (req, res) => {
    try {
      const { sellToken, buyToken, sellAmount, taker, slippageBps, includedSources, excludedSources } = req.query;
      if (!sellToken || !buyToken || !sellAmount || !taker)
        return res.status(400).json({ error: "Missing required parameters" });

      const params = new URLSearchParams({
        chainId: String(CHAIN_ID),
        sellToken: String(sellToken),
        buyToken: String(buyToken),
        sellAmount: String(sellAmount),
        taker: String(taker),
        swapFeeRecipient: FEE_RECIPIENT,
        swapFeeBps: String(FEE_BPS),
        swapFeeToken: String(sellToken),
      });
      if (slippageBps) params.set("slippageBps", String(slippageBps));
      if (includedSources) params.set("includedSources", String(includedSources));
      if (excludedSources) params.set("excludedSources", String(excludedSources));

      const response = await fetch(`${ZEROX_BASE_URL}/swap/allowance-holder/quote?${params}`, {
        headers: { "0x-api-key": ZEROX_API_KEY, "0x-version": "v2", "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);
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
        // Fallback static prices
        prices = [
          { symbol: "ETH",   price: 0, change24h: 0, iconSrc: "/figmaAssets/image-7.png" },
          { symbol: "cbBTC", price: 0, change24h: 0, iconSrc: "/figmaAssets/image-6.png" },
          { symbol: "USDC",  price: 1, change24h: 0, iconSrc: "/figmaAssets/image-5.png" },
        ];
      }

      priceCache = { data: prices, ts: Date.now() };
      return res.json(prices);
    } catch (err: any) {
      console.error("Market prices error:", err);
      // Return fallback on error
      return res.json([
        { symbol: "ETH",   price: 0, change24h: 0, iconSrc: "/figmaAssets/image-7.png" },
        { symbol: "cbBTC", price: 0, change24h: 0, iconSrc: "/figmaAssets/image-6.png" },
        { symbol: "USDC",  price: 1, change24h: 0, iconSrc: "/figmaAssets/image-5.png" },
      ]);
    }
  });

  // ─── Rewards API ────────────────────────────────────────────────────────────

  // Get or init user rewards profile
  app.get("/api/rewards/user/:wallet", (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const user = rewardsStorage.upsertUser(wallet);
    return res.json(user);
  });

  // Record a completed swap → award XP + cashback
  app.post("/api/rewards/swap", (req, res) => {
    const { wallet, txHash, sellSymbol, buySymbol, volumeUsd } = req.body;
    if (!wallet || !txHash || !sellSymbol || !buySymbol || volumeUsd == null) {
      return res.status(400).json({ error: "Missing fields: wallet, txHash, sellSymbol, buySymbol, volumeUsd" });
    }
    const result = rewardsStorage.recordSwap(wallet, txHash, sellSymbol, buySymbol, Number(volumeUsd));
    return res.json(result);
  });

  // Get daily quests
  app.get("/api/rewards/quests/:wallet", (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    return res.json(rewardsStorage.getDailyQuests(wallet));
  });

  // Claim a completed quest
  app.post("/api/rewards/quests/:wallet/claim", (req, res) => {
    const { wallet } = req.params;
    const { questType } = req.body;
    if (!wallet || !questType) return res.status(400).json({ error: "Missing wallet or questType" });
    const result = rewardsStorage.claimQuest(wallet, questType);
    if (!result) return res.status(400).json({ error: "Quest not claimable" });
    return res.json(result);
  });

  // Reward history for wallet
  app.get("/api/rewards/history/:wallet", (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    return res.json(rewardsStorage.getSwapHistory(wallet, 20));
  });

  // Leaderboard
  app.get("/api/rewards/leaderboard", (_req, res) => {
    return res.json(rewardsStorage.getLeaderboard(10));
  });

  // Global stats (for home page)
  app.get("/api/rewards/stats", (_req, res) => {
    return res.json(rewardsStorage.getTotalStats());
  });

  return httpServer;
}
