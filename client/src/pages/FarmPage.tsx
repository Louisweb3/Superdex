import { useState, useEffect, useCallback } from "react";
import baseLogoSrc from "@assets/base_logo_1782978064400.png";
import rhLogoSrc from "@assets/unnamed_(4)_1782977968316.png";
import { encodeAbiParameters, parseUnits } from "viem";
import { useWalletContext } from "@/context/WalletContext";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import { useToast } from "@/hooks/use-toast";
import {
  COUNTER_BYTECODE,
  NFT_BYTECODE,
  ERC20_BYTECODE,
  ERC20_CONSTRUCTOR_ABI,
} from "@/lib/farmContracts";
import {
  Zap,
  ArrowLeftRight,
  Wallet,
  ChevronDown,
  Sunrise,
  Moon,
  Coins,
  Boxes,
  Hash,
  Loader2,
  X,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";

// ─── Chain configs ──────────────────────────────────────────────────────────
const BASE_MAINNET = {
  chainId: "0x2105" as const,
  chainIdDecimal: 8453,
  chainName: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};
const RH_MAINNET = {
  chainId: "0x1237" as const,
  chainIdDecimal: 4663,
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
};

type ChainKey = "base" | "robinhood";
type ChainConfig = {
  chainId: string;
  chainIdDecimal: number;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};
const CHAIN_CONFIG: Record<ChainKey, ChainConfig> = {
  base: BASE_MAINNET,
  robinhood: RH_MAINNET,
};

// ─── RPC helpers ────────────────────────────────────────────────────────────
async function waitForReceipt(txHash: string, rpc: string, maxMs = 90_000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const r = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [txHash],
      }),
    });
    const { result } = await r.json();
    if (result) return result;
    await new Promise((res) => setTimeout(res, 2500));
  }
  throw new Error("Timed out waiting for receipt");
}

// ─── Local storage helpers ──────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function lsKey(chain: ChainKey, action: "gm" | "gn") {
  return `farm_${chain}_${action}`;
}
function hasDoneToday(chain: ChainKey, action: "gm" | "gn") {
  return localStorage.getItem(lsKey(chain, action)) === todayKey();
}
function markDoneToday(chain: ChainKey, action: "gm" | "gn") {
  localStorage.setItem(lsKey(chain, action), todayKey());
}
function getXpTotal(): number {
  return Number(localStorage.getItem("farm_xp_total") || "0");
}
function addXpTotal(amount: number): number {
  const next = getXpTotal() + amount;
  localStorage.setItem("farm_xp_total", String(next));
  return next;
}

type DeployRecord = {
  chain: ChainKey;
  kind: "token" | "nft" | "counter";
  label: string;
  address: string;
  txHash: string;
};

// ─── Award XP on the backend, non-blocking for the caller's happy path ──────
async function awardXp(
  wallet: string,
  actionType: "gm" | "gn" | "deploy_token" | "deploy_nft" | "deploy_counter",
  chain: ChainKey,
  txHash: string,
): Promise<number> {
  try {
    const res = await fetch("/api/farm/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, actionType, chain, txHash }),
    });
    const data = await res.json();
    return data?.xpAwarded ?? 0;
  } catch {
    return 0;
  }
}

