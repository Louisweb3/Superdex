import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import { useWalletContext } from "@/context/WalletContext";
import { useRewardUser } from "@/hooks/useRewards";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, ExternalLink, Wallet, Zap, Copy, AlertTriangle, Gem, ShieldCheck, Lock, Layers, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// ─── Contract constants ────────────────────────────────────────────────────────

const CLAIM_CONTRACT = "0x1D39749fE726e47a66A0bC5D1B7D5316Ff4c5E75" as `0x${string}`;
const XP_TOKEN      = "0xAE3aE4734D03C26E6614fbEdd1d7EF5C30F68741" as `0x${string}`;
const CLAIM_FEE_ETH = "0.000038";
const CLAIM_FEE_WEI = BigInt("38000000000000");
const XP_REWARD     = 10_000;
const BASE_RPC      = "https://mainnet.base.org";
const BASE_SCAN     = "https://basescan.org";
const BASE_CHAIN_ID = 8453;

const CLAIM_ABI = [
  {
    name: "claimed",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "claim",
    type: "function",
    stateMutability: "payable",
    inputs:  [],
    outputs: [],
  },
] as const;

const TOKEN_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ─── RPC helpers ──────────────────────────────────────────────────────────────

async function ethCall(to: string, data: string): Promise<string> {
  const r = await fetch(BASE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
  });
  const { result } = await r.json();
  return result as string;
}

async function waitForReceipt(txHash: string, maxMs = 120_000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const r = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [txHash] }),
    });
    const { result } = await r.json();
    if (result) return result;
    await new Promise(res => setTimeout(res, 2500));
  }
  throw new Error("Confirmation timed out — check BaseScan for your transaction");
}

async function readClaimed(address: string): Promise<boolean> {
  const data = encodeFunctionData({ abi: CLAIM_ABI, functionName: "claimed", args: [address as `0x${string}`] });
  const raw = await ethCall(CLAIM_CONTRACT, data);
  if (!raw || raw === "0x") return false;
  const [val] = decodeFunctionResult({ abi: CLAIM_ABI, functionName: "claimed", data: raw as `0x${string}` }) as [boolean];
  return val;
}

async function readBalance(address: string): Promise<bigint> {
  const data = encodeFunctionData({ abi: TOKEN_ABI, functionName: "balanceOf", args: [address as `0x${string}`] });
  const raw = await ethCall(XP_TOKEN, data);
  if (!raw || raw === "0x") return 0n;
  const [val] = decodeFunctionResult({ abi: TOKEN_ABI, functionName: "balanceOf", data: raw as `0x${string}` }) as [bigint];
  return val;
}

// ─── Confetti ────────────────────────────────────────────────────────────────

