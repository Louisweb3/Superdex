import { useState, useEffect, useRef, useMemo } from "react";
import { useWalletContext } from "@/context/WalletContext";
import { useConnectX, useXAccount } from "@/hooks/useEarn";
import { useRewardUser } from "@/hooks/useRewards";
import { useReferralStats } from "@/hooks/useReferral";
import { usePublicSettings } from "@/hooks/useAdmin";
import heroBanner from "@assets/800DA97D-FBED-4931-B9C3-37C7C4B59180_1780419181239.png";
import {
  useCampaignState,
  useCampaignSocial,
  useCampaignVerify,
  useCampaignOpen,
  useChestHistory,
  useXpHistory,
  useGlobalStats,
  useLeaderboard,
  useChestLeaderboard,
  useUserRank,
  useChestRank,
  signChestMessage,
} from "@/hooks/useChests";
import { CHEST_DEFS, type ChestDef } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Twitter, X, AtSign, Loader2, ShieldCheck, Wallet, Lock,
  Check, Sparkles, Gem, Crown, Gift, Repeat2, PenLine, Users,
  Copy, Zap, Trophy, Star, Clock, ChevronRight, Share2,
  TrendingUp, Medal, Flame,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TGE_DATE = new Date("2026-07-01T00:00:00Z");

const MILESTONES = [
  { xp: 1000,   label: "First Steps",     icon: "🌱", color: "#9fb1c4" },
  { xp: 5000,   label: "Rising Star",     icon: "⭐", color: "#5aa9ff" },
  { xp: 10000,  label: "Community Hero",  icon: "🏅", color: "#a855f7" },
  { xp: 25000,  label: "Whale",           icon: "🐋", color: "#c98bff" },
  { xp: 50000,  label: "Diamond Hand",    icon: "💎", color: "#06b6d4" },
  { xp: 100000, label: "Legendary",       icon: "👑", color: "#ffd25a" },
];

