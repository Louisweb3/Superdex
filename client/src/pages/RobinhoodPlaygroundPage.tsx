import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { encodeAbiParameters, encodeFunctionData, formatEther, parseEther, parseUnits } from "viem";
import { useWalletContext } from "@/context/WalletContext";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useRewardUser, useDailyClaimStatus, useDailyClaim } from "@/hooks/useRewards";

import swapButtonImg from "@assets/Swap_button_1783272484249.png";
import bridgeButtonImg from "@assets/Bridge_button_1783272484249.png";

import { BottomNav, DesktopNav } from "@/components/robinhood/Sidebar";
import { DashboardView } from "@/components/robinhood/DashboardView";
import { ContractsView } from "@/components/robinhood/ContractsView";
import { DeployView } from "@/components/robinhood/DeployView";
import { ExplorerView } from "@/components/robinhood/ExplorerView";
import { RewardsView } from "@/components/robinhood/RewardsView";
import type { DeployedToken, RhTab } from "@/components/robinhood/types";

// ─── Robinhood Chain config ───────────────────────────────────────────────────────
const RH_MAINNET = {
  chainId: "0x1237" as const,
  chainIdDecimal: 4663,
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
};
const ACTIVE_NETWORK = RH_MAINNET;
const EXPLORER = "https://robinhoodchain.blockscout.com";
const RH_BRIDGE = "https://relay.link";
const RH_RPC = ACTIVE_NETWORK.rpcUrls[0];

// ─── ERC-20 ABI for deployment ──────────────────────────────────────────────────────
const ERC20_BYTECODE =
  "0x608060405234801561001057600080fd5b50..." as const;
const ERC20_CONSTRUCTOR_ABI = [
  { type: "string", name: "name" },
  { type: "string", name: "symbol" },
  { type: "uint256", name: "initialSupply" },
] as const;
const XP_CLAIM_CONTRACT = "0x8cA81D184878f9A65a933066fD989D6eb4363cC2";
const XP_CLAIM_VALUE_ETH = "0.000038";
const XP_CLAIM_ABI = [{ type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "payable" }] as const;

// ─── Local storage helpers ───────────────────────────────────────────────────────
const LS_CONTRACTS_KEY = "rh_playground_contracts";
const LS_GM_KEY = "rh_playground_gm";
const LS_GN_KEY = "rh_playground_gn";

function getStoredContracts(): DeployedToken[] {
  try { return JSON.parse(localStorage.getItem(LS_CONTRACTS_KEY) || "[]"); }
  catch { return []; }
}
function saveContracts(list: DeployedToken[]) {
  localStorage.setItem(LS_CONTRACTS_KEY, JSON.stringify(list));
}
function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function hasClaimedGmToday() { return localStorage.getItem(LS_GM_KEY) === getTodayKey(); }
function markGmToday() { localStorage.setItem(LS_GM_KEY, getTodayKey()); }
function hasClaimedGnToday() { return localStorage.getItem(LS_GN_KEY) === getTodayKey(); }
function markGnToday() { localStorage.setItem(LS_GN_KEY, getTodayKey()); }

// ─── Farm action XP sync helper ──────────────────────────────────────────────
async function recordFarmAction(wallet: string, actionType: string, chain: string, txHash: string) {
  try {
    await apiRequest("POST", "/api/farm/action", { wallet, actionType, chain, txHash });
  } catch { /* non-fatal: XP sync failure shouldn't block the on-chain action */ }
}

// ─── Uniswap LP link builder ──────────────────────────────────────────────────
function buildUniswapLpUrl(deployedCA: string): string {
  const priceRangeState = encodeURIComponent(JSON.stringify({ priceInverted: false, fullRange: true }));
  const depositState = encodeURIComponent(JSON.stringify({ exactField: "TOKEN0" }));
  return `https://app.uniswap.org/positions/create/v2?currencyA=${deployedCA}&currencyB=undefined&chain=robinhood&fee=undefined&hook=undefined&priceRangeState=${priceRangeState}&depositState=${depositState}`;
}

// ─── Add token to wallet helper ───────────────────────────────────────────────
async function addTokenToWallet(token: DeployedToken) {
  await (window as any).ethereum.request({
    method: "wallet_watchAsset",
    params: {
      type: "ERC20",
      options: {
        address: token.address,
        symbol: token.symbol,
        decimals: 18,
        image: token.imageUrl || undefined,
      },
    },
  });
}

