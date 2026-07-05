import { Coins, Loader2, Zap, Info, Image as ImageIcon, Wallet, Droplets, ExternalLink, Copy, Share2, CheckCircle2 } from "lucide-react";
import type { DeployedToken } from "./types";

interface DeployViewProps {
  tokenName: string; setTokenName: (v: string) => void;
  tokenSymbol: string; setTokenSymbol: (v: string) => void;
  tokenSupply: string; setTokenSupply: (v: string) => void;
  tokenImageUrl: string; setTokenImageUrl: (v: string) => void;
  deploying: boolean; deployToken: () => void;
  chainName: string; isConnected: boolean; isOnRH: boolean;
  switchToRH: () => void; switchingNetwork: boolean;
  lastDeployed: DeployedToken | null;
  explorerUrl: string;
  onAddToWallet: (token: DeployedToken) => void;
  onCopy: (value: string) => void;
  uniswapLpUrl: (address: string) => string;
}

export function DeployView({
  tokenName, setTokenName, tokenSymbol, setTokenSymbol, tokenSupply, setTokenSupply,
  tokenImageUrl, setTokenImageUrl,
  deploying, deployToken, chainName, isConnected, isOnRH, switchToRH, switchingNetwork,
  lastDeployed, explorerUrl, onAddToWallet, onCopy, uniswapLpUrl,
}: DeployViewProps) {
  const canDeploy = !!tokenName && !!tokenSymbol && !!tokenSupply;

  return (
    <div className="flex flex-col gap-5 pt-2 max-w-[640px]">
      <h2 className="text-[16px] font-semibold text-white">Deploy Contract</h2>

      <div className="bg-[#00090b] border border-[#081312] rounded-[8px] p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[8px] bg-[#0baa3b]/10 border border-[#0baa3b]/20 flex items-center justify-center">
            <Coins size={18} className="text-[#0baa3b]" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-white">Create ERC-20 Token</h3>
            <p className="text-[11px] text-[#63666a]">Deploy to {chainName} Mainnet</p>
          </div>
        </div>

        {isConnected && !isOnRH && (
          <div className="flex items-center gap-3 rounded-[8px] border border-[#FFB547]/20 bg-[#FFB547]/[0.06] px-4 py-3 mb-4">
            <Info size={15} className="text-[#FFB547] flex-shrink-0" />
            <span className="text-[#FFB547]/90 text-[12px]">You're not on {chainName}.</span>
            <button onClick={switchToRH} disabled={switchingNetwork} className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#0baa3b] transition-colors whitespace-nowrap">
              {switchingNetwork && <Loader2 size={11} className="animate-spin" />}Switch Network
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-medium text-[#63666a] uppercase tracking-wider mb-1 block">Token Name</label>
            <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="e.g. My Token" data-testid="input-token-name"
              className="w-full bg-[#000305] border border-[#081312] focus:border-[#0baa3b]/50 rounded-[8px] px-3 py-2.5 text-white text-[13px] outline-none transition-all placeholder:text-[#63666a]" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-[#63666a] uppercase tracking-wider mb-1 block">Token Symbol</label>
            <input type="text" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value.toUpperCase().slice(0, 8))} placeholder="e.g. MTK" data-testid="input-token-symbol"
              className="w-full bg-[#000305] border border-[#081312] focus:border-[#0baa3b]/50 rounded-[8px] px-3 py-2.5 text-white text-[13px] outline-none transition-all placeholder:text-[#63666a]" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-[#63666a] uppercase tracking-wider mb-1 block">Initial Supply</label>
            <input type="number" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="1000000" data-testid="input-token-supply"
              className="w-full bg-[#000305] border border-[#081312] focus:border-[#0baa3b]/50 rounded-[8px] px-3 py-2.5 text-white text-[13px] outline-none transition-all placeholder:text-[#63666a]" />
            <p className="text-[10px] text-[#63666a] mt-1">Decimals: 18 (standard ERC-20)</p>
          </div>
          <div>
            <label className="text-[10px] font-medium text-[#63666a] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ImageIcon size={11} /> Token Image URL <span className="normal-case text-[#3a3d40]">(optional)</span>
            </label>
            <input type="url" value={tokenImageUrl} onChange={(e) => setTokenImageUrl(e.target.value)} placeholder="https://example.com/token-logo.png" data-testid="input-token-image-url"
              className="w-full bg-[#000305] border border-[#081312] focus:border-[#0baa3b]/50 rounded-[8px] px-3 py-2.5 text-white text-[13px] outline-none transition-all placeholder:text-[#63666a]" />
            {tokenImageUrl && (
              <div className="flex items-center gap-2 mt-2">
                <img src={tokenImageUrl} alt="Token preview" className="w-8 h-8 rounded-full object-cover border border-[#081312]" onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }} />
                <span className="text-[10px] text-[#63666a]">Preview</span>
              </div>
            )}
          </div>

          <button onClick={deployToken} disabled={deploying || !canDeploy} data-testid="button-deploy-token"
            className="w-full flex items-center justify-center gap-2 bg-[#0baa3b] hover:bg-[#46D67B] disabled:opacity-40 text-[#000305] font-semibold text-[13px] h-[44px] rounded-[8px] transition-colors mt-1">
            {deploying ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {deploying ? "Deploying…" : "Deploy Token"}
          </button>
        </div>
      </div>

      {lastDeployed && (
        <div className="bg-[#00090b] border border-[#0baa3b]/25 rounded-[8px] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#0baa3b]/10 border border-[#0baa3b]/20 flex items-center justify-center overflow-hidden">
              {lastDeployed.imageUrl ? (
                <img src={lastDeployed.imageUrl} alt={lastDeployed.symbol} className="w-full h-full object-cover" />
              ) : (
                <CheckCircle2 size={18} className="text-[#0baa3b]" />
              )}
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-white">{lastDeployed.name} ({lastDeployed.symbol}) deployed!</h3>
              <p className="text-[11px] text-[#63666a] font-mono">{lastDeployed.address.slice(0,8)}…{lastDeployed.address.slice(-6)}</p>
            </div>
          </div>

          <p className="text-[11px] text-[#63666a] mb-3">What's next for your token:</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onAddToWallet(lastDeployed)} data-testid="button-add-to-wallet"
              className="flex items-center gap-2 bg-[#020c0c] border border-[#024420] hover:border-[#0baa3b] rounded-[8px] px-3 py-2.5 text-[12px] text-[#0a9637] font-medium transition-colors">
              <Wallet size={14} /> Add to Wallet
            </button>
            <a href={uniswapLpUrl(lastDeployed.address)} target="_blank" rel="noopener noreferrer" data-testid="link-add-lp-uniswap"
              className="flex items-center gap-2 bg-[#020c0c] border border-[#024420] hover:border-[#0baa3b] rounded-[8px] px-3 py-2.5 text-[12px] text-[#0a9637] font-medium transition-colors">
              <Droplets size={14} /> Add LP on Uniswap
            </a>
            <a href={`${explorerUrl}/address/${lastDeployed.address}`} target="_blank" rel="noopener noreferrer" data-testid="link-view-explorer"
              className="flex items-center gap-2 bg-[#020c0c] border border-[#024420] hover:border-[#0baa3b] rounded-[8px] px-3 py-2.5 text-[12px] text-[#0a9637] font-medium transition-colors">
              <ExternalLink size={14} /> View on Explorer
            </a>
            <button onClick={() => onCopy(lastDeployed.address)} data-testid="button-copy-address"
              className="flex items-center gap-2 bg-[#020c0c] border border-[#024420] hover:border-[#0baa3b] rounded-[8px] px-3 py-2.5 text-[12px] text-[#0a9637] font-medium transition-colors">
              <Copy size={14} /> Copy Address
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just deployed ${lastDeployed.name} (${lastDeployed.symbol}) on ${chainName}! 🚀`)}`}
              target="_blank" rel="noopener noreferrer" data-testid="link-share-x"
              className="flex items-center gap-2 bg-[#020c0c] border border-[#024420] hover:border-[#0baa3b] rounded-[8px] px-3 py-2.5 text-[12px] text-[#0a9637] font-medium transition-colors col-span-2"
            >
              <Share2 size={14} /> Share on X
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
