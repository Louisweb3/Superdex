import { useState } from "react";
import { useLocation } from "wouter";
import { useMarketPrices, type MarketPrice } from "@/hooks/useRewards";
import { Grid3x3, User, BookOpen, BarChart2, X } from "lucide-react";
import earnIcon from "@assets/token_logo_1779819572574.png";

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
  { value: "home",    label: "Home",    iconSrc: "/figmaAssets/image-4.png" },
  { value: "swap",    label: "Swap",    iconSrc: "/figmaAssets/image-3.png" },
  { value: "rewards", label: "Cashback", iconSrc: "/figmaAssets/image-2.png" },
  { value: "earn",    label: "Rewards", iconSrc: earnIcon },
  { value: "vault",   label: "Vault",   iconSrc: "/figmaAssets/image-1.png" },
] as const;

const iconSizes: Record<string, string> = {
  home: "h-7 w-[27px]", swap: "h-7 w-[25px]", rewards: "h-[27px] w-7",
  earn: "h-8 w-8", vault: "h-[26px] w-[26px]",
};

const MORE_ITEMS = [
  { value: "profile",   label: "Profile",   icon: User,     color: "#2dae50",  desc: "Rewards, referrals & X" },
  { value: "docs",      label: "Docs",      icon: BookOpen, color: "#4d8ab8",  desc: "Guides & documentation" },
  { value: "analytics", label: "Analytics", icon: null,     iconSrc: "/figmaAssets/image.png", color: "#a84dda", desc: "Trading analytics" },
] as const;

interface AssetTickerNavSectionProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AssetTickerNavSection = ({
  activeTab,
  onTabChange,
}: AssetTickerNavSectionProps): JSX.Element => {
  const { data: prices } = useMarketPrices();
  const [, navigate] = useLocation();
  const tickerPrices = prices ?? FALLBACK_PRICES;
  const tickerItems = [...tickerPrices, ...tickerPrices];
  const [showMore, setShowMore] = useState(false);

  const moreActive = activeTab === "analytics" || activeTab === "profile";

  const handleMoreItem = (value: string) => {
    setShowMore(false);
    if (value === "docs") { navigate("/docs"); return; }
    onTabChange(value);
  };

  return (
    <section className="relative w-full">
      {/* Scrolling price ticker */}
      <div className="w-full overflow-hidden border-b border-[#060c18] bg-[#020816]/90 backdrop-blur-md">
        <div className="flex w-max items-center ticker-track">
          {tickerItems.map((item, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2 px-4 sm:px-5 py-[14px] sm:py-[16px]">
                <img className="h-[24px] w-[24px] sm:h-[28px] sm:w-[28px] object-cover rounded-full" alt={item.symbol} src={item.iconSrc} />
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

      {/* More drop-up overlay */}
      {showMore && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-full left-0 right-0 z-50 px-3 pb-2">
            <div className="rounded-[20px] border border-[#1a2535] bg-[#060e18]/98 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d1b2a]">
                <span className="text-[13px] font-semibold text-[#cfd8e3]">More</span>
                <button
                  onClick={() => setShowMore(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#1a2535] text-[#5f6a7c] hover:text-[#cfd8e3]"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="p-2">
                {MORE_ITEMS.map((item) => {
                  const isActive = activeTab === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => handleMoreItem(item.value)}
                      data-testid={`button-more-${item.value}`}
                      className={`flex w-full items-center gap-3 rounded-[14px] px-4 py-3 transition-colors text-left ${isActive ? "bg-[#0d2b1a]" : "hover:bg-[#0d1520]"}`}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                        style={{ borderColor: `${item.color}33`, background: `${item.color}12` }}
                      >
                        {item.icon ? (
                          <item.icon size={18} style={{ color: item.color }} />
                        ) : (
                          <img src={(item as any).iconSrc} alt={item.label} className="h-6 w-6 object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold" style={{ color: isActive ? item.color : "#cfd8e3" }}>{item.label}</p>
                        <p className="text-[11px] text-[#5f6a7c]">{item.desc}</p>
                      </div>
                      {isActive && (
                        <div className="ml-auto h-2 w-2 rounded-full" style={{ background: item.color }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom nav */}
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
                    <img className="absolute bottom-[4px] sm:bottom-[6px] h-[58px] sm:h-[72px] w-[100px] sm:w-[134px] object-cover pointer-events-none" alt="" src="/figmaAssets/background-1.png" />
                    <img className="absolute bottom-[4px] sm:bottom-[6px] h-[3px] w-[80px] sm:w-[108px] object-cover pointer-events-none" alt="" src="/figmaAssets/background-2.png" />
                    <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-2">
                      <img className={`${iconSizes[item.value]} object-cover`} alt={item.label} src={item.iconSrc} />
                      <span className="text-[11px] sm:text-[13px] font-['Inter',Helvetica] font-normal text-[#2dae50]">{item.label}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <img className={`${iconSizes[item.value]} object-cover opacity-60`} alt={item.label} src={item.iconSrc} />
                    <span className="text-[11px] sm:text-[13px] font-['Inter',Helvetica] font-normal text-[#5b6577]">{item.label}</span>
                  </div>
                )}
              </button>
            );
          })}

          {/* More button — 6th slot */}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-label="More"
            data-testid="button-nav-more"
            className="relative flex h-[72px] sm:h-[90px] w-full flex-col items-center justify-end pb-[10px] sm:pb-[14px] focus:outline-none transition-all active:scale-95"
          >
            {moreActive ? (
              <>
                <img className="absolute bottom-[4px] sm:bottom-[6px] h-[58px] sm:h-[72px] w-[100px] sm:w-[134px] object-cover pointer-events-none" alt="" src="/figmaAssets/background-1.png" />
                <img className="absolute bottom-[4px] sm:bottom-[6px] h-[3px] w-[80px] sm:w-[108px] object-cover pointer-events-none" alt="" src="/figmaAssets/background-2.png" />
                <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-2">
                  <Grid3x3 size={24} className="text-[#2dae50]" />
                  <span className="text-[11px] sm:text-[13px] font-['Inter',Helvetica] font-normal text-[#2dae50]">More</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <Grid3x3 size={24} className={showMore ? "text-[#2dae50]" : "text-[#5b6577] opacity-60"} />
                <span className={`text-[11px] sm:text-[13px] font-['Inter',Helvetica] font-normal ${showMore ? "text-[#2dae50]" : "text-[#5b6577]"}`}>More</span>
              </div>
            )}
          </button>
        </div>
      </nav>
    </section>
  );
};
