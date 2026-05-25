import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletContext } from "@/context/WalletContext";
import { useRewardUser } from "@/hooks/useRewards";
import { usePublicSettings } from "@/hooks/useAdmin";

function fmtUsd(n: number | undefined | null) {
  if (n == null || isNaN(n)) return "$0.00";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(2) + "k";
  return "$" + n.toFixed(2);
}

function useGlobalStats() {
  return useQuery<{ totalCashbackUsd: number; totalSwapEvents: number; totalUsers: number }>({
    queryKey: ["/api/rewards/stats"],
    queryFn: () => fetch("/api/rewards/stats").then((r) => r.json()),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export const RewardsOverviewSection = (): JSX.Element => {
  const wallet = useWalletContext();
  const addr = wallet.isConnected ? wallet.address : null;
  const { data: user } = useRewardUser(addr);
  const { data: stats } = useGlobalStats();
  const { data: settings } = usePublicSettings();

  // Admin overrides: use CMS setting if available, else fall back to computed + seed
  const adminTotalRewards = settings?.total_rewards_paid;
  const totalRewardsPaid = adminTotalRewards
    ? adminTotalRewards
    : stats?.totalCashbackUsd
    ? fmtUsd(stats.totalCashbackUsd + 2_481_092)
    : "$2,481,092";

  const todayEarned = user ? fmtUsd(user.cashback_usd) : (addr ? "Loading…" : "$0.00");
  const todaySwaps  = user ? `${user.total_swaps} swaps` : "—";
  const streakValue = user ? `${user.streak} DAYS` : "0 DAYS";
  const streakDesc  = user && user.streak > 0 ? "Keep it going!" : addr ? "Start swapping!" : "Connect wallet";

  const rewardItems = [
    {
      id: "total-rewards-paid",
      label: "TOTAL REWARDS PAID",
      value: totalRewardsPaid,
      description: `Paid to ${(stats?.totalUsers ?? 18742).toLocaleString()} users`,
      iconSrc: "/figmaAssets/image-24.png",
      valueClassName: "text-[#d0d2d6] text-[24px] sm:text-[29px] font-normal leading-none",
      labelClassName: "text-[#6c778a] text-xs sm:text-sm font-medium leading-none",
      descriptionClassName: "text-[#667082] text-xs sm:text-sm font-normal leading-none",
      iconClassName: "h-[52px] w-[52px] sm:h-[66px] sm:w-[65px]",
    },
    {
      id: "you-earned-today",
      label: "YOU EARNED TODAY",
      value: todayEarned,
      description: todaySwaps,
      iconSrc: "/figmaAssets/image-23.png",
      valueClassName: "text-[#3acd5b] text-[23px] sm:text-[28px] font-bold leading-none",
      labelClassName: "text-[#646d7f] text-xs sm:text-sm font-normal leading-none",
      descriptionClassName: "text-[#5f6979] text-[13px] sm:text-[15px] font-normal leading-none",
      iconClassName: "h-[52px] w-[52px] sm:h-[66px] sm:w-[66px]",
    },
    {
      id: "your-streak",
      label: "YOUR STREAK",
      value: streakValue,
      description: streakDesc,
      iconSrc: "/figmaAssets/image-22.png",
      valueClassName: "text-[#c3c6ca] text-[23px] sm:text-[28px] font-normal leading-none",
      labelClassName: "text-[#5c6677] text-[11px] sm:text-[13px] font-bold leading-none",
      descriptionClassName: "text-[#576070] text-[13px] sm:text-[15px] font-normal leading-none",
      iconClassName: "h-[52px] w-[52px] sm:h-[66px] sm:w-[66px]",
    },
  ];

  return (
    <section className="mb-[12px] sm:mb-[15px] w-full">
      <Card className="h-auto w-full rounded-[18px] sm:rounded-[22px] border border-solid border-[#131b27] bg-[#00040e] shadow-none">
        <CardContent className="p-0">
          <div className="grid min-h-[120px] sm:min-h-[149px] grid-cols-1 divide-y divide-[#101723] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {rewardItems.map((item) => (
              <article
                key={item.id}
                className="flex min-w-0 items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-7"
                data-testid={`card-${item.id}`}
              >
                <img
                  className={`shrink-0 object-cover ${item.iconClassName}`}
                  alt={item.label}
                  src={item.iconSrc}
                />
                <div className="min-w-0 flex-1">
                  <header className="mb-2 sm:mb-[14px]">
                    <p className={`font-['Inter',Helvetica] tracking-[0] ${item.labelClassName}`}>
                      {item.label}
                    </p>
                  </header>
                  <p className={`mb-1.5 sm:mb-[10px] whitespace-nowrap font-['Inter',Helvetica] tracking-[0] ${item.valueClassName}`}>
                    {item.value}
                  </p>
                  <p className={`font-['Inter',Helvetica] tracking-[0] ${item.descriptionClassName}`}>
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
