import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const TOKEN_KEY = "admin_token";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function adminFetch(url: string, opts?: RequestInit) {
  const token = getToken();
  const r = await fetch(url, {
    ...opts,
    headers: {
      ...(opts?.headers ?? {}),
      "x-admin-token": token ?? "",
      "Content-Type": "application/json",
    },
  });
  if (r.status === 401) {
    setToken(null);
    throw new Error("Unauthorized");
  }
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────────
export function useAdminAuth() {
  const [token, setTokenState] = useState<string | null>(getToken);

  useEffect(() => {
    setTokenState(getToken());
  }, []);

  const login = async (password: string) => {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!r.ok) throw new Error("Invalid password");
    const data = await r.json();
    setToken(data.token);
    setTokenState(data.token);
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
  };

  const isLoggedIn = !!token;

  return { isLoggedIn, login, logout, token };
}

// ── Settings ──────────────────────────────────────────────────────────────────────────
export function useAdminSettings() {
  const qc = useQueryClient();
  const settings = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => adminFetch("/api/admin/settings"),
    enabled: !!getToken(),
  });

  const update = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ key, value }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      qc.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  return { settings, update };
}

export function usePublicSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });
}

// ── Page Blocks ──────────────────────────────────────────────────────────────────────────
export interface PageBlock {
  id: string;
  page: string;
  section: string;
  block_key: string;
  content_type: string;
  value: string;
  sort_order: number;
}

export function useAdminBlocks(page?: string) {
  const qc = useQueryClient();
  const blocks = useQuery<PageBlock[]>({
    queryKey: ["/api/admin/blocks", page],
    queryFn: () => adminFetch(`/api/admin/blocks${page ? `?page=${page}` : ""}`),
    enabled: !!getToken(),
  });

  const saveBlock = useMutation({
    mutationFn: (block: Partial<PageBlock>) =>
      adminFetch("/api/admin/blocks", { method: "POST", body: JSON.stringify(block) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/blocks"] });
      qc.invalidateQueries({ queryKey: ["/api/blocks"] });
    },
  });

  const deleteBlock = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/blocks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/blocks"] });
      qc.invalidateQueries({ queryKey: ["/api/blocks"] });
    },
  });

  return { blocks, saveBlock, deleteBlock };
}

export function usePublicBlocks(page?: string) {
  return useQuery<PageBlock[]>({
    queryKey: ["/api/blocks", page],
    queryFn: () => fetch(`/api/blocks${page ? `?page=${page}` : ""}`).then((r) => r.json()),
  });
}

// ── Events ─────────────────────────────────────────────────────────────────────────────
export interface CmsEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  active: boolean;
  xp_bonus: number;
  cashback_multiplier: number;
}

export function useAdminEvents() {
  const qc = useQueryClient();
  const events = useQuery<CmsEvent[]>({
    queryKey: ["/api/admin/events"],
    queryFn: () => adminFetch("/api/admin/events"),
    enabled: !!getToken(),
  });

  const create = useMutation({
    mutationFn: (ev: Omit<CmsEvent, "id">) => adminFetch("/api/admin/events", { method: "POST", body: JSON.stringify(ev) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/events"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...patch }: Partial<CmsEvent> & { id: string }) =>
      adminFetch(`/api/admin/events/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/events"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/events/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/events"] }),
  });

  return { events, create, update, remove };
}

export function usePublicEvents() {
  return useQuery<CmsEvent[]>({
    queryKey: ["/api/events"],
    queryFn: () => fetch("/api/events").then((r) => r.json()),
  });
}

// ── Social Links ──────────────────────────────────────────────────────────────────────────
export interface CmsSocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  active: boolean;
  sort_order: number;
}

export function useAdminSocial() {
  const qc = useQueryClient();
  const links = useQuery<CmsSocialLink[]>({
    queryKey: ["/api/admin/social"],
    queryFn: () => adminFetch("/api/admin/social"),
    enabled: !!getToken(),
  });

  const save = useMutation({
    mutationFn: (link: Partial<CmsSocialLink> & { platform: string; url: string }) =>
      adminFetch("/api/admin/social", { method: "POST", body: JSON.stringify(link) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/social"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/social/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/social"] }),
  });

  return { links, save, remove };
}

export function usePublicSocial() {
  return useQuery<CmsSocialLink[]>({
    queryKey: ["/api/social"],
    queryFn: () => fetch("/api/social").then((r) => r.json()),
  });
}

// ── Earn Tasks Admin ───────────────────────────────────────────────────────────────────
export interface AdminEarnTask {
  id: string;
  title: string;
  description: string;
  type: "onchain" | "offchain";
  category: string;
  target_value: number;
  target_count: number;
  xp_reward: number;
  cashback_reward: number;
  icon: string;
  verification_url: string;
  sort_order: number;
  active: boolean;
}

export interface AdminAnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: string;
  active: boolean;
  start_date: string;
  end_date: string;
  icon: string;
}

export function useAdminEarnTasks() {
  const qc = useQueryClient();
  const tasks = useQuery<AdminEarnTask[]>({
    queryKey: ["/api/admin/earn-tasks"],
    queryFn: () => adminFetch("/api/admin/earn-tasks"),
    enabled: !!getToken(),
  });
  const create = useMutation({
    mutationFn: (task: Omit<AdminEarnTask, "id">) => adminFetch("/api/admin/earn-tasks", { method: "POST", body: JSON.stringify(task) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/earn-tasks"] }),
  });
  const update = useMutation({
    mutationFn: ({ id, ...patch }: Partial<AdminEarnTask> & { id: string }) =>
      adminFetch(`/api/admin/earn-tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/earn-tasks"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/earn-tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/earn-tasks"] }),
  });
  return { tasks, create, update, remove };
}

