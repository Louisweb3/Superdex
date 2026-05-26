import { useState, useEffect } from "react";
import {
  Trophy,
  Gift,
  Zap,
  BarChart3,
  Sparkles,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  Crown,
  ShieldCheck,
} from "lucide-react";

import { useWalletContext } from "@/context/WalletContext";

import {
  useRewardUser,
  useDailyQuests,
  useRewardHistory,
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
    <span className="text-[12px] tabular-nums text-[#94A3B8]">
      Resets in{" "}
      {String(h).padStart(2, "0")}:
      {String(m).padStart(2, "0")}:
      {String(s).padStart(2, "0")}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// CONNECT PROMPT
// ─────────────────────────────────────────────────────────────

function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">

      <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/[0.08] bg-[#0F1722] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">

        <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_70%)]" />

        <Wallet className="relative z-10 h-10 w-10 text-cyan-300" />
      </div>

      <div className="text-center">
        <h2 className="text-[30px] font-black tracking-[-0.04em] text-white">
          Connect Wallet
        </h2>

        <p className="mt-3 text-[15px] text-[#94A3B8]">
          View rewards, cashback and XP progression
        </p>
      </div>

      <button
        onClick={onConnect}
        className="rounded-[18px] bg-white px-7 py-3 text-[15px] font-bold text-black transition-all hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98]"
      >
        Connect Wallet
      </button>
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

  const { data: user, isLoading: userLoading } = useRewardUser(addr);

  const { data: quests } = useDailyQuests(addr);

  const claim = useClaimQuest(addr || "");

  const claimCb = useClaimCashback(addr);

  const loading = userLoading && addr;

  return (
    <>
      <div className="min-h-screen w-full bg-[#070B11] px-[16px] pb-[40px] pt-[16px] sm:px-[24px]">

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">

          <div>
            <h1 className="text-[32px] font-black tracking-[-0.04em] text-white">
              Rewards
            </h1>

            <p className="mt-2 text-[14px] text-[#94A3B8]">
              Earn XP and cashback on every swap
            </p>
          </div>

          {wallet.isConnected && addr && (
            <div className="rounded-[18px] border border-white/[0.06] bg-[#0F1722] px-4 py-3">

              <p className="text-[13px] font-semibold text-cyan-300">
                {shortWallet(addr)}
              </p>

              <p className="mt-1 text-[11px] text-[#64748B]">
                Base Mainnet
              </p>
            </div>
          )}
        </div>

        {/* NOT CONNECTED */}
        {!wallet.isConnected && (
          <ConnectPrompt onConnect={() => setWalletOpen(true)} />
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col gap-5 animate-pulse">

            <div className="h-[240px] rounded-[32px] bg-[#111827]" />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="h-[180px] rounded-[28px] bg-[#111827]" />
              <div className="h-[180px] rounded-[28px] bg-[#111827]" />
            </div>

            <div className="h-[160px] rounded-[28px] bg-[#111827]" />
          </div>
        )}

        {/* CONTENT */}
        {wallet.isConnected && user && (
          <div className="flex flex-col gap-6">

            {/* HERO */}
            <div className="relative overflow-hidden rounded-[34px] border border-white/[0.06] bg-[linear-gradient(180deg,#0B1118_0%,#070B11_100%)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%)]" />

              <div className="absolute right-[-100px] top-[-100px] h-[240px] w-[240px] rounded-full bg-cyan-400/10 blur-[120px]" />

              <div className="relative z-10">

                {/* TOP */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  {/* LEFT */}
                  <div className="flex items-center gap-5">

                    {/* XP RING */}
                    <div className="relative flex h-[96px] w-[96px] items-center justify-center rounded-full border border-cyan-400/20 bg-[#0B121C]">

                      <div
                        className="absolute inset-[6px] rounded-full"
                        style={{
                          background:
                            "conic-gradient(#22d3ee 0%, #3b82f6 " +
                            tierProgress(user.xp).pct +
                            "%, #111827 " +
                            tierProgress(user.xp).pct +
                            "%)",
                        }}
                      />

                      <div className="absolute inset-[12px] rounded-full bg-[#070B11]" />

                      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10">
                        <Trophy className="h-5 w-5 text-cyan-300" />
                      </div>
                    </div>

                    {/* TEXT */}
                    <div>

                      <div className="flex items-center gap-2">

                        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                          {user.tier} Tier
                        </div>

                        <div className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-[#94A3B8]">
                          Level {user.level}
                        </div>
                      </div>

                      <div className="mt-4 flex items-end gap-3">

                        <h2 className="text-[54px] font-black tracking-[-0.06em] leading-none text-white">
                          {fmtXP(user.xp)}
                        </h2>

                        <span className="mb-[8px] text-[18px] font-bold text-[#64748B]">
                          XP
                        </span>
                      </div>

                      <p className="mt-3 text-[14px] text-[#94A3B8]">
                        {tierProgress(user.xp).xpToNext.toLocaleString()} XP until next tier
                      </p>
                    </div>
                  </div>

                  {/* WEEKLY */}
                  <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">

                    <div className="flex items-center gap-2">

                      <Sparkles className="h-4 w-4 text-cyan-300" />

                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#64748B]">
                        Weekly XP
                      </p>
                    </div>

                    <p className="mt-3 text-[32px] font-black tracking-[-0.04em] text-[#4ADE80]">
                      +{fmtXP(user.weekly_xp)}
                    </p>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="mt-8">

                  <div className="mb-3 flex items-center justify-between">

                    <span className="text-[13px] text-[#94A3B8]">
                      Tier Progress
                    </span>

                    <span className="text-[13px] font-semibold text-cyan-300">
                      {Math.floor(tierProgress(user.xp).pct)}%
                    </span>
                  </div>

                  <div className="h-[12px] overflow-hidden rounded-full bg-[#111827]">

                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(tierProgress(user.xp).pct, 100)}%`,
                        background:
                          "linear-gradient(90deg,#22d3ee 0%,#3b82f6 100%)",
                        boxShadow: "0 0 30px rgba(34,211,238,0.3)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CASHBACK */}
            <section>

              <div className="mb-5">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.28em] text-[#64748B]">
                  Cashback
                </h2>

                <p className="mt-2 text-[14px] text-[#94A3B8]">
                  Earn 0.15% cashback from every swap
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                {/* WEEKLY */}
                <div className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0E1621] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">

                  <div className="absolute right-[-40px] top-[-40px] h-[140px] w-[140px] rounded-full bg-emerald-400/10 blur-[80px]" />

                  <div className="relative z-10">

                    <div className="flex items-center gap-3">

                      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-emerald-400/10">
                        <ArrowUpRight className="h-5 w-5 text-emerald-300" />
                      </div>

                      <div>
                        <p className="text-[12px] uppercase tracking-[0.2em] text-[#64748B]">
                          This Week
                        </p>

                        <p className="mt-1 text-[34px] font-black tracking-[-0.04em] text-white">
                          {fmtUsd(user.weekly_cashback_usd ?? 0)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-[13px] text-[#94A3B8]">
                      Unclaimed until weekly distribution
                    </p>
                  </div>
                </div>

                {/* CLAIM */}
                <div className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0E1621] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">

                  <div className="absolute left-[-40px] bottom-[-40px] h-[140px] w-[140px] rounded-full bg-cyan-400/10 blur-[80px]" />

                  <div className="relative z-10">

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-[12px] uppercase tracking-[0.2em] text-[#64748B]">
                          Ready To Claim
                        </p>

                        <p className="mt-2 text-[34px] font-black tracking-[-0.04em] text-white">
                          {fmtUsd(user.pending_cashback_usd ?? 0)}
                        </p>
                      </div>

                      <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
                        {fmtUsd(user.cashback_usd ?? 0)} lifetime
                      </div>
                    </div>

                    <button
                      onClick={() => claimCb.mutate()}
                      disabled={claimCb.isPending || (user.pending_cashback_usd ?? 0) <= 0}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-[15px] font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-40"
                    >
                      <Gift className="h-4 w-4" />
                      {claimCb.isPending ? "Claiming..." : "Claim Cashback"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* QUESTS */}
            <section>

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.28em] text-[#64748B]">
                    Daily Quests
                  </h2>

                  <p className="mt-2 text-[14px] text-[#94A3B8]">
                    Complete quests and earn bonus XP
                  </p>
                </div>

                <QuestTimer />
              </div>

              <div className="grid gap-4">

                {quests?.map((quest) => {

                  const pct =
                    quest.target > 0
                      ? Math.min((quest.progress / quest.target) * 100, 100)
                      : 100;

                  const labels: Record<
                    string,
                    {
                      title: string;
                      desc: string;
                      icon: any;
                      glow: string;
                    }
                  > = {
                    swaps: {
                      title: "Swap Master",
                      desc: "Complete 3 swaps today",
                      icon: Zap,
                      glow: "#22d3ee",
                    },
                    volume: {
                      title: "Volume Hunter",
                      desc: "Trade $100 volume",
                      icon: BarChart3,
                      glow: "#8b5cf6",
                    },
                    login: {
                      title: "Daily Check-in",
                      desc: "Visit SuperSwap today",
                      icon: Crown,
                      glow: "#4ADE80",
                    },
                  };

                  const info = labels[quest.quest_type];

                  const Icon = info.icon;

                  return (
                    <div
                      key={quest.id}
                      className="group relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0E1621] p-5 transition-all duration-300 hover:-translate-y-[2px] hover:border-cyan-400/20 hover:bg-[#111B27]"
                    >

                      <div
                        className="absolute right-[-30px] top-[-30px] h-[120px] w-[120px] rounded-full blur-[80px]"
                        style={{
                          background: `${info.glow}18`,
                        }}
                      />

                      <div className="relative z-10">

                        <div className="flex items-start justify-between gap-4">

                          {/* LEFT */}
                          <div className="flex gap-4">

                            <div
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border"
                              style={{
                                background: `${info.glow}10`,
                                borderColor: `${info.glow}25`,
                              }}
                            >
                              <Icon
                                className="h-6 w-6"
                                style={{
                                  color: info.glow,
                                }}
                              />
                            </div>

                            <div>

                              <h3 className="text-[18px] font-bold text-white">
                                {info.title}
                              </h3>

                              <p className="mt-1 text-[14px] text-[#94A3B8]">
                                {info.desc}
                              </p>
                            </div>
                          </div>

                          {/* XP */}
                          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[12px] font-bold text-emerald-300">
                            +{quest.xp_reward} XP
                          </div>
                        </div>

                        {/* PROGRESS */}
                        <div className="mt-6">

                          <div className="mb-3 flex items-center justify-between">

                            <span className="text-[12px] text-[#64748B]">
                              Progress
                            </span>

                            <span className="text-[12px] font-semibold text-white">
                              {Math.floor(pct)}%
                            </span>
                          </div>

                          <div className="h-[10px] overflow-hidden rounded-full bg-[#111827]">

                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${info.glow}, #3b82f6)`,
                              }}
                            />
                          </div>
                        </div>

                        {/* CTA */}
                        {quest.completed && !quest.claimed && (
                          <button
                            onClick={() => claim.mutate(quest.quest_type)}
                            disabled={claim.isPending}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-3 text-[15px] font-bold text-black transition-all hover:bg-zinc-200"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Claim Reward
                          </button>
                        )}

                        {quest.claimed && (
                          <div className="mt-6 flex items-center justify-center gap-2 rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 py-3 text-[14px] font-bold text-emerald-300">

                            <ShieldCheck className="h-4 w-4" />

                            Reward Claimed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
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