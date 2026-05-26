import type { Express } from "express";
import { createServer, type Server } from "http";
import { rewardsStorage, earnStorage } from "./storage";
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

  // ─── Rewards API ─────────────────────────────────────────────────────────────
  app.get("/api/rewards/user/:wallet", async (req, res) => {
    try {
      const user = await rewardsStorage.getUser(String(req.params.wallet));
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json(user);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/rewards/quests/:wallet", async (req, res) => {
    try {
      const quests = await rewardsStorage.getDailyQuests(String(req.params.wallet));
      return res.json(quests);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/rewards/quests/:wallet/claim", async (req, res) => {
    try {
      const result = await rewardsStorage.claimQuest(String(req.params.wallet), req.body.questType);
      if (!result) return res.status(400).json({ error: "Cannot claim quest" });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/rewards/history/:wallet", async (req, res) => {
    try {
      const history = await rewardsStorage.getSwapHistory(String(req.params.wallet));
      return res.json(history);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/rewards/leaderboard", async (_req, res) => {
    try {
      const board = await rewardsStorage.getLeaderboard();
      return res.json(board);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/rewards/stats", async (_req, res) => {
    try {
      const stats = await rewardsStorage.getTotalStats();
      return res.json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/rewards/cashback/claim", async (req, res) => {
    try {
      const { wallet } = req.body;
      if (!wallet) return res.status(400).json({ error: "Missing wallet" });
      const result = await rewardsStorage.claimCashback(wallet);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/rewards/swap", async (req, res) => {
    try {
      const { wallet, txHash, sellSymbol, buySymbol, volumeUsd } = req.body;
      if (!wallet || !txHash || !sellSymbol || !buySymbol || volumeUsd === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let verified = false;
      try {
        verified = await verifyTransaction(txHash, wallet);
      } catch {
        verified = false;
      }
      const result = await rewardsStorage.recordSwap(wallet, txHash, sellSymbol, buySymbol, volumeUsd, { verified });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Earn API ─────────────────────────────────────────────────────────────
  app.get("/api/earn/tasks/:wallet", async (req, res) => {
    try {
      const tasks = await earnStorage.getTasksForUser(String(req.params.wallet));
      return res.json(tasks);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/earn/tasks/:wallet/complete", async (req, res) => {
    try {
      const { taskId } = req.body;
      if (!taskId) return res.status(400).json({ error: "Missing taskId" });
      const result = await earnStorage.completeTask(String(req.params.wallet), taskId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}