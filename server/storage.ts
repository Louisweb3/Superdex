import { randomUUID } from "crypto";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  rewardUsers,
  swapEvents,
  dailyQuests,
  tokenCashback,
  earnTasks,
  taskCompletions,
  adminAnnouncements,
  type User,
  type InsertUser,
  type TokenCashback,
  type EarnTask,
  type InsertEarnTask,
  type TaskCompletion,
  type InsertTaskCompletion,
  type AdminAnnouncement,
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
  weekly_cashback_usd?: number;
  pending_cashback_usd?: number;
  total_swaps: number;
  streak: number;
  last_activity_date: string;
  last_weekly_reset?: string;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  total_volume_usd: number;
  level: number;
  x_username?: string;
  referral_code?: string;
  referred_by?: string;
  referral_bonus_xp?: number;
  referral_milestone_paid?: boolean;
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

export interface TokenCashbackEntry {
  wallet_address: string;
  token_symbol: string;
  token_address: string;
  total_cashback_token: number;
  total_cashback_usd: number;
  swap_count: number;
  last_swap_at: number;
}

export interface DailyQuest {
  id: string;
  wallet_address: string;
  date: string;
  quest_type: "swaps" | "volume" | "login" | "volume_500" | "volume_1k" | "volume_2500" | "volume_5k" | "volume_10k" | "volume_25k" | "volume_100k";
  target: number;
  progress: number;
  completed: boolean;
  xp_reward: number;
  claimed: boolean;
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SUP";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
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
  // 50% of the 0.3% integrator fee = 0.15% of volume
  return parseFloat((volumeUsd * 0.0015).toFixed(6));
}

