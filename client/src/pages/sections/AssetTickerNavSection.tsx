const tickerItems = [
  {
    symbol: "ETH",
    price: "$3,452.21",
    change: "+1.23%",
    changeColor: "text-[#249647]",
    iconSrc: "/figmaAssets/image-7.png",
  },
  {
    symbol: "cbBTC",
    price: "$77,221",
    change: "-0.01%",
    changeColor: "text-[#7f1930]",
    iconSrc: "/figmaAssets/image-6.png",
  },
  {
    symbol: "USDC",
    price: "$0.9998",
    change: "+0.01%",
    changeColor: "text-[#20833f]",
    iconSrc: "/figmaAssets/image-5.png",
  },
  {
    symbol: "ETH",
    price: "$3,452.21",
    change: "+1.23%",
    changeColor: "text-[#249647]",
    iconSrc: "/figmaAssets/image-7.png",
  },
  {
    symbol: "cbBTC",
    price: "$77,221",
    change: "-0.01%",
    changeColor: "text-[#7f1930]",
    iconSrc: "/figmaAssets/image-6.png",
  },
  {
    symbol: "USDC",
    price: "$0.9998",
    change: "+0.01%",
    changeColor: "text-[#20833f]",
    iconSrc: "/figmaAssets/image-5.png",
  },
];

const navItems = [
  {
    value: "home",
    label: "Home",
    iconSrc: "/figmaAssets/image-4.png",
    activeBg: "/figmaAssets/background-1.png",
    activeUnderline: "/figmaAssets/background-2.png",
  },
  {
    value: "swap",
    label: "Swap",
    iconSrc: "/figmaAssets/image-3.png",
  },
  {
    value: "rewards",
    label: "Rewards",
    iconSrc: "/figmaAssets/image-2.png",
  },
  {
    value: "analytics",
    label: "Analytics",
    iconSrc: "/figmaAssets/image-1.png",
  },
  {
    value: "history",
    label: "History",
    iconSrc: "/figmaAssets/image.png",
  },
] as const;

const inactiveColors: Record<string, string> = {
  swap: "text-[#616c7e]",
  rewards: "text-[#5f687a]",
  analytics: "text-[#565f70]",
  history: "text-[#5b6577]",
};

const iconSizes: Record<string, string> = {
  home: "h-7 w-[27px]",
  swap: "h-7 w-[25px]",
  rewards: "h-[27px] w-7",
  analytics: "h-[26px] w-[26px]",
  history: "h-7 w-7",
};

interface AssetTickerNavSectionProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AssetTickerNavSection = ({
  activeTab,
  onTabChange,
}: AssetTickerNavSectionProps): JSX.Element => {
  return (
    <section className="relative w-full">
      <div className="w-full border-y-[3px] border-[#060c18] bg-transparent">
        <div className="w-full overflow-hidden border-b border-[#060c18]">
          <div className="flex w-max items-center ticker-track">
            {tickerItems.map((item, i) => (
              <div key={i} className="flex items-center">
                <div className="flex items-center gap-2 px-4 sm:px-5 py-[18px] sm:py-[21px]">
                  <img
                    className="h-[26px] w-[26px] sm:h-[31px] sm:w-[31px] object-cover"
                    alt={item.symbol}
                    src={item.iconSrc}
                  />
                  <div className="flex items-center gap-2 sm:gap-3 text-[14px] sm:text-[17px] tracking-[0] leading-[normal] font-['Inter',Helvetica] font-normal whitespace-nowrap">
                    <span className="text-[#999da6]">{item.symbol}</span>
                    <span className="text-[#898d94]">{item.price}</span>
                    <span className={item.changeColor}>{item.change}</span>
                  </div>
                </div>
                <div className="h-[24px] w-px bg-[#1a2535] shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <nav aria-label="Main navigation" className="w-full">
          <div className="w-full">
            <div className="grid w-full grid-cols-5 gap-0">
              {navItems.map((item) => {
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onTabChange(item.value)}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className="relative flex h-[90px] sm:h-[114px] w-full flex-col items-center justify-end pb-[16px] sm:pb-[24px] focus:outline-none transition-all"
                  >
                    {isActive ? (
                      <>
                        <img
                          className="absolute bottom-[8px] sm:bottom-[10px] h-[72px] sm:h-[88px] w-[120px] sm:w-[164px] object-cover pointer-events-none"
                          alt=""
                          src={(item as any).activeBg}
                        />
                        <img
                          className="absolute bottom-[8px] sm:bottom-[10px] h-[3px] w-[100px] sm:w-[134px] object-cover pointer-events-none"
                          alt=""
                          src={(item as any).activeUnderline}
                        />
                        <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2">
                          <img
                            className={`${iconSizes[item.value]} object-cover`}
                            alt={item.label}
                            src={item.iconSrc}
                          />
                          <span className="text-[13px] sm:text-base tracking-[0] leading-[normal] font-['Inter',Helvetica] font-normal text-[#2dae50]">
                            {item.label}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 sm:gap-[11px]">
                        <img
                          className={`${iconSizes[item.value]} object-cover opacity-70`}
                          alt={item.label}
                          src={item.iconSrc}
                        />
                        <span
                          className={`text-[13px] sm:text-base tracking-[0] leading-[normal] font-['Inter',Helvetica] font-normal ${inactiveColors[item.value] ?? "text-[#5b6577]"}`}
                        >
                          {item.label}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </section>
  );
};
