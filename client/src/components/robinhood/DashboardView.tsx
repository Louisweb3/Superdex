import {
  Coins,
  ShieldCheck,
  Wallet,
  Sparkles,
  Radio,
  Fuel,
  ArrowUpRight,
  Rocket,
  Globe,
  CheckCircle,
  ExternalLink,
  Loader2,
  Send,
  Info,
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
  gnClaimed: boolean;
  xpClaimed: boolean;
  totalContractsDeployed: number;
  onNavigate: (tab: RhTab) => void;

  switchToRH: () => void;
  switchingNetwork: boolean;
  explorerUrl: string;

  sendingGm: boolean;
  gmTxHash: string;
  sendGm: () => void;

  sendingGn: boolean;
  gnTxHash: string;
  sendGn: () => void;
}

function NetworkWarning({
  chainName,
  switchToRH,
  switchingNetwork,
}: {
  chainName: string;
  switchToRH: () => void;
  switchingNetwork: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[#FFB547]/20 bg-[#FFB547]/[0.06] px-4 py-3 mb-5">
      <Info size={15} className="text-[#FFB547] flex-shrink-0" />
      <span className="text-[#FFB547]/90 text-[13px]">
        You're not on {chainName}.
      </span>
      <button
        onClick={switchToRH}
        disabled={switchingNetwork}
        className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-[#5AE4A8] hover:text-[#46D67B] transition-colors whitespace-nowrap"
      >
        {switchingNetwork && <Loader2 size={12} className="animate-spin" />}
        Switch Network
      </button>
    </div>
  );
}

export function DashboardView({
  isConnected,
  isOnRH,
  balance,
  chainName,
  tokens,
  gmClaimed,
  gnClaimed,
  xpClaimed,
  totalContractsDeployed,
  onNavigate,
  switchToRH,
  switchingNetwork,
  explorerUrl,
  sendingGm,
  gmTxHash,
  sendGm,
  sendingGn,
  gnTxHash,
  sendGn,
}: DashboardViewProps) {
  const verifiedCount = tokens.filter(
    (t) => t.verifyStatus === "verified",
  ).length;
  const latest = tokens[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Contracts Deployed"
          value={totalContractsDeployed.toLocaleString()}
          icon={Globe}
          accentColor="#5AE4A8"
        />
        <StatCard
          label="Your Contracts"
          value={tokens.length}
          icon={Coins}
          accentColor="#7A8CFF"
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
            gmClaimed && gnClaimed && xpClaimed
              ? "Complete"
              : gmClaimed || gnClaimed || xpClaimed
                ? "In Progress"
                : "Not Started"
          }
          icon={Sparkles}
          accentColor="#FFB547"
        />
      </div>

      {/* GM / GN daily send cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <div className="text-center mb-5">
            <div className="text-[36px] mb-2">🌅</div>
            <h2 className="text-[16px] font-semibold text-[var(--rh-text)]">
              Send GM On-Chain
            </h2>
            <p className="text-[var(--rh-text-secondary)] text-[12px] mt-1.5">
              Send a "Good Morning" message on {chainName}. Once per day.
            </p>
          </div>

          {isConnected && !isOnRH && (
            <NetworkWarning
              chainName={chainName}
              switchToRH={switchToRH}
              switchingNetwork={switchingNetwork}
            />
          )}

          {gmClaimed ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="flex items-center gap-2 text-[#46D67B] text-[13px] font-semibold">
                <CheckCircle size={17} />
                GM sent today!
              </div>
              {gmTxHash && (
                <a
                  href={`${explorerUrl}/tx/${gmTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-[#5AE4A8] hover:text-[#46D67B] transition-colors"
                >
                  <ExternalLink size={11} />
                  View transaction
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={sendGm}
              disabled={sendingGm}
              data-testid="button-send-gm"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-[#5AE4A8] to-[#46D67B] hover:brightness-110 disabled:opacity-40 text-[#05070A] font-semibold text-[14px] h-[46px] rounded-[14px] shadow-[0_4px_24px_rgba(90,228,168,0.25)] transition-all duration-200"
            >
              {sendingGm ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
              {sendingGm ? "Sending…" : "GM 🌅"}
            </button>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-center mb-5">
            <div className="text-[36px] mb-2">🌙</div>
            <h2 className="text-[16px] font-semibold text-[var(--rh-text)]">
              Send GN On-Chain
            </h2>
            <p className="text-[var(--rh-text-secondary)] text-[12px] mt-1.5">
              Send a "Good Night" message on {chainName}. Once per day.
            </p>
          </div>

          {isConnected && !isOnRH && (
            <NetworkWarning
              chainName={chainName}
              switchToRH={switchToRH}
              switchingNetwork={switchingNetwork}
            />
          )}

          {gnClaimed ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="flex items-center gap-2 text-[#7A8CFF] text-[13px] font-semibold">
                <CheckCircle size={17} />
                GN sent today!
              </div>
              {gnTxHash && (
                <a
                  href={`${explorerUrl}/tx/${gnTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-[#7A8CFF] hover:text-[#5AE4A8] transition-colors"
                >
                  <ExternalLink size={11} />
                  View transaction
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={sendGn}
              disabled={sendingGn}
              data-testid="button-send-gn"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-[#7A8CFF] to-[#5A6EE0] hover:brightness-110 disabled:opacity-40 text-[var(--rh-text)] font-semibold text-[14px] h-[46px] rounded-[14px] shadow-[0_4px_24px_rgba(122,140,255,0.25)] transition-all duration-200"
            >
              {sendingGn ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
              {sendingGn ? "Sending…" : "GN 🌙"}
            </button>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-semibold text-[var(--rh-text)]">
              Recent Activity
            </h3>
            <button
              onClick={() => onNavigate("contracts")}
              className="flex items-center gap-1 text-[12px] text-[var(--rh-text-secondary)] hover:text-[var(--rh-text)] transition-colors"
              data-testid="link-view-all-contracts"
            >
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          {latest ? (
            <div className="flex items-center justify-between gap-4 p-4 rounded-[14px] bg-[var(--rh-surface-a02)] border border-[var(--rh-border-05)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5AE4A8]/10 border border-[#5AE4A8]/20 flex items-center justify-center">
                  <span className="text-[#5AE4A8] text-[11px] font-semibold">
                    {latest.symbol.slice(0, 3)}
                  </span>
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[var(--rh-text)]">
                    {latest.name}
                  </div>
                  <div className="text-[12px] text-[var(--rh-text-secondary)] font-mono">
                    {latest.address.slice(0, 8)}…{latest.address.slice(-6)}
                  </div>
                </div>
              </div>
              <span className="text-[12px] text-[var(--rh-muted)]">
                {new Date(latest.deployedAt).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--rh-surface-a03)] border border-[var(--rh-border-06)] flex items-center justify-center mb-4">
                <Rocket size={22} className="text-[var(--rh-muted)]" />
              </div>
              <p className="text-[14px] text-[var(--rh-text-tertiary)] font-medium">
                No contracts deployed yet
              </p>
              <p className="text-[12px] text-[var(--rh-muted)] mt-1 mb-4">
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
          <h3 className="text-[16px] font-semibold text-[var(--rh-text)]">Network</h3>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--rh-text-secondary)] flex items-center gap-2">
              <Radio size={13} /> Chain
            </span>
            <span className="text-[13px] text-[var(--rh-text)] font-medium">
              {chainName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--rh-text-secondary)] flex items-center gap-2">
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
          <div className="h-px bg-[var(--rh-surface-a06)]" />
          <p className="text-[12px] text-[var(--rh-muted)] leading-relaxed">
            Robinhood Chain is a high-throughput Arbitrum Orbit L2 settling to
            Ethereum, with 100ms blocks and ETH gas.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
