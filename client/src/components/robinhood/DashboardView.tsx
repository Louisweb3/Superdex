import {
  Coins,
  ShieldCheck,
  Wallet,
  Sparkles,
  Radio,
  Fuel,
  ArrowUpRight,
  Rocket,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatCard } from "./StatCard";
import type { DeployedToken, RhTab } from "./types";

interface DashboardViewProps {
  isConnected: boolean;
  isOnRH: boolean;
  balance: string | null;
  chainName: string;
  tokens: DeployedToken[];
  gmClaimed: boolean;
  xpClaimed: boolean;
  onNavigate: (tab: RhTab) => void;
}

export function DashboardView({
  isConnected,
  isOnRH,
  balance,
  chainName,
  tokens,
  gmClaimed,
  xpClaimed,
  onNavigate,
}: DashboardViewProps) {
  const verifiedCount = tokens.filter(
    (t) => t.verifyStatus === "verified",
  ).length;
  const latest = tokens[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Contracts Deployed"
          value={tokens.length}
          icon={Coins}
          accentColor="#5AE4A8"
        />
        <StatCard
          label="Verified Contracts"
          value={verifiedCount}
          icon={ShieldCheck}
          accentColor="#7A8CFF"
        />
        <StatCard
          label="Wallet Balance"
          value={
            isConnected && balance ? `${Number(balance).toFixed(4)} ETH` : "—"
          }
          icon={Wallet}
          accentColor="#46D67B"
        />
        <StatCard
          label="Today's Rewards"
          value={
            gmClaimed && xpClaimed
              ? "Complete"
              : gmClaimed || xpClaimed
                ? "In Progress"
                : "Not Started"
          }
          icon={Sparkles}
          accentColor="#FFB547"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-semibold text-white">
              Recent Activity
            </h3>
            <button
              onClick={() => onNavigate("contracts")}
              className="flex items-center gap-1 text-[12px] text-[#8B97A8] hover:text-white transition-colors"
              data-testid="link-view-all-contracts"
            >
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          {latest ? (
            <div className="flex items-center justify-between gap-4 p-4 rounded-[14px] bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5AE4A8]/10 border border-[#5AE4A8]/20 flex items-center justify-center">
                  <span className="text-[#5AE4A8] text-[11px] font-semibold">
                    {latest.symbol.slice(0, 3)}
                  </span>
                </div>
                <div>
                  <div className="text-[14px] font-medium text-white">
                    {latest.name}
                  </div>
                  <div className="text-[12px] text-[#8B97A8] font-mono">
                    {latest.address.slice(0, 8)}…{latest.address.slice(-6)}
                  </div>
                </div>
              </div>
              <span className="text-[12px] text-[#5E6B7A]">
                {new Date(latest.deployedAt).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Rocket size={22} className="text-[#5E6B7A]" />
              </div>
              <p className="text-[14px] text-[#c9d1de] font-medium">
                No contracts deployed yet
              </p>
              <p className="text-[12px] text-[#5E6B7A] mt-1 mb-4">
                Deploy your first ERC-20 token to get started
              </p>
              <button
                onClick={() => onNavigate("deploy")}
                className="flex items-center gap-2 bg-gradient-to-br from-[#5AE4A8] to-[#46D67B] text-[#05070A] font-semibold text-[13px] px-4 py-2 rounded-[10px] transition-all hover:brightness-110"
              >
                Deploy Contract
              </button>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6 flex flex-col gap-4">
          <h3 className="text-[16px] font-semibold text-white">Network</h3>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#8B97A8] flex items-center gap-2">
              <Radio size={13} /> Chain
            </span>
            <span className="text-[13px] text-white font-medium">
              {chainName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#8B97A8] flex items-center gap-2">
              <Fuel size={13} /> Status
            </span>
            <span
              className={`text-[13px] font-medium ${isOnRH ? "text-[#46D67B]" : "text-[#FFB547]"}`}
            >
              {!isConnected
                ? "Not connected"
                : isOnRH
                  ? "Connected"
                  : "Wrong network"}
            </span>
          </div>
          <div className="h-px bg-white/[0.06]" />
          <p className="text-[12px] text-[#5E6B7A] leading-relaxed">
            Robinhood Chain is a high-throughput Arbitrum Orbit L2 settling to
            Ethereum, with 100ms blocks and ETH gas.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
