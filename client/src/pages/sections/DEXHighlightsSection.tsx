import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ComingSoonModal } from "@/components/ComingSoonModal";

const dexHighlights = [
  {
    name: "Uniswap V3",
    fee: "0.05% Fee",
    icon: "/figmaAssets/image-21.png",
    actionIcon: "/figmaAssets/image-20.png",
    cardClassName: "border-[#540f41] bg-[#0f0417] shadow-[inset_0_0_0_1px_rgba(255,0,199,0.04)]",
    iconClassName: "h-9 w-[35px] object-cover",
    actionIconClassName: "h-[29px] w-7 object-cover",
    nameClassName: "font-['Inter',Helvetica] text-[15px] font-normal tracking-[0] leading-[normal] text-[#a1a5ad]",
    feeClassName: "font-['Inter',Helvetica] text-sm font-normal tracking-[0] leading-[normal] text-[#687283]",
  },
  {
    name: "PancakeSwap",
    fee: "0.02% Fee",
    icon: "/figmaAssets/image-19.png",
    actionIcon: "/figmaAssets/image-18.png",
    cardClassName: "border-[#392110] bg-[#05060c] shadow-[inset_0_0_0_1px_rgba(255,170,0,0.04)]",
    iconClassName: "h-9 w-[33px] object-cover",
    actionIconClassName: "h-[27px] w-[26px] object-cover",
    nameClassName: "font-['Inter',Helvetica] text-sm font-bold tracking-[0] leading-[normal] text-[#9da1a8]",
    feeClassName: "font-['Inter',Helvetica] text-sm font-normal tracking-[0] leading-[normal] text-[#5a6373]",
  },
  {
    name: "Aerodrome",
    fee: "0.01% Fee",
    icon: "/figmaAssets/image-17.png",
    actionIcon: "/figmaAssets/image-16.png",
    background: "/figmaAssets/background-7.png",
    cardClassName: "border-[#123a8e] bg-[#071125] shadow-[0_0_0_1px_rgba(31,107,255,0.12),0_0_22px_rgba(26,108,255,0.12)]",
    iconClassName: "h-9 w-9 object-cover",
    actionIconClassName: "h-7 w-7 object-cover",
    nameClassName: "font-['Inter',Helvetica] text-[15px] font-bold tracking-[0] leading-[normal] text-[#91959d]",
    feeClassName: "font-['Inter',Helvetica] text-sm font-normal tracking-[0] leading-[normal] text-[#555e70]",
  },
  {
    name: "BaseSwap",
    fee: "0.02% Fee",
    icon: "/figmaAssets/image-15.png",
    actionIcon: "/figmaAssets/image-14.png",
    background: "/figmaAssets/background-6.png",
    cardClassName: "border-[#143d92] bg-[#061020] shadow-[0_0_0_1px_rgba(31,107,255,0.12)]",
    iconClassName: "h-[35px] w-9 object-cover",
    actionIconClassName: "h-7 w-[27px] object-cover",
    nameClassName: "font-['Inter',Helvetica] text-[15px] font-normal tracking-[0] leading-[normal] text-[#93979f]",
    feeClassName: "font-['Inter',Helvetica] text-[15px] font-normal tracking-[0] leading-[normal] text-[#596272]",
  },
];

export const DEXHighlightsSection = (): JSX.Element => {
  const [selectedDex, setSelectedDex] = useState<string | null>(null);

  return (
    <>
      <section className="w-full">
        <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          {dexHighlights.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setSelectedDex(item.name)}
              className="w-full rounded-[21px] text-left focus:outline-none active:scale-[0.97] transition-transform"
            >
              <Card
                className={`relative w-full overflow-hidden rounded-[21px] border ${item.cardClassName} hover:brightness-110 transition-all`}
              >
                {item.background ? (
                  <img
                    className="absolute inset-0 h-full w-full object-cover"
                    alt={`${item.name} background`}
                    src={item.background}
                  />
                ) : null}
                <CardContent className="relative z-10 flex min-h-[75px] sm:min-h-[87px] items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <img className={item.iconClassName} alt={item.name} src={item.icon} />
                    <div className="min-w-0">
                      <p className={`${item.nameClassName} whitespace-nowrap`}>{item.name}</p>
                      <p className={`${item.feeClassName} whitespace-nowrap`}>{item.fee}</p>
                    </div>
                  </div>
                  <img className={`${item.actionIconClassName} shrink-0`} alt={`${item.name} action`} src={item.actionIcon} />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <ComingSoonModal
        open={selectedDex !== null}
        onClose={() => setSelectedDex(null)}
        title={`Swap via ${selectedDex}`}
        description={`Direct integration with ${selectedDex} is coming soon. You'll earn SuperSwap rewards on every trade.`}
      />
    </>
  );
};
