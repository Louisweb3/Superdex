import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface ChestState {
  id: string;
  name: string;
  rarity: string;
  minXp: number;
  maxXp: number;
  requiredXp: number;
  color: string;
  glow: string;
  tagline: string;
  shareText: string;
  unlocked: boolean;
  social_done: boolean;
  verified: boolean;
  opened: boolean;
  xp_awarded: number;
}

export interface CampaignState {
  social_done: boolean;
  verified: boolean;
  opened: boolean;
  xp_awarded: number;
  tier: string | null;
}

export interface HistoryItem {
  chest_id: string;
  xp_awarded: number;
  created_at: string | null;
  tier: string;
}

export interface GlobalStats {
  totalXp: number;
  totalUsers: number;
  totalSwapEvents: number;
  totalCashbackUsd: number;
}

export interface LeaderboardEntry {
  wallet_address: string;
  xp: number;
  tier: string;
  level: number;
}

function invalidateAll(wallet: string) {
  queryClient.invalidateQueries({ queryKey: ["/api/chests", wallet] });
  queryClient.invalidateQueries({ queryKey: ["/api/chests/campaign", wallet] });
  queryClient.invalidateQueries({ queryKey: ["/api/chests/history", wallet] });
  queryClient.invalidateQueries({ queryKey: ["/api/rewards/user", wallet] });
  queryClient.invalidateQueries({ queryKey: ["/api/rewards/stats"] });
  queryClient.invalidateQueries({ queryKey: ["/api/rewards/leaderboard"] });
  queryClient.invalidateQueries({ queryKey: ["/api/rewards/rank", wallet] });
  queryClient.invalidateQueries({ queryKey: ["/api/referral/stats", wallet] });
}

// ─── Existing 4-chest grid hooks ────────────────────────────────────────────

export function useChests(wallet: string | null) {
  return useQuery<ChestState[]>({
    queryKey: ["/api/chests", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/chests/${wallet}`);
      return res.json();
    },
  });
}

export function useChestSocial(wallet: string | null) {
  return useMutation({
    mutationFn: async (chestId: string) => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/${chestId}/social`, {});
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => wallet && invalidateAll(wallet),
  });
}

export function useChestVerify(wallet: string | null) {
  return useMutation({
    mutationFn: async ({ chestId, signature }: { chestId: string; signature: string }) => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/${chestId}/verify`, { signature });
      if (!res.ok) throw new Error((await res.json()).error ?? "Verification failed");
      return res.json();
    },
    onSuccess: () => wallet && invalidateAll(wallet),
  });
}

export function useChestOpen(wallet: string | null) {
  return useMutation<{ ok: boolean; xpAwarded: number; totalXp: number; tier?: string }, Error, string>({
    mutationFn: async (chestId: string) => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/${chestId}/open`, {});
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to open");
      return res.json();
    },
    onSuccess: () => wallet && invalidateAll(wallet),
  });
}

// ─── Campaign chest hooks (single draw) ─────────────────────────────────────

export function useCampaignState(wallet: string | null) {
  return useQuery<CampaignState>({
    queryKey: ["/api/chests/campaign", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/chests/${wallet}/campaign-state`);
      return res.json();
    },
    staleTime: 0,
  });
}

export function useCampaignSocial(wallet: string | null) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/campaign/social`, {});
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => wallet && invalidateAll(wallet),
  });
}

export function useCampaignVerify(wallet: string | null) {
  return useMutation({
    mutationFn: async (signature: string) => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/campaign/verify`, { signature });
      if (!res.ok) throw new Error((await res.json()).error ?? "Verification failed");
      return res.json();
    },
    onSuccess: () => wallet && invalidateAll(wallet),
  });
}

export function useCampaignOpen(wallet: string | null) {
  return useMutation<{ ok: boolean; xpAwarded: number; totalXp: number; tier: string }, Error, void>({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/campaign/open`, {});
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to open");
      return res.json();
    },
    onSuccess: () => wallet && invalidateAll(wallet),
  });
}

// ─── History ─────────────────────────────────────────────────────────────────

export function useChestHistory(wallet: string | null) {
  return useQuery<HistoryItem[]>({
    queryKey: ["/api/chests/history", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/chests/${wallet}/history`);
      return res.json();
    },
  });
}

// ─── Global stats + leaderboard ──────────────────────────────────────────────

export function useGlobalStats() {
  return useQuery<GlobalStats>({
    queryKey: ["/api/rewards/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/rewards/stats");
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useLeaderboard(limit = 50) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/rewards/leaderboard", limit],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/rewards/leaderboard?limit=${limit}`);
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useUserRank(wallet: string | null) {
  return useQuery<{ rank: number }>({
    queryKey: ["/api/rewards/rank", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/rewards/rank/${wallet}`);
      return res.json();
    },
    staleTime: 60_000,
  });
}

// ─── Wallet signature helper ─────────────────────────────────────────────────

export async function signChestMessage(wallet: string, chestId: string): Promise<string> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found");
  const message = `SuperSwap Community Chest verification\nChest: ${chestId}\nWallet: ${wallet}\nI confirm I completed the X task to claim this chest.`;
  const signature: string = await eth.request({
    method: "personal_sign",
    params: [message, wallet],
  });
  return signature;
}
