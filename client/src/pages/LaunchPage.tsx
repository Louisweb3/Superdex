import { useState, useEffect, useCallback } from "react";
import {
  encodeFunctionData,
  encodeAbiParameters,
  keccak256,
  toBytes,
  parseUnits,
  getAddress,
} from "viem";
import { useWalletContext } from "@/context/WalletContext";
import {
  Loader2, CheckCircle, XCircle, ExternalLink, Wallet,
  Rocket, Copy, AlertTriangle, Info, Zap, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const B20_FACTORY       = "0xB20f000000000000000000000000000000000000";
const ACTIVATION_REG    = "0x8453000000000000000000000000000000000001";
const BASE_RPC          = "https://mainnet.base.org";
const BASE_SCAN         = "https://basescan.org";

const MINT_ROLE = keccak256(toBytes("MINT_ROLE")) as `0x${string}`;

// ─── ABIs ─────────────────────────────────────────────────────────────────────
const FACTORY_ABI = [{
  name: "createB20",
  type: "function",
  stateMutability: "nonpayable",
  inputs: [
    { name: "variant",   type: "uint8"   },
    { name: "salt",      type: "bytes32" },
    { name: "params",    type: "bytes"   },
    { name: "initCalls", type: "bytes[]" },
  ],
  outputs: [{ name: "token", type: "address" }],
}] as const;

const ACTIVATION_ABI = [{
  name: "isActivated",
  type: "function",
  stateMutability: "view",
  inputs:  [{ name: "feature", type: "bytes32" }],
  outputs: [{ name: "", type: "bool" }],
}] as const;

const GRANT_ROLE_ABI = [{
  name: "grantRole",
  type: "function",
  inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }],
  outputs: [],
}] as const;

const MINT_ABI = [{
  name: "mint",
  type: "function",
  inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
  outputs: [],
}] as const;

const SUPPLY_CAP_ABI = [{
  name: "updateSupplyCap",
  type: "function",
  inputs: [{ name: "cap", type: "uint128" }],
  outputs: [],
}] as const;

// ─── RPC helpers ──────────────────────────────────────────────────────────────
async function ethCall(to: string, data: string): Promise<string> {
  const r = await fetch(BASE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
  });
  const json = await r.json();
  return json.result as string;
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "idle" | "checking" | "ready" | "not_activated" | "deploying" | "pending" | "success" | "error";
type Variant = "ASSET" | "STABLECOIN";

interface TokenForm {
  variant: Variant;
  name: string;
  symbol: string;
  decimals: number;
  currency: string;
  initialSupply: string;
  supplyCap: string;
  adminAddress: string;
}

function shortAddr(a: string) { return `${a.slice(0, 6)}…${a.slice(-4)}`; }
function shortHash(h: string) { return `${h.slice(0, 10)}…${h.slice(-8)}`; }

