import { useState, useEffect, useRef } from "react";
import { useWalletContext } from "@/context/WalletContext";
import { useConnectX, useXAccount } from "@/hooks/useEarn";
import { useRewardUser } from "@/hooks/useRewards";
import { useReferralStats } from "@/hooks/useReferral";
import {
  useChests,
  useChestSocial,
  useChestVerify,
  useChestOpen,
  signChestMessage,
  type ChestState,
} from "@/hooks/useChests";
import { CHEST_DEFS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Twitter,
  X,
  AtSign,
  Loader2,
  ShieldCheck,
  Wallet,
  Lock,
  Check,
  Sparkles,
  Gem,
  Crown,
  Gift,
  Repeat2,
  PenLine,
  Users,
  Copy,
  Zap,
  ChevronRight,
} from "lucide-react";

// ─── Connect X modal (re-used from the previous task flow) ───────────────────────
function ConnectXModal({
  onClose,
  onConnected,
  wallet,
}: {
  onClose: () => void;
  onConnected: (username: string) => void;
  wallet: string;
}) {
  const [username, setUsername] = useState("");
  const connectX = useConnectX();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async () => {
    const cleaned = username.replace(/^@/, "").trim();
    if (!cleaned) return;
    try {
      await connectX.mutateAsync({ wallet, xUsername: cleaned });
      onConnected(cleaned);
      toast({ title: "X account connected!", description: `@${cleaned} linked to your wallet.` });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[400px] mx-4 mb-4 sm:mb-0 rounded-[24px] border border-[#1a2535] bg-[#060e18] shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#1d9bf0]/40 to-transparent" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d1b2a] border border-[#1a2535]">
                <Twitter size={18} className="text-[#1d9bf0]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#e8ecf0]">Connect X Account</p>
                <p className="text-[12px] text-[#5f6a7c]">Required to unlock chests</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1a2535] text-[#5f6a7c] hover:text-[#cfd8e3]">
              <X size={14} />
            </button>
          </div>
          <div className="rounded-[14px] border border-[#0d2233] bg-[#040c14] p-3 mb-4">
            <p className="text-[12px] text-[#4d8ab8] leading-[1.5]">
              Enter your X (Twitter) username. You'll like &amp; repost our post before opening each chest.
            </p>
          </div>
          <div className="relative mb-4">
            <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4d8ab8]" />
            <input
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="yourhandle"
              className="w-full rounded-[12px] border border-[#1a2535] bg-[#0d1520] pl-9 pr-4 py-3 text-[14px] text-[#e8ecf0] placeholder:text-[#3d4f5f] outline-none focus:border-[#1d9bf0]/50"
              data-testid="input-x-username"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!username.trim() || connectX.isPending}
            className="w-full h-11 rounded-[12px] bg-[#1d9bf0] text-white font-semibold hover:bg-[#1a8cd8] disabled:opacity-40"
            data-testid="button-connect-x"
          >
            {connectX.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <ShieldCheck size={16} className="mr-2" />}
            Connect Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Chest visual ────────────────────────────────────────────────────────────────
const RARITY_ICON: Record<string, typeof Gem> = {
  Common: Gift,
  Rare: Gem,
  Epic: Sparkles,
  Legendary: Crown,
};

function ChestVisual({ chest, size = 96, shaking = false, dim = false }: { chest: ChestState; size?: number; shaking?: boolean; dim?: boolean }) {
  const Icon = RARITY_ICON[chest.rarity] ?? Gift;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size, animation: shaking ? "chestShake 0.5s ease-in-out infinite" : undefined }}
    >
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: chest.glow, opacity: dim ? 0.06 : 0.22 }}
      />
      <div
        className="relative flex items-center justify-center rounded-[22%]"
        style={{
          width: size * 0.82,
          height: size * 0.82,
          background: `linear-gradient(160deg, ${chest.glow}, ${chest.color})`,
          boxShadow: dim ? "none" : `0 8px 30px -6px ${chest.glow}80, inset 0 1px 0 rgba(255,255,255,0.35)`,
          opacity: dim ? 0.45 : 1,
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <div
          className="absolute left-0 right-0 top-0 rounded-t-[22%]"
          style={{ height: "38%", background: "rgba(255,255,255,0.16)" }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a0f17]/40 flex items-center justify-center"
          style={{ width: size * 0.3, height: size * 0.3 }}
        >
          <Icon size={size * 0.18} className="text-white drop-shadow" />
        </div>
      </div>
    </div>
  );
}

