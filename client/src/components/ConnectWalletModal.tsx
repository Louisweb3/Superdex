import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Wallet {
  id: string;
  name: string;
  description: string;
  icon: string;
  popular?: boolean;
}

const wallets: Wallet[] = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Connect using MetaMask",
    icon: "🦊",
    popular: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Connect using Coinbase Wallet",
    icon: "🔵",
    popular: true,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Scan with your mobile wallet",
    icon: "🔗",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    description: "Connect using Rainbow",
    icon: "🌈",
  },
];

interface ConnectWalletModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => void;
}

export function ConnectWalletModal({ open, onClose, onConnect }: ConnectWalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (walletId: string) => {
    setConnecting(walletId);
    await new Promise((r) => setTimeout(r, 1200));
    setConnecting(null);
    onConnect(walletId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border border-[#0f2030] bg-[#020b1c] p-0 text-white max-w-sm w-[calc(100%-2rem)] rounded-2xl">
        <DialogHeader className="border-b border-[#0b1e2c] px-6 py-5">
          <DialogTitle className="font-['Inter',sans-serif] text-lg font-semibold text-[#d0d2d6]">
            Connect Wallet
          </DialogTitle>
          <p className="mt-1 font-['Inter',sans-serif] text-sm text-[#4d5a6e]">
            Choose a wallet to connect to SuperSwap
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-2 p-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnect(wallet.id)}
              disabled={connecting !== null}
              className="flex w-full items-center gap-4 rounded-xl border border-[#0d1e2c] bg-[#030e1c] px-4 py-3 text-left transition-all hover:border-[#1a4a3a] hover:bg-[#041220] disabled:opacity-50"
            >
              <span className="text-2xl">{wallet.icon}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 font-['Inter',sans-serif] text-sm font-medium text-[#c0c4cc]">
                  {wallet.name}
                  {wallet.popular && (
                    <span className="rounded-full bg-[#0a2a1c] px-2 py-0.5 text-[10px] font-bold text-[#2dae50]">
                      Popular
                    </span>
                  )}
                </span>
                <span className="font-['Inter',sans-serif] text-xs text-[#4d5a6e]">
                  {wallet.description}
                </span>
              </div>
              {connecting === wallet.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2dae50] border-t-transparent" />
              ) : (
                <svg className="h-4 w-4 text-[#3a4a5c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="border-t border-[#0b1e2c] px-6 py-4">
          <p className="text-center font-['Inter',sans-serif] text-xs text-[#3a4a5c]">
            By connecting, you agree to the{" "}
            <button className="text-[#2dae50] underline-offset-2 hover:underline">Terms of Service</button>
            {" "}and{" "}
            <button className="text-[#2dae50] underline-offset-2 hover:underline">Privacy Policy</button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
