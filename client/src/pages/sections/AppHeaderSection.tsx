import { Button } from "@/components/ui/button";

const brandParts = [
  { label: "Super", className: "font-bold text-[#ccced2] text-[25px]" },
  { label: "Swap", className: "font-normal text-[#37c359] text-[27px]" },
];

export const AppHeaderSection = (): JSX.Element => {
  return (
    <header className="relative w-full border-b border-[#0b1e24] bg-[#020816]">
      <div className="flex min-h-[84px] w-full items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <img
            className="h-[47px] w-[38px] object-cover"
            alt="Logo"
            src="/figmaAssets/logo.png"
          />
          <h1 className="flex items-center leading-none [font-family:'Inter',Helvetica] tracking-[0]">
            {brandParts.map((part) => (
              <span key={part.label} className={part.className}>
                {part.label}
              </span>
            ))}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-[22px] border border-[#12352d] bg-[#000d10] px-5 py-4 text-[#2ca84c] hover:bg-[#041418] hover:text-[#2ca84c]"
        >
          <span className="flex items-center gap-3 [font-family:'Inter',Helvetica] text-[19px] font-bold leading-[normal] tracking-[0]">
            <img
              className="h-5 w-5 object-cover"
              alt="Wallet"
              src="/figmaAssets/image-30.png"
            />
            <span>Connect</span>
          </span>
        </Button>
      </div>
    </header>
  );
};