// ─── Logo tile ──────────────────────────────────────────────────────────────
function ChainLogo({ chain, size = 56 }: { chain: ChainKey; size?: number }) {
  if (chain === "base") {
    return (
      <div
        className="rounded-2xl bg-[#0052FF] flex items-center justify-center overflow-hidden shadow-[0_8px_20px_-6px_rgba(0,82,255,0.55),inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{ width: size, height: size }}
      >
        <img src={baseLogoSrc} alt="Base" className="w-[55%] h-[55%]" />
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-[0_8px_20px_-6px_rgba(0,199,3,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]"
      style={{ width: size, height: size }}
    >
      <img src={rhLogoSrc} alt="Robinhood Chain" className="w-full h-full object-cover" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function FarmPage() {
  const wallet = useWalletContext();
  const { toast } = useToast();
  const [walletOpen, setWalletOpen] = useState(false);

  const [gmDone, setGmDone] = useState<Record<ChainKey, boolean>>({
    base: hasDoneToday("base", "gm"),
    robinhood: hasDoneToday("robinhood", "gm"),
  });
  const [gnDone, setGnDone] = useState<Record<ChainKey, boolean>>({
    base: hasDoneToday("base", "gn"),
    robinhood: hasDoneToday("robinhood", "gn"),
  });
  const [busyAction, setBusyAction] = useState<string | null>(null); // `${chain}-${action}`
  const [deployments, setDeployments] = useState<DeployRecord[]>([]);
  const [xpTotal, setXpTotal] = useState(getXpTotal());

  const [tokenModalChain, setTokenModalChain] = useState<ChainKey | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("1000000");

  const isConnected = wallet.isConnected;

  const gainXp = useCallback(
    async (
      actionType: "gm" | "gn" | "deploy_token" | "deploy_nft" | "deploy_counter",
      chain: ChainKey,
      txHash: string,
    ) => {
      const awarded = await awardXp(wallet.address ?? "", actionType, chain, txHash);
      if (awarded > 0) {
        setXpTotal(addXpTotal(awarded));
        toast({ title: `+${awarded} XP earned!` });
      }
    },
    [wallet.address, toast],
  );

  // ─── Ensure wallet is on the requested chain before an action ─────────────
  const ensureChain = useCallback(
    async (chain: ChainKey): Promise<boolean> => {
      if (!window.ethereum) return false;
      try {
        const chainIdHex: string = await window.ethereum.request({ method: "eth_chainId" });
        if (parseInt(chainIdHex, 16) === CHAIN_CONFIG[chain].chainIdDecimal) return true;
      } catch {
        // fall through to switch
      }
      try {
        if (chain === "base") await wallet.switchToBase();
        else await wallet.switchToRobinhood();
        return true;
      } catch (e: any) {
        toast({ title: "Failed to switch network", description: e.message, variant: "destructive" });
        return false;
      }
    },
    [wallet, toast],
  );

  // ─── Send GM / GN ──────────────────────────────────────────────────────────
  const sendGmOrGn = useCallback(
    async (chain: ChainKey, kind: "gm" | "gn") => {
      if (!isConnected) {
        setWalletOpen(true);
        return;
      }
      const doneMap = kind === "gm" ? gmDone : gnDone;
      if (doneMap[chain]) {
        toast({ title: `Already sent ${kind.toUpperCase()} today on ${CHAIN_CONFIG[chain].chainName}!` });
        return;
      }
      const key = `${chain}-${kind}`;
      setBusyAction(key);
      try {
        const ok = await ensureChain(chain);
        if (!ok) return;
        const data = kind === "gm" ? "0x474d" : "0x474e"; // UTF-8 "GM" / "GN"
        const txHash = await wallet.sendTransaction({
          to: wallet.address as string,
          data,
          value: "0x0",
        });
        markDoneToday(chain, kind);
        if (kind === "gm") setGmDone((p) => ({ ...p, [chain]: true }));
        else setGnDone((p) => ({ ...p, [chain]: true }));
        toast({
          title: `${kind === "gm" ? "☀️ GM" : "🌙 GN"} sent on ${CHAIN_CONFIG[chain].chainName}!`,
          description: `${txHash.slice(0, 20)}…`,
        });
        await gainXp(kind, chain, txHash);
      } catch (e: any) {
        toast({ title: `${kind.toUpperCase()} failed`, description: e.message, variant: "destructive" });
      } finally {
        setBusyAction(null);
      }
    },
    [isConnected, gmDone, gnDone, ensureChain, wallet, toast, gainXp],
  );

  // ─── Deploy Counter ─────────────────────────────────────────────────────────
  const deployCounter = useCallback(
    async (chain: ChainKey) => {
      if (!isConnected) {
        setWalletOpen(true);
        return;
      }
      const key = `${chain}-counter`;
      setBusyAction(key);
      try {
        const ok = await ensureChain(chain);
        if (!ok) return;
        const txHash = await (window as any).ethereum.request({
          method: "eth_sendTransaction",
          params: [{ from: wallet.address, data: COUNTER_BYTECODE }],
        });
        toast({ title: "Deploying Counter…", description: "Waiting for confirmation…" });
        const receipt = await waitForReceipt(txHash, CHAIN_CONFIG[chain].rpcUrls[0]);
        const address = receipt.contractAddress;
        setDeployments((prev) => [
          { chain, kind: "counter", label: "Counter", address, txHash },
          ...prev,
        ]);
        toast({ title: "✅ Counter deployed!", description: address });
        await gainXp("deploy_counter", chain, txHash);
      } catch (e: any) {
        toast({ title: "Deployment failed", description: e.message, variant: "destructive" });
      } finally {
        setBusyAction(null);
      }
    },
    [isConnected, ensureChain, wallet, toast, gainXp],
  );

  // ─── Deploy NFT ─────────────────────────────────────────────────────────────
  const deployNft = useCallback(
    async (chain: ChainKey) => {
      if (!isConnected) {
        setWalletOpen(true);
        return;
      }
      const key = `${chain}-nft`;
      setBusyAction(key);
      try {
        const ok = await ensureChain(chain);
        if (!ok) return;
        const encodedArgs = encodeAbiParameters(
          [
            { type: "string", name: "_name" },
            { type: "string", name: "_symbol" },
          ],
          ["SuperSwap Farm NFT", "SSFARM"],
        );
        const data = (NFT_BYTECODE + encodedArgs.slice(2)) as `0x${string}`;
        const txHash = await (window as any).ethereum.request({
          method: "eth_sendTransaction",
          params: [{ from: wallet.address, data }],
        });
        toast({ title: "Deploying NFT collection…", description: "Waiting for confirmation…" });
        const receipt = await waitForReceipt(txHash, CHAIN_CONFIG[chain].rpcUrls[0]);
        const address = receipt.contractAddress;
        setDeployments((prev) => [
          { chain, kind: "nft", label: "SuperSwap Farm NFT", address, txHash },
          ...prev,
        ]);
        toast({ title: "✅ NFT collection deployed!", description: address });
        await gainXp("deploy_nft", chain, txHash);
      } catch (e: any) {
        toast({ title: "Deployment failed", description: e.message, variant: "destructive" });
      } finally {
        setBusyAction(null);
      }
    },
    [isConnected, ensureChain, wallet, toast, gainXp],
  );

  // ─── Deploy Token (opens form modal first) ──────────────────────────────────
  const openTokenModal = useCallback(
    (chain: ChainKey) => {
      if (!isConnected) {
        setWalletOpen(true);
        return;
      }
      setTokenName("");
      setTokenSymbol("");
      setTokenSupply("1000000");
      setTokenModalChain(chain);
    },
    [isConnected],
  );

  const deployToken = useCallback(async () => {
    if (!tokenModalChain) return;
    if (!tokenName || !tokenSymbol || !tokenSupply) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    const chain = tokenModalChain;
    const key = `${chain}-token`;
    setBusyAction(key);
    try {
      const ok = await ensureChain(chain);
      if (!ok) return;
      const supply = parseUnits(tokenSupply, 18);
      const encodedArgs = encodeAbiParameters(ERC20_CONSTRUCTOR_ABI, [
        tokenName,
        tokenSymbol,
        supply,
      ]);
      const data = (ERC20_BYTECODE + encodedArgs.slice(2)) as `0x${string}`;
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, data }],
      });
      toast({ title: "Deployment tx submitted!", description: "Waiting for confirmation…" });
      const receipt = await waitForReceipt(txHash, CHAIN_CONFIG[chain].rpcUrls[0]);
      const address = receipt.contractAddress;
      setDeployments((prev) => [
        { chain, kind: "token", label: `${tokenName} (${tokenSymbol})`, address, txHash },
        ...prev,
      ]);
      setTokenModalChain(null);
      toast({ title: `✅ ${tokenName} deployed!`, description: address });
      await gainXp("deploy_token", chain, txHash);
    } catch (e: any) {
      toast({ title: "Deployment failed", description: e.message, variant: "destructive" });
    } finally {
      setBusyAction(null);
    }
  }, [tokenModalChain, tokenName, tokenSymbol, tokenSupply, ensureChain, wallet, toast, gainXp]);

  return (
    <div
      className="min-h-screen bg-[#090b09] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[#1c1f1c] bg-gradient-to-br from-[#0d0f0d] via-[#090b09] to-black px-5 sm:px-8 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,199,3,0.14),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-[1100px] mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C703] to-[#0a8a02] flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(0,199,3,0.5)]">
                <Sparkles size={17} className="text-black" />
              </div>
              <span
                className="font-black text-[18px] tracking-wide"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Farm
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2">
                <Zap size={13} className="text-[#00C703]" />
                <span className="text-[13px] font-bold text-white">{xpTotal.toLocaleString()} XP</span>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2 text-[13px] font-semibold">
                  <Wallet size={14} className="text-[#00C703]" />
                  {wallet.address?.slice(0, 6)}…{wallet.address?.slice(-4)}
                </div>
              ) : (
                <button
                  onClick={() => setWalletOpen(true)}
                  data-testid="button-connect-wallet"
                  className="flex items-center gap-2 bg-[#00C703] hover:bg-[#0ad60a] text-black text-[13px] font-bold px-4 py-2 rounded-full transition-all shadow-[0_4px_14px_-2px_rgba(0,199,3,0.5)]"
                >
                  <Wallet size={14} />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          <h1
            className="text-[28px] sm:text-[38px] font-black leading-tight mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Say GM &amp; Deploy Contracts{" "}
            <span className="text-[#00C703]">in one click.</span>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-white/50 max-w-xl">
            Real on-chain actions on Base and Robinhood Chain. Every GM, GN, and
            deployment earns you XP.
          </p>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["base", "robinhood"] as ChainKey[]).map((chain) => {
            const cfg = CHAIN_CONFIG[chain];
            const gm = gmDone[chain];
            const gn = gnDone[chain];
            return (
              <div
                key={chain}
                data-testid={`card-network-${chain}`}
                className="relative rounded-[22px] p-[1px] bg-gradient-to-b from-white/[0.14] to-white/[0.02] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
              >
                <div className="rounded-[21px] bg-gradient-to-b from-[#101210] to-[#0b0d0b] p-6 h-full">
                  {/* Card header */}
                  <div className="flex items-center gap-4 mb-6">
                    <ChainLogo chain={chain} />
                    <div>
                      <div className="font-black text-[19px]" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {cfg.chainName}
                      </div>
                      <div className="text-[12px] text-white/40">
                        Chain ID {cfg.chainIdDecimal}
                      </div>
                    </div>
                  </div>

                  {/* GM / GN */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      onClick={() => sendGmOrGn(chain, "gm")}
                      disabled={busyAction === `${chain}-gm` || gm}
                      data-testid={`button-${chain}-gm`}
                      className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold transition-all border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                        gm
                          ? "bg-[#123832]/60 border-[#2f6b5a]/60 text-[#4ade80]/70"
                          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-[#00C703]/40 text-white"
                      } disabled:cursor-not-allowed`}
                    >
                      {busyAction === `${chain}-gm` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : gm ? (
                        <CheckCircle2 size={14} className="text-[#4ade80]" />
                      ) : (
                        <Sunrise size={14} />
                      )}
                      {gm ? "GM Sent" : "Say GM"}
                    </button>
                    <button
                      onClick={() => sendGmOrGn(chain, "gn")}
                      disabled={busyAction === `${chain}-gn` || gn}
                      data-testid={`button-${chain}-gn`}
                      className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold transition-all border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                        gn
                          ? "bg-[#123832]/60 border-[#2f6b5a]/60 text-[#4ade80]/70"
                          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-[#00C703]/40 text-white"
                      } disabled:cursor-not-allowed`}
                    >
                      {busyAction === `${chain}-gn` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : gn ? (
                        <CheckCircle2 size={14} className="text-[#4ade80]" />
                      ) : (
                        <Moon size={14} />
                      )}
                      {gn ? "GN Sent" : "Say GN"}
                    </button>
                  </div>

                  {/* Deploy actions */}
                  <div className="flex flex-col gap-2.5 mt-3">
                    <button
                      onClick={() => openTokenModal(chain)}
                      disabled={busyAction === `${chain}-token`}
                      data-testid={`button-${chain}-deploy-token`}
                      className="flex items-center justify-between rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 px-4 py-3 transition-all"
                    >
                      <span className="flex items-center gap-2.5 text-[13px] font-semibold text-white">
                        <span className="w-7 h-7 rounded-lg bg-[#00C703]/15 flex items-center justify-center">
                          <Coins size={13} className="text-[#00C703]" />
                        </span>
                        Deploy Token
                      </span>
                      {busyAction === `${chain}-token` ? (
                        <Loader2 size={14} className="animate-spin text-white/50" />
                      ) : (
                        <span className="text-[11px] font-bold text-[#00C703] bg-[#123832]/60 px-2 py-0.5 rounded-full">
                          +50 XP
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => deployNft(chain)}
                      disabled={busyAction === `${chain}-nft`}
                      data-testid={`button-${chain}-deploy-nft`}
                      className="flex items-center justify-between rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 px-4 py-3 transition-all"
                    >
                      <span className="flex items-center gap-2.5 text-[13px] font-semibold text-white">
                        <span className="w-7 h-7 rounded-lg bg-[#00C703]/15 flex items-center justify-center">
                          <Boxes size={13} className="text-[#00C703]" />
                        </span>
                        Deploy NFT
                      </span>
                      {busyAction === `${chain}-nft` ? (
                        <Loader2 size={14} className="animate-spin text-white/50" />
                      ) : (
                        <span className="text-[11px] font-bold text-[#00C703] bg-[#123832]/60 px-2 py-0.5 rounded-full">
                          +40 XP
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => deployCounter(chain)}
                      disabled={busyAction === `${chain}-counter`}
                      data-testid={`button-${chain}-deploy-counter`}
                      className="flex items-center justify-between rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 px-4 py-3 transition-all"
                    >
                      <span className="flex items-center gap-2.5 text-[13px] font-semibold text-white">
                        <span className="w-7 h-7 rounded-lg bg-[#00C703]/15 flex items-center justify-center">
                          <Hash size={13} className="text-[#00C703]" />
                        </span>
                        Deploy Counter
                      </span>
                      {busyAction === `${chain}-counter` ? (
                        <Loader2 size={14} className="animate-spin text-white/50" />
                      ) : (
                        <span className="text-[11px] font-bold text-[#00C703] bg-[#123832]/60 px-2 py-0.5 rounded-full">
                          +25 XP
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Bridge link */}
                  <a
                    href="https://relay.link"
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`link-${chain}-bridge`}
                    className="w-full flex items-center justify-center gap-1.5 mt-5 pt-4 border-t border-white/5 text-[12px] font-semibold text-white/40 hover:text-white transition-colors"
                  >
                    <ArrowLeftRight size={12} />
                    Bridge to {cfg.chainName}
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deployment history */}
        {deployments.length > 0 && (
          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Boxes size={15} className="text-[#00C703]" />
              <span className="font-bold text-[14px]">Your Deployments</span>
            </div>
            <div className="flex flex-col gap-2">
              {deployments.map((d, i) => (
                <a
                  key={i}
                  href={`${CHAIN_CONFIG[d.chain].blockExplorerUrls[0]}/address/${d.address}`}
                  target="_blank"
                  rel="noreferrer"
                  data-testid={`link-deployment-${i}`}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-[#00C703] bg-[#123832]/60 px-2 py-0.5 rounded-full uppercase">
                      {d.kind}
                    </span>
                    <span className="text-[13px] font-semibold">{d.label}</span>
                    <span className="text-[11px] text-white/30">{CHAIN_CONFIG[d.chain].chainName}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-white/40">
                    {d.address.slice(0, 8)}…{d.address.slice(-6)}
                    <ExternalLink size={11} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Deploy Token modal ────────────────────────────────────────────────── */}
      {tokenModalChain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div
            data-testid="modal-deploy-token"
            className="w-full max-w-[400px] rounded-[22px] p-[1px] bg-gradient-to-b from-white/[0.16] to-white/[0.02] shadow-2xl"
          >
            <div className="rounded-[21px] bg-gradient-to-b from-[#101210] to-[#0b0d0b] p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-[#00C703]" />
                  <span className="font-bold text-[15px]" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Deploy Token on {CHAIN_CONFIG[tokenModalChain].chainName}
                  </span>
                </div>
                <button
                  onClick={() => setTokenModalChain(null)}
                  data-testid="button-close-token-modal"
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                <div>
                  <label className="text-[11px] font-semibold text-white/50 mb-1.5 block">
                    Token Name
                  </label>
                  <input
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g. SuperSwap Token"
                    data-testid="input-token-name"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-[#00C703]/50 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/50 mb-1.5 block">
                    Ticker
                  </label>
                  <input
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. SST"
                    data-testid="input-token-symbol"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-[#00C703]/50 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/50 mb-1.5 block">
                    Total Supply
                  </label>
                  <input
                    value={tokenSupply}
                    onChange={(e) => setTokenSupply(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="1000000"
                    data-testid="input-token-supply"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-[#00C703]/50 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3.5 py-2.5 mb-4">
                <Info size={13} className="text-yellow-400 flex-shrink-0" />
                <span className="text-[11px] text-yellow-300/80">
                  This deploys a real ERC-20 contract on-chain. Gas fees apply.
                </span>
              </div>

              <button
                onClick={deployToken}
                disabled={busyAction === `${tokenModalChain}-token`}
                data-testid="button-confirm-deploy-token"
                className="w-full flex items-center justify-center gap-2 bg-[#00C703] hover:bg-[#0ad60a] disabled:opacity-60 text-black font-bold text-[14px] py-3.5 rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(0,199,3,0.5)]"
              >
                {busyAction === `${tokenModalChain}-token` ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Deploying…
                  </>
                ) : (
                  "Deploy Token"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={async () => {
          setWalletOpen(false);
          await wallet.connect();
        }}
      />
    </div>
  );
}
