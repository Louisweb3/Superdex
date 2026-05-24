import { Card, CardContent } from "@/components/ui/card";
import { AppHeaderSection } from "./sections/AppHeaderSection";
import { AssetTickerNavSection } from "./sections/AssetTickerNavSection";
import { DEXHighlightsSection } from "./sections/DEXHighlightsSection";
import { RewardsOverviewSection } from "./sections/RewardsOverviewSection";
import { SuperTokenPromoSection } from "./sections/SuperTokenPromoSection";
import { SwapHeroSection } from "./sections/SwapHeroSection";

const backgroundLayers = [
  {
    src: "/figmaAssets/top-navbar-background.png",
    alt: "Top navbar",
    className:
      "absolute inset-x-0 top-0 h-[101px] w-full object-cover object-top",
  },
  {
    src: "/figmaAssets/site-background.png",
    alt: "Site background",
    className: "absolute inset-x-0 top-[98px] bottom-0 w-full object-cover",
  },
  {
    src: "/figmaAssets/background.png",
    alt: "Background",
    className:
      "absolute inset-x-0 bottom-0 h-[190px] w-full object-cover object-bottom",
  },
  {
    src: "/figmaAssets/bottom-live-price-bar-background.png",
    alt: "Bottom live price",
    className: "absolute inset-x-0 bottom-[120px] h-[70px] w-full object-cover",
  },
];

export const LandinHome = (): JSX.Element => {
  return (
    <main className="w-full bg-[#020b1c]">
      <div className="mx-auto flex w-full min-w-[927px] max-w-[927px] flex-col">
        <div className="relative isolate flex min-h-[1440px] w-full flex-col overflow-hidden">
          {backgroundLayers.map((layer) => (
            <img
              key={layer.alt}
              className={layer.className}
              alt={layer.alt}
              src={layer.src}
            />
          ))}

          <header className="relative z-20 w-full">
            <AppHeaderSection />
          </header>
          <div className="relative z-10 flex w-full flex-col">
            <section className="w-full">
              <SwapHeroSection />
            </section>
            <section className="w-full px-[18px] pt-[12px]">
              <RewardsOverviewSection />
            </section>
            <section
              aria-labelledby="featured-dexes-heading"
              className="w-full px-[9px] pt-[14px]"
            >
              <div className="mb-2 pl-[4px]">
                <h2
                  id="featured-dexes-heading"
                  className="w-fit [font-family:'Inter',Helvetica] text-base font-normal leading-[normal] tracking-[0] text-[#5f6a7c]"
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
            <section className="w-full px-[9px] pt-0">
              <SuperTokenPromoSection />
            </section>
            <section className="w-full pt-[18px]">
              <AssetTickerNavSection />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};
