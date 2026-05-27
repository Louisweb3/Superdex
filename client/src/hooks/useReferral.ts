import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface ReferralStats {
  referral_code: string;
  referral_count: number;
  referral_bonus_xp: number;
  milestone_count: number;
  referred_by: string;
}

export function useReferralStats(wallet: string | null | undefined) {
  return useQuery({
    queryKey: ["/api/referral/stats", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/referral/stats/${wallet}`);
      return res.json() as Promise<ReferralStats>;
    },
  });
}

export function useApplyReferralCode() {
  return useMutation({
    mutationFn: async ({ wallet, code }: { wallet: string; code: string }) => {
      const res = await apiRequest("POST", "/api/referral/apply", { wallet, code });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error ?? "Failed to apply referral code");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/referral/stats", variables.wallet] });
    },
  });
}
