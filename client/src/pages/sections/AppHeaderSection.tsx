import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import { useWalletContext } from "@/context/WalletContext";
import { ExternalLink, X } from "lucide-react";

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
            <div className="flex items-center gap-2">
              {/* Connected wallet button — opens Basescan */}
              <a
                href={`https://basescan.org/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-view-on-basescan"
                className="flex items-center gap-2 sm:gap-3 h-auto rounded-[22px] border border-[#12352d] bg-[#000d10] px-3 sm:px-5 py-2.5 sm:py-4 text-[#2ca84c] hover:bg-[#041418] transition-all"
              >
                <img
                  className="h-4 w-4 sm:h-5 sm:w-5 object-cover"
                  alt="Wallet"
                  src="/figmaAssets/image-30.png"
                />
                <div className="flex flex-col items-start leading-none">
                  <span className="font-['Inter',Helvetica] text-[13px] sm:text-[16px] font-bold text-[#2ca84c]">
                    {shortAddr(wallet.address)}
                  </span>
                  {wallet.balance && (
                    <span className="font-['Inter',Helvetica] text-[10px] sm:text-[11px] text-[#5f8a6e] mt-0.5">
                      {wallet.balance} ETH
                    </span>
                  )}
                </div>
                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#3a7a52] shrink-0" />
              </a>
              {/* Disconnect button */}
              <button
                onClick={() => wallet.disconnect()}
                data-testid="button-disconnect-wallet"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#3a0e0e] bg-[#1a0a0a] text-[#c9543a] hover:bg-[#2a1010] transition-all"
                title="Disconnect wallet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