const TIER_ICONS: Record<string, typeof Gift> = {
  common: Gift, rare: Gem, epic: Sparkles, legendary: Crown,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortWallet(w: string) {
  return w.length > 12 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function inferDef(tier: string | null): ChestDef {
  return CHEST_DEFS.find((d) => d.id === (tier ?? "common")) ?? CHEST_DEFS[0];
}

function useCountdown(target: Date) {
  const [delta, setDelta] = useState(target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDelta(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const clamp = (v: number) => Math.max(0, v);
  return {
    d: clamp(Math.floor(delta / 86400000)),
    h: clamp(Math.floor((delta % 86400000) / 3600000)),
    m: clamp(Math.floor((delta % 3600000) / 60000)),
    s: clamp(Math.floor((delta % 60000) / 1000)),
    expired: delta <= 0,
  };
}

// ─── SparkleField ─────────────────────────────────────────────────────────────

function SparkleField() {
  const sparks = useMemo(() =>
    Array.from({ length: 26 }, (_, i) => ({
      left: `${5 + ((i * 3.8 + i * i * 0.35) % 90)}%`,
      top:  `${8 + ((i * 7.1 + i * 2.3) % 82)}%`,
      size: 1.5 + (i % 3) * 0.7,
      dur:  1.4 + (i % 4) * 0.5,
      delay: (i % 7) * 0.35,
    })), []);
  return (
    <>
      {sparks.map((s, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none bg-white" style={{
          left: s.left, top: s.top, width: s.size, height: s.size,
          animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </>
  );
}

// ─── ChestIcon ────────────────────────────────────────────────────────────────

function ChestIcon({ def, size = 80, glowing = true, animateFloat = false, animateShake = false }: {
  def: ChestDef; size?: number; glowing?: boolean; animateFloat?: boolean; animateShake?: boolean;
}) {
  const Icon = TIER_ICONS[def.id] ?? Gift;
  const GRADS: Record<string, string> = {
    common:    "linear-gradient(155deg,#8a7b68,#4d3c28)",
    rare:      "linear-gradient(155deg,#6aa8e8,#1d4e9a)",
    epic:      "linear-gradient(155deg,#c084fc,#6d28d9)",
    legendary: "linear-gradient(155deg,#ffd25a,#a04000,#0d0500)",
  };
  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
      animation: animateFloat ? "float 3.2s ease-in-out infinite" : animateShake ? "chestShake 0.4s ease-in-out infinite" : undefined }}>
      {glowing && (
        <div style={{ position: "absolute", inset: 0, background: def.glow, borderRadius: "50%",
          filter: `blur(${size * 0.38}px)`, opacity: 0.28 }} />
      )}
      <div style={{ width: size * 0.86, height: size * 0.86, borderRadius: "18%",
        background: GRADS[def.id] ?? GRADS.common,
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: glowing ? `0 4px 24px -4px ${def.glow}55, inset 0 1px 0 rgba(255,255,255,0.18)` : "none",
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "38%",
          background: "rgba(255,255,255,0.13)", borderRadius: "18% 18% 0 0" }} />
        <Icon size={size * 0.3} color="white"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))", position: "relative", top: "5%" }} />
      </div>
    </div>
  );
}

// ─── Connect X Modal ──────────────────────────────────────────────────────────

function ConnectXModal({ onClose, wallet }: { onClose: () => void; wallet: string }) {
  const [username, setUsername] = useState("");
  const connectX = useConnectX();
  const { toast } = useToast();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 80); }, []);
  const submit = async () => {
    const u = username.replace(/^@/, "").trim();
    if (!u) return;
    try {
      await connectX.mutateAsync({ wallet, xUsername: u });
      toast({ title: "X connected!", description: `@${u} linked to your wallet.` });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[400px] mx-4 mb-4 sm:mb-0 rounded-[24px] border border-white/8 bg-[#010804] shadow-2xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1d9bf0]/50 to-transparent" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#010804] border border-white/8">
                <Twitter size={18} className="text-[#1d9bf0]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">Connect X Account</p>
                <p className="text-[12px] text-white/40">Required to open the campaign chest</p>
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white/70" data-testid="button-close-connectx">
              <X size={14} />
            </button>
          </div>
          <div className="relative mb-4">
            <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1d9bf0]" />
            <input ref={ref} value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="yourhandle" className="w-full rounded-[12px] border border-white/8 bg-[#051208] pl-9 pr-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-[#1d9bf0]/50"
              data-testid="input-x-username" />
          </div>
          <Button onClick={submit} disabled={!username.trim() || connectX.isPending}
            className="w-full h-11 rounded-[12px] bg-[#1d9bf0] text-white font-semibold hover:bg-[#1a8cd8] disabled:opacity-40"
            data-testid="button-connect-x">
            {connectX.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <ShieldCheck size={16} className="mr-2" />}
            Connect Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Open Chest Modal ─────────────────────────────────────────────────────────

type Phase = "idle" | "charging" | "shaking" | "burst" | "reveal" | "celebrate";

function OpenChestModal({ tier, xp, onClose }: { tier: string; xp: number; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [shownXp, setShownXp] = useState(0);
  const def = inferDef(tier);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("charging"), 650),
      setTimeout(() => setPhase("shaking"), 1300),
      setTimeout(() => setPhase("burst"),   1800),
      setTimeout(() => setPhase("reveal"),  2250),
      setTimeout(() => setPhase("celebrate"), 2750),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase !== "celebrate") return;
    const dur = 1800;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setShownXp(Math.round((1 - Math.pow(1 - p, 3)) * xp));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, xp]);

  const particles = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2;
      const dist = 90 + Math.random() * 90;
      return {
        px: Math.round(Math.cos(angle) * dist),
        py: Math.round(Math.sin(angle) * dist),
        color: [def.glow, "#ffd25a", "rgba(255,255,255,0.9)", def.color][Math.floor(Math.random() * 4)],
        size: 4 + Math.floor(Math.random() * 9),
        delay: (Math.random() * 0.28).toFixed(2),
      };
    }), [def]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center" data-testid="modal-chest-open">
      <div className="absolute inset-0 bg-black/94" style={{ backdropFilter: "blur(18px)" }}
        onClick={phase === "celebrate" ? onClose : undefined} />
      <div className="relative flex flex-col items-center text-center px-6 select-none">

        {/* Spinning rays */}
        {(phase === "reveal" || phase === "celebrate") && (
          <div style={{ position: "absolute", width: 580, height: 580, top: "50%", left: "50%",
            background: `conic-gradient(from 0deg,transparent 0%,${def.glow}16 8%,transparent 16%,${def.glow}16 24%,transparent 32%,${def.glow}16 40%,transparent 48%,${def.glow}16 56%,transparent 64%,${def.glow}16 72%,transparent 80%,${def.glow}16 88%,transparent 96%)`,
            animation: "raySpin 7s linear infinite", borderRadius: "50%", pointerEvents: "none" }} />
        )}

        {/* Charge rings */}
        {(phase === "charging" || phase === "shaking") && [1, 1.65, 2.3].map((scale, i) => (
          <div key={i} style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%",
            border: `1.5px solid ${def.glow}44`, transform: `scale(${scale})`,
            animation: `orbPulse ${1 + i * 0.3}s ease-in-out ${i * 0.18}s infinite`, pointerEvents: "none" }} />
        ))}

        {/* Chest */}
        {phase !== "burst" && (
          <ChestIcon def={def}
            size={phase === "reveal" || phase === "celebrate" ? 165 : 130}
            animateFloat={phase === "idle"}
            animateShake={phase === "shaking"}
            glowing={phase !== "idle"} />
        )}

        {/* Burst particles */}
        {phase === "burst" && (
          <div style={{ position: "relative", width: 0, height: 0 }}>
            {particles.map((p, i) => (
              <div key={i} style={{
                position: "absolute", width: p.size, height: p.size, borderRadius: "50%",
                background: p.color, top: -p.size / 2, left: -p.size / 2,
                ["--px" as string]: `${p.px}px`,
                ["--py" as string]: `${p.py}px`,
                animation: `particleFly 0.85s ${p.delay}s ease-out forwards`,
              }} />
            ))}
          </div>
        )}

        {/* Reveal / celebrate */}
        {(phase === "reveal" || phase === "celebrate") && (
          <div className="mt-10 relative" style={{ animation: "floatUp 0.55s ease-out" }}>
            <div className="inline-flex items-center gap-2 rounded-full px-5 py-1.5 mb-5 font-bold uppercase tracking-widest text-[13px]"
              style={{ background: `${def.glow}18`, border: `1px solid ${def.glow}55`, color: def.glow }}>
              {def.rarity} Chest
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap size={48} color="#ffd25a" fill="#ffd25a" />
              <span className="text-[72px] font-extrabold leading-none text-white tabular-nums"
                style={{ textShadow: `0 0 60px ${def.glow}99` }} data-testid="text-chest-reward">
                {phase === "celebrate" ? shownXp.toLocaleString() : "0"}
              </span>
            </div>
            <p className="mt-2 text-[16px] font-medium text-white/60">XP added to your balance</p>
            <p className="mt-1 text-[12px] text-white/30">Counts toward your TGE airdrop allocation</p>
            {phase === "celebrate" && (
              <Button onClick={onClose}
                className="mt-8 h-13 rounded-2xl px-12 font-bold text-[#06101a] text-[16px]"
                style={{ background: `linear-gradient(135deg, ${def.glow}, ${def.color})` }}
                data-testid="button-close-chest">
                Claim Rewards
              </Button>
            )}
          </div>
        )}

        {(phase === "idle" || phase === "charging" || phase === "shaking") && (
          <p className="mt-10 text-[15px] text-white/40 animate-pulse">
            {phase === "idle" ? "Your destiny awaits…" : phase === "charging" ? "Energy building…" : "Opening!"}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Verification Step ────────────────────────────────────────────────────────

function VStep({ n, label, done, children }: { n: number; label: string; done: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <div className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
        done ? "bg-[#22c55e] text-white" : "border border-white/15 bg-white/5 text-white/40"}`}>
        {done ? <Check size={13} /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium transition-colors ${done ? "text-white/30 line-through" : "text-white/80"}`}>{label}</p>
        {!done && children ? <div className="mt-2">{children}</div> : null}
      </div>
    </div>
  );
}

