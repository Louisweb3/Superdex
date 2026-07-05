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
    <div className="flex flex-col gap-4 pt-2 max-w-[640px]">
      <h2 className="text-[16px] font-semibold text-white">Settings</h2>
      <GlassCard className="p-5 flex flex-col gap-1">
        <h3 className="text-[11px] font-semibold text-[#63666a] uppercase tracking-wider mb-2">Network Configuration</h3>
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#081312] last:border-0">
            <span className="flex items-center gap-2 text-[12px] text-[#c2c4c5]"><Icon size={14} className="text-[#63666a]" />{label}</span>
            <span className="text-[12px] text-white font-medium">{value}</span>
          </div>
        ))}
      </GlassCard>
      <GlassCard className="p-5">
        <h3 className="text-[11px] font-semibold text-[#63666a] uppercase tracking-wider mb-2">RPC Endpoint</h3>
        <p className="text-[12px] text-[#c2c4c5] font-mono break-all">{rpcUrl}</p>
      </GlassCard>
      <p className="text-[11px] text-[#63666a] text-center">More preferences are on the way — stay tuned.</p>
    </div>
  );
}
