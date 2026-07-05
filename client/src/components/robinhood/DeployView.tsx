import { Coins, Loader2, Zap, Info } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface DeployViewProps {
  tokenName: string;
  setTokenName: (v: string) => void;
  tokenSymbol: string;
  setTokenSymbol: (v: string) => void;
  tokenSupply: string;
  setTokenSupply: (v: string) => void;
  deploying: boolean;
  deployToken: () => void;
  chainName: string;
  isConnected: boolean;
  isOnRH: boolean;
  switchToRH: () => void;
  switchingNetwork: boolean;
}

export function DeployView({
  tokenName,
  setTokenName,
  tokenSymbol,
  setTokenSymbol,
  tokenSupply,
  setTokenSupply,
  deploying,
  deployToken,
  chainName,
  isConnected,
  isOnRH,
  switchToRH,
  switchingNetwork,
}: DeployViewProps) {
  const canDeploy = !!tokenName && !!tokenSymbol && !!tokenSupply;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[12px] bg-[#5AE4A8]/10 border border-[#5AE4A8]/20 flex items-center justify-center">
            <Coins size={18} className="text-[#5AE4A8]" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-white">
              Create ERC-20 Token
            </h2>
            <p className="text-[12px] text-[#8B97A8]">
              Deploy to {chainName} Mainnet
            </p>
          </div>
        </div>

        {isConnected && !isOnRH && (
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
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-medium text-[#8B97A8] uppercase tracking-wider mb-1.5 block">
              Token Name
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. My Awesome Token"
              data-testid="input-token-name"
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-[#5AE4A8]/50 focus:bg-white/[0.03] rounded-[12px] px-4 py-3 text-white text-[14px] outline-none transition-all placeholder:text-[#5E6B7A]"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#8B97A8] uppercase tracking-wider mb-1.5 block">
              Token Symbol
            </label>
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) =>
                setTokenSymbol(e.target.value.toUpperCase().slice(0, 8))
              }
              placeholder="e.g. MAT"
              data-testid="input-token-symbol"
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-[#5AE4A8]/50 focus:bg-white/[0.03] rounded-[12px] px-4 py-3 text-white text-[14px] outline-none transition-all placeholder:text-[#5E6B7A]"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#8B97A8] uppercase tracking-wider mb-1.5 block">
              Initial Supply
            </label>
            <input
              type="number"
              value={tokenSupply}
              onChange={(e) => setTokenSupply(e.target.value)}
              placeholder="1000000"
              data-testid="input-token-supply"
              className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-[#5AE4A8]/50 focus:bg-white/[0.03] rounded-[12px] px-4 py-3 text-white text-[14px] outline-none transition-all placeholder:text-[#5E6B7A]"
            />
            <p className="text-[11px] text-[#5E6B7A] mt-1.5">
              Decimals: 18 (standard ERC-20)
            </p>
          </div>

          <button
            onClick={deployToken}
            disabled={deploying || !canDeploy}
            data-testid="button-deploy-token"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-[#5AE4A8] to-[#46D67B] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-[#05070A] font-semibold text-[14px] h-[48px] rounded-[14px] shadow-[0_4px_24px_rgba(90,228,168,0.25)] transition-all duration-200 mt-2"
          >
            {deploying ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Zap size={17} />
            )}
            {deploying ? "Deploying…" : "Deploy Token"}
          </button>
        </div>
      </GlassCard>

      {/* Live preview */}
      <div className="flex flex-col gap-4">
        <GlassCard className="p-6">
          <h3 className="text-[13px] font-semibold text-[#8B97A8] uppercase tracking-wider mb-4">
            Live Preview
          </h3>
          <div className="flex items-center gap-3 mb-5 p-4 rounded-[14px] bg-white/[0.02] border border-white/[0.05]">
            <div className="w-12 h-12 rounded-full bg-[#5AE4A8]/10 border border-[#5AE4A8]/25 flex items-center justify-center">
              <span className="text-[#5AE4A8] text-[13px] font-semibold">
                {(tokenSymbol || "TKN").slice(0, 3)}
              </span>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-white">
                {tokenName || "Token Name"}
              </div>
              <div className="text-[12px] text-[#8B97A8] font-mono">
                {tokenSymbol || "SYMBOL"}
              </div>
            </div>
          </div>
          {[
            {
              label: "Total Supply",
              value: `${Number(tokenSupply || 0).toLocaleString()} ${tokenSymbol || ""}`,
            },
            { label: "Decimals", value: "18" },
            { label: "Chain", value: chainName },
            { label: "Owner", value: "Connected wallet (100% supply)" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-center py-2.5 border-b border-white/[0.05] last:border-0"
            >
              <span className="text-[#8B97A8] text-[13px]">{label}</span>
              <span className="text-[#e5e5e5] text-[13px] font-medium text-right">
                {value}
              </span>
            </div>
          ))}
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-[14px] font-semibold text-white mb-4">
            What happens when you deploy?
          </h3>
          {[
            {
              n: 1,
              text: "Your ERC-20 contract is compiled and signed locally in your wallet",
            },
            {
              n: 2,
              text: `The contract is broadcast to ${chainName} Mainnet`,
            },
            {
              n: 3,
              text: "Your wallet receives 100% of the initial supply",
            },
            {
              n: 4,
              text: "The contract is saved and viewable in My Contracts",
            },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-5 h-5 rounded-full bg-[#5AE4A8] text-[#05070A] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {n}
              </div>
              <p className="text-[13px] text-[#8B97A8] leading-snug">
                {text}
              </p>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}