// ─── Loot Tier Card ───────────────────────────────────────────────────────────

function LootTierCard({ def }: { def: ChestDef }) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border p-3.5 flex flex-col items-center text-center gap-2"
      style={{ borderColor: `${def.color}30`, background: `${def.color}06` }}
      data-testid={`card-loot-${def.id}`}>
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${def.glow}50,transparent)` }} />
      <ChestIcon def={def} size={56} glowing={false} />
      <div>
        <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-1"
          style={{ background: `${def.color}20`, color: def.glow }}>
          {def.chance}% chance
        </div>
        <p className="text-[12px] font-bold text-white/90">{def.rarity}</p>
        <p className="text-[10px] text-white/35 mt-0.5">
          {def.minXp === def.maxXp ? def.minXp.toLocaleString() : `${def.minXp.toLocaleString()}–${def.maxXp.toLocaleString()}`} XP
        </p>
      </div>
    </div>
  );
}

// ─── Leaderboard Section ──────────────────────────────────────────────────────

function LeaderboardSection({ userWallet }: { userWallet: string | null }) {
  const { data: board, isLoading } = useChestLeaderboard(50);
  const BADGE: Record<string, string> = { Bronze: "#cd7f32", Silver: "#c0c0c0", Gold: "#ffd25a", Diamond: "#5aa9ff", Legendary: "#f5a623" };
  return (
    <div className="rounded-[18px] border border-white/6 overflow-hidden" style={{ background: "rgba(1,8,4,0.6)" }}>
      <div className="px-4 py-3.5 border-b border-white/6 flex items-center gap-2">
        <Trophy size={15} className="text-[#ffd25a]" />
        <h3 className="text-[14px] font-bold text-white">Chest Leaderboard</h3>
        <span className="ml-auto text-[11px] text-white/25">Top 50</span>
      </div>
      {isLoading ? (
        <div className="py-10 text-center text-[13px] text-white/30 animate-pulse">Loading…</div>
      ) : !board?.length ? (
        <div className="py-12 text-center text-[13px] text-white/30">No participants yet — be the first!</div>
      ) : (
        <div className="divide-y divide-white/4 max-h-[420px] overflow-y-auto">
          {board.map((entry, i) => {
            const isMe = userWallet?.toLowerCase() === entry.wallet_address?.toLowerCase();
            const bc = BADGE[entry.tier ?? "Bronze"] ?? "#cd7f32";
            return (
              <div key={entry.wallet_address}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isMe ? "bg-white/4" : "hover:bg-white/2"}`}
                data-testid={`row-leaderboard-${i}`}>
                <span className={`w-7 text-center text-[12px] font-bold ${i === 0 ? "text-[#ffd25a]" : i === 1 ? "text-[#c0c0c0]" : i === 2 ? "text-[#cd7f32]" : "text-white/25"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span className={`flex-1 text-[12px] font-mono truncate ${isMe ? "text-[#5aa9ff] font-bold" : "text-white/60"}`}>
                  {shortWallet(entry.wallet_address)}{isMe ? " (you)" : ""}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: bc, background: `${bc}18` }}>
                  {entry.tier ?? "Bronze"}
                </span>
                <span className="text-[12px] font-bold text-[#ffd25a] tabular-nums">{(entry.chest_xp ?? 0).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Milestones Section ───────────────────────────────────────────────────────

function MilestonesSection({ userXp }: { userXp: number }) {
  return (
    <div className="rounded-[18px] border border-white/6 p-4" style={{ background: "rgba(1,8,4,0.6)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Star size={15} className="text-[#ffd25a]" />
        <h3 className="text-[14px] font-bold text-white">Milestone Achievements</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MILESTONES.map((m) => {
          const unlocked = userXp >= m.xp;
          return (
            <div key={m.xp}
              className={`relative overflow-hidden rounded-[14px] border p-3 flex flex-col items-center text-center gap-1 transition-all duration-300 ${unlocked ? "" : "opacity-40 grayscale"}`}
              style={unlocked
                ? { borderColor: `${m.color}30`, background: `${m.color}0a` }
                : { borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
              data-testid={`badge-milestone-${m.xp}`}>
              {unlocked && <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#22c55e]" />}
              <span className="text-[22px]">{m.icon}</span>
              <p className="text-[11px] font-bold" style={{ color: unlocked ? m.color : "rgba(255,255,255,0.35)" }}>{m.label}</p>
              <p className="text-[10px] text-white/25">{m.xp.toLocaleString()} XP</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── History Section ──────────────────────────────────────────────────────────

const XP_TYPE_CONFIG = {
  swap:      { color: "#5aa9ff", bg: "#5aa9ff18", label: "Swap",      Icon: Repeat2  },
  earn_task: { color: "#ffd25a", bg: "#ffd25a18", label: "Task",      Icon: Zap       },
  chest:     { color: "#a855f7", bg: "#a855f718", label: "Chest",     Icon: Gift      },
} as const;

function HistorySection({ wallet }: { wallet: string | null }) {
  const { data: history, isLoading } = useXpHistory(wallet);
  return (
    <div className="rounded-[18px] border border-white/6 overflow-hidden" style={{ background: "rgba(1,8,4,0.6)" }}>
      <div className="px-4 py-3.5 border-b border-white/6 flex items-center gap-2">
        <Clock size={15} className="text-white/40" />
        <h3 className="text-[14px] font-bold text-white">XP History</h3>
        <span className="ml-auto text-[11px] text-white/25">All sources</span>
      </div>
      {isLoading ? (
        <div className="py-10 text-center text-[13px] text-white/30 animate-pulse">Loading…</div>
      ) : !wallet ? (
        <div className="py-12 text-center text-[13px] text-white/30">Connect wallet to see your XP history.</div>
      ) : !history?.length ? (
        <div className="py-12 text-center text-[13px] text-white/30">No XP earned yet — start swapping or completing tasks!</div>
      ) : (
        <div className="divide-y divide-white/4 max-h-[420px] overflow-y-auto">
          {history.map((item, i) => {
            const cfg = XP_TYPE_CONFIG[item.type] ?? XP_TYPE_CONFIG.swap;
            const date = new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2" data-testid={`row-history-${i}`}>
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: cfg.bg }}>
                  <cfg.Icon size={14} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white/90 truncate">{item.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                    {item.detail && <span className="text-[11px] text-white/30">{item.detail}</span>}
                    <span className="text-[11px] text-white/25 ml-auto">{date}</span>
                  </div>
                </div>
                <span className="text-[13px] font-bold tabular-nums ml-2" style={{ color: cfg.color }}>
                  +{item.xp.toLocaleString()} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Referral Section ─────────────────────────────────────────────────────────

function ReferralSection({ wallet }: { wallet: string | null }) {
  const { data: referral } = useReferralStats(wallet);
  const { toast } = useToast();
  const code = referral?.referral_code ?? "";
  const refLink = code ? `${window.location.origin}/ref/${code}` : "";

  const copy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
  };
  const shareX = () => {
    if (!refLink) return;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on @SuperSwap_fi and earn XP toward the TGE! 🎁 ${refLink} #SuperSwap #Base`)}`, "_blank");
  };
  const shareTg = () => {
    if (!refLink) return;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("Join the SuperSwap Community Chest Campaign and earn XP! 🚀")}`, "_blank");
  };

  return (
    <div className="rounded-[22px] border border-white/6 p-5" style={{ background: "linear-gradient(135deg,rgba(1,8,4,0.9),rgba(1,8,4,0.9))" }}>
      <div className="flex items-center gap-2 mb-1">
        <Users size={17} className="text-[#22c55e]" />
        <h2 className="text-[15px] font-bold text-white">Invite Friends, Earn 25%</h2>
      </div>
      <p className="text-[12px] text-white/40 mb-4 leading-relaxed">
        Every time a referred friend earns XP, you automatically receive an extra{" "}
        <span className="font-semibold text-[#9fe6b4]">25%</span> bonus on top.
      </p>

      {!wallet ? (
        <p className="text-[12px] text-white/30 flex items-center gap-1.5">
          <ChevronRight size={12} /> Connect wallet to get your referral link.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-[12px] border border-white/8 bg-white/3 px-3 py-2.5 mb-2.5">
            <p className="flex-1 text-[12px] font-mono text-white/60 truncate" data-testid="text-referral-link">
              {refLink || "—"}
            </p>
            <button onClick={copy}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] border border-white/10 bg-white/5 text-[11px] text-white/55 hover:text-white hover:bg-white/10 transition-colors"
              data-testid="button-copy-link">
              <Copy size={11} /> Copy
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={shareX}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[10px] bg-[#1d9bf0]/12 border border-[#1d9bf0]/18 text-[#1d9bf0] text-[11px] font-semibold hover:bg-[#1d9bf0]/22 transition-colors"
              data-testid="button-share-x">
              <Twitter size={12} /> Share X
            </button>
            <button onClick={shareTg}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[10px] bg-[#0088cc]/12 border border-[#0088cc]/18 text-[#0088cc] text-[11px] font-semibold hover:bg-[#0088cc]/22 transition-colors"
              data-testid="button-share-telegram">
              <Share2 size={12} /> Telegram
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Friends Invited", value: (referral?.referral_count ?? 0).toString(), color: "text-white", id: "text-referral-count" },
              { label: "Bonus XP Earned", value: (referral?.referral_bonus_xp ?? 0).toLocaleString(), color: "text-[#ffd25a]", id: "text-referral-bonus" },
            ].map(({ label, value, color, id }) => (
              <div key={label} className="rounded-[12px] border border-white/6 bg-white/3 p-3 text-center">
                <p className={`text-[18px] font-bold ${color}`} data-testid={id}>{value}</p>
                <p className="text-[10px] text-white/35 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CampaignPostModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const { data: settings } = usePublicSettings();
  const campaignUrl = settings?.campaign_post_url ||
    "https://x.com/SuperSwap_fi/status/2062249666977354053";

  const openCampaign = () => {
    if (campaignUrl) {
      window.open(campaignUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[420px] mx-4 rounded-[24px] border border-white/10 bg-[#010804] p-6">
        <h3 className="text-[20px] font-bold text-white mb-2">
          Complete X Tasks
        </h3>

        <p className="text-[13px] text-white/45 mb-5">
          Please like and repost the campaign post before continuing.
        </p>

        <div className="space-y-3">
          <button
            onClick={openCampaign}
            className="w-full h-11 rounded-xl bg-[#1d9bf0] text-white font-semibold"
          >
            ❤️ Like Campaign Post
          </button>

          <button
            onClick={openCampaign}
            className="w-full h-11 rounded-xl bg-[#1d9bf0] text-white font-semibold"
          >
            🔁 Repost Campaign Post
          </button>
        </div>

        <button
          onClick={onComplete}
          className="w-full mt-5 h-11 rounded-xl bg-[#22c55e] text-white font-semibold"
        >
          I've Completed Both Tasks
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 h-10 rounded-xl border border-white/10 text-white/50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
// ─── Main Page ────────────────────────────────────────────────────────────────

export function EarnPage() {
  const wallet = useWalletContext();
  const walletAddress = wallet.address;
  const { toast } = useToast();

  const { data: user }     = useRewardUser(walletAddress);
  const { data: xAccount } = useXAccount(walletAddress ?? undefined);
  const { data: campaign } = useCampaignState(walletAddress);
  const { data: globalStats } = useGlobalStats();
  const { data: rankData }    = useChestRank(walletAddress);
  const { data: chestBoard }  = useChestLeaderboard(50);

  const socialMut = useCampaignSocial(walletAddress);
  const verifyMut = useCampaignVerify(walletAddress);
  const openMut   = useCampaignOpen(walletAddress);
  const countdown = useCountdown(TGE_DATE);

  const [showConnectX, setShowConnectX] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [opening, setOpening] = useState<{ tier: string; xp: number } | null>(null);
  const [shared, setShared] = useState(false);
  const [shareCd, setShareCd] = useState(0);
  const shareTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "milestones" | "history">("leaderboard");

  useEffect(() => () => { if (shareTimer.current) clearInterval(shareTimer.current); }, []);

  const xConnected = !!xAccount?.x_username;
  const userChestXp = user?.xp ?? 0;
  const userTier = user?.tier ?? "Bronze";

  const handleShare = () => {
    setShowCampaignModal(true);
  };

  const handleConfirmSocial = async () => {
    try {
      await socialMut.mutateAsync();
      toast({ title: "Task confirmed!", description: "Now sign to verify your wallet." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleSign = async () => {
    if (!walletAddress) return;
    try {
      const sig = await signChestMessage(walletAddress, "campaign");
      await verifyMut.mutateAsync(sig);
      toast({ title: "Wallet verified!", description: "You can now open your Community Chest." });
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message ?? "Signature rejected", variant: "destructive" });
    }
  };

  const handleOpen = async () => {
    try {
      const res = await openMut.mutateAsync();
      setOpening({ tier: res.tier, xp: res.xpAwarded });
    } catch (e: any) {
      toast({ title: "Could not open", description: e.message, variant: "destructive" });
    }
  };

  const canOpen   = !!(campaign?.verified && !campaign?.opened && walletAddress);
  const wasOpened = !!(campaign?.opened);

  const TIER_BADGE: Record<string, string> = {
    Bronze: "#cd7f32", Silver: "#c0c0c0", Gold: "#ffd25a", Diamond: "#5aa9ff", Legendary: "#f5a623",
  };
  const tierColor = TIER_BADGE[user?.tier ?? "Bronze"] ?? "#cd7f32";

  return (
    <div className="min-h-screen bg-[#010804] pb-24">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes chestShake { 0%,100%{transform:rotate(0deg)} 15%{transform:rotate(-9deg)} 30%{transform:rotate(9deg)} 45%{transform:rotate(-6deg)} 60%{transform:rotate(6deg)} 75%{transform:rotate(-3deg)} }
        @keyframes raySpin { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes floatUp { from{transform:translateY(22px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes particleFly { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--px),var(--py)) scale(0);opacity:0} }
        @keyframes orbPulse { 0%,100%{transform:scale(var(--s,1));opacity:0.55} 50%{transform:scale(calc(var(--s,1)*1.22));opacity:0.12} }
        @keyframes bgDrift { 0%,100%{transform:translate(0px,0px) rotate(0deg)} 33%{transform:translate(18px,-10px) rotate(9deg)} 66%{transform:translate(-10px,14px) rotate(-6deg)} }
        @keyframes twinkle { 0%,100%{opacity:0.12;transform:scale(0.7)} 50%{opacity:0.9;transform:scale(1.3)} }
        @keyframes openBtnPulse { 0%,100%{box-shadow:0 0 30px rgba(253,210,90,0.35)} 50%{box-shadow:0 0 65px rgba(253,210,90,0.75),0 0 110px rgba(168,85,247,0.2)} }
      `}</style>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#010804 0%,#010804 55%,#010804 100%)" }}>
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full blur-3xl" style={{ background: "rgba(0,255,136,0.15)" }} />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full blur-3xl" style={{ background: "rgba(0,255,136,0.12)" }} />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(0,255,136,0.10)" }} />
        <SparkleField />

        {/* Floating bg chests */}
        {[
          { d: CHEST_DEFS[3], x: "7%",  y: "14%", size: 58, dur: 4.2, delay: 0 },
          { d: CHEST_DEFS[2], x: "87%", y: "18%", size: 46, dur: 3.6, delay: 0.7 },
          { d: CHEST_DEFS[1], x: "78%", y: "62%", size: 38, dur: 5.0, delay: 1.4 },
          { d: CHEST_DEFS[0], x: "14%", y: "68%", size: 33, dur: 4.7, delay: 0.4 },
        ].map((item, i) => (
          <div key={i} className="absolute pointer-events-none"
            style={{ left: item.x, top: item.y, opacity: 0.1,
              animation: `bgDrift ${item.dur}s ease-in-out ${item.delay}s infinite` }}>
            <ChestIcon def={item.d} size={item.size} glowing={false} />
          </div>
        ))}

        {/* Full-width hero banner at the top */}
        <div className="w-full overflow-hidden">
          <img
            src={heroBanner}
            alt="Super Chest Campaign"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="relative mx-auto max-w-[960px] px-4 py-12 sm:py-16">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3.5 py-1 mb-5">
            ...
          </div>

          {/* Countdown */}
          {/* TGE Status */}
          <div className="flex flex-wrap items-center gap-2 mb-7">
            <span className="text-[11px] text-white/35 uppercase tracking-wide">
              Complete community tasks, unlock chests, earn XP, and strengthen your position before TGE
            </span>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: "Your XP",      value: userChestXp.toLocaleString(), icon: <Zap size={13} color="#ffd25a" fill="#ffd25a" />, id: "text-total-xp" },
              { label: "Your Tier",    value: userTier,  icon: <Medal size={13} style={{ color: tierColor }} />, id: "text-tier" },
              { label: "Your Rank",    value: rankData?.rank ? `#${rankData.rank}` : "—", icon: <Trophy size={13} color="#5aa9ff" />, id: "text-rank" },
              { label: "Global XP",   value: (globalStats?.chestTotalXp ?? 0).toLocaleString(), icon: <TrendingUp size={13} color="#22c55e" />, id: "text-global-xp" },
              { label: "Participants", value: (globalStats?.chestParticipants ?? 0).toLocaleString(), icon: <Users size={13} color="#9fb1c4" />, id: "text-participants" },
            ].map(({ label, value, icon, id }) => (
              <div key={label} className="flex items-center gap-2 rounded-[14px] border border-white/8 bg-white/4 px-3.5 py-2 backdrop-blur-sm">
                {icon}
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-white/30">{label}</p>
                  <p className="text-[14px] font-bold leading-none text-white" data-testid={id}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[960px] px-4 mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

        {/* LEFT */}
        <div className="space-y-5">

          {/* Campaign card */}
          <div className="relative overflow-hidden rounded-[24px] border border-white/8 p-6" style={{ background: "rgba(1,8,4,0.95)" }}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a855f7]/40 to-transparent" />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(168,85,247,0.07)" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Gift size={18} className="text-[#ffd25a]" />
                <h2 className="text-[18px] font-bold text-white">Open Your Community Chest</h2>
              </div>
              <p className="text-[13px] text-white/40 mb-6">
                Complete 3 quick steps to unlock the campaign chest. One per wallet — random tier draw on every open.
              </p>

              {/* Steps */}
              {!walletAddress ? (
                <div className="rounded-[16px] border border-white/8 bg-white/2 px-4 py-4 flex items-center gap-3 mb-6">
                  <Wallet size={18} className="text-white/25" />
                  <p className="text-[13px] text-white/45">Connect your wallet to begin.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <VStep n={1} label="Connect your X (Twitter) account" done={xConnected}>
                    <Button onClick={() => setShowConnectX(true)}
                      className="h-9 rounded-full bg-[#1d9bf0] px-4 text-[12px] font-semibold text-white hover:bg-[#1a8cd8]"
                      data-testid="button-connect-x-step">
                      <Twitter size={13} className="mr-1.5" /> Connect X
                    </Button>
                  </VStep>
                  <VStep n={2} label="Like & Repost campaign post on X" done={campaign?.social_done ?? false}>
                    {xConnected && !campaign?.social_done && (
                      !shared ? (
                        <Button onClick={handleShare}
                          className="h-9 rounded-full bg-[#1d9bf0] px-4 text-[12px] font-semibold text-white hover:bg-[#1a8cd8]"
                          data-testid="button-share-campaign">
                          <Repeat2 size={13} className="mr-1.5" /> Like &amp; Repost
                        </Button>
                      ) : shareCd > 0 ? (
                        <div className="flex h-9 w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4">
                          <Loader2 size={12} className="animate-spin text-white/40" />
                          <span className="text-[12px] text-white/50">Confirm in {shareCd}s…</span>
                        </div>
                      ) : (
                        <Button onClick={handleConfirmSocial} disabled={socialMut.isPending}
                          className="h-9 rounded-full bg-[#22c55e] px-4 text-[12px] font-semibold text-white hover:bg-[#16a34a]"
                          data-testid="button-confirm-social">
                          {socialMut.isPending ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <Check size={12} className="mr-1.5" />}
                          I&apos;ve done it
                        </Button>
                      )
                    )}
                  </VStep>
                  <VStep n={3} label="Sign wallet verification message" done={campaign?.verified ?? false}>
                    {campaign?.social_done && !campaign?.verified && (
                      <Button onClick={handleSign} disabled={verifyMut.isPending}
                        className="h-9 rounded-full border border-white/12 bg-white/5 px-4 text-[12px] font-semibold text-white/75 hover:bg-white/10"
                        data-testid="button-sign-campaign">
                        {verifyMut.isPending ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <PenLine size={12} className="mr-1.5" />}
                        Sign Message
                      </Button>
                    )}
                  </VStep>
                </div>
              )}

              {/* Loot table */}
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-white/25 mb-3">Possible rewards — random draw</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CHEST_DEFS.map((def) => <LootTierCard key={def.id} def={def} />)}
                </div>
              </div>

              {/* Open CTA */}
              {walletAddress && (
                wasOpened ? (
                  <div className="rounded-[18px] border border-[#22c55e]/25 bg-[#22c55e]/7 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#22c55e]/15 flex-none">
                        <Check size={18} className="text-[#22c55e]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-white">Chest Opened!</p>
                        <p className="text-[12px] text-white/35">Your XP is locked in for TGE</p>
                      </div>
                    </div>
                    <span className="text-[18px] font-extrabold text-[#ffd25a] tabular-nums" data-testid="text-campaign-xp-earned">
                      +{(campaign?.xp_awarded ?? 0).toLocaleString()} XP
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleOpen}
                    disabled={!canOpen || openMut.isPending}
                    className={`w-full h-[60px] rounded-[18px] font-bold text-[17px] flex items-center justify-center gap-2.5 transition-all duration-200 ${
                      canOpen ? "text-[#06101a]" : "text-white/25 cursor-not-allowed border border-white/8 bg-white/3"
                    }`}
                    style={canOpen ? {
                      background: "linear-gradient(135deg,#ffd25a,#f5a623,#a855f7)",
                      animation: "openBtnPulse 2.2s ease-in-out infinite",
                    } : {}}
                    data-testid="button-open-campaign">
                    {openMut.isPending
                      ? <Loader2 size={20} className="animate-spin" />
                      : canOpen ? <Sparkles size={20} /> : <Lock size={18} />}
                    {openMut.isPending ? "Opening…" : canOpen ? "Open Community Chest" : "Complete steps above"}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex gap-1 rounded-[14px] border border-white/8 bg-white/2 p-1 mb-3">
              {(["leaderboard", "milestones", "history"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 h-9 rounded-[10px] text-[13px] font-semibold capitalize transition-all ${
                    activeTab === tab ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
                  }`} data-testid={`tab-${tab}`}>
                  {tab}
                </button>
              ))}
            </div>
            {activeTab === "leaderboard" && <LeaderboardSection userWallet={walletAddress} />}
            {activeTab === "milestones"  && <MilestonesSection  userXp={userChestXp} />}
            {activeTab === "history"     && <HistorySection     wallet={walletAddress} />}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <ReferralSection wallet={walletAddress} />

          {/* Progress card */}
          <div className="rounded-[22px] border border-white/6 p-5" style={{ background: "rgba(1,8,4,0.95)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Flame size={15} className="text-[#f97316]" />
              <h3 className="text-[14px] font-bold text-white">Your Progress</h3>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-white/40">Level {user?.level ?? 1}</span>
                <span className="text-white/40">{userChestXp.toLocaleString()} XP</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(((userChestXp % 100) / 100) * 100, 100)}%`,
                    background: "linear-gradient(90deg,#a855f7,#ffd25a)" }} />
              </div>
            </div>
            {[
              { label: "Tier",  val: user?.tier ?? "Bronze", color: tierColor },
              { label: "Level", val: String(user?.level ?? 1), color: "#c98bff" },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[12px] text-white/35">{label}</span>
                <span className="text-[13px] font-bold" style={{ color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCampaignModal && (
        <CampaignPostModal
          onClose={() => setShowCampaignModal(false)}
          onComplete={() => {
            setShowCampaignModal(false);

            setShared(true);
            setShareCd(5);

            shareTimer.current = setInterval(() => {
              setShareCd((c) => {
                if (c <= 1) {
                  clearInterval(shareTimer.current!);
                  return 0;
                }
                return c - 1;
              });
            }, 1000);
          }}
        />
      )}
      {showConnectX && walletAddress && (
        <ConnectXModal wallet={walletAddress} onClose={() => setShowConnectX(false)} />
      )}
      {opening && (
        <OpenChestModal tier={opening.tier} xp={opening.xp} onClose={() => setOpening(null)} />
      )}
    </div>
  );
}