export function useAdminAnnouncements() {
  const qc = useQueryClient();
  const announcements = useQuery<AdminAnnouncementItem[]>({
    queryKey: ["/api/admin/announcements"],
    queryFn: () => adminFetch("/api/admin/announcements"),
    enabled: !!getToken(),
  });
  const create = useMutation({
    mutationFn: (ann: Omit<AdminAnnouncementItem, "id">) => adminFetch("/api/admin/announcements", { method: "POST", body: JSON.stringify(ann) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] }),
  });
  const update = useMutation({
    mutationFn: ({ id, ...patch }: Partial<AdminAnnouncementItem> & { id: string }) =>
      adminFetch(`/api/admin/announcements/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] }),
  });
  return { announcements, create, update, remove };
}

// ── Popular Tokens Admin ────────────────────────────────────────────────────────────────
export interface AdminPopularToken {
  id: string;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon_url: string;
  sort_order: number;
  active: boolean;
}

export function useAdminPopularTokens() {
  const qc = useQueryClient();
  const tokens = useQuery<AdminPopularToken[]>({
    queryKey: ["/api/admin/popular-tokens"],
    queryFn: () => adminFetch("/api/admin/popular-tokens"),
    enabled: !!getToken(),
  });
  const upsert = useMutation({
    mutationFn: (t: Partial<AdminPopularToken> & { symbol: string; name: string; address: string }) =>
      adminFetch("/api/admin/popular-tokens", { method: "POST", body: JSON.stringify(t) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/popular-tokens"] });
      qc.invalidateQueries({ queryKey: ["/api/popular-tokens"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/popular-tokens/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/popular-tokens"] });
      qc.invalidateQueries({ queryKey: ["/api/popular-tokens"] });
    },
  });
  return { tokens, upsert, remove };
}

export function usePublicPopularTokens() {
  return useQuery<AdminPopularToken[]>({
    queryKey: ["/api/popular-tokens"],
    queryFn: () => fetch("/api/popular-tokens").then((r) => r.json()),
  });
}

export function usePublicAnnouncements() {
  return useQuery<AdminAnnouncementItem[]>({
    queryKey: ["/api/announcements"],
    queryFn: () => fetch("/api/announcements").then((r) => r.json()),
    staleTime: 60_000,
  });
}

// ── Database Explorer ───────────────────────────────────────────────────────────────────
export interface DbTableCount {
  table: string;
  count: number;
}

export function useAdminDatabase() {
  const qc = useQueryClient();

  const tables = useQuery<DbTableCount[]>({
    queryKey: ["/api/admin/database"],
    queryFn: () => adminFetch("/api/admin/database"),
    enabled: !!getToken(),
  });

  const rows = (table: string, page = 0, limit = 200) =>
    useQuery<{ table: string; rows: any[]; limit: number; offset: number }>({
      queryKey: ["/api/admin/database", table, page, limit],
      queryFn: () => adminFetch(`/api/admin/database/${table}?limit=${limit}&offset=${page * limit}`),
      enabled: !!getToken() && !!table,
    });

  return { tables, rows };
}
