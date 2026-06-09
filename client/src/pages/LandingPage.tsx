import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiX, SiTelegram } from "react-icons/si";
import { BookOpen, Zap, ArrowRight, TrendingUp } from "lucide-react";

interface RewardsStats {
  totalRewardsPaid: number;
  totalUsers: number;
  totalSwaps: number;
}

function formatStat(n: number, prefix = "") {
  if (!n) return prefix + "0";
  if (n >= 1_000_000) return prefix + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return prefix + (n / 1_000).toFixed(1) + "K";
  return prefix + n.toLocaleString();
}

export const LandingPage = (): JSX.Element => {
  const [, navigate] = useLocation();

  const { data: stats } = useQuery<RewardsStats>({
    queryKey: ["/api/rewards/stats"],
    staleTime: 60_000,
  });

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#020b1c] text-white">

      {/* ── background glows ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#0d3a1f] opacity-25 blur-[160px]" />
        <div className="absolute left-[10%] top-[30%] h-[300px] w-[400px] rounded-full bg-[#062b38] opacity-20 blur-[120px]" />
        <div className="absolute right-[5%] top-[20%] h-[250px] w-[350px] rounded-full bg-[#0a2614] opacity-20 blur-[100px]" />
      </div>

      {/* ── Top navbar ── */}
      <nav className="relative z-20 flex w-full items-center justify-between px-6 py-5 sm:px-10 md:px-16">

        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 focus:outline-none"
          aria-label="SuperSwap home"
          data-testid="link-landing-home"
        >
          <img
            src="/figmaAssets/logo.png"
            alt="SuperSwap logo"
            className="h-8 w-6 object-cover sm:h-10 sm:w-8"
          />
          <span className="flex items-baseline leading-none font-['Inter',Helvetica]">
            <span className="text-[20px] sm:text-[24px] font-bold text-[#ccced2]">Super</span>
            <span className="text-[22px] sm:text-[26px] font-normal text-[#37c359]">Swap</span>
          </span>
        </button>

        {/* Center links — desktop only */}
        <div className="hidden md:flex items-center gap-6">
          <a
            href="/docs"
            className="flex items-center gap-1.5 text-[14px] font-medium text-[#8b97aa] transition-colors hover:text-white"
            data-testid="link-landing-docs"
          >
            <BookOpen size={14} />
            Docs
          </a>
          <a
            href="/swap"
            className="text-[14px] font-medium text-[#8b97aa] transition-colors hover:text-white"
            data-testid="link-landing-app"
          >
            App
          </a>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/superswapfi_"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X / Twitter"
            data-testid="link-landing-twitter"
            className="text-[#5f6a7c] transition-colors hover:text-white"
          >
            <SiX size={16} />
          </a>
          <a
            href="https://t.me/superswapdex"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            data-testid="link-landing-telegram"
            className="text-[#5f6a7c] transition-colors hover:text-white"
          >
            <SiTelegram size={18} />
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center px-4 pt-16 pb-10 text-center sm:pt-24 sm:pb-14">

        {/* pill badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-[#1a3428] bg-[#0d2218]/80 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#37c359]">
          <Zap size={11} className="fill-[#37c359]" />
          Reward-First DEX on Base
        </div>

        {/* headline */}
        <h1 className="max-w-[680px] font-['Inter',Helvetica] text-[42px] font-bold leading-[1.12] tracking-[-0.03em] text-white sm:text-[58px] md:text-[68px]">
          Swap Tokens.
          <br />
          <span className="text-[#37c359]">Earn Rewards.</span>
        </h1>

        {/* subtitle */}
        <p className="mt-6 max-w-[520px] text-[15px] font-normal leading-[1.7] text-[#7a8899] sm:text-[17px]">
          SuperSwap gives you $SUPER tokens on every trade — automatically.
          Best routes, zero extra steps, and cashback on every swap.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">

          {/* Swap — opens current webapp */}
          <button
            onClick={() => navigate("/swap")}
            data-testid="button-landing-swap"
            className="group relative flex items-center gap-2.5 overflow-hidden rounded-[16px] bg-[#2dae50] px-7 py-4 text-[15px] font-bold text-white transition-all duration-300 hover:bg-[#34c45c] hover:shadow-[0_0_40px_rgba(45,174,80,0.35)] active:scale-[0.97]"
          >
            <img src="/figmaAssets/image-3.png" alt="" className="h-5 w-5 object-cover" />
            Swap
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          {/* Start Trading — opens dex.superswapfi.xyz */}
          <a
            href="https://dex.superswapfi.xyz"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="button-landing-start-trading"
            className="group flex items-center gap-2.5 rounded-[16px] border border-[#1e2f40] bg-[#0b1826]/80 px-7 py-4 text-[15px] font-bold text-[#cfd8e3] backdrop-blur-sm transition-all duration-300 hover:border-[#2d4a60] hover:bg-[#0f2035] hover:text-white hover:shadow-[0_0_30px_rgba(45,120,200,0.12)] active:scale-[0.97]"
          >
            <TrendingUp size={16} className="text-[#4d8ab8]" />
            Start Trading
          </a>
        </div>

        {/* ── Stats row ── */}
        <div className="mt-16 flex w-full max-w-[580px] items-center justify-center divide-x divide-[#111e2d]">
          <div className="flex flex-1 flex-col items-center gap-1 px-6 sm:px-8">
            <span
              className="text-[22px] sm:text-[28px] font-black tracking-[-0.04em] text-white"
              data-testid="stat-rewards-paid"
            >
              {stats?.totalRewardsPaid ? formatStat(stats.totalRewardsPaid, "$") : "$8.4M+"}
            </span>
            <span className="text-[11px] uppercase tracking-[0.12em] text-[#4a5568]">Rewards Paid</span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-1 px-6 sm:px-8">
            <span
              className="text-[22px] sm:text-[28px] font-black tracking-[-0.04em] text-white"
              data-testid="stat-total-users"
            >
              {stats?.totalUsers ? formatStat(stats.totalUsers) : "12K+"}
            </span>
            <span className="text-[11px] uppercase tracking-[0.12em] text-[#4a5568]">Traders</span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-1 px-6 sm:px-8">
            <span
              className="text-[22px] sm:text-[28px] font-black tracking-[-0.04em] text-white"
              data-testid="stat-total-swaps"
            >
              {stats?.totalSwaps ? formatStat(stats.totalSwaps) : "95K+"}
            </span>
            <span className="text-[11px] uppercase tracking-[0.12em] text-[#4a5568]">Swaps</span>
          </div>
        </div>
      </section>

      {/* ── App preview screenshot ── */}
      <section className="relative z-10 mx-auto mt-6 w-full max-w-[1080px] px-4 sm:px-8 pb-20">

        {/* browser chrome frame */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#111e2d] bg-[#060e18] shadow-[0_40px_120px_rgba(0,0,0,0.7)]">

          {/* browser top bar */}
          <div className="flex items-center gap-2 border-b border-[#0d1b2a] bg-[#050b14] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#1e2d3d]" />
              <div className="h-3 w-3 rounded-full bg-[#1e2d3d]" />
              <div className="h-3 w-3 rounded-full bg-[#1e2d3d]" />
            </div>
            <div className="mx-4 flex h-6 flex-1 max-w-[300px] items-center rounded-[6px] bg-[#0a1624] px-3">
              <span className="text-[11px] text-[#3a4e62]">superswap.fi</span>
            </div>
          </div>

          {/* swap interface preview */}
          <div className="relative flex min-h-[300px] sm:min-h-[400px] items-start gap-0 overflow-hidden">

            {/* left — swap panel */}
            <div className="flex-1 p-5 sm:p-8 min-w-0">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/figmaAssets/image-3.png" alt="" className="h-5 w-5 object-cover" />
                  <span className="text-[14px] font-semibold text-[#cfd8e3]">Swap</span>
                </div>
                <div className="rounded-[8px] border border-[#111e2d] bg-[#060e18] px-3 py-1 text-[12px] text-[#5f6a7c]">All DEXes ▾</div>
              </div>

              {/* you pay */}
              <div className="mb-2 rounded-[14px] border border-[#111e2d] bg-[#060e18] p-4">
                <p className="mb-2 text-[11px] text-[#4a5568]">You Pay</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-[10px] bg-[#0a1624] px-3 py-2">
                    <img src="/figmaAssets/image-7.png" alt="ETH" className="h-6 w-6 rounded-full object-cover" />
                    <span className="text-[14px] font-bold text-white">ETH</span>
                  </div>
                  <span className="text-[22px] font-bold text-white">1</span>
                </div>
                <p className="mt-1 text-right text-[12px] text-[#4a5568]">≈ $1,749.72</p>
              </div>

              {/* arrow */}
              <div className="my-2 flex justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1a2d3e] bg-[#0a1624] text-[#37c359]">⇅</div>
              </div>

              {/* you receive */}
              <div className="rounded-[14px] border border-[#1a3428] bg-[#060e18] p-4">
                <p className="mb-2 text-[11px] text-[#4a5568]">You Receive</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-[10px] bg-[#0a1624] px-3 py-2">
                    <img src="/figmaAssets/image-5.png" alt="USDC" className="h-6 w-6 rounded-full object-cover" />
                    <span className="text-[14px] font-bold text-white">USDC</span>
                  </div>
                  <span className="text-[22px] font-bold text-[#37c359]">1,749.72</span>
                </div>
                <p className="mt-1 text-right text-[12px] text-[#4a5568]">≈ $1,749.72</p>
              </div>

              {/* swap button */}
              <div className="mt-4 flex w-full items-center justify-center rounded-[14px] bg-[#2dae50]/90 py-3 text-[14px] font-bold text-white">
                Connect Wallet to Swap
              </div>

              {/* cashback badge */}
              <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-[#37c359]">
                <Zap size={12} className="fill-[#37c359]" />
                Est. Cashback: $2.50 · Earn $SUPER
              </div>
            </div>

            {/* right — price chart panel (desktop only) */}
            <div className="hidden sm:flex w-[320px] shrink-0 flex-col border-l border-[#0d1b2a] p-5">
              <div className="mb-3 flex items-center gap-2">
                <img src="/figmaAssets/image-7.png" alt="ETH" className="h-6 w-6 rounded-full object-cover" />
                <span className="text-[13px] font-semibold text-[#cfd8e3]">ETH / USDC</span>
                <span className="rounded-[6px] bg-[#1a0e0e] px-2 py-0.5 text-[11px] font-bold text-[#e05252]">-6.31%</span>
              </div>
              <p className="mb-1 text-[24px] font-black tracking-[-0.04em] text-white">1,749.72</p>
              <p className="mb-4 text-[11px] text-[#4a5568]">USDC per ETH</p>
              <img src="/figmaAssets/chart-line.png" alt="Price chart" className="w-full rounded-[8px] object-cover opacity-80" />
            </div>
          </div>
        </div>

        {/* bottom fade overlay */}
        <div className="pointer-events-none absolute bottom-20 left-0 right-0 h-32 bg-gradient-to-t from-[#020b1c] to-transparent" />
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[#0d1b2a] px-6 py-6 sm:px-10 md:px-16">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/figmaAssets/logo.png" alt="SuperSwap" className="h-5 w-4 object-cover" />
            <span className="text-[13px] text-[#4a5568]">© 2025 SuperSwap. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/docs" className="text-[12px] text-[#4a5568] hover:text-[#8b97aa] transition-colors">Docs</a>
            <a href="https://x.com/superswapfi_" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#4a5568] hover:text-[#8b97aa] transition-colors">X</a>
            <a href="https://t.me/superswapdex" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#4a5568] hover:text-[#8b97aa] transition-colors">Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
