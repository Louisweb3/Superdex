import { useState } from "react";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface AppHeaderSectionProps {
  onNavSelect?: (tab: string) => void;
  activeTab?: string;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

const DESKTOP_NAV = [
  { value: "home",      label: "Home" },
  { value: "swap",      label: "Swap" },
  { value: "rewards",   label: "Rewards" },
  { value: "earn",      label: "Earn" },
  { value: "vault",     label: "Vault" },
  { value: "airdrop",   label: "Airdrop" },
  { value: "launch",    label: "Launch" },
  { value: "analytics", label: "Analytics" },
];

export const AppHeaderSection = ({
  onNavSelect,
  activeTab,
}: AppHeaderSectionProps): JSX.Element => {
  const [walletOpen, setWalletOpen] = useState(false);

  const wallet = useWalletContext();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#050B12]/90 backdrop-blur-2xl">

        {/* subtle glow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

        <div className="relative flex min-h-[72px] sm:min-h-[84px] w-full items-center justify-between px-4 sm:px-6 md:px-8">

          {/* LOGO - UNCHANGED */}
          <button
            onClick={() => onNavSelect?.("home")}
            className="flex items-center gap-2 sm:gap-3 focus:outline-none"
            aria-label="SuperSwap home"
            data-testid="link-home"
          >
            <img
              className="h-9 w-7 sm:h-[47px] sm:w-[38px] object-cover"
              alt="Logo"
              src="/figmaAssets/logo.png"
            />

            <span className="flex items-center leading-none font-['Inter',Helvetica] tracking-[0]">

              <span className="font-bold text-[#ccced2] text-[20px] sm:text-[25px]">
                Super
              </span>

              <span className="font-normal text-[#37c359] text-[22px] sm:text-[27px]">
                Swap
              </span>
            </span>
          </button>

          {/* DESKTOP NAV LINKS — hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {DESKTOP_NAV.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onNavSelect?.(item.value)}
                data-testid={`button-desknav-${item.value}`}
                className={`px-4 py-2 rounded-[14px] text-[14px] font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === item.value
                    ? "bg-[#0d2218] text-[#2dae50] border border-[#1a3428]"
                    : "text-[#8b97aa] hover:text-white hover:bg-[#0a1520] border border-transparent"
                }`}
              >
                {item.label}
              </button>
            ))}
            <a
              href="/docs"
              data-testid="button-desknav-docs"
              className="px-4 py-2 rounded-[14px] text-[14px] font-medium text-[#8b97aa] hover:text-white hover:bg-[#0a1520] border border-transparent transition-all duration-200 whitespace-nowrap"
            >
              Docs
            </a>
          </nav>

          {/* RIGHT */}
          {wallet.isConnected && wallet.address ? (
            <DropdownMenu>

              <DropdownMenuTrigger asChild>

                <button
                  data-testid="button-wallet-dropdown"
                  className="group relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#0B1118] px-4 py-3 transition-all duration-300 hover:border-cyan-400/20 hover:bg-[#101826] hover:shadow-[0_0_40px_rgba(34,211,238,0.08)]"
                >

                  {/* glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative z-10 flex items-center gap-3">

                    {/* wallet icon */}
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/10 bg-cyan-400/10">

                      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_70%)]" />

                      <Wallet className="relative z-10 h-4 w-4 text-cyan-300" />
                    </div>

                    {/* wallet info */}
                    <div className="flex flex-col items-start leading-none">

                      <div className="flex items-center gap-2">

                        <span className="text-[14px] font-bold text-white">
                          {shortAddr(wallet.address)}
                        </span>

                        <div className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-[3px]">

                          <ShieldCheck className="h-3 w-3 text-emerald-300" />

                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                            Secure
                          </span>
                        </div>
                      </div>

                      {wallet.balance && (
                        <span className="mt-1 text-[12px] font-medium text-[#94A3B8]">
                          {wallet.balance} ETH
                        </span>
                      )}
                    </div>

                    <ChevronDown className="h-4 w-4 text-[#64748B] transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </div>
                </button>
              </DropdownMenuTrigger>

              {/* DROPDOWN */}
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[290px] overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#070B11]/95 p-0 shadow-[0_25px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
              >

                {/* top */}
                <div className="relative overflow-hidden border-b border-white/[0.05] bg-[#0B1118] p-5">

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_55%)]" />

                  <div className="relative z-10 flex items-center gap-4">

                    {/* icon */}
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/10 bg-cyan-400/10">

                      <Wallet className="h-6 w-6 text-cyan-300" />
                    </div>

                    {/* wallet */}
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
                        Base Mainnet
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
                      href={`https://basescan.org/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-view-on-basescan"
                    >

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] transition-all group-hover:bg-cyan-400/10">

                        <ExternalLink className="h-4 w-4 text-cyan-300" />
                      </div>

                      <div className="flex flex-col">

                        <span className="text-[14px] font-semibold text-white">
                          View on Basescan
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setWalletOpen(true)}
              data-testid="button-connect-wallet"
              className="group relative overflow-hidden rounded-[22px] border border-cyan-400/10 bg-[#0B1118] px-5 py-6 text-white transition-all duration-300 hover:border-cyan-400/20 hover:bg-[#101826] hover:shadow-[0_0_40px_rgba(34,211,238,0.08)]"
            >

              {/* glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <span className="relative z-10 flex items-center gap-3 text-[15px] font-bold">

                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/10 bg-cyan-400/10">

                  <img
                    className="h-4 w-4 object-contain"
                    alt="Wallet"
                    src="/figmaAssets/image-30.png"
                  />
                </div>

                {wallet.isConnecting ? (
                  <span className="text-[14px] text-cyan-300">
                    Connecting...
                  </span>
                ) : (
                  <span className="tracking-[-0.02em]">
                    Connect Wallet
                  </span>
                )}
              </span>
            </Button>
          )}
        </div>

        {/* WRONG NETWORK */}
        {wallet.isWrongNetwork && wallet.isConnected && (
          <div className="border-t border-red-400/10 bg-[#140D10] px-4 py-3 sm:px-6">

            <div className="flex items-center justify-between gap-4">

              <div className="flex flex-col">

                <span className="text-[13px] font-semibold text-red-300">
                  Wrong Network Detected
                </span>

                <span className="mt-1 text-[12px] text-[#FCA5A5]">
                  Please switch to Base Mainnet
                </span>
              </div>

              <button
                onClick={wallet.switchToBase}
                className="rounded-[14px] border border-red-400/10 bg-red-400/10 px-4 py-2 text-[13px] font-bold text-red-200 transition-all hover:bg-red-400/20"
              >
                Switch Network
              </button>
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