import { randomUUID } from "crypto";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  rewardUsers,
  swapEvents,
  dailyQuests,
  type User,
  type InsertUser,
} from "@shared/schema";

// ─── Base user storage (keep for auth compat) ────────────────────────────────────────────────
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return u;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return u;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const [u] = await db.insert(users).values(insertUser).returning();
    return u;
  }
}

export const storage = new DbStorage();

// ─── Rewards types (keep for API compat) ──────────────────────────────────────────────────────
export interface RewardUser {
  wallet_address: string;
  xp: number;
  weekly_xp: number;
  cashback_usd: number;
  total_swaps: number;
  streak: number;
  last_activity_date: string;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  total_volume_usd: number;
  level: number;
  created_at: number;
}

export interface SwapEvent {
  id: string;
  wallet_address: string;
  tx_hash: string;
  sell_symbol: string;
  buy_symbol: string;
  volume_usd: number;
  xp_earned: number;
  cashback_usd: number;
  timestamp: number;
  verified?: boolean;
}

export interface DailyQuest {
  id: string;
  wallet_address: string;
  date: string;
  quest_type: "swaps" | "volume" | "login";
  target: number;
  progress: number;
  completed: boolean;
  xp_reward: number;
  claimed: boolean;
}

// ─── Helpers ─────────────────────────0───────────────────────────────────────
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function tierFromXP(xp: number): RewardUser["tier"] {
  if (xp >= 5000) return "Diamond";
  if (xp >= 2000) return "Gold";
  if (xp >= 500)  return "Silver";
  return "Bronze";
}

