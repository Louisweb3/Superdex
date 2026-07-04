import { useLocation } from "wouter";
import rhBannerSrc from "@assets/B24A8016-13DF-4C1F-A843-15347BD40816_1782981867823.png";
import { Card, CardContent } from "@/components/ui/card";
import { AppHeaderSection } from "./sections/AppHeaderSection";
import { AssetTickerNavSection } from "./sections/AssetTickerNavSection";
import { DEXHighlightsSection } from "./sections/DEXHighlightsSection";
import { RewardsOverviewSection } from "./sections/RewardsOverviewSection";
import { SuperTokenPromoSection } from "./sections/SuperTokenPromoSection";
import { SwapHeroSection } from "./sections/SwapHeroSection";
import { PlaceholderPage } from "./sections/PlaceholderPage";
import { SwapPage } from "./SwapPage";
import { RewardsPage } from "./RewardsPage";
import { VaultPage } from "./VaultPage";
import { EarnPage } from "./EarnPage";
import { LaunchPage } from "./LaunchPage";
import { AnalyticsPage } from "./AnalyticsPage";
import { ProfilePage } from "./ProfilePage";
import { AirdropPage } from "./AirdropPage";
import { RobinhoodPlaygroundPage } from "./RobinhoodPlaygroundPage";
import { FarmPage } from "./FarmPage";

// Map URL paths → tab names, and vice-versa
const PATH_TO_TAB: Record<string, string> = {
  "/": "home",
  "/app": "home",
  "/swap": "swap",
  "/rewards": "rewards",
  "/earn": "earn",
  "/vault": "vault",
  "/launch": "launch",
  "/analytics": "analytics",
  "/airdrop": "airdrop",
  "/robinhood": "robinhood",
  "/farm": "farm",
  "/profile": "profile",
};

const TAB_TO_PATH: Record<string, string> = {
  home: "/app",
  swap: "/swap",
  rewards: "/rewards",
  earn: "/earn",
  vault: "/vault",
  launch: "/launch",
  analytics: "/analytics",
  airdrop: "/airdrop",
  robinhood: "/robinhood",
  farm: "/farm",
  profile: "/profile",
};

const backgroundLayers = [
  {
    src: "/figmaAssets/top-navbar-background.png",
    alt: "Top navbar",
    className:
      "absolute inset-x-0 top-0 h-[72px] sm:h-[101px] w-full object-cover object-top",
  },
  {
    src: "/figmaAssets/site-background.png",
    alt: "Site background",
    className:
      "absolute inset-x-0 top-[72px] sm:top-[98px] bottom-0 w-full object-cover",
  },
  {
    src: "/figmaAssets/background.png",
    alt: "Background",
    className:
      "absolute inset-x-0 bottom-0 h-[140px] sm:h-[190px] w-full object-cover object-bottom",
  },
];

const tabPages: Record<
  string,
  { title: string; icon: string; description: string; color: string }
> = {
  analytics: {
    title: "Analytics",
    icon: "📊",
    description:
      "Deep insights into your trading history and reward performance.",
    color: "#5b9bd5",
  },
};

