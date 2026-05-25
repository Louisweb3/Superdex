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
  cashback_usd: numeric("cashback_usd", { precision: 24, scale: 8 }).notNull().default("0"),
  total_swaps: integer("total_swaps").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  last_activity_date: varchar("last_activity_date", { length: 10 }).notNull().default(""),
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