function levelFromXP(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function xpForSwap(volumeUsd: number, streak: number): number {
  const base = 10;
  const volumeBonus = Math.floor(volumeUsd / 10);
  const streakBonus = Math.min(streak * 5, 50);
  return base + volumeBonus + streakBonus;
}

function cashbackForSwap(volumeUsd: number): number {
  return parseFloat((volumeUsd * 0.001).toFixed(4));
}

// ─── DB-backed rewards storage ──────────────────────────────────────────────────────────
export class RewardsStorage {

  private async ensureUser(wallet: string): Promise<RewardUser> {
    const key = wallet.toLowerCase();
    const [existing] = await db
      .select()
      .from(rewardUsers)
      .where(eq(rewardUsers.wallet_address, key))
      .limit(1);
    if (existing) {
      return {
        wallet_address: existing.wallet_address,
        xp: existing.xp,
        weekly_xp: existing.weekly_xp,
        cashback_usd: Number(existing.cashback_usd),
        total_swaps: existing.total_swaps,
        streak: existing.streak,
        last_activity_date: existing.last_activity_date,
        tier: existing.tier as RewardUser["tier"],
        total_volume_usd: Number(existing.total_volume_usd),
        level: existing.level,
        created_at: new Date(existing.created_at ?? Date.now()).getTime(),
      };
    }
    const now = new Date();
    await db.insert(rewardUsers).values({
      wallet_address: key,
      xp: 0,
      weekly_xp: 0,
      cashback_usd: "0",
      total_swaps: 0,
      streak: 0,
      last_activity_date: "",
      tier: "Bronze",
      total_volume_usd: "0",
      level: 1,
      created_at: now,
    });
    return {
      wallet_address: key, xp: 0, weekly_xp: 0, cashback_usd: 0,
      total_swaps: 0, streak: 0, last_activity_date: "",
      tier: "Bronze", total_volume_usd: 0, level: 1,
      created_at: now.getTime(),
    };
  }

  async getUser(wallet: string): Promise<RewardUser | undefined> {
    return this.ensureUser(wallet);
  }

  async upsertUser(wallet: string): Promise<RewardUser> {
    return this.ensureUser(wallet);
  }

  async recordSwap(
    wallet: string,
    txHash: string,
    sellSymbol: string,
    buySymbol: string,
    volumeUsd: number,
    opts?: { verified?: boolean }
  ): Promise<{ user: RewardUser; xpEarned: number; cashbackUsd: number }> {
    const key = wallet.toLowerCase();
    const user = await this.ensureUser(key);
    const today = todayUTC();

    // Streak logic
    let newStreak = user.streak;
    if (user.last_activity_date !== today) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      if (user.last_activity_date === yStr) newStreak += 1;
      else newStreak = 1;
    }

    const xpEarned = xpForSwap(volumeUsd, newStreak);
    const cashbackUsd = cashbackForSwap(volumeUsd);
    const newXp = user.xp + xpEarned;
    const newWeeklyXp = user.weekly_xp + xpEarned;
    const newCashback = user.cashback_usd + cashbackUsd;
    const newSwaps = user.total_swaps + 1;
    const newVolume = user.total_volume_usd + volumeUsd;
    const newTier = tierFromXP(newXp);
    const newLevel = levelFromXP(newXp);

    // Update DB
    await db
      .update(rewardUsers)
      .set({
        xp: newXp,
        weekly_xp: newWeeklyXp,
        cashback_usd: String(newCashback),
        total_swaps: newSwaps,
        streak: newStreak,
        last_activity_date: today,
        tier: newTier,
        total_volume_usd: String(newVolume),
        level: newLevel,
      })
      .where(eq(rewardUsers.wallet_address, key));

    // Insert swap event
    await db.insert(swapEvents).values({
      id: randomUUID(),
      wallet_address: key,
      tx_hash: txHash,
      sell_symbol: sellSymbol,
      buy_symbol: buySymbol,
      volume_usd: String(volumeUsd),
      xp_earned: xpEarned,
      cashback_usd: String(cashbackUsd),
      verified: opts?.verified ?? false,
    });

    // Update quest progress
    await this.updateQuestProgressDB(key, today, "swaps", 1);
    await this.updateQuestProgressDB(key, today, "volume", volumeUsd);

    const updated: RewardUser = {
      ...user,
      xp: newXp,
      weekly_xp: newWeeklyXp,
      cashback_usd: newCashback,
      total_swaps: newSwaps,
      streak: newStreak,
      last_activity_date: today,
      tier: newTier,
      total_volume_usd: newVolume,
      level: newLevel,
    };
    return { user: updated, xpEarned, cashbackUsd };
  }

  private async updateQuestProgressDB(
    wallet: string, date: string, type: DailyQuest["quest_type"], amount: number
  ) {
    const [existing] = await db
      .select()
      .from(dailyQuests)
      .where(
        and(
          eq(dailyQuests.wallet_address, wallet),
          eq(dailyQuests.date, date),
          eq(dailyQuests.quest_type, type)
        )
      )
      .limit(1);

    if (!existing) return;

    const currentProgress = Number(existing.progress);
    const target = existing.target;
    if (existing.completed) return;

    const newProgress = Math.min(currentProgress + amount, target);
    const completed = newProgress >= target;

    await db
      .update(dailyQuests)
      .set({
        progress: String(newProgress),
        completed,
      })
      .where(eq(dailyQuests.id, existing.id));
  }

  async getDailyQuests(wallet: string): Promise<DailyQuest[]> {
    const key = wallet.toLowerCase();
    const today = todayUTC();
    const types: DailyQuest["quest_type"][] = ["swaps", "volume", "login"];
    const targets = { swaps: 3, volume: 100, login: 1 };
    const rewards = { swaps: 50, volume: 100, login: 25 };
    const results: DailyQuest[] = [];

    for (const type of types) {
      let [q] = await db
        .select()
        .from(dailyQuests)
        .where(
          and(
            eq(dailyQuests.wallet_address, key),
            eq(dailyQuests.date, today),
            eq(dailyQuests.quest_type, type)
          )
        )
        .limit(1);

      if (!q) {
        const progress = type === "login" ? 1 : 0;
        const completed = type === "login";
        const [inserted] = await db
          .insert(dailyQuests)
          .values({
            id: randomUUID(),
            wallet_address: key,
            date: today,
            quest_type: type,
            target: targets[type],
            progress: String(progress),
            completed,
            xp_reward: rewards[type],
            claimed: false,
          })
          .returning();
        q = inserted;

        // Award login XP immediately
        if (type === "login") {
          await this.ensureUser(key);
          await db
            .update(rewardUsers)
            .set({
              xp: sql`${rewardUsers.xp} + ${rewards.login}`,
              tier: sql`CASE WHEN ${rewardUsers.xp} + ${rewards.login} >= 5000 THEN 'Diamond' WHEN ${rewardUsers.xp} + ${rewards.login} >= 2000 THEN 'Gold' WHEN ${rewardUsers.xp} + ${rewards.login} >= 500 THEN 'Silver' ELSE 'Bronze' END`,
              level: sql`GREATEST(1, FLOOR((${rewardUsers.xp} + ${rewards.login}) / 100) + 1)`,
            })
            .where(eq(rewardUsers.wallet_address, key));
        }
      }

      results.push({
        id: q.id,
        wallet_address: q.wallet_address,
        date: q.date,
        quest_type: q.quest_type as DailyQuest["quest_type"],
        target: q.target,
        progress: Number(q.progress),
        completed: q.completed,
        xp_reward: q.xp_reward,
        claimed: q.claimed,
      });
    }
    return results;
  }

  async claimQuest(wallet: string, questType: DailyQuest["quest_type"]): Promise<{ xpAwarded: number } | null> {
    const key = wallet.toLowerCase();
    const today = todayUTC();
    const [q] = await db
      .select()
      .from(dailyQuests)
      .where(
        and(
          eq(dailyQuests.wallet_address, key),
          eq(dailyQuests.date, today),
          eq(dailyQuests.quest_type, questType)
        )
      )
      .limit(1);

    if (!q || !q.completed || q.claimed) return null;

    await db
      .update(dailyQuests)
      .set({ claimed: true })
      .where(eq(dailyQuests.id, q.id));

    await db
      .update(rewardUsers)
      .set({
        xp: sql`${rewardUsers.xp} + ${q.xp_reward}`,
        tier: sql`CASE WHEN ${rewardUsers.xp} + ${q.xp_reward} >= 5000 THEN 'Diamond' WHEN ${rewardUsers.xp} + ${q.xp_reward} >= 2000 THEN 'Gold' WHEN ${rewardUsers.xp} + ${q.xp_reward} >= 500 THEN 'Silver' ELSE 'Bronze' END`,
        level: sql`GREATEST(1, FLOOR((${rewardUsers.xp} + ${q.xp_reward}) / 100) + 1)`,
      })
      .where(eq(rewardUsers.wallet_address, key));

    return { xpAwarded: q.xp_reward };
  }

  async getSwapHistory(wallet: string, limit = 20): Promise<SwapEvent[]> {
    const rows = await db
      .select()
      .from(swapEvents)
      .where(eq(swapEvents.wallet_address, wallet.toLowerCase()))
      .orderBy(desc(swapEvents.timestamp))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      wallet_address: r.wallet_address,
      tx_hash: r.tx_hash,
      sell_symbol: r.sell_symbol,
      buy_symbol: r.buy_symbol,
      volume_usd: Number(r.volume_usd),
      xp_earned: r.xp_earned,
      cashback_usd: Number(r.cashback_usd),
      timestamp: new Date(r.timestamp ?? Date.now()).getTime(),
      verified: r.verified,
    }));
  }

  async getLeaderboard(limit = 10): Promise<RewardUser[]> {
    const rows = await db
      .select()
      .from(rewardUsers)
      .orderBy(desc(rewardUsers.xp))
      .limit(limit);

    return rows.map((r) => ({
      wallet_address: r.wallet_address,
      xp: r.xp,
      weekly_xp: r.weekly_xp,
      cashback_usd: Number(r.cashback_usd),
      total_swaps: r.total_swaps,
      streak: r.streak,
      last_activity_date: r.last_activity_date,
      tier: r.tier as RewardUser["tier"],
      total_volume_usd: Number(r.total_volume_usd),
      level: r.level,
      created_at: new Date(r.created_at ?? Date.now()).getTime(),
    }));
  }

  async getTotalStats() {
    const [usersRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(rewardUsers);
    const [swapsRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(swapEvents);
    const aggRows = await db
      .select({
        totalXp: sql<number>`COALESCE(SUM(${rewardUsers.xp}), 0)`,
        totalCashback: sql<number>`COALESCE(SUM(${rewardUsers.cashback_usd}), 0)`,
      })
      .from(rewardUsers);
    const agg = aggRows[0] ?? { totalXp: 0, totalCashback: 0 };

    return {
      totalXp: Number(agg.totalXp ?? 0),
      totalCashbackUsd: Number(agg.totalCashback ?? 0),
      totalUsers: Number(usersRow?.count ?? 0),
      totalSwapEvents: Number(swapsRow?.count ?? 0),
    };
  }
}

export const rewardsStorage = new RewardsStorage();
