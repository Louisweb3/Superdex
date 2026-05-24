import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const promoFeatures = [
  {
    title: "Earn More",
    description: "Higher rewards for $SUPER holders",
    imageSrc: "/figmaAssets/image-12.png",
    imageAlt: "Earn more",
    titleClassName:
      "[font-family:'Inter',Helvetica] font-normal text-[#8b8f96] text-[15px] tracking-[0] leading-[normal]",
    descriptionClassName:
      "[font-family:'Inter',Helvetica] font-normal text-[#576071] text-[13px] tracking-[0] leading-[normal]",
  },
  {
    title: "Boost Rewards",
    description: "Staking boosts your earnings",
    imageSrc: "/figmaAssets/image-11.png",
    imageAlt: "Boost rewards",
    titleClassName:
      "[font-family:'Inter',Helvetica] font-normal text-[#8e9299] text-sm tracking-[0] leading-[normal]",
    descriptionClassName:
      "[font-family:'Inter',Helvetica] font-normal text-[#596272] text-[13px] tracking-[0] leading-[normal]",
  },
  {
    title: "Govern Together",
    description: "Vote on fees, rewards & more",
    imageSrc: "/figmaAssets/image-10.png",
    imageAlt: "Govern together",
    titleClassName:
      "[font-family:'Inter',Helvetica] font-normal text-[#868a92] text-sm tracking-[0] leading-[normal]",
    descriptionClassName:
      "[font-family:'Inter',Helvetica] font-normal text-[#555e6d] text-[13px] tracking-[0] leading-[normal]",
  },
  {
    title: "Early Access",
    description: "Get alpha and exclusive perks",
    imageSrc: "/figmaAssets/image-9.png",
    imageAlt: "Early access",
    titleClassName:
      "[font-family:'Inter',Helvetica] font-bold text-[#898d95] text-sm tracking-[0] leading-[normal]",
    descriptionClassName:
      "[font-family:'Inter',Helvetica] font-normal text-[#586172] text-[13px] tracking-[0] leading-[normal]",
  },
];

export const SuperTokenPromoSection = (): JSX.Element => {
  return (
    <section className="mb-[22px] w-full">
      <Card className="w-full border-2 border-[#0c121f] bg-[#000510] shadow-none rounded-[26px] overflow-hidden">
        <CardContent className="p-0">
          <div className="grid min-h-[304px] grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_1px_minmax(320px,348px)]">
            <div className="flex min-w-0 flex-col justify-center px-6 py-6 sm:px-8 lg:px-7">
              <div className="grid items-center gap-6 md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
                <div className="flex items-end justify-center md:justify-start">
                  <img
                    className="h-auto w-full max-w-[240px] object-contain"
                    alt="Super token"
                    src="/figmaAssets/image-8.png"
                  />
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <div className="mb-4 inline-flex w-fit items-center rounded-md border-2 border-[#042419] bg-[#000e10] px-4 py-2">
                    <span className="[font-family:'Inter',Helvetica] text-[13px] font-bold tracking-[0] leading-[normal] text-[#2aa74d]">
                      $SUPER TOKEN
                    </span>
                  </div>
                  <h2 className="mb-1 [font-family:'Inter',Helvetica] text-[33px] font-bold tracking-[0] leading-[normal] text-[#d3d5d9]">
                    $SUPER
                  </h2>
                  <p className="mb-5 [font-family:'Inter',Helvetica] text-[28px] font-normal tracking-[0] leading-[normal] text-[#38c95a]">
                    COMING SOON
                  </p>
                  <p className="mb-6 max-w-[211px] [font-family:'Inter',Helvetica] text-base font-normal tracking-[0] leading-6 text-[#5e687a]">
                    The token that powers the
                    <br />
                    future of SuperSwap.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-fit rounded border border-[#15222a] bg-[#00050f] px-5 py-3 text-[#229045] hover:bg-[#031018] hover:text-[#2aa74d]"
                  >
                    <span className="[font-family:'Inter',Helvetica] text-[15px] font-normal tracking-[0] leading-[normal]">
                      Learn More
                    </span>
                    <img
                      className="ml-3 h-[13px] w-[15px] object-cover"
                      alt="Learn more arrow"
                      src="/figmaAssets/image-13.png"
                    />
                  </Button>
                </div>
              </div>
            </div>
            <div className="mx-auto hidden h-[245px] w-[7px] self-center lg:block">
              <img
                className="h-full w-full object-cover"
                alt="Background"
                src="/figmaAssets/background-5.png"
              />
            </div>
            <aside className="flex min-w-0 flex-col justify-center px-6 py-6 sm:px-8 lg:px-5">
              <nav
                aria-label="Super token benefits"
                className="flex flex-col gap-1"
              >
                {promoFeatures.map((feature) => (
                  <button
                    key={feature.title}
                    type="button"
                    className="flex w-full items-center gap-4 rounded-xl px-2 py-3 text-left transition-colors hover:bg-[#040c18]"
                  >
                    <img
                      className="h-[45px] w-[45px] shrink-0 object-cover"
                      alt={feature.imageAlt}
                      src={feature.imageSrc}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className={feature.titleClassName}>
                        {feature.title}
                      </span>
                      <span className={feature.descriptionClassName}>
                        {feature.description}
                      </span>
                    </span>
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
