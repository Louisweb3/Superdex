import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Base users (auth) ──────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Rewards users (wallet = PK) ────────────────────────────────────────────
export const rewardUsers = pgTable("reward_users", {
  wallet_address: varchar("wallet_address", { length: 42 }).primaryKey(),
  xp: integer("xp").notNull().default(0),
  weekly_xp: integer("weekly_xp").notNull().default(0),
  cashback_usd: numeric("cashback_usd", { precision: 24, scale: 8 }).notNull().default("0"),         // lifetime claimed cashback
  weekly_cashback_usd: numeric("weekly_cashback_usd", { precision: 24, scale: 8 }).notNull().default("0"), // current week earned (unclaimed)
  pending_cashback_usd: numeric("pending_cashback_usd", { precision: 24, scale: 8 }).notNull().default("0"), // total unverified/unclaimed
  total_swaps: integer("total_swaps").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  last_activity_date: varchar("last_activity_date", { length: 10 }).notNull().default(""),
  last_weekly_reset: varchar("last_weekly_reset", { length: 10 }).notNull().default(""), // YYYY-MM-DD of last weekly reset
  tier: varchar("tier", { length: 16 }).notNull().default("Bronze"),
  total_volume_usd: numeric("total_volume_usd", { precision: 24, scale: 8 }).notNull().default("0"),
  level: integer("level").notNull().default(1),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ─── Swap events ──────────────────────────────────────────────────────────────
export const swapEvents = pgTable("swap_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  wallet_address: varchar("wallet_address", { length: 42 }).notNull(),
  tx_hash: varchar("tx_hash", { length: 66 }).notNull(),
  sell_symbol: varchar("sell_symbol", { length: 16 }).notNull(),
  buy_symbol: varchar("buy_symbol", { length: 16 }).notNull(),
  volume_usd: numeric("volume_usd", { precision: 24, scale: 8 }).notNull().default("0"),
  xp_earned: integer("xp_earned").notNull().default(0),
  cashback_usd: numeric("cashback_usd", { precision: 24, scale: 8 }).notNull().default("0"),
  verified: boolean("verified").notNull().default(false),
  timestamp: timestamp("timestamp", { mode: "date" }).defaultNow(),
});

// ─── Daily quests ─────────────────────────────────────────────────────────────
export const dailyQuests = pgTable("daily_quests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  wallet_address: varchar("wallet_address", { length: 42 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  quest_type: varchar("quest_type", { length: 16 }).notNull(),
  target: integer("target").notNull().default(0),
  progress: numeric("progress", { precision: 24, scale: 8 }).notNull().default("0"),
  completed: boolean("completed").notNull().default(false),
  xp_reward: integer("xp_reward").notNull().default(0),
  claimed: boolean("claimed").notNull().default(false),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ─── Admin CMS: Site Settings ─────────────────────────────────────────────────
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// ─── Admin CMS: Page Blocks (editable content per page) ───────────────────────
export const pageBlocks = pgTable("page_blocks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  page: varchar("page", { length: 32 }).notNull(),      // e.g. "home", "swap", "rewards"
  section: varchar("section", { length: 32 }).notNull(), // e.g. "hero", "overview"
  block_key: varchar("block_key", { length: 64 }).notNull(), // e.g. "title", "subtitle", "image"
  content_type: varchar("content_type", { length: 16 }).notNull().default("text"), // text | image | html
  value: text("value").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  updated_at: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// ─── Admin CMS: Events/Announcements ──────────────────────────────────────────
export const adminEvents = pgTable("admin_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  event_type: varchar("event_type", { length: 16 }).notNull().default("announcement"), // announcement | reward_event | promo
  start_date: varchar("start_date", { length: 10 }).notNull(),
  end_date: varchar("end_date", { length: 10 }).notNull(),
  active: boolean("active").notNull().default(true),
  xp_bonus: integer("xp_bonus").notNull().default(0),
  cashback_multiplier: numeric("cashback_multiplier", { precision: 5, scale: 2 }).notNull().default("1"),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ─── Per-token cashback tracking ──────────────────────────────────────────────
export const tokenCashback = pgTable("token_cashback", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  wallet_address: varchar("wallet_address", { length: 42 }).notNull(),
  token_symbol: varchar("token_symbol", { length: 16 }).notNull(),
  token_address: varchar("token_address", { length: 42 }).notNull(),
  total_cashback_token: numeric("total_cashback_token", { precision: 24, scale: 8 }).notNull().default("0"),
  total_cashback_usd: numeric("total_cashback_usd", { precision: 24, scale: 8 }).notNull().default("0"),
  swap_count: integer("swap_count").notNull().default(0),
  last_swap_at: timestamp("last_swap_at", { mode: "date" }).defaultNow(),
});

export const insertTokenCashbackSchema = createInsertSchema(tokenCashback).omit({ id: true, last_swap_at: true });
export type InsertTokenCashback = z.infer<typeof insertTokenCashbackSchema>;
export type TokenCashback = typeof tokenCashback.$inferSelect;

// ─── Admin CMS: Social Links ──────────────────────────────────────────────────
export const socialLinks = pgTable("social_links", {
  id: varchar("id", { length: 36 }).primaryKey(),
  platform: varchar("platform", { length: 32 }).notNull(), // twitter, discord, telegram, github
  url: text("url").notNull(),
  icon: text("icon").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
  updated_at: timestamp("updated_at", { mode: "date" }).defaultNow(),
});
