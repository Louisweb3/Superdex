import { Globe, Zap, Info, RefreshCw, ChevronRight, Copy, Loader2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { RobinhoodLogo } from "./RobinhoodLogo";

interface ExplorerViewProps {
  explorerUrl: string;
  bridgeUrl: string;
  chainName: string;
  chainId: string;
  rpcUrl: string;
  isOnRH: boolean;
  switchToRH: () => void;
  switchingNetwork: boolean;
  onCopy: (value: string) => void;
}

export function ExplorerView({ explorerUrl, bridgeUrl, chainName, chainId, rpcUrl, isOnRH, switchToRH, switchingNetwork, onCopy }: ExplorerViewProps) {
  const cards = [
    { title: "Block Explorer", desc: "Browse transactions, blocks, and contracts", href: explorerUrl, icon: Globe, cta: "Open Explorer" },
    { title: "Bridge to RH Chain", desc: "Bridge ETH from Base or Ethereum", href: bridgeUrl, icon: Zap, cta: "Open Bridge" },
    { title: "Official Docs", desc: "Full documentation for building on RH Chain", href: "https://docs.robinhood.com/chain/", icon: Info, cta: "Read Docs" },
    { title: "Deploy Guide", desc: "Step-by-step Foundry deployment tutorial", href: "https://docs.robinhood.com/chain/deploy-smart-contracts/", icon: Zap, cta: "Deploy with Foundry" },
    { title: "Network Info", desc: "RPC endpoints, chain IDs, and details", href: "https://docs.robinhood.com/chain/connecting/", icon: RefreshCw, cta: "View Network Details" },
    { title: "Robinhood Chain", desc: "Main hub — about the chain & ecosystem", href: "https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/", icon: () => <RobinhoodLogo size={20} />, cta: "Visit robinhood.com" },
  ];

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h2 className="text-[16px] font-semibold text-white">Explore {chainName}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(({ title, desc, href, icon: Icon, cta }) => (
          <a key={title} href={href} target="_blank" rel="noopener noreferrer" className="group">
            <GlassCard hoverable className="p-4 h-full flex flex-col">
              <div className="w-8 h-8 rounded-[8px] bg-[#0baa3b]/10 border border-[#0baa3b]/20 flex items-center justify-center mb-3 group-hover:bg-[#0baa3b]/20 transition-all">
                <Icon size={16} className="text-[#0baa3b]" />
              </div>
              <div className="font-semibold text-[13px] text-white mb-1">{title}</div>
              <div className="text-[11px] text-[#63666a] leading-relaxed flex-1">{desc}</div>
              <div className="flex items-center gap-1 mt-3 text-[11px] font-medium text-[#0baa3b] group-hover:gap-2 transition-all">
                {cta}<ChevronRight size={12} />
              </div>
            </GlassCard>
          </a>
        ))}
      </div>

      <GlassCard className="p-4">
        <h3 className="text-[13px] font-semibold text-white mb-3">Add to MetaMask / EVM Wallet</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ label: "Network Name", value: chainName }, { label: "Chain ID", value: chainId }, { label: "RPC URL", value: rpcUrl }, { label: "Currency", value: "ETH" }, { label: "Explorer", value: explorerUrl }].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#63666a]">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#c2c4c5] font-mono break-all">{value}</span>
                <button onClick={() => onCopy(value)} className="text-[#63666a] hover:text-[#0baa3b] transition-colors flex-shrink-0"><Copy size={10} /></button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={switchToRH} disabled={switchingNetwork || isOnRH}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-[#0baa3b] hover:bg-[#46D67B] disabled:opacity-50 text-[#000305] font-semibold text-[13px] h-[40px] rounded-[8px] transition-colors">
          {switchingNetwork && <Loader2 size={13} className="animate-spin" />}
          {isOnRH ? "✓ Already on Robinhood Chain" : "Add Robinhood Chain to Wallet"}
        </button>
      </GlassCard>
    </div>
  );
}
