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
import { ExternalLink, LogOut, Wallet, ChevronDown } from "lucide-react";

interface AppHeaderSectionProps {
  onNavSelect?: (tab: string) => void;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export const AppHeaderSection = ({ onNavSelect }: AppHeaderSectionProps): JSX.Element => {
  const [walletOpen, setWalletOpen] = useState(false);
  const wallet = useWalletContext();

  return (
    <>
      <header className="relative w-full border-b border-[#0b1e24] bg-[#020816]">
        <div className="flex min-h-[72px] sm:min-h-[84px] w-full items-center justify-between px-4 sm:px-6 md:px-8">
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
              <span className="font-bold text-[#ccced2] text-[20px] sm:text-[25px]">Super</span>
              <span className="font-normal text-[#37c359] text-[22px] sm:text-[27px]">Swap</span>
            </span>
          </button>

          {wallet.isConnected && wallet.address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="button-wallet-dropdown"
                  className="group flex items-center gap-2 sm:gap-3 h-auto rounded-[22px] border border-[#1a2e28] bg-gradient-to-br from-[#071a14] to-[#020d0a] px-3 sm:px-5 py-2.5 sm:py-3 text-[#2dae50] hover:border-[#2a5a3e] hover:shadow-[0_0_20px_rgba(45,174,80,0.15)] transition-all"
                >
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#0a1f16] border border-[#1a3d2e]">
                    <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#3acd5b]" />
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="font-['Inter',Helvetica] text-[13px] sm:text-[15px] font-bold text-[#2dae50]">
                      {shortAddr(wallet.address)}
                    </span>
                    {wallet.balance && (
                      <span className="font-['Inter',Helvetica] text-[10px] sm:text-[11px] text-[#5f8a6e] mt-0.5">
                        {wallet.balance} ETH
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#3a6a4e] group-data-[state=open]:rotate-180 transition-transform" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-[220px] sm:w-[260px] rounded-[18px] border border-[#1a2e28] bg-[#030c12] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              >
                {/* Wallet identity header */}
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a1f16] border border-[#1a3d2e]">
                    <Wallet className="h-5 w-5 text-[#3acd5b]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Inter',Helvetica] text-[14px] font-bold text-white">
                      {shortAddr(wallet.address)}
                    </span>
                    {wallet.balance && (
                      <span className="font-['Inter',Helvetica] text-[12px] text-[#5f8a6e]">
                        {wallet.balance} ETH
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-[#0f1e18] my-1" />

                <DropdownMenuItem
                  asChild
                  className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] text-[#a0b0a0] hover:bg-[#0a1a14] hover:text-[#2dae50] focus:bg-[#0a1a14] focus:text-[#2dae50] cursor-pointer transition-colors"
                >
                  <a
                    href={`https://basescan.org/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-view-on-basescan"
                  >
                    <ExternalLink className="h-4 w-4 text-[#5f8a6e]" />
                    <span className="font-['Inter',Helvetica]">View on Basescan</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#0f1e18] my-1" />

                <DropdownMenuItem
                  onClick={() => wallet.disconnect()}
                  data-testid="button-disconnect-wallet"
                  className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] text-[#c9543a] hover:bg-[#1a0a0a] hover:text-[#e06b5a] focus:bg-[#1a0a0a] focus:text-[#e06b5a] cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-['Inter',Helvetica]">Disconnect Wallet</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setWalletOpen(true)}
              data-testid="button-connect-wallet"
              className="h-auto rounded-[22px] border border-[#12352d] bg-[#000d10] px-3 sm:px-5 py-2.5 sm:py-4 text-[#2ca84c] hover:bg-[#041418] hover:text-[#2ca84c] transition-all"
            >
              <span className="flex items-center gap-2 sm:gap-3 font-['Inter',Helvetica] text-[15px] sm:text-[19px] font-bold leading-[normal] tracking-[0]">
                <img
                  className="h-4 w-4 sm:h-5 sm:w-5 object-cover"
                  alt="Wallet"
                  src="/figmaAssets/image-30.png"
                />
                {wallet.isConnecting
                  ? <span className="text-[13px]">Connecting…</span>
                  : <span>Connect</span>
                }
              </span>
            </Button>
          )}
        </div>

        {wallet.isWrongNetwork && wallet.isConnected && (
          <div className="flex w-full items-center justify-between bg-[#1a0a0a] px-4 py-2 sm:px-6">
            <span className="font-['Inter',sans-serif] text-[12px] text-[#c9543a]">
              Wrong network — please switch to Base
            </span>
            <button
              onClick={wallet.switchToBase}
              className="rounded-[8px] bg-[#3a0e0e] px-3 py-1 font-['Inter',sans-serif] text-[12px] font-bold text-[#c9543a] hover:bg-[#4a1212] transition-colors"
            >
              Switch to Base
            </button>
          </div>
        )}
      </header>

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
