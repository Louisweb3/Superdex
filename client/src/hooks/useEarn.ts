import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function useEarnTasks() {
  return useQuery({
    queryKey: ["/api/earn/tasks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/earn/tasks");
      return res.json() as Promise<any[]>;
    },
  });
}

export function useTaskCompletions(wallet: string | undefined) {
  return useQuery({
    queryKey: ["/api/earn/completions", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/earn/completions/${wallet}`);
      return res.json() as Promise<any[]>;
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["/api/earn/announcements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/earn/announcements");
      return res.json() as Promise<any[]>;
    },
  });
}

export function useXAccount(wallet: string | undefined) {
  return useQuery({
    queryKey: ["/api/earn/x-account", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/earn/x-account/${wallet}`);
      return res.json() as Promise<{ x_username: string; twitter_connected: boolean; twitter_configured: boolean }>;
    },
  });
}

export function useTwitterStatus() {
  return useQuery({
    queryKey: ["/api/auth/twitter/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/twitter/status");
      return res.json() as Promise<{ configured: boolean; callback_url: string }>;
    },
    staleTime: 60_000,
  });
}

export function useVerifySocialTask() {
  return useMutation({
    mutationFn: async ({ wallet, taskId }: { wallet: string; taskId: string }) => {
      const res = await apiRequest("POST", "/api/earn/verify-social", { wallet, taskId });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Verification failed" }));
        throw new Error(err.error ?? "Verification failed");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/earn/completions", variables.wallet] });
    },
  });
}

export function useClaimTask() {
  return useMutation({
    mutationFn: async ({ wallet, taskId }: { wallet: string; taskId: string }) => {
      const res = await apiRequest("POST", "/api/earn/claim", { wallet, taskId });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Claim failed" }));
        throw new Error(err.error ?? "Claim failed");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/earn/completions", variables.wallet] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/user", variables.wallet] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/stats"] });
    },
  });
}
