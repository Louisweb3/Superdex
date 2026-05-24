import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const tickerItems = [
  {
    symbol: "ETH",
    price: "$3,452.21",
    change: "+1.23%",
    changeColor: "text-[#249647]",
    iconSrc: "/figmaAssets/image-7.png",
    dividerAfter: true,
  },
  {
    symbol: "cbBTC",
    price: "$77,221",
    change: "-0.01%",
    changeColor: "text-[#7f1930]",
    iconSrc: "/figmaAssets/image-6.png",
    dividerAfter: true,
  },
  {
    symbol: "USDC",
    price: "$0.9998",
    change: "+0.01%",
    changeColor: "text-[#20833f]",
    iconSrc: "/figmaAssets/image-5.png",
    dividerAfter: false,
  },
] as const;

const navItems = [
  {
    value: "home",
    label: "Home",
    iconSrc: "/figmaAssets/image-4.png",
    active: true,
    activeBg: "/figmaAssets/background-1.png",
    activeUnderline: "/figmaAssets/background-2.png",
  },
  {
    value: "swap",
    label: "Swap",
    iconSrc: "/figmaAssets/image-3.png",
    active: false,
  },
  {
    value: "rewards",
    label: "Rewards",
    iconSrc: "/figmaAssets/image-2.png",
    active: false,
  },
  {
    value: "analytics",
    label: "Analytics",
    iconSrc: "/figmaAssets/image-1.png",
    active: false,
  },
  {
    value: "history",
    label: "History",
    iconSrc: "/figmaAssets/image.png",
    active: false,
  },
] as const;

export const AssetTickerNavSection = (): JSX.Element => {
  return (
    <section className="relative w-full">
      <Card className="w-full border-0 rounded-none bg-transparent shadow-none">
        <CardContent className="p-0">
          <div className="w-full overflow-hidden border-y-[3px] border-[#060c18] bg-transparent">
            <div className="flex min-h-[72px] w-full items-center justify-center px-4 sm:px-6">
              <div className="flex w-full max-w-[927px] items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
                {tickerItems.map((item, index) => (
                  <div key={item.symbol} className="flex items-center">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-[31px] w-[31px] object-cover"
                        alt={item.symbol}
                        src={item.iconSrc}
                      />
                      <div className="flex items-center gap-3 text-[17px] tracking-[0] leading-[normal] [font-family:'Inter',Helvetica] font-normal">
                        <span className="text-[#999da6]">{item.symbol}</span>
                        <span className="text-[#898d94]">{item.price}</span>
                        <span className={item.changeColor}>{item.change}</span>
                      </div>
                    </div>
                    {item.dividerAfter && index < tickerItems.length - 1 ? (
                      <div className="mx-8 h-[27px] w-0.5 shrink-0">
                        <img
                          className="h-full w-full object-cover"
                          alt=""
                          src={
                            item.symbol === "ETH"
                              ? "/figmaAssets/background-4.png"
                              : "/figmaAssets/background-3.png"
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <nav aria-label="Asset navigation" className="w-full">
              <div className="mx-auto w-full max-w-[927px] px-0">
                <ToggleGroup
                  type="single"
                  value="home"
                  className="grid w-full grid-cols-5 gap-0"
                >
                  {navItems.map((item) => (
                    <ToggleGroupItem
                      key={item.value}
                      value={item.value}
                      aria-label={item.label}
                      className="h-auto min-h-[114px] rounded-none border-0 bg-transparent px-0 py-0 text-current shadow-none data-[state=on]:bg-transparent data-[state=on]:text-current"
                    >
                      {item.active ? (
                        <div className="relative flex h-[114px] w-full items-end justify-center">
                          <img
                            className="absolute bottom-[10px] h-[88px] w-[164px] object-cover"
                            alt=""
                            src={item.activeBg}
                          />
                          <img
                            className="absolute bottom-[10px] h-[3px] w-[134px] object-cover"
                            alt=""
                            src={item.activeUnderline}
                          />
                          <div className="relative z-10 mb-[22px] flex flex-col items-center gap-2">
                            <img
                              className="h-7 w-[27px] object-cover"
                              alt={item.label}
                              src={item.iconSrc}
                            />
                            <span className="flex items-center text-base tracking-[0] leading-[normal] [font-family:'Inter',Helvetica] font-normal text-[#2dae50]">
                              {item.label}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-[114px] w-full flex-col items-center justify-end gap-[11px] pb-[24px]">
                          <img
                            className={`object-cover ${
                              item.value === "swap"
                                ? "h-7 w-[25px]"
                                : item.value === "rewards"
                                  ? "h-[27px] w-7"
                                  : item.value === "analytics"
                                    ? "h-[26px] w-[26px]"
                                    : "h-7 w-7"
                            }`}
                            alt={item.label}
                            src={item.iconSrc}
                          />
                          <span
                            className={`flex items-center text-base tracking-[0] leading-[normal] [font-family:'Inter',Helvetica] font-normal ${
                              item.value === "swap"
                                ? "text-[#616c7e]"
                                : item.value === "rewards"
                                  ? "text-[#5f687a]"
                                  : item.value === "analytics"
                                    ? "text-[#565f70]"
                                    : "text-[#5b6577]"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      )}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </nav>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
