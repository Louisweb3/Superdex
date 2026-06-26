import { useState } from "react";
import { useWalletContext } from "@/context/WalletContext";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import {
  Wallet,
  Gift,
  Zap,
  Lock,
  Calendar,
  LayoutList,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { SiDiscord, SiTelegram, SiX } from "react-icons/si";

// ─── How It Works steps ──────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: 1,
    imgSrc: "/vaultAssets/airdrop_raw2_1.png",
    label: "Connect Wallet",
    desc: "Connect the wallet you use on SuperSwap.",
  },
  {
    step: 2,
    imgSrc: "/vaultAssets/airdrop_raw2_8.png",
    label: "Check Eligibility",
    desc: "We check your wallet against the snapshot.",
  },
  {
    step: 3,
    imgSrc: null,
    icon: Gift,
    label: "Claim Tokens",
    desc: "If eligible, claim your $SUPER tokens.",
  },
  {
    step: 4,
    imgSrc: "/vaultAssets/airdrop_raw2_7.png",
    label: "Enjoy Rewards",
    desc: "Use $SUPER across the SuperSwap ecosystem.",
  },
];

const SOCIAL_LINKS = [
  { icon: SiX,        label: "@superswapdex",        href: "https://x.com/superswapfi_" },
  { icon: SiDiscord,  label: "discord.gg/superswap", href: "https://discord.gg/superswap" },
  { icon: SiTelegram, label: "t.me/superswap",       href: "https://t.me/superswapdex" },
];