// ─── RPC helper ──────────────────────────────────────────────────────────────
async function waitForReceipt(txHash: string, rpc: string, maxMs = 60_000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const r = await fetch(rpc, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [txHash] }),
    });
    const { result } = await r.json();
    if (result) return result;
    await new Promise((res) => setTimeout(res, 2500));
  }
  throw new Error("Timed out waiting for receipt");
}

// ─── Contract verification ───────────────────────────────────────────────────
async function verifyOnBlockscout(address: string, constructorArgs: string): Promise<boolean> {
  const res = await fetch(`${EXPLORER}/api/v2/smart-contracts/${address}`, { method: "GET" });
  if (!res.ok) return false;
  const data = await res.json();
  return data?.is_verified === true;
}

// ─── Token icon helpers ─────────────────────────────────────────────────────────────
function getTokenIcon(symbol: string): string {
  const icons: Record<string, string> = {
    "RIN": "🔒",
    "NFT": "🖼️",
    "GAME": "🎮",
    "STAKE": "📊",
    "MARKET": "🛒",
    "GM": "🌅",
    "GN": "🌙",
  };
  return icons[symbol.toUpperCase()] || "🔢";
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function RobinhoodPlaygroundPage(): JSX.Element {
  const wallet = useWalletContext();
  const { toast } = useToast();
  const [walletOpen, setWalletOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RhTab>("dashboard");

  const { data: platformStats } = useQuery<{ totalContractsDeployed: number }>({
    queryKey: ["/api/robinhood/stats"],
  });
  const totalContractsDeployed = platformStats?.totalContractsDeployed ?? 310;

  const [isOnRH, setIsOnRH] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("1000000");
  const [tokenImageUrl, setTokenImageUrl] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployedContracts, setDeployedContracts] = useState<DeployedToken[]>(getStoredContracts());
  const [lastDeployed, setLastDeployed] = useState<DeployedToken | null>(deployedContracts[0] ?? null);

  const [sendingGm, setSendingGm] = useState(false);
  const [gmClaimed, setGmClaimed] = useState(hasClaimedGmToday());
  const [gmTxHash, setGmTxHash] = useState("");

  const [sendingGn, setSendingGn] = useState(false);
  const [gnClaimed, setGnClaimed] = useState(hasClaimedGnToday());
  const [gnTxHash, setGnTxHash] = useState("");

  const [claimingXp, setClaimingXp] = useState(false);
  const [xpTxHash, setXpTxHash] = useState("");

  // ─── Real, backend-synced XP/rewards state (single source of truth) ─────────
  const { data: rewardUser } = useRewardUser(wallet.address ?? null);
  const { data: dailyClaimStatus } = useDailyClaimStatus(wallet.address ?? null);
  const dailyClaimMutation = useDailyClaim(wallet.address ?? null);
  const claimedToday = dailyClaimStatus?.claimedToday ?? false;
  const streak = dailyClaimStatus?.streak ?? rewardUser?.streak ?? 0;
  const totalXp = rewardUser?.xp ?? 0;

  useEffect(() => {
    if (!wallet.isConnected) { setIsOnRH(false); return; }
    const check = async () => {
      try {
        const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
        setIsOnRH(chainId.toLowerCase() === ACTIVE_NETWORK.chainId.toLowerCase());
      } catch { setIsOnRH(false); }
    };
    check();
    (window as any).ethereum?.on?.("chainChanged", check);
    return () => { (window as any).ethereum?.removeListener?.("chainChanged", check); };
  }, [wallet.isConnected]);

  const switchToRH = useCallback(async () => {
    setSwitchingNetwork(true);
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_NETWORK.chainId }],
      });
    } catch (switchErr: any) {
      if (switchErr.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: ACTIVE_NETWORK.chainId,
            chainName: ACTIVE_NETWORK.chainName,
            nativeCurrency: ACTIVE_NETWORK.nativeCurrency,
            rpcUrls: ACTIVE_NETWORK.rpcUrls,
            blockExplorerUrls: ACTIVE_NETWORK.blockExplorerUrls,
          }],
        });
      }
    } finally { setSwitchingNetwork(false); }
  }, []);

  const deployToken = useCallback(async () => {
    if (!wallet.isConnected) { setWalletOpen(true); return; }
    if (!isOnRH) { await switchToRH(); return; }
    const canDeploy = !!tokenName && !!tokenSymbol && !!tokenSupply;
    if (!canDeploy) return;
    setDeploying(true);
    try {
      const supply = parseUnits(tokenSupply, 18);
      const args = encodeAbiParameters(ERC20_CONSTRUCTOR_ABI, [tokenName, tokenSymbol, supply]);
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, data: ERC20_BYTECODE + args.slice(2), value: "0x0" }],
      });
      const receipt = await waitForReceipt(txHash, RH_RPC);
      const address = "0x" + receipt.contractAddress.slice(-40);
      const gasUsedWei = BigInt(receipt.gasUsed ?? "0x0") * BigInt(receipt.effectiveGasPrice ?? receipt.gasPrice ?? "0x0");
      const gasUsedEth = formatEther(gasUsedWei);
      const newToken: DeployedToken = {
        name: tokenName, symbol: tokenSymbol, supply: tokenSupply,
        address, txHash, deployedAt: Date.now(),
        network: ACTIVE_NETWORK.chainName, verifyStatus: "pending",
        imageUrl: tokenImageUrl || undefined, gasUsed: gasUsedEth,
      };
      setDeployedContracts((prev) => { const next = [newToken, ...prev]; saveContracts(next); return next; });
      setLastDeployed(newToken);
      setTokenName(""); setTokenSymbol(""); setTokenSupply("1000000"); setTokenImageUrl("");
      toast({ title: "🚀 Token deployed!" });
      verifyOnBlockscout(address, args).then((ok) => {
        setDeployedContracts((prev) => {
          const status: "verified" | "failed" = ok ? "verified" : "failed";
          const next = prev.map((t) => t.address === address ? { ...t, verifyStatus: status } : t);
          saveContracts(next); return next;
        });
        setLastDeployed((prev) => prev && prev.address === address ? { ...prev, verifyStatus: ok ? "verified" : "failed" } : prev);
        if (ok) toast({ title: "✅ Contract verified on Blockscout!" });
      });
      try { await apiRequest("POST", "/api/robinhood/stats/contract-deployed"); }
      catch {}
      if (wallet.address) {
        recordFarmAction(wallet.address, "deploy_token", ACTIVE_NETWORK.chainName, txHash);
      }
    } catch (e: any) {
      toast({ title: "Deploy failed", description: e.message, variant: "destructive" });
    } finally { setDeploying(false); }
  }, [wallet, isOnRH, switchToRH, tokenName, tokenSymbol, tokenSupply, tokenImageUrl, toast]);

  const sendGm = useCallback(async () => {
    if (!wallet.isConnected) { setWalletOpen(true); return; }
    if (!isOnRH) { await switchToRH(); return; }
    if (gmClaimed) { toast({ title: "GM already sent today!" }); return; }
    setSendingGm(true);
    try {
      const data = "0x474d"; // "GM" in UTF-8
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, to: wallet.address, value: "0x0", data }],
      });
      setGmTxHash(txHash); markGmToday(); setGmClaimed(true);
      if (wallet.address) recordFarmAction(wallet.address, "gm", ACTIVE_NETWORK.chainName, txHash);
      toast({ title: "🌅 GM sent on Robinhood Chain!" });
    } catch (e: any) {
      toast({ title: "GM failed", description: e.message, variant: "destructive" });
    } finally { setSendingGm(false); }
  }, [wallet, isOnRH, switchToRH, gmClaimed, toast]);

  const sendGn = useCallback(async () => {
    if (!wallet.isConnected) { setWalletOpen(true); return; }
    if (!isOnRH) { await switchToRH(); return; }
    if (gnClaimed) { toast({ title: "GN already sent today!" }); return; }
    setSendingGn(true);
    try {
      const data = "0x474e"; // "GN" in UTF-8
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, to: wallet.address, value: "0x0", data }],
      });
      setGnTxHash(txHash); markGnToday(); setGnClaimed(true);
      if (wallet.address) recordFarmAction(wallet.address, "gn", ACTIVE_NETWORK.chainName, txHash);
      toast({ title: "🌙 GN sent on Robinhood Chain!" });
    } catch (e: any) {
      toast({ title: "GN failed", description: e.message, variant: "destructive" });
    } finally { setSendingGn(false); }
  }, [wallet, isOnRH, switchToRH, gnClaimed, toast]);

  const claimXp = useCallback(async () => {
    if (!wallet.isConnected) { setWalletOpen(true); return; }
    if (!isOnRH) { await switchToRH(); return; }
    if (claimedToday) { toast({ title: "XP already claimed today!" }); return; }
    setClaimingXp(true);
    try {
      const data = encodeFunctionData({ abi: XP_CLAIM_ABI, functionName: "claim" });
      const valueHex = `0x${parseEther(XP_CLAIM_VALUE_ETH).toString(16)}`;
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, to: XP_CLAIM_CONTRACT, value: valueHex, data }],
      });
      setXpTxHash(txHash);
      const result = await dailyClaimMutation.mutateAsync(txHash);
      toast({ title: result.bonusAwarded ? "🎉 25 XP + 200 XP streak bonus claimed!" : "🎁 25 XP claimed on Robinhood Chain!" });
    } catch (e: any) {
      toast({ title: "XP claim failed", description: e.message, variant: "destructive" });
    } finally { setClaimingXp(false); }
  }, [wallet, isOnRH, switchToRH, claimedToday, dailyClaimMutation, toast]);

  const retryVerify = useCallback((address: string) => {
    const token = deployedContracts.find((t) => t.address === address);
    if (!token) return;
    const supply = parseUnits(token.supply, 18);
    const args = encodeAbiParameters(ERC20_CONSTRUCTOR_ABI, [token.name, token.symbol, supply]);
    setDeployedContracts((prev) => {
      const next = prev.map((t) => t.address === address ? { ...t, verifyStatus: "pending" as const } : t);
      saveContracts(next); return next;
    });
    verifyOnBlockscout(address, args).then((ok) => {
      setDeployedContracts((prev) => {
        const status: "verified" | "failed" = ok ? "verified" : "failed";
        const next = prev.map((t) => t.address === address ? { ...t, verifyStatus: status } : t);
        saveContracts(next); return next;
      });
      if (ok) toast({ title: "✅ Contract verified on Blockscout!" });
    });
  }, [deployedContracts, toast]);

  const copyToClipboard = useCallback((value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: "Copied!" });
  }, [toast]);

  const handleAddToWallet = useCallback(async (token: DeployedToken) => {
    try {
      await addTokenToWallet(token);
      toast({ title: `${token.symbol} added to wallet!` });
    } catch (e: any) {
      toast({ title: "Failed to add token", description: e.message, variant: "destructive" });
    }
  }, [toast]);

  const isConnected = wallet.isConnected;

  return (
    <div
      className="min-h-screen bg-[#000305] text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ─── Top Header ────────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4 px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-20 bg-[#000305]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 lg:gap-3">
          <img src="/figmaAssets/logo.png" alt="Robinhood" className="w-7 h-7 lg:w-8 lg:h-8" />
          <div className="leading-tight">
            <div className="text-[13px] lg:text-[15px] font-semibold text-white">Robinhood</div>
            <div className="text-[10px] text-[#0baf3d] tracking-wide">PLAYGROUND BETA</div>
          </div>
        </div>

        <DesktopNav activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-[#01160e] border border-[#02100c] rounded-[6px] px-3 py-1.5 text-[11px] text-[#0baa3b] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0baa3b]" />
            Robinhood Chain
          </button>
          <button
            onClick={() => isConnected ? wallet.disconnect() : setWalletOpen(true)}
            className="flex items-center gap-1.5 bg-[#020c0c] border border-[#024420] rounded-[6px] px-3 py-1.5 text-[11px] text-[#0a9637]"
          >
            {isConnected ? (
              <>
                <span className="w-5 h-5 rounded-full bg-[#0baa3b]/20 flex items-center justify-center text-[9px] font-mono">{wallet.address?.slice(2,4)}</span>
                {wallet.address?.slice(0,6)}…{wallet.address?.slice(-4)}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547]" />
                Connect Wallet
              </>
            )}
          </button>
        </div>
      </header>

      {/* ─── Swap / Bridge Quick Actions ───────────────────────────────────────────── */}
      <div className="px-4 pt-4 max-w-[720px] mx-auto lg:max-w-[1160px] lg:px-8 lg:pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/swap" data-testid="link-swap" className="block">
            <img src={swapButtonImg} alt="Swap tokens on Robinhood Playground" className="w-full h-auto rounded-[12px]" />
          </a>
          <a
            href="https://relay.link/bridge/robinhood"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-bridge"
            className="block"
          >
            <img src={bridgeButtonImg} alt="Bridge assets to Robinhood Playground" className="w-full h-auto rounded-[12px]" />
          </a>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────────────────────────────── */}
      <main className="px-4 pb-28 max-w-[720px] mx-auto lg:max-w-[1160px] lg:px-8 lg:pb-16">
        {activeTab === "dashboard" && (
          <DashboardView
            isConnected={isConnected}
            isOnRH={isOnRH}
            balance={wallet.balance}
            chainName={ACTIVE_NETWORK.chainName}
            tokens={deployedContracts}
            totalContractsDeployed={totalContractsDeployed}
            gmClaimed={gmClaimed}
            gnClaimed={gnClaimed}
            claimedToday={claimedToday}
            streak={streak}
            totalXp={totalXp}
            onNavigate={setActiveTab}
            switchToRH={switchToRH}
            switchingNetwork={switchingNetwork}
            explorerUrl={EXPLORER}
            sendingGm={sendingGm}
            gmTxHash={gmTxHash}
            sendGm={sendGm}
            sendingGn={sendingGn}
            gnTxHash={gnTxHash}
            sendGn={sendGn}
            claimingXp={claimingXp}
            xpTxHash={xpTxHash}
            claimXp={claimXp}
          />
        )}

        {activeTab === "contracts" && (
          <ContractsView
            tokens={deployedContracts}
            explorerUrl={EXPLORER}
            onCopy={copyToClipboard}
            onRetryVerify={retryVerify}
            onNavigate={setActiveTab}
            onAddToWallet={handleAddToWallet}
            uniswapLpUrl={buildUniswapLpUrl}
          />
        )}

        {activeTab === "deployments" && (
          <DeployView
            tokenName={tokenName}
            setTokenName={setTokenName}
            tokenSymbol={tokenSymbol}
            setTokenSymbol={setTokenSymbol}
            tokenSupply={tokenSupply}
            setTokenSupply={setTokenSupply}
            tokenImageUrl={tokenImageUrl}
            setTokenImageUrl={setTokenImageUrl}
            deploying={deploying}
            deployToken={deployToken}
            chainName={ACTIVE_NETWORK.chainName}
            isConnected={isConnected}
            isOnRH={isOnRH}
            switchToRH={switchToRH}
            switchingNetwork={switchingNetwork}
            lastDeployed={lastDeployed}
            explorerUrl={EXPLORER}
            onAddToWallet={handleAddToWallet}
            onCopy={copyToClipboard}
            uniswapLpUrl={buildUniswapLpUrl}
          />
        )}

        {activeTab === "analytics" && (
          <ExplorerView
            explorerUrl={EXPLORER}
            bridgeUrl={RH_BRIDGE}
            chainName={ACTIVE_NETWORK.chainName}
            chainId={ACTIVE_NETWORK.chainIdDecimal.toString()}
            rpcUrl={ACTIVE_NETWORK.rpcUrls[0]}
            isOnRH={isOnRH}
            switchToRH={switchToRH}
            switchingNetwork={switchingNetwork}
            onCopy={copyToClipboard}
          />
        )}

        {activeTab === "rewards" && (
          <RewardsView
            chainName={ACTIVE_NETWORK.chainName}
            explorerUrl={EXPLORER}
            claimedToday={claimedToday}
            claimingXp={claimingXp}
            xpTxHash={xpTxHash}
            claimXp={claimXp}
            streak={streak}
            totalXp={totalXp}
            isConnected={isConnected}
          />
        )}
      </main>

      {/* ─── Bottom Navigation ──────────────────────────────────────────────────────────── */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={async () => { setWalletOpen(false); await wallet.connect(); }}
      />
    </div>
  );
}
