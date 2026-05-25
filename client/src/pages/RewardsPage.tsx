import { useState, useEffect } from "react";
import { useWalletContext } from "@/context/WalletContext";
import {
  useRewardUser,
  useDailyQuests,
  useRewardHistory,
  useLeaderboard,
  useClaimQuest,
  tierProgress,
  type RewardUser,
  type DailyQuest,
  type SwapEvent,
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

function relTime(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return `${Math.floor(diff / 86400)}d ago`;
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
// QUEST TIMER
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
    <span className="text-[11px] tabular-nums text-[#7f8b9d]">
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
    <div className="flex flex-col items-center justify-center gap-5 py-20">

      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#182332] bg-[#08111d]">
        <img
          src="/figmaAssets/image-30.png"
          alt="wallet"
          className="h-10 w-10 opacity-70"
        />
      </div>

      <div className="text-center">
        <h2 className="text-[22px] font-black text-white">
          Connect Your Wallet
        </h2>

        <p className="mt-2 text-[14px] text-[#8b97aa]">
          Connect to view your rewards and XP progress
        </p>
      </div>

      <button
        onClick={onConnect}
        className="rounded-[18px] bg-gradient-to-r from-[#22d3ee] to-[#2dae50] px-7 py-3 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(45,174,80,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
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

  const { data: history } = useRewardHistory(addr);

  const { data: leaderboard } = useLeaderboard();

  const claim = useClaimQuest(addr || "");

  const loading = userLoading && addr;

  return (
    <>
      <div className="w-full px-[14px] pb-[20px] pt-[12px] sm:px-[18px]">

        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between">

          <div>
            <h1 className="text-[22px] font-black text-white">
              Rewards
            </h1>

            <p className="mt-1 text-[13px] text-[#6f7b8e]">
              Earn XP and cashback on every swap
            </p>
          </div>

          {wallet.isConnected && addr && (
            <div className="text-right">

              <p className="text-[13px] font-semibold text-[#3acd5b]">
                {shortWallet(addr)}
              </p>

              <p className="mt-1 text-[11px] text-[#7f8b9d]">
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
          <div className="flex flex-col gap-4 animate-pulse">

            <div className="h-[200px] rounded-[28px] bg-[#101827]" />

            <div className="grid grid-cols-2 gap-4">
              <div className="h-[140px] rounded-[24px] bg-[#101827]" />
              <div className="h-[140px] rounded-[24px] bg-[#101827]" />
            </div>

            <div className="h-[120px] rounded-[24px] bg-[#101827]" />
            <div className="h-[120px] rounded-[24px] bg-[#101827]" />
          </div>
        )}

        {/* CONTENT */}
        {wallet.isConnected && user && (
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* HERO */}
            <div className="relative overflow-hidden rounded-[30px] border border-[#1b2432] bg-gradient-to-br from-[#071321] via-[#08111d] to-[#02050b] p-5 sm:p-6 backdrop-blur-xl">

              <div className="absolute left-[-40px] top-[-40px] h-[140px] w-[140px] rounded-full bg-cyan-400/10 blur-[80px]" />
              <div className="absolute right-[-50px] bottom-[-60px] h-[180px] w-[180px] rounded-full bg-emerald-500/10 blur-[90px]" />

              <div className="relative z-10 flex flex-col gap-4">

                {/* TOP */}
                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-4 min-w-0">

                    {/* XP RING */}
                    <div className="relative flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-[#09111d] shadow-[0_0_50px_rgba(34,211,238,0.12)]">

                      <div
                        className="absolute inset-[6px] rounded-full"
                        style={{
                          background:
                            "conic-gradient(#22d3ee 0%, #2dae50 " +
                            tierProgress(user.xp).pct +
                            "%, #111827 " +
                            tierProgress(user.xp).pct +
                            "%)",
                        }}
                      />

                      <div className="absolute inset-[10px] rounded-full bg-[#07111d]" />

                      <div className="relative z-10 text-[24px]">
                        🏆
                      </div>
                    </div>

                    {/* TEXT */}
                    <div className="min-w-0">

                      <p className="text-[11px] uppercase tracking-[0.3em] text-[#7b8898]">
                        {user.tier} Tier
                      </p>

                      <div className="mt-1 flex items-end gap-2">

                        <h2 className="truncate text-[34px] sm:text-[42px] font-black leading-none text-white">
                          {fmtXP(user.xp)}
                        </h2>

                        <span className="mb-[4px] text-[18px] font-bold text-[#8794aa]">
                          XP
                        </span>
                      </div>

                      <p className="mt-2 text-[13px] text-[#8d98aa]">
                        Level {user.level} •{" "}
                        {tierProgress(user.xp).xpToNext.toLocaleString()} XP until next tier
                      </p>
                    </div>
                  </div>

                  {/* WEEKLY */}
                  <div className="rounded-[20px] border border-[#182231] bg-[#0b1420]/80 px-4 py-3 backdrop-blur-xl">

                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#6f7b8e]">
                      Weekly XP
                    </p>

                    <p className="mt-1 text-[22px] font-black text-[#3acd5b]">
                      +{fmtXP(user.weekly_xp)}
                    </p>
                  </div>
                </div>

                {/* PROGRESS */}
                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-[12px] text-[#7f8da1]">
                      Tier Progress
                    </span>

                    <span className="text-[12px] font-semibold text-[#3acd5b]">
                      {Math.floor(tierProgress(user.xp).pct)}%
                    </span>
                  </div>

                  <div className="h-[12px] overflow-hidden rounded-full bg-[#111827]">

                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(tierProgress(user.xp).pct, 100)}%`,
                        background:
                          "linear-gradient(90deg,#22d3ee 0%,#2dae50 100%)",
                        boxShadow: "0 0 30px rgba(45,174,80,0.35)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* QUESTS */}
            <section>

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.28em] text-[#7f8b9d]">
                    Daily Quests
                  </h2>

                  <p className="mt-1 text-[13px] text-[#6f7b8e]">
                    Complete quests to earn bonus XP
                  </p>
                </div>

                <QuestTimer />
              </div>

              <div className="grid gap-3">

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
                      icon: string;
                      glow: string;
                    }
                  > = {
                    swaps: {
                      title: "Swap Master",
                      desc: "Complete 3 swaps today",
                      icon: "⚡",
                      glow: "#22d3ee",
                    },
                    volume: {
                      title: "Volume Hunter",
                      desc: "Trade $100 volume",
                      icon: "📈",
                      glow: "#8b5cf6",
                    },
                    login: {
                      title: "Daily Check-in",
                      desc: "Visit SuperSwap today",
                      icon: "🎁",
                      glow: "#2dae50",
                    },
                  };

                  const info = labels[quest.quest_type];

                  return (
                    <div
                      key={quest.id}
                      className="relative overflow-hidden rounded-[22px] border border-[#182332] bg-[#060d17] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[2px]"
                    >

                      <div
                        className="absolute right-[-20px] top-[-20px] h-[90px] w-[90px] rounded-full blur-[60px]"
                        style={{
                          background: `${info.glow}22`,
                        }}
                      />

                      <div className="relative z-10">

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex items-start gap-3">

                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border text-[20px]"
                              style={{
                                background: `${info.glow}15`,
                                borderColor: `${info.glow}55`,
                              }}
                            >
                              {info.icon}
                            </div>

                            <div>

                              <h3 className="text-[16px] font-bold text-white">
                                {info.title}
                              </h3>

                              <p className="mt-1 text-[13px] text-[#8c98aa]">
                                {info.desc}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 rounded-full border border-[#1d3428] bg-[#0b1811] px-3 py-1 text-[11px] font-bold text-[#3acd5b]">
                            +{quest.xp_reward} XP
                          </div>
                        </div>

                        {/* progress */}
                        <div className="mt-4">

                          <div className="mb-2 flex items-center justify-between">

                            <span className="text-[11px] text-[#7e8b9d]">
                              Progress
                            </span>

                            <span className="text-[11px] font-semibold text-white">
                              {Math.floor(pct)}%
                            </span>
                          </div>

                          <div className="h-[9px] overflow-hidden rounded-full bg-[#111827]">

                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${info.glow}, #2dae50)`,
                              }}
                            />
                          </div>
                        </div>

                        {quest.completed && !quest.claimed && (
                          <button
                            onClick={() => claim.mutate(quest.quest_type)}
                            disabled={claim.isPending}
                            className="mt-4 w-full rounded-[15px] bg-gradient-to-r from-[#22d3ee] to-[#2dae50] px-4 py-3 text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(45,174,80,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Claim Reward
                          </button>
                        )}

                        {quest.claimed && (
                          <div className="mt-4 flex items-center justify-center rounded-[15px] border border-[#1a3522] bg-[#0b1810] py-3 text-[13px] font-bold text-[#3acd5b]">
                            ✓ Reward Claimed
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