import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { useWalletContext } from "@/context/WalletContext";

import {
  useRewardUser,
  useDailyQuests,
  useLeaderboard,
  useClaimQuest,
  useClaimCashback,
  tierProgress,
} from "@/hooks/useRewards";

import { ConnectWalletModal } from "@/components/ConnectWalletModal";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function shortWallet(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function fmtUsd(n: number) {
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  return "$" + n.toFixed(2);
}

function fmtXP(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function nextMidnightUTC() {
  const now = new Date();

  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1
    )
  );

  return next.getTime();
}

// ─────────────────────────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────────────────────────

function QuestTimer() {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const tick = () =>
      setSecs(
        Math.max(
          0,
          Math.floor((nextMidnightUTC() - Date.now()) / 1000)
        )
      );

    tick();

    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  return (
    <div className="rounded-full border border-[#1cff95]/20 bg-[#1cff95]/5 px-4 py-2 text-[12px] font-bold tracking-wide text-[#1cff95] shadow-[0_0_20px_rgba(28,255,149,0.15)]">
      {String(h).padStart(2, "0")}:
      {String(m).padStart(2, "0")}:
      {String(s).padStart(2, "0")}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GLASS CARD
// ─────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
        scale: 1.01,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(7,14,24,0.98)_0%,rgba(3,8,15,0.98)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_25px_60px_rgba(0,0,0,0.6),0_0_60px_rgba(0,255,163,0.04)] backdrop-blur-2xl ${className}`}
    >
      {/* glossy */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%)]" />

      {/* edge glow */}
      <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-[#1cff95]/5" />

      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONNECT
// ─────────────────────────────────────────────────────────────

function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex min-h-[75vh] items-center justify-center">

      <GlassCard className="w-full max-w-[540px] p-10">

        <div className="absolute left-[-100px] top-[-100px] h-[220px] w-[220px] rounded-full bg-[#1cff95]/10 blur-[100px]" />

        <div className="absolute right-[-100px] bottom-[-100px] h-[240px] w-[240px] rounded-full bg-[#00ffcc]/10 blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center">

          {/* ENERGY CORE */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
            }}
            className="relative h-[150px] w-[150px]"
          >

            <div className="absolute inset-0 rounded-full bg-[#1cff95] opacity-20 blur-[60px]" />

            <div className="absolute inset-0 rounded-full border border-[#1cff95]/25 bg-[#07111d]" />

            <div className="absolute inset-[16px] rounded-full bg-gradient-to-br from-[#00ffcc] via-[#1cff95] to-[#0aff7b] shadow-[0_0_80px_rgba(0,255,163,0.8)]" />

            <div className="absolute inset-[42px] rounded-full bg-[#02050b]" />

            <div className="absolute inset-0 flex items-center justify-center text-[46px]">
              ⚡
            </div>
          </motion.div>

          <h1 className="mt-10 text-center text-[40px] font-black tracking-tight text-white">
            Connect Wallet
          </h1>

          <p className="mt-4 max-w-[380px] text-center text-[15px] leading-relaxed text-[#7f92a7]">
            Unlock cashback rewards, XP progression, streak bonuses, elite tiers and leaderboard rankings.
          </p>

          <button
            onClick={onConnect}
            className="mt-8 rounded-[22px] bg-gradient-to-r from-[#00ffcc] via-[#1cff95] to-[#0aff7b] px-8 py-4 text-[15px] font-black tracking-wide text-black shadow-[0_20px_50px_rgba(0,255,163,0.35)] transition-all duration-300 hover:scale-[1.03]"
          >
            CONNECT WALLET
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export function RewardsPage(): JSX.Element {
  const wallet = useWalletContext();

  const [walletOpen, setWalletOpen] = useState(false);

  const addr = wallet.isConnected ? wallet.address : null;

  const { data: user } = useRewardUser(addr);

  const { data: quests } = useDailyQuests(addr);

  const { data: leaderboard } = useLeaderboard();

  const claim = useClaimQuest(addr || "");

  const claimCb = useClaimCashback(addr);

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-[#02050b] text-white">

        {/* BACKGROUND */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,163,0.12),transparent_30%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,255,204,0.08),transparent_35%)]" />

        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="absolute left-[-200px] top-[0] h-[400px] w-[400px] rounded-full bg-[#1cff95]/10 blur-[140px]" />

        <div className="absolute right-[-200px] bottom-[0] h-[500px] w-[500px] rounded-full bg-[#00ffcc]/10 blur-[160px]" />

        <div className="relative z-10 mx-auto max-w-[1600px] px-4 py-5 sm:px-6">

          {/* HEADER */}
          <div className="mb-6 flex items-center justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[16px] border border-[#1cff95]/20 bg-[#1cff95]/10 shadow-[0_0_30px_rgba(0,255,163,0.25)]">
                  ⚡
                </div>

                <div>
                  <h1 className="text-[42px] font-black tracking-tight text-white">
                    Rewards
                  </h1>

                  <p className="text-[14px] text-[#7c8ea4]">
                    Earn more. Level up. Unlock elite status.
                  </p>
                </div>
              </div>
            </div>

            {wallet.isConnected && addr && (
              <div className="rounded-[22px] border border-[#1cff95]/15 bg-[#1cff95]/5 px-5 py-3 backdrop-blur-xl">

                <p className="text-right text-[14px] font-bold text-[#1cff95]">
                  {shortWallet(addr)}
                </p>

                <p className="mt-1 text-right text-[11px] uppercase tracking-[0.25em] text-[#6f8297]">
                  Premium Tier
                </p>
              </div>
            )}
          </div>

          {!wallet.isConnected && (
            <ConnectPrompt onConnect={() => setWalletOpen(true)} />
          )}

          {wallet.isConnected && user && (
            <div className="space-y-5">

              {/* HERO */}
              <GlassCard className="p-7">

                <div className="absolute left-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-[#1cff95]/10 blur-[120px]" />

                <div className="absolute right-[-120px] bottom-[-120px] h-[260px] w-[260px] rounded-full bg-[#00ffcc]/10 blur-[120px]" />

                <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

                  {/* LEFT */}
                  <div className="flex flex-col justify-between">

                    <div className="flex items-center gap-6">

                      {/* ENERGY CORE */}
                      <motion.div
                        animate={{
                          scale: [1, 1.04, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 4,
                        }}
                        className="relative h-[170px] w-[170px] shrink-0"
                      >

                        <div className="absolute inset-0 rounded-full bg-[#1cff95] opacity-20 blur-[70px]" />

                        <div className="absolute inset-0 rounded-full border border-[#1cff95]/20 bg-[#07111d]" />

                        <div className="absolute inset-[18px] rounded-full bg-gradient-to-br from-[#00ffcc] via-[#1cff95] to-[#00ff85] shadow-[0_0_100px_rgba(0,255,163,0.9)]" />

                        <div className="absolute inset-[48px] rounded-full bg-[#02050b]" />

                        <div className="absolute inset-0 flex items-center justify-center text-[54px]">
                          ⚡
                        </div>
                      </motion.div>

                      {/* TEXT */}
                      <div>

                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1cff95]/20 bg-[#1cff95]/5 px-4 py-2">

                          <div className="h-[8px] w-[8px] rounded-full bg-[#1cff95] shadow-[0_0_15px_rgba(0,255,163,0.9)]" />

                          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1cff95]">
                            {user.tier} Tier
                          </span>
                        </div>

                        <div className="flex items-end gap-3">

                          <h2 className="text-[74px] font-black leading-none tracking-tight text-white">
                            {fmtXP(user.xp)}
                          </h2>

                          <span className="mb-3 text-[26px] font-black text-[#95a6bb]">
                            XP
                          </span>
                        </div>

                        <p className="mt-4 text-[15px] text-[#8496ab]">
                          Level {user.level} •{" "}
                          {tierProgress(user.xp).xpToNext.toLocaleString()} XP until next rank
                        </p>
                      </div>
                    </div>

                    {/* BAR */}
                    <div className="mt-8">

                      <div className="mb-3 flex items-center justify-between">

                        <span className="text-[12px] uppercase tracking-[0.25em] text-[#6f8297]">
                          Tier Progress
                        </span>

                        <span className="text-[13px] font-black text-[#1cff95]">
                          {Math.floor(tierProgress(user.xp).pct)}%
                        </span>
                      </div>

                      <div className="relative h-[18px] overflow-hidden rounded-full bg-[#08101b]">

                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${tierProgress(user.xp).pct}%`,
                            background:
                              "linear-gradient(90deg,#00ffcc 0%,#1cff95 50%,#00ff85 100%)",
                            boxShadow:
                              "0 0 30px rgba(0,255,163,0.8),0 0 60px rgba(0,255,163,0.4)",
                          }}
                        />

                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="grid grid-cols-2 gap-4">

                    {/* STATS */}
                    {[
                      {
                        title: "Weekly XP",
                        value: `+${fmtXP(user.weekly_xp)}`,
                        glow: "#1cff95",
                      },
                      {
                        title: "Cashback",
                        value: fmtUsd(user.cashback_usd ?? 0),
                        glow: "#00ffcc",
                      },
                      {
                        title: "Transactions",
                        value: String(user.total_swaps ?? 0),
                        glow: "#1cff95",
                      },
                      {
                        title: "Total Earned",
                        value: fmtUsd(
                          (user.cashback_usd ?? 0) +
                          (user.pending_cashback_usd ?? 0) +
                          (user.weekly_cashback_usd ?? 0)
                        ),
                        glow: "#00ffcc",
                      },
                    ].map((item, i) => (
                      <GlassCard key={i} className="p-5">

                        <div
                          className="absolute right-[-20px] top-[-20px] h-[90px] w-[90px] rounded-full blur-[70px]"
                          style={{
                            background: `${item.glow}22`,
                          }}
                        />

                        <div className="relative z-10">

                          <p className="text-[11px] uppercase tracking-[0.25em] text-[#73859b]">
                            {item.title}
                          </p>

                          <h3 className="mt-4 text-[36px] font-black tracking-tight text-white">
                            {item.value}
                          </h3>

                          {/* fake graph */}
                          <div className="mt-6 flex items-end gap-[5px]">
                            {[20, 30, 25, 40, 32, 55, 45].map((h, idx) => (
                              <div
                                key={idx}
                                className="w-full rounded-full"
                                style={{
                                  height: `${h}px`,
                                  background: `linear-gradient(180deg, ${item.glow}, transparent)`,
                                  boxShadow: `0 0 18px ${item.glow}55`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* CONTENT GRID */}
              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">

                {/* QUESTS */}
                <div className="space-y-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <h2 className="text-[14px] font-black uppercase tracking-[0.35em] text-[#95a6bb]">
                        Daily Missions
                      </h2>

                      <p className="mt-2 text-[14px] text-[#7b8da3]">
                        Complete missions to earn bonus XP
                      </p>
                    </div>

                    <QuestTimer />
                  </div>

                  <div className="space-y-4">

                    {quests?.map((quest) => {
                      const pct =
                        quest.target > 0
                          ? Math.min((quest.progress / quest.target) * 100, 100)
                          : 100;

                      return (
                        <GlassCard key={quest.id} className="p-5">

                          <div className="absolute right-[-30px] top-[-30px] h-[120px] w-[120px] rounded-full bg-[#1cff95]/10 blur-[80px]" />

                          <div className="relative z-10">

                            <div className="flex items-start justify-between gap-4">

                              <div className="flex gap-4">

                                <div className="flex h-[70px] w-[70px] items-center justify-center rounded-[22px] border border-[#1cff95]/20 bg-[#1cff95]/10 text-[30px] shadow-[0_0_40px_rgba(0,255,163,0.2)]">
                                  ⚡
                                </div>

                                <div>

                                  <div className="mb-2 inline-flex rounded-full border border-[#1cff95]/20 bg-[#1cff95]/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#1cff95]">
                                    Epic Mission
                                  </div>

                                  <h3 className="text-[22px] font-black text-white">
                                    {quest.quest_type}
                                  </h3>

                                  <p className="mt-2 text-[14px] text-[#8395aa]">
                                    Complete the objective to unlock XP rewards and streak bonuses.
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-full border border-[#1cff95]/20 bg-[#1cff95]/10 px-4 py-2 text-[13px] font-black text-[#1cff95]">
                                +{quest.xp_reward} XP
                              </div>
                            </div>

                            {/* PROGRESS */}
                            <div className="mt-6">

                              <div className="mb-2 flex items-center justify-between">

                                <span className="text-[12px] uppercase tracking-[0.2em] text-[#6f8297]">
                                  Mission Progress
                                </span>

                                <span className="text-[12px] font-black text-white">
                                  {Math.floor(pct)}%
                                </span>
                              </div>

                              <div className="relative h-[16px] overflow-hidden rounded-full bg-[#08101b]">

                                <div
                                  className="absolute inset-y-0 left-0 rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    background:
                                      "linear-gradient(90deg,#00ffcc,#1cff95,#00ff85)",
                                    boxShadow:
                                      "0 0 25px rgba(0,255,163,0.8)",
                                  }}
                                />

                                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] animate-pulse" />
                              </div>
                            </div>

                            {quest.completed && !quest.claimed && (
                              <button
                                onClick={() => claim.mutate(quest.quest_type)}
                                disabled={claim.isPending}
                                className="mt-6 w-full rounded-[20px] bg-gradient-to-r from-[#00ffcc] via-[#1cff95] to-[#00ff85] px-5 py-4 text-[15px] font-black tracking-wide text-black shadow-[0_20px_50px_rgba(0,255,163,0.35)] transition-all duration-300 hover:scale-[1.02]"
                              >
                                CLAIM REWARD
                              </button>
                            )}

                            {quest.claimed && (
                              <div className="mt-6 flex items-center justify-center rounded-[20px] border border-[#1cff95]/20 bg-[#1cff95]/10 py-4 text-[14px] font-black text-[#1cff95]">
                                ✓ REWARD CLAIMED
                              </div>
                            )}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="space-y-5">

                  {/* STREAK */}
                  <GlassCard className="p-6">

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-[12px] uppercase tracking-[0.25em] text-[#6f8297]">
                          Active Streak
                        </p>

                        <h2 className="mt-3 text-[52px] font-black leading-none text-white">
                          7
                        </h2>

                        <p className="mt-2 text-[14px] text-[#7d8fa4]">
                          Consecutive reward days
                        </p>
                      </div>

                      <div className="text-[54px] drop-shadow-[0_0_20px_#1cff95]">
                        🔥
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">

                      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className={`h-[14px] w-[14px] rounded-full ${
                              i < 6
                                ? "bg-[#1cff95] shadow-[0_0_20px_rgba(0,255,163,0.9)]"
                                : "bg-white/10"
                            }`}
                          />

                          <span className="text-[11px] text-[#708298]">
                            {d}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* LEADERBOARD */}
                  <GlassCard className="p-6">

                    <div className="flex items-center justify-between">

                      <div>

                        <h2 className="text-[14px] font-black uppercase tracking-[0.35em] text-[#95a6bb]">
                          Top Earners
                        </h2>

                        <p className="mt-2 text-[14px] text-[#7d8fa4]">
                          Weekly Ranking
                        </p>
                      </div>

                      <div className="rounded-full border border-[#1cff95]/20 bg-[#1cff95]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#1cff95]">
                        Live
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">

                      {leaderboard?.slice(0, 5).map((u, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-4"
                        >

                          <div className="flex items-center gap-4">

                            <div
                              className={`flex h-[46px] w-[46px] items-center justify-center rounded-full font-black ${
                                i === 0
                                  ? "bg-[#1cff95] text-black shadow-[0_0_25px_rgba(0,255,163,0.6)]"
                                  : i === 1
                                  ? "bg-[#00ffcc] text-black"
                                  : i === 2
                                  ? "bg-[#0aff7b] text-black"
                                  : "bg-white/10 text-white"
                              }`}
                            >
                              {i + 1}
                            </div>

                            <div>

                              <p className="font-black text-white">
                                {shortWallet(u.wallet_address)}
                              </p>

                              <p className="mt-1 text-[12px] text-[#708298]">
                                Elite Trader
                              </p>
                            </div>
                          </div>

                          <div className="text-right">

                            <p className="font-black text-[#1cff95]">
                              {fmtXP(u.total_xp)} XP
                            </p>

                            <p className="mt-1 text-[12px] text-[#708298]">
                              Rank #{i + 1}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* CASHBACK */}
                  <GlassCard className="p-6">

                    <div className="mb-5 flex items-center justify-between">

                      <div>

                        <h2 className="text-[14px] font-black uppercase tracking-[0.35em] text-[#95a6bb]">
                          Cashback Vault
                        </h2>

                        <p className="mt-2 text-[14px] text-[#7d8fa4]">
                          Ready to claim
                        </p>
                      </div>

                      <div className="text-[36px]">
                        💰
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-[#1cff95]/10 bg-[#1cff95]/5 p-5">

                      <h3 className="text-[54px] font-black leading-none tracking-tight text-white">
                        {fmtUsd(user.pending_cashback_usd ?? 0)}
                      </h3>

                      <p className="mt-4 text-[14px] text-[#7e90a5]">
                        Lifetime claimed: {fmtUsd(user.cashback_usd ?? 0)}
                      </p>

                      <p className="mt-1 text-[14px] text-[#2dae50]">
                        Total earned: {fmtUsd(
                          (user.cashback_usd ?? 0) +
                          (user.pending_cashback_usd ?? 0) +
                          (user.weekly_cashback_usd ?? 0)
                        )}
                      </p>

                      <button
                        onClick={() => claimCb.mutate()}
                        disabled={
                          claimCb.isPending ||
                          (user.pending_cashback_usd ?? 0) <= 0
                        }
                        className="mt-6 w-full rounded-[22px] bg-gradient-to-r from-[#00ffcc] via-[#1cff95] to-[#00ff85] px-5 py-4 text-[15px] font-black tracking-wide text-black shadow-[0_20px_60px_rgba(0,255,163,0.4)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-40"
                      >
                        {claimCb.isPending
                          ? "CLAIMING..."
                          : "CLAIM CASHBACK"}
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
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