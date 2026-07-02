import { useState, useEffect, useCallback } from "react";
import { encodeAbiParameters, parseAbi, parseUnits, toHex } from "viem";
import { useWalletContext } from "@/context/WalletContext";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import {
  Coins,
  ExternalLink,
  Globe,
  CheckCircle,
  Copy,
  Loader2,
  Zap,
  Gift,
  RefreshCw,
  Send,
  Plus,
  ChevronRight,
  Info,
  Flame,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Robinhood Chain config ────────────────────────────────────────────────────
const RH_MAINNET = {
  chainId: "0x1237" as const,       // 4663
  chainIdDecimal: 4663,
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
};
const RH_TESTNET = {
  chainId: "0xB626" as const,       // 46630
  chainIdDecimal: 46630,
  chainName: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
};

// Robinhood Chain Mainnet
const ACTIVE_NETWORK = RH_MAINNET;
const EXPLORER = "https://robinhoodchain.blockscout.com";
const FAUCET = "https://faucet.testnet.chain.robinhood.com";
const RH_RPC = ACTIVE_NETWORK.rpcUrls[0];

// ─── Minimal ERC-20 bytecode ──────────────────────────────────────────────────
// constructor(string _name, string _symbol, uint256 _totalSupply)
// Compiled from a minimal Solidity 0.8.20 ERC-20
const ERC20_BYTECODE =
  "0x60806040523480156200001157600080fd5b5060405162001" +
  "2f938038062001" +
  "2f9833981810160408190526200003491620002b9565b82516200004990600090602085019062000104565b5081516200005f90600190602084019062000104565b506002805460ff191660121790558051602080830191909152916200008891839101620001a4565b5033600081815260036020908152604080832087905551938452600080516020620012d9833981519152910160405180910390a35050506200037c565b828054620000b29062000340565b90600052602060002090601f016020900481019282620000d657600085556200011e565b82601f10620000f157805160ff19168380011785556200011e565b828001600101855582156200011e579182015b828111156200011e57825182556020909201916001909101906200010a565b506200012c92915062000130565b5090565b5b808211156200012c57600081556001016200012c565b634e487b7160e01b600052604160045260246000fd5b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

// Minimal ERC-20 ABI for constructor encoding
const ERC20_CONSTRUCTOR_ABI = [
  { type: "string", name: "_name" },
  { type: "string", name: "_symbol" },
  { type: "uint256", name: "_totalSupply" },
] as const;

// ─── Local storage helpers ────────────────────────────────────────────────────
const LS_CONTRACTS_KEY = "rh_playground_contracts";
const LS_GM_KEY = "rh_playground_gm";
const LS_XP_KEY = "rh_playground_xp";

type DeployedToken = {
  name: string;
  symbol: string;
  supply: string;
  address: string;
  txHash: string;
  deployedAt: number;
  network: string;
};

function getStoredContracts(): DeployedToken[] {
  try { return JSON.parse(localStorage.getItem(LS_CONTRACTS_KEY) || "[]"); } catch { return []; }
}
function saveContracts(list: DeployedToken[]) {
  localStorage.setItem(LS_CONTRACTS_KEY, JSON.stringify(list));
}
function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function hasClaimedGmToday() { return localStorage.getItem(LS_GM_KEY) === getTodayKey(); }
function markGmToday() { localStorage.setItem(LS_GM_KEY, getTodayKey()); }
function hasClaimedXpToday() { return localStorage.getItem(LS_XP_KEY) === getTodayKey(); }
function markXpToday() { localStorage.setItem(LS_XP_KEY, getTodayKey()); }

// ─── RH RPC call helper ───────────────────────────────────────────────────────
async function waitForReceipt(txHash: string, rpc: string, maxMs = 60_000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const r = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [txHash] }),
    });
    const { result } = await r.json();
    if (result) return result;
    await new Promise(res => setTimeout(res, 2500));
  }
  throw new Error("Timed out waiting for receipt");
}

