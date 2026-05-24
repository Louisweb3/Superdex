import { Card, CardContent } from "@/components/ui/card";

const rewardItems = [
  {
    id: "total-rewards-paid",
    label: "TOTAL REWARDS PAID",
    value: "$2,481,092",
    description: "Paid to 18,742 users",
    iconSrc: "/figmaAssets/image-24.png",
    dividerSrc: "/figmaAssets/background-9.png",
    valueClassName: "text-[#d0d2d6] text-[29px] font-normal leading-none",
    labelClassName: "text-[#6c778a] text-sm font-medium leading-none",
    descriptionClassName: "text-[#667082] text-sm font-normal leading-none",
    iconClassName: "h-[66px] w-[65px]",
  },
  {
    id: "you-earned-today",
    label: "YOU EARNED TODAY",
    value: "$12.47",
    description: "6 swaps",
    iconSrc: "/figmaAssets/image-23.png",
    dividerSrc: "/figmaAssets/background-8.png",
    valueClassName: "text-[#3acd5b] text-[28px] font-bold leading-none",
    labelClassName: "text-[#646d7f] text-sm font-normal leading-none",
    descriptionClassName: "text-[#5f6979] text-[15px] font-normal leading-none",
    iconClassName: "h-[66px] w-[66px]",
  },
  {
    id: "your-streak",
    label: "YOUR STREAK",
    value: "7 DAYS",
    description: "Keep it going!",
    iconSrc: "/figmaAssets/image-22.png",
    valueClassName: "text-[#c3c6ca] text-[28px] font-normal leading-none",
    labelClassName: "text-[#5c6677] text-[13px] font-bold leading-none",
    descriptionClassName: "text-[#576070] text-[15px] font-normal leading-none",
    iconClassName: "h-[66px] w-[66px]",
  },
];

export const RewardsOverviewSection = (): JSX.Element => {
  return (
    <section className="mb-[15px] w-full">
      <Card className="h-auto w-full rounded-[22px] border border-solid border-[#131b27] bg-[#00040e] shadow-none">
        <CardContent className="p-0">
          <div className="grid min-h-[149px] grid-cols-1 divide-y divide-[#101723] md:grid-cols-3 md:divide-x md:divide-y-0">
            {rewardItems.map((item) => (
              <article
                key={item.id}
                className="flex min-w-0 items-center gap-4 px-5 py-5 md:px-6 md:py-7"
              >
                <img
                  className={`shrink-0 object-cover ${item.iconClassName}`}
                  alt={item.label}
                  src={item.iconSrc}
                />
                <div className="min-w-0 flex-1">
                  <header className="mb-[14px]">
                    <p
                      className={`[font-family:'Inter',Helvetica] tracking-[0] ${item.labelClassName}`}
                    >
                      {item.label}
                    </p>
                  </header>
                  <p
                    className={`mb-[10px] whitespace-nowrap [font-family:'Inter',Helvetica] tracking-[0] ${item.valueClassName}`}
                  >
                    {item.value}
                  </p>
                  <p
                    className={`[font-family:'Inter',Helvetica] tracking-[0] ${item.descriptionClassName}`}
                  >
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
