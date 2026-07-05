import {
  Plus, Rocket, ShieldCheck, BarChart3, KeyRound,
  CheckCircle, ExternalLink, Loader2, Send, Info, Gift,
  Flame, TrendingUp,
} from "lucide-react";
import type { DeployedToken, RhTab } from "./types";

function NetworkWarning({ chainName, switchToRH, switchingNetwork }: { chainName: string; switchToRH: () => void; switchingNetwork: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[#FFB547]/20 bg-[#FFB547]/[0.06] px-4 py-3 mb-4">
      <Info size={15} className="text-[#FFB547] flex-shrink-0" />
      <span className="text-[#FFB547]/90 text-[13px]">You're not on {chainName}.</span>
      <button onClick={switchToRH} disabled={switchingNetwork} className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-[#5AE4A8] hover:text-[#46D67B] transition-colors whitespace-nowrap">
        {switchingNetwork && <Loader2 size={12} className="animate-spin" />}Switch Network
      </button>
    </div>
  );
}

interface DashboardViewProps {
  isConnected: boolean; isOnRH: boolean; balance: string | null;
  chainName: string; tokens: DeployedToken[]; totalContractsDeployed: number;
  gmClaimed: boolean; gnClaimed: boolean; xpClaimed: boolean; xpStreak: number;
  onNavigate: (tab: RhTab) => void;
  switchToRH: () => void; switchingNetwork: boolean; explorerUrl: string;
  sendingGm: boolean; gmTxHash: string; sendGm: () => void;
  sendingGn: boolean; gnTxHash: string; sendGn: () => void;
  claimingXp: boolean; xpTxHash: string; claimXp: () => void;
}

export function DashboardView(props: DashboardViewProps) {
  const { tokens, totalContractsDeployed, isConnected, isOnRH, balance, chainName, gmClaimed, gnClaimed, xpClaimed, xpStreak, onNavigate, switchToRH, switchingNetwork, explorerUrl, sendingGm, gmTxHash, sendGm, sendingGn, gnTxHash, sendGn, claimingXp, xpTxHash, claimXp } = props;
  const verifiedCount = tokens.filter((t) => t.verifyStatus === "verified").length;
  const latest = tokens[0];

  return (
    <div className="flex flex-col gap-5 pt-2">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[12px] bg-[#00090b] border border-[#081312]">
        <div className="p-5 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[28px] font-bold text-white leading-tight">
                Build. Deploy.<br />
                <span className="text-[#0baf3d]">Onchain.</span>
              </h1>
              <p className="text-[#63666a] text-[13px] mt-2 leading-relaxed max-w-[260px]">
                Create, deploy, and manage smart contracts on Robinhood Chain.
              </p>
              <button
                onClick={() => onNavigate("deployments")}
                className="mt-4 flex items-center gap-2 bg-[#020c0c] border border-[#024420] hover:border-[#0baa3b] rounded-[8px] px-4 py-2.5 text-[13px] text-[#0a9637] font-medium transition-colors"
              >
                <Plus size={15} /> Create Contract <Rocket size={14} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-[60px] h-[60px] rounded-[12px] bg-[#0baa3b]/10 border border-[#0baa3b]/20 flex items-center justify-center">
                <Rocket size={28} className="text-[#0baa3b]" />
              </div>
              <div className="w-[50px] h-[50px] rounded-[12px] bg-[#0baa3b]/10 border border-[#0baa3b]/20 flex items-center justify-center">
                <ShieldCheck size={24} className="text-[#0baa3b]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-white">Stats Overview</h2>
          <button onClick={() => onNavigate("analytics")} className="text-[11px] text-[#0baa3b] hover:text-[#46D67B] transition-colors">View Analytics</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Contracts", value: totalContractsDeployed.toLocaleString(), change: "+12 this week", icon: FileText },
            { label: "Total Deployments", value: tokens.length.toString(), change: "+16 this week", icon: Rocket },
            { label: "Total Transactions", value: "1,248", change: "+24.6% this week", icon: BarChart3 },
            { label: "Total Gas Used", value: isConnected && balance ? `${Number(balance).toFixed(2)}ETH` : "12.45ETH", change: "-8.3% this week", icon: Flame },
          ].map(({ label, value, change, icon: Icon }) => (
            <div key={label} className="bg-[#00090b] border border-[#081312] rounded-[8px] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={14} className="text-[#0baa3b]" />
                <span className="text-[10px] text-[#63666a]">{label}</span>
              </div>
              <div className="text-[18px] font-bold text-white">{value}</div>
              <div className="text-[10px] text-[#0baa3b] mt-0.5">{change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[14px] font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Create Contract", sub: "Start a new contract", icon: Plus, onClick: () => onNavigate("deployments") },
            { label: "Deploy Contract", sub: "Deploy to network", icon: Rocket, onClick: () => onNavigate("deployments") },
            { label: "Verify Contract", sub: "Verify your contract", icon: ShieldCheck, onClick: () => onNavigate("contracts") },
            { label: "View Analytics", sub: "Explore insights", icon: BarChart3, onClick: () => onNavigate("analytics") },
            { label: "API Keys", sub: "Manage your keys", icon: KeyRound, onClick: () => onNavigate("settings") },
          ].map(({ label, sub, icon: Icon, onClick }) => (
            <button key={label} onClick={onClick} className="flex flex-col items-center gap-1.5 bg-[#00090b] border border-[#081312] hover:border-[#0baa3b]/30 rounded-[8px] p-3 transition-colors">
              <div className="w-8 h-8 rounded-[8px] bg-[#0baa3b]/10 flex items-center justify-center">
                <Icon size={16} className="text-[#0baa3b]" />
              </div>
              <span className="text-[10px] text-white font-medium text-center leading-tight">{label}</span>
              <span className="text-[9px] text-[#63666a] text-center leading-tight">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-white">Recent Deployments</h2>
          <button onClick={() => onNavigate("contracts")} className="text-[11px] text-[#0baa3b] hover:text-[#46D67B] transition-colors">View All</button>
        </div>
        <div className="bg-[#00090b] border border-[#081312] rounded-[8px] overflow-hidden">
          {tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Rocket size={22} className="text-[#63666a] mb-2" />
              <p className="text-[13px] text-[#63666a] font-medium">No contracts deployed yet</p>
              <button onClick={() => onNavigate("deployments")} className="mt-3 flex items-center gap-2 bg-[#020c0c] border border-[#024420] rounded-[6px] px-3 py-1.5 text-[11px] text-[#0a9637]">
                <Rocket size={12} /> Deploy Contract
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {tokens.slice(0, 5).map((token, i) => (
                <div key={token.address} className={`flex items-center gap-3 px-4 py-3 ${i < tokens.slice(0,5).length - 1 ? "border-b border-[#081312]" : ""}`}>
                  <div className="w-9 h-9 rounded-[8px] bg-[#0baa3b]/10 flex items-center justify-center text-[14px]">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white font-medium truncate">{token.address.slice(0,6)}…{token.address.slice(-4)}</div>
                    <div className="text-[11px] text-[#63666a]">{token.name}</div>
                  </div>
                  <div className="text-[11px] text-[#63666a]">{Math.max(0, 5-i)*2}m ago</div>
                  <div className="flex items-center gap-1.5 bg-[#01160e] border border-[#02100c] rounded-[6px] px-2.5 py-1">
                    <CheckCircle size={12} className="text-[#0baa3b]" />
                    <span className="text-[10px] text-[#0baa3b] font-medium">Verified</span>
                  </div>
                  <ExternalLink size={12} className="text-[#63666a]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rewards Banner */}
      <div className="bg-[#00090b] border border-[#081312] rounded-[8px] overflow-hidden">
        <div className="flex items-start gap-4 p-4">
          <div className="w-[100px] h-[100px] rounded-[8px] bg-[#0baa3b]/10 flex items-center justify-center flex-shrink-0">
            <Gift size={40} className="text-[#0baa3b]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#0baa3b] tracking-wider">REWARDS</span>
            </div>
            <h3 className="text-[16px] font-semibold text-white">Earn Rewards for Building</h3>
            <p className="text-[11px] text-[#63666a] mt-1">Deploy smart contracts and earn $RiN rewards on Robinhood Chain.</p>
            <button className="mt-3 flex items-center gap-1.5 bg-[#020c0c] border border-[#024420] rounded-[6px] px-3 py-1.5 text-[11px] text-[#0a9637]">
              Learn More <ExternalLink size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* GM / GN Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#00090b] border border-[#081312] rounded-[8px] p-4">
          <div className="text-center mb-3">
            <div className="text-[32px] mb-1">🌅</div>
            <h3 className="text-[14px] font-semibold text-white">Send GM</h3>
            <p className="text-[#63666a] text-[11px] mt-0.5">Once per day on {chainName}</p>
          </div>
          {isConnected && !isOnRH && <NetworkWarning chainName={chainName} switchToRH={switchToRH} switchingNetwork={switchingNetwork} />}
          {gmClaimed ? (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <div className="flex items-center gap-2 text-[#0baa3b] text-[12px] font-semibold"><CheckCircle size={15} /> GM sent today!</div>
              {gmTxHash && <a href={`${explorerUrl}/tx/${gmTxHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#0baa3b]">View tx</a>}
            </div>
          ) : (
            <button onClick={sendGm} disabled={sendingGm} className="w-full flex items-center justify-center gap-2 bg-[#0baa3b] hover:bg-[#46D67B] disabled:opacity-40 text-[#000305] font-semibold text-[13px] h-[40px] rounded-[8px] transition-colors">
              {sendingGm ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {sendingGm ? "Sending…" : "GM 🌅"}
            </button>
          )}
        </div>
        <div className="bg-[#00090b] border border-[#081312] rounded-[8px] p-4">
          <div className="text-center mb-3">
            <div className="text-[32px] mb-1">🌙</div>
            <h3 className="text-[14px] font-semibold text-white">Send GN</h3>
            <p className="text-[#63666a] text-[11px] mt-0.5">Once per day on {chainName}</p>
          </div>
          {isConnected && !isOnRH && <NetworkWarning chainName={chainName} switchToRH={switchToRH} switchingNetwork={switchingNetwork} />}
          {gnClaimed ? (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <div className="flex items-center gap-2 text-[#7A8CFF] text-[12px] font-semibold"><CheckCircle size={15} /> GN sent today!</div>
              {gnTxHash && <a href={`${explorerUrl}/tx/${gnTxHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#7A8CFF]">View tx</a>}
            </div>
          ) : (
            <button onClick={sendGn} disabled={sendingGn} className="w-full flex items-center justify-center gap-2 bg-[#7A8CFF] hover:bg-[#5A6EE0] disabled:opacity-40 text-white font-semibold text-[13px] h-[40px] rounded-[8px] transition-colors">
              {sendingGn ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {sendingGn ? "Sending…" : "GN 🌙"}
            </button>
          )}
        </div>
      </div>

      {/* XP Claim Card */}
      <div className="bg-[#00090b] border border-[#081312] rounded-[8px] p-4">
        <div className="text-center mb-3">
          <div className="w-12 h-12 rounded-full bg-[#7A8CFF]/10 border border-[#7A8CFF]/25 flex items-center justify-center mx-auto mb-2">
            <Gift size={20} className="text-[#7A8CFF]" />
          </div>
          <h3 className="text-[16px] font-semibold text-white">Claim 25 XP Daily</h3>
          <p className="text-[#63666a] text-[11px] mt-0.5">Claim your XP every 24 hours on {chainName}</p>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          {[
            { label: "Daily XP", value: "25 XP", icon: <Gift size={12} /> },
            { label: "Daily Streak", value: `${xpStreak} day${xpStreak === 1 ? "" : "s"}`, icon: <Flame size={12} className="text-[#FFB547]" /> },
            { label: "Weekly Bonus", value: xpStreak >= 7 ? "+50 XP unlocked!" : `${7 - (xpStreak % 7)} days to +50 XP`, icon: <TrendingUp size={12} className="text-[#0baa3b]" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex justify-between items-center py-1.5 border-b border-[#081312] last:border-0">
              <span className="text-[#63666a] text-[12px] flex items-center gap-2">{icon} {label}</span>
              <span className="text-white text-[12px] font-medium">{value}</span>
            </div>
          ))}
        </div>
        <button onClick={claimXp} disabled={claimingXp || xpClaimed} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A8CFF] to-[#5AE4A8] hover:brightness-110 disabled:opacity-40 text-[#000305] font-semibold text-[13px] h-[44px] rounded-[8px] transition-all">
          {claimingXp ? <Loader2 size={15} className="animate-spin" /> : <Gift size={15} />} {xpClaimed ? "XP Claimed ✓" : "Claim 25 XP"}
        </button>
        {xpTxHash && <a href={`${explorerUrl}/tx/${xpTxHash}`} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#7A8CFF]"><CheckCircle size={10} /> View transaction</a>}
      </div>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
    </svg>
  );
}
