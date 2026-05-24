import { useState } from "react";
import { Settings, ChevronDown, ArrowUpDown, ChevronRight, Info, Zap } from "lucide-react";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";

const tokens = [
  { symbol: "ETH", name: "Ethereum", icon: "/figmaAssets/image-7.png", price: 1726.45, change: -0.40 },
  { symbol: "USDC", name: "USD Coin", icon: "/figmaAssets/image-5.png", price: 1.00, change: +0.01 },
  { symbol: "cbBTC", name: "Coinbase Bitcoin", icon: "/figmaAssets/image-6.png", price: 77221.10, change: -0.01 },
  { symbol: "DAI", name: "Dai Stablecoin", icon: "/figmaAssets/image-5.png", price: 1.00, change: +0.02 },
  { symbol: "WETH", name: "Wrapped Ether", icon: "/figmaAssets/image-7.png", price: 1724.35, change: -0.41 },
];

const routes = [
  {
    id: "aerodrome",
    badgeLabel: "Best Route",
    dex: "Aerodrome",
    dexIcon: "/figmaAssets/image-17.png",
    midIcon: "/figmaAssets/image-5.png",
    fromIcon: "/figmaAssets/image-7.png",
    fee: "0.05%",
    output: "1,726.45 USDC",
    outputTag: "Best Output",
    feeUSD: "$0.86",
    diff: null,
    isBest: true,
  },
  {
    id: "pancake",
    badgeLabel: null,
    dex: "PancakeSwap",
    dexIcon: "/figmaAssets/image-19.png",
    midIcon: "/figmaAssets/image-5.png",
    fromIcon: "/figmaAssets/image-7.png",
    fee: "0.30%",
    output: "1,724.31 USDC",
    outputTag: null,
    feeUSD: "$2.94",
    diff: "-0.12%",
    isBest: false,
  },
  {
    id: "baseswap",
    badgeLabel: null,
    dex: "BaseSwap",
    dexIcon: "/figmaAssets/image-15.png",
    midIcon: "/figmaAssets/image-5.png",
    fromIcon: "/figmaAssets/image-7.png",
    fee: "0.50%",
    output: "1,716.22 USDC",
    outputTag: null,
    feeUSD: "$4.32",
    diff: "-0.59%",
    isBest: false,
  },
];

const chartTabs = ["1H", "4H", "1D", "1W", "1M"];

const chartPoints = [
  [0,85],[4,80],[8,88],[12,75],[16,82],[20,68],[24,78],[28,60],[32,72],
  [36,55],[40,65],[44,50],[48,60],[52,42],[56,58],[60,38],[64,48],[68,30],
  [72,40],[76,25],[80,35],[84,18],[88,28],[92,12],[96,20],[100,8],
];

