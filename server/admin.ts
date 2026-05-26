import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { adminStorage } from "./storage";
import { sql } from "drizzle-orm";
import { users, rewardUsers, swapEvents, dailyQuests, siteSettings, pageBlocks, adminEvents, socialLinks, earnTasks, taskCompletions, adminAnnouncements } from "@shared/schema";
import { earnStorage } from "./storage";

const ADMIN_PASSWORD = "MKM2026";
const SESSION_TTL = 1000 * 60 * 60 * 4; // 4 hours

interface AdminSession {
  token: string;
  createdAt: number;
}

const sessions = new Map<string, AdminSession>();

function cleanSessions() {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL) sessions.delete(token);
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  cleanSessions();
  const token = req.headers["x-admin-token"] as string;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function registerAdminRoutes(app: Express) {
  // ── Login ────────────────────────────────────────────────────────────────────────────────
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessions.set(token, { token, createdAt: Date.now() });
    return res.json({ token });
  });

  app.post("/api/admin/logout", requireAdmin, (req, res) => {
    const token = req.headers["x-admin-token"] as string;
    sessions.delete(token);
    return res.json({ ok: true });
  });

  app.get("/api/admin/check", (req, res) => {
    cleanSessions();
    const token = req.headers["x-admin-token"] as string;
    return res.json({ ok: !!token && sessions.has(token) });
  });

  // ── Site Settings ─────────────────────────────────────────────────────────────────────────────────────
  app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    const settings = await adminStorage.getAllSettings();
    return res.json(settings);
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: "Missing key or value" });
    await adminStorage.setSetting(key, String(value));
    return res.json({ ok: true });
  });

  // Public settings (no auth)
  app.get("/api/settings", async (_req, res) => {
    const settings = await adminStorage.getAllSettings();
    return res.json(settings);
  });

  // ── Page Blocks ──────────────────────────────────────────────────────────────────────────────────────
  app.get("/api/admin/blocks", requireAdmin, async (req, res) => {
    const { page } = req.query;
    const blocks = await adminStorage.getPageBlocks(page as string | undefined);
    return res.json(blocks);
  });

  app.post("/api/admin/blocks", requireAdmin, async (req, res) => {
    const block = req.body;
    if (!block.page || !block.section || !block.block_key || block.value === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const saved = await adminStorage.setPageBlock(block);
    return res.json(saved);
  });

  app.delete("/api/admin/blocks/:id", requireAdmin, async (req, res) => {
    await adminStorage.deletePageBlock(String(req.params.id));
    return res.json({ ok: true });
  });

  // Public blocks (no auth)
  app.get("/api/blocks", async (req, res) => {
    const { page } = req.query;
    const blocks = await adminStorage.getPageBlocks(page as string | undefined);
    return res.json(blocks);
  });

  // ── Events ─────────────────────────────────────────────────────────────────────────────────────────
  app.get("/api/admin/events", requireAdmin, async (_req, res) => {
    return res.json(await adminStorage.getEvents());
  });

  app.post("/api/admin/events", requireAdmin, async (req, res) => {
    const ev = req.body;
    if (!ev.title || !ev.description || !ev.start_date || !ev.end_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const created = await adminStorage.createEvent(ev);
    return res.json(created);
  });

  app.patch("/api/admin/events/:id", requireAdmin, async (req, res) => {
    const updated = await adminStorage.updateEvent(String(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Event not found" });
    return res.json(updated);
  });

  app.delete("/api/admin/events/:id", requireAdmin, async (req, res) => {
    await adminStorage.deleteEvent(String(req.params.id));
    return res.json({ ok: true });
  });

  // Public events
  app.get("/api/events", async (_req, res) => {
    const events = await adminStorage.getEvents();
    return res.json(events.filter((e) => e.active));
  });

  // ── Social Links ──────────────────────────────────────────────────────────────────────────────────────
  app.get("/api/admin/social", requireAdmin, async (_req, res) => {
    return res.json(await adminStorage.getSocialLinks());
  });

  app.post("/api/admin/social", requireAdmin, async (req, res) => {
    const link = req.body;
    if (!link.platform || !link.url) return res.status(400).json({ error: "Missing platform or url" });
    const saved = await adminStorage.upsertSocialLink(link);
    return res.json(saved);
  });

  app.delete("/api/admin/social/:id", requireAdmin, async (req, res) => {
    await adminStorage.deleteSocialLink(String(req.params.id));
    return res.json({ ok: true });
  });

  // Public social links
  app.get("/api/social", async (_req, res) => {
    const links = await adminStorage.getSocialLinks();
    return res.json(links.filter((l) => l.active));
  });

  // ── Database Explorer ───────────────────────────────────────────────────────────────────────
  // ── Earn Tasks Admin ──────────────────────────────────────────────────────
  app.get("/api/admin/earn-tasks", requireAdmin, async (_req, res) => {
    return res.json(await earnStorage.getTasks());
  });

  app.post("/api/admin/earn-tasks", requireAdmin, async (req, res) => {
    const task = await earnStorage.createTask(req.body);
    return res.json(task);
  });

  app.patch("/api/admin/earn-tasks/:id", requireAdmin, async (req, res) => {
    const task = await earnStorage.updateTask(req.params.id as string, req.body);
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json(task);
  });

  app.delete("/api/admin/earn-tasks/:id", requireAdmin, async (req, res) => {
    await earnStorage.deleteTask(req.params.id as string);
    return res.json({ ok: true });
  });

  // ── Announcements Admin ─────────────────────────────────────────────────
  app.get("/api/admin/announcements", requireAdmin, async (_req, res) => {
    return res.json(await earnStorage.getAnnouncements(false));
  });

  app.post("/api/admin/announcements", requireAdmin, async (req, res) => {
    const ann = await earnStorage.createAnnouncement(req.body);
    return res.json(ann);
  });

  app.patch("/api/admin/announcements/:id", requireAdmin, async (req, res) => {
    const ann = await earnStorage.updateAnnouncement(req.params.id as string, req.body);
    if (!ann) return res.status(404).json({ error: "Not found" });
    return res.json(ann);
  });

  app.delete("/api/admin/announcements/:id", requireAdmin, async (req, res) => {
    await earnStorage.deleteAnnouncement(req.params.id as string);
    return res.json({ ok: true });
  });

  // ── Database Explorer ───────────────────────────────────────────────────
  type DbTableKey = "users" | "reward_users" | "swap_events" | "daily_quests" | "site_settings" | "page_blocks" | "admin_events" | "social_links" | "earn_tasks" | "task_completions" | "admin_announcements";

  const TABLE_MAP: Record<DbTableKey, any> = {
    users,
    reward_users: rewardUsers,
    swap_events: swapEvents,
    daily_quests: dailyQuests,
    site_settings: siteSettings,
    page_blocks: pageBlocks,
    admin_events: adminEvents,
    social_links: socialLinks,
    earn_tasks: earnTasks,
    task_completions: taskCompletions,
    admin_announcements: adminAnnouncements,
  };

  app.get("/api/admin/database", requireAdmin, async (_req, res) => {
    const counts = await Promise.all(
      (Object.keys(TABLE_MAP) as DbTableKey[]).map(async (key) => {
        const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(TABLE_MAP[key]);
        return { table: key, count: Number(row?.count ?? 0) };
      })
    );
    return res.json(counts);
  });

  app.get("/api/admin/database/:table", requireAdmin, async (req, res) => {
    const tableKey = String(req.params.table) as DbTableKey;
    const table = TABLE_MAP[tableKey];
    if (!table) return res.status(400).json({ error: "Unknown table" });

    const limit = Math.min(Number(req.query.limit ?? 500), 2000);
    const offset = Number(req.query.offset ?? 0);
    const rows = await db.select().from(table).limit(limit).offset(offset);
    return res.json({ table: tableKey, rows, limit, offset });
  });
}
