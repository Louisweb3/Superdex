import { useMarketPrices, type MarketPrice } from "@/hooks/useRewards";

const FALLBACK_PRICES: MarketPrice[] = [
  { symbol: "ETH",   price: 0, change24h: 0, iconSrc: "/figmaAssets/image-7.png" },
  { symbol: "cbBTC", price: 0, change24h: 0, iconSrc: "/figmaAssets/image-6.png" },
  { symbol: "USDC",  price: 1, change24h: 0, iconSrc: "/figmaAssets/image-5.png" },
];

function formatPrice(p: number, symbol: string) {
  if (p === 0) return "—";
  if (symbol === "USDC") return "$1.00";
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return "$" + p.toFixed(2);
}

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
    activeBg: "/figmaAssets/background-1.png",
    activeUnderline: "/figmaAssets/background-2.png",
  },
  {
    value: "rewards",
    label: "Rewards",
    iconSrc: "/figmaAssets/image-2.png",
    activeBg: "/figmaAssets/background-1.png",
    activeUnderline: "/figmaAssets/background-2.png",
  },
  {
    value: "earn",
    label: "Earn",
    iconSrc: "/figmaAssets/image-earn.png",
    activeBg: "/figmaAssets/background-1.png",
    activeUnderline: "/figmaAssets/background-2.png",
  },
  {
    value: "vault",
    label: "Vault",
    iconSrc: "/figmaAssets/image-1.png",
    activeBg: "/figmaAssets/background-1.png",
    activeUnderline: "/figmaAssets/background-2.png",
  },
  {
    value: "analytics",
    label: "Analytics",
    iconSrc: "/figmaAssets/image.png",
    activeBg: "/figmaAssets/background-1.png",
    activeUnderline: "/figmaAssets/background-2.png",
  },
] as const;

const inactiveColors: Record<string, string> = {
  home: "text-[#4d5462]",
  swap: "text-[#616c7e]",
  rewards: "text-[#5f687a]",
  earn: "text-[#5a6375]",
  vault: "text-[#565f70]",
  analytics: "text-[#5b6577]",
};

const iconSizes: Record<string, string> = {
  home: "h-7 w-[27px]",
  swap: "h-7 w-[25px]",
  rewards: "h-[27px] w-7",
  earn: "h-[26px] w-[26px]",
  vault: "h-[26px] w-[26px]",
  analytics: "h-7 w-7",
};

interface AssetTickerNavSectionProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AssetTickerNavSection = ({
  activeTab,
  onTabChange,
}: AssetTickerNavSectionProps): JSX.Element => {
  const { data: prices } = useMarketPrices();
  const tickerPrices = prices ?? FALLBACK_PRICES;

  // Duplicate for seamless scroll loop
  const tickerItems = [...tickerPrices, ...tickerPrices];

  return (
    <section className="relative w-full">
      {/* Scrolling price ticker — frosted glass */}
      <div className="w-full overflow-hidden border-b border-[#060c18] bg-[#020816]/90 backdrop-blur-md">
        <div className="flex w-max items-center ticker-track">
          {tickerItems.map((item, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2 px-4 sm:px-5 py-[14px] sm:py-[16px]">
                <img
                  className="h-[24px] w-[24px] sm:h-[28px] sm:w-[28px] object-cover rounded-full"
                  alt={item.symbol}
                  src={item.iconSrc}
                />
                <div className="flex items-center gap-2 sm:gap-3 text-[13px] sm:text-[16px] tracking-[0] leading-[normal] font-['Inter',Helvetica] font-normal whitespace-nowrap">
                  <span className="font-bold text-[#aaaeb6]">{item.symbol}</span>
                  <span className="text-[#898d94]">{formatPrice(item.price, item.symbol)}</span>
                  <span className={item.change24h >= 0 ? "text-[#20833f]" : "text-[#7f1930]"}>
                    {item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="h-[22px] w-px bg-[#1a2535] shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav — glassy, stays fixed on viewport */}
      <nav
        aria-label="Main navigation"
        className="w-full border-y-[3px] border-[#060c18] bg-[#020816]/95 backdrop-blur-xl"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <div className="grid w-full grid-cols-6 gap-0">
          {navItems.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onTabChange(item.value)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                data-testid={`button-nav-${item.value}`}
                className="relative flex h-[72px] sm:h-[90px] w-full flex-col items-center justify-end pb-[10px] sm:pb-[14px] focus:outline-none transition-all active:scale-95"
              >
                {isActive ? (
                  <>
                    <img
                      className="absolute bottom-[4px] sm:bottom-[6px] h-[58px] sm:h-[72px] w-[100px] sm:w-[134px] object-cover pointer-events-none"
                      alt=""
                      src={item.activeBg}
                    />
                    <img
                      className="absolute bottom-[4px] sm:bottom-[6px] h-[3px] w-[80px] sm:w-[108px] object-cover pointer-events-none"
                      alt=""
                      src={item.activeUnderline}
                    />
                    <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-2">
                      <img
                        className={`${iconSizes[item.value]} object-cover`}
                        alt={item.label}
                        src={item.iconSrc}
                      />
                      <span className="text-[11px] sm:text-[13px] tracking-[0] leading-[normal] font-['Inter',Helvetica] font-normal text-[#2dae50]">
                        {item.label}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <img
                      className={`${iconSizes[item.value]} object-cover opacity-60`}
                      alt={item.label}
                      src={item.iconSrc}
                    />
                    <span
                      className={`text-[11px] sm:text-[13px] tracking-[0] leading-[normal] font-['Inter',Helvetica] font-normal ${inactiveColors[item.value] ?? "text-[#5b6577]"}`}
                    >
                      {item.label}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </section>
  );
};
