import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const dexHighlights = [
  {
    name: "Uniswap V3",
    fee: "0.05% Fee",
    icon: "/figmaAssets/image-21.png",
    actionIcon: "/figmaAssets/image-20.png",
    cardClassName:
      "border-[#540f41] bg-[#0f0417] shadow-[inset_0_0_0_1px_rgba(255,0,199,0.04)]",
    contentClassName: "px-4 py-4",
    iconClassName: "h-9 w-[35px] object-cover",
    actionIconClassName: "h-[29px] w-7 object-cover",
    nameClassName:
      "[font-family:'Inter',Helvetica] text-[15px] font-normal tracking-[0] leading-[normal] text-[#a1a5ad]",
    feeClassName:
      "[font-family:'Inter',Helvetica] text-sm font-normal tracking-[0] leading-[normal] text-[#687283]",
  },
  {
    name: "PancakeSwap",
    fee: "0.02%Fee",
    icon: "/figmaAssets/image-19.png",
    actionIcon: "/figmaAssets/image-18.png",
    cardClassName:
      "border-[#392110] bg-[#05060c] shadow-[inset_0_0_0_1px_rgba(255,170,0,0.04)]",
    contentClassName: "px-4 py-4",
    iconClassName: "h-9 w-[33px] object-cover",
    actionIconClassName: "h-[27px] w-[26px] object-cover",
    nameClassName:
      "[font-family:'Inter',Helvetica] text-sm font-bold tracking-[0] leading-[normal] text-[#9da1a8]",
    feeClassName:
      "[font-family:'Inter',Helvetica] text-sm font-normal tracking-[0] leading-[normal] text-[#5a6373]",
  },
  {
    name: "Aerodrome",
    fee: "0.01% Fee",
    icon: "/figmaAssets/image-17.png",
    actionIcon: "/figmaAssets/image-16.png",
    background: "/figmaAssets/background-7.png",
    cardClassName:
      "border-[#123a8e] bg-[#071125] shadow-[0_0_0_1px_rgba(31,107,255,0.12),0_0_22px_rgba(26,108,255,0.12)]",
    contentClassName: "px-4 py-4",
    iconClassName: "h-9 w-9 object-cover",
    actionIconClassName: "h-7 w-7 object-cover",
    nameClassName:
      "[font-family:'Inter',Helvetica] text-[15px] font-bold tracking-[0] leading-[normal] text-[#91959d]",
    feeClassName:
      "[font-family:'Inter',Helvetica] text-sm font-normal tracking-[0] leading-[normal] text-[#555e70]",
  },
  {
    name: "BaseSwap",
    fee: "0.02%Fee",
    icon: "/figmaAssets/image-15.png",
    actionIcon: "/figmaAssets/image-14.png",
    background: "/figmaAssets/background-6.png",
    cardClassName:
      "border-[#143d92] bg-[#061020] shadow-[0_0_0_1px_rgba(31,107,255,0.12)]",
    contentClassName: "px-4 py-4",
    iconClassName: "h-[35px] w-9 object-cover",
    actionIconClassName: "h-7 w-[27px] object-cover",
    nameClassName:
      "[font-family:'Inter',Helvetica] text-[15px] font-normal tracking-[0] leading-[normal] text-[#93979f]",
    feeClassName:
      "[font-family:'Inter',Helvetica] text-[15px] font-normal tracking-[0] leading-[normal] text-[#596272]",
  },
];

export const DEXHighlightsSection = (): JSX.Element => {
  return (
    <section className="w-full">
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dexHighlights.map((item) => (
          <Button
            key={item.name}
            type="button"
            variant="ghost"
            className="h-auto w-full rounded-[21px] p-0 text-left hover:bg-transparent"
          >
            <Card
              className={`relative w-full overflow-hidden rounded-[21px] border ${item.cardClassName}`}
            >
              {item.background ? (
                <img
                  className="absolute inset-0 h-full w-full object-cover opacity-100"
                  alt={`${item.name} background`}
                  src={item.background}
                />
              ) : null}
              <CardContent
                className={`relative z-10 flex min-h-[87px] items-center justify-between gap-3 ${item.contentClassName}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    className={item.iconClassName}
                    alt={item.name}
                    src={item.icon}
                  />
                  <div className="min-w-0">
                    <p className={`${item.nameClassName} whitespace-nowrap`}>
                      {item.name}
                    </p>
                    <p className={`${item.feeClassName} whitespace-nowrap`}>
                      {item.fee}
                    </p>
                  </div>
                </div>
                <img
                  className={item.actionIconClassName}
                  alt={`${item.name} action`}
                  src={item.actionIcon}
                />
              </CardContent>
            </Card>
          </Button>
        ))}
      </div>
    </section>
  );
};
