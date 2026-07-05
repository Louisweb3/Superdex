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
  "0x608060405234801561000f575f5ffd5b506040516109be3803806109be83398101604081905261002e91610134565b5f6100398482610230565b5060016100468382610230565b506002819055335f818152600360209081526040808320859055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050506102ee565b634e487b7160e01b5f52604160045260245ffd5b5f82601f8301126100ba575f5ffd5b81516001600160401b038111156100d3576100d3610097565b604051601f8201601f19908116603f011681016001600160401b038111828210171561010157610101610097565b604052818152838201602001851015610118575f5ffd5b8160208501602083015e5f918101602001919091529392505050565b5f5f5f60608486031215610146575f5ffd5b83516001600160401b0381111561015b575f5ffd5b610167868287016100ab565b602086015190945090506001600160401b03811115610184575f5ffd5b610190868287016100ab565b925050604084015190509250925092565b600181811c908216806101b557607f821691505b6020821081036101d357634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561022b578282111561022b57805f5260205f20601f840160051c602085101561020457505f5b90810190601f840160051c035f5b81811015610227575f83820155600101610212565b5050505b505050565b81516001600160401b0381111561024957610249610097565b61025d8161025784546101a1565b846101d9565b6020601f82116001811461028f575f83156102785750848201515b5f19600385901b1c1916600184901b1784556102e7565b5f84815260208120601f198516915b828110156102be578785015182556020948501946001909201910161029e565b50848210156102db57868401515f19600387901b60f8161c191681555b505060018360011b0184555b5050505050565b6106c3806102fb5f395ff3fe608060405234801561000f575f5ffd5b5060043610610090575f3560e01c8063313ce56711610063578063313ce567146100ff57806370a082311461011957806395d89b4114610138578063a9059cbb14610140578063dd62ed3e14610153575f5ffd5b806306fdde0314610094578063095ea7b3146100b257806318160ddd146100d557806323b872dd146100ec575b5f5ffd5b61009c61017d565b6040516100a99190610518565b60405180910390f35b6100c56100c0366004610568565b610208565b60405190151581526020016100a9565b6100de60025481565b6040519081526020016100a9565b6100c56100fa366004610590565b610274565b610107601281565b60405160ff90911681526020016100a9565b6100de6101273660046105ca565b60036020525f908152604090205481565b61009c61042a565b6100c561014e366004610568565b610437565b6100de6101613660046105ea565b600460209081525f928352604080842090915290825290205481565b5f80546101899061061b565b80601f01602080910402602001604051908101604052809291908181526020018280546101b59061061b565b80156102005780601f106101d757610100808354040283529160200191610200565b820191905f5260205f20905b8154815290600101906020018083116101e357829003601f168201915b505050505081565b335f8181526004602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906102629086815260200190565b60405180910390a35060015b92915050565b6001600160a01b0383165f908152600360205260408120548211156102d75760405162461bcd60e51b8152602060048201526014602482015273696e73756666696369656e742062616c616e636560601b60448201526064015b60405180910390fd5b6001600160a01b0384165f9081526004602090815260408083203384529091529020548211156103425760405162461bcd60e51b8152602060048201526016602482015275696e73756666696369656e7420616c6c6f77616e636560501b60448201526064016102ce565b6001600160a01b0384165f9081526003602052604081208054849290610369908490610667565b90915550506001600160a01b0383165f908152600360205260408120805484929061039590849061067a565b90915550506001600160a01b0384165f908152600460209081526040808320338452909152812080548492906103cc908490610667565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161041891815260200190565b60405180910390a35060019392505050565b600180546101899061061b565b335f9081526003602052604081205482111561048c5760405162461bcd60e51b8152602060048201526014602482015273696e73756666696369656e742062616c616e636560601b60448201526064016102ce565b335f90815260036020526040812080548492906104aa908490610667565b90915550506001600160a01b0383165f90815260036020526040812080548492906104d690849061067a565b90915550506040518281526001600160a01b0384169033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90602001610262565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b80356001600160a01b0381168114610563575f5ffd5b919050565b5f5f60408385031215610579575f5ffd5b6105828361054d565b946020939093013593505050565b5f5f5f606084860312156105a2575f5ffd5b6105ab8461054d565b92506105b96020850161054d565b929592945050506040919091013590565b5f602082840312156105da575f5ffd5b6105e38261054d565b9392505050565b5f5f604083850312156105fb575f5ffd5b6106048361054d565b91506106126020840161054d565b90509250929050565b600181811c9082168061062f57607f821691505b60208210810361064d57634e487b7160e01b5f52602260045260245ffd5b50919050565b634e487b7160e01b5f52601160045260245ffd5b8181038181111561026e5761026e610653565b8082018082111561026e5761026e61065356fea2646970667358221220b2d104b4b518f8fc0d3f00fdec8c9c058f43ae1f6102dfd0cf7e103f23125f5b64736f6c63430008230033" as const;
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
async function waitForReceipt(txHash: string, rpc: string, maxMs = 90_000): Promise<any> {
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
  throw new Error("Timed out waiting for confirmation on Robinhood Chain. Check the transaction in your wallet — it may still confirm.");
}