function SparkLine() {
  const w = 284;
  const h = 100;
  const points = chartPoints.map(([x, y]) => `${(x / 100) * w},${(y / 100) * h}`).join(" ");
  const areaPoints = `0,${h} ` + points + ` ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dae50" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2dae50" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline points={points} fill="none" stroke="#2dae50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TokenSelector({
  label,
  token,
  amount,
  onAmountChange,
  readonly,
  usdValue,
  balance,
}: {
  label: string;
  token: typeof tokens[0];
  amount: string;
  onAmountChange?: (v: string) => void;
  readonly?: boolean;
  usdValue: string;
  balance: string;
}) {
  return (
    <div className="relative rounded-[18px] border border-[#0d1e2e] bg-[#040e1e] px-4 pt-3 pb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-['Inter',sans-serif] text-[13px] font-medium text-[#4d5a6e]">{label}</span>
        <span className="font-['Inter',sans-serif] text-[12px] text-[#3a4a5c]">
          Balance: <span className="text-[#2dae50]">{balance}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#0f2030] bg-[#060f1e] px-3 py-2 transition-colors hover:border-[#1a3a50] hover:bg-[#071525]">
          <img src={token.icon} alt={token.symbol} className="h-7 w-7 rounded-full object-cover" />
          <span className="font-['Inter',sans-serif] text-base font-bold text-[#c8ccd2]">{token.symbol}</span>
          <ChevronDown className="h-4 w-4 text-[#3a4a5c]" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-end">
          {readonly ? (
            <span className="w-full text-right font-['Inter',sans-serif] text-[26px] font-bold text-[#3acd5b] leading-none">
              {amount}
            </span>
          ) : (
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange?.(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-right font-['Inter',sans-serif] text-[26px] font-bold text-[#d0d4da] leading-none outline-none placeholder:text-[#2a3a4c] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          )}
          <span className="mt-1 font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">{usdValue}</span>
        </div>
      </div>
    </div>
  );
}

function RouteRow({ route, selected, onSelect }: { route: typeof routes[0]; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-[14px] border px-3 py-3.5 text-left transition-all ${
        selected
          ? "border-[#1a4a2a] bg-[#040e1a] shadow-[0_0_12px_rgba(45,174,80,0.08)]"
          : "border-[#0a1825] bg-[#030c16] hover:border-[#122233] hover:bg-[#040e1c]"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <img src={route.fromIcon} className="h-6 w-6 rounded-full object-cover" alt="" />
        <svg className="h-2.5 w-3 text-[#2a3a4c]" viewBox="0 0 12 8" fill="none">
          <path d="M1 4h10M7 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <img src={route.dexIcon} className="h-6 w-6 rounded-full object-cover" alt="" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="font-['Inter',sans-serif] text-[14px] font-medium text-[#9da1a8]">{route.output}</span>
          {route.outputTag && (
            <span className="rounded-full bg-[#0a2418] px-2 py-0.5 font-['Inter',sans-serif] text-[10px] font-bold text-[#2dae50]">
              {route.outputTag}
            </span>
          )}
          {route.diff && (
            <span className="font-['Inter',sans-serif] text-[12px] text-[#7f4040]">{route.diff}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {route.badgeLabel && (
            <span className="font-['Inter',sans-serif] text-[11px] font-bold text-[#4d5a6e]">{route.badgeLabel}</span>
          )}
          <span className="font-['Inter',sans-serif] text-[11px] text-[#2f3d4e]">{route.dex}</span>
          <span className="font-['Inter',sans-serif] text-[11px] text-[#2f3d4e]">• {route.fee} fee</span>
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="font-['Inter',sans-serif] text-[12px] font-bold text-[#4d5a6e]">{route.fee}</span>
        <span className="font-['Inter',sans-serif] text-[11px] text-[#2a3840]">{route.feeUSD}</span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#1a2a38]" />
    </button>
  );
}

interface SwapPageProps {
  onConnect?: () => void;
}

export function SwapPage({ onConnect }: SwapPageProps) {
  const [payAmount, setPayAmount] = useState("1");
  const [selectedRoute, setSelectedRoute] = useState("aerodrome");
  const [chartTab, setChartTab] = useState("1D");
  const [flipped, setFlipped] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [walletOpen, setWalletOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMoreRoutes, setShowMoreRoutes] = useState(false);

  const payToken = tokens[0];  // ETH
  const receiveToken = tokens[1]; // USDC

  const receiveAmount = payAmount
    ? (parseFloat(payAmount) * 1726.45).toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "0.00";
  const payUsd = payAmount ? `≈ $${(parseFloat(payAmount) * 1726.45).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "≈ $0.00";
  const receiveUsd = payAmount ? `≈ $${(parseFloat(payAmount) * 1726.45).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "≈ $0.00";

  const visibleRoutes = showMoreRoutes ? routes : routes.slice(0, 2);

  return (
    <>
      <div className="w-full px-2 sm:px-3 py-3 sm:py-4">

        {/* Two column layout */}
        <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">

            {/* Swap Widget */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0c1e30] bg-[#030d1a]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#071625]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#2dae50]" />
                  <span className="font-['Inter',sans-serif] text-[15px] font-bold text-[#b0b5be]">Swap</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#0d1e2e] bg-[#040e1e] transition-colors hover:border-[#1a3040] hover:bg-[#060f1e]"
                  >
                    <Settings className="h-[14px] w-[14px] text-[#4a5a6a]" />
                  </button>
                </div>
              </div>

              {/* Settings panel */}
              {showSettings && (
                <div className="border-b border-[#071625] bg-[#030c17] px-5 py-4">
                  <p className="mb-2 font-['Inter',sans-serif] text-[12px] font-medium text-[#4d5a6e]">Slippage Tolerance</p>
                  <div className="flex items-center gap-2">
                    {["0.1", "0.5", "1.0"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSlippage(s)}
                        className={`rounded-lg border px-3 py-1.5 font-['Inter',sans-serif] text-[13px] transition-all ${
                          slippage === s
                            ? "border-[#1a4a2a] bg-[#0a2015] text-[#2dae50]"
                            : "border-[#0d1e2e] bg-[#040e1e] text-[#4d5a6e] hover:border-[#122233]"
                        }`}
                      >
                        {s}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 rounded-lg border border-[#0d1e2e] bg-[#040e1e] px-3 py-1.5">
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-12 bg-transparent font-['Inter',sans-serif] text-[13px] text-[#9da1a8] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Swap inputs */}
              <div className="relative px-4 pt-3 pb-2">
                <TokenSelector
                  label="You Pay"
                  token={payToken}
                  amount={payAmount}
                  onAmountChange={setPayAmount}
                  usdValue={payUsd}
                  balance="2.458 ETH"
                />

                {/* Flip button */}
                <div className="relative z-10 flex justify-center py-1">
                  <button
                    onClick={() => setFlipped(!flipped)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#030d1a] bg-[#0b1e2e] shadow-lg transition-all hover:bg-[#0e2438] active:scale-90"
                    style={{ transform: flipped ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}
                  >
                    <ArrowUpDown className="h-4 w-4 text-[#2dae50]" />
                  </button>
                </div>

                <TokenSelector
                  label="You Receive"
                  token={receiveToken}
                  amount={receiveAmount}
                  readonly
                  usdValue={receiveUsd}
                  balance="1,240.00 USDC"
                />
              </div>

              {/* Swap info */}
              <div className="px-4 pb-3">
                <div className="rounded-[14px] border border-[#080f1e] bg-[#020a14] px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Rate</span>
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#7a8494]">
                      1 ETH = 1,726.45 USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Price Impact</span>
                      <Info className="h-3 w-3 text-[#2a3a4c]" />
                    </div>
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#7f4040]">-0.12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Network Fee</span>
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#7a8494]">≈ $0.86</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">Slippage</span>
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#7a8494]">{slippage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">SuperSwap Reward</span>
                    </div>
                    <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#2dae50]">+ $0.22 🎁</span>
                  </div>
                </div>
              </div>

              {/* Swap button */}
              <div className="px-4 pb-4">
                {connected ? (
                  <button
                    className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#37c056] bg-[#49f764] font-['Inter',sans-serif] text-[17px] font-bold text-[#061a0e] transition-all hover:bg-[#3de055] active:scale-[0.98]"
                  >
                    <Zap className="h-5 w-5" />
                    Swap Now
                  </button>
                ) : (
                  <button
                    onClick={() => setWalletOpen(true)}
                    className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#12352d] bg-[#000d10] font-['Inter',sans-serif] text-[17px] font-bold text-[#2ca84c] transition-all hover:bg-[#041418] active:scale-[0.98]"
                  >
                    Connect Wallet to Swap
                  </button>
                )}
              </div>
            </div>

            {/* Best Routes */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18]">
              <div className="flex items-center justify-between border-b border-[#071522] px-5 py-4">
                <div className="flex items-center gap-2">
                  <img src="/figmaAssets/image-17.png" alt="" className="h-6 w-6 rounded-full object-cover" />
                  <span className="font-['Inter',sans-serif] text-[15px] font-bold text-[#9da1a8]">Best Routes</span>
                </div>
                <button className="flex h-7 w-7 items-center justify-center rounded-full border border-[#0d1e2e] bg-[#040e1e] hover:border-[#1a3040]">
                  <Settings className="h-3.5 w-3.5 text-[#3a4a5c]" />
                </button>
              </div>
              <div className="flex flex-col gap-2 p-4">
                {visibleRoutes.map((route) => (
                  <RouteRow
                    key={route.id}
                    route={route}
                    selected={selectedRoute === route.id}
                    onSelect={() => setSelectedRoute(route.id)}
                  />
                ))}
              </div>
              <button
                onClick={() => setShowMoreRoutes(!showMoreRoutes)}
                className="flex w-full items-center justify-center gap-2 border-t border-[#071522] py-3 font-['Inter',sans-serif] text-[13px] text-[#3a4a5c] hover:text-[#5a6a7c] transition-colors"
              >
                {showMoreRoutes ? "Show Fewer Routes" : "Show More Routes"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showMoreRoutes ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex w-full flex-col gap-3 lg:w-[316px] lg:shrink-0">

            {/* Live Chart */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18]">
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <img src="/figmaAssets/image-7.png" alt="ETH" className="h-6 w-6 rounded-full object-cover" />
                      <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#8c909a]">ETH / USDC</span>
                    </div>
                    <p className="mt-1 font-['Inter',sans-serif] text-[24px] font-bold text-[#c8ccd4]">$1,726.45</p>
                    <p className="font-['Inter',sans-serif] text-[13px] text-[#7f4040]">▼ -0.40%</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {chartTabs.map((t) => (
                      <button
                        key={t}
                        onClick={() => setChartTab(t)}
                        className={`w-10 rounded-md px-2 py-1 text-center font-['Inter',sans-serif] text-[11px] font-medium transition-all ${
                          chartTab === t
                            ? "bg-[#0a2015] text-[#2dae50]"
                            : "text-[#3a4a5c] hover:text-[#5a6a7c]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-3 pb-2 h-[120px]">
                <SparkLine />
              </div>
              <div className="flex items-center justify-between px-5 pb-4">
                <span className="font-['Inter',sans-serif] text-[11px] text-[#2a3840]">Low: $1,682.10</span>
                <span className="font-['Inter',sans-serif] text-[11px] text-[#2a3840]">High: $1,748.32</span>
              </div>
            </div>

            {/* Popular Tokens */}
            <div className="relative w-full overflow-hidden rounded-[22px] border border-[#0a1825] bg-[#020c18]">
              <div className="border-b border-[#071522] px-5 py-4">
                <span className="font-['Inter',sans-serif] text-[15px] font-bold text-[#9da1a8]">Popular Tokens</span>
              </div>
              <div className="flex flex-col divide-y divide-[#071522]">
                {tokens.map((token) => (
                  <button
                    key={token.symbol}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#030e1c] active:bg-[#040f1e]"
                  >
                    <img src={token.icon} alt={token.symbol} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#9da1a8]">{token.symbol}</span>
                      <span className="font-['Inter',sans-serif] text-[12px] text-[#3a4a5c]">{token.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-['Inter',sans-serif] text-[13px] font-medium text-[#8c909a]">
                        ${token.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`font-['Inter',sans-serif] text-[12px] ${token.change >= 0 ? "text-[#2dae50]" : "text-[#7f4040]"}`}
                      >
                        {token.change >= 0 ? "+" : ""}{token.change.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <button className="flex w-full items-center justify-between border-t border-[#071522] px-5 py-3 transition-colors hover:bg-[#030e1c]">
                <span className="font-['Inter',sans-serif] text-[13px] text-[#4d5a6e]">View All Tokens</span>
                <ChevronRight className="h-4 w-4 text-[#2a3840]" />
              </button>
            </div>
          </div>
        </div>

        {/* Maximize Your Rewards Banner */}
        <div className="mt-3 relative w-full overflow-hidden rounded-[22px] border border-[#0c1825] bg-[#020b16]">
          <div className="flex flex-col sm:flex-row items-center gap-4 px-5 py-5 sm:px-7 sm:py-5">
            <div className="flex h-[90px] w-[90px] shrink-0 items-center justify-center rounded-full bg-[#030e1e]">
              <Zap className="h-10 w-10 text-[#2dae50]" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col text-center sm:text-left">
              <span className="font-['Inter',sans-serif] text-[17px] font-bold text-[#b0b5be]">Maximize your rewards</span>
              <span className="mt-1 font-['Inter',sans-serif] text-[14px] text-[#4d5a6e]">
                Hold $SUPER to boost your swap rewards and unlock exclusive perks on every trade.
              </span>
            </div>
            <button className="flex shrink-0 items-center gap-2 rounded-[14px] border border-[#37c056] bg-[#49f764] px-6 py-3 font-['Inter',sans-serif] text-[15px] font-bold text-[#061a0e] transition-all hover:bg-[#3de055] active:scale-[0.98]">
              Get $SUPER
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={() => setConnected(true)}
      />
    </>
  );
}
