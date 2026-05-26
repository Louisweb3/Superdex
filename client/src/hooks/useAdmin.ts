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

// ── Auth ──────────────────────────────────────────────────────────────────────────────────────────
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

// ── Settings ──────────────────────────────────────────────────────────────────────────────────────────
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

// ── Page Blocks ──────────────────────────────────────────────────────────────────────────────────────────
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

// ── Events ────────────────────────────────────────────────────────────────────────────────────────────────
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

// ── Social Links ────────────────────────────────────────────────────────────────────────────────────────────────
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

// ── Database Explorer ──────────────────────────────────────────────────────────────────────
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
