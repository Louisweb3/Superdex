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

// ─── Earn Tasks ─────────────────────────────────────────────────────────────
export const earnTasks = pgTable("earn_tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 16 }).notNull(), // onchain | offchain
  task_type: varchar("task_type", { length: 32 }).notNull(), // swap_eth_usdc, retweet, like, etc.
  xp_reward: integer("xp_reward").notNull().default(0),
  cashback_reward: numeric("cashback_reward", { precision: 24, scale: 8 }).notNull().default("0"), // USD amount
  action_url: text("action_url").notNull().default(""), // link to perform the task
  action_label: text("action_label").notNull().default(""), // button text
  active: boolean("active").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const insertEarnTaskSchema = createInsertSchema(earnTasks).omit({ id: true, created_at: true });
export type InsertEarnTask = z.infer<typeof insertEarnTaskSchema>;
export type EarnTask = typeof earnTasks.$inferSelect;

// ─── User Earn Completions ───────────────────────────────────────────────────
export const userEarnCompletions = pgTable("user_earn_completions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  wallet_address: varchar("wallet_address", { length: 42 }).notNull(),
  task_id: varchar("task_id", { length: 36 }).notNull(),
  xp_awarded: integer("xp_awarded").notNull().default(0),
  cashback_awarded: numeric("cashback_awarded", { precision: 24, scale: 8 }).notNull().default("0"),
  completed_at: timestamp("completed_at", { mode: "date" }).defaultNow(),
});

export type UserEarnCompletion = typeof userEarnCompletions.$inferSelect;
