import { CheckCircle, ExternalLink, Gift, Loader2, Flame, TrendingUp, Info } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface RewardsViewProps {
  chainName: string;
  explorerUrl: string;

  xpClaimed: boolean;
  claimingXp: boolean;
  xpTxHash: string;
  claimXp: () => void;
  xpStreak: number;
}

export function RewardsView({
  chainName,
  explorerUrl,
  xpClaimed,
  claimingXp,
  xpTxHash,
  claimXp,
  xpStreak,
}: RewardsViewProps) {
  const daysToBonus = 7 - (xpStreak % 7 === 0 && xpStreak > 0 ? 7 : xpStreak % 7);
  const weeklyBonusesEarned = Math.floor(xpStreak / 7) * 50;

  return (
    <div className="max-w-[520px]">
      {/* XP card */}
      <GlassCard className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#7A8CFF]/10 border border-[#7A8CFF]/25 flex items-center justify-center mx-auto mb-4">
            <Gift size={26} className="text-[#7A8CFF]" />
          </div>
          <h2 className="text-[18px] font-semibold text-[var(--rh-text)]">
            Claim 25 XP Daily
          </h2>
          <p className="text-[var(--rh-text-secondary)] text-[13px] mt-2">
            Claim your XP every 24 hours and build a streak on {chainName}.
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {[
            {
              label: "Daily XP",
              value: "25 XP",
              icon: <Gift size={13} />,
            },
            {
              label: "Daily Streak",
              value: `${xpStreak} day${xpStreak === 1 ? "" : "s"}`,
              icon: <Flame size={13} className="text-[#FFB547]" />,
            },
            {
              label: "Weekly Streak Bonus",
              value:
                weeklyBonusesEarned > 0
                  ? `+${weeklyBonusesEarned} XP earned`
                  : `${daysToBonus} day${daysToBonus === 1 ? "" : "s"} to +50 XP`,
              icon: <TrendingUp size={13} className="text-[#46D67B]" />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="flex justify-between items-center py-2 border-b border-[var(--rh-border-05)] last:border-0"
            >
              <span className="text-[var(--rh-text-secondary)] text-[13px] flex items-center gap-2">
                {icon}
                {label}
              </span>
              <span className="text-[var(--rh-text)] text-[13px] font-medium">
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#7A8CFF]/[0.06] border border-[#7A8CFF]/20 rounded-[12px] px-4 py-3 mb-4">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-[#7A8CFF] flex-shrink-0 mt-0.5" />
            <p className="text-[#7A8CFF]/90 text-[12px] leading-relaxed">
              Claim daily to keep your streak alive. Every 7-day streak
              unlocks a +50 XP bonus.
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

        {xpTxHash && (
          <a
            href={`${explorerUrl}/tx/${xpTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[#7A8CFF] hover:text-[#5AE4A8] transition-colors"
            data-testid="link-xp-tx"
          >
            <CheckCircle size={12} />
            View transaction
            <ExternalLink size={12} />
          </a>
        )}
      </GlassCard>
    </div>
  );
}