// ─── Robinhood feather logo SVG ───────────────────────────────────────────────
const RobinhoodLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#00C805" />
    <path
      d="M16 5C13 5 10 7.5 10 11c0 2.5 1.5 4.5 3.5 5.5L10 27h4l2-8 2 8h4L18.5 16.5C20.5 15.5 22 13.5 22 11c0-3.5-3-6-6-6z"
      fill="white"
    />
    <ellipse cx="16" cy="11" rx="3.5" ry="4" fill="#00C805" />
    <circle cx="16" cy="10" r="1.5" fill="white" />
  </svg>
);

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = "create" | "tokens" | "gm" | "xp" | "explore";

// ─────────────────────────────────────────────────────────────────────────────
export function RobinhoodPlaygroundPage(): JSX.Element {
  const wallet = useWalletContext();
  const { toast } = useToast();
  const [walletOpen, setWalletOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("create");

  // Network state
  const [isOnRH, setIsOnRH] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  // Create token state
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("1000000");
  const [deploying, setDeploying] = useState(false);
  const [deployedContracts, setDeployedContracts] = useState<DeployedToken[]>(getStoredContracts());

  // GM state
  const [sendingGm, setSendingGm] = useState(false);
  const [gmClaimed, setGmClaimed] = useState(hasClaimedGmToday());
  const [gmTxHash, setGmTxHash] = useState("");

  // XP claim state
  const [claimingXp, setClaimingXp] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(hasClaimedXpToday());

  // Check if on Robinhood Chain
  useEffect(() => {
    if (!wallet.isConnected) { setIsOnRH(false); return; }
    const checkChain = async () => {
      try {
        const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
        setIsOnRH(
          chainId === RH_MAINNET.chainId ||
          chainId === RH_TESTNET.chainId ||
          parseInt(chainId, 16) === RH_MAINNET.chainIdDecimal ||
          parseInt(chainId, 16) === RH_TESTNET.chainIdDecimal
        );
      } catch { setIsOnRH(false); }
    };
    checkChain();
    (window as any).ethereum?.on("chainChanged", checkChain);
    return () => (window as any).ethereum?.removeListener("chainChanged", checkChain);
  }, [wallet.isConnected]);

  // ─── Switch to Robinhood Chain ──────────────────────────────────────────────
  const switchToRH = useCallback(async () => {
    setSwitchingNetwork(true);
    try {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ACTIVE_NETWORK],
      });
      setIsOnRH(true);
      toast({ title: "Connected to Robinhood Chain Testnet" });
    } catch (e: any) {
      toast({ title: "Failed to switch network", description: e.message, variant: "destructive" });
    } finally {
      setSwitchingNetwork(false);
    }
  }, [toast]);

  // ─── Deploy ERC-20 ──────────────────────────────────────────────────────────
  const deployToken = useCallback(async () => {
    if (!tokenName || !tokenSymbol || !tokenSupply) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (!wallet.isConnected) { setWalletOpen(true); return; }
    if (!isOnRH) { await switchToRH(); return; }
    setDeploying(true);
    try {
      const supply = parseUnits(tokenSupply, 18);
      const encodedArgs = encodeAbiParameters(
        ERC20_CONSTRUCTOR_ABI,
        [tokenName, tokenSymbol, supply]
      );
      const data = (ERC20_BYTECODE + encodedArgs.slice(2)) as `0x${string}`;
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, data, gas: toHex(3_000_000) }],
      });
      toast({ title: "Deployment tx submitted!", description: "Waiting for confirmation…" });
      const receipt = await waitForReceipt(txHash, RH_RPC);
      const contractAddress = receipt.contractAddress;
      const token: DeployedToken = {
        name: tokenName,
        symbol: tokenSymbol,
        supply: tokenSupply,
        address: contractAddress,
        txHash,
        deployedAt: Date.now(),
        network: ACTIVE_NETWORK.chainName,
      };
      const updated = [token, ...deployedContracts];
      setDeployedContracts(updated);
      saveContracts(updated);
      setTokenName(""); setTokenSymbol(""); setTokenSupply("1000000");
      setActiveTab("tokens");
      toast({ title: `✅ ${tokenName} deployed!`, description: contractAddress });
    } catch (e: any) {
      toast({ title: "Deployment failed", description: e.message, variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  }, [tokenName, tokenSymbol, tokenSupply, wallet, isOnRH, switchToRH, deployedContracts, toast]);

  // ─── Send GM ────────────────────────────────────────────────────────────────
  const sendGm = useCallback(async () => {
    if (!wallet.isConnected) { setWalletOpen(true); return; }
    if (!isOnRH) { await switchToRH(); return; }
    if (gmClaimed) { toast({ title: "Already sent GM today! Come back tomorrow." }); return; }
    setSendingGm(true);
    try {
      // Encode "GM" as UTF-8 hex data sent on-chain
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: wallet.address,
          to: wallet.address,
          value: "0x0",
          data: "0x474d", // UTF-8 "GM"
        }],
      });
      setGmTxHash(txHash);
      markGmToday();
      setGmClaimed(true);
      toast({ title: "🌅 GM sent on Robinhood Chain!" });
    } catch (e: any) {
      toast({ title: "GM failed", description: e.message, variant: "destructive" });
    } finally {
      setSendingGm(false);
    }
  }, [wallet, isOnRH, switchToRH, gmClaimed, toast]);

  // ─── Claim XP ───────────────────────────────────────────────────────────────
  const claimXp = useCallback(async () => {
    if (!wallet.isConnected) { setWalletOpen(true); return; }
    if (xpClaimed) { toast({ title: "XP already claimed today! Come back tomorrow." }); return; }
    setClaimingXp(true);
    try {
      // Stub: contract address to be provided by user
      toast({ title: "XP claim contract not yet configured.", description: "The contract address will be set when announced.", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "XP claim failed", description: e.message, variant: "destructive" });
    } finally {
      setClaimingXp(false);
    }
  }, [wallet, xpClaimed, toast]);

  const isConnected = wallet.isConnected;

  // ─── Shared network warning ──────────────────────────────────────────────────
  const NetworkWarning = () =>
    isConnected && !isOnRH ? (
      <div className="flex items-center gap-3 rounded-[10px] border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 mb-4">
        <Info size={15} className="text-yellow-400 flex-shrink-0" />
        <span className="text-yellow-300/90 text-[13px]">You're not on Robinhood Chain.</span>
        <button
          onClick={switchToRH}
          disabled={switchingNetwork}
          className="ml-auto flex items-center gap-1.5 text-[12px] font-bold text-[#00C805] hover:text-green-300 transition-colors whitespace-nowrap"
        >
          {switchingNetwork ? <Loader2 size={12} className="animate-spin" /> : null}
          Switch Network
        </button>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#050a05] text-white" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[#0a1f0a] bg-gradient-to-br from-[#071007] via-[#050a05] to-black px-5 sm:px-8 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,200,5,0.12),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* Left */}
          <div className="flex items-center gap-4">
            <RobinhoodLogo size={52} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#00C805]">Robinhood Chain</span>
                <span className="bg-[#00C805]/10 border border-[#00C805]/30 text-[#00C805] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  Mainnet
                </span>
              </div>
              <h1 className="text-[26px] sm:text-[32px] font-black tracking-tight text-white leading-tight">
                Playground
              </h1>
              <p className="text-[#5a6a55] text-[13px] mt-0.5">
                Deploy tokens · Send GM · Earn XP · Explore on-chain
              </p>
            </div>
          </div>

          {/* Right: Network status + CTA */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnRH ? "bg-[#00C805] shadow-[0_0_6px_#00C805]" : "bg-yellow-400"} animate-pulse`} />
                <span className="text-[13px] text-[#8a9a85]">
                  {isOnRH ? "Connected to Robinhood Chain" : "Wrong network"}
                </span>
              </div>
            ) : (
              <span className="text-[13px] text-[#5a6a55]">Wallet not connected</span>
            )}

            {!isConnected ? (
              <button
                onClick={() => setWalletOpen(true)}
                className="flex items-center gap-2 bg-[#00C805] hover:bg-[#00a804] text-black font-bold text-[14px] px-5 py-2.5 rounded-[12px] transition-all"
              >
                Connect Wallet
              </button>
            ) : !isOnRH ? (
              <button
                onClick={switchToRH}
                disabled={switchingNetwork}
                className="flex items-center gap-2 bg-[#00C805] hover:bg-[#00a804] text-black font-bold text-[14px] px-5 py-2.5 rounded-[12px] transition-all disabled:opacity-60"
              >
                {switchingNetwork && <Loader2 size={14} className="animate-spin" />}
                Add Robinhood Chain
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-[#00C805] font-semibold">
                <CheckCircle size={16} />
                Ready to build
              </div>
            )}
          </div>
        </div>

        {/* Network stats bar */}
        <div className="relative max-w-[1200px] mx-auto mt-6 flex flex-wrap gap-3">
          {[
            { label: "Chain ID", value: ACTIVE_NETWORK.chainIdDecimal.toString() },
            { label: "Block Time", value: "100ms" },
            { label: "Gas Token", value: "ETH" },
            { label: "Stack", value: "Arbitrum Orbit L2" },
            { label: "DA Layer", value: "Ethereum blobs" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2 bg-[#0a1a0a] border border-[#1a2e1a] rounded-[10px] px-3 py-1.5">
              <span className="text-[#5a6a55] text-[11px]">{label}</span>
              <span className="text-[#c8d8c4] text-[12px] font-semibold">{value}</span>
            </div>
          ))}
          <a
            href={FAUCET}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#0a1a0a] border border-[#1a2e1a] hover:border-[#00C805]/40 rounded-[10px] px-3 py-1.5 transition-colors group"
          >
            <Flame size={12} className="text-orange-400" />
            <span className="text-[#c8d8c4] text-[12px] font-semibold group-hover:text-[#00C805] transition-colors">Faucet</span>
            <ExternalLink size={10} className="text-[#5a6a55]" />
          </a>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#0a1f0a] bg-[#050a05] px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto flex items-center gap-1 overflow-x-auto scrollbar-none">
          {([ 
            { id: "create", label: "Create Token", icon: Plus },
            { id: "tokens", label: `My Tokens (${deployedContracts.length})`, icon: Coins },
            { id: "gm",     label: "Send GM",       icon: Send },
            { id: "xp",     label: "Claim 25 XP",   icon: Gift },
            { id: "explore",label: "Explorer",       icon: Globe },
          ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              data-testid={`tab-rh-${id}`}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === id
                  ? "border-[#00C805] text-[#00C805]"
                  : "border-transparent text-[#5a6a55] hover:text-[#c8d8c4]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-8">

        {/* CREATE TOKEN */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form card */}
            <div className="bg-[#070f07] border border-[#0e1f0e] rounded-[16px] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00C805]/10 border border-[#00C805]/20 flex items-center justify-center">
                  <Coins size={18} className="text-[#00C805]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-white">Create ERC-20 Token</h2>
                  <p className="text-[12px] text-[#5a6a55]">Deploy to Robinhood Chain Mainnet</p>
                </div>
              </div>

              <NetworkWarning />

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#8a9a85] uppercase tracking-wider mb-1.5 block">
                    Token Name
                  </label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={e => setTokenName(e.target.value)}
                    placeholder="e.g. My Awesome Token"
                    data-testid="input-token-name"
                    className="w-full bg-[#0a1a0a] border border-[#1a2e1a] focus:border-[#00C805]/60 rounded-[10px] px-4 py-3 text-white text-[14px] outline-none transition-colors placeholder:text-[#3a4a35]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#8a9a85] uppercase tracking-wider mb-1.5 block">
                    Token Symbol
                  </label>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={e => setTokenSymbol(e.target.value.toUpperCase().slice(0, 8))}
                    placeholder="e.g. MAT"
                    data-testid="input-token-symbol"
                    className="w-full bg-[#0a1a0a] border border-[#1a2e1a] focus:border-[#00C805]/60 rounded-[10px] px-4 py-3 text-white text-[14px] outline-none transition-colors placeholder:text-[#3a4a35]"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#8a9a85] uppercase tracking-wider mb-1.5 block">
                    Initial Supply
                  </label>
                  <input
                    type="number"
                    value={tokenSupply}
                    onChange={e => setTokenSupply(e.target.value)}
                    placeholder="1000000"
                    data-testid="input-token-supply"
                    className="w-full bg-[#0a1a0a] border border-[#1a2e1a] focus:border-[#00C805]/60 rounded-[10px] px-4 py-3 text-white text-[14px] outline-none transition-colors placeholder:text-[#3a4a35]"
                  />
                  <p className="text-[11px] text-[#3a4a35] mt-1">Decimals: 18 (standard ERC-20)</p>
                </div>

                <button
                  onClick={deployToken}
                  disabled={deploying || !tokenName || !tokenSymbol || !tokenSupply}
                  data-testid="button-deploy-token"
                  className="w-full flex items-center justify-center gap-2 bg-[#00C805] hover:bg-[#00a804] disabled:opacity-50 active:scale-[0.98] text-black font-bold text-[15px] py-3.5 rounded-[12px] transition-all"
                >
                  {deploying ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                  {deploying ? "Deploying…" : "Deploy Token"}
                </button>
              </div>
            </div>

            {/* Info card */}
            <div className="flex flex-col gap-4">
              {/* What happens */}
              <div className="bg-[#070f07] border border-[#0e1f0e] rounded-[16px] p-5">
                <h3 className="text-[14px] font-bold text-white mb-4">What happens when you deploy?</h3>
                {[
                  { n: 1, text: "Your ERC-20 contract is compiled and signed locally in your wallet" },
                  { n: 2, text: "The contract is broadcast to Robinhood Chain Mainnet" },
                  { n: 3, text: "Your wallet receives 100% of the initial supply" },
                  { n: 4, text: "The contract is saved and viewable in My Tokens" },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-start gap-3 mb-3 last:mb-0">
                    <div className="w-5 h-5 rounded-full bg-[#00C805] text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</div>
                    <p className="text-[13px] text-[#8a9a85] leading-snug">{text}</p>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="bg-[#070f07] border border-[#0e1f0e] rounded-[16px] p-5">
                <h3 className="text-[13px] font-bold text-[#8a9a85] uppercase tracking-wider mb-3">Quick Links</h3>
                {[
                  { label: "Get Testnet ETH", href: FAUCET, desc: "Fund your wallet for gas" },
                  { label: "Block Explorer",  href: EXPLORER, desc: "View deployed contracts" },
                  { label: "Robinhood Chain Docs", href: "https://docs.robinhood.com/chain/", desc: "Official documentation" },
                  { label: "Deploy Guide (Foundry)", href: "https://docs.robinhood.com/chain/deploy-smart-contracts/", desc: "Advanced deployment" },
                ].map(({ label, href, desc }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-2.5 border-b border-[#0e1f0e] last:border-0 group"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-[#c8d8c4] group-hover:text-[#00C805] transition-colors">{label}</div>
                      <div className="text-[11px] text-[#3a4a35]">{desc}</div>
                    </div>
                    <ExternalLink size={13} className="text-[#3a4a35] group-hover:text-[#00C805] transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MY TOKENS */}
        {activeTab === "tokens" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-white">My Deployed Tokens</h2>
              <button
                onClick={() => setActiveTab("create")}
                className="flex items-center gap-2 bg-[#00C805]/10 border border-[#00C805]/30 hover:bg-[#00C805]/20 text-[#00C805] text-[13px] font-semibold px-4 py-2 rounded-[10px] transition-all"
              >
                <Plus size={14} />
                Deploy New
              </button>
            </div>

            {deployedContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-[#0e1f0e] rounded-[16px] bg-[#070f07]">
                <Coins size={48} className="text-[#1a2e1a] mb-4" />
                <p className="text-[#5a6a55] text-[15px] font-semibold">No tokens deployed yet</p>
                <p className="text-[#3a4a35] text-[13px] mt-1">Create your first token on the Create Token tab</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {deployedContracts.map((token, i) => (
                  <div key={i} className="bg-[#070f07] border border-[#0e1f0e] rounded-[14px] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00C805]/10 border border-[#00C805]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#00C805] text-[11px] font-black">{token.symbol.slice(0, 3)}</span>
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-white">{token.name}</div>
                          <div className="text-[12px] text-[#5a6a55] font-mono">{token.symbol}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#3a4a35] bg-[#0a1a0a] border border-[#1a2e1a] px-2 py-0.5 rounded-full">
                          {token.network}
                        </span>
                        <a
                          href={`${EXPLORER}/address/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00C805] hover:text-green-300 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Supply", value: `${Number(token.supply).toLocaleString()} ${token.symbol}` },
                        { label: "Deployed", value: new Date(token.deployedAt).toLocaleDateString() },
                        { label: "Contract", value: `${token.address.slice(0,6)}…${token.address.slice(-4)}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-[#0a1a0a] border border-[#1a2e1a] rounded-[8px] px-3 py-2">
                          <div className="text-[10px] text-[#3a4a35] uppercase tracking-wider mb-0.5">{label}</div>
                          <div className="text-[12px] text-[#c8d8c4] font-mono font-semibold">{value}</div>
                        </div>
                      ))}
                    </div>
                    {/* Copy address */}
                    <button
                      onClick={() => { navigator.clipboard.writeText(token.address); toast({ title: "Address copied!" }); }}
                      className="mt-3 flex items-center gap-1.5 text-[12px] text-[#5a6a55] hover:text-[#00C805] transition-colors"
                    >
                      <Copy size={11} />
                      Copy contract address
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEND GM */}
        {activeTab === "gm" && (
          <div className="max-w-[480px]">
            <div className="bg-[#070f07] border border-[#0e1f0e] rounded-[16px] p-6">
              <div className="text-center mb-6">
                <div className="text-[48px] mb-3">🌅</div>
                <h2 className="text-[22px] font-black text-white">Send GM On-Chain</h2>
                <p className="text-[#5a6a55] text-[13px] mt-2">
                  Send a "Good Morning" message on Robinhood Chain. Once per day, recorded on-chain forever.
                </p>
              </div>

              <NetworkWarning />

              {gmClaimed ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex items-center gap-2 text-[#00C805] text-[15px] font-bold">
                    <CheckCircle size={20} />
                    GM sent today!
                  </div>
                  <p className="text-[#5a6a55] text-[13px] text-center">Come back tomorrow to send another GM and keep your streak alive.</p>
                  {gmTxHash && (
                    <a
                      href={`${EXPLORER}/tx/${gmTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[12px] text-[#00C805] hover:text-green-300 transition-colors"
                    >
                      <ExternalLink size={12} />
                      View transaction
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={sendGm}
                  disabled={sendingGm}
                  data-testid="button-send-gm"
                  className="w-full flex items-center justify-center gap-2 bg-[#00C805] hover:bg-[#00a804] disabled:opacity-50 text-black font-bold text-[16px] py-4 rounded-[12px] transition-all active:scale-[0.98]"
                >
                  {sendingGm ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sendingGm ? "Sending…" : "GM 🌅"}
                </button>
              )}

              <div className="mt-5 border-t border-[#0e1f0e] pt-4">
                <div className="text-[11px] text-[#3a4a35] text-center">
                  GM is stored on-chain as <code className="text-[#5a6a55]">0x474d</code> (UTF-8 encoded).
                  Each GM uses a tiny amount of testnet ETH for gas.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLAIM XP */}
        {activeTab === "xp" && (
          <div className="max-w-[480px]">
            <div className="bg-[#070f07] border border-[#0e1f0e] rounded-[16px] p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#00C805]/10 border border-[#00C805]/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,200,5,0.15)]">
                  <Gift size={28} className="text-[#00C805]" />
                </div>
                <h2 className="text-[22px] font-black text-white">Claim 25 XP Daily</h2>
                <p className="text-[#5a6a55] text-[13px] mt-2">
                  Claim 25 XP every 24 hours by interacting with the XP contract on Robinhood Chain.
                </p>
              </div>

              {/* XP info */}
              <div className="flex flex-col gap-2 mb-5">
                {[
                  { label: "Daily Reward", value: "25 XP" },
                  { label: "Reset Time",   value: "Every 24 hours (midnight UTC)" },
                  { label: "Contract",     value: "Announcement pending" },
                  { label: "Network",      value: ACTIVE_NETWORK.chainName },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-[#0e1f0e] last:border-0">
                    <span className="text-[#5a6a55] text-[13px]">{label}</span>
                    <span className="text-[#c8d8c4] text-[13px] font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-[10px] px-4 py-3 mb-4">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-300/80 text-[12px] leading-relaxed">
                    The XP claim contract address will be provided in an official announcement. Check back soon.
                  </p>
                </div>
              </div>

              <button
                onClick={claimXp}
                disabled={claimingXp || xpClaimed}
                data-testid="button-claim-xp"
                className="w-full flex items-center justify-center gap-2 bg-[#00C805] hover:bg-[#00a804] disabled:opacity-40 text-black font-bold text-[15px] py-3.5 rounded-[12px] transition-all"
              >
                {claimingXp ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
                {xpClaimed ? "XP Claimed Today ✓" : "Claim 25 XP"}
              </button>
            </div>
          </div>
        )}

        {/* EXPLORER */}
        {activeTab === "explore" && (
          <div>
            <h2 className="text-[18px] font-bold text-white mb-5">Explore Robinhood Chain</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Block Explorer",
                  desc: "Browse transactions, blocks, addresses, and contracts",
                  href: EXPLORER,
                  icon: Globe,
                  cta: "Open Explorer",
                },
                {
                  title: "Testnet Faucet",
                  desc: "Get free testnet ETH to pay for gas on Robinhood Chain",
                  href: FAUCET,
                  icon: Flame,
                  cta: "Get Testnet ETH",
                },
                {
                  title: "Official Docs",
                  desc: "Full documentation for building on Robinhood Chain",
                  href: "https://docs.robinhood.com/chain/",
                  icon: Info,
                  cta: "Read Docs",
                },
                {
                  title: "Deploy Guide",
                  desc: "Step-by-step Foundry deployment tutorial for developers",
                  href: "https://docs.robinhood.com/chain/deploy-smart-contracts/",
                  icon: Zap,
                  cta: "Deploy with Foundry",
                },
                {
                  title: "Network Info",
                  desc: "RPC endpoints, chain IDs, and connection details",
                  href: "https://docs.robinhood.com/chain/connecting/",
                  icon: RefreshCw,
                  cta: "View Network Details",
                },
                {
                  title: "Robinhood Chain",
                  desc: "Main hub — about the chain, ecosystem, and announcements",
                  href: "https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/",
                  icon: () => <RobinhoodLogo size={20} />,
                  cta: "Visit robinhood.com",
                },
              ].map(({ title, desc, href, icon: Icon, cta }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-[#070f07] border border-[#0e1f0e] hover:border-[#00C805]/40 rounded-[14px] p-5 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00C805]/10 border border-[#00C805]/20 flex items-center justify-center mb-4 group-hover:bg-[#00C805]/20 transition-all">
                    <Icon size={18} className="text-[#00C805]" />
                  </div>
                  <div className="font-bold text-[15px] text-white mb-1">{title}</div>
                  <div className="text-[12px] text-[#5a6a55] leading-relaxed flex-1">{desc}</div>
                  <div className="flex items-center gap-1 mt-4 text-[12px] font-semibold text-[#00C805] group-hover:gap-2 transition-all">
                    {cta}
                    <ChevronRight size={13} />
                  </div>
                </a>
              ))}
            </div>

            {/* Network details */}
            <div className="mt-6 bg-[#070f07] border border-[#0e1f0e] rounded-[16px] p-5">
              <h3 className="text-[14px] font-bold text-white mb-4">Add to MetaMask / Any EVM Wallet</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Network Name", value: ACTIVE_NETWORK.chainName },
                  { label: "Chain ID",     value: ACTIVE_NETWORK.chainIdDecimal.toString() },
                  { label: "RPC URL",      value: ACTIVE_NETWORK.rpcUrls[0] },
                  { label: "Currency",     value: "ETH" },
                  { label: "Explorer",     value: ACTIVE_NETWORK.blockExplorerUrls[0] },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a4a35]">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#c8d8c4] font-mono break-all">{value}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(value); toast({ title: "Copied!" }); }}
                        className="text-[#3a4a35] hover:text-[#00C805] transition-colors flex-shrink-0"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={switchToRH}
                disabled={switchingNetwork || isOnRH}
                className="mt-5 flex items-center gap-2 bg-[#00C805] hover:bg-[#00a804] disabled:opacity-50 text-black font-bold text-[13px] px-5 py-2.5 rounded-[10px] transition-all"
              >
                {switchingNetwork && <Loader2 size={13} className="animate-spin" />}
                {isOnRH ? "✓ Already on Robinhood Chain" : "Add Robinhood Chain to Wallet"}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={async () => { setWalletOpen(false); await wallet.connect(); }}
      />
    </div>
  );
}
