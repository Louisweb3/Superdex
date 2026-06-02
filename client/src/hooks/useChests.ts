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

function invalidate(wallet: string) {
  queryClient.invalidateQueries({ queryKey: ["/api/chests", wallet] });
  queryClient.invalidateQueries({ queryKey: ["/api/rewards/user", wallet] });
  queryClient.invalidateQueries({ queryKey: ["/api/rewards/stats"] });
  queryClient.invalidateQueries({ queryKey: ["/api/referral/stats", wallet] });
}

export function useChestSocial(wallet: string | null) {
  return useMutation({
    mutationFn: async (chestId: string) => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/${chestId}/social`, {});
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => wallet && invalidate(wallet),
  });
}

export function useChestVerify(wallet: string | null) {
  return useMutation({
    mutationFn: async ({ chestId, signature }: { chestId: string; signature: string }) => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/${chestId}/verify`, { signature });
      if (!res.ok) throw new Error((await res.json()).error ?? "Verification failed");
      return res.json();
    },
    onSuccess: () => wallet && invalidate(wallet),
  });
}

export function useChestOpen(wallet: string | null) {
  return useMutation<{ ok: boolean; xpAwarded: number; totalXp: number }, Error, string>({
    mutationFn: async (chestId: string) => {
      const res = await apiRequest("POST", `/api/chests/${wallet}/${chestId}/open`, {});
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to open");
      return res.json();
    },
    onSuccess: () => wallet && invalidate(wallet),
  });
}

// Ask the connected wallet to sign the chest verification message via personal_sign.
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
