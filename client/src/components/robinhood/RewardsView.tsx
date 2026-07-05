import { CheckCircle, ExternalLink, Gift, Loader2, Flame, TrendingUp, Info, Trophy } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface RewardsViewProps {
  chainName: string;
  explorerUrl: string;

  claimedToday: boolean;
  claimingXp: boolean;
  xpTxHash: string;
  claimXp: () => void;
  streak: number;
  totalXp: number;
  isConnected: boolean;
}

export function RewardsView({
  chainName,
  explorerUrl,
  claimedToday,
  claimingXp,
  xpTxHash,
  claimXp,
  streak,
  totalXp,
  isConnected,
}: RewardsViewProps) {
  const dayInCycle = streak > 0 ? ((streak - 1) % 7) + 1 : 0;
  const daysToBonus = streak > 0 ? 7 - dayInCycle : 7;
  const weeklyBonusesEarned = Math.floor(streak / 7) * 200;

  return (
    <div className="flex flex-col gap-5 pt-2 max-w-[520px]">
      <h2 className="text-[16px] font-semibold text-white">Rewards</h2>

      {/* XP card */}
      <GlassCard className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#0baa3b]/10 border border-[#0baa3b]/25 flex items-center justify-center mx-auto mb-4">
            <Gift size={26} className="text-[#0baa3b]" />
          </div>
          <h2 className="text-[18px] font-semibold text-white">
            Claim 25 XP Daily
          </h2>
          <p className="text-[#c2c4c5] text-[13px] mt-2">
            Claim your XP every 24 hours and build a streak on {chainName}. Your XP is synced across the whole app.
          </p>
        </div>

        <div className="flex flex-col gap-1 mb-5">
          <div className="text-[10px] font-medium text-[#63666a] uppercase tracking-wider mb-2">7-Day Streak Tracker</div>
          <div className="flex items-center justify-between gap-1.5">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
              const filled = day <= dayInCycle;
              return (
                <div
                  key={day}
                  data-testid={`streak-day-${day}`}
                  className={`flex-1 aspect-square rounded-[8px] flex items-center justify-center border transition-colors ${
                    filled
                      ? "bg-[#0baa3b]/15 border-[#0baa3b]/40 text-[#0baa3b]"
                      : "bg-[#00090b] border-[#081312] text-[#3a3d40]"
                  }`}
                >
                  {day === 7 ? (
                    <Trophy size={14} className={filled ? "text-[#FFB547]" : "text-[#3a3d40]"} />
                  ) : filled ? (
                    <CheckCircle size={14} />
                  ) : (
                    <span className="text-[10px] font-medium">{day}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {[
            {
              label: "Total XP Earned",
              value: `${totalXp.toLocaleString()} XP`,
              icon: <Trophy size={13} className="text-[#FFB547]" />,
            },
            {
              label: "Daily Streak",
              value: `${streak} day${streak === 1 ? "" : "s"}`,
              icon: <Flame size={13} className="text-[#FFB547]" />,
            },
            {
              label: "7-Day Streak Bonus",
              value:
                weeklyBonusesEarned > 0
                  ? `+${weeklyBonusesEarned} XP earned`
                  : `${daysToBonus} day${daysToBonus === 1 ? "" : "s"} to +200 XP`,
              icon: <TrendingUp size={13} className="text-[#0baa3b]" />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="flex justify-between items-center py-2 border-b border-[#081312] last:border-0"
            >
              <span className="text-[#c2c4c5] text-[13px] flex items-center gap-2">
                {icon}
                {label}
              </span>
              <span className="text-white text-[13px] font-medium" data-testid={`text-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#0baa3b]/[0.06] border border-[#0baa3b]/20 rounded-[12px] px-4 py-3 mb-4">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-[#0baa3b] flex-shrink-0 mt-0.5" />
            <p className="text-[#0baa3b]/90 text-[12px] leading-relaxed">
              Claim daily to keep your streak alive. Every 7-day streak
              unlocks a +200 XP bonus. XP syncs everywhere in the app — GM/GN, deploys, quests, and claims.
            </p>
          </div>
        </div>

        <button
          onClick={claimXp}
          disabled={claimingXp || claimedToday || !isConnected}
          data-testid="button-claim-xp"
          className="w-full flex items-center justify-center gap-2 bg-[#0baa3b] hover:bg-[#46D67B] disabled:opacity-40 text-[#000305] font-semibold text-[14px] h-[48px] rounded-[14px] transition-all duration-200"
        >
          {claimingXp ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Gift size={16} />
          )}
          {!isConnected ? "Connect Wallet to Claim" : claimedToday ? "XP Claimed Today ✓" : "Claim 25 XP"}
        </button>

        {xpTxHash && (
          <a
            href={`${explorerUrl}/tx/${xpTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[#0baa3b] hover:text-[#46D67B] transition-colors"
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