// Confirms the tx that created the contract actually succeeded on-chain (status 0x1)
// and that a contract address was actually assigned — a reverted deployment still
// gets a receipt, so this check must happen before we treat it as "deployed".
function assertDeploySucceeded(receipt: any) {
  if (receipt.status !== "0x1") {
    throw new Error("Transaction was mined but reverted on-chain — no token was created. This is usually a gas or contract-init issue; please retry.");
  }
  if (!receipt.contractAddress) {
    throw new Error("Transaction succeeded but no contract address was returned by Robinhood Chain — the token was not created.");
  }
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
      const deployData = ERC20_BYTECODE + args.slice(2);

      // Explicitly cap gas for contract creation instead of relying on the wallet's
      // eth_estimateGas — some RPC nodes on Robinhood Chain under-estimate or fail to
      // estimate gas for CREATE txs, which silently drops the deployment before it's
      // ever broadcast. 3,000,000 gas comfortably covers this ERC-20's init code.
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, data: deployData, value: "0x0", gas: "0x2DC6C0" }],
      });
      const receipt = await waitForReceipt(txHash, RH_RPC);
      assertDeploySucceeded(receipt);
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
      <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-20 bg-[#000305]/80 backdrop-blur-md">
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0 flex-shrink-0">
          <img src="/figmaAssets/logo.png" alt="Robinhood" className="w-7 h-7 lg:w-8 lg:h-8 flex-shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="text-[13px] lg:text-[15px] font-semibold text-white whitespace-nowrap">Robinhood</div>
            <div className="text-[9px] sm:text-[10px] text-[#0baf3d] tracking-wide whitespace-nowrap">PLAYGROUND BETA</div>
          </div>
        </div>

        <DesktopNav activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button className="hidden sm:flex items-center gap-1.5 bg-[#01160e] border border-[#02100c] rounded-[6px] px-3 py-1.5 text-[11px] text-[#0baa3b] font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0baa3b] flex-shrink-0" />
            Robinhood Chain
          </button>
          <button className="flex sm:hidden items-center justify-center w-8 h-8 bg-[#01160e] border border-[#02100c] rounded-[6px] flex-shrink-0" aria-label="Robinhood Chain">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0baa3b]" />
          </button>
          <button
            onClick={() => isConnected ? wallet.disconnect() : setWalletOpen(true)}
            className="flex items-center gap-1.5 bg-[#020c0c] border border-[#024420] rounded-[6px] px-2.5 sm:px-3 py-1.5 text-[11px] text-[#0a9637] whitespace-nowrap flex-shrink-0"
          >
            {isConnected ? (
              <>
                <span className="w-5 h-5 rounded-full bg-[#0baa3b]/20 flex items-center justify-center text-[9px] font-mono flex-shrink-0">{wallet.address?.slice(2,4)}</span>
                {wallet.address?.slice(0,6)}…{wallet.address?.slice(-4)}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547] flex-shrink-0" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="inline sm:hidden">Connect</span>
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
