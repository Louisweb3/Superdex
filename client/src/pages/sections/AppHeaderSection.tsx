import { useState } from "react";
import rhLogoSrc from "@assets/unnamed_(4)_1782977968316.png";
import baseLogoSrc from "@assets/base_logo_1782978064400.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import { useWalletContext } from "@/context/WalletContext";
import {
  ExternalLink,
  LogOut,
  Wallet,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Check,
  MoreHorizontal,
} from "lucide-react";

interface AppHeaderSectionProps {
  onNavSelect?: (tab: string) => void;
  activeTab?: string;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

const DESKTOP_NAV_PRIMARY = [
  { value: "home",      label: "Home" },
  { value: "swap",      label: "Swap" },
  { value: "rewards",   label: "Rewards" },
  { value: "earn",      label: "Earn" },
  { value: "vault",     label: "Vault" },
  { value: "airdrop",   label: "Airdrop" },
  { value: "robinhood", label: "RH Playground" },
  { value: "farm", label: "Farm" },
];

const DESKTOP_NAV_MORE = [
  { value: "launch",    label: "Launch",    href: null },
  { value: "analytics", label: "Analytics", href: null },
  { value: "docs",      label: "Docs",      href: "/docs" },
];

const BASE_CHAIN_ID = 8453;
const RH_CHAIN_ID   = 4663;

// ─── Mini chain logos ─────────────────────────────────────────────────────────
const BaseLogo = ({ size = 18 }: { size?: number }) => (
  <img src={baseLogoSrc} width={size} height={size} alt="Base" style={{ borderRadius: "50%", display: "block" }} />
);

const RHLogo = ({ size = 18 }: { size?: number }) => (
  <img src={rhLogoSrc} width={size} height={size} alt="Robinhood Chain" style={{ borderRadius: "50%", display: "block" }} />
);

// ─── Network config ───────────────────────────────────────────────────────────
const NETWORKS = [
  {
    id: BASE_CHAIN_ID,
    label: "Base",
    sublabel: "Mainnet",
    logo: BaseLogo,
    color: "#0052FF",
    explorer: "https://basescan.org",
    explorerLabel: "Basescan",
  },
  {
    id: RH_CHAIN_ID,
    label: "Robinhood",
    sublabel: "Mainnet",
    logo: RHLogo,
    color: "#00C805",
    explorer: "https://robinhoodchain.blockscout.com",
    explorerLabel: "RH Explorer",
  },
];

function getNetwork(chainId: number | null) {
  return NETWORKS.find((n) => n.id === chainId) ?? null;
}

export const AppHeaderSection = ({
  onNavSelect,
  activeTab,
}: AppHeaderSectionProps): JSX.Element => {
  const [walletOpen, setWalletOpen] = useState(false);
  const wallet = useWalletContext();

  const currentNet = getNetwork(wallet.chainId);

  const handleNetworkSwitch = async (networkId: number) => {
    if (networkId === BASE_CHAIN_ID) await wallet.switchToBase();
    else if (networkId === RH_CHAIN_ID) await wallet.switchToRobinhood();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#050B12]/90 backdrop-blur-2xl">

        {/* subtle glow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

        <div className="relative mx-auto flex min-h-[72px] sm:min-h-[84px] w-full max-w-[941px] lg:max-w-[1280px] items-center px-3 sm:px-6 lg:px-8 gap-2 sm:gap-3">

          {/* LOGO */}
          <button
            onClick={() => onNavSelect?.("home")}
            className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3 focus:outline-none min-w-0"
            aria-label="SuperSwap home"
            data-testid="link-home"
          >
            <img
              className="h-8 w-6 sm:h-[47px] sm:w-[38px] object-cover flex-shrink-0"
              alt="Logo"
              src="/figmaAssets/logo.png"
            />
            <span className="flex items-center leading-none font-['Inter',Helvetica] tracking-[0] whitespace-nowrap">
              <span className="font-bold text-[#ccced2] text-[17px] sm:text-[25px]">Super</span>
              <span className="font-normal text-[#37c359] text-[19px] sm:text-[27px]">Swap</span>
            </span>
          </button>

          {/* DESKTOP NAV — flex-1 so it fills space between logo and right controls */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 min-w-0 overflow-hidden">
            {DESKTOP_NAV_PRIMARY.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onNavSelect?.(item.value)}
                data-testid={`button-desknav-${item.value}`}
                className={`px-3 py-2 rounded-[14px] text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === item.value
                    ? "bg-[#0d2218] text-[#2dae50] border border-[#1a3428]"
                    : "text-[#8b97aa] hover:text-white hover:bg-[#0a1520] border border-transparent"
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="button-desknav-more"
                  className={`flex items-center gap-1 px-3 py-2 rounded-[14px] text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                    DESKTOP_NAV_MORE.some((m) => m.value === activeTab)
                      ? "bg-[#0d2218] text-[#2dae50] border border-[#1a3428]"
                      : "text-[#8b97aa] hover:text-white hover:bg-[#0a1520] border border-transparent"
                  }`}
                >
                  More
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                sideOffset={8}
                className="w-[160px] overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#070B11]/95 p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
              >
                {DESKTOP_NAV_MORE.map((item) =>
                  item.href ? (
                    <DropdownMenuItem key={item.value} asChild>
                      <a
                        href={item.href}
                        data-testid={`button-desknav-${item.value}`}
                        className="flex items-center px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#8b97aa] hover:text-white hover:bg-[#0a1520] cursor-pointer transition-all"
                      >
                        {item.label}
                      </a>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      key={item.value}
                      onClick={() => onNavSelect?.(item.value)}
                      data-testid={`button-desknav-${item.value}`}
                      className={`flex items-center px-3 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer transition-all ${
                        activeTab === item.value
                          ? "text-[#2dae50] bg-[#0d2218]"
                          : "text-[#8b97aa] hover:text-white hover:bg-[#0a1520]"
                      }`}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* RIGHT — Network switcher + Wallet */}
          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2 min-w-0">

            {/* ── Network Switcher ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="button-network-switcher"
                  className="group flex items-center gap-1.5 sm:gap-2 rounded-[18px] border border-white/[0.06] bg-[#0B1118] px-2 sm:px-3 py-2 sm:py-2.5 transition-all duration-200 hover:border-white/[0.12] hover:bg-[#101826] flex-shrink-0"
                >
                  {currentNet ? (
                    <>
                      <currentNet.logo size={18} />
                      <span className="hidden sm:block text-[13px] font-semibold text-white whitespace-nowrap">
                        {currentNet.label}
                      </span>
                    </>
                  ) : (
                    <>
                      {/* unknown / not connected */}
                      <div className="w-[18px] h-[18px] rounded-full bg-white/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                      </div>
                      <span className="hidden sm:block text-[13px] font-semibold text-[#64748B] whitespace-nowrap">
                        Network
                      </span>
                    </>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-[#64748B] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[230px] overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#070B11]/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#475569]">
                    Select Network
                  </p>
                </div>

                {NETWORKS.map((net) => {
                  const isActive = wallet.chainId === net.id;
                  const isConnected = wallet.isConnected;
                  return (
                    <DropdownMenuItem
                      key={net.id}
                      onClick={() => isConnected && handleNetworkSwitch(net.id)}
                      data-testid={`button-network-${net.label.toLowerCase()}`}
                      className={`flex items-center gap-3 rounded-[14px] px-3 py-3 cursor-pointer transition-all ${
                        isActive
                          ? "bg-[#0E1621] border border-white/[0.06]"
                          : "hover:bg-[#0E1621] border border-transparent"
                      } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <net.logo size={28} />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[14px] font-bold text-white leading-tight">
                          {net.label}
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          {net.sublabel} · Chain {net.id}
                        </span>
                      </div>
                      {isActive && (
                        <div
                          className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: net.color + "22", border: `1px solid ${net.color}44` }}
                        >
                          <Check className="w-3 h-3" style={{ color: net.color }} />
                        </div>
                      )}
                    </DropdownMenuItem>
                  );
                })}

                {!wallet.isConnected && (
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[11px] text-[#475569] text-center">
                      Connect your wallet to switch networks
                    </p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ── Wallet button ── */}
            {wallet.isConnected && wallet.address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="button-wallet-dropdown"
                    className="group relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#0B1118] px-2.5 sm:px-4 py-2 sm:py-3 transition-all duration-300 hover:border-cyan-400/20 hover:bg-[#101826] hover:shadow-[0_0_40px_rgba(34,211,238,0.08)] flex-shrink-0"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative z-10 flex items-center gap-1.5 sm:gap-3">
                      <div className="relative hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/10 bg-cyan-400/10">
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_70%)]" />
                        <Wallet className="relative z-10 h-4 w-4 text-cyan-300" />
                      </div>
                      <div className="flex flex-col items-start leading-none">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] sm:text-[14px] font-bold text-white whitespace-nowrap">
                            {shortAddr(wallet.address)}
                          </span>
                          <div className="hidden sm:flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-[3px]">
                            <ShieldCheck className="h-3 w-3 text-emerald-300" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                              Secure
                            </span>
                          </div>
                        </div>
                        {wallet.balance && (
                          <span className="mt-1 hidden sm:block text-[12px] font-medium text-[#94A3B8]">
                            {wallet.balance} ETH
                          </span>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-[#64748B] transition-transform duration-300 group-data-[state=open]:rotate-180 flex-shrink-0" />
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-[290px] overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#070B11]/95 p-0 shadow-[0_25px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
                >
                  {/* top */}
                  <div className="relative overflow-hidden border-b border-white/[0.05] bg-[#0B1118] p-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_55%)]" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/10 bg-cyan-400/10">
                        <Wallet className="h-6 w-6 text-cyan-300" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] font-black tracking-[-0.03em] text-white">
                            {shortAddr(wallet.address)}
                          </span>
                          <Sparkles className="h-4 w-4 text-cyan-300" />
                        </div>
                        <span className="mt-1 text-[13px] text-[#94A3B8]">
                          {wallet.balance || "0"} ETH
                        </span>
                        <span className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#64748B]">
                          {currentNet ? `${currentNet.label} ${currentNet.sublabel}` : "Unknown Network"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="p-2">
                    <DropdownMenuItem
                      asChild
                      className="group flex cursor-pointer items-center gap-3 rounded-[18px] border border-transparent px-4 py-3 transition-all hover:border-cyan-400/10 hover:bg-[#0E1621] focus:bg-[#0E1621]"
                    >
                      <a
                        href={
                          currentNet
                            ? `${currentNet.explorer}/address/${wallet.address}`
                            : `https://basescan.org/address/${wallet.address}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="link-view-on-explorer"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] transition-all group-hover:bg-cyan-400/10">
                          <ExternalLink className="h-4 w-4 text-cyan-300" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-white">
                            View on {currentNet?.explorerLabel ?? "Explorer"}
                          </span>
                          <span className="text-[12px] text-[#64748B]">
                            Open wallet explorer
                          </span>
                        </div>
                      </a>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-2 bg-white/[0.04]" />

                    <DropdownMenuItem
                      onClick={() => wallet.disconnect()}
                      data-testid="button-disconnect-wallet"
                      className="group flex cursor-pointer items-center gap-3 rounded-[18px] border border-transparent px-4 py-3 transition-all hover:border-red-400/10 hover:bg-[#140D10] focus:bg-[#140D10]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] transition-all group-hover:bg-red-400/10">
                        <LogOut className="h-4 w-4 text-red-300" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-red-200">
                          Disconnect Wallet
                        </span>
                        <span className="text-[12px] text-[#64748B]">
                          End current session
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                type="button"
                onClick={() => setWalletOpen(true)}
                disabled={wallet.isConnecting}
                data-testid="button-connect-wallet"
                className="group relative flex-shrink-0 overflow-hidden rounded-[18px] border border-[#0baa3b]/25 bg-gradient-to-b from-[#0baa3b] to-[#0a9637] px-3.5 sm:px-5 py-2.5 sm:py-3 text-black transition-all duration-300 hover:from-[#12c247] hover:to-[#0baa3b] hover:shadow-[0_0_30px_rgba(11,170,59,0.35)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2 text-[13px] sm:text-[14px] font-bold whitespace-nowrap">
                  <Wallet className="h-4 w-4" />
                  {wallet.isConnecting ? (
                    <span>Connecting...</span>
                  ) : (
                    <>
                      <span className="tracking-[-0.02em] hidden sm:inline">Connect Wallet</span>
                      <span className="tracking-[-0.02em] inline sm:hidden">Connect</span>
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* WRONG NETWORK BANNER — only shows when on an unrecognised chain */}
        {wallet.isWrongNetwork && wallet.isConnected && (
          <div className="border-t border-red-400/10 bg-[#140D10] px-3 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[941px] lg:max-w-[1280px] items-center justify-between gap-4 py-3">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-red-300">
                  Unsupported Network
                </span>
                <span className="mt-1 text-[12px] text-[#FCA5A5]">
                  Switch to Base or Robinhood Chain
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={wallet.switchToBase}
                  className="flex items-center gap-1.5 rounded-[14px] border border-red-400/10 bg-red-400/10 px-3 py-2 text-[12px] font-bold text-red-200 transition-all hover:bg-red-400/20"
                >
                  <BaseLogo size={14} />
                  Base
                </button>
                <button
                  onClick={wallet.switchToRobinhood}
                  className="flex items-center gap-1.5 rounded-[14px] border border-red-400/10 bg-red-400/10 px-3 py-2 text-[12px] font-bold text-red-200 transition-all hover:bg-red-400/20"
                >
                  <RHLogo size={14} />
                  Robinhood
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* CONNECT MODAL */}
      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={async () => {
          setWalletOpen(false);
          await wallet.connect();
        }}
      />
    </>
  );
};
