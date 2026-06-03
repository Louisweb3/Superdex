import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  numeric,
  boolean,
  uniqueIndex,
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
  x_username: varchar("x_username", { length: 64 }).default(""),
  referral_code: varchar("referral_code", { length: 16 }).default(""),
  referred_by: varchar("referred_by", { length: 42 }).default(""),
  referral_bonus_xp: integer("referral_bonus_xp").notNull().default(0),
  referral_milestone_paid: boolean("referral_milestone_paid").notNull().default(false),
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

// ─── Earn Tasks ───────────────────────────────────────────────────────────────
export const earnTasks = pgTable("earn_tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 16 }).notNull(), // onchain | offchain
  category: varchar("category", { length: 32 }).notNull(), // swap_volume | social_follow | social_like | social_retweet | social_comment | social_join
  target_value: numeric("target_value", { precision: 24, scale: 8 }).notNull().default("0"), // USD target for onchain
  target_count: integer("target_count").notNull().default(1), // number of actions for offchain
  xp_reward: integer("xp_reward").notNull().default(0),
  cashback_reward: numeric("cashback_reward", { precision: 24, scale: 8 }).notNull().default("0"),
  icon: text("icon").notNull().default(""), // lucide icon name
  verification_url: text("verification_url").notNull().default(""),
  sort_order: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const insertEarnTaskSchema = createInsertSchema(earnTasks).omit({ id: true, created_at: true });
export type InsertEarnTask = z.infer<typeof insertEarnTaskSchema>;
export type EarnTask = typeof earnTasks.$inferSelect;

// ─── Task Completions ─────────────────────────────────────────────────────────
export const taskCompletions = pgTable("task_completions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  wallet_address: varchar("wallet_address", { length: 42 }).notNull(),
  task_id: varchar("task_id", { length: 36 }).notNull(),
  progress: numeric("progress", { precision: 24, scale: 8 }).notNull().default("0"),
  target_value: numeric("target_value", { precision: 24, scale: 8 }).notNull().default("0"),
  completed: boolean("completed").notNull().default(false),
  claimed: boolean("claimed").notNull().default(false),
  claimed_at: timestamp("claimed_at", { mode: "date" }),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const insertTaskCompletionSchema = createInsertSchema(taskCompletions).omit({ id: true, created_at: true });
export type InsertTaskCompletion = z.infer<typeof insertTaskCompletionSchema>;
export type TaskCompletion = typeof taskCompletions.$inferSelect;

// ─── Admin Announcements ────────────────────────────────────────────────────────
export const adminAnnouncements = pgTable("admin_announcements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 16 }).notNull().default("info"), // info | warning | success | promo
  active: boolean("active").notNull().default(true),
  start_date: varchar("start_date", { length: 10 }).notNull().default(""),
  end_date: varchar("end_date", { length: 10 }).notNull().default(""),
  icon: text("icon").notNull().default(""),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const insertAdminAnnouncementSchema = createInsertSchema(adminAnnouncements).omit({ id: true, created_at: true });
export type InsertAdminAnnouncement = z.infer<typeof insertAdminAnnouncementSchema>;
export type AdminAnnouncement = typeof adminAnnouncements.$inferSelect;

// ─── Community Chest claims ───────────────────────────────────────────────────
export const chestClaims = pgTable(
  "chest_claims",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    wallet_address: varchar("wallet_address", { length: 42 }).notNull(),
    chest_id: varchar("chest_id", { length: 16 }).notNull(),
    social_done: boolean("social_done").notNull().default(false),
    verified: boolean("verified").notNull().default(false),
    signature: text("signature").notNull().default(""),
    opened: boolean("opened").notNull().default(false),
    xp_awarded: integer("xp_awarded").notNull().default(0),
    created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    walletChestUidx: uniqueIndex("chest_claims_wallet_chest_uidx").on(t.wallet_address, t.chest_id),
  })
);

export type ChestClaim = typeof chestClaims.$inferSelect;

// ─── Community Chest definitions (shared between client + server) ──────────────
export interface ChestDef {
  id: string;
  name: string;
  rarity: string;
  minXp: number;
  maxXp: number;
  chance: number;     // % probability in the campaign random draw
  requiredXp: number; // total lifetime XP required to unlock this chest tier individually
  color: string;      // hex base
  glow: string;       // hex glow
  tagline: string;
  shareText: string;  // text pre-filled when sharing on X (the like + RT action)
}

export const CHEST_DEFS: ChestDef[] = [
  {
    id: "common",
    name: "Common Chest",
    rarity: "Common",
    minXp: 1000,
    maxXp: 5000,
    chance: 65,
    requiredXp: 0,
    color: "#7c8a9c",
    glow: "#9fb1c4",
    tagline: "Open to everyone — your first taste of TGE rewards.",
    shareText: "I just opened a Community Chest on @SuperSwapDEX and earned XP toward the TGE airdrop \uD83D\uDC8E\u26A1 Trade. Earn. Repeat. #SuperSwap #Base",
  },
  {
    id: "rare",
    name: "Rare Chest",
    rarity: "Rare",
    minXp: 10000,
    maxXp: 20000,
    chance: 25,
    requiredXp: 2000,
    color: "#2f81f7",
    glow: "#5aa9ff",
    tagline: "25% chance to pull this — serious XP for active traders.",
    shareText: "Cracked open a Rare Chest on @SuperSwapDEX \uD83D\uDD35 stacking XP for the TGE airdrop. Who's farming with me? #SuperSwap #Base #DeFi",
  },
  {
    id: "epic",
    name: "Epic Chest",
    rarity: "Epic",
    minXp: 25000,
    maxXp: 75000,
    chance: 9,
    requiredXp: 8000,
    color: "#a855f7",
    glow: "#c98bff",
    tagline: "9% chance. For the dedicated degens.",
    shareText: "Just pulled an Epic Chest on @SuperSwapDEX \uD83D\uDFE3 massive XP toward the TGE. The grind pays. #SuperSwap #Base #Airdrop",
  },
  {
    id: "legendary",
    name: "Legendary Chest",
    rarity: "Legendary",
    minXp: 100000,
    maxXp: 100000,
    chance: 1,
    requiredXp: 25000,
    color: "#f5a623",
    glow: "#ffd25a",
    tagline: "1% chance. The rarest prize in the realm.",
    shareText: "I pulled the LEGENDARY CHEST on @SuperSwapDEX \uD83D\uDFE1\uD83D\uDC51 100,000 XP toward the TGE airdrop. Top tier only. #SuperSwap #Base #Airdrop",
  },
];

// ─── Popular Tokens (swap page quick-select) ──────────────────────────────────
export const popularTokens = pgTable("popular_tokens", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol", { length: 16 }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  address: varchar("address", { length: 42 }).notNull(),
  decimals: integer("decimals").notNull().default(18),
  icon_url: text("icon_url").notNull().default(""),
  sort_order: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const insertPopularTokenSchema = createInsertSchema(popularTokens).omit({ id: true, created_at: true });
export type InsertPopularToken = z.infer<typeof insertPopularTokenSchema>;
export type PopularToken = typeof popularTokens.$inferSelect;

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
