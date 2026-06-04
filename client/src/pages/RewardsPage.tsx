import { useState, useEffect } from "react";
import { useWalletContext } from "@/context/WalletContext";
import {
  useRewardUser,
  useDailyQuests,
  useRewardHistory,
  useLeaderboard,
  useClaimQuest,
  useClaimCashback,
  useTokenCashbacks,
  tierProgress,
  type RewardUser,
  type DailyQuest,
  type SwapEvent,
} from "@/hooks/useRewards";
import { useEarnTasks, useTaskCompletions } from "@/hooks/useEarn";

import { ConnectWalletModal } from "@/components/ConnectWalletModal";

import iconTrophy from "@assets/icon_trophy.png";
import iconLightning from "@assets/icon_lightning.png";
import iconChart from "@assets/icon_chart.png";
import iconGift from "@assets/icon_gift.png";

import { TOKENS } from "@/lib/tokens";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function shortWallet(addr: string) {
  return addr.slice(0, 6) + "\u2026" + addr.slice(-4);
}

function fmtUsd(n: number) {
  if (n >= 1000) return "$" + (n / 1000).toFixed(2) + "k";
  return "$" + n.toFixed(2);
}

function fmtXP(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function tokenIcon(symbol: string): string {
  const t = TOKENS.find((tok) => tok.symbol === symbol);
  return t?.icon ?? "";
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

// ─────────────────────────────────────────────────────────────
// QUEST TIMER
// ─────────────────────────────────────────────────────────────

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
    <span className="text-[11px] tabular-nums text-[#7f8b9d]">
      Resets in {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
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
        <img src="/figmaAssets/image-30.png" alt="wallet" className="h-10 w-10 opacity-70" />
      </div>
      <div className="text-center">
        <h2 className="text-[22px] font-black text-white">Connect Your Wallet</h2>
        <p className="mt-2 text-[14px] text-[#8b97aa]">Connect to view your rewards and XP progress</p>
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
  const [showMigrationBanner, setShowMigrationBanner] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showCashbackBanner, setShowCashbackBanner] = useState(true);
  const addr = wallet.isConnected ? wallet.address : null;

  const { data: user, isLoading: userLoading } = useRewardUser(addr);
  const { data: quests } = useDailyQuests(addr);
  const { data: history } = useRewardHistory(addr);
  const { data: leaderboard } = useLeaderboard();
  const claim = useClaimQuest(addr || "");
  const claimCb = useClaimCashback(addr);
  const { data: tokenCashbacks } = useTokenCashbacks(addr);

  const loading = addr && userLoading;
  const loadFailed = addr && !userLoading && !user;

  return (
    <>
      <div className="w-full px-[14px] pb-[20px] pt-[12px] sm:px-[18px]">
        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-black text-white">Rewards</h1>
            <p className="mt-1 text-[13px] text-[#6f7b8e]">Earn XP and cashback on every swap</p>
          </div>
          {wallet.isConnected && addr && (
            <div className="text-right">
              <p className="text-[13px] font-semibold text-[#3acd5b]">{shortWallet(addr)}</p>
              <p className="mt-1 text-[11px] text-[#7f8b9d]">Base Mainnet</p>
            </div>
          )}
        </div>

        {/* NOT CONNECTED */}
        {!wallet.isConnected && <ConnectPrompt onConnect={() => setWalletOpen(true)} />}

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

        {/* LOAD FAILED */}
        {loadFailed && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2a1a1a] bg-[#0e0808]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9543a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[17px] font-bold text-white">Could not load rewards</p>
              <p className="mt-1 text-[13px] text-[#6f7b8e]">Check your connection and try again</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-[14px] border border-[#1a3428] bg-[#0a2015] px-6 py-2.5 text-[14px] font-bold text-[#3acd5b] transition-all hover:bg-[#0d2818]"
            >
              Retry
            </button>
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
                          background: "conic-gradient(#22d3ee 0%, #2dae50 " + tierProgress(user.xp).pct + "%, #111827 " + tierProgress(user.xp).pct + "%)",
                        }}
                      />
                      <div className="absolute inset-[10px] rounded-full bg-[#07111d]" />
                      <img src={iconTrophy} alt="trophy" className="relative z-10 h-8 w-8" />
                    </div>
                    {/* TEXT */}
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-[#7b8898]">{user.tier} Tier</p>
                      <div className="mt-1 flex items-end gap-2">
                        <h2 className="truncate text-[34px] sm:text-[42px] font-black leading-none text-white">{fmtXP(user.xp)}</h2>
                        <span className="mb-[4px] text-[18px] font-bold text-[#8794aa]">XP</span>
                      </div>
                      <p className="mt-2 text-[13px] text-[#8d98aa]">
                        Level {user.level} {tierProgress(user.xp).xpToNext.toLocaleString()} XP until next tier
                      </p>
                    </div>
                  </div>
                  {/* WEEKLY */}
                  <div className="rounded-[20px] border border-[#182231] bg-[#0b1420]/80 px-4 py-3 backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#6f7b8e]">Weekly XP</p>
                    <p className="mt-1 text-[22px] font-black text-[#3acd5b]">+{fmtXP(user.weekly_xp)}</p>
                  </div>
                </div>
                {/* PROGRESS */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] text-[#7f8da1]">Tier Progress</span>
                    <span className="text-[12px] font-semibold text-[#3acd5b]">{Math.floor(tierProgress(user.xp).pct)}%</span>
                  </div>
                  <div className="h-[12px] overflow-hidden rounded-full bg-[#111827]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(tierProgress(user.xp).pct, 100)}%`,
                        background: "linear-gradient(90deg,#22d3ee 0%,#2dae50 100%)",
                        boxShadow: "0 0 30px rgba(45,174,80,0.35)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CASHBACK */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.28em] text-[#7f8b9d]">Cashback</h2>
                  <p className="mt-1 text-[13px] text-[#6f7b8e]">0.15% of swap volume distributed every Sunday</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                {/* Weekly earned */}
                <div className="relative overflow-hidden rounded-[22px] border border-[#182332] bg-[#060d17] p-5 backdrop-blur-xl">
                  <div className="absolute right-[-20px] top-[-20px] h-[90px] w-[90px] rounded-full bg-emerald-500/10 blur-[60px]" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#6f7b8e]">This Week Cashback Earned</p>
                      <span className="flex h-1.5 w-1.5 rounded-full bg-[#3acd5b] animate-pulse" />
                    </div>
                    <p className="mt-1 text-[28px] font-black text-[#3acd5b]" data-testid="text-weekly-cashback">{fmtUsd(user.weekly_cashback_usd ?? 0)}</p>
                    <p className="mt-1 text-[12px] text-[#7f8b9d]">Distributed to your wallet every Sunday</p>
                  </div>
                </div>

                {/* Pending + claim */}
                <div className="relative overflow-hidden rounded-[22px] border border-[#182332] bg-[#060d17] p-5 backdrop-blur-xl">
                  <div className="absolute left-[-20px] bottom-[-20px] h-[90px] w-[90px] rounded-full bg-cyan-400/10 blur-[60px]" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#6f7b8e]">Ready to Claim</p>
                        <p className="mt-1 text-[28px] font-black text-white">{fmtUsd(user.pending_cashback_usd ?? 0)}</p>
                      </div>
                      <div className="shrink-0 rounded-full border border-[#1d3428] bg-[#0b1811] px-3 py-1 text-[11px] font-bold text-[#3acd5b]">
                        {fmtUsd(user.cashback_usd ?? 0)} lifetime
                      </div>
                    </div>
                    <button
                      onClick={() => setShowClaimModal(true)}
                      data-testid="button-claim-cashback"
                      className="mt-4 w-full rounded-[15px] bg-gradient-to-r from-[#22d3ee] to-[#2dae50] px-4 py-3 text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(45,174,80,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Claim Cashback
                    </button>
                  </div>
                </div>
              </div>

              {/* Cashback promo banner with close button */}
              {showCashbackBanner && (
                <div className="relative mt-3 overflow-hidden rounded-[22px] border border-[#182332]">
                  <button
                    onClick={() => setShowCashbackBanner(false)}
                    className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:bg-black/80 hover:text-white"
                    data-testid="btn-close-cashback-banner"
                    aria-label="Close banner"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <img
                    src="https://i.ibb.co/dJpgRVjg/HJug-Gr-Yb-MAAIuhz-767b1430-0326-4132-8299-730b07959375.png"
                    alt="Cashback rewards banner"
                    className="w-full rounded-[22px] object-cover"
                    data-testid="img-cashback-banner"
                  />
                </div>
              )}
            </section>

            {/* Claim Paused Modal */}
            {showClaimModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                <div className="w-full max-w-[360px] overflow-hidden rounded-[24px] border border-[#1a3428] bg-[#030e1a]">
                  <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0b1e14] border border-[#1d4a30]">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3acd5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[18px] font-black text-white">Manual Claim Paused</p>
                      <p className="mt-3 text-[14px] leading-relaxed text-[#8d98aa]">
                        Manual claim is temporarily paused due to <span className="font-bold text-[#3acd5b]">v2 migration</span>.
                      </p>
                      <p className="mt-3 text-[14px] leading-relaxed text-[#8d98aa]">
                        <span className="font-bold text-white">CASHBACKS</span> are automatically distributed to your wallet <span className="font-bold text-[#3acd5b]">every Sunday</span>. No CLAIM needed.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowClaimModal(false)}
                      data-testid="btn-close-claim-modal"
                      className="mt-2 w-full rounded-[15px] border border-[#1a4a2a] bg-[#0a2015] px-4 py-3 text-[14px] font-bold text-[#3acd5b] transition-all hover:bg-[#0d2818] active:scale-[0.98]"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Per-Token Cashback */}
            {tokenCashbacks && tokenCashbacks.length > 0 && (
              <section>
                <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.28em] text-[#7f8b9d]">Token Rewards</h2>
                <div className="grid grid-cols-1 gap-2">
                  {tokenCashbacks.map((tc) => (
                    <div key={tc.token_symbol} className="flex items-center justify-between rounded-[16px] border border-[#182332] bg-[#060d17] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-bold text-[#c8ccd2]">{tc.token_symbol}</span>
                        <span className="text-[11px] text-[#5b6577]">{tc.swap_count} swaps</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-[#3acd5b]">{Number(tc.total_cashback_token).toFixed(6)} {tc.token_symbol}</p>
                        <p className="text-[11px] text-[#5b6577]">{fmtUsd(Number(tc.total_cashback_usd))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* QUESTS */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.28em] text-[#7f8b9d]">Daily Quests</h2>
                  <p className="mt-1 text-[13px] text-[#6f7b8e]">Complete quests to earn bonus XP</p>
                </div>
                <QuestTimer />
              </div>
              <div className="grid gap-3">
                {quests?.map((quest) => {
                  const pct = quest.target > 0 ? Math.min((quest.progress / quest.target) * 100, 100) : 100;

                  type QuestInfo = { title: string; desc: string; icon: string; glow: string; volLabel?: string };
                  const labels: Record<string, QuestInfo> = {
                    login:        { title: "Daily Check-in",      desc: "Visit SuperSwap today",          icon: iconGift,      glow: "#2dae50" },
                    swaps:        { title: "Swap Master",          desc: "Complete 3 swaps today",          icon: iconLightning, glow: "#22d3ee" },
                    volume:       { title: "Volume Hunter",        desc: "Trade $100 volume today",         icon: iconChart,     glow: "#8b5cf6" },
                    volume_500:   { title: "Rising Trader",        desc: "Trade $500 volume today",         icon: iconChart,     glow: "#a855f7", volLabel: "$500" },
                    volume_1k:    { title: "Power Trader",         desc: "Trade $1,000 volume today",       icon: iconChart,     glow: "#ec4899", volLabel: "$1K" },
                    volume_2500:  { title: "Elite Trader",         desc: "Trade $2,500 volume today",       icon: iconChart,     glow: "#f97316", volLabel: "$2.5K" },
                    volume_5k:    { title: "Whale Apprentice",     desc: "Trade $5,000 volume today",       icon: iconChart,     glow: "#eab308", volLabel: "$5K" },
                    volume_10k:   { title: "Whale Trader",         desc: "Trade $10,000 volume today",      icon: iconChart,     glow: "#ef4444", volLabel: "$10K" },
                    volume_25k:   { title: "Mega Whale",           desc: "Trade $25,000 volume today",      icon: iconChart,     glow: "#f43f5e", volLabel: "$25K" },
                    volume_100k:  { title: "Legendary Trader",     desc: "Trade $100,000 volume today",     icon: iconChart,     glow: "#fbbf24", volLabel: "$100K" },
                  };

                  const info = labels[quest.quest_type] ?? { title: quest.quest_type, desc: "", icon: iconChart, glow: "#8b5cf6" };
                  const isVol = quest.quest_type.startsWith("volume");
                  const progressLabel = isVol
                    ? `$${Math.floor(quest.progress).toLocaleString()} / $${quest.target.toLocaleString()}`
                    : `${Math.floor(pct)}%`;

                  return (
                    <div key={quest.id} className="relative overflow-hidden rounded-[22px] border border-[#182332] bg-[#060d17] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[2px]">
                      <div className="absolute right-[-20px] top-[-20px] h-[90px] w-[90px] rounded-full blur-[60px]" style={{ background: `${info.glow}22` }} />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border" style={{ background: `${info.glow}15`, borderColor: `${info.glow}55` }}>
                              {info.volLabel ? (
                                <span className="text-[11px] font-black" style={{ color: info.glow }}>{info.volLabel}</span>
                              ) : (
                                <img src={info.icon} alt="" className="h-6 w-6" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-[16px] font-bold text-white">{info.title}</h3>
                              <p className="mt-1 text-[13px] text-[#8c98aa]">{info.desc}</p>
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full border border-[#1d3428] bg-[#0b1811] px-3 py-1 text-[11px] font-bold text-[#3acd5b]">
                            +{quest.xp_reward >= 1000 ? (quest.xp_reward / 1000).toFixed(quest.xp_reward % 1000 === 0 ? 0 : 1) + "K" : quest.xp_reward} XP
                          </div>
                        </div>
                        {/* progress */}
                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] text-[#7e8b9d]">Progress</span>
                            <span className="text-[11px] font-semibold text-white">{progressLabel}</span>
                          </div>
                          <div className="h-[9px] overflow-hidden rounded-full bg-[#111827]">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${info.glow}, #2dae50)` }} />
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
                          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-[15px] border border-[#1a3522] bg-[#0b1810] py-3 text-[13px] font-bold text-[#3acd5b]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Reward Claimed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* HISTORY */}
            {history && history.length > 0 && (
              <section>
                <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.28em] text-[#7f8b9d]">Recent Swaps</h2>
                <div className="flex flex-col gap-2">
                  {history.slice(0, 10).map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-[14px] border border-[#182332] bg-[#060d17] px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {tokenIcon(h.sell_symbol) && <img src={tokenIcon(h.sell_symbol)} alt={h.sell_symbol} className="h-5 w-5 rounded-full object-cover bg-[#0a1825]" />}
                          <span className="text-[12px] font-medium text-[#c8ccd2]">{h.sell_symbol}</span>
                          <span className="text-[10px] text-[#5b6577]">→</span>
                          {tokenIcon(h.buy_symbol) && <img src={tokenIcon(h.buy_symbol)} alt={h.buy_symbol} className="h-5 w-5 rounded-full object-cover bg-[#0a1825]" />}
                          <span className="text-[12px] font-medium text-[#c8ccd2]">{h.buy_symbol}</span>
                        </div>
                        {h.verified && <span className="rounded bg-[#0a2418] px-1.5 py-0.5 text-[9px] font-bold text-[#2dae50]">VERIFIED</span>}
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-bold text-[#3acd5b]">+{h.cashback_usd.toFixed(4)} USD</p>
                        <p className="text-[10px] text-[#5b6577]">{relTime(h.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
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
