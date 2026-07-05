import rhLogoSrc from "@assets/unnamed_(4)_1782977968316.png";

export const RobinhoodLogo = ({ size = 32 }: { size?: number }) => (
  <img
    src={rhLogoSrc}
    width={size}
    height={size}
    alt="Robinhood"
    style={{ borderRadius: "50%", display: "block" }}
  />
);