// ─── Opening animation modal ───────────────────────────────────────────────────
function OpenChestModal({ chest, xp, onClose }: { chest: ChestState; xp: number; onClose: () => void }) {
  const [phase, setPhase] = useState<"opening" | "revealed">("opening");
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase("revealed"), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "revealed") return;
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(eased * xp));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, xp]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" data-testid="modal-chest-open">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={phase === "revealed" ? onClose : undefined} />
      <div className="relative flex flex-col items-center px-6 text-center">
        {phase === "revealed" && (
          <div
            className="absolute left-1/2 top-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 360,
              height: 360,
              background: `conic-gradient(from 0deg, transparent, ${chest.glow}55, transparent, ${chest.glow}55, transparent)`,
              animation: "raySpin 8s linear infinite",
            }}
          />
        )}
        <div className="relative" style={{ animation: phase === "revealed" ? "chestBurst 0.5s ease-out" : undefined }}>
          <ChestVisual chest={chest} size={180} shaking={phase === "opening"} />
        </div>

        {phase === "revealed" && (
          <div className="relative mt-6" style={{ animation: "floatUp 0.5s ease-out" }}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em]" style={{ color: chest.glow }}>
              {chest.rarity} reward
            </p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Zap size={34} className="text-[#ffd25a]" fill="#ffd25a" />
              <span className="text-[52px] font-extrabold leading-none text-white tabular-nums" data-testid="text-chest-reward">
                {shown.toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-[15px] font-medium text-[#9fb1c4]">XP added to your balance</p>
            <p className="mt-1 text-[12px] text-[#5f6a7c]">Counts toward the TGE airdrop</p>
            <Button
              onClick={onClose}
              className="mt-6 h-11 rounded-[12px] px-8 font-semibold text-[#06101a]"
              style={{ background: `linear-gradient(135deg, ${chest.glow}, ${chest.color})` }}
              data-testid="button-close-chest"
            >
              Awesome
            </Button>
          </div>
        )}
        {phase === "opening" && <p className="mt-8 text-[15px] font-medium text-[#9fb1c4] animate-pulse">Opening {chest.name}…</p>}
      </div>
    </div>
  );
}

// ─── Step row ──────────────────────────────────────────────────────────────────
function Step({ index, label, done, children }: { index: number; label: string; done: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
          done ? "bg-[#2dae50] text-white" : "border border-[#22303f] bg-[#0d1520] text-[#5f6a7c]"
        }`}
      >
        {done ? <Check size={13} /> : index}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium ${done ? "text-[#5f6a7c] line-through" : "text-[#cfd8e3]"}`}>{label}</p>
        {!done && children ? <div className="mt-2">{children}</div> : null}
      </div>
    </div>
  );
}

