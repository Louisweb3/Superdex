import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import { useWalletContext } from "@/context/WalletContext";
import { useRewardUser } from "@/hooks/useRewards";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, ExternalLink, Wallet, Zap, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// ─── Contract constants ────────────────────────────────────────────────────────

const CLAIM_CONTRACT = "0x1D39749fE726e47a66A0bC5D1B7D5316Ff4c5E75" as `0x${string}`;
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
      return raf;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{val.toLocaleString()}</>;
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
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // ── On-chain check whenever wallet connects ──────────────────────────────
  useEffect(() => {
    if (!wallet.address) { setPhase("idle"); return; }
    let cancelled = false;
    setPhase("checking");
    readClaimed(wallet.address).then((claimed) => {
      if (cancelled) return;
      setOnChainClaimed(claimed);
      setPhase(claimed ? "already_claimed" : "ready");
    }).catch(() => {
      if (!cancelled) setPhase("ready");
    });
    return () => { cancelled = true; };
  }, [wallet.address]);

  // ── Claim flow ────────────────────────────────────────────────────────────
  const handleClaim = useCallback(async () => {
    if (!wallet.address) return;

    // Guard: prevent double-claim attempts
    if (onChainClaimed || rewardUser?.xp_claimed) {
      setPhase("already_claimed");
      return;
    }

    setPhase("sending");

    try {
      if (wallet.isWrongNetwork) {
        await wallet.switchToBase();
      }

      const data = encodeFunctionData({ abi: CLAIM_ABI, functionName: "claim" });
      const valueHex = "0x" + CLAIM_FEE_WEI.toString(16);

      const hash = await wallet.sendTransaction({ to: CLAIM_CONTRACT, data, value: valueHex });
      if (!mountedRef.current) return;
      setTxHash(hash);
      setPhase("pending_receipt");
      toast({ title: "Transaction sent", description: "Waiting for confirmation on Base..." });

      const receipt = await waitForReceipt(hash);
      if (!mountedRef.current) return;

      if (receipt.status !== "0x1") {
        throw new Error("Transaction reverted on-chain");
      }

      setPhase("awarding");
      const res = await fetch("/api/xp-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: wallet.address, txHash: hash }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to award XP");

      if (!mountedRef.current) return;

      qc.invalidateQueries({ queryKey: ["/api/rewards/user", wallet.address] });
      qc.invalidateQueries({ queryKey: ["/api/rewards/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/rewards/leaderboard"] });

      setPhase("success");

    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg: string = err?.message ?? "Transaction failed";
      if (msg.includes("4001") || msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")) {
        setPhase("ready");
        toast({ title: "Cancelled", description: "Transaction rejected", variant: "destructive" });
        return;
      }
      setErrorMsg(msg);
      setPhase("error");
    }
  }, [wallet, qc, toast]);

  // ── Total XP ──────────────────────────────────────────────────────────────
  const dbXp = rewardUser?.xp ?? 0;
  const displayXp = dbXp;

  const isBusy = phase === "sending" || phase === "pending_receipt" || phase === "awarding" || phase === "checking";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 0.7; }
        }
      `}</style>

      <div className="relative min-h-screen w-full flex flex-col items-center py-10 px-4 overflow-hidden bg-[#05080a]">

        {/* Header */}
        <div className="relative z-10 w-full max-w-[480px] mb-8 text-center" style={{ animation: "fadeIn 0.4s ease-out" }}>
          <div className="inline-flex items-center gap-3 rounded-xl px-8 py-3 mb-5"
            style={{ 
              background: "linear-gradient(135deg, rgba(0,82,255,0.15), rgba(0,82,255,0.05))", 
              border: "1px solid rgba(0,82,255,0.3)",
              boxShadow: "0 8px 32px rgba(0,82,255,0.12), 0 0 0 1px rgba(0,82,255,0.15) inset"
            }}>
            <div className="w-2.5 h-2.5 rounded-full bg-[#0052ff]" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
            <span className="text-sm font-bold uppercase tracking-[0.12em] text-[#0052ff]">Base Beryl · Live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
            Claim Your 10,000 XP
          </h1>
          <p className="text-sm text-white/45">Claim your SuperSwap Beryl XP. limited time</p>
        </div>

        {/* Main card */}
        <div className="relative z-10 w-full max-w-[480px]" style={{ animation: "fadeIn 0.5s ease-out" }}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ 
              background: "#0a0f14",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>

            <div className="relative p-6">

              {/* Claim details grid */}
              {phase !== "success" && (
                <div className="rounded-lg mb-6 divide-y divide-white/5"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>

                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://www.clipartmax.com/png/full/4-45986_christmas-tree-with-gifts-clipart.png"
                        alt="Reward"
                        width={32}
                        height={32}
                        style={{ borderRadius: 8, flexShrink: 0 }}
                      />
                      <div>
                        <p className="text-sm text-white/40">Claim Reward</p>
                        <p className="text-xs text-white/30 mt-0.5">SuperSwap Season 1</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#ffd25a]">10,000 XP</span>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src="https://cdn.brandfetch.io/id6XsSOVVS/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1757929784005" alt="Base" width={32} height={32} style={{ borderRadius: 8 }} />
                      <div>
                        <p className="text-sm text-white/40">Network</p>
                        <p className="text-xs text-white/30 mt-0.5">Chain ID 8453</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#0052ff]">Base</span>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://www.clipartmax.com/png/full/6-61125_advocate-symbol-clip-art.png"
                        alt="Eligibility"
                        width={32}
                        height={32}
                        style={{ borderRadius: 8, flexShrink: 0 }}
                      />
                      <div>
                        <p className="text-sm text-white/40">Eligibility</p>
                        <p className="text-xs text-white/30 mt-0.5">On-chain verified</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white/45">One per wallet</span>
                  </div>

                </div>
              )}

              {/* Wallet info strip */}
              {wallet.isConnected && wallet.address && phase !== "success" && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 mb-5"
                  style={{ background: "rgba(0,188,132,0.05)", border: "1px solid rgba(0,188,132,0.12)" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,188,132,0.15)" }}>
                    <Wallet size={10} className="text-[#00bc84]" />
                  </div>
                  <span className="text-xs font-mono text-white/50 flex-1">{shortAddr(wallet.address)}</span>
                  {rewardUser && (
                    <span className="text-xs font-semibold text-[#ffd25a]">
                      {rewardUser.xp.toLocaleString()} XP
                    </span>
                  )}
                  {wallet.isWrongNetwork && (
                    <span className="text-xs font-semibold text-[#f97316] flex items-center gap-1">
                      <AlertTriangle size={9} /> Wrong network
                    </span>
                  )}
                </div>
              )}

              {/* Not connected */}
              {!wallet.isConnected && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <p className="text-sm text-white/40 text-center">Connect wallet to check eligibility and claim</p>
                  <button
                    onClick={wallet.connect}
                    disabled={wallet.isConnecting}
                    className="w-full h-12 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#00bc84", boxShadow: "0 4px 12px rgba(0,188,132,0.25)" }}>
                    {wallet.isConnecting ? <Loader2 size={17} className="animate-spin" /> : <Wallet size={17} />}
                    {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
                  </button>
                </div>
              )}

              {/* Checking */}
              {wallet.isConnected && phase === "checking" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 size={30} className="text-[#00bc84] animate-spin" />
                  <p className="text-sm text-white/40">Checking claim status on Base...</p>
                </div>
              )}

              {/* Wrong network */}
              {wallet.isConnected && wallet.isWrongNetwork && phase === "ready" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-center gap-2 rounded-lg px-4 py-2 w-full"
                    style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
                    <AlertTriangle size={13} className="text-[#f97316]" />
                    <p className="text-sm text-[#f97316]">Switch to Base mainnet to claim</p>
                  </div>
                  <button
                    onClick={wallet.switchToBase}
                    className="w-full h-12 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: "#f97316" }}>
                    Switch to Base
                  </button>
                </div>
              )}

              {/* Already claimed */}
              {phase === "already_claimed" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,188,132,0.1)", border: "2px solid rgba(0,188,132,0.25)" }}>
                    <CheckCircle size={30} className="text-[#00bc84]" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-white mb-1">XP Already Claimed</p>
                    <p className="text-sm text-white/40">This wallet has claimed 10,000 XP on Base</p>
                  </div>
                  <div className="w-full rounded-lg divide-y divide-white/5"
                    style={{ background: "rgba(0,188,132,0.04)", border: "1px solid rgba(0,188,132,0.12)" }}>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-white/40">Total XP (DB)</span>
                      <span className="text-sm font-semibold text-[#00bc84]">{dbXp.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <button disabled className="w-full h-12 rounded-lg text-sm font-semibold text-white/30 cursor-not-allowed"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    XP Already Claimed ✓
                  </button>
                </div>
              )}

              {/* Ready to claim */}
              {wallet.isConnected && !wallet.isWrongNetwork && phase === "ready" && (
                <button
                  onClick={handleClaim}
                  className="w-full h-16 rounded-xl text-base font-bold text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    background: "linear-gradient(135deg, #00bc84, #00a372)", 
                    boxShadow: "0 8px 24px rgba(0,188,132,0.35), 0 0 0 1px rgba(0,188,132,0.2) inset" 
                  }}>
                  <Zap size={22} fill="currentColor" />
                  Claim 10,000 XP
                </button>
              )}

              {/* Sending TX */}
              {(phase === "sending") && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,188,132,0.1)", border: "2px solid rgba(0,188,132,0.25)" }}>
                    <Loader2 size={26} className="text-[#00bc84] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-white mb-1">Check Your Wallet</p>
                    <p className="text-sm text-white/40">Approve transaction in MetaMask...</p>
                  </div>
                </div>
              )}

              {/* Waiting for receipt */}
              {phase === "pending_receipt" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,82,255,0.1)", border: "2px solid rgba(0,82,255,0.25)" }}>
                    <Loader2 size={26} className="text-[#5aa9ff] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-white mb-1">Confirming on Base...</p>
                    <p className="text-sm text-white/40 mb-3">Waiting for block confirmation</p>
                  </div>
                  {txHash && (
                    <a href={`${BASE_SCAN}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#5aa9ff] hover:text-white transition-colors">
                      <ExternalLink size={10} />
                      View on BaseScan
                    </a>
                  )}
                </div>
              )}

              {/* Awarding XP */}
              {phase === "awarding" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 size={26} className="text-[#ffd25a] animate-spin" />
                  <p className="text-sm text-white/50">Recording your XP...</p>
                </div>
              )}

              {/* Success */}
              {phase === "success" && (
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ 
                      background: "rgba(0,188,132,0.15)", 
                      border: "2px solid rgba(0,188,132,0.4)",
                      boxShadow: "0 0 32px rgba(0,188,132,0.2)" 
                    }}>
                    <CheckCircle size={36} className="text-[#00bc84]" />
                  </div>

                  <div className="text-center">
                    <p className="text-xl font-bold text-white mb-1">XP Successfully Claimed!</p>
                    <p className="text-sm text-white/40">Your XP has been recorded</p>
                  </div>

                  <div className="flex items-center gap-3 py-3">
                    <Zap size={32} className="text-[#ffd25a]" />
                    <span className="text-4xl font-bold leading-none tabular-nums text-[#ffd25a]">
                      +<AnimatedCounter to={XP_REWARD} />
                    </span>
                  </div>

                  <div className="w-full rounded-lg divide-y divide-white/5"
                    style={{ background: "rgba(0,188,132,0.04)", border: "1px solid rgba(0,188,132,0.12)" }}>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-white/40">Total XP (Platform)</span>
                      <span className="text-sm font-semibold text-[#00bc84]">
                        {(rewardUser?.xp ?? displayXp).toLocaleString()} XP
                      </span>
                    </div>
                    {txHash && (
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-white/40">Transaction</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(txHash); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                          className="flex items-center gap-1 text-xs font-mono text-white/45 hover:text-white/70 transition-colors">
                          {shortAddr(txHash)} {copied ? <CheckCircle size={10} className="text-[#00bc84]" /> : <Copy size={10} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {txHash && (
                    <a href={`${BASE_SCAN}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 h-10 px-5 rounded-lg text-xs font-semibold text-white/60 hover:text-white transition-colors"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <ExternalLink size={12} />
                      View on BaseScan
                    </a>
                  )}
                </div>
              )}

              {/* Error */}
              {phase === "error" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.25)" }}>
                    <XCircle size={30} className="text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-white mb-1">Transaction Failed</p>
                    <p className="text-xs text-white/40 max-w-[260px]">{errorMsg || "An unexpected error occurred"}</p>
                  </div>
                  <button
                    onClick={() => setPhase("ready")}
                    className="h-10 px-7 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Try Again
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Info chips */}
          <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              <AlertTriangle size={10} className="opacity-50" />
              <span>On-chain verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              <Wallet size={10} className="opacity-50" />
              <span>Base mainnet</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              <Zap size={10} className="opacity-50" />
              <span>TGE allocation</span>
            </div>
          </div>
        </div>

        {/* XP balance display - Premium Glassy Cards */}
        {wallet.isConnected && wallet.address && phase !== "success" && (
          <div className="relative z-10 w-full max-w-[480px] mt-6">
            <div className="rounded-2xl p-5"
              style={{ 
                background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))", 
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset"
              }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/25 mb-4">Your XP Overview</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Platform XP", value: (rewardUser?.xp ?? 0).toLocaleString(), unit: "XP", color: "#00bc84" },
                  { label: "Weekly XP", value: (rewardUser?.weekly_xp ?? 0).toLocaleString(), unit: "this week", color: "#5aa9ff" },
                  { 
                    label: "Tier", 
                    value: rewardUser?.tier ?? "—", 
                    unit: "", 
                    color: rewardUser?.tier === "Diamond" ? "#7df9ff" : rewardUser?.tier === "Gold" ? "#f5c518" : rewardUser?.tier === "Silver" ? "#9aa0ad" : "#cd7f32" 
                  },
                  {
                    label: "Status",
                    value: onChainClaimed ? "Claimed" : "Available",
                    unit: "",
                    color: onChainClaimed ? "#00bc84" : "#ffd25a"
                  },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-3.5"
                    style={{ 
                      background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", 
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
                    }}>
                    <p className="text-xs text-white/25 mb-1.5">{stat.label}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold leading-none" style={{ color: stat.color }}>{stat.value}</span>
                      {stat.unit && <span className="text-xs text-white/20">{stat.unit}</span>}
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