export const LandinHome = (): JSX.Element => {
  const [location, navigate] = useLocation();

  // Derive active tab from current URL path
  const activeTab = PATH_TO_TAB[location] ?? "home";

  const handleTabChange = (tab: string) => {
    navigate(TAB_TO_PATH[tab] ?? "/");
  };

  const isHome = activeTab === "home";
  const isSwap = activeTab === "swap";
  const isRewards = activeTab === "rewards";
  const isEarn = activeTab === "earn";
  const isVault = activeTab === "vault";
  const isLaunch = activeTab === "launch";
  const isAnalytics = activeTab === "analytics";
  const isAirdrop = activeTab === "airdrop";
  const isRobinhood = activeTab === "robinhood";
  const isFarm = activeTab === "farm";
  const isProfile = activeTab === "profile";

  return (
    <main className="w-full bg-[#020b1c] min-h-screen">
      <div className="mx-auto flex w-full max-w-[941px] lg:max-w-[1280px] flex-col">
        <div className="relative isolate flex min-h-screen w-full flex-col">
          {backgroundLayers.map((layer) => (
            <img
              key={layer.alt}
              className={layer.className}
              alt={layer.alt}
              src={layer.src}
            />
          ))}

          <header className="relative z-20 w-full shrink-0">
            <AppHeaderSection onNavSelect={handleTabChange} activeTab={activeTab} />
          </header>

          {/* Scrollable content area — bottom padding matches nav height (removed on desktop) */}
          <div className="relative z-10 flex w-full flex-1 flex-col overflow-y-auto pb-[134px] sm:pb-[166px] lg:pb-10">
            {isHome && (
              <>
                {/* HERO SECTION WITH SOCIAL BOX */}
                <section className="relative w-full">
                  <SwapHeroSection
                    onStartSwap={() => navigate("/swap")}
                    onViewRewards={() => navigate("/rewards")}
                  />

                  {/* FLOATING GLASSY SOCIAL BOX */}
                  <div className="absolute bottom-4 right-4 z-30">
                    <div
                      className="
                        flex items-center gap-3
                        rounded-2xl
                        border border-white/10
                        bg-white/5
                        backdrop-blur-md
                        px-4 py-2
                        shadow-[0_8px_32px_rgba(0,0,0,0.35)]
                      "
                    >
                      <a
                        href="https://x.com/superswapfi_"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          text-xs sm:text-sm
                          font-medium
                          text-[#cfd8e3]
                          transition-all duration-200
                          hover:text-white hover:scale-105
                        "
                      >
                        X
                      </a>

                      <div className="h-4 w-px bg-white/10" />

                      <a
                        href="https://t.me/superswapdex"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          text-xs sm:text-sm
                          font-medium
                          text-[#cfd8e3]
                          transition-all duration-200
                          hover:text-white hover:scale-105
                        "
                      >
                        Telegram
                      </a>
                    </div>
                  </div>
                </section>

                {/* Robinhood Chain banner */}
                <section className="w-full px-[14px] sm:px-[18px] pt-[10px] sm:pt-[12px]">
                  <button onClick={() => navigate("/robinhood")} className="block w-full" data-testid="banner-robinhood">
                    <img
                      src={rhBannerSrc}
                      alt="SuperSwap × Robinhood — Create. Deploy. Earn XP. Send GM."
                      className="w-full h-auto rounded-[16px] block"
                    />
                  </button>
                </section>

                {/* SuperDEX PERP banner */}
                <section className="w-full px-[14px] sm:px-[18px] pt-[10px] sm:pt-[12px]">
                  <a
                    href="https://dex.superswapfi.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src="/superdex-perp-banner.png"
                      alt="Open SuperDEX PERP — Trade Perpetuals. Earn More."
                      className="w-full h-auto rounded-[12px] hover:opacity-90 transition-opacity duration-200 shadow-[0_4px_24px_rgba(34,197,94,0.12)]"
                    />
                  </a>
                </section>

                <section className="w-full px-[14px] sm:px-[18px] pt-[10px] sm:pt-[12px]">
                  <RewardsOverviewSection />
                </section>

                <section
                  aria-labelledby="featured-dexes-heading"
                  className="w-full px-[9px] pt-[12px] sm:pt-[14px]"
                >
                  <div className="mb-2 pl-[4px]">
                    <h2
                      id="featured-dexes-heading"
                      className="w-fit font-['Inter',Helvetica] text-[13px] sm:text-base font-normal leading-[normal] tracking-[0] text-[#5f6a7c]"
                    >
                      FEATURED DEXES
                    </h2>
                  </div>

                  <Card className="h-auto border-0 bg-transparent p-0 shadow-none">
                    <CardContent className="p-0">
                      <DEXHighlightsSection />
                    </CardContent>
                  </Card>
                </section>

                <section className="w-full px-[9px] pt-0 mt-2">
                  <SuperTokenPromoSection />
                </section>
              </>
            )}

            {isSwap && (
              <section className="w-full flex-1">
                <SwapPage />
              </section>
            )}

            {isRewards && (
              <section className="w-full flex-1">
                <RewardsPage />
              </section>
            )}

            {isEarn && (
              <section className="w-full flex-1">
                <EarnPage />
              </section>
            )}

            {isVault && (
              <section className="w-full flex-1">
                <VaultPage />
              </section>
            )}

            {isLaunch && (
              <section className="w-full flex-1">
                <LaunchPage />
              </section>
            )}

            {isAnalytics && (
              <section className="w-full flex-1">
                <AnalyticsPage />
              </section>
            )}

            {isAirdrop && (
              <section className="w-full flex-1">
                <AirdropPage />
              </section>
            )}

            {isRobinhood && (
              <section className="w-full flex-1">
                <RobinhoodPlaygroundPage />
              </section>
            )}

            {isFarm && (
              <section className="w-full flex-1">
                <FarmPage />
              </section>
            )}

            {isProfile && (
              <section className="w-full flex-1">
                <ProfilePage />
              </section>
            )}

            {!isHome &&
              !isSwap &&
              !isRewards &&
              !isEarn &&
              !isVault &&
              !isLaunch &&
              !isAnalytics &&
              !isAirdrop &&
              !isRobinhood &&
              !isFarm &&
              !isProfile && (
                <section className="w-full flex-1 px-4">
                  <PlaceholderPage
                    title={tabPages[activeTab]?.title ?? activeTab}
                    icon={tabPages[activeTab]?.icon ?? "⚡"}
                    description={
                      tabPages[activeTab]?.description ??
                      "This page is coming soon."
                    }
                    color={tabPages[activeTab]?.color ?? "#2dae50"}
                  />
                </section>
              )}
          </div>

          {/* Fixed bottom nav — mobile only, hidden on desktop */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-[941px]">
            <AssetTickerNavSection
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>
        </div>
      </div>
    </main>
  );
};