// ─── Main Component ───────────────────────────────────────────────────────────
export function LaunchPage() {
  const wallet = useWalletContext();
  const { toast } = useToast();

  const [phase, setPhase]           = useState<Phase>("idle");
  const [errorMsg, setErrorMsg]     = useState("");
  const [txHash, setTxHash]         = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [copied, setCopied]         = useState<"" | "tx" | "token">("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activated, setActivated]   = useState<boolean | null>(null);

  const [form, setForm] = useState<TokenForm>({
    variant: "ASSET",
    name: "",
    symbol: "",
    decimals: 18,
    currency: "USD",
    initialSupply: "",
    supplyCap: "",
    adminAddress: "",
  });

  // Sync adminAddress to connected wallet
  useEffect(() => {
    if (wallet.address && !form.adminAddress) {
      setForm(f => ({ ...f, adminAddress: wallet.address! }));
    }
  }, [wallet.address]);

  // Check activation when wallet connects
  useEffect(() => {
    if (!wallet.address) { setPhase("idle"); return; }
    let cancelled = false;
    setPhase("checking");
    const featureKey = form.variant === "ASSET" ? "base.b20_asset" : "base.b20_stablecoin";
    const data = encodeFunctionData({
      abi: ACTIVATION_ABI,
      functionName: "isActivated",
      args: [keccak256(toBytes(featureKey))],
    });
    ethCall(ACTIVATION_REG, data).then(result => {
      if (cancelled) return;
      const isActive = result !== "0x" && BigInt(result) !== 0n;
      setActivated(isActive);
      setPhase(isActive ? "ready" : "not_activated");
    }).catch(() => {
      if (!cancelled) { setActivated(null); setPhase("ready"); }
    });
    return () => { cancelled = true; };
  }, [wallet.address, form.variant]);

  const setField = (key: keyof TokenForm, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }));

  // ─── Deploy ───────────────────────────────────────────────────────────────
  const handleDeploy = useCallback(async () => {
    if (!wallet.address) return;
    if (!form.name.trim() || !form.symbol.trim()) {
      toast({ title: "Missing fields", description: "Token name and symbol are required.", variant: "destructive" });
      return;
    }
    if (form.variant === "STABLECOIN" && !/^[A-Z]{1,10}$/.test(form.currency)) {
      toast({ title: "Invalid currency", description: "Currency code must be 1–10 uppercase letters (A–Z).", variant: "destructive" });
      return;
    }
    if (wallet.isWrongNetwork) {
      await wallet.switchToBase().catch(() => {});
      return;
    }

    setPhase("deploying");
    setErrorMsg("");
    setTxHash(null);
    setTokenAddress(null);

    try {
      const adminAddr = (form.adminAddress || wallet.address) as `0x${string}`;
      const decimals  = form.variant === "ASSET" ? form.decimals : 6;
      const variantNum = form.variant === "ASSET" ? 0 : 1;

      // --- Encode params ---
      let paramsHex: `0x${string}`;
      if (form.variant === "ASSET") {
        paramsHex = encodeAbiParameters(
          [{ type: "tuple", components: [
            { name: "version",      type: "uint8"   },
            { name: "name",         type: "string"  },
            { name: "symbol",       type: "string"  },
            { name: "initialAdmin", type: "address" },
            { name: "decimals",     type: "uint8"   },
          ]}],
          [{ version: 1, name: form.name.trim(), symbol: form.symbol.trim().toUpperCase(), initialAdmin: adminAddr, decimals }]
        );
      } else {
        paramsHex = encodeAbiParameters(
          [{ type: "tuple", components: [
            { name: "version",      type: "uint8"   },
            { name: "name",         type: "string"  },
            { name: "symbol",       type: "string"  },
            { name: "initialAdmin", type: "address" },
            { name: "currency",     type: "string"  },
          ]}],
          [{ version: 1, name: form.name.trim(), symbol: form.symbol.trim().toUpperCase(), initialAdmin: adminAddr, currency: form.currency.toUpperCase() }]
        );
      }

      // --- Encode salt ---
      const saltHex = keccak256(toBytes(
        `superswap:${adminAddr.toLowerCase()}:${form.name}:${form.symbol}:${Date.now()}`
      )) as `0x${string}`;

      // --- Encode initCalls ---
      const initCalls: `0x${string}`[] = [];

      // Always grant MINT_ROLE to admin
      initCalls.push(encodeFunctionData({ abi: GRANT_ROLE_ABI, functionName: "grantRole", args: [MINT_ROLE, adminAddr] }));

      // Optional: set supply cap
      if (form.supplyCap.trim()) {
        const capAmount = parseUnits(form.supplyCap.trim(), decimals);
        if (capAmount > 0n) {
          initCalls.push(encodeFunctionData({ abi: SUPPLY_CAP_ABI, functionName: "updateSupplyCap", args: [capAmount] }));
        }
      }

      // Optional: mint initial supply
      if (form.initialSupply.trim()) {
        const supplyAmount = parseUnits(form.initialSupply.trim(), decimals);
        if (supplyAmount > 0n) {
          initCalls.push(encodeFunctionData({ abi: MINT_ABI, functionName: "mint", args: [adminAddr, supplyAmount] }));
        }
      }

      // --- Encode factory call ---
      const factoryData = encodeFunctionData({
        abi: FACTORY_ABI,
        functionName: "createB20",
        args: [variantNum, saltHex, paramsHex, initCalls],
      });

      // --- Send TX ---
      const hash = await wallet.sendTransaction({ to: B20_FACTORY, data: factoryData });
      setTxHash(hash);
      setPhase("pending");
      toast({ title: "Transaction sent", description: "Waiting for confirmation on Base…" });

      // --- Wait for receipt ---
      const receipt = await waitForReceipt(hash);
      if (receipt.status !== "0x1") throw new Error("Transaction reverted on-chain");

      // --- Extract token address from logs ---
      let extracted = "";
      try {
        const factoryLog = (receipt.logs as any[]).find(
          (log: any) => log.address?.toLowerCase() === B20_FACTORY.toLowerCase()
        );
        if (factoryLog?.topics?.length >= 2) {
          extracted = getAddress("0x" + factoryLog.topics[1].slice(-40));
        }
      } catch {}
      setTokenAddress(extracted || null);
      setPhase("success");

    } catch (err: any) {
      const msg: string = err?.message ?? "Deployment failed";
      if (msg.includes("4001") || msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")) {
        setPhase("ready");
        toast({ title: "Cancelled", description: "Transaction rejected", variant: "destructive" });
        return;
      }
      setErrorMsg(msg);
      setPhase("error");
    }
  }, [wallet, form, toast]);

  const copyText = (text: string, key: "tx" | "token") => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  const reset = () => {
    setPhase("ready");
    setTxHash(null);
    setTokenAddress(null);
    setErrorMsg("");
    setForm(f => ({ ...f, name: "", symbol: "", initialSupply: "", supplyCap: "" }));
  };

  const isBusy = phase === "deploying" || phase === "pending" || phase === "checking";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .launch-card { animation: fadeInUp 0.4s ease-out; }
      `}</style>

      <div className="relative min-h-screen w-full flex flex-col items-center py-8 px-4 bg-[#05080a]">

        {/* ── Header ── */}
        <div className="relative z-10 w-full max-w-[560px] mb-6 text-center launch-card">
          <div className="inline-flex items-center gap-3 rounded-xl px-6 py-2.5 mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(45,174,80,0.12), rgba(45,174,80,0.04))",
              border: "1px solid rgba(45,174,80,0.25)",
            }}>
            <Rocket size={14} className="text-[#2dae50]" />
            <span className="text-sm font-bold uppercase tracking-[0.12em] text-[#2dae50]">B20 Token Launcher · Base</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
            Launch a B20 Token
          </h1>
          <p className="text-sm text-white/40">
            Deploy a native Base B20 token in one click — faster, cheaper, and fully ERC-20 compatible.
          </p>
        </div>

        {/* ── Feature strip ── */}
        <div className="w-full max-w-[560px] mb-5 launch-card">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Native Precompile", desc: "Rust-level speed" },
              { label: "ERC-20 Compatible", desc: "Plug into any DEX" },
              { label: "Built-in Roles", desc: "Mint, pause, burn" },
            ].map(f => (
              <div key={f.label} className="rounded-lg p-3 text-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-xs font-semibold text-white/70">{f.label}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main card ── */}
        <div className="relative z-10 w-full max-w-[560px] launch-card">
          <div className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#0a0f14", border: "1px solid rgba(255,255,255,0.06)" }}>

            <div className="p-6">

              {/* Not connected */}
              {!wallet.isConnected && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(45,174,80,0.08)", border: "2px solid rgba(45,174,80,0.2)" }}>
                    <Wallet size={26} className="text-[#2dae50]" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-white mb-1">Connect your wallet</p>
                    <p className="text-sm text-white/40">Required to deploy on Base mainnet</p>
                  </div>
                  <button
                    onClick={wallet.connect}
                    disabled={wallet.isConnecting}
                    className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #2dae50, #20a047)", boxShadow: "0 4px 16px rgba(45,174,80,0.3)" }}>
                    {wallet.isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                    {wallet.isConnecting ? "Connecting…" : "Connect Wallet"}
                  </button>
                </div>
              )}

              {/* Checking activation */}
              {wallet.isConnected && phase === "checking" && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 size={28} className="text-[#2dae50] animate-spin" />
                  <p className="text-sm text-white/40">Checking B20 activation on Base…</p>
                </div>
              )}

              {/* Not activated */}
              {wallet.isConnected && phase === "not_activated" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(249,115,22,0.1)", border: "2px solid rgba(249,115,22,0.25)" }}>
                    <AlertTriangle size={22} className="text-[#f97316]" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-[#f97316] mb-1">B20 Not Yet Activated</p>
                    <p className="text-sm text-white/40">The Beryl hardfork activation is pending on this network. Try again in a few minutes.</p>
                  </div>
                  <button onClick={() => setPhase("checking")} className="text-xs text-[#2dae50] hover:text-white transition-colors">
                    Retry check
                  </button>
                </div>
              )}

              {/* Wrong network */}
              {wallet.isConnected && wallet.isWrongNetwork && phase === "ready" && (
                <div className="flex flex-col gap-3 py-2">
                  <div className="flex items-center gap-2 rounded-lg px-4 py-3"
                    style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
                    <AlertTriangle size={14} className="text-[#f97316] shrink-0" />
                    <p className="text-sm text-[#f97316]">Switch to Base Mainnet to deploy B20 tokens</p>
                  </div>
                  <button onClick={wallet.switchToBase}
                    className="w-full h-11 rounded-xl text-sm font-bold text-white"
                    style={{ background: "#f97316" }}>
                    Switch to Base
                  </button>
                </div>
              )}

              {/* FORM — ready state */}
              {wallet.isConnected && !wallet.isWrongNetwork && (phase === "ready" || phase === "error") && (
                <div className="flex flex-col gap-4">

                  {/* Activated badge */}
                  {activated === true && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ background: "rgba(45,174,80,0.06)", border: "1px solid rgba(45,174,80,0.15)" }}>
                      <CheckCircle size={13} className="text-[#2dae50] shrink-0" />
                      <span className="text-xs text-[#2dae50]">B20 is active on Base — ready to deploy</span>
                    </div>
                  )}

                  {/* Variant selector */}
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Token Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["ASSET", "STABLECOIN"] as Variant[]).map(v => (
                        <button key={v} type="button"
                          onClick={() => setField("variant", v)}
                          className="h-14 rounded-xl text-sm font-semibold transition-all flex flex-col items-center justify-center gap-0.5"
                          style={form.variant === v
                            ? { background: "rgba(45,174,80,0.12)", border: "1px solid rgba(45,174,80,0.3)", color: "#2dae50" }
                            : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
                          }>
                          <span className="text-sm font-bold">{v}</span>
                          <span className="text-[10px] opacity-60">{v === "ASSET" ? "6–18 decimals" : "Fixed 6 decimals"}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Symbol row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Token Name</label>
                      <input
                        data-testid="input-token-name"
                        value={form.name}
                        onChange={e => setField("name", e.target.value)}
                        placeholder="My Token"
                        className="w-full h-11 rounded-xl px-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-1 focus:ring-[#2dae50]/40"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Symbol</label>
                      <input
                        data-testid="input-token-symbol"
                        value={form.symbol}
                        onChange={e => setField("symbol", e.target.value.toUpperCase())}
                        placeholder="MYT"
                        maxLength={10}
                        className="w-full h-11 rounded-xl px-3 text-sm text-white placeholder-white/20 uppercase outline-none transition-all focus:ring-1 focus:ring-[#2dae50]/40"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                  </div>

                  {/* ASSET: Decimals */}
                  {form.variant === "ASSET" && (
                    <div>
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                        Decimals <span className="text-white/20 normal-case">(6–18, immutable)</span>
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[6, 8, 9, 18].map(d => (
                          <button key={d} type="button"
                            onClick={() => setField("decimals", d)}
                            data-testid={`button-decimals-${d}`}
                            className="h-9 px-4 rounded-lg text-sm font-semibold transition-all"
                            style={form.decimals === d
                              ? { background: "rgba(45,174,80,0.15)", border: "1px solid rgba(45,174,80,0.3)", color: "#2dae50" }
                              : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }
                            }>{d}</button>
                        ))}
                        <input
                          type="number" min={6} max={18}
                          value={form.decimals}
                          onChange={e => setField("decimals", Math.min(18, Math.max(6, parseInt(e.target.value) || 18)))}
                          className="h-9 w-16 rounded-lg px-2 text-sm text-center text-white outline-none"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* STABLECOIN: Currency code */}
                  {form.variant === "STABLECOIN" && (
                    <div>
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                        Currency Code <span className="text-white/20 normal-case">(uppercase A–Z, immutable)</span>
                      </label>
                      <input
                        data-testid="input-currency"
                        value={form.currency}
                        onChange={e => setField("currency", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                        placeholder="USD"
                        maxLength={10}
                        className="w-full h-11 rounded-xl px-3 text-sm text-white placeholder-white/20 uppercase outline-none transition-all focus:ring-1 focus:ring-[#2dae50]/40"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                  )}

                  {/* Initial Supply */}
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                      Initial Supply <span className="text-white/20 normal-case">(optional — minted to your wallet)</span>
                    </label>
                    <input
                      data-testid="input-initial-supply"
                      type="number" min="0"
                      value={form.initialSupply}
                      onChange={e => setField("initialSupply", e.target.value)}
                      placeholder="e.g. 1000000"
                      className="w-full h-11 rounded-xl px-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-1 focus:ring-[#2dae50]/40"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>

                  {/* Advanced */}
                  <button type="button" onClick={() => setShowAdvanced(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors">
                    {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    Advanced options
                  </button>

                  {showAdvanced && (
                    <div className="flex flex-col gap-3 rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>

                      {/* Supply Cap */}
                      <div>
                        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                          Supply Cap <span className="text-white/20 normal-case">(optional — leave blank for no cap)</span>
                        </label>
                        <input
                          data-testid="input-supply-cap"
                          type="number" min="0"
                          value={form.supplyCap}
                          onChange={e => setField("supplyCap", e.target.value)}
                          placeholder="e.g. 10000000"
                          className="w-full h-11 rounded-xl px-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-1 focus:ring-[#2dae50]/40"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        />
                      </div>

                      {/* Admin Address */}
                      <div>
                        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                          Admin Address <span className="text-white/20 normal-case">(defaults to connected wallet)</span>
                        </label>
                        <input
                          data-testid="input-admin-address"
                          value={form.adminAddress}
                          onChange={e => setField("adminAddress", e.target.value)}
                          placeholder="0x…"
                          className="w-full h-11 rounded-xl px-3 text-sm font-mono text-white placeholder-white/20 outline-none transition-all focus:ring-1 focus:ring-[#2dae50]/40"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        />
                      </div>

                      <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
                        style={{ background: "rgba(0,82,255,0.06)", border: "1px solid rgba(0,82,255,0.12)" }}>
                        <Info size={12} className="text-[#5aa9ff] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#5aa9ff]/70 leading-relaxed">
                          The admin holds <code className="bg-white/5 px-1 rounded">DEFAULT_ADMIN_ROLE</code> and can grant/revoke roles.
                          MINT_ROLE is automatically granted to the admin at deploy.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error banner */}
                  {phase === "error" && errorMsg && (
                    <div className="flex items-start gap-2.5 rounded-lg px-4 py-3"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-400">Deployment failed</p>
                        <p className="text-xs text-red-400/60 mt-0.5 break-all">{errorMsg.slice(0, 200)}</p>
                      </div>
                    </div>
                  )}

                  {/* Deploy button */}
                  <button
                    data-testid="button-deploy-token"
                    onClick={handleDeploy}
                    disabled={isBusy || !form.name.trim() || !form.symbol.trim()}
                    className="w-full h-14 rounded-xl text-base font-bold text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: (!form.name.trim() || !form.symbol.trim())
                        ? "rgba(255,255,255,0.05)"
                        : "linear-gradient(135deg, #2dae50, #1d9940)",
                      boxShadow: (!form.name.trim() || !form.symbol.trim())
                        ? "none"
                        : "0 8px 24px rgba(45,174,80,0.3), 0 0 0 1px rgba(45,174,80,0.2) inset",
                    }}>
                    <Rocket size={20} />
                    {phase === "error" ? "Try Again" : "Deploy B20 Token"}
                  </button>

                  <p className="text-center text-[11px] text-white/20">
                    Gas fees apply · Deployed on Base Mainnet · One transaction
                  </p>
                </div>
              )}

              {/* Deploying */}
              {phase === "deploying" && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(45,174,80,0.1)", border: "2px solid rgba(45,174,80,0.25)" }}>
                    <Loader2 size={28} className="text-[#2dae50] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-white mb-1">Check Your Wallet</p>
                    <p className="text-sm text-white/40">Approve the transaction to deploy your B20 token…</p>
                  </div>
                </div>
              )}

              {/* Pending receipt */}
              {phase === "pending" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,82,255,0.1)", border: "2px solid rgba(0,82,255,0.25)" }}>
                    <Loader2 size={28} className="text-[#5aa9ff] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-white mb-1">Deploying on Base…</p>
                    <p className="text-sm text-white/40 mb-3">Waiting for block confirmation</p>
                  </div>
                  {txHash && (
                    <a href={`${BASE_SCAN}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#5aa9ff] hover:text-white transition-colors">
                      <ExternalLink size={11} />
                      View on BaseScan
                    </a>
                  )}
                </div>
              )}

              {/* Success */}
              {phase === "success" && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(45,174,80,0.15)", border: "2px solid rgba(45,174,80,0.4)", boxShadow: "0 0 32px rgba(45,174,80,0.2)" }}>
                      <CheckCircle size={36} className="text-[#2dae50]" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white mb-1">Token Deployed!</p>
                      <p className="text-sm text-white/40">Your B20 token is live on Base mainnet</p>
                    </div>
                  </div>

                  {/* Token summary */}
                  <div className="rounded-xl divide-y divide-white/5"
                    style={{ background: "rgba(45,174,80,0.04)", border: "1px solid rgba(45,174,80,0.12)" }}>

                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-white/40">Token Name</span>
                      <span className="text-sm font-semibold text-white">{form.name}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-white/40">Symbol</span>
                      <span className="text-sm font-semibold text-[#2dae50]">{form.symbol.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-white/40">Type</span>
                      <span className="text-sm font-semibold text-white/70">{form.variant}</span>
                    </div>
                    {form.variant === "ASSET" && (
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-white/40">Decimals</span>
                        <span className="text-sm font-semibold text-white/70">{form.decimals}</span>
                      </div>
                    )}
                    {form.initialSupply && (
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-white/40">Initial Supply</span>
                        <span className="text-sm font-semibold text-[#ffd25a]">{Number(form.initialSupply).toLocaleString()} {form.symbol.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-white/40">Roles Granted</span>
                      <div className="flex gap-1.5">
                        {["ADMIN", "MINT"].map(r => (
                          <span key={r} className="text-[10px] font-bold rounded px-1.5 py-0.5"
                            style={{ background: "rgba(45,174,80,0.1)", color: "#2dae50", border: "1px solid rgba(45,174,80,0.2)" }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Token address */}
                  {tokenAddress && (
                    <div className="rounded-xl p-4"
                      style={{ background: "rgba(0,82,255,0.05)", border: "1px solid rgba(0,82,255,0.15)" }}>
                      <p className="text-xs font-semibold text-[#5aa9ff]/60 uppercase tracking-wider mb-2">Token Address</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono text-white/80 break-all">{tokenAddress}</code>
                        <button
                          data-testid="button-copy-token"
                          onClick={() => copyText(tokenAddress, "token")}
                          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5">
                          {copied === "token" ? <CheckCircle size={14} className="text-[#2dae50]" /> : <Copy size={14} className="text-white/40" />}
                        </button>
                        <a href={`${BASE_SCAN}/token/${tokenAddress}`} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-[#5aa9ff] hover:bg-white/5 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* TX hash */}
                  {txHash && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-xs text-white/30">Transaction</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyText(txHash, "tx")}
                          className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white/60 transition-colors">
                          {shortHash(txHash)}
                          {copied === "tx" ? <CheckCircle size={10} className="text-[#2dae50]" /> : <Copy size={10} />}
                        </button>
                        <a href={`${BASE_SCAN}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                          className="text-[#5aa9ff] hover:text-white transition-colors">
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      data-testid="button-deploy-another"
                      onClick={reset}
                      className="h-11 rounded-xl text-sm font-semibold text-white/60 transition-all hover:text-white"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Deploy Another
                    </button>
                    {tokenAddress && (
                      <a href={`${BASE_SCAN}/token/${tokenAddress}`} target="_blank" rel="noopener noreferrer"
                        className="h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                        style={{ background: "linear-gradient(135deg, #0052ff, #003de0)", boxShadow: "0 4px 16px rgba(0,82,255,0.25)" }}>
                        <ExternalLink size={14} />
                        View on BaseScan
                      </a>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Footer info ── */}
        <div className="mt-6 w-full max-w-[560px] flex items-center justify-center gap-6 launch-card">
          {[
            { icon: Zap, text: "Gas efficient" },
            { icon: CheckCircle, text: "ERC-20 compatible" },
            { icon: Rocket, text: "Base native" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-white/20">
              <Icon size={11} />
              {text}
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
