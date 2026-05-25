import { Button } from "@/components/ui/button";
import { usePublicSettings } from "@/hooks/useAdmin";

interface SwapHeroSectionProps {
  onStartSwap?: () => void;
  onViewRewards?: () => void;
}

export const SwapHeroSection = ({ onStartSwap, onViewRewards }: SwapHeroSectionProps): JSX.Element => {
  const { data: settings } = usePublicSettings();

  const heroLines = [
    { text: settings?.hero_title_line1 || "SWAP.", className: "text-[#ecedef]" },
    { text: settings?.hero_title_line2 || "EARN.", className: "text-[#edeef0]" },
    { text: settings?.hero_title_line3 || "REPEAT.", className: "text-[#45ec62]" },
  ];
  const tagline = settings?.site_tagline || "REWARD-FIRST DEX";
  const subtitle = settings?.hero_subtitle || "The DEX on Base that rewards you\nevery time you trade.";

  return (
    <>
      <section className="relative mb-[5px] w-full overflow-hidden rounded-none">
        <div className="relative min-h-[360px] sm:min-h-[430px] md:min-h-[496px] w-full overflow-hidden border border-[#07111f] bg-[#020713]">
          <img
            className="absolute inset-0 h-full w-full object-cover object-right"
            alt="Swap hero background"
            src="/figmaAssets/image-25.png"
          />
          <div className="relative z-10 flex min-h-[360px] sm:min-h-[430px] md:min-h-[496px] w-full items-stretch">
            <div className="flex w-full max-w-[460px] flex-col justify-between px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-8">
              <div className="space-y-3 sm:space-y-5">
                <div className="inline-flex h-10 sm:h-12 items-center rounded-2xl bg-[#070d1b] px-3 sm:px-4">
                  <img
                    className="mr-2 sm:mr-3 h-[16px] w-3 sm:h-[18px] sm:w-3.5 object-cover"
                    alt="Reward-first DEX icon"
                    src="/figmaAssets/image-29.png"
                  />
                  <span className="flex items-center font-['Inter',Helvetica] text-[13px] sm:text-[15px] font-medium leading-[normal] tracking-[0] text-[#768296]">
                    {tagline}
                  </span>
                </div>
                <header className="space-y-0">
                  {heroLines.map((line) => (
                    <h1
                      key={line.text}
                      className={`m-0 font-['Inter',Helvetica] text-[52px] sm:text-[64px] md:text-[74px] font-black leading-[0.9] tracking-[0] ${line.className} whitespace-nowrap`}
                    >
                      {line.text}
                    </h1>
                  ))}
                </header>
                <p className="max-w-[280px] sm:max-w-[336px] font-['Inter',Helvetica] text-base sm:text-xl font-normal leading-[24px] sm:leading-[26.9px] tracking-[0] text-[#6d788b] whitespace-pre-line">
                  {subtitle}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                <Button
                  type="button"
                  onClick={onStartSwap}
                  className="h-auto min-h-[48px] sm:min-h-[58px] rounded-[15px] border border-[#37c056] bg-[#49f764] px-4 sm:px-6 py-3 sm:py-4 text-[#0a351c] hover:bg-[#49f764]/90 active:scale-95 transition-transform"
                >
                  <span className="flex items-center gap-2 sm:gap-4">
                    <img
                      className="h-[20px] w-[16px] sm:h-[23px] sm:w-[19px] object-cover"
                      alt="Start swapping icon"
                      src="/figmaAssets/image-28.png"
                    />
                    <span className="font-['Inter',Helvetica] text-[16px] sm:text-[19px] font-normal leading-[normal] tracking-[0]">
                      Start Swapping
                    </span>
                    <span className="hidden sm:flex items-center gap-2">
                      <img className="h-4 w-px object-cover" alt="" src="/figmaAssets/background-10.png" />
                      <img className="h-4 w-[18px] object-cover" alt="" src="/figmaAssets/image-27.png" />
                    </span>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onViewRewards}
                  className="h-auto min-h-[44px] sm:min-h-[53px] rounded-2xl border-[#1e3435] bg-[#00030d] px-4 sm:px-5 py-3 sm:py-4 text-[#92969e] hover:bg-[#00030d] hover:text-[#92969e] active:scale-95 transition-transform"
                >
                  <span className="flex items-center gap-2 sm:gap-3">
                    <img
                      className="h-[18px] w-[18px] sm:h-[21px] sm:w-[21px] object-cover"
                      alt="View rewards icon"
                      src="/figmaAssets/image-26.png"
                    />
                    <span className="font-['Inter',Helvetica] text-[15px] sm:text-[17px] font-medium leading-[normal] tracking-[0]">
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

    </>
  );
};
