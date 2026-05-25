import { useState, useEffect } from "react";
import { useWalletContext } from "@/context/WalletContext";

import {
  useRewardUser,
  useDailyQuests,
  useRewardHistory,
  useLeaderboard,
  useClaimQuest,
  tierProgress,
} from "@/hooks/useRewards";

import { ConnectWalletModal } from "@/components/ConnectWalletModal";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function shortWallet(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function fmtUsd(n: number) {
  return "$" + n.toFixed(2);
}

function fmtXP(n: number) {
  return n.toLocaleString();
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

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1
    )
  ).getTime();
}

// ─────────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────────

function QuestTimer() {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const tick = () => {
      setSecs(
        Math.max(
          0,
          Math.floor((nextMidnightUTC() - Date.now()) / 1000)
        )
      );
    };

    tick();

    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  return (
    <span className="text-[13px] text-[#00ff85] font-medium">
      {String(h).padStart(2, "0")}:
      {String(m).padStart(2, "0")}:
      {String(s).padStart(2, "0")} until reset
    </span>
  );
}

// ─────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-[#103126] bg-[#08131c] p-5 shadow-[0_0_40px_rgba(0,255,140,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// CONNECT PROMPT
// ─────────────────────────────────────────────

function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <DashboardCard className="max-w-[420px] w-full text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#0f3b2d] bg-[#061018]">
          <span className="text-[32px]">⚡</span>
        </div>

        <h2 className="mt-6 text-[34px] font-black text-white">
          Connect Wallet
        </h2>

        <p className="mt-3 text-[#7e8b9d]">
          Connect your wallet to view rewards and XP progress
        </p>

        <button
          onClick={onConnect}
          className="mt-7 w-full rounded-[18px] bg-gradient-to-r from-[#00ff85] to-[#00c26e] px-5 py-4 text-[15px] font-bold text-black transition-all hover:brightness-110"
        >
          Connect Wallet
        </button>
      </DashboardCard>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export function SwapPage(): JSX.Element {
  const wallet = useWalletContext();

  const [walletOpen, setWalletOpen] = useState(false);

  const addr = wallet.isConnected ? wallet.address : null;

  const { data: user } = useRewardUser(addr);

  const { data: quests } = useDailyQuests(addr);

  const { data: history } = useRewardHistory(addr);

  const { data: leaderboard } = useLeaderboard();

  const claim = useClaimQuest(addr || "");

  return (
    <>
      <div className="min-h-screen bg-[#040b11] text-white">
        <div className="mx-auto max-w-[1350px] px-4 py-5 lg:px-6">

          {/* HEADER */}

          <div className="mb-6 flex items-center justify-between border-b border-[#0d1e18] pb-5">

            <div>
              <h1 className="text-[42px] font-black leading-none">
                Rewards
              </h1>

              <p className="mt-2 text-[#7e8b9d]">
                Trade more. Earn more. Unlock bigger rewards.
              </p>
            </div>

            {!wallet.isConnected ? (
              <button
                onClick={() => setWalletOpen(true)}
                className="rounded-[16px] border border-[#0f3d2d] bg-[#071118] px-6 py-3 text-[#00ff85] transition-all hover:bg-[#0b1d14]"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="rounded-[16px] border border-[#0f3d2d] bg-[#071118] px-5 py-3">
                <p className="text-[#00ff85] font-semibold">
                  {shortWallet(addr!)}
                </p>

                <p className="text-[12px] text-[#6f7c8f]">
                  Base Mainnet
                </p>
              </div>
            )}
          </div>

          {!wallet.isConnected && (
            <ConnectPrompt onConnect={() => setWalletOpen(true)} />
          )}

          {wallet.isConnected && user && (
            <div className="grid grid-cols-12 gap-5">

              {/* HERO */}

              <DashboardCard className="col-span-12 lg:col-span-7 overflow-hidden relative">

                <div className="absolute right-[-50px] top-[-50px] h-[200px] w-[200px] rounded-full bg-[#00ff8530] blur-[100px]" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

                  <div>
                    <p className="text-[13px] uppercase tracking-[0.2em] text-[#7e8b9d]">
                      Total Rewards Earned
                    </p>

                    <h2 className="mt-4 text-[64px] font-black text-[#00ff85] leading-none">
                      {fmtUsd(user.total_rewards || 124.58)}
                    </h2>

                    <p className="mt-3 text-[#a0aec0]">
                      ≈ 0.0368 ETH
                    </p>
                  </div>

                  <div className="flex h-[240px] items-center justify-center">
                    <div className="flex h-[180px] w-[180px] items-center justify-center rounded-[40px] border border-[#0f3d2d] bg-[#071118] shadow-[0_0_50px_rgba(0,255,140,0.25)]">
                      <span className="text-[90px]">🎁</span>
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* STREAK */}

              <DashboardCard className="col-span-12 lg:col-span-5">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-semibold">
                      Your Streak
                    </p>

                    <h2 className="mt-4 text-[58px] font-black leading-none">
                      7
                    </h2>

                    <p className="mt-2 text-[#7e8b9d]">
                      Days
                    </p>
                  </div>

                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#743312] bg-[#1a120c] text-[28px]">
                    🔥
                  </div>
                </div>

                <div className="mt-10 flex items-center justify-between">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                          i < 6
                            ? "border-[#00ff85] bg-[#00ff8510]"
                            : "border-[#743312] bg-[#1a120c]"
                        }`}
                      >
                        {i < 6 ? "✓" : "$"}
                      </div>

                      <span className="text-[12px] text-[#7e8b9d]">
                        {d}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <span className="text-[#7e8b9d]">
                    Next reward in 1 day
                  </span>

                  <span className="font-bold text-[#00ff85]">
                    +10 XP
                  </span>
                </div>
              </DashboardCard>

              {/* STATS */}

              {[
                {
                  title: "Rewards Earned Today",
                  value: "$12.47",
                  sub: "≈ 0.0037 ETH",
                  color: "#00ff85",
                },
                {
                  title: "Total Swaps",
                  value: "23",
                  sub: "Total transactions",
                  color: "#8b5cf6",
                },
                {
                  title: "XP Balance",
                  value: `${fmtXP(user.xp)} XP`,
                  sub: `Level ${user.level}`,
                  color: "#22d3ee",
                },
                {
                  title: "Lifetime Cashback",
                  value: "$87.22",
                  sub: "≈ 0.0256 ETH",
                  color: "#00ff85",
                },
              ].map((card, i) => (
                <DashboardCard
                  key={i}
                  className="col-span-12 sm:col-span-6 lg:col-span-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[14px] text-[#9aa8ba]">
                        {card.title}
                      </p>

                      <h3
                        className="mt-5 text-[42px] font-black leading-none"
                        style={{ color: card.color }}
                      >
                        {card.value}
                      </h3>

                      <p className="mt-3 text-[#7e8b9d]">
                        {card.sub}
                      </p>
                    </div>

                    <div
                      className="h-12 w-12 rounded-full"
                      style={{
                        background: `${card.color}20`,
                      }}
                    />
                  </div>

                  <div
                    className="mt-8 h-[70px] rounded-[16px]"
                    style={{
                      background: `linear-gradient(to top, ${card.color}20, transparent)`,
                    }}
                  />
                </DashboardCard>
              ))}

              {/* TIER */}

              <DashboardCard className="col-span-12 lg:col-span-7">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[14px] text-[#9aa8ba]">
                      Your Reward Tier
                    </p>

                    <div className="mt-6 flex items-center gap-5">

                      <div className="flex h-28 w-28 items-center justify-center rounded-[30px] border border-[#0f3d2d] bg-[#071118] text-[60px] shadow-[0_0_40px_rgba(0,255,140,0.18)]">
                        ⚡
                      </div>

                      <div>
                        <p className="text-[#7e8b9d]">
                          Tier 2
                        </p>

                        <h2 className="mt-1 text-[54px] font-black text-[#00ff85] leading-none">
                          Energized
                        </h2>

                        <p className="mt-3 max-w-[420px] text-[#8b98ab]">
                          You're doing great! Keep swapping to reach the next tier.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="text-[#22d3ee] text-[14px]">
                    How tiers work
                  </button>
                </div>

                <div className="mt-10">
                  <div className="mb-3 flex items-center justify-between text-[14px]">
                    <span>
                      {fmtXP(user.xp)} / 5,000 XP
                    </span>

                    <span>
                      Tier 3
                    </span>
                  </div>

                  <div className="h-[14px] overflow-hidden rounded-full bg-[#102029]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00ff85] to-[#00c26e]"
                      style={{
                        width: `${tierProgress(user.xp).pct}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">

                  {[
                    "1.2x Rewards",
                    "0.15% Cashback",
                    "Early Access",
                    "Exclusive Rewards",
                  ].map((b, i) => (
                    <div
                      key={i}
                      className="rounded-[18px] border border-[#0f2c24] bg-[#071118] p-4 text-center"
                    >
                      <div className="text-[26px]">⚡</div>

                      <p className="mt-3 text-[14px] font-semibold">
                        {b}
                      </p>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              {/* LEADERBOARD */}

              <DashboardCard className="col-span-12 lg:col-span-5">

                <div className="flex items-center justify-between">
                  <h2 className="text-[28px] font-black">
                    Top Earners
                  </h2>

                  <button className="text-[#7e8b9d]">
                    This Week
                  </button>
                </div>

                <div className="mt-8 flex flex-col gap-5">

                  {leaderboard?.slice(0, 5).map((u: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#071118] border border-[#0f2c24]">
                          {i + 1}
                        </div>

                        <div>
                          <p className="font-semibold">
                            {u.name || shortWallet(u.wallet_address)}
                          </p>

                          <p className="text-[13px] text-[#7e8b9d]">
                            Rank #{i + 1}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold text-[#00ff85]">
                        {fmtXP(u.xp)} XP
                      </span>
                    </div>
                  ))}
                </div>

                <button className="mt-8 w-full rounded-[18px] border border-[#0f3d2d] bg-[#071118] py-4 font-semibold text-[#00ff85] transition-all hover:bg-[#0c1812]">
                  View Leaderboard →
                </button>
              </DashboardCard>

              {/* QUESTS */}

              <DashboardCard className="col-span-12 lg:col-span-6">

                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-[30px] font-black">
                    Daily Rewards
                  </h2>

                  <QuestTimer />
                </div>

                <div className="flex flex-col gap-4">

                  {quests?.map((quest: any) => {
                    const pct =
                      quest.target > 0
                        ? Math.min(
                            (quest.progress / quest.target) * 100,
                            100
                          )
                        : 100;

                    return (
                      <div
                        key={quest.id}
                        className="rounded-[20px] border border-[#0f2c24] bg-[#071118] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div className="flex gap-4">

                            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-[#0f3d2d] bg-[#061018] text-[28px]">
                              ⚡
                            </div>

                            <div>
                              <h3 className="text-[18px] font-bold">
                                {quest.quest_type}
                              </h3>

                              <p className="mt-1 text-[#7e8b9d]">
                                {quest.progress} / {quest.target}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-[#00ff85]">
                              + {quest.xp_reward} XP
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 h-[10px] overflow-hidden rounded-full bg-[#102029]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#00ff85] to-[#00c26e]"
                            style={{
                              width: `${pct}%`,
                            }}
                          />
                        </div>

                        {quest.completed && !quest.claimed && (
                          <button
                            onClick={() =>
                              claim.mutate(quest.quest_type)
                            }
                            className="mt-5 w-full rounded-[16px] bg-gradient-to-r from-[#00ff85] to-[#00c26e] py-3 font-bold text-black"
                          >
                            Claim Reward
                          </button>
                        )}

                        {quest.claimed && (
                          <div className="mt-5 rounded-[16px] border border-[#0f3d2d] bg-[#061018] py-3 text-center font-bold text-[#00ff85]">
                            ✓ Claimed
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DashboardCard>

              {/* HISTORY */}

              <DashboardCard className="col-span-12 lg:col-span-6">

                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-[30px] font-black">
                    Recent Reward History
                  </h2>

                  <button className="text-[#22d3ee]">
                    View All
                  </button>
                </div>

                <div className="flex flex-col gap-4">

                  {history?.slice(0, 6).map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-[18px] border border-[#0f2c24] bg-[#071118] p-4"
                    >
                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#061018] border border-[#0f3d2d]">
                          ⚡
                        </div>

                        <div>
                          <p className="font-semibold">
                            {item.type || "Reward"}
                          </p>

                          <p className="mt-1 text-[13px] text-[#7e8b9d]">
                            {relTime(item.timestamp || Date.now())}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-[#00ff85]">
                          +{fmtUsd(item.amount || 0.42)}
                        </p>

                        <p className="mt-1 text-[13px] text-[#00ff85]">
                          +{item.xp || 84} XP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
          )}
        </div>
      </div>

      {/* WALLET MODAL */}

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