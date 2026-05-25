import { useState, useEffect } from "react";
import { useWalletContext } from "@/context/WalletContext";
import {
  useRewardUser, useDailyQuests, useRewardHistory, useLeaderboard, useClaimQuest,
  tierProgress, TIER_THRESHOLDS, type RewardUser, type DailyQuest, type SwapEvent,
} from "@/hooks/useRewards";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortWallet(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function fmtUsd(n: number) {
  if (n >= 1000) return "$" + (n / 1000).toFixed(2) + "k";
  return "$" + n.toFixed(2);
}

function fmtXP(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function relTime(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function nextMidnightUTC() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime();
}

// ─── XP / Tier progress bar ───────────────────────────────────────────────────
function TierProgress({ user }: { user: RewardUser }) {
  const tp = tierProgress(user.xp);
  const tierColors: Record<string, string> = {
    Bronze: "#cd7f32", Silver: "#9aa0ad", Gold: "#f5c518", Diamond: "#7df9ff",
  };
  const color = tierColors[user.tier] ?? "#2dae50";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[11px] sm:text-[12px] font-bold font-['Inter',sans-serif] tracking-wide"
            style={{ background: color + "22", color, border: `1px solid ${color}55` }}
          >
            {user.tier.toUpperCase()}
          </span>
          <span className="font-['Inter',sans-serif] text-[13px] sm:text-[15px] font-bold text-[#d0d2d6]">
            Level {user.level}
          </span>
        </div>
        {tp.nextTier && (
          <span className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] text-[#6c778a]">
            {tp.xpToNext.toLocaleString()} XP to {tp.nextTier}
          </span>
        )}
      </div>
      <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#101723]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(tp.pct, 100)}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

// ─── Stats card grid ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <article className="flex flex-col gap-1.5 rounded-[14px] sm:rounded-[18px] border border-[#131b27] bg-[#00040e] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center gap-2">
        <span className="text-[18px]">{icon}</span>
        <span className="font-['Inter',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-[#6c778a]">
          {label}
        </span>
      </div>
      <p className="font-['Inter',sans-serif] text-[20px] sm:text-[24px] font-bold leading-none text-[#d0d2d6]">
        {value}
      </p>
      {sub && (
        <p className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] text-[#667082]">{sub}</p>
      )}
    </article>
  );
}

// ─── Quest row ───────────────────────────────────────────────────────────────
function QuestRow({ quest, wallet }: { quest: DailyQuest; wallet: string }) {
  const claim = useClaimQuest(wallet);
  const labels: Record<string, { name: string; desc: string; icon: string }> = {
    swaps:  { name: "Complete 3 Swaps",    desc: "Make any 3 swaps today",          icon: "⚡" },
    volume: { name: "Trade $100 Volume",   desc: "Trade at least $100 in total",    icon: "📈" },
    login:  { name: "Daily Login Bonus",   desc: "Visit SuperSwap today",           icon: "🎁" },
  };
  const info = labels[quest.quest_type] ?? { name: quest.quest_type, desc: "", icon: "✦" };
  const pct = quest.target > 0 ? Math.min((quest.progress / quest.target) * 100, 100) : 100;
  const progressLabel =
    quest.quest_type === "volume"
      ? `$${Math.min(quest.progress, quest.target).toFixed(0)}/$${quest.target}`
      : `${Math.min(quest.progress, quest.target)}/${quest.target}`;

  return (
    <div className="flex items-center gap-3 sm:gap-4 rounded-[12px] sm:rounded-[14px] border border-[#131b27] bg-[#00040e] px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#071020] text-lg sm:text-xl">
        {info.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-['Inter',sans-serif] text-[13px] sm:text-[14px] font-semibold text-[#c8ccd4]">
            {info.name}
          </span>
          <span className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] text-[#3acd5b]">
            +{quest.xp_reward} XP
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-[#101723]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: quest.completed ? "#2dae50" : "#1a5cb0" }}
            />
          </div>
          <span className="font-['Inter',sans-serif] text-[10px] sm:text-[11px] text-[#6c778a]">
            {progressLabel}
          </span>
        </div>
      </div>
      {quest.completed && !quest.claimed && (
        <button
          onClick={() => claim.mutate(quest.quest_type)}
          disabled={claim.isPending}
          className="shrink-0 rounded-[8px] bg-[#0e3a1e] px-3 py-1.5 font-['Inter',sans-serif] text-[12px] font-bold text-[#2dae50] border border-[#1a5c2a] hover:bg-[#143e22] transition-colors disabled:opacity-50"
        >
          Claim
        </button>
      )}
      {quest.claimed && (
        <span className="shrink-0 font-['Inter',sans-serif] text-[12px] text-[#2dae50]">✓</span>
      )}
    </div>
  );
}

// ─── History row ─────────────────────────────────────────────────────────────
function HistoryRow({ event }: { event: SwapEvent }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#0d1624] py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#071020]">
          <span className="text-sm">⚡</span>
        </div>
        <div>
          <p className="font-['Inter',sans-serif] text-[13px] sm:text-[14px] font-medium text-[#c8ccd4]">
            {event.sell_symbol} → {event.buy_symbol}
          </p>
          <p className="font-['Inter',sans-serif] text-[11px] text-[#667082]">
            {relTime(event.timestamp)} · {fmtUsd(event.volume_usd)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-['Inter',sans-serif] text-[12px] sm:text-[13px] font-semibold text-[#3acd5b]">
          +{event.xp_earned} XP
        </span>
        <span className="font-['Inter',sans-serif] text-[11px] text-[#667082]">
          +{fmtUsd(event.cashback_usd)} CB
        </span>
      </div>
    </div>
  );
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────
function LeaderRow({ user, rank, isMe }: { user: RewardUser; rank: number; isMe: boolean }) {
  const tierColors: Record<string, string> = {
    Bronze: "#cd7f32", Silver: "#9aa0ad", Gold: "#f5c518", Diamond: "#7df9ff",
  };
  const color = tierColors[user.tier] ?? "#2dae50";
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className={`flex items-center gap-3 border-b border-[#0d1624] py-3 last:border-0 ${isMe ? "rounded-[8px] bg-[#081420] px-2" : ""}`}>
      <span className="w-6 shrink-0 text-center font-['Inter',sans-serif] text-[13px] sm:text-[14px] font-bold text-[#6c778a]">
        {rank <= 3 ? medals[rank - 1] : rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-['Inter',sans-serif] text-[13px] sm:text-[14px] font-medium text-[#c8ccd4] truncate">
          {isMe ? "You (" + shortWallet(user.wallet_address) + ")" : shortWallet(user.wallet_address)}
        </p>
        <p className="font-['Inter',sans-serif] text-[11px] text-[#667082]">
          {user.total_swaps} swaps · Lv.{user.level}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="font-['Inter',sans-serif] text-[13px] font-bold" style={{ color }}>
          {fmtXP(user.xp)} XP
        </span>
        <span
          className="font-['Inter',sans-serif] text-[10px] font-medium"
          style={{ color: color + "aa" }}
        >
          {user.tier}
        </span>
      </div>
    </div>
  );
}

// ─── Countdown timer ────────────────────────────────────────────────────────
function QuestTimer() {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const tick = () => setSecs(Math.max(0, Math.floor((nextMidnightUTC() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return (
    <span className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] tabular-nums text-[#6c778a]">
      Resets in {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

// ─── Connect prompt ───────────────────────────────────────────────────────────
function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 sm:py-20">
      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#071020] border border-[#131b27]">
        <img src="/figmaAssets/image-30.png" alt="Wallet" className="h-8 w-8 sm:h-10 sm:w-10 object-contain opacity-60" />
      </div>
      <div className="text-center">
        <p className="font-['Inter',sans-serif] text-[18px] sm:text-[20px] font-bold text-[#d0d2d6]">
          Connect Your Wallet
        </p>
        <p className="mt-1 font-['Inter',sans-serif] text-[13px] sm:text-[14px] text-[#6c778a]">
          Connect to view your rewards, XP and track your earnings
        </p>
      </div>
      <button
        onClick={onConnect}
        className="rounded-[22px] border border-[#12352d] bg-[#000d10] px-8 py-3 font-['Inter',sans-serif] text-[15px] sm:text-[16px] font-bold text-[#2ca84c] hover:bg-[#041418] transition-all"
      >
        Connect Wallet
      </button>
    </div>
  );
}

// ─── Main RewardsPage ────────────────────────────────────────────────────────
export function RewardsPage(): JSX.Element {
  const wallet = useWalletContext();
  const [walletOpen, setWalletOpen] = useState(false);
  const addr = wallet.isConnected ? wallet.address : null;

  const { data: user, isLoading: userLoading } = useRewardUser(addr);
  const { data: quests } = useDailyQuests(addr);
  const { data: history } = useRewardHistory(addr);
  const { data: leaderboard } = useLeaderboard();

  // Skeleton while loading
  const loading = userLoading && addr;

  return (
    <>
      <div className="w-full pb-[8px] px-[14px] sm:px-[18px] pt-[12px] sm:pt-[16px]">

        {/* Page header */}
        <div className="mb-4 sm:mb-5 flex items-center justify-between">
          <div>
            <h1 className="font-['Inter',sans-serif] text-[18px] sm:text-[22px] font-bold leading-none text-[#d0d2d6]">
              Rewards
            </h1>
            <p className="mt-1 font-['Inter',sans-serif] text-[11px] sm:text-[12px] text-[#5f6a7c]">
              Earn XP and cashback on every swap
            </p>
          </div>
          {wallet.isConnected && addr && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] font-medium text-[#3acd5b]">
                {shortWallet(addr)}
              </span>
              <span className="font-['Inter',sans-serif] text-[10px] text-[#6c778a]">Base Mainnet</span>
            </div>
          )}
        </div>

        {/* Not connected */}
        {!wallet.isConnected && (
          <ConnectPrompt onConnect={() => setWalletOpen(true)} />
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-20 w-full rounded-[18px] bg-[#0d1624]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded-[14px] bg-[#0d1624]" />
              <div className="h-20 rounded-[14px] bg-[#0d1624]" />
              <div className="h-20 rounded-[14px] bg-[#0d1624]" />
              <div className="h-20 rounded-[14px] bg-[#0d1624]" />
            </div>
          </div>
        )}

        {/* Connected + data loaded */}
        {wallet.isConnected && user && (
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* Tier + XP progress */}
            <div className="rounded-[18px] sm:rounded-[22px] border border-[#131b27] bg-[#00040e] px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-['Inter',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-[#5f6a7c]">
                  XP & Tier Progress
                </p>
                <span className="font-['Inter',sans-serif] text-[18px] sm:text-[20px] font-bold text-[#d0d2d6]">
                  {fmtXP(user.xp)} XP
                </span>
              </div>
              <TierProgress user={user} />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatCard label="Today's Rewards" value={fmtUsd(user.cashback_usd)} sub="Lifetime cashback" icon="💰" />
              <StatCard label="Your Streak"  value={`${user.streak} DAYS`} sub={user.streak > 0 ? "Keep it going!" : "Start today!"} icon="🔥" />
              <StatCard label="Total Swaps"  value={user.total_swaps.toString()} sub={`${fmtUsd(user.total_volume_usd)} volume`} icon="⚡" />
              <StatCard label="Weekly XP"    value={fmtXP(user.weekly_xp)} sub="This week" icon="📊" />
            </div>

            {/* Daily quests */}
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="font-['Inter',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-[#5f6a7c]">
                  Daily Quests
                </h2>
                <QuestTimer />
              </div>
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {quests
                  ? quests.map((q) => <QuestRow key={q.id} quest={q} wallet={addr!} />)
                  : [0, 1, 2].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-[12px] bg-[#0d1624]" />
                    ))}
              </div>
            </section>

            {/* Recent reward history */}
            <section>
              <h2 className="mb-2.5 font-['Inter',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-[#5f6a7c]">
                Recent Reward History
              </h2>
              <div className="rounded-[18px] sm:rounded-[22px] border border-[#131b27] bg-[#00040e] px-4 py-2 sm:px-5">
                {history && history.length > 0 ? (
                  history.map((e) => <HistoryRow key={e.id} event={e} />)
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <span className="text-2xl">⚡</span>
                    <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">
                      No rewards yet — make your first swap to earn XP!
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Leaderboard */}
            <section>
              <h2 className="mb-2.5 font-['Inter',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-[#5f6a7c]">
                XP Leaderboard
              </h2>
              <div className="rounded-[18px] sm:rounded-[22px] border border-[#131b27] bg-[#00040e] px-4 py-2 sm:px-5">
                {leaderboard && leaderboard.length > 0 ? (
                  leaderboard.map((u, i) => (
                    <LeaderRow
                      key={u.wallet_address}
                      user={u}
                      rank={i + 1}
                      isMe={u.wallet_address === addr?.toLowerCase()}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">
                      Be the first to top the leaderboard!
                    </p>
                  </div>
                )}
              </div>
            </section>

          </div>
        )}
      </div>

      {/* Wallet modal */}
      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={async () => {
          setWalletOpen(false);
          await wallet.connect();
        }}
      />
    </>
  );
}