function weekStartUTC(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day; // Sunday-based week
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
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
      if (!existing.referral_code) {
        const code = generateReferralCode();
        await db.update(rewardUsers).set({ referral_code: code }).where(eq(rewardUsers.wallet_address, key));
        existing.referral_code = code;
      }
      return {
        wallet_address: existing.wallet_address,
        xp: existing.xp,
        weekly_xp: existing.weekly_xp,
        cashback_usd: Number(existing.cashback_usd),
        weekly_cashback_usd: Number(existing.weekly_cashback_usd ?? 0),
        pending_cashback_usd: Number(existing.pending_cashback_usd ?? 0),
        total_swaps: existing.total_swaps,
        streak: existing.streak,
        last_activity_date: existing.last_activity_date,
        last_weekly_reset: existing.last_weekly_reset ?? "",
        tier: existing.tier as RewardUser["tier"],
        total_volume_usd: Number(existing.total_volume_usd),
        level: existing.level,
        x_username: existing.x_username ?? "",
        referral_code: existing.referral_code ?? "",
        referred_by: existing.referred_by ?? "",
        referral_bonus_xp: existing.referral_bonus_xp ?? 0,
        referral_milestone_paid: existing.referral_milestone_paid ?? false,
        created_at: new Date(existing.created_at ?? Date.now()).getTime(),
      };
    }
    const now = new Date();
    const newCode = generateReferralCode();
    await db.insert(rewardUsers).values({
      wallet_address: key,
      xp: 0, weekly_xp: 0, cashback_usd: "0",
      weekly_cashback_usd: "0", pending_cashback_usd: "0",
      total_swaps: 0, streak: 0, last_activity_date: "",
      last_weekly_reset: "", tier: "Bronze", total_volume_usd: "0",
      level: 1, referral_code: newCode, created_at: now,
    });
    return {
      wallet_address: key, xp: 0, weekly_xp: 0, cashback_usd: 0,
      weekly_cashback_usd: 0, pending_cashback_usd: 0,
      total_swaps: 0, streak: 0, last_activity_date: "",
      last_weekly_reset: "", tier: "Bronze", total_volume_usd: 0, level: 1,
      referral_code: newCode, referred_by: "", referral_bonus_xp: 0, referral_milestone_paid: false,
      created_at: now.getTime(),
    };
  }

  // ── Reset weekly cashback if a new week has started ─────────────────────────────
  private async maybeResetWeeklyCashback(user: RewardUser): Promise<RewardUser> {
    const currentWeek = weekStartUTC();
    if (user.last_weekly_reset === currentWeek) return user;

    // New week: flush weekly_cashback into pending (it becomes claimable)
    const flushToPending = (user.weekly_cashback_usd ?? 0);
    const newPending = (user.pending_cashback_usd ?? 0) + flushToPending;

    await db
      .update(rewardUsers)
      .set({
        weekly_cashback_usd: "0",
        pending_cashback_usd: String(newPending),
        weekly_xp: 0,
        last_weekly_reset: currentWeek,
      })
      .where(eq(rewardUsers.wallet_address, user.wallet_address));

    return {
      ...user,
      weekly_cashback_usd: 0,
      pending_cashback_usd: newPending,
      weekly_xp: 0,
      last_weekly_reset: currentWeek,
    };
  }

  async getUser(wallet: string): Promise<RewardUser | undefined> {
    const user = await this.ensureUser(wallet);
    return this.maybeResetWeeklyCashback(user);
  }

  async upsertUser(wallet: string): Promise<RewardUser> {
    const user = await this.ensureUser(wallet);
    return this.maybeResetWeeklyCashback(user);
  }

  async recordTokenCashback(
    wallet: string,
    tokenSymbol: string,
    tokenAddress: string,
    cashbackToken: number,
    cashbackUsd: number
  ): Promise<void> {
    const key = wallet.toLowerCase();
    const [existing] = await db
      .select()
      .from(tokenCashback)
      .where(
        and(
          eq(tokenCashback.wallet_address, key),
          eq(tokenCashback.token_symbol, tokenSymbol),
          eq(tokenCashback.token_address, tokenAddress.toLowerCase())
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(tokenCashback)
        .set({
          total_cashback_token: String(Number(existing.total_cashback_token) + cashbackToken),
          total_cashback_usd: String(Number(existing.total_cashback_usd) + cashbackUsd),
          swap_count: existing.swap_count + 1,
          last_swap_at: new Date(),
        })
        .where(eq(tokenCashback.id, existing.id));
    } else {
      await db.insert(tokenCashback).values({
        wallet_address: key,
        token_symbol: tokenSymbol,
        token_address: tokenAddress.toLowerCase(),
        total_cashback_token: String(cashbackToken),
        total_cashback_usd: String(cashbackUsd),
        swap_count: 1,
        last_swap_at: new Date(),
      });
    }
  }

  async getTokenCashbacks(wallet: string): Promise<TokenCashbackEntry[]> {
    const key = wallet.toLowerCase();
    const rows = await db
      .select()
      .from(tokenCashback)
      .where(eq(tokenCashback.wallet_address, key))
      .orderBy(desc(tokenCashback.total_cashback_usd));

    return rows.map((r) => ({
      wallet_address: r.wallet_address,
      token_symbol: r.token_symbol,
      token_address: r.token_address,
      total_cashback_token: Number(r.total_cashback_token),
      total_cashback_usd: Number(r.total_cashback_usd),
      swap_count: r.swap_count,
      last_swap_at: new Date(r.last_swap_at ?? Date.now()).getTime(),
    }));
  }

  async recordSwap(
    wallet: string,
    txHash: string,
    sellSymbol: string,
    buySymbol: string,
    volumeUsd: number,
    opts?: { verified?: boolean; tokenAddress?: string; tokenPrice?: number }
  ): Promise<{ user: RewardUser; xpEarned: number; cashbackUsd: number }> {
    const key = wallet.toLowerCase();
    let user = await this.ensureUser(key);
    const today = todayUTC();

    // Reset weekly stats if new week started
    user = await this.maybeResetWeeklyCashback(user);

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
    const isVerified = opts?.verified ?? false;

    const newXp = user.xp + xpEarned;
    const newWeeklyXp = user.weekly_xp + xpEarned;
    const newSwaps = user.total_swaps + 1;
    const newVolume = user.total_volume_usd + volumeUsd;
    const newTier = tierFromXP(newXp);
    const newLevel = levelFromXP(newXp);

    // Cashback only awarded for verified swaps (Basescan-confirmed)
    const addWeeklyCashback = isVerified ? cashbackUsd : 0;
    const newWeeklyCashback = (user.weekly_cashback_usd ?? 0) + addWeeklyCashback;

    await db
      .update(rewardUsers)
      .set({
        xp: newXp,
        weekly_xp: newWeeklyXp,
        weekly_cashback_usd: String(newWeeklyCashback),
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
      verified: isVerified,
    });

    // Update per-token cashback
    const tokenAddr = opts?.tokenAddress ?? "";
    const tokenPrice = opts?.tokenPrice ?? 0;
    if (tokenAddr && cashbackUsd > 0) {
      const cashbackToken = tokenPrice > 0 ? cashbackUsd / tokenPrice : 0;
      await this.recordTokenCashback(
        key, sellSymbol, tokenAddr, cashbackToken, cashbackUsd
      );
    }

    // Update quest progress
    await this.updateQuestProgressDB(key, today, "swaps", 1);
    await this.updateQuestProgressDB(key, today, "volume", volumeUsd);
    await this.updateQuestProgressDB(key, today, "volume_500", volumeUsd);
    await this.updateQuestProgressDB(key, today, "volume_1k", volumeUsd);
    await this.updateQuestProgressDB(key, today, "volume_2500", volumeUsd);
    await this.updateQuestProgressDB(key, today, "volume_5k", volumeUsd);
    await this.updateQuestProgressDB(key, today, "volume_10k", volumeUsd);
    await this.updateQuestProgressDB(key, today, "volume_25k", volumeUsd);
    await this.updateQuestProgressDB(key, today, "volume_100k", volumeUsd);

    // ── Referral XP: award 35% of xpEarned to referrer, + 500 XP milestone ──
    const [userRow] = await db.select().from(rewardUsers).where(eq(rewardUsers.wallet_address, key)).limit(1);
    const referredBy = userRow?.referred_by ?? "";
    const milestonePaid = userRow?.referral_milestone_paid ?? false;
    if (referredBy) {
      const [refRow] = await db.select().from(rewardUsers).where(eq(rewardUsers.wallet_address, referredBy)).limit(1);
      if (refRow) {
        let refBonus = Math.floor(xpEarned * 0.35);
        let milestoneBonus = 0;
        if (!milestonePaid && user.total_volume_usd < 100 && newVolume >= 100) {
          milestoneBonus = 500;
          await db.update(rewardUsers).set({ referral_milestone_paid: true }).where(eq(rewardUsers.wallet_address, key));
        }
        const totalBonus = refBonus + milestoneBonus;
        if (totalBonus > 0) {
          const refNewXp = refRow.xp + totalBonus;
          await db.update(rewardUsers).set({
            xp: refNewXp,
            weekly_xp: refRow.weekly_xp + totalBonus,
            level: levelFromXP(refNewXp),
            tier: tierFromXP(refNewXp),
            referral_bonus_xp: (refRow.referral_bonus_xp ?? 0) + totalBonus,
          }).where(eq(rewardUsers.wallet_address, referredBy));
        }
      }
    }

    const updated: RewardUser = {
      ...user,
      xp: newXp,
      weekly_xp: newWeeklyXp,
      weekly_cashback_usd: newWeeklyCashback,
      total_swaps: newSwaps,
      streak: newStreak,
      last_activity_date: today,
      tier: newTier,
      total_volume_usd: newVolume,
      level: newLevel,
    };
    return { user: updated, xpEarned, cashbackUsd: addWeeklyCashback };
  }

  // ── Claim weekly cashback (moves pending → lifetime claimed) ──────────────────────────────────
  async claimCashback(wallet: string): Promise<{ claimed: number; user: RewardUser }> {
    const key = wallet.toLowerCase();
    let user = await this.ensureUser(key);
    user = await this.maybeResetWeeklyCashback(user);

    const claimable = user.pending_cashback_usd ?? 0;
    if (claimable <= 0) return { claimed: 0, user };

    const newLifetime = user.cashback_usd + claimable;
    const newPending = 0;

    await db
      .update(rewardUsers)
      .set({
        cashback_usd: String(newLifetime),
        pending_cashback_usd: String(newPending),
      })
      .where(eq(rewardUsers.wallet_address, key));

    const updated: RewardUser = {
      ...user,
      cashback_usd: newLifetime,
      pending_cashback_usd: newPending,
    };
    return { claimed: claimable, user: updated };
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
    const types: DailyQuest["quest_type"][] = [
      "login", "swaps", "volume",
      "volume_500", "volume_1k", "volume_2500",
      "volume_5k", "volume_10k", "volume_25k", "volume_100k",
    ];
    const targets: Record<string, number> = {
      swaps: 3, volume: 100, login: 1,
      volume_500: 500, volume_1k: 1000, volume_2500: 2500,
      volume_5k: 5000, volume_10k: 10000, volume_25k: 25000, volume_100k: 100000,
    };
    const rewards: Record<string, number> = {
      swaps: 50, volume: 100, login: 25,
      volume_500: 400, volume_1k: 1000, volume_2500: 3000,
      volume_5k: 6000, volume_10k: 12500, volume_25k: 30000, volume_100k: 125000,
    };
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
      weekly_cashback_usd: Number(r.weekly_cashback_usd ?? 0),
      pending_cashback_usd: Number(r.pending_cashback_usd ?? 0),
      total_swaps: r.total_swaps,
      streak: r.streak,
      last_activity_date: r.last_activity_date,
      last_weekly_reset: r.last_weekly_reset ?? "",
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
        totalPending: sql<number>`COALESCE(SUM(${rewardUsers.pending_cashback_usd}), 0)`,
        totalWeekly: sql<number>`COALESCE(SUM(${rewardUsers.weekly_cashback_usd}), 0)`,
      })
      .from(rewardUsers);
    const agg = aggRows[0] ?? { totalXp: 0, totalCashback: 0, totalPending: 0, totalWeekly: 0 };

    return {
      totalXp: Number(agg.totalXp ?? 0),
      totalCashbackUsd: Number(agg.totalCashback ?? 0),
      totalPendingCashbackUsd: Number(agg.totalPending ?? 0),
      totalWeeklyCashbackUsd: Number(agg.totalWeekly ?? 0),
      totalUsers: Number(usersRow?.count ?? 0),
      totalSwapEvents: Number(swapsRow?.count ?? 0),
    };
  }

  async getDailyVolume(days: number): Promise<{ date: string; volume: number; swaps: number }[]> {
    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(DATE_TRUNC('day', ${swapEvents.timestamp}), 'Mon DD')`,
        volume: sql<number>`COALESCE(SUM(CAST(${swapEvents.volume_usd} AS NUMERIC)), 0)`,
        swaps: sql<number>`COUNT(*)`,
      })
      .from(swapEvents)
      .where(sql`${swapEvents.timestamp} >= NOW() - INTERVAL '${sql.raw(String(days))} days'`)
      .groupBy(sql`DATE_TRUNC('day', ${swapEvents.timestamp})`)
      .orderBy(sql`DATE_TRUNC('day', ${swapEvents.timestamp})`);

    return rows.map((r) => ({
      date: r.date,
      volume: Number(r.volume),
      swaps: Number(r.swaps),
    }));
  }

  async getTopPairs(limit = 10): Promise<{ pair: string; volume: number; swaps: number; change24h: number }[]> {
    const rows = await db
      .select({
        sell: swapEvents.sell_symbol,
        buy: swapEvents.buy_symbol,
        volume: sql<number>`COALESCE(SUM(CAST(${swapEvents.volume_usd} AS NUMERIC)), 0)`,
        swaps: sql<number>`COUNT(*)`,
        vol24h: sql<number>`COALESCE(SUM(CASE WHEN ${swapEvents.timestamp} >= NOW() - INTERVAL '24 hours' THEN CAST(${swapEvents.volume_usd} AS NUMERIC) ELSE 0 END), 0)`,
        vol48h: sql<number>`COALESCE(SUM(CASE WHEN ${swapEvents.timestamp} >= NOW() - INTERVAL '48 hours' AND ${swapEvents.timestamp} < NOW() - INTERVAL '24 hours' THEN CAST(${swapEvents.volume_usd} AS NUMERIC) ELSE 0 END), 0)`,
      })
      .from(swapEvents)
      .groupBy(swapEvents.sell_symbol, swapEvents.buy_symbol)
      .orderBy(sql`COALESCE(SUM(CAST(${swapEvents.volume_usd} AS NUMERIC)), 0) DESC`)
      .limit(limit);

    return rows.map((r) => {
      const v24 = Number(r.vol24h);
      const v48 = Number(r.vol48h);
      const change = v48 > 0 ? ((v24 - v48) / v48) * 100 : v24 > 0 ? 100 : 0;
      return {
        pair: `${r.sell} / ${r.buy}`,
        volume: Number(r.volume),
        swaps: Number(r.swaps),
        change24h: parseFloat(change.toFixed(2)),
      };
    });
  }

  async getDailyUsers(days: number): Promise<{ date: string; users: number }[]> {
    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(DATE_TRUNC('day', ${rewardUsers.created_at}), 'Mon DD')`,
        users: sql<number>`COUNT(*)`,
      })
      .from(rewardUsers)
      .where(sql`${rewardUsers.created_at} >= NOW() - INTERVAL '${sql.raw(String(days))} days'`)
      .groupBy(sql`DATE_TRUNC('day', ${rewardUsers.created_at})`)
      .orderBy(sql`DATE_TRUNC('day', ${rewardUsers.created_at})`);

    return rows.map((r) => ({
      date: r.date,
      users: Number(r.users),
    }));
  }

  async getVolumeStats() {
    const [totalRow] = await db
      .select({
        totalVolume: sql<number>`COALESCE(SUM(CAST(${swapEvents.volume_usd} AS NUMERIC)), 0)`,
        totalSwaps: sql<number>`COUNT(*)`,
      })
      .from(swapEvents);

    const [vol24hRow] = await db
      .select({
        volume: sql<number>`COALESCE(SUM(CAST(${swapEvents.volume_usd} AS NUMERIC)), 0)`,
        swaps: sql<number>`COUNT(*)`,
      })
      .from(swapEvents)
      .where(sql`${swapEvents.timestamp} >= NOW() - INTERVAL '24 hours'`);

    const [vol48hRow] = await db
      .select({
        volume: sql<number>`COALESCE(SUM(CAST(${swapEvents.volume_usd} AS NUMERIC)), 0)`,
      })
      .from(swapEvents)
      .where(sql`${swapEvents.timestamp} >= NOW() - INTERVAL '48 hours' AND ${swapEvents.timestamp} < NOW() - INTERVAL '24 hours'`);

    const [users24hRow] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${swapEvents.wallet_address})` })
      .from(swapEvents)
      .where(sql`${swapEvents.timestamp} >= NOW() - INTERVAL '24 hours'`);

    const [totalUsersRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(rewardUsers);

    const v24 = Number(vol24hRow?.volume ?? 0);
    const v48 = Number(vol48hRow?.volume ?? 0);
    const volumeChange = v48 > 0 ? ((v24 - v48) / v48) * 100 : v24 > 0 ? 100 : 0;

    const totalVol = Number(totalRow?.totalVolume ?? 0);
    const totalSwaps = Number(totalRow?.totalSwaps ?? 0);
    const totalFees = totalVol * 0.003;
    const swapFees = totalFees * 0.769;
    const liquidityFees = totalFees * 0.154;
    const platformFees = totalFees * 0.077;

    return {
      totalVolume: totalVol,
      totalFees,
      totalSwaps,
      totalUsers: Number(totalUsersRow?.count ?? 0),
      volume24h: v24,
      swaps24h: Number(vol24hRow?.swaps ?? 0),
      activeUsers24h: Number(users24hRow?.count ?? 0),
      volumeChange24h: parseFloat(volumeChange.toFixed(2)),
      fees: { swap: swapFees, liquidity: liquidityFees, platform: platformFees },
    };
  }

  async applyReferralCode(wallet: string, code: string): Promise<{ ok: boolean; error?: string }> {
    const key = wallet.toLowerCase();
    const user = await this.ensureUser(key);
    if (user.referred_by) return { ok: false, error: "Already referred" };
    const upperCode = code.trim().toUpperCase();
    const [codeOwner] = await db.select().from(rewardUsers).where(eq(rewardUsers.referral_code, upperCode)).limit(1);
    if (!codeOwner) return { ok: false, error: "Invalid referral code" };
    if (codeOwner.wallet_address === key) return { ok: false, error: "Cannot use your own referral code" };
    await db.update(rewardUsers).set({ referred_by: codeOwner.wallet_address }).where(eq(rewardUsers.wallet_address, key));
    return { ok: true };
  }

  async getReferralStats(wallet: string): Promise<{
    referral_code: string;
    referral_count: number;
    referral_bonus_xp: number;
    milestone_count: number;
    referred_by: string;
  }> {
    const key = wallet.toLowerCase();
    const user = await this.ensureUser(key);
    const referrals = await db.select().from(rewardUsers).where(eq(rewardUsers.referred_by, key));
    const milestone_count = referrals.filter((r) => r.referral_milestone_paid).length;
    return {
      referral_code: user.referral_code ?? "",
      referral_count: referrals.length,
      referral_bonus_xp: user.referral_bonus_xp ?? 0,
      milestone_count,
      referred_by: user.referred_by ?? "",
    };
  }
}

export const rewardsStorage = new RewardsStorage();

// ─── Earn System Storage ────────────────────────────────────────────────────────────────
import { asc, gte } from "drizzle-orm";

export class EarnStorage {
  async getTasks(type?: string): Promise<EarnTask[]> {
    const rows = await db.select().from(earnTasks).where(eq(earnTasks.active, true)).orderBy(asc(earnTasks.sort_order));
    if (type) return rows.filter((r) => r.type === type);
    return rows;
  }
  async getTask(id: string): Promise<EarnTask | undefined> {
    const [row] = await db.select().from(earnTasks).where(eq(earnTasks.id, id)).limit(1);
    return row;
  }
  async createTask(task: Omit<InsertEarnTask, "id">): Promise<EarnTask> {
    const id = randomUUID();
    const [row] = await db.insert(earnTasks).values({ ...task, id }).returning();
    return row;
  }
  async updateTask(id: string, updates: Partial<InsertEarnTask>): Promise<EarnTask | undefined> {
    const [existing] = await db.select().from(earnTasks).where(eq(earnTasks.id, id)).limit(1);
    if (!existing) return undefined;
    await db.update(earnTasks).set(updates).where(eq(earnTasks.id, id));
    const [row] = await db.select().from(earnTasks).where(eq(earnTasks.id, id)).limit(1);
    return row;
  }
  async deleteTask(id: string): Promise<void> {
    await db.delete(earnTasks).where(eq(earnTasks.id, id));
  }
  async getCompletions(wallet: string): Promise<(TaskCompletion & { task?: EarnTask })[]> {
    const key = wallet.toLowerCase();
    const comps = await db.select().from(taskCompletions).where(eq(taskCompletions.wallet_address, key));
    const tasks = await this.getTasks();
    return comps.map((c) => ({ ...c, task: tasks.find((t) => t.id === c.task_id) }));
  }
  async getOrCreateCompletion(wallet: string, taskId: string): Promise<TaskCompletion> {
    const key = wallet.toLowerCase();
    const [existing] = await db.select().from(taskCompletions).where(and(eq(taskCompletions.wallet_address, key), eq(taskCompletions.task_id, taskId))).limit(1);
    if (existing) return existing;
    const task = await this.getTask(taskId);
    if (!task) throw new Error("Task not found");
    const [inserted] = await db.insert(taskCompletions).values({ id: randomUUID(), wallet_address: key, task_id: taskId, progress: "0", target_value: task.type === "onchain" ? String(task.target_value ?? 0) : String(task.target_count ?? 1), completed: false, claimed: false }).returning();
    return inserted;
  }
  async updateCompletionProgress(wallet: string, taskId: string, amount: number): Promise<TaskCompletion> {
    const key = wallet.toLowerCase();
    const comp = await this.getOrCreateCompletion(key, taskId);
    const task = await this.getTask(taskId);
    if (!task || comp.completed) return comp;
    const target = Number(comp.target_value || (task.type === "onchain" ? task.target_value : task.target_count));
    const newProgress = Math.min(Number(comp.progress) + amount, target);
    const completed = newProgress >= target;
    await db.update(taskCompletions).set({ progress: String(newProgress), completed }).where(eq(taskCompletions.id, comp.id));
    const [updated] = await db.select().from(taskCompletions).where(eq(taskCompletions.id, comp.id)).limit(1);
    return updated;
  }
  async claimTask(wallet: string, taskId: string): Promise<{ success: boolean; xpReward: number; cashbackReward: number; task: EarnTask } | null> {
    const key = wallet.toLowerCase();
    const comp = await this.getOrCreateCompletion(key, taskId);
    if (!comp.completed || comp.claimed) return null;
    const task = await this.getTask(taskId);
    if (!task) return null;
    const now = new Date();
    await db.update(taskCompletions).set({ claimed: true, claimed_at: now }).where(eq(taskCompletions.id, comp.id));
    await rewardsStorage.upsertUser(key);
    const user = await rewardsStorage.getUser(key);
    if (user) {
      const newXp = user.xp + task.xp_reward;
      await db.update(rewardUsers).set({ xp: newXp, weekly_xp: user.weekly_xp + task.xp_reward, level: levelFromXP(newXp), tier: tierFromXP(newXp), weekly_cashback_usd: String(Number(user.weekly_cashback_usd ?? 0) + Number(task.cashback_reward ?? 0)) }).where(eq(rewardUsers.wallet_address, key));
    }
    return { success: true, xpReward: task.xp_reward, cashbackReward: Number(task.cashback_reward ?? 0), task };
  }
  async setCompletionProgress(wallet: string, taskId: string, value: number): Promise<TaskCompletion> {
    const key = wallet.toLowerCase();
    const comp = await this.getOrCreateCompletion(key, taskId);
    const task = await this.getTask(taskId);
    if (!task || comp.completed) return comp;
    const target = Number(comp.target_value || (task.type === "onchain" ? task.target_value : task.target_count));
    const newProgress = Math.min(value, target);
    const completed = newProgress >= target;
    await db.update(taskCompletions).set({ progress: String(newProgress), completed }).where(eq(taskCompletions.id, comp.id));
    const [updated] = await db.select().from(taskCompletions).where(eq(taskCompletions.id, comp.id)).limit(1);
    return updated;
  }
  async syncOnchainProgress(wallet: string): Promise<void> {
    const key = wallet.toLowerCase();
    const onchainTasks = await this.getTasks("onchain");
    const user = await rewardsStorage.getUser(key);
    const totalVolume = user?.total_volume_usd ?? 0;
    for (const task of onchainTasks) {
      const comp = await this.getOrCreateCompletion(key, task.id);
      if (comp.completed) continue;
      await this.setCompletionProgress(key, task.id, totalVolume);
    }
  }
  async connectXAccount(wallet: string, xUsername: string): Promise<void> {
    const key = wallet.toLowerCase();
    await rewardsStorage.upsertUser(key);
    await db.update(rewardUsers).set({ x_username: xUsername.replace(/^@/, "").toLowerCase() }).where(eq(rewardUsers.wallet_address, key));
  }
  async getXUsername(wallet: string): Promise<string | null> {
    const key = wallet.toLowerCase();
    const user = await rewardsStorage.getUser(key);
    return user?.x_username ?? null;
  }
  async verifySocialTask(wallet: string, taskId: string): Promise<{ success: boolean; error?: string }> {
    const key = wallet.toLowerCase();
    const user = await rewardsStorage.getUser(key);
    if (!user?.x_username) return { success: false, error: "X account not connected" };
    const task = await this.getTask(taskId);
    if (!task || task.type !== "offchain") return { success: false, error: "Invalid task" };
    const comp = await this.getOrCreateCompletion(key, taskId);
    if (comp.completed) return { success: true };
    const target = task.target_count ?? 1;
    await db.update(taskCompletions).set({ progress: String(target), completed: true }).where(eq(taskCompletions.id, comp.id));
    return { success: true };
  }
  async getAnnouncements(activeOnly = true): Promise<AdminAnnouncement[]> {
    const today = new Date().toISOString().slice(0, 10);
    let query = db.select().from(adminAnnouncements);
    if (activeOnly) {
      query = query.where(and(eq(adminAnnouncements.active, true), gte(adminAnnouncements.end_date, today))) as any;
    }
    const rows = await query.orderBy(desc(adminAnnouncements.created_at));
    return rows;
  }
  async createAnnouncement(data: { title: string; message: string; type?: string; start_date?: string; end_date?: string; icon?: string }): Promise<AdminAnnouncement> {
    const id = randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    const [row] = await db.insert(adminAnnouncements).values({ id, title: data.title, message: data.message, type: data.type ?? "info", active: true, start_date: data.start_date ?? today, end_date: data.end_date ?? today, icon: data.icon ?? "" }).returning();
    return row;
  }
  async updateAnnouncement(id: string, updates: Partial<AdminAnnouncement>): Promise<AdminAnnouncement | undefined> {
    await db.update(adminAnnouncements).set(updates).where(eq(adminAnnouncements.id, id));
    const [row] = await db.select().from(adminAnnouncements).where(eq(adminAnnouncements.id, id)).limit(1);
    return row;
  }
  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(adminAnnouncements).where(eq(adminAnnouncements.id, id));
  }
}

export const earnStorage = new EarnStorage();

// ─── Admin CMS Storage ───────────────────────────────────────────────────────────────────
import { siteSettings, pageBlocks, adminEvents, socialLinks } from "@shared/schema";

export interface CmsPageBlock {
  id: string;
  page: string;
  section: string;
  block_key: string;
  content_type: string;
  value: string;
  sort_order: number;
}

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

export interface CmsSocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  active: boolean;
  sort_order: number;
}

export class AdminStorage {
  // ── Site Settings ───────────────────────────────────────────────────────────────
  async getSetting(key: string): Promise<string | undefined> {
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return row?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing) {
      await db.update(siteSettings).set({ value, updated_at: new Date() }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value, updated_at: new Date() });
    }
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(siteSettings);
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  }

  // ── Page Blocks ─────────────────────────────────────────────────────────────────────────
  async getPageBlocks(page?: string): Promise<CmsPageBlock[]> {
    if (page) {
      return db
        .select()
        .from(pageBlocks)
        .where(eq(pageBlocks.page, page))
        .orderBy(asc(pageBlocks.sort_order));
    }
    return db.select().from(pageBlocks).orderBy(asc(pageBlocks.sort_order));
  }

  async setPageBlock(block: Omit<CmsPageBlock, "id"> & { id?: string }): Promise<CmsPageBlock> {
    const id = block.id ?? randomUUID();
    const [existing] = await db.select().from(pageBlocks).where(eq(pageBlocks.id, id)).limit(1);
    if (existing) {
      await db
        .update(pageBlocks)
        .set({
          page: block.page,
          section: block.section,
          block_key: block.block_key,
          content_type: block.content_type,
          value: block.value,
          sort_order: block.sort_order,
          updated_at: new Date(),
        })
        .where(eq(pageBlocks.id, id));
    } else {
      await db.insert(pageBlocks).values({
        id,
        page: block.page,
        section: block.section,
        block_key: block.block_key,
        content_type: block.content_type,
        value: block.value,
        sort_order: block.sort_order,
        updated_at: new Date(),
      });
    }
    const [row] = await db.select().from(pageBlocks).where(eq(pageBlocks.id, id)).limit(1);
    return row as CmsPageBlock;
  }

  async deletePageBlock(id: string): Promise<void> {
    await db.delete(pageBlocks).where(eq(pageBlocks.id, id));
  }

  // ── Events ───────────────────────────────────────────────────────────────────────────────
  async getEvents(): Promise<CmsEvent[]> {
    const rows = await db.select().from(adminEvents).orderBy(desc(adminEvents.created_at));
    return rows.map((r) => ({ ...r, cashback_multiplier: Number(r.cashback_multiplier) }));
  }

  async createEvent(ev: Omit<CmsEvent, "id">): Promise<CmsEvent> {
    const id = randomUUID();
    await db.insert(adminEvents).values({
      id,
      title: ev.title,
      description: ev.description,
      event_type: ev.event_type,
      start_date: ev.start_date,
      end_date: ev.end_date,
      active: ev.active,
      xp_bonus: ev.xp_bonus,
      cashback_multiplier: String(ev.cashback_multiplier),
      created_at: new Date(),
    });
    const [row] = await db.select().from(adminEvents).where(eq(adminEvents.id, id)).limit(1);
    return { ...row, cashback_multiplier: Number(row.cashback_multiplier) } as CmsEvent;
  }

  async updateEvent(id: string, patch: Partial<CmsEvent>): Promise<CmsEvent | null> {
    const [existing] = await db.select().from(adminEvents).where(eq(adminEvents.id, id)).limit(1);
    if (!existing) return null;
    const setObj: any = {};
    if (patch.title !== undefined) setObj.title = patch.title;
    if (patch.description !== undefined) setObj.description = patch.description;
    if (patch.event_type !== undefined) setObj.event_type = patch.event_type;
    if (patch.start_date !== undefined) setObj.start_date = patch.start_date;
    if (patch.end_date !== undefined) setObj.end_date = patch.end_date;
    if (patch.active !== undefined) setObj.active = patch.active;
    if (patch.xp_bonus !== undefined) setObj.xp_bonus = patch.xp_bonus;
    if (patch.cashback_multiplier !== undefined) setObj.cashback_multiplier = String(patch.cashback_multiplier);
    await db.update(adminEvents).set(setObj).where(eq(adminEvents.id, id));
    const [row] = await db.select().from(adminEvents).where(eq(adminEvents.id, id)).limit(1);
    return { ...row, cashback_multiplier: Number(row.cashback_multiplier) } as CmsEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(adminEvents).where(eq(adminEvents.id, id));
  }

  // ── Social Links ─────────────────────────────────────────────────────────────────────────────────
  async getSocialLinks(): Promise<CmsSocialLink[]> {
    return db.select().from(socialLinks).orderBy(asc(socialLinks.sort_order));
  }

  async upsertSocialLink(link: Partial<CmsSocialLink> & { platform: string; url: string }): Promise<CmsSocialLink> {
    const id = link.id ?? randomUUID();
    const [existing] = await db.select().from(socialLinks).where(eq(socialLinks.id, id)).limit(1);
    if (existing) {
      await db
        .update(socialLinks)
        .set({
          platform: link.platform,
          url: link.url,
          icon: link.icon ?? existing.icon,
          active: link.active ?? existing.active,
          sort_order: link.sort_order ?? existing.sort_order,
          updated_at: new Date(),
        })
        .where(eq(socialLinks.id, id));
    } else {
      await db.insert(socialLinks).values({
        id,
        platform: link.platform,
        url: link.url,
        icon: link.icon ?? "",
        active: link.active ?? true,
        sort_order: link.sort_order ?? 0,
        updated_at: new Date(),
      });
    }
    const [row] = await db.select().from(socialLinks).where(eq(socialLinks.id, id)).limit(1);
    return row as CmsSocialLink;
  }

  async deleteSocialLink(id: string): Promise<void> {
    await db.delete(socialLinks).where(eq(socialLinks.id, id));
  }
}

export const adminStorage = new AdminStorage();
