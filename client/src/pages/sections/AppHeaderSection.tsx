import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";

interface AppHeaderSectionProps {
  onNavSelect?: (tab: string) => void;
}

export const AppHeaderSection = ({ onNavSelect }: AppHeaderSectionProps): JSX.Element => {
  const [walletOpen, setWalletOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");

  const handleConnect = (walletId: string) => {
    const shortAddr = "0x" + Math.random().toString(16).slice(2, 6).toUpperCase() + "..." + Math.random().toString(16).slice(2, 6).toUpperCase();
    setAddress(shortAddr);
    setConnected(true);
  };

  return (
    <>
      <header className="relative w-full border-b border-[#0b1e24] bg-[#020816]">
        <div className="flex min-h-[72px] sm:min-h-[84px] w-full items-center justify-between px-4 sm:px-6 md:px-8">
          <button
            onClick={() => onNavSelect?.("home")}
            className="flex items-center gap-2 sm:gap-3 focus:outline-none"
            aria-label="SuperSwap home"
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

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (connected) {
                setConnected(false);
                setAddress("");
              } else {
                setWalletOpen(true);
              }
            }}
            className="h-auto rounded-[22px] border border-[#12352d] bg-[#000d10] px-3 sm:px-5 py-2.5 sm:py-4 text-[#2ca84c] hover:bg-[#041418] hover:text-[#2ca84c] transition-all"
          >
            <span className="flex items-center gap-2 sm:gap-3 font-['Inter',Helvetica] text-[15px] sm:text-[19px] font-bold leading-[normal] tracking-[0]">
              <img
                className="h-4 w-4 sm:h-5 sm:w-5 object-cover"
                alt="Wallet"
                src="/figmaAssets/image-30.png"
              />
              <span>{connected ? address : "Connect"}</span>
            </span>
          </Button>
        </div>
      </header>

      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
};
