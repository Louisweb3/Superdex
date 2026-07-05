import {
  Globe,
  Zap,
  Info,
  RefreshCw,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
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

export function ExplorerView({
  explorerUrl,
  bridgeUrl,
  chainName,
  chainId,
  rpcUrl,
  isOnRH,
  switchToRH,
  switchingNetwork,
  onCopy,
}: ExplorerViewProps) {
  const cards = [
    {
      title: "Block Explorer",
      desc: "Browse transactions, blocks, addresses, and contracts",
      href: explorerUrl,
      icon: Globe,
      cta: "Open Explorer",
    },
    {
      title: "Bridge to RH Chain",
      desc: "Bridge ETH from Base or Ethereum to Robinhood Chain Mainnet",
      href: bridgeUrl,
      icon: Zap,
      cta: "Open Bridge",
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
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[20px] font-semibold text-[var(--rh-text)]">
        Explore Robinhood Chain
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ title, desc, href, icon: Icon, cta }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col"
          >
            <GlassCard hoverable className="p-5 h-full flex flex-col">
              <div className="w-10 h-10 rounded-[12px] bg-[#5AE4A8]/10 border border-[#5AE4A8]/20 flex items-center justify-center mb-4 group-hover:bg-[#5AE4A8]/20 transition-all">
                <Icon size={18} className="text-[#5AE4A8]" />
              </div>
              <div className="font-semibold text-[15px] text-[var(--rh-text)] mb-1">
                {title}
              </div>
              <div className="text-[12px] text-[var(--rh-text-secondary)] leading-relaxed flex-1">
                {desc}
              </div>
              <div className="flex items-center gap-1 mt-4 text-[12px] font-medium text-[#5AE4A8] group-hover:gap-2 transition-all">
                {cta}
                <ChevronRight size={13} />
              </div>
            </GlassCard>
          </a>
        ))}
      </div>

      <GlassCard className="p-5">
        <h3 className="text-[14px] font-semibold text-[var(--rh-text)] mb-4">
          Add to MetaMask / Any EVM Wallet
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Network Name", value: chainName },
            { label: "Chain ID", value: chainId },
            { label: "RPC URL", value: rpcUrl },
            { label: "Currency", value: "ETH" },
            { label: "Explorer", value: explorerUrl },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--rh-muted)]">
                {label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--rh-text-tertiary)] font-mono break-all">
                  {value}
                </span>
                <button
                  onClick={() => onCopy(value)}
                  className="text-[var(--rh-muted)] hover:text-[#5AE4A8] transition-colors flex-shrink-0"
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
          className="mt-5 flex items-center gap-2 bg-gradient-to-br from-[#5AE4A8] to-[#46D67B] hover:brightness-110 disabled:opacity-50 text-[#05070A] font-semibold text-[13px] px-5 h-[42px] rounded-[12px] transition-all duration-200"
        >
          {switchingNetwork && <Loader2 size={13} className="animate-spin" />}
          {isOnRH
            ? "✓ Already on Robinhood Chain"
            : "Add Robinhood Chain to Wallet"}
        </button>
      </GlassCard>
    </div>
  );
}
