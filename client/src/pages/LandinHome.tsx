import { useLocation } from "wouter";
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

// Map URL paths → tab names, and vice-versa
const PATH_TO_TAB: Record<string, string> = {
  "/":          "home",
  "/swap":      "swap",
  "/rewards":   "rewards",
  "/vault":     "vault",
  "/analytics": "analytics",
};

const TAB_TO_PATH: Record<string, string> = {
  home:      "/",
  swap:      "/swap",
  rewards:   "/rewards",
  vault:     "/vault",
  analytics: "/analytics",
};

const backgroundLayers = [
  {
    src: "/figmaAssets/top-navbar-background.png",
    alt: "Top navbar",
    className: "absolute inset-x-0 top-0 h-[72px] sm:h-[101px] w-full object-cover object-top",
  },
  {
    src: "/figmaAssets/site-background.png",
    alt: "Site background",
    className: "absolute inset-x-0 top-[72px] sm:top-[98px] bottom-0 w-full object-cover",
  },
  {
    src: "/figmaAssets/background.png",
    alt: "Background",
    className: "absolute inset-x-0 bottom-0 h-[140px] sm:h-[190px] w-full object-cover object-bottom",
  },
];

const tabPages: Record<string, { title: string; icon: string; description: string; color: string }> = {
  analytics: {
    title: "Analytics",
    icon: "📊",
    description: "Deep insights into your trading history and reward performance.",
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

  const isHome    = activeTab === "home";
  const isSwap    = activeTab === "swap";
  const isRewards = activeTab === "rewards";
  const isVault   = activeTab === "vault";

  return (
    <main className="w-full bg-[#020b1c] min-h-screen">
      <div className="mx-auto flex w-full max-w-[941px] flex-col">
        <div className="relative isolate flex min-h-screen w-full flex-col overflow-hidden">
          {backgroundLayers.map((layer) => (
            <img key={layer.alt} className={layer.className} alt={layer.alt} src={layer.src} />
          ))}

          <header className="relative z-20 w-full">
            <AppHeaderSection onNavSelect={handleTabChange} />
          </header>

          <div className="relative z-10 flex w-full flex-1 flex-col">
            {isHome && (
              <>
                <section className="w-full">
                  <SwapHeroSection
                    onStartSwap={() => navigate("/swap")}
                    onViewRewards={() => navigate("/rewards")}
                  />
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
                <section className="w-full px-[9px] pt-0 mt-3">
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
              <section className="w-full flex-1 overflow-y-auto">
                <RewardsPage />
              </section>
            )}

            {isVault && (
              <section className="w-full flex-1 overflow-y-auto">
                <VaultPage />
              </section>
            )}

            {!isHome && !isSwap && !isRewards && !isVault && (
              <section className="w-full flex-1 px-4">
                <PlaceholderPage
                  title={tabPages[activeTab]?.title ?? activeTab}
                  icon={tabPages[activeTab]?.icon ?? "⚡"}
                  description={tabPages[activeTab]?.description ?? "This page is coming soon."}
                  color={tabPages[activeTab]?.color ?? "#2dae50"}
                />
              </section>
            )}

            <section className="w-full mt-auto">
              <AssetTickerNavSection activeTab={activeTab} onTabChange={handleTabChange} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};
