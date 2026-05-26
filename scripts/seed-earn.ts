import { db } from "../server/db";
import { earnTasks } from "../shared/schema";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

function id() { return randomUUID(); }

const tasks = [
  // Onchain tasks
  { title: "Swap ETH for USDC", description: "Perform a token swap of at least $50 on Base", category: "onchain", task_type: "swap", xp_reward: 50, cashback_reward: "0.25", action_url: "/swap", action_label: "Swap", sort_order: 1 },
  { title: "Swap cbBTC for USDC", description: "Convert cbBTC to stablecoins in one trade", category: "onchain", task_type: "swap", xp_reward: 60, cashback_reward: "0.30", action_url: "/swap", action_label: "Swap", sort_order: 2 },
  { title: "Provide Liquidity", description: "Add liquidity to any pool on the platform", category: "onchain", task_type: "swap", xp_reward: 120, cashback_reward: "0.50", action_url: "/swap", action_label: "Add Liquidity", sort_order: 3 },
  { title: "Bridge Tokens", description: "Bridge tokens cross-chain using our bridge", category: "onchain", task_type: "swap", xp_reward: 80, cashback_reward: "0.40", action_url: "/swap", action_label: "Bridge", sort_order: 4 },
  { title: "Stake & Earn", description: "Stake tokens in the vault to start earning", category: "onchain", task_type: "swap", xp_reward: 100, cashback_reward: "0.45", action_url: "/vault", action_label: "Vault", sort_order: 5 },
  { title: "Trade 3 Times", description: "Complete 3 separate swaps within 24 hours", category: "onchain", task_type: "swap", xp_reward: 90, cashback_reward: "0.35", action_url: "/swap", action_label: "Swap", sort_order: 6 },
  // Offchain tasks
  { title: "Follow on X", description: "Follow our official X (Twitter) account", category: "offchain", task_type: "follow", xp_reward: 25, cashback_reward: "0.10", action_url: "https://x.com", action_label: "Follow", sort_order: 1 },
  { title: "Join Telegram", description: "Join our community Telegram group", category: "offchain", task_type: "join_tg", xp_reward: 20, cashback_reward: "0.05", action_url: "https://t.me", action_label: "Join", sort_order: 2 },
  { title: "Retweet Announcement", description: "Retweet our latest launch announcement", category: "offchain", task_type: "retweet", xp_reward: 15, cashback_reward: "0.05", action_url: "https://x.com", action_label: "Retweet", sort_order: 3 },
  { title: "Like & Comment", description: "Like and comment on our pinned post", category: "offchain", task_type: "like", xp_reward: 15, cashback_reward: "0.05", action_url: "https://x.com", action_label: "Like", sort_order: 4 },
  { title: "Join Discord", description: "Become a member of our Discord server", category: "offchain", task_type: "join_discord", xp_reward: 25, cashback_reward: "0.10", action_url: "https://discord.gg", action_label: "Join", sort_order: 5 },
  { title: "Write a Review", description: "Post a review about us on your socials", category: "offchain", task_type: "post", xp_reward: 40, cashback_reward: "0.15", action_url: "https://x.com", action_label: "Post", sort_order: 6 },
];

async function seed() {
  await db.delete(earnTasks).execute();
  for (const t of tasks) {
    await db.insert(earnTasks).values({ ...t, id: id() }).execute();
  }
  console.log(`Seeded ${tasks.length} earn tasks`);
  process.exit(0);
}

seed();
