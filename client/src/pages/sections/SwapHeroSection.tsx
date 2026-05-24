import { Button } from "@/components/ui/button";

const heroLines = [
  {
    text: "SWAP.",
    className: "text-[#ecedef]",
  },
  {
    text: "EARN.",
    className: "text-[#edeef0]",
  },
  {
    text: "REPEAT.",
    className: "text-[#45ec62]",
  },
];

export const SwapHeroSection = (): JSX.Element => {
  return (
    <section className="relative mb-[5px] w-full overflow-hidden rounded-none">
      <div className="relative min-h-[496px] w-full overflow-hidden border border-[#07111f] bg-[#020713]">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          alt="Swap hero background"
          src="/figmaAssets/image-25.png"
        />
        <div className="relative z-10 flex min-h-[496px] w-full items-stretch">
          <div className="flex w-full max-w-[460px] flex-col justify-between px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8">
            <div className="space-y-5">
              <div className="inline-flex h-12 items-center rounded-2xl bg-[#070d1b] px-4">
                <img
                  className="mr-3 h-[18px] w-3.5 object-cover"
                  alt="Reward-first DEX icon"
                  src="/figmaAssets/image-29.png"
                />
                <span className="flex items-center [font-family:'Inter',Helvetica] text-[15px] font-medium leading-[normal] tracking-[0] text-[#768296]">
                  REWARD-FIRST DEX
                </span>
              </div>
              <header className="space-y-0">
                {heroLines.map((line) => (
                  <h1
                    key={line.text}
                    className={`m-0 [font-family:'Inter',Helvetica] text-[74px] font-black leading-[0.9] tracking-[0] ${line.className} whitespace-nowrap`}
                  >
                    {line.text}
                  </h1>
                ))}
              </header>
              <p className="max-w-[336px] [font-family:'Inter',Helvetica] text-xl font-normal leading-[26.9px] tracking-[0] text-[#6d788b]">
                The DEX on Base that rewards you
                <br />
                every time you trade.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                type="button"
                className="h-auto min-h-[58px] rounded-[15px] border border-[#37c056] bg-[#49f764] px-6 py-4 text-[#0a351c] hover:bg-[#49f764]/90"
              >
                <span className="flex items-center gap-4">
                  <img
                    className="h-[23px] w-[19px] object-cover"
                    alt="Start swapping icon"
                    src="/figmaAssets/image-28.png"
                  />
                  <span className="[font-family:'Inter',Helvetica] text-[19px] font-normal leading-[normal] tracking-[0]">
                    Start Swapping
                  </span>
                  <img
                    className="h-4 w-px object-cover"
                    alt="Button separator"
                    src="/figmaAssets/background-10.png"
                  />
                  <img
                    className="h-4 w-[18px] object-cover"
                    alt="Arrow icon"
                    src="/figmaAssets/image-27.png"
                  />
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[53px] rounded-2xl border-[#1e3435] bg-[#00030d] px-5 py-4 text-[#92969e] hover:bg-[#00030d] hover:text-[#92969e]"
              >
                <span className="flex items-center gap-3">
                  <img
                    className="h-[21px] w-[21px] object-cover"
                    alt="View rewards icon"
                    src="/figmaAssets/image-26.png"
                  />
                  <span className="[font-family:'Inter',Helvetica] text-[17px] font-medium leading-[normal] tracking-[0]">
                    View Rewards
                  </span>
                </span>
              </Button>
            </div>
          </div>
          <div className="hidden flex-1 md:block" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};
