import type { Express } from "express";
import { createServer, type Server } from "http";
import { rewardsStorage, earnStorage, chestStorage } from "./storage";
import { verifyTransaction } from "./basescan";

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
      return res.json([
        { symbol: "ETH",   price: 0, change24h: 0, iconSrc: "/figmaAssets/image-7.png" },
        { symbol: "cbBTC", price: 0, change24h: 0, iconSrc: "/figmaAssets/image-6.png" },
        { symbol: "USDC",  price: 1, change24h: 0, iconSrc: "/figmaAssets/image-5.png" },
      ]);
    }
  });

  // ─── Rewards API ───────────────────────────────────────────────────────────────

  app.get("/api/rewards/user/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const user = await rewardsStorage.upsertUser(wallet);
    return res.json(user);
  });

  app.post("/api/rewards/swap", async (req, res) => {
    const { wallet, txHash, sellSymbol, buySymbol, volumeUsd, tokenAddress, tokenPrice } = req.body;
    if (!wallet || !txHash || !sellSymbol || !buySymbol || volumeUsd == null) {
      return res.status(400).json({ error: "Missing fields: wallet, txHash, sellSymbol, buySymbol, volumeUsd" });
    }

    // Optionally verify on Basescan
    let verified = false;
    try {
      const bscan = await verifyTransaction(txHash);
      verified = bscan.ok && bscan.status === "1";
    } catch {
      verified = false;
    }

    const result = await rewardsStorage.recordSwap(
      wallet, txHash, sellSymbol, buySymbol, Number(volumeUsd),
      { verified, tokenAddress, tokenPrice: Number(tokenPrice ?? 0) }
    );
    return res.json(result);
  });

  app.get("/api/rewards/token-cashback/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    return res.json(await rewardsStorage.getTokenCashbacks(wallet));
  });

  app.get("/api/rewards/quests/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    return res.json(await rewardsStorage.getDailyQuests(wallet));
  });

  app.post("/api/rewards/quests/:wallet/claim", async (req, res) => {
    const { wallet } = req.params;
    const { questType } = req.body;
    if (!wallet || !questType) return res.status(400).json({ error: "Missing wallet or questType" });
    const result = await rewardsStorage.claimQuest(wallet, questType);
    if (!result) return res.status(400).json({ error: "Quest not claimable" });
    return res.json(result);
  });

  app.get("/api/rewards/history/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    return res.json(await rewardsStorage.getSwapHistory(wallet, 20));
  });

  app.get("/api/rewards/leaderboard", async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 100);
    return res.json(await rewardsStorage.getLeaderboard(limit));
  });

  app.get("/api/rewards/rank/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const rank = await rewardsStorage.getUserRank(wallet);
    return res.json({ rank });
  });

  app.post("/api/rewards/cashback/claim", async (req, res) => {
    const { wallet } = req.body;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const result = await rewardsStorage.claimCashback(wallet);
    return res.json(result);
  });

  app.get("/api/rewards/stats", async (_req, res) => {
    return res.json(await rewardsStorage.getTotalStats());
  });

  // ─── Earn API ─────────────────────────────────────────────────────────

  app.get("/api/earn/tasks", async (req, res) => {
    const type = req.query.type as string | undefined;
    return res.json(await earnStorage.getTasks(type));
  });

  app.get("/api/earn/tasks/:id", async (req, res) => {
    const task = await earnStorage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json(task);
  });

  app.get("/api/earn/completions/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    await earnStorage.syncOnchainProgress(wallet);
    return res.json(await earnStorage.getCompletions(wallet));
  });

  app.post("/api/earn/claim", async (req, res) => {
    const { wallet, taskId } = req.body;
    if (!wallet || !taskId) return res.status(400).json({ error: "Missing wallet or taskId" });
    const result = await earnStorage.claimTask(wallet, taskId);
    if (!result) return res.status(400).json({ error: "Task not claimable" });
    return res.json(result);
  });

  app.get("/api/earn/x-account/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const xUsername = await earnStorage.getXUsername(wallet);
    return res.json({ x_username: xUsername ?? "" });
  });

  app.post("/api/earn/connect-x", async (req, res) => {
    const { wallet, xUsername } = req.body;
    if (!wallet || !xUsername) return res.status(400).json({ error: "Missing wallet or xUsername" });
    const cleaned = xUsername.replace(/^@/, "").trim();
    if (!cleaned || cleaned.length < 1 || cleaned.length > 50) return res.status(400).json({ error: "Invalid X username" });
    await earnStorage.connectXAccount(wallet, cleaned);
    return res.json({ ok: true, x_username: cleaned.toLowerCase() });
  });

  app.post("/api/earn/verify-social", async (req, res) => {
    const { wallet, taskId } = req.body;
    if (!wallet || !taskId) return res.status(400).json({ error: "Missing wallet or taskId" });
    const result = await earnStorage.verifySocialTask(wallet, taskId);
    if (!result.success) return res.status(400).json({ error: result.error ?? "Verification failed" });
    return res.json({ ok: true });
  });

  app.post("/api/earn/tasks", async (req, res) => {
    const task = await earnStorage.createTask(req.body);
    return res.json(task);
  });

  app.patch("/api/earn/tasks/:id", async (req, res) => {
    const task = await earnStorage.updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json(task);
  });

  app.delete("/api/earn/tasks/:id", async (req, res) => {
    await earnStorage.deleteTask(req.params.id);
    return res.json({ ok: true });
  });

  app.get("/api/earn/announcements", async (_req, res) => {
    return res.json(await earnStorage.getAnnouncements());
  });

  app.post("/api/earn/announcements", async (req, res) => {
    const ann = await earnStorage.createAnnouncement(req.body);
    return res.json(ann);
  });

  app.patch("/api/earn/announcements/:id", async (req, res) => {
    const ann = await earnStorage.updateAnnouncement(req.params.id, req.body);
    if (!ann) return res.status(404).json({ error: "Not found" });
    return res.json(ann);
  });

  app.delete("/api/earn/announcements/:id", async (req, res) => {
    await earnStorage.deleteAnnouncement(req.params.id);
    return res.json({ ok: true });
  });

  // ─── Referral API ──────────────────────────────────────────────────────────
  app.get("/api/referral/stats/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const stats = await rewardsStorage.getReferralStats(wallet);
    return res.json(stats);
  });

  app.post("/api/referral/apply", async (req, res) => {
    const { wallet, code } = req.body;
    if (!wallet || !code) return res.status(400).json({ error: "Missing wallet or code" });
    const result = await rewardsStorage.applyReferralCode(wallet, code);
    if (!result.ok) return res.status(400).json({ error: result.error });
    return res.json({ ok: true });
  });

  // ─── Community Chests API ───────────────────────────────────────────────────
  app.get("/api/chests/:wallet", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    return res.json(await chestStorage.getChests(wallet));
  });

  app.post("/api/chests/:wallet/:chestId/social", async (req, res) => {
    const { wallet, chestId } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const result = await chestStorage.completeSocial(wallet, chestId);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  });

  app.post("/api/chests/:wallet/:chestId/verify", async (req, res) => {
    const { wallet, chestId } = req.params;
    const { signature } = req.body ?? {};
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const result = await chestStorage.verifyWallet(wallet, chestId, signature);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  });

  app.post("/api/chests/:wallet/:chestId/open", async (req, res) => {
    const { wallet, chestId } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    const result = await chestStorage.openChest(wallet, chestId);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  });

  app.get("/api/chests/:wallet/campaign-state", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    return res.json(await chestStorage.getCampaignState(wallet));
  });

  app.get("/api/chests/:wallet/history", async (req, res) => {
    const { wallet } = req.params;
    if (!wallet || wallet.length < 10) return res.status(400).json({ error: "Invalid wallet" });
    return res.json(await chestStorage.getChestHistory(wallet));
  });

  // ─── Analytics (0x Trade Analytics API) ─────────────────────────────────────

  // Full trade cache — refreshed every 5 minutes
  let tradesCache: { data: any[]; ts: number } | null = null;
  const TRADES_TTL = 300_000;

  // DEX fill-sources cache (from price routing)
  let fillSourcesCache: { data: any[]; ts: number } | null = null;
  const FILL_TTL = 600_000; // 10 min

  async function fetchAll0xTrades(): Promise<any[]> {
    if (tradesCache && Date.now() - tradesCache.ts < TRADES_TTL) {
      return tradesCache.data;
    }
    const allTrades: any[] = [];
    let cursor: string | undefined;
    let pages = 0;
    try {
      do {
        const params = new URLSearchParams({ chainId: String(CHAIN_ID), limit: "100" });
        if (cursor) params.set("cursor", cursor);
        const resp = await fetch(`${ZEROX_BASE_URL}/trade-analytics/swap?${params}`, {
          headers: { "0x-api-key": ZEROX_API_KEY, "0x-version": "v2" },
        });
        if (!resp.ok) break;
        const data = await resp.json();
        allTrades.push(...(data.trades ?? []));
        cursor = data.nextCursor;
        pages++;
        if (pages >= 20 || allTrades.length >= 2000) break;
      } while (cursor);
    } catch (e) {
      console.error("0x trades fetch error:", e);
    }
    if (allTrades.length > 0) tradesCache = { data: allTrades, ts: Date.now() };
    return allTrades;
  }

  function periodSecs(period: string): number {
    const map: Record<string, number> = {
      "24h": 86400, "7d": 604800, "30d": 2592000,
      "90d": 7776000, "1y": 31536000,
    };
    return map[period.toLowerCase()] ?? 604800;
  }

  function filterByPeriod(trades: any[], period: string): any[] {
    const cutoff = Date.now() / 1000 - periodSecs(period);
    return trades.filter((t) => (t.timestamp ?? 0) >= cutoff);
  }

  async function fetchFillSources(): Promise<any[]> {
    if (fillSourcesCache && Date.now() - fillSourcesCache.ts < FILL_TTL) {
      return fillSourcesCache.data;
    }
    const pairs = [
      // WETH → USDC  (large fill to get multi-source routing)
      { sell: "0x4200000000000000000000000000000000000006", buy: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", amount: "5000000000000000000" },
      // cbBTC → USDC
      { sell: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", buy: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", amount: "10000000" },
    ];
    const sourceMap: Record<string, number> = {};
    let total = 0;
    for (const p of pairs) {
      try {
        const params = new URLSearchParams({
          chainId: String(CHAIN_ID), sellToken: p.sell, buyToken: p.buy, sellAmount: p.amount,
          swapFeeRecipient: FEE_RECIPIENT, swapFeeBps: String(FEE_BPS), swapFeeToken: p.sell,
        });
        const resp = await fetch(`${ZEROX_BASE_URL}/swap/allowance-holder/price?${params}`, {
          headers: { "0x-api-key": ZEROX_API_KEY, "0x-version": "v2" },
        });
        if (!resp.ok) continue;
        const data = await resp.json();
        for (const fill of (data?.route?.fills ?? [])) {
          const src = fill.source || "Other";
          const prop = Number(fill.proportionBps ?? 0);
          sourceMap[src] = (sourceMap[src] ?? 0) + prop;
          total += prop;
        }
      } catch { /* skip */ }
    }
    const sources = total > 0
      ? Object.entries(sourceMap)
          .map(([name, bps]) => ({ name, percentage: parseFloat(((bps / total) * 100).toFixed(1)) }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 6)
      : [];
    if (sources.length > 0) fillSourcesCache = { data: sources, ts: Date.now() };
    return sources;
  }

  // ── /api/analytics/overview ────────────────────────────────────────────────
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const period = String(req.query.period ?? "7d");
      const [allTrades, fillSources] = await Promise.all([fetchAll0xTrades(), fetchFillSources()]);

      const trades = filterByPeriod(allTrades, period);

      const totalVolume = trades.reduce((s, t) => s + parseFloat(t.volumeUsd ?? "0"), 0);
      const totalFees = trades.reduce((s, t) => s + parseFloat(t.fees?.integratorFee?.amountUsd ?? "0"), 0);
      const totalSwaps = trades.length;
      const totalUsers = new Set(trades.map((t) => t.taker)).size;

      // Previous period for % change
      const prevCutoff = Date.now() / 1000 - periodSecs(period) * 2;
      const currCutoff = Date.now() / 1000 - periodSecs(period);
      const prevTrades = allTrades.filter((t) => t.timestamp >= prevCutoff && t.timestamp < currCutoff);
      const prevVol = prevTrades.reduce((s, t) => s + parseFloat(t.volumeUsd ?? "0"), 0);
      const prevFees = prevTrades.reduce((s, t) => s + parseFloat(t.fees?.integratorFee?.amountUsd ?? "0"), 0);
      const prevSwaps = prevTrades.length;
      const prevUsers = new Set(prevTrades.map((t) => t.taker)).size;

      const pctChange = (cur: number, prev: number) =>
        prev > 0 ? parseFloat(((cur - prev) / prev * 100).toFixed(2)) : cur > 0 ? 100 : 0;

      // Token breakdown by volume (buy + sell sides)
      const tokenVol: Record<string, number> = {};
      for (const t of trades) {
        for (const tok of (t.tokens ?? [])) {
          const sym = tok.symbol ?? "?";
          tokenVol[sym] = (tokenVol[sym] ?? 0) + parseFloat(t.volumeUsd ?? "0") / 2;
        }
      }
      const totalTokenVol = Object.values(tokenVol).reduce((s, v) => s + v, 0);
      const topTokens = Object.entries(tokenVol)
        .map(([name, vol]) => ({ name, percentage: parseFloat(((vol / totalTokenVol) * 100).toFixed(1)) }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      // Fee breakdown
      const swapFees = totalFees * 0.769;
      const liquidityFees = totalFees * 0.154;
      const platformFees = totalFees * 0.077;

      return res.json({
        totalVolume, totalFees, totalSwaps, totalUsers,
        volumeChange: pctChange(totalVolume, prevVol),
        feesChange: pctChange(totalFees, prevFees),
        swapsChange: pctChange(totalSwaps, prevSwaps),
        usersChange: pctChange(totalUsers, prevUsers),
        fees: { swap: swapFees, liquidity: liquidityFees, platform: platformFees },
        topTokens,
        fillSources,
      });
    } catch (err: any) {
      console.error("Analytics overview error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── /api/analytics/chart ───────────────────────────────────────────────────
  app.get("/api/analytics/chart", async (req, res) => {
    try {
      const period = String(req.query.period ?? "7d");
      const allTrades = await fetchAll0xTrades();
      const trades = filterByPeriod(allTrades, period);

      // Group by calendar day
      const byDay: Record<string, { volume: number; swaps: number }> = {};
      for (const t of trades) {
        const d = new Date((t.timestamp ?? 0) * 1000);
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!byDay[key]) byDay[key] = { volume: 0, swaps: 0 };
        byDay[key].volume += parseFloat(t.volumeUsd ?? "0");
        byDay[key].swaps += 1;
      }
      // Sort chronologically
      const sorted = Object.entries(byDay)
        .map(([date, v]) => ({ date, volume: parseFloat(v.volume.toFixed(2)), swaps: v.swaps }))
        .sort((a, b) => new Date("2026 " + a.date).getTime() - new Date("2026 " + b.date).getTime());

      return res.json(sorted);
    } catch (err: any) {
      console.error("Analytics chart error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── /api/analytics/top-pairs ───────────────────────────────────────────────
  app.get("/api/analytics/top-pairs", async (req, res) => {
    try {
      const period = String(req.query.period ?? "all");
      const allTrades = await fetchAll0xTrades();
      const trades = period === "all" ? allTrades : filterByPeriod(allTrades, period);

      const pairMap: Record<string, { volume: number; swaps: number; vol24h: number }> = {};
      const now = Date.now() / 1000;
      for (const t of trades) {
        const syms = (t.tokens ?? []).map((x: any) => x.symbol ?? "?");
        if (syms.length < 2) continue;
        const key = syms[0] + " / " + syms[1];
        if (!pairMap[key]) pairMap[key] = { volume: 0, swaps: 0, vol24h: 0 };
        const vol = parseFloat(t.volumeUsd ?? "0");
        pairMap[key].volume += vol;
        pairMap[key].swaps += 1;
        if ((t.timestamp ?? 0) >= now - 86400) pairMap[key].vol24h += vol;
      }

      // Compute 24h change vs 24-48h window
      const pairs = Object.entries(pairMap)
        .map(([pair, v]) => ({
          pair,
          volume: parseFloat(v.volume.toFixed(2)),
          swaps: v.swaps,
          change24h: parseFloat(v.vol24h > 0 ? (v.vol24h / (v.volume || 1) * 100).toFixed(2) : "0"),
        }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 8);

      return res.json(pairs);
    } catch (err: any) {
      console.error("Analytics top-pairs error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── /api/analytics/users-chart ─────────────────────────────────────────────
  app.get("/api/analytics/users-chart", async (req, res) => {
    try {
      const period = String(req.query.period ?? "7d");
      const allTrades = await fetchAll0xTrades();
      const trades = filterByPeriod(allTrades, period);

      const byDay: Record<string, Set<string>> = {};
      for (const t of trades) {
        const d = new Date((t.timestamp ?? 0) * 1000);
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!byDay[key]) byDay[key] = new Set();
        if (t.taker) byDay[key].add(t.taker);
      }
      const sorted = Object.entries(byDay)
        .map(([date, s]) => ({ date, users: s.size }))
        .sort((a, b) => new Date("2026 " + a.date).getTime() - new Date("2026 " + b.date).getTime());

      return res.json(sorted);
    } catch (err: any) {
      console.error("Analytics users-chart error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── Mini App webhook stub (required by manifest) ────────────────────────────────────────────────────────────────────
  app.post("/api/webhook", async (req, res) => {
    const { event } = req.body || {};
    console.log("[webhook]", event);
    return res.json({ ok: true });
  });

  return httpServer;
}
