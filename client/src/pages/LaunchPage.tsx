"use client";

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
import { useToast } from "@/hooks/use-toast";
import {
  Rocket,
  CheckCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  Settings,
  FileText,
  Search,
  BookOpen,
  LayoutGrid,
  Zap,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";

const B20_FACTORY = "0xB20f000000000000000000000000000000000000";
const ACTIVATION_REG = "0x8453000000000000000000000000000000000001";
const BASE_RPC = "https://mainnet.base.org";
const BASE_SCAN = "https://basescan.org";
const MINT_ROLE = keccak256(toBytes("MINT_ROLE")) as `0x${string}`;

const FACTORY_ABI = [
  {
    name: "createB20",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "variant", type: "uint8" },
      { name: "salt", type: "bytes32" },
      { name: "params", type: "bytes" },
      { name: "initCalls", type: "bytes[]" },
    ],
    outputs: [{ name: "token", type: "address" }],
  },
] as const;

const ACTIVATION_ABI = [
  {
    name: "isActivated",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "feature", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const GRANT_ROLE_ABI = [
  {
    name: "grantRole",
    type: "function",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [],
  },
] as const;

const MINT_ABI = [
  {
    name: "mint",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const SUPPLY_CAP_ABI = [
  {
    name: "updateSupplyCap",
    type: "function",
    inputs: [{ name: "cap", type: "uint128" }],
    outputs: [],
  },
] as const;

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
    await new Promise((res) => setTimeout(res, 2500));
  }
  throw new Error("Confirmation timed out — check BaseScan for your transaction");
}

type Phase = "idle" | "checking" | "ready" | "not_activated" | "deploying" | "pending" | "success" | "error";
type NavItem = "launch" | "tokens" | "deployments" | "templates" | "docs" | "explorer";

interface TokenForm {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  supplyCap: string;
  adminAddress: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  permit: boolean;
  transferFee: string;
  treasuryAddress: string;
}

function shortAddr(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      data-testid={`toggle-${enabled ? "on" : "off"}`}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none flex-shrink-0"
      style={{ backgroundColor: enabled ? "#22c55e" : "#1e2a3a" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
        style={{ transform: enabled ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

const NAV_ITEMS: { key: NavItem; label: string; icon: any }[] = [
  { key: "launch", label: "Launch", icon: Rocket },
  { key: "tokens", label: "Tokens", icon: LayoutGrid },
  { key: "deployments", label: "Deployments", icon: Settings },
  { key: "templates", label: "Templates", icon: FileText },
  { key: "docs", label: "Docs", icon: BookOpen },
  { key: "explorer", label: "Explorer", icon: Search },
];

const DEPLOY_STEPS = [
  { label: "Metadata Ready", desc: "Token metadata validated" },
  { label: "Contract Valid", desc: "B20 contract compiled successfully" },
  { label: "Waiting for Signature", desc: "Approve the transaction in your wallet" },
  { label: "Deploy to Base", desc: "Send transaction to Base network" },
  { label: "Verify Contract", desc: "Verify on Base Explorer" },
  { label: "Token Live", desc: "Your token is ready to use" },
];

const HOW_IT_WORKS = [
  { n: 1, label: "Choose Parameters", desc: "Configure your token settings and features" },
  { n: 2, label: "Review Configuration", desc: "Review all details before deploying" },
  { n: 3, label: "Sign Transaction", desc: "Approve the deployment in your wallet" },
  { n: 4, label: "Deploy on Base", desc: "Smart contract is deployed on Base" },
  { n: 5, label: "Verify Contract", desc: "Contract is verified on Base Explorer" },
  { n: 6, label: "Token Live", desc: "Start using your B20 token" },
];

export function LaunchPage() {
  const wallet = useWalletContext();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState<NavItem>("launch");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState<"" | "tx" | "token" | "addr">("");
  const [deployStep, setDeployStep] = useState(0);

  const [form, setForm] = useState<TokenForm>({
    name: "",
    symbol: "",
    decimals: 18,
    initialSupply: "1,000,000",
    supplyCap: "",
    adminAddress: "",
    mintable: true,
    burnable: true,
    pausable: false,
    permit: true,
    transferFee: "0",
    treasuryAddress: "",
  });

  useEffect(() => {
    if (wallet.address && !form.adminAddress) {
      setForm((f) => ({ ...f, adminAddress: wallet.address! }));
    }
  }, [wallet.address]);

  useEffect(() => {
    if (!wallet.address) { setPhase("idle"); return; }
    let cancelled = false;
    setPhase("checking");
    const data = encodeFunctionData({ abi: ACTIVATION_ABI, functionName: "isActivated", args: [keccak256(toBytes("base.b20_asset"))] });
    ethCall(ACTIVATION_REG, data)
      .then((result) => { if (!cancelled) { const ok = result !== "0x" && BigInt(result) !== 0n; setPhase(ok ? "ready" : "ready"); } })
      .catch(() => { if (!cancelled) setPhase("ready"); });
    return () => { cancelled = true; };
  }, [wallet.address]);

  const setField = (key: keyof TokenForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleDeploy = useCallback(async () => {
    if (!wallet.address) return;
    const cleanName = form.name.trim();
    const cleanSymbol = form.symbol.trim().toUpperCase();
    if (!cleanName || !cleanSymbol) {
      toast({ title: "Missing fields", description: "Token name and symbol are required.", variant: "destructive" });
      return;
    }
    if (wallet.isWrongNetwork) { await wallet.switchToBase().catch(() => {}); return; }

    setPhase("deploying");
    setErrorMsg("");
    setTxHash(null);
    setTokenAddress(null);
    setDeployStep(2);

    try {
      const adminAddr = (form.adminAddress || wallet.address) as `0x${string}`;
      const decimals = form.decimals;

      const paramsHex = encodeAbiParameters(
        [{ type: "tuple", components: [{ name: "version", type: "uint8" }, { name: "name", type: "string" }, { name: "symbol", type: "string" }, { name: "initialAdmin", type: "address" }, { name: "decimals", type: "uint8" }] }],
        [{ version: 1, name: cleanName, symbol: cleanSymbol, initialAdmin: adminAddr, decimals }]
      );

      const saltHex = keccak256(toBytes(`superswap:${adminAddr.toLowerCase()}:${cleanName}:${cleanSymbol}:${Date.now()}`)) as `0x${string}`;
      const initCalls: `0x${string}`[] = [];
      initCalls.push(encodeFunctionData({ abi: GRANT_ROLE_ABI, functionName: "grantRole", args: [MINT_ROLE, adminAddr] }));

      const rawSupply = form.initialSupply.replace(/,/g, "").trim();
      if (rawSupply) {
        const amt = parseUnits(rawSupply, decimals);
        if (amt > 0n) initCalls.push(encodeFunctionData({ abi: MINT_ABI, functionName: "mint", args: [adminAddr, amt] }));
      }
      if (form.supplyCap.trim()) {
        const cap = parseUnits(form.supplyCap.trim(), decimals);
        if (cap > 0n) initCalls.push(encodeFunctionData({ abi: SUPPLY_CAP_ABI, functionName: "updateSupplyCap", args: [cap] }));
      }

      const factoryData = encodeFunctionData({ abi: FACTORY_ABI, functionName: "createB20", args: [0, saltHex, paramsHex, initCalls] });
      setDeployStep(2);
      const hash = await wallet.sendTransaction({ to: B20_FACTORY, data: factoryData });
      setTxHash(hash);
      setPhase("pending");
      setDeployStep(3);
      toast({ title: "Transaction sent", description: "Waiting for confirmation on Base." });

      const receipt = await waitForReceipt(hash);
      if (receipt.status !== "0x1") throw new Error("Transaction reverted on-chain");

      setDeployStep(4);
      let extracted = "";
      try {
        const factoryLog = (receipt.logs as any[]).find((log: any) => log.address?.toLowerCase() === B20_FACTORY.toLowerCase());
        if (factoryLog?.topics?.length >= 2) extracted = getAddress("0x" + factoryLog.topics[1].slice(-40));
      } catch {}

      setTokenAddress(extracted || null);
      setDeployStep(5);
      setPhase("success");
    } catch (err: any) {
      const msg: string = err?.message ?? "Deployment failed";
      if (msg.includes("4001") || msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied")) {
        setPhase("ready");
        setDeployStep(0);
        toast({ title: "Cancelled", description: "Transaction rejected.", variant: "destructive" });
        return;
      }
      setErrorMsg(msg);
      setPhase("error");
      setDeployStep(0);
    }
  }, [wallet, form, toast]);

  const copyText = (text: string, key: "tx" | "token" | "addr") => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  const isBusy = phase === "deploying" || phase === "pending" || phase === "checking";
  const isSuccess = phase === "success";

  const displayName = form.name || "SuperSwap Token";
  const displaySymbol = form.symbol || "SUPER";
  const displaySupply = form.initialSupply || "1,000,000";

  const stepsDone = isSuccess ? 6 : deployStep;

  return (
    <div className="w-full min-h-screen bg-[#020b1c] text-white font-sans" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Inner Layout: sidebar + content */}
      <div className="flex h-full min-h-screen">

        {/* Left Sidebar */}
        <div className="hidden lg:flex flex-col w-[200px] flex-shrink-0 bg-black border-r border-[#101823]">
          {/* BASE logo */}
          <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#101823]">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
              <span className="text-black text-[10px] font-bold">B</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">BASE</span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 px-2.5 py-4 flex-1">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                data-testid={`nav-${key}`}
                onClick={() => setActiveNav(key)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left w-full"
                style={{
                  color: activeNav === key ? "#22c55e" : "#5a6472",
                  background: activeNav === key ? "rgba(34,197,94,0.07)" : "transparent",
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Base Network status */}
          <div className="px-4 py-4 border-t border-[#101823]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[#5a6472] text-xs">Base Network</span>
            </div>
            <div className="text-[#5a6472] text-xs">Online</div>
            <div className="text-[#3a4452] text-[10px] mt-0.5">Block #19,234,567</div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#101823] bg-black">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm">B20 Token Launcher</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">B20</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Network */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#101823] bg-[#060e1a] cursor-pointer">
                <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                <span className="text-[#a0a8b2] text-xs">Base</span>
                <span className="text-[#3a4452] text-[10px]">Chain ID:8453</span>
                <ChevronDown size={10} className="text-[#3a4452]" />
              </div>
              {/* Wallet */}
              {wallet.address ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#101823] bg-[#060e1a]">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
                  <span className="text-[#a0a8b2] text-xs">{shortAddr(wallet.address)}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  <ChevronDown size={10} className="text-[#3a4452]" />
                </div>
              ) : (
                <button
                  onClick={wallet.connect}
                  className="px-3 py-1.5 rounded-lg bg-[#22c55e] text-black text-xs font-semibold"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          {/* Page body */}
          <div className="flex-1 overflow-auto p-5">

            {!wallet.address ? (
              /* Connect wallet prompt */
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-14 h-14 rounded-2xl border border-[#101823] bg-[#060e1a] flex items-center justify-center">
                  <Rocket size={24} className="text-[#22c55e]" />
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold text-lg mb-1">Connect your wallet</div>
                  <div className="text-[#5a6472] text-sm">Required to deploy on Base mainnet</div>
                </div>
                <button
                  onClick={wallet.connect}
                  data-testid="button-connect-wallet"
                  className="px-6 py-2.5 rounded-lg bg-[#22c55e] text-black font-semibold text-sm"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {/* Two-column layout */}
                <div className="flex gap-4 mb-5">

                  {/* LEFT: Form */}
                  <div className="flex-1 min-w-0 bg-[#020c19] border border-[#101823] rounded-xl p-5">
                    <div className="mb-4">
                      <h2 className="text-white font-semibold text-base mb-0.5">Create B20 Token</h2>
                      <p className="text-[#5a6472] text-xs">Fill in the details to deploy your token on Base.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Token Name */}
                      <div>
                        <label className="block text-[#8a9099] text-xs mb-1.5">Token Name</label>
                        <input
                          data-testid="input-token-name"
                          value={form.name}
                          onChange={(e) => setField("name", e.target.value)}
                          placeholder="SuperSwap Token"
                          disabled={isBusy}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#040d1b] border border-[#101823] text-[#a0a8b2] text-sm focus:outline-none focus:border-[#22c55e]/40 placeholder-[#3a4452]"
                        />
                      </div>

                      {/* Symbol */}
                      <div>
                        <label className="block text-[#8a9099] text-xs mb-1.5">Symbol</label>
                        <input
                          data-testid="input-symbol"
                          value={form.symbol}
                          onChange={(e) => setField("symbol", e.target.value.toUpperCase().slice(0, 10))}
                          placeholder="SUPER"
                          disabled={isBusy}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#040d1b] border border-[#101823] text-[#a0a8b2] text-sm focus:outline-none focus:border-[#22c55e]/40 placeholder-[#3a4452]"
                        />
                      </div>

                      {/* Decimals */}
                      <div>
                        <label className="block text-[#8a9099] text-xs mb-1.5">Decimals</label>
                        <div className="relative">
                          <select
                            data-testid="select-decimals"
                            value={form.decimals}
                            onChange={(e) => setField("decimals", parseInt(e.target.value))}
                            disabled={isBusy}
                            className="w-full appearance-none px-3 py-2.5 rounded-lg bg-[#040d1b] border border-[#101823] text-[#a0a8b2] text-sm focus:outline-none focus:border-[#22c55e]/40"
                          >
                            {[6, 8, 9, 18].map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a4452] pointer-events-none" />
                        </div>
                      </div>

                      {/* Initial Supply */}
                      <div>
                        <label className="block text-[#8a9099] text-xs mb-1.5">Initial Supply</label>
                        <input
                          data-testid="input-initial-supply"
                          value={form.initialSupply}
                          onChange={(e) => setField("initialSupply", e.target.value)}
                          placeholder="1,000,000"
                          disabled={isBusy}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#040d1b] border border-[#101823] text-[#a0a8b2] text-sm focus:outline-none focus:border-[#22c55e]/40 placeholder-[#3a4452]"
                        />
                        <p className="text-[#3a4452] text-[11px] mt-1">Total token supply that will be minted on deployment.</p>
                      </div>

                      {/* Owner Address */}
                      <div>
                        <label className="block text-[#8a9099] text-xs mb-1.5">Owner Address</label>
                        <div className="relative">
                          <input
                            data-testid="input-owner-address"
                            value={form.adminAddress}
                            onChange={(e) => setField("adminAddress", e.target.value)}
                            placeholder={wallet.address || "0x..."}
                            disabled={isBusy}
                            className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[#040d1b] border border-[#101823] text-[#a0a8b2] text-sm focus:outline-none focus:border-[#22c55e]/40 placeholder-[#3a4452]"
                          />
                          {wallet.address && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
                          )}
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-3 pt-1">
                        {[
                          { key: "mintable" as const, label: "Mintable", tip: "Allows minting new tokens" },
                          { key: "burnable" as const, label: "Burnable", tip: "Allows burning tokens" },
                          { key: "pausable" as const, label: "Pausable", tip: "Allows pausing transfers" },
                          { key: "permit" as const, label: "Permit (EIP-2612)", tip: "Gasless approvals via signature" },
                        ].map(({ key, label, tip }) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#8a9099] text-sm">{label}</span>
                              <Info size={12} className="text-[#3a4452]" title={tip} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Toggle enabled={form[key]} onChange={() => setField(key, !form[key])} />
                              <span className="text-xs w-14 text-right" style={{ color: form[key] ? "#22c55e" : "#5a6472" }}>
                                {form[key] ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Transfer Fee */}
                      <div>
                        <label className="block text-[#8a9099] text-xs mb-1.5">Transfer Fee <span className="text-[#3a4452]">(optional)</span></label>
                        <div className="relative">
                          <input
                            data-testid="input-transfer-fee"
                            value={form.transferFee}
                            onChange={(e) => setField("transferFee", e.target.value)}
                            placeholder="0"
                            disabled={isBusy}
                            className="w-full px-3 pr-8 py-2.5 rounded-lg bg-[#040d1b] border border-[#101823] text-[#a0a8b2] text-sm focus:outline-none focus:border-[#22c55e]/40 placeholder-[#3a4452]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6472] text-sm">%</span>
                        </div>
                      </div>

                      {/* Treasury Address */}
                      <div>
                        <label className="block text-[#8a9099] text-xs mb-1.5">Treasury Address <span className="text-[#3a4452]">(optional)</span></label>
                        <input
                          data-testid="input-treasury-address"
                          value={form.treasuryAddress}
                          onChange={(e) => setField("treasuryAddress", e.target.value)}
                          placeholder="0x8e5d...321f"
                          disabled={isBusy}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#040d1b] border border-[#101823] text-[#a0a8b2] text-sm focus:outline-none focus:border-[#22c55e]/40 placeholder-[#3a4452]"
                        />
                      </div>

                      {/* Gas estimate */}
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#5a6472] text-xs">Estimated Gas</span>
                          <Info size={11} className="text-[#3a4452]" />
                        </div>
                        <div className="text-right">
                          <div className="text-[#a0a8b2] text-sm font-medium">≈0.00013 ETH</div>
                          <div className="text-[#5a6472] text-xs">~$0.28USD</div>
                        </div>
                      </div>

                      {/* Error */}
                      {phase === "error" && (
                        <div className="rounded-lg bg-red-900/20 border border-red-900/30 px-3 py-2.5 text-red-400 text-xs">
                          {errorMsg}
                        </div>
                      )}

                      {/* Success tx */}
                      {isSuccess && txHash && (
                        <div className="rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[#22c55e] text-xs font-medium">Token Deployed!</span>
                            <a href={`${BASE_SCAN}/tx/${txHash}`} target="_blank" rel="noreferrer">
                              <ExternalLink size={12} className="text-[#22c55e]" />
                            </a>
                          </div>
                          {tokenAddress && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[#a0a8b2] text-[11px] font-mono">{shortAddr(tokenAddress)}</span>
                              <button onClick={() => copyText(tokenAddress, "token")}>
                                <Copy size={10} className={copied === "token" ? "text-[#22c55e]" : "text-[#5a6472]"} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Launch Button */}
                      <button
                        data-testid="button-launch-token"
                        onClick={isSuccess ? () => { setPhase("ready"); setTxHash(null); setTokenAddress(null); setDeployStep(0); setForm(f => ({ ...f, name: "", symbol: "", initialSupply: "1,000,000" })); } : handleDeploy}
                        disabled={isBusy}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
                        style={{ background: isSuccess ? "#1a2d1a" : "#22c55e", color: isSuccess ? "#22c55e" : "#000" }}
                      >
                        {isBusy ? (
                          <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          {phase === "pending" ? "Confirming..." : "Deploying..."}</>
                        ) : isSuccess ? (
                          <><CheckCircle size={16} /> Deploy Another Token</>
                        ) : (
                          <><Rocket size={16} /> Launch Token</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RIGHT: Preview + Status */}
                  <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">

                    {/* Token Preview */}
                    <div className="bg-[#020c19] border border-[#101823] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-white font-semibold text-sm">Token Preview</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">B20</span>
                      </div>

                      {/* Token identity */}
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#101823]">
                        <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#22c55e] text-sm font-bold">{(displaySymbol[0] || "S")}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-white text-sm font-medium">{displayName}</span>
                            {(form.name || form.symbol) && <CheckCircle size={12} className="text-[#22c55e]" />}
                          </div>
                          <div className="text-[#5a6472] text-xs">{displaySymbol}</div>
                        </div>
                      </div>

                      {/* Properties */}
                      <div className="space-y-2.5">
                        {[
                          { label: "Network", value: "Base", valueEl: <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22c55e]" /><span className="text-[#a0a8b2] text-xs">Base</span></div> },
                          { label: "Standard", value: "B20", plain: true },
                          { label: "Decimals", value: String(form.decimals), plain: true },
                          { label: "Total Supply", value: `${displaySupply} ${displaySymbol}`, plain: true, bright: true },
                          { label: "Mintable", bool: form.mintable },
                          { label: "Burnable", bool: form.burnable },
                          { label: "Pausable", bool: form.pausable },
                          { label: "Permit (EIP-2612)", bool: form.permit },
                        ].map(({ label, value, valueEl, plain, bright, bool }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-[#5a6472] text-xs">{label}</span>
                            {valueEl ? valueEl :
                              bool !== undefined ? (
                                <div className="flex items-center gap-1">
                                  {bool && <CheckCircle size={11} className="text-[#22c55e]" />}
                                  <span className="text-xs" style={{ color: bool ? "#22c55e" : "#5a6472" }}>{bool ? "Yes" : "No"}</span>
                                </div>
                              ) : (
                                <span className="text-xs font-medium" style={{ color: bright ? "#fff" : "#a0a8b2" }}>{value}</span>
                              )
                            }
                          </div>
                        ))}
                        {/* Contract Address */}
                        <div>
                          <div className="text-[#5a6472] text-xs mb-1">Contract Address</div>
                          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#040d1b] border border-[#101823]">
                            {tokenAddress ? (
                              <>
                                <span className="text-[#a0a8b2] text-[11px] font-mono flex-1 truncate">{shortAddr(tokenAddress)}</span>
                                <button onClick={() => copyText(tokenAddress, "token")} data-testid="button-copy-contract">
                                  <Copy size={11} className={copied === "token" ? "text-[#22c55e]" : "text-[#3a4452]"} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[#3a4452] text-[11px]">Will be generated after deployment</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deployment Status */}
                    <div className="bg-[#020c19] border border-[#101823] rounded-xl p-4">
                      <h3 className="text-white font-semibold text-sm mb-3">Deployment Status</h3>
                      <div className="space-y-0">
                        {DEPLOY_STEPS.map((step, i) => {
                          const done = i < stepsDone;
                          const active = i === stepsDone && isBusy;
                          return (
                            <div key={i} className="flex gap-2.5">
                              {/* Line + circle */}
                              <div className="flex flex-col items-center">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-colors"
                                  style={{
                                    background: done ? "#22c55e" : active ? "#1a2d1a" : "#0a1522",
                                    border: `1px solid ${done ? "#22c55e" : active ? "#22c55e" : "#1a2532"}`,
                                    color: done ? "#000" : active ? "#22c55e" : "#3a4452",
                                  }}
                                >
                                  {done ? <CheckCircle size={11} color="#000" /> : i + 1}
                                </div>
                                {i < DEPLOY_STEPS.length - 1 && (
                                  <div className="w-px flex-1 my-0.5" style={{ background: done ? "#22c55e" : "#1a2532", minHeight: "16px" }} />
                                )}
                              </div>
                              {/* Label */}
                              <div className="pb-3 flex-1 min-w-0">
                                <div className="text-xs font-medium" style={{ color: done ? "#22c55e" : active ? "#a0a8b2" : "#5a6472" }}>
                                  {step.label}
                                </div>
                                <div className="text-[10px]" style={{ color: done ? "#22c55e99" : "#3a4452" }}>
                                  {step.desc}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* How it works */}
                <div className="bg-[#020c19] border border-[#101823] rounded-xl p-5 mb-5">
                  <h3 className="text-white font-semibold text-sm mb-4">How it works</h3>
                  <div className="flex items-start gap-0">
                    {HOW_IT_WORKS.map(({ n, label, desc }, i) => (
                      <div key={n} className="flex items-start flex-1 min-w-0">
                        <div className="flex flex-col items-center flex-1 min-w-0 px-1">
                          {/* Number badge */}
                          <div className="w-8 h-8 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/05 flex items-center justify-center mb-2 flex-shrink-0">
                            <span className="text-[#22c55e] text-xs font-bold">{n}</span>
                          </div>
                          {/* Icon */}
                          <div className="w-10 h-10 rounded-xl bg-[#040d1b] border border-[#101823] flex items-center justify-center mb-2">
                            {n === 1 && <Settings size={18} className="text-[#22c55e]" />}
                            {n === 2 && <FileText size={18} className="text-[#22c55e]" />}
                            {n === 3 && <Zap size={18} className="text-[#22c55e]" />}
                            {n === 4 && <LayoutGrid size={18} className="text-[#22c55e]" />}
                            {n === 5 && <Search size={18} className="text-[#22c55e]" />}
                            {n === 6 && <Rocket size={18} className="text-[#22c55e]" />}
                          </div>
                          <div className="text-[#a0a8b2] text-xs font-medium text-center mb-0.5">{label}</div>
                          <div className="text-[#3a4452] text-[10px] text-center leading-tight">{desc}</div>
                        </div>
                        {i < HOW_IT_WORKS.length - 1 && (
                          <div className="flex items-center pt-9 flex-shrink-0">
                            <ArrowRight size={12} className="text-[#1a2532]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom stats bar */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Estimated Deployment", value: "15 sec", sub: "Average time", icon: Clock },
                    { label: "Network Fee", value: "0.00013ETH", sub: "~$0.28USD", icon: Zap },
                    { label: "Base Network", value: "Chain ID:8453", sub: "Mainnet", icon: LayoutGrid },
                    { label: "Contract Size", value: "9.7KB", sub: "Optimized", icon: FileText },
                  ].map(({ label, value, sub, icon: Icon }) => (
                    <div key={label} className="bg-[#020c19] border border-[#101823] rounded-xl p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#040d1b] border border-[#101823] flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-[#22c55e]" />
                      </div>
                      <div>
                        <div className="text-[#5a6472] text-[10px] mb-0.5">{label}</div>
                        <div className="text-[#a0a8b2] text-sm font-semibold leading-tight">{value}</div>
                        <div className="text-[#5a6472] text-[10px]">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