function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      left:  `${(i * 167 + i * i * 3) % 100}%`,
      delay: `${(i * 0.07) % 1.2}s`,
      dur:   `${1.8 + (i % 5) * 0.25}s`,
      color: ["#00bc84", "#ffd25a", "#5aa9ff", "#a855f7", "#f97316", "#ec4899"][i % 6],
      size:  6 + (i % 4) * 3,
      rotate: (i * 37) % 360,
    })), []);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: p.left,
          top: "-20px",
          width: p.size,
          height: p.size * 0.5,
          backgroundColor: p.color,
          borderRadius: 2,
          transform: `rotate(${p.rotate}deg)`,
          animation: `confettiFall ${p.dur} ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ to, duration = 1600 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{val.toLocaleString()}</>;
}

// ─── Particle field (ambient background) ─────────────────────────────────────

function ParticleField() {
  const dots = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      left:  `${(i * 3.7 + i * i * 0.2) % 96}%`,
      top:   `${(i * 7.1 + i * 3) % 90}%`,
      size:  1 + (i % 3),
      dur:   `${2 + (i % 5) * 0.6}s`,
      delay: `${(i * 0.3) % 2}s`,
      opacity: 0.12 + (i % 4) * 0.07,
    })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <div key={i} className="absolute rounded-full bg-[#00bc84]" style={{
          left: d.left, top: d.top,
          width: d.size, height: d.size,
          opacity: d.opacity,
          animation: `twinkle ${d.dur} ease-in-out ${d.delay} infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({ onConfirm, onClose, isLoading }: {
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[400px] mx-4 mb-4 sm:mb-0 rounded-[28px] overflow-hidden"
        style={{ background: "linear-gradient(145deg,#061018,#030c16)", border: "1px solid rgba(0,188,132,0.25)" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00bc84]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00bc84]/20 to-transparent" />

        <div className="p-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#00bc8422,#00bc8408)", border: "1px solid #00bc8440" }}>
            <Zap size={24} className="text-[#00bc84]" />
          </div>

          <h2 className="text-center text-[18px] font-bold text-white mb-1">Confirm XP Claim</h2>
          <p className="text-center text-[13px] text-white/40 mb-6">Review the details before confirming</p>

          <div className="rounded-[16px] divide-y divide-white/6 mb-6"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { label: "Reward",   value: "10,000 XP",     color: "#ffd25a" },
              { label: "Network",  value: "Base",           color: "#0052ff" },
              { label: "Claim Fee", value: `${CLAIM_FEE_ETH} ETH`, color: "#00bc84" },
              { label: "Limit",    value: "One per wallet", color: "rgba(255,255,255,0.4)" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-white/40">{row.label}</span>
                <span className="text-[13px] font-semibold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} disabled={isLoading}
              className="flex-1 h-11 rounded-[12px] text-[14px] font-semibold text-white/50 hover:text-white/70 transition-colors disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              data-testid="button-cancel-claim">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={isLoading}
              className="flex-1 h-11 rounded-[12px] text-[14px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
              style={{ background: "linear-gradient(135deg,#00bc84,#00a372)" }}
              data-testid="button-confirm-claim">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {isLoading ? "Sending…" : "Confirm & Claim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase label helper ───────────────────────────────────────────────────────

type Phase =
  | "idle" | "checking" | "ready" | "already_claimed"
  | "confirming" | "sending" | "pending_receipt"
  | "awarding" | "success" | "error";

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

// ─── Main EarnPage ─────────────────────────────────────────────────────────────

export function EarnPage() {
  const wallet = useWalletContext();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: rewardUser } = useRewardUser(wallet.address);

  const [phase, setPhase] = useState<Phase>("idle");
  const [onChainClaimed, setOnChainClaimed] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // ── On-chain check whenever wallet connects ──────────────────────────────
  useEffect(() => {
    if (!wallet.address) { setPhase("idle"); return; }
    let cancelled = false;
    setPhase("checking");
    Promise.all([
      readClaimed(wallet.address),
      readBalance(wallet.address),
    ]).then(([claimed, bal]) => {
      if (cancelled) return;
      setOnChainClaimed(claimed);
      setTokenBalance(bal);
      setPhase(claimed ? "already_claimed" : "ready");
    }).catch(() => {
      if (!cancelled) setPhase("ready");
    });
    return () => { cancelled = true; };
  }, [wallet.address]);

  // ── Claim flow ────────────────────────────────────────────────────────────
  const handleClaim = useCallback(async () => {
    if (!wallet.address) return;
    setPhase("sending");

    try {
      // Switch to Base if needed
      if (wallet.isWrongNetwork) {
        await wallet.switchToBase();
      }

      const data = encodeFunctionData({ abi: CLAIM_ABI, functionName: "claim" });
      const valueHex = "0x" + CLAIM_FEE_WEI.toString(16);

      // Send transaction
      const hash = await wallet.sendTransaction({ to: CLAIM_CONTRACT, data, value: valueHex });
      if (!mountedRef.current) return;
      setTxHash(hash);
      setPhase("pending_receipt");
      toast({ title: "Transaction sent", description: "Waiting for confirmation on Base…" });

      // Wait for receipt
      const receipt = await waitForReceipt(hash);
      if (!mountedRef.current) return;

      if (receipt.status !== "0x1") {
        throw new Error("Transaction reverted on-chain");
      }

      // Award XP in DB
      setPhase("awarding");
      const res = await fetch("/api/xp-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: wallet.address, txHash: hash }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to award XP");

      if (!mountedRef.current) return;

      // Refresh on-chain balance
      readBalance(wallet.address).then(b => { if (mountedRef.current) setTokenBalance(b); }).catch(() => {});

      // Invalidate DB queries
      qc.invalidateQueries({ queryKey: ["/api/rewards/user", wallet.address] });
      qc.invalidateQueries({ queryKey: ["/api/rewards/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/rewards/leaderboard"] });

      setPhase("success");
      setShowConfetti(true);
      setTimeout(() => { if (mountedRef.current) setShowConfetti(false); }, 5000);

    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg: string = err?.message ?? "Transaction failed";
      // User rejected
      if (msg.includes("4001") || msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")) {
        setPhase("ready");
        toast({ title: "Cancelled", description: "Transaction rejected", variant: "destructive" });
        return;
      }
      setErrorMsg(msg);
      setPhase("error");
    }
  }, [wallet, qc, toast]);

  // ── Total XP: DB xp + on-chain token balance ────────────────────────────
  const dbXp = rewardUser?.xp ?? 0;
  const tokenXp = Number(tokenBalance / BigInt(10 ** 18)) || 0;
  const displayXp = dbXp;

  const isBusy = phase === "sending" || phase === "pending_receipt" || phase === "awarding" || phase === "checking";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(1.6); }
        }
        @keyframes xpPulse {
          0%,100% { text-shadow: 0 0 20px #ffd25a66; }
          50%      { text-shadow: 0 0 48px #ffd25acc, 0 0 80px #ffd25a44; }
        }
        @keyframes borderGlow {
          0%,100% { border-color: rgba(0,188,132,0.2); box-shadow: 0 0 30px rgba(0,188,132,0.06); }
          50%      { border-color: rgba(0,188,132,0.5); box-shadow: 0 0 60px rgba(0,188,132,0.18); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <Confetti active={showConfetti} />

      <div className="relative min-h-screen w-full flex flex-col items-center justify-start py-8 px-4 overflow-hidden">
        <ParticleField />

        {/* Header */}
        <div className="relative z-10 w-full max-w-[500px] mb-8 text-center" style={{ animation: "floatUp 0.5s ease-out" }}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
            style={{ background: "rgba(0,188,132,0.08)", border: "1px solid rgba(0,188,132,0.25)" }}>
            <div className="w-2 h-2 rounded-full bg-[#00bc84] animate-pulse" />
            <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#00bc84]">Season 1 · Live</span>
          </div>
          <h1 className="text-[32px] sm:text-[40px] font-extrabold text-white leading-tight mb-2">
            Claim Your{" "}
            <span style={{
              background: "linear-gradient(135deg,#ffd25a,#f97316)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "xpPulse 3s ease-in-out infinite",
            }}>
              10,000 XP
            </span>
          </h1>
          <p className="text-[15px] text-white/40">SuperSwap Base Season 1 — One claim per wallet</p>
        </div>

        {/* Main card */}
        <div className="relative z-10 w-full max-w-[500px]"
          style={{ animation: "floatUp 0.6s ease-out" }}>
          <div className="relative rounded-[28px] overflow-hidden"
            style={{
              background: "linear-gradient(145deg,#061018,#030c16,#020a10)",
              border: "1px solid rgba(0,188,132,0.22)",
              boxShadow: "0 24px 80px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,188,132,0.08) inset",
              animation: "borderGlow 4s ease-in-out infinite",
            }}>
            {/* Top gradient line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00bc84]/60 to-transparent" />

            {/* Glow orb */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,188,132,0.12) 0%, transparent 70%)" }} />

            <div className="relative p-6 sm:p-8">

              {/* ── Claim details grid ─────────────────────────── */}
              {phase !== "success" && (
                <div className="rounded-[18px] mb-6 divide-y divide-white/6"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>

                  {/* Claim Reward row */}
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
                      style={{ background: "rgba(255,210,90,0.12)", border: "1px solid rgba(255,210,90,0.2)" }}>
                      <Zap size={16} className="text-[#ffd25a]" fill="#ffd25a" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/40">Claim Reward</p>
                      <p className="text-[11px] text-white/20 mt-0.5">SuperSwap Season 1</p>
                    </div>
                    <span className="text-[14px] font-bold text-[#ffd25a]">10,000 XP</span>
                  </div>

                  {/* Network row — Base logo */}
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <img
                      src="/base-logo.svg"
                      alt="Base"
                      width={36}
                      height={36}
                      style={{ borderRadius: 10, flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/40">Network</p>
                      <p className="text-[11px] text-white/20 mt-0.5">Chain ID 8453</p>
                    </div>
                    <span className="text-[14px] font-bold text-[#0052ff]">Base</span>
                  </div>

                  {/* Claim Fee row */}
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
                      style={{ background: "rgba(0,188,132,0.12)", border: "1px solid rgba(0,188,132,0.2)" }}>
                      <Gem size={16} className="text-[#00bc84]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/40">Claim Fee</p>
                      <p className="text-[11px] text-white/20 mt-0.5">≈ gas-free after</p>
                    </div>
                    <span className="text-[14px] font-bold text-[#00bc84]">{CLAIM_FEE_ETH} ETH</span>
                  </div>

                  {/* Eligibility row */}
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <ShieldCheck size={16} className="text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/40">Eligibility</p>
                      <p className="text-[11px] text-white/20 mt-0.5">Permanent on-chain</p>
                    </div>
                    <span className="text-[14px] font-bold text-white/55">One per wallet</span>
                  </div>

                </div>
              )}

              {/* ── Wallet info strip ──────────────────────────── */}
              {wallet.isConnected && wallet.address && phase !== "success" && (
                <div className="flex items-center gap-2 rounded-[12px] px-3 py-2.5 mb-5"
                  style={{ background: "rgba(0,188,132,0.06)", border: "1px solid rgba(0,188,132,0.15)" }}>
                  <div className="w-6 h-6 rounded-full flex-none flex items-center justify-center"
                    style={{ background: "rgba(0,188,132,0.18)" }}>
                    <Wallet size={11} className="text-[#00bc84]" />
                  </div>
                  <span className="text-[12px] font-mono text-white/60 flex-1">{shortAddr(wallet.address)}</span>
                  {rewardUser && (
                    <span className="text-[11px] font-bold text-[#ffd25a]">
                      {rewardUser.xp.toLocaleString()} XP
                    </span>
                  )}
                  {wallet.isWrongNetwork && (
                    <span className="text-[10px] font-bold text-[#f97316] flex items-center gap-1">
                      <AlertTriangle size={10} /> Wrong network
                    </span>
                  )}
                </div>
              )}

              {/* ── Phase: not connected ─────────────────────── */}
              {!wallet.isConnected && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <p className="text-[14px] text-white/40 text-center">Connect your wallet to check eligibility and claim</p>
                  <button
                    onClick={wallet.connect}
                    disabled={wallet.isConnecting}
                    className="w-full h-[52px] rounded-[14px] text-[15px] font-bold text-white flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: "linear-gradient(135deg,#00bc84,#00a372)", boxShadow: "0 8px 32px -8px rgba(0,188,132,0.5)" }}
                    data-testid="button-connect-wallet">
                    {wallet.isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
                    {wallet.isConnecting ? "Connecting…" : "Connect Wallet"}
                  </button>
                </div>
              )}

              {/* ── Phase: checking ──────────────────────────── */}
              {wallet.isConnected && phase === "checking" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 size={32} className="text-[#00bc84] animate-spin" />
                  <p className="text-[14px] text-white/40">Checking claim status on Base…</p>
                </div>
              )}

              {/* ── Phase: wrong network ─────────────────────── */}
              {wallet.isConnected && wallet.isWrongNetwork && phase === "ready" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-center gap-2 rounded-[12px] px-4 py-2.5 w-full"
                    style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                    <AlertTriangle size={14} className="text-[#f97316] flex-none" />
                    <p className="text-[13px] text-[#f97316]">Switch to Base mainnet to claim</p>
                  </div>
                  <button
                    onClick={wallet.switchToBase}
                    className="w-full h-[52px] rounded-[14px] text-[15px] font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
                    data-testid="button-switch-network">
                    Switch to Base
                  </button>
                </div>
              )}

              {/* ── Phase: already claimed ─────────────────── */}
              {phase === "already_claimed" && (
                <div className="flex flex-col items-center gap-4 py-4" style={{ animation: "floatUp 0.4s ease-out" }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,188,132,0.1)", border: "2px solid rgba(0,188,132,0.3)" }}>
                    <CheckCircle size={32} className="text-[#00bc84]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[17px] font-bold text-white mb-1">XP Already Claimed</p>
                    <p className="text-[13px] text-white/40">This wallet has already claimed 10,000 XP on Base</p>
                  </div>
                  <div className="w-full rounded-[14px] divide-y divide-white/6"
                    style={{ background: "rgba(0,188,132,0.05)", border: "1px solid rgba(0,188,132,0.15)" }}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-white/40">XP Token Balance</span>
                      <span className="text-[13px] font-bold text-[#ffd25a]">
                        {(Number(tokenBalance / BigInt(10 ** 18)) || 0).toLocaleString()} XP
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-white/40">Total XP (DB)</span>
                      <span className="text-[13px] font-bold text-[#00bc84]">{dbXp.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <button disabled className="w-full h-[52px] rounded-[14px] text-[15px] font-bold text-white/30 cursor-not-allowed"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    data-testid="button-already-claimed">
                    XP Already Claimed ✓
                  </button>
                </div>
              )}

              {/* ── Phase: ready to claim ─────────────────── */}
              {wallet.isConnected && !wallet.isWrongNetwork && phase === "ready" && (
                <button
                  onClick={handleClaim}
                  className="w-full h-[56px] rounded-[14px] text-[16px] font-bold text-white flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "linear-gradient(135deg,#00bc84,#00a372)",
                    boxShadow: "0 8px 40px -8px rgba(0,188,132,0.55), 0 0 0 1px rgba(0,188,132,0.2) inset",
                  }}
                  data-testid="button-claim-xp">
                  <Zap size={20} fill="currentColor" />
                  Claim 10,000 XP
                </button>
              )}

              {/* ── Phase: sending TX ─────────────────────── */}
              {(phase === "sending") && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,188,132,0.1)", border: "2px solid rgba(0,188,132,0.3)" }}>
                      <Loader2 size={28} className="text-[#00bc84] animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-semibold text-white mb-1">Check Your Wallet</p>
                    <p className="text-[13px] text-white/40">Approve the transaction in MetaMask…</p>
                  </div>
                </div>
              )}

              {/* ── Phase: waiting for receipt ───────────── */}
              {phase === "pending_receipt" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,82,255,0.1)", border: "2px solid rgba(0,82,255,0.3)" }}>
                    <Loader2 size={28} className="text-[#5aa9ff] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-semibold text-white mb-1">Confirming on Base…</p>
                    <p className="text-[13px] text-white/40 mb-3">Waiting for block confirmation</p>
                  </div>
                  {txHash && (
                    <a href={`${BASE_SCAN}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[12px] text-[#5aa9ff] hover:text-white transition-colors"
                      data-testid="link-basescan-pending">
                      <ExternalLink size={11} />
                      View on BaseScan
                    </a>
                  )}
                </div>
              )}

              {/* ── Phase: awarding XP ──────────────────── */}
              {phase === "awarding" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 size={28} className="text-[#ffd25a] animate-spin" />
                  <p className="text-[14px] text-white/50">Recording your XP…</p>
                </div>
              )}

              {/* ── Phase: success ────────────────────── */}
              {phase === "success" && (
                <div className="flex flex-col items-center gap-6 py-4" style={{ animation: "floatUp 0.5s ease-out" }}>
                  {/* Badge */}
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: "radial-gradient(circle,rgba(0,188,132,0.25),rgba(0,188,132,0.05))",
                      border: "2px solid rgba(0,188,132,0.5)",
                      boxShadow: "0 0 48px rgba(0,188,132,0.3)",
                      animation: "badgePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                    }}>
                    <CheckCircle size={40} className="text-[#00bc84]" />
                  </div>

                  <div className="text-center">
                    <p className="text-[22px] font-extrabold text-white mb-1">XP Successfully Claimed!</p>
                    <p className="text-[13px] text-white/40">Congratulations — your XP has been recorded</p>
                  </div>

                  {/* XP counter */}
                  <div className="flex items-center gap-3 py-4">
                    <Zap size={36} className="text-[#ffd25a]" fill="#ffd25a" />
                    <span className="text-[56px] font-extrabold leading-none tabular-nums"
                      style={{ color: "#ffd25a", textShadow: "0 0 48px #ffd25a88" }}>
                      +<AnimatedCounter to={XP_REWARD} />
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="w-full rounded-[16px] divide-y divide-white/6"
                    style={{ background: "rgba(0,188,132,0.05)", border: "1px solid rgba(0,188,132,0.18)" }}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-white/40">XP Token Balance</span>
                      <span className="text-[13px] font-bold text-[#ffd25a]">
                        {(Number(tokenBalance / BigInt(10 ** 18)) || 0).toLocaleString()} XP
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-white/40">Total XP (Platform)</span>
                      <span className="text-[13px] font-bold text-[#00bc84]">
                        {(rewardUser?.xp ?? displayXp).toLocaleString()} XP
                      </span>
                    </div>
                    {txHash && (
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-[13px] text-white/40">Transaction</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(txHash); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                          className="flex items-center gap-1.5 text-[12px] font-mono text-white/50 hover:text-white/80 transition-colors"
                          data-testid="button-copy-txhash">
                          {shortAddr(txHash)} {copied ? <CheckCircle size={11} className="text-[#00bc84]" /> : <Copy size={11} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BaseScan link */}
                  {txHash && (
                    <a href={`${BASE_SCAN}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 h-11 px-6 rounded-[12px] text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      data-testid="link-basescan-success">
                      <ExternalLink size={14} />
                      View on BaseScan
                    </a>
                  )}
                </div>
              )}

              {/* ── Phase: error ──────────────────────── */}
              {phase === "error" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)" }}>
                    <XCircle size={32} className="text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-white mb-1">Transaction Failed</p>
                    <p className="text-[12px] text-white/40 max-w-[280px]">{errorMsg || "An unexpected error occurred"}</p>
                  </div>
                  <button
                    onClick={() => setPhase("ready")}
                    className="h-11 px-8 rounded-[12px] text-[14px] font-semibold text-white"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                    data-testid="button-retry">
                    Try Again
                  </button>
                </div>
              )}

            </div>

            {/* Bottom gradient line */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>

          {/* Info chips below card */}
          <div className="flex items-center justify-center gap-5 mt-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <Lock size={11} className="opacity-60" />
              <span>On-chain verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <Layers size={11} className="opacity-60" />
              <span>Base mainnet</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <Gift size={11} className="opacity-60" />
              <span>TGE allocation</span>
            </div>
          </div>
        </div>

        {/* XP balance display when connected */}
        {wallet.isConnected && wallet.address && phase !== "success" && (
          <div className="relative z-10 w-full max-w-[500px] mt-6" style={{ animation: "floatUp 0.7s ease-out" }}>
            <div className="rounded-[20px] p-5"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/30 mb-3">Your XP Overview</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Platform XP",
                    value: (rewardUser?.xp ?? 0).toLocaleString(),
                    unit: "XP",
                    color: "#00bc84",
                  },
                  {
                    label: "XP Token Balance",
                    value: (Number(tokenBalance / BigInt(10 ** 18)) || 0).toLocaleString(),
                    unit: "XP",
                    color: "#ffd25a",
                  },
                  {
                    label: "Weekly XP",
                    value: (rewardUser?.weekly_xp ?? 0).toLocaleString(),
                    unit: "this week",
                    color: "#5aa9ff",
                  },
                  {
                    label: "Tier",
                    value: rewardUser?.tier ?? "—",
                    unit: "",
                    color: rewardUser?.tier === "Diamond" ? "#7df9ff" : rewardUser?.tier === "Gold" ? "#f5c518" : rewardUser?.tier === "Silver" ? "#9aa0ad" : "#cd7f32",
                  },
                ].map(stat => (
                  <div key={stat.label} className="rounded-[14px] p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[11px] text-white/30 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[18px] font-bold leading-none" style={{ color: stat.color }}>{stat.value}</span>
                      {stat.unit && <span className="text-[10px] text-white/25">{stat.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </>
  );
}
