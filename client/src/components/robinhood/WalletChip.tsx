import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { StatusChip } from "./StatusChip";

interface WalletChipProps {
  isConnected: boolean;
  isOnRH: boolean;
  address: string | null;
  balance: string | null;
  switchingNetwork: boolean;
  onConnect: () => void;
  onSwitchNetwork: () => void;
  onDisconnect: () => void;
  onCopy: () => void;
  explorerUrl: string;
}

export function WalletChip({
  isConnected,
  isOnRH,
  address,
  balance,
  switchingNetwork,
  onConnect,
  onSwitchNetwork,
  onDisconnect,
  onCopy,
  explorerUrl,
}: WalletChipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        data-testid="button-connect-wallet"
        className="flex items-center gap-2 bg-gradient-to-br from-[#5AE4A8] to-[#46D67B] hover:brightness-110 text-[#05070A] font-semibold text-[13px] px-4 h-[42px] rounded-[12px] shadow-[0_4px_20px_rgba(90,228,168,0.25)] transition-all duration-200"
      >
        <Wallet size={15} />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="button-wallet-chip"
        className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] px-3 h-[42px] rounded-[12px] transition-all duration-200"
      >
        <span
          className={`w-2 h-2 rounded-full ${isOnRH ? "bg-[#46D67B]" : "bg-[#FFB547]"}`}
        />
        <span className="text-[13px] text-white font-medium">
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ""}
        </span>
        <ChevronDown
          size={14}
          className={`text-[#5E6B7A] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[260px] bg-[#0B1118]/95 backdrop-blur-xl border border-white/[0.08] rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[12px] text-[#8B97A8]">Status</span>
            <StatusChip kind={isOnRH ? "connected" : "wrong-network"} />
          </div>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[12px] text-[#8B97A8]">Balance</span>
            <span className="text-[13px] text-white font-medium">
              {balance ? `${Number(balance).toFixed(4)} ETH` : "—"}
            </span>
          </div>
          <div className="h-px bg-white/[0.06] my-2" />
          <button
            onClick={() => {
              onCopy();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[10px] text-[13px] text-[#c9d1de] hover:bg-white/[0.05] hover:text-white transition-colors"
          >
            <Copy size={14} /> Copy Address
          </button>
          {!isOnRH && (
            <button
              onClick={() => {
                onSwitchNetwork();
                setOpen(false);
              }}
              disabled={switchingNetwork}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[10px] text-[13px] text-[#c9d1de] hover:bg-white/[0.05] hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={switchingNetwork ? "animate-spin" : ""}
              />
              Switch Network
            </button>
          )}
          {address && (
            <a
              href={`${explorerUrl}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[10px] text-[13px] text-[#c9d1de] hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              <ExternalLink size={14} /> View on Explorer
            </a>
          )}
          <div className="h-px bg-white/[0.06] my-2" />
          <button
            onClick={() => {
              onDisconnect();
              setOpen(false);
            }}
            data-testid="button-disconnect-wallet"
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[10px] text-[13px] text-[#FF5A67] hover:bg-[#FF5A67]/10 transition-colors"
          >
            <LogOut size={14} /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
