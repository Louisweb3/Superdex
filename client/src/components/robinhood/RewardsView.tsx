import { CheckCircle, ExternalLink, Gift, Loader2, Send, Info } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface RewardsViewProps {
  chainName: string;
  isConnected: boolean;
  isOnRH: boolean;
  switchToRH: () => void;
  switchingNetwork: boolean;

  gmClaimed: boolean;
  sendingGm: boolean;
  gmTxHash: string;
  sendGm: () => void;
  explorerUrl: string;

  xpClaimed: boolean;
  claimingXp: boolean;
  claimXp: () => void;
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

export function RewardsView({
  chainName,
  isConnected,
  isOnRH,
  switchToRH,
  switchingNetwork,
  gmClaimed,
  sendingGm,
  gmTxHash,
  sendGm,
  explorerUrl,
  xpClaimed,
  claimingXp,
  claimXp,
}: RewardsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[980px]">
      {/* GM card */}
      <GlassCard className="p-6">
        <div className="text-center mb-6">
          <div className="text-[44px] mb-3">🌅</div>
          <h2 className="text-[18px] font-semibold text-white">
            Send GM On-Chain
          </h2>
          <p className="text-[#8B97A8] text-[13px] mt-2">
            Send a "Good Morning" message on {chainName}. Once per day,
            recorded on-chain forever.
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
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2 text-[#46D67B] text-[14px] font-semibold">
              <CheckCircle size={19} />
              GM sent today!
            </div>
            <p className="text-[#8B97A8] text-[13px] text-center">
              Come back tomorrow to send another GM and keep your streak
              alive.
            </p>
            {gmTxHash && (
              <a
                href={`${explorerUrl}/tx/${gmTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] text-[#5AE4A8] hover:text-[#46D67B] transition-colors"
              >
                <ExternalLink size={12} />
                View transaction
              </a>
            )}
          </div>
        ) : (
          <button
            onClick={sendGm}
            disabled={sendingGm}
            data-testid="button-send-gm"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-[#5AE4A8] to-[#46D67B] hover:brightness-110 disabled:opacity-40 text-[#05070A] font-semibold text-[15px] h-[50px] rounded-[14px] shadow-[0_4px_24px_rgba(90,228,168,0.25)] transition-all duration-200"
          >
            {sendingGm ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {sendingGm ? "Sending…" : "GM 🌅"}
          </button>
        )}

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="text-[11px] text-[#5E6B7A] text-center">
            GM is stored on-chain as{" "}
            <code className="text-[#8B97A8]">0x474d</code> (UTF-8 encoded).
            Each GM uses a tiny amount of ETH for gas.
          </div>
        </div>
      </GlassCard>

      {/* XP card */}
      <GlassCard className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#7A8CFF]/10 border border-[#7A8CFF]/25 flex items-center justify-center mx-auto mb-4">
            <Gift size={26} className="text-[#7A8CFF]" />
          </div>
          <h2 className="text-[18px] font-semibold text-white">
            Claim 25 XP Daily
          </h2>
          <p className="text-[#8B97A8] text-[13px] mt-2">
            Claim 25 XP every 24 hours by interacting with the XP contract on{" "}
            {chainName}.
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {[
            { label: "Daily Reward", value: "25 XP" },
            {
              label: "Reset Time",
              value: "Every 24 hours (midnight UTC)",
            },
            { label: "Contract", value: "Announcement pending" },
            { label: "Network", value: chainName },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-center py-2 border-b border-white/[0.05] last:border-0"
            >
              <span className="text-[#8B97A8] text-[13px]">{label}</span>
              <span className="text-[#e5e5e5] text-[13px] font-medium">
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#FFB547]/[0.06] border border-[#FFB547]/20 rounded-[12px] px-4 py-3 mb-4">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-[#FFB547] flex-shrink-0 mt-0.5" />
            <p className="text-[#FFB547]/90 text-[12px] leading-relaxed">
              The XP claim contract address will be provided in an official
              announcement. Check back soon.
            </p>
          </div>
        </div>

        <button
          onClick={claimXp}
          disabled={claimingXp || xpClaimed}
          data-testid="button-claim-xp"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-[#7A8CFF] to-[#5AE4A8] hover:brightness-110 disabled:opacity-40 text-[#05070A] font-semibold text-[14px] h-[48px] rounded-[14px] transition-all duration-200"
        >
          {claimingXp ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Gift size={16} />
          )}
          {xpClaimed ? "XP Claimed Today ✓" : "Claim 25 XP"}
        </button>
      </GlassCard>
    </div>
  );
}
