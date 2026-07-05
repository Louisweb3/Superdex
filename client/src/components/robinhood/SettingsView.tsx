import { Layers, Zap, Database, Cpu } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface SettingsViewProps {
  chainName: string;
  chainId: string;
  rpcUrl: string;
}

export function SettingsView({ chainName, chainId, rpcUrl }: SettingsViewProps) {
  const rows = [
    { icon: Layers, label: "Network", value: chainName },
    { icon: Cpu, label: "Chain ID", value: chainId },
    { icon: Zap, label: "Block Time", value: "100ms" },
    { icon: Database, label: "DA Layer", value: "Ethereum blobs" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[640px]">
      <h2 className="text-[20px] font-semibold text-white">Settings</h2>
      <GlassCard className="p-6 flex flex-col gap-1">
        <h3 className="text-[13px] font-semibold text-[#8B97A8] uppercase tracking-wider mb-3">
          Network Configuration
        </h3>
        {rows.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0"
          >
            <span className="flex items-center gap-2.5 text-[13px] text-[#c9d1de]">
              <Icon size={15} className="text-[#5E6B7A]" />
              {label}
            </span>
            <span className="text-[13px] text-white font-medium">
              {value}
            </span>
          </div>
        ))}
      </GlassCard>
      <GlassCard className="p-6">
        <h3 className="text-[13px] font-semibold text-[#8B97A8] uppercase tracking-wider mb-3">
          RPC Endpoint
        </h3>
        <p className="text-[13px] text-[#c9d1de] font-mono break-all">
          {rpcUrl}
        </p>
      </GlassCard>
      <p className="text-[12px] text-[#5E6B7A] text-center">
        More preferences are on the way — stay tuned.
      </p>
    </div>
  );
}