export function AirdropPage(): JSX.Element {
  const wallet = useWalletContext();
  const [walletOpen, setWalletOpen] = useState(false);
  const connected = wallet.isConnected;

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-black text-white flex flex-col"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Demo disclaimer banner */}
      <div className="mx-4 mt-4 flex items-start gap-3 rounded-[12px] border border-yellow-400/30 bg-yellow-400/5 px-4 py-3">
        <span className="text-yellow-400 text-[18px] leading-none mt-0.5">⚠️</span>
        <p className="text-yellow-300/90 text-[13px] leading-relaxed">
          <span className="font-bold">Demo Page —</span>{" "}
          This page is totally a demo of our airdrop page. All the data shown here is not correct.
        </p>
      </div>

      <div className="flex-1 flex flex-col">

        {/* ── Hero section ─────────────────────────────────────────────────── */}
        <div
          className="relative mx-4 mt-4 mb-0 overflow-hidden rounded-[16px] border border-[#0d1f0f]"
          style={{ background: "linear-gradient(135deg, #030e05 0%, #000 60%)" }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-[#05ff5020] blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#03c04020] blur-[80px]" />
          </div>

          <div className="relative flex flex-col lg:flex-row items-stretch min-h-[480px]">

            {/* LEFT: Hero text */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-10 lg:py-14 lg:max-w-[520px]">
              {/* Badge */}
              <div className="mb-5">
                <span className="inline-block border border-[#22c55e]/40 text-[#22c55e] text-[11px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-md bg-[#22c55e]/5">
                  $SUPER AIRDROP
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[36px] sm:text-[48px] lg:text-[52px] font-black leading-[1.05] tracking-[-0.02em] mb-6">
                <span className="text-white">CHECK.CLAIM.</span>
                <br />
                <span className="text-[#22c55e]">EARN $SUPER.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[#697278] text-[15px] leading-relaxed mb-8 max-w-[400px]">
                Connect your wallet to check your eligibility and claim your $SUPER tokens.
              </p>

              {/* CTA */}
              <div className="mb-6">
                {connected ? (
                  <button
                    className="flex items-center gap-3 bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-black font-bold text-[16px] px-8 py-4 rounded-[14px] transition-all duration-200 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                    data-testid="button-claim-super"
                  >
                    <Gift size={20} />
                    Claim $SUPER
                  </button>
                ) : (
                  <button
                    onClick={() => setWalletOpen(true)}
                    className="flex items-center gap-3 bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] text-black font-bold text-[16px] px-8 py-4 rounded-[14px] transition-all duration-200 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                    data-testid="button-connect-wallet-airdrop"
                  >
                    <Wallet size={20} />
                    Connect Wallet
                  </button>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-2 text-[#4a5260] text-[13px]">
                <Lock size={13} />
                <span>Secure</span>
                <span className="text-[#2a3040]">•</span>
                <span>Non-custodial</span>
                <span className="text-[#2a3040]">•</span>
                <span>100% Safe</span>
              </div>
            </div>

            {/* CENTER: 3D Coin visual */}
            <div className="hidden lg:flex items-center justify-center flex-1 relative">
              <div className="relative flex items-center justify-center w-[360px] h-[360px]">
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-full border border-[#22c55e]/10 bg-[radial-gradient(circle,rgba(34,197,94,0.08)_0%,transparent_70%)]" />
                <div className="absolute inset-[30px] rounded-full border border-[#22c55e]/15" />
                <div className="absolute inset-[60px] rounded-full border border-[#22c55e]/20" />

                {/* Main coin circle */}
                <div className="relative z-10 w-[180px] h-[180px] rounded-full border-4 border-[#22c55e]/60 bg-gradient-to-br from-[#0a2010] via-[#061a0c] to-[#000] shadow-[0_0_80px_rgba(34,197,94,0.5),inset_0_0_40px_rgba(34,197,94,0.1)] flex items-center justify-center">
                  <div className="w-[140px] h-[140px] rounded-full border-2 border-[#22c55e]/40 bg-gradient-to-br from-[#0f2e18] to-[#020f05] flex items-center justify-center">
                    <img
                      src="/vaultAssets/airdrop_raw2_7.png"
                      alt="$SUPER"
                      className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]"
                    />
                  </div>
                </div>

                {/* Platform glow beneath coin */}
                <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[200px] h-[20px] rounded-full bg-[#22c55e]/20 blur-[20px]" />
                <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 w-[300px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#22c55e]/40 to-transparent" />
              </div>
            </div>

            {/* RIGHT: Airdrop Preview Card */}
            <div className="lg:w-[360px] xl:w-[400px] flex-shrink-0 p-4 sm:p-6 flex flex-col justify-center">
              <div className="bg-[#050f07] border border-[#0e2010] rounded-[16px] p-5 sm:p-6 h-full flex flex-col">

                {/* Card header */}
                <div className="text-[#22c55e] text-[11px] font-bold uppercase tracking-[0.18em] mb-5">
                  AIRDROP PREVIEW
                </div>

                {/* Amount display */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[#697278] text-[12px] mb-1">You're eligible to claim</div>
                    <div className="text-[#c8cace] font-bold text-[22px] sm:text-[26px] leading-tight">
                      1,250.75 <span className="text-[#22c55e]">$SUPER</span>
                    </div>
                    <div className="text-[#4a5260] text-[12px] mt-1">≈ $312.68 USD</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#0a2010] border border-[#1a3020] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src="/vaultAssets/airdrop_raw2_7.png"
                      alt="$SUPER"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#0e2010] my-4" />

                {/* Info rows */}
                <div className="flex flex-col gap-3 flex-1">
                  {[
                    { icon: Calendar,    label: "Snapshot Date",    value: "May 20, 2025",    valueClass: "text-[#c8cace]" },
                    { icon: LayoutList,  label: "Total Allocation", value: "1,250.75 $SUPER", valueClass: "text-[#c8cace]" },
                    { icon: Gift,        label: "Claimable Amount", value: "1,250.75 $SUPER", valueClass: "text-[#c8cace]" },
                    { icon: CheckCircle, label: "Claim Status",     value: "Eligible",        valueClass: "text-[#22c55e] bg-[#0a2010] border border-[#1a3020] px-2 py-0.5 rounded text-[11px] font-semibold" },
                  ].map(({ icon: Icon, label, value, valueClass }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[#697278] text-[13px]">
                        <Icon size={14} className="flex-shrink-0" />
                        <span>{label}</span>
                      </div>
                      <span className={`text-[13px] font-medium ${valueClass}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-[#0e2010] my-4" />

                {/* Claim button */}
                <button
                  onClick={() => !connected && setWalletOpen(true)}
                  data-testid="button-claim-airdrop"
                  className="w-full flex items-center justify-center gap-2 bg-[#0a1a0e] border border-[#1a3020] hover:border-[#22c55e]/40 hover:bg-[#0d2010] text-[#8a9099] hover:text-[#c8cace] font-semibold text-[15px] py-3.5 rounded-[12px] transition-all duration-200"
                >
                  <Gift size={18} />
                  Claim $SUPER
                </button>

                {/* Note */}
                <div className="flex items-center gap-1.5 mt-3 text-[#3a4250] text-[11px] justify-center">
                  <CheckCircle size={11} />
                  <span>Connect your wallet to claim your tokens.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <div className="mx-4 mt-4 border border-[#0d1f0f] rounded-[16px] bg-[#030a05] px-6 sm:px-10 py-8">
          <div className="text-[#22c55e] text-[12px] font-bold uppercase tracking-[0.2em] mb-6">
            HOW IT WORKS
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-0">
            {HOW_IT_WORKS.map(({ step, imgSrc, icon: Icon, label, desc }, idx) => (
              <div key={step} className="flex items-center flex-1 min-w-0">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Step badge */}
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#22c55e] text-black text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {step}
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 w-11 h-11">
                    {imgSrc ? (
                      <img src={imgSrc} alt={label} className="w-full h-full object-contain" />
                    ) : Icon ? (
                      <div className="w-11 h-11 rounded-full bg-[#0a1a0e] border border-[#1a3020] flex items-center justify-center">
                        <Icon size={20} className="text-[#22c55e]" />
                      </div>
                    ) : null}
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <div className="text-[#c8cace] font-semibold text-[13px] mb-0.5">{label}</div>
                    <div className="text-[#4a5260] text-[11px] leading-snug">{desc}</div>
                  </div>
                </div>

                {/* Arrow between steps */}
                {idx < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight size={18} className="hidden sm:block text-[#1a3020] flex-shrink-0 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="mx-4 mt-4 mb-4 border border-[#0d1f0f] rounded-[16px] bg-[#020805] px-6 sm:px-10 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0a1a0e] border border-[#1a3020] flex items-center justify-center overflow-hidden">
                <img
                  src="/vaultAssets/airdrop_raw2_7.png"
                  alt="$SUPER"
                  className="w-5 h-5 object-contain"
                />
              </div>
              <span className="text-[#c8cace] font-semibold text-[16px]">
                Super<span className="text-[#22c55e]">Swap</span>
              </span>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-6">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#697278] hover:text-[#c8cace] text-[13px] transition-colors"
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connect wallet modal */}
      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={async () => {
          setWalletOpen(false);
          await wallet.connect();
        }}
      />
    </div>
  );
}