// ─── Chest card ────────────────────────────────────────────────────────────────
function ChestCard({
  chest,
  userXp,
  walletAddress,
  xConnected,
  onConnectX,
  onOpened,
}: {
  chest: ChestState;
  userXp: number;
  walletAddress: string | null;
  xConnected: boolean;
  onConnectX: () => void;
  onOpened: (chest: ChestState, xp: number) => void;
}) {
  const { toast } = useToast();
  const social = useChestSocial(walletAddress);
  const verify = useChestVerify(walletAddress);
  const open = useChestOpen(walletAddress);

  const [countdown, setCountdown] = useState(0);
  const [shared, setShared] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(chest.shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShared(true);
    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleConfirmSocial = async () => {
    try {
      await social.mutateAsync(chest.id);
      toast({ title: "Step complete!", description: "Now sign to verify your wallet." });
    } catch (e: any) {
      toast({ title: "Could not verify", description: e.message, variant: "destructive" });
    }
  };

  const handleSign = async () => {
    if (!walletAddress) return;
    try {
      const signature = await signChestMessage(walletAddress, chest.id);
      await verify.mutateAsync({ chestId: chest.id, signature });
      toast({ title: "Wallet verified!", description: "You can open the chest now." });
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message ?? "Signature rejected", variant: "destructive" });
    }
  };

  const handleOpen = async () => {
    try {
      const res = await open.mutateAsync(chest.id);
      onOpened(chest, res.xpAwarded);
    } catch (e: any) {
      toast({ title: "Could not open", description: e.message, variant: "destructive" });
    }
  };

  const locked = !chest.unlocked;
  const unlockProgress = Math.min((userXp / Math.max(chest.requiredXp, 1)) * 100, 100);

  return (
    <div
      className="relative overflow-hidden rounded-[22px] border bg-[#070f1a] p-5"
      style={{ borderColor: chest.opened ? "#1a2535" : `${chest.color}55` }}
      data-testid={`card-chest-${chest.id}`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
        style={{ background: chest.glow, opacity: locked ? 0.04 : 0.12 }}
      />

      <div className="relative flex items-center gap-4">
        <ChestVisual chest={chest} size={88} dim={locked} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[16px] font-bold text-[#e8ecf0]" data-testid={`text-chest-name-${chest.id}`}>{chest.name}</h3>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${chest.color}22`, color: chest.glow }}
            >
              {chest.rarity}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-[#5f6a7c]">{chest.tagline}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Zap size={14} className="text-[#ffd25a]" fill="#ffd25a" />
            <span className="text-[14px] font-semibold text-[#ffd25a]">
              {chest.minXp.toLocaleString()}–{chest.maxXp.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 border-t border-[#13202e] pt-4">
        {chest.opened ? (
          <div className="flex items-center justify-between rounded-[14px] border border-[#0d2b1a] bg-[#071c12] px-4 py-3">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-[#2dae50]" />
              <span className="text-[13px] font-medium text-[#9fe6b4]">Opened</span>
            </div>
            <span className="text-[14px] font-bold text-[#ffd25a]" data-testid={`text-chest-earned-${chest.id}`}>
              +{chest.xp_awarded.toLocaleString()} XP
            </span>
          </div>
        ) : locked ? (
          <div className="rounded-[14px] border border-[#1a2535] bg-[#0a121d] px-4 py-3">
            <div className="flex items-center gap-2 text-[#7c8a9c]">
              <Lock size={14} />
              <span className="text-[13px] font-medium">Reach {chest.requiredXp.toLocaleString()} XP to unlock</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#11202f]">
              <div className="h-full rounded-full" style={{ width: `${unlockProgress}%`, background: `linear-gradient(90deg, ${chest.color}, ${chest.glow})` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-[#5f6a7c]">{userXp.toLocaleString()} / {chest.requiredXp.toLocaleString()} XP</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Step index={1} label="Like & Repost our post on X" done={chest.social_done}>
              {!walletAddress ? (
                <div className="flex h-9 w-fit items-center gap-1.5 rounded-full border border-[#1a2535] bg-[#0d1520] px-3">
                  <Wallet size={12} className="text-[#3d4f5f]" />
                  <span className="text-[11px] text-[#3d4f5f]">Connect wallet</span>
                </div>
              ) : !xConnected ? (
                <Button onClick={onConnectX} className="h-9 rounded-full bg-[#1d9bf0] px-4 text-[12px] font-semibold text-white hover:bg-[#1a8cd8]" data-testid={`button-connectx-${chest.id}`}>
                  <Twitter size={13} className="mr-1.5" /> Connect X
                </Button>
              ) : !shared ? (
                <Button onClick={handleShare} className="h-9 rounded-full bg-[#1d9bf0] px-4 text-[12px] font-semibold text-white hover:bg-[#1a8cd8]" data-testid={`button-share-${chest.id}`}>
                  <Repeat2 size={14} className="mr-1.5" /> Like &amp; Repost
                </Button>
              ) : countdown > 0 ? (
                <div className="flex h-9 w-fit items-center gap-2 rounded-full border border-[#1a2535] bg-[#0d1520] px-4">
                  <Loader2 size={13} className="animate-spin text-[#4d8ab8]" />
                  <span className="text-[12px] text-[#9fb1c4]">Confirm in {countdown}s…</span>
                </div>
              ) : (
                <Button onClick={handleConfirmSocial} disabled={social.isPending} className="h-9 rounded-full bg-[#2dae50] px-4 text-[12px] font-semibold text-white hover:bg-[#249b44]" data-testid={`button-confirm-social-${chest.id}`}>
                  {social.isPending ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Check size={14} className="mr-1.5" />} I've done it
                </Button>
              )}
            </Step>

            <Step index={2} label="Sign wallet verification message" done={chest.verified}>
              {chest.social_done && (
                <Button onClick={handleSign} disabled={verify.isPending} className="h-9 rounded-full bg-[#0d1b2a] border border-[#22303f] px-4 text-[12px] font-semibold text-[#cfd8e3] hover:bg-[#11202f]" data-testid={`button-sign-${chest.id}`}>
                  {verify.isPending ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <PenLine size={13} className="mr-1.5" />} Sign message
                </Button>
              )}
            </Step>

            <Step index={3} label="Open the chest" done={false}>
              {chest.verified && (
                <Button
                  onClick={handleOpen}
                  disabled={open.isPending}
                  className="h-10 w-full rounded-[12px] font-bold text-[#06101a]"
                  style={{ background: `linear-gradient(135deg, ${chest.glow}, ${chest.color})` }}
                  data-testid={`button-open-${chest.id}`}
                >
                  {open.isPending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Sparkles size={15} className="mr-2" />} Open Chest
                </Button>
              )}
            </Step>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function EarnPage() {
  const wallet = useWalletContext();
  const walletAddress = wallet.address;
  const { toast } = useToast();

  const { data: user } = useRewardUser(walletAddress);
  const { data: xAccount } = useXAccount(walletAddress ?? undefined);
  const { data: chests, isLoading } = useChests(walletAddress);
  const { data: referral } = useReferralStats(walletAddress);

  const [showConnectX, setShowConnectX] = useState(false);
  const [opening, setOpening] = useState<{ chest: ChestState; xp: number } | null>(null);

  const xConnected = !!xAccount?.x_username;
  const userXp = user?.xp ?? 0;

  const previewChests: ChestState[] = CHEST_DEFS.map((d) => ({
    ...d,
    unlocked: d.requiredXp === 0,
    social_done: false,
    verified: false,
    opened: false,
    xp_awarded: 0,
  }));
  const displayChests = chests ?? (walletAddress ? [] : previewChests);

  const copyCode = () => {
    if (!referral?.referral_code) return;
    navigator.clipboard.writeText(referral.referral_code);
    toast({ title: "Copied!", description: "Referral code copied to clipboard." });
  };

  return (
    <div className="min-h-screen bg-[#04080e] pb-24">
      <style>{`
        @keyframes chestShake { 0%,100%{transform:rotate(0deg)} 15%{transform:rotate(-7deg)} 30%{transform:rotate(7deg)} 45%{transform:rotate(-5deg)} 60%{transform:rotate(5deg)} 75%{transform:rotate(-3deg)} }
        @keyframes chestBurst { 0%{transform:scale(0.7)} 60%{transform:scale(1.12)} 100%{transform:scale(1)} }
        @keyframes raySpin { to { transform: rotate(360deg) } }
        @keyframes floatUp { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      <div className="mx-auto w-full max-w-[860px] px-4 pt-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#16243a] bg-gradient-to-br from-[#0a1626] to-[#070f1a] p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#f5a623]/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-[#ffd25a]" />
              <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#ffd25a]">Community Chests</span>
            </div>
            <h1 className="mt-2 text-[26px] font-extrabold leading-tight text-[#f4f7fb]">
              Open chests. Stack XP. Win the airdrop.
            </h1>
            <p className="mt-1.5 max-w-[560px] text-[13px] leading-relaxed text-[#7c8a9c]">
              Complete a quick X task, verify your wallet, and crack open chests worth up to 100,000 XP — all counting toward your TGE allocation.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-[14px] border border-[#1a2535] bg-[#060e18] px-4 py-2.5">
                <Zap size={16} className="text-[#ffd25a]" fill="#ffd25a" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#5f6a7c]">Your XP</p>
                  <p className="text-[16px] font-bold leading-none text-[#f4f7fb] tabular-nums" data-testid="text-total-xp">{userXp.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-[14px] border border-[#1a2535] bg-[#060e18] px-4 py-2.5">
                <Crown size={16} className="text-[#a855f7]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#5f6a7c]">Tier</p>
                  <p className="text-[16px] font-bold leading-none text-[#f4f7fb]" data-testid="text-tier">{user?.tier ?? "Bronze"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-[14px] border border-[#1a2535] bg-[#060e18] px-4 py-2.5">
                <Sparkles size={16} className="text-[#2f81f7]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#5f6a7c]">Level</p>
                  <p className="text-[16px] font-bold leading-none text-[#f4f7fb]" data-testid="text-level">{user?.level ?? 1}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet gate */}
        {!walletAddress && (
          <div className="mt-5 flex items-center gap-3 rounded-[16px] border border-[#1a2535] bg-[#070f1a] px-5 py-4">
            <Wallet size={18} className="text-[#5f6a7c]" />
            <p className="text-[13px] text-[#9fb1c4]">Connect your wallet to start opening chests.</p>
          </div>
        )}

        {/* Chest grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isLoading && walletAddress
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[260px] animate-pulse rounded-[22px] border border-[#13202e] bg-[#070f1a]" />
              ))
            : displayChests.map((chest) => (
                <ChestCard
                  key={chest.id}
                  chest={chest}
                  userXp={userXp}
                  walletAddress={walletAddress}
                  xConnected={xConnected}
                  onConnectX={() => setShowConnectX(true)}
                  onOpened={(c, xp) => setOpening({ chest: c, xp })}
                />
              ))}
        </div>

        {/* Invite friends */}
        <div className="mt-6 overflow-hidden rounded-[22px] border border-[#16243a] bg-gradient-to-br from-[#0c1322] to-[#070f1a] p-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#2dae50]" />
            <h2 className="text-[16px] font-bold text-[#e8ecf0]">Invite friends, earn 25%</h2>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#7c8a9c]">
            Share your code. Every time a friend opens a chest or earns XP, you automatically pocket an extra <span className="font-semibold text-[#9fe6b4]">25%</span> of it.
          </p>

          {walletAddress ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center justify-between rounded-[14px] border border-[#1a2535] bg-[#060e18] px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#5f6a7c]">Your code</p>
                  <p className="text-[16px] font-bold tracking-wider text-[#f4f7fb]" data-testid="text-referral-code">{referral?.referral_code || "—"}</p>
                </div>
                <Button onClick={copyCode} className="h-9 rounded-[10px] bg-[#0d1b2a] border border-[#22303f] px-3 text-[12px] text-[#cfd8e3] hover:bg-[#11202f]" data-testid="button-copy-code">
                  <Copy size={13} className="mr-1.5" /> Copy
                </Button>
              </div>
              <div className="flex items-center gap-4 rounded-[14px] border border-[#1a2535] bg-[#060e18] px-4 py-3">
                <div className="text-center">
                  <p className="text-[18px] font-bold text-[#f4f7fb]" data-testid="text-referral-count">{referral?.referral_count ?? 0}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[#5f6a7c]">Friends</p>
                </div>
                <div className="h-8 w-px bg-[#1a2535]" />
                <div className="text-center">
                  <p className="text-[18px] font-bold text-[#ffd25a]" data-testid="text-referral-bonus">{(referral?.referral_bonus_xp ?? 0).toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[#5f6a7c]">Bonus XP</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-1.5 text-[12px] text-[#5f6a7c]">
              <ChevronRight size={13} /> Connect your wallet to get your referral code.
            </p>
          )}
        </div>
      </div>

      {showConnectX && walletAddress && (
        <ConnectXModal wallet={walletAddress} onClose={() => setShowConnectX(false)} onConnected={() => {}} />
      )}
      {opening && <OpenChestModal chest={opening.chest} xp={opening.xp} onClose={() => setOpening(null)} />}
    </div>
  );
}
