import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Shared types (mirrors server/storage.ts) ──────────────────────────────
export interface RewardUser {
  wallet_address: string;
  xp: number;
  weekly_xp: number;
  cashback_usd: number;           // lifetime claimed
  weekly_cashback_usd: number;  // earned this week (unclaimed until week ends)
  pending_cashback_usd: number; // past-week pending (ready to claim)
  total_swaps: number;
  streak: number;
  last_activity_date: string;
  last_weekly_reset?: string;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  total_volume_usd: number;
  level: number;
  created_at: number;
}

export interface DailyQuest {
  id: string;
  wallet_address: string;
  date: string;
  quest_type: "swaps" | "volume" | "login";
  target: number;
  progress: number;
  completed: boolean;
  xp_reward: number;
  claimed: boolean;
}

export interface SwapEvent {
  id: string;
  wallet_address: string;
  tx_hash: string;
  sell_symbol: string;
  buy_symbol: string;
  volume_usd: number;
  xp_earned: number;
  cashback_usd: number;
  timestamp: number;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function json(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── User rewards profile ─────────────────────────────────────────────────────
export function useRewardUser(wallet: string | null) {
  return useQuery<RewardUser>({
    queryKey: ["/api/rewards/user", wallet],
    queryFn: () => json(`/api/rewards/user/${wallet}`),
    enabled: !!wallet,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

// ─── Daily quests ─────────────────────────────────────────────────────────────
export function useDailyQuests(wallet: string | null) {
  return useQuery<DailyQuest[]>({
    queryKey: ["/api/rewards/quests", wallet],
    queryFn: () => json(`/api/rewards/quests/${wallet}`),
    enabled: !!wallet,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

// ─── Reward history ────────────────────────────────────────────────────────────
export function useRewardHistory(wallet: string | null) {
  return useQuery<SwapEvent[]>({
    queryKey: ["/api/rewards/history", wallet],
    queryFn: () => json(`/api/rewards/history/${wallet}`),
    enabled: !!wallet,
    refetchInterval: 15_000,
  });
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────
export function useLeaderboard() {
  return useQuery<RewardUser[]>({
    queryKey: ["/api/rewards/leaderboard"],
    queryFn: () => json("/api/rewards/leaderboard"),
    refetchInterval: 30_000,
  });
}

// ─── Market prices ──────────────────────────────────────────────────────────────
export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  iconSrc: string;
}

export function useMarketPrices() {
  return useQuery<MarketPrice[]>({
    queryKey: ["/api/market/prices"],
    queryFn: () => json("/api/market/prices"),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// ─── Claim quest ────────────────────────────────────────────────────────────────
export function useClaimQuest(wallet: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questType: string) =>
      fetch(`/api/rewards/quests/${wallet}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questType }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/rewards/user", wallet] });
      qc.invalidateQueries({ queryKey: ["/api/rewards/quests", wallet] });
    },
  });
}

// ─── Claim cashback (moves pending → lifetime) ─────────────────────────────────────────────
export function useClaimCashback(wallet: string | null) {
  const qc = useQueryClient();
  return useMutation<{ claimed: number; user: RewardUser }, Error>({
    mutationFn: async () => {
      const r = await fetch("/api/rewards/cashback/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/rewards/user", wallet] });
      qc.invalidateQueries({ queryKey: ["/api/rewards/stats"] });
    },
  });
}

// ─── Register swap event ────────────────────────────────────────────────────────
export async function recordSwapReward(
  wallet: string,
  txHash: string,
  sellSymbol: string,
  buySymbol: string,
  volumeUsd: number
) {
  const r = await fetch("/api/rewards/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, txHash, sellSymbol, buySymbol, volumeUsd }),
  });
  return r.json();
}

// ─── Earn Tasks ──────────────────────────────────────────────────────────────
export interface EarnTaskItem {
  id: string;
  title: string;
  description: string;
  category: "onchain" | "offchain";
  task_type: string;
  xp_reward: number;
  cashback_reward: string;
  action_url: string;
  action_label: string;
  active: boolean;
  sort_order: number;
  completed: boolean;
  completed_at?: string;
}

export function useEarnTasks(wallet: string | null) {
  return useQuery<EarnTaskItem[]>({
    queryKey: ["/api/earn/tasks", wallet],
    queryFn: () => json(`/api/earn/tasks/${wallet}`),
    enabled: !!wallet,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useCompleteEarnTask(wallet: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const r = await fetch(`/api/earn/tasks/${wallet}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/earn/tasks", wallet] });
      qc.invalidateQueries({ queryKey: ["/api/rewards/user", wallet] });
    },
  });
}

// ─── Tier helpers ──────────────────────────────────────────────────────────────
export const TIER_THRESHOLDS = {
  Bronze:  { min: 0,    max: 499,  color: "#cd7f32", next: "Silver"  },
  Silver:  { min: 500,  max: 1999, color: "#9aa0ad", next: "Gold"    },
  Gold:    { min: 2000, max: 4999, color: "#f5c518", next: "Diamond" },
  Diamond: { min: 5000, max: Infinity, color: "#7df9ff", next: null  },
};

export function tierProgress(xp: number): { pct: number; xpToNext: number; nextTier: string | null; color: string } {
  const t = TIER_THRESHOLDS;
  if (xp >= 5000) return { pct: 100, xpToNext: 0, nextTier: null, color: t.Diamond.color };
  if (xp >= 2000) return { pct: ((xp - 2000) / 3000) * 100, xpToNext: 5000 - xp, nextTier: "Diamond", color: t.Gold.color };
  if (xp >= 500)  return { pct: ((xp - 500)  / 1500) * 100, xpToNext: 2000 - xp, nextTier: "Gold",    color: t.Silver.color };
  return { pct: (xp / 500) * 100, xpToNext: 500 - xp, nextTier: "Silver", color: t.Bronze.color };
}
