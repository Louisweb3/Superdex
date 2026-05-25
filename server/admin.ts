import type { Express, Request, Response, NextFunction } from "express";
import { adminStorage } from "./storage";

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
}
