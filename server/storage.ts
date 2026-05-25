import { randomUUID } from "crypto";
import { type User, type InsertUser } from "@shared/schema";

// ─── Base user storage ──────────────────────────────────────────────────────
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// ─── Rewards types ──────────────────────────────────────────────────────────
export interface RewardUser {
  wallet_address: string;
  xp: number;
  weekly_xp: number;
  cashback_usd: number;
  total_swaps: number;
  streak: number;
  last_activity_date: string;   // YYYY-MM-DD UTC
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
}

export interface DailyQuest {
  id: string;
  wallet_address: string;
  date: string;           // YYYY-MM-DD UTC
  quest_type: "swaps" | "volume" | "login";
  target: number;
  progress: number;
  completed: boolean;
  xp_reward: number;
  claimed: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── In-memory rewards storage ───────────────────────────────────────────────
class RewardsStorage {
  private users = new Map<string, RewardUser>();
  private swapEvents: SwapEvent[] = [];
  private dailyQuests = new Map<string, DailyQuest>();

  private questKey(wallet: string, date: string, type: string) {
    return `${wallet.toLowerCase()}:${date}:${type}`;
  }

  getUser(wallet: string): RewardUser | undefined {
    return this.users.get(wallet.toLowerCase());
  }

  upsertUser(wallet: string): RewardUser {
    const key = wallet.toLowerCase();
    if (!this.users.has(key)) {
      const user: RewardUser = {
        wallet_address: key,
        xp: 0,
        weekly_xp: 0,
        cashback_usd: 0,
        total_swaps: 0,
        streak: 0,
        last_activity_date: "",
        tier: "Bronze",
        total_volume_usd: 0,
        level: 1,
        created_at: Date.now(),
      };
      this.users.set(key, user);
    }
    return this.users.get(key)!;
  }

  recordSwap(
    wallet: string,
    txHash: string,
    sellSymbol: string,
    buySymbol: string,
    volumeUsd: number
  ): { user: RewardUser; xpEarned: number; cashbackUsd: number } {
    const key = wallet.toLowerCase();
    const user = this.upsertUser(key);
    const today = todayUTC();

    // Update streak
    if (user.last_activity_date === today) {
      // same day — streak unchanged
    } else {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      if (user.last_activity_date === yStr) {
        user.streak += 1;
      } else if (user.last_activity_date !== today) {
        user.streak = 1;
      }
    }
    user.last_activity_date = today;

    const xpEarned = xpForSwap(volumeUsd, user.streak);
    const cashbackUsd = cashbackForSwap(volumeUsd);

    user.xp += xpEarned;
    user.weekly_xp += xpEarned;
    user.cashback_usd += cashbackUsd;
    user.total_swaps += 1;
    user.total_volume_usd += volumeUsd;
    user.tier = tierFromXP(user.xp);
    user.level = levelFromXP(user.xp);

    // Record swap event
    const event: SwapEvent = {
      id: randomUUID(),
      wallet_address: key,
      tx_hash: txHash,
      sell_symbol: sellSymbol,
      buy_symbol: buySymbol,
      volume_usd: volumeUsd,
      xp_earned: xpEarned,
      cashback_usd: cashbackUsd,
      timestamp: Date.now(),
    };
    this.swapEvents.unshift(event);
    if (this.swapEvents.length > 500) this.swapEvents.pop();

    // Update swap quest
    this.updateQuestProgress(key, today, "swaps", 1);
    this.updateQuestProgress(key, today, "volume", volumeUsd);

    return { user, xpEarned, cashbackUsd };
  }

  private updateQuestProgress(wallet: string, date: string, type: DailyQuest["quest_type"], amount: number) {
    const k = this.questKey(wallet, date, type);
    if (!this.dailyQuests.has(k)) {
      const targets = { swaps: 3, volume: 100, login: 1 };
      const rewards = { swaps: 50, volume: 100, login: 25 };
      this.dailyQuests.set(k, {
        id: randomUUID(),
        wallet_address: wallet,
        date,
        quest_type: type,
        target: targets[type],
        progress: 0,
        completed: false,
        xp_reward: rewards[type],
        claimed: false,
      });
    }
    const q = this.dailyQuests.get(k)!;
    if (!q.completed) {
      q.progress = Math.min(q.progress + amount, q.target);
      if (q.progress >= q.target) {
        q.completed = true;
      }
    }
  }

  getDailyQuests(wallet: string): DailyQuest[] {
    const key = wallet.toLowerCase();
    const today = todayUTC();
    const types: DailyQuest["quest_type"][] = ["swaps", "volume", "login"];
    const targets = { swaps: 3, volume: 100, login: 1 };
    const rewards = { swaps: 50, volume: 100, login: 25 };

    return types.map((type) => {
      const k = this.questKey(key, today, type);
      if (!this.dailyQuests.has(k)) {
        const q: DailyQuest = {
          id: randomUUID(),
          wallet_address: key,
          date: today,
          quest_type: type,
          target: targets[type],
          progress: type === "login" ? 1 : 0,
          completed: type === "login",
          xp_reward: rewards[type],
          claimed: false,
        };
        this.dailyQuests.set(k, q);
        // Award login XP
        if (type === "login") {
          const user = this.upsertUser(key);
          user.xp += rewards.login;
          user.tier = tierFromXP(user.xp);
          user.level = levelFromXP(user.xp);
        }
      }
      return this.dailyQuests.get(k)!;
    });
  }

  claimQuest(wallet: string, questType: DailyQuest["quest_type"]): { xpAwarded: number } | null {
    const key = wallet.toLowerCase();
    const k = this.questKey(key, todayUTC(), questType);
    const q = this.dailyQuests.get(k);
    if (!q || !q.completed || q.claimed) return null;
    q.claimed = true;
    const user = this.upsertUser(key);
    user.xp += q.xp_reward;
    user.tier = tierFromXP(user.xp);
    user.level = levelFromXP(user.xp);
    return { xpAwarded: q.xp_reward };
  }

  getSwapHistory(wallet: string, limit = 20): SwapEvent[] {
    return this.swapEvents
      .filter((e) => e.wallet_address === wallet.toLowerCase())
      .slice(0, limit);
  }

  getLeaderboard(limit = 10): RewardUser[] {
    return Array.from(this.users.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);
  }

  getTotalStats() {
    let totalXp = 0;
    let totalCashback = 0;
    let totalUsers = this.users.size;
    for (const u of this.users.values()) {
      totalXp += u.xp;
      totalCashback += u.cashback_usd;
    }
    return { totalXp, totalCashbackUsd: totalCashback, totalUsers, totalSwapEvents: this.swapEvents.length };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const rewardsStorage = new RewardsStorage();

// ─── Base user storage ────────────────────────────────────────────────────────
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
