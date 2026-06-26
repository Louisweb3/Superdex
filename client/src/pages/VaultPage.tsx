import { useState } from "react";
import { useWalletContext } from "@/context/WalletContext";
import { Info, Calendar, ChevronRight, ArrowDownToLine, Coins, ArrowUpFromLine, RefreshCw } from "lucide-react";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";

// ─── Token icon paths ──────────────────────────────────────────────────────────
const ICONS = {
  eth:        "/vaultAssets/icon-eth.png",
  usdc:       "/vaultAssets/icon-usdc.png",
  super:      "/vaultAssets/icon-super.png",
  ethUsdcLp:  "/vaultAssets/icon-eth-usdc-lp.png",
  vault:      "/vaultAssets/icon-vault.png",
  deposits:   "/vaultAssets/icon-deposits.png",
  sparkline:  "/vaultAssets/icon-sparkline.png",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
interface VaultPool {
  id: string;
  name: string;
  badge: "Core" | "Premium";
  description: string;
  icon: string;
  isLP?: boolean;
  apy: number;
  apyChange: number;
  tvl: number;
  yourDeposit: number;
  yourDepositSymbol: string;
  yourDepositUsd: number;
  yourEarned: number;
  yourEarnedSymbol: string;
  yourEarnedUsd: number;
  lockDays: number;
}

const VAULT_POOLS: VaultPool[] = [
  {
    id: "eth",
    name: "ETH Vault",
    badge: "Core",
    description: "Stake ETH and earn competitive rewards.",
    icon: ICONS.eth,
    apy: 6.82,
    apyChange: 1.25,
    tvl: 8_450_000,
    yourDeposit: 1.25,
    yourDepositSymbol: "ETH",
    yourDepositUsd: 2158.73,
    yourEarned: 0.0452,
    yourEarnedSymbol: "ETH",
    yourEarnedUsd: 78.23,
    lockDays: 0,
  },
  {
    id: "usdc",
    name: "USDC Vault",
    badge: "Core",
    description: "Stake USDC and earn stable rewards.",
    icon: ICONS.usdc,
    apy: 9.42,
    apyChange: 1.32,
    tvl: 7_320_000,
    yourDeposit: 1200,
    yourDepositSymbol: "USDC",
    yourDepositUsd: 1200,
    yourEarned: 18.45,
    yourEarnedSymbol: "USDC",
    yourEarnedUsd: 18.45,
    lockDays: 0,
  },
  {
    id: "super",
    name: "SUPER Vault",
    badge: "Premium",
    description: "Stake $SUPER and earn boosted rewards.",
    icon: ICONS.super,
    apy: 24.85,
    apyChange: 2.85,
    tvl: 5_210_000,
    yourDeposit: 2500,
    yourDepositSymbol: "SUPER",
    yourDepositUsd: 1381.25,
    yourEarned: 152.35,
    yourEarnedSymbol: "SUPER",
    yourEarnedUsd: 84.12,
    lockDays: 30,
  },
  {
    id: "eth-usdc-lp",
    name: "ETH/USDC LP",
    badge: "Core",
    description: "Provide liquidity and earn higher APY.",
    icon: ICONS.ethUsdcLp,
    isLP: true,
    apy: 12.34,
    apyChange: 1.57,
    tvl: 3_580_000,
    yourDeposit: 1250,
    yourDepositSymbol: "LP",
    yourDepositUsd: 2340.5,
    yourEarned: 45.32,
    yourEarnedSymbol: "USDC",
    yourEarnedUsd: 45.32,
    lockDays: 0,
  },
];

const STATS = [
  { label: "Total Value Locked",    value: "$24.56M",    change: "+12.45%", icon: ICONS.vault    },
  { label: "Total Earned (All Time)",value: "$1,248,721", change: "+9.32%",  icon: ICONS.vault    },
  { label: "Your Deposits",         value: "$2,740.35",  change: null,       icon: ICONS.deposits },
  { label: "Your Earnings",         value: "$124.58",    change: "+6.21%",   icon: ICONS.super    },
];

const HOW_IT_WORKS = [
  { icon: ArrowDownToLine, label: "Deposit",  desc: "Deposit ETH, USDC or $SUPER into the vault of your choice." },
  { icon: Coins,           label: "Earn",     desc: "Earn attractive APY rewards that are compounded daily." },
  { icon: ArrowUpFromLine, label: "Withdraw", desc: "Withdraw anytime or at the end of the lock-up period." },
  { icon: RefreshCw,       label: "Repeat",   desc: "Compound your earnings and grow your holdings." },
];

const PRICES = [
  { symbol: "ETH",   price: "$3,452.21", change: "+1.23%", icon: ICONS.eth   },
  { symbol: "USDC",  price: "$1.00",     change: "+0.01%", icon: ICONS.usdc  },
  { symbol: "SUPER", price: "$0.552",    change: "+3.45%", icon: ICONS.super },
];

function fmtTvl(n: number) {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "$" + (n / 1_000).toFixed(2) + "K";
  return "$" + n.toFixed(2);
}

// ─── Vault Row Card ────────────────────────────────────────────────────────────
function VaultRow({ pool, connected, onConnectRequest }: {
  pool: VaultPool;
  connected: boolean;
  onConnectRequest: () => void;
}) {
  return (
    <div className="border border-[#0e1a14] rounded-[10px] bg-[#010d06] mb-3 overflow-hidden">

      {/* Main content row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-0">

        {/* Token info – always visible */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3 lg:py-4 lg:w-[260px] lg:flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0a1a0e] border border-[#1a2e1e] flex items-center justify-center flex-shrink-0">
            <img src={pool.icon} className="w-7 h-7 object-contain" alt={pool.name} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[#c8cace] font-semibold text-[14px]">{pool.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                pool.badge === "Premium"
                  ? "bg-purple-900/30 text-purple-400 border border-purple-800/30"
                  : "bg-[#0a2010] text-[#22c55e] border border-[#0e3018]"
              }`}>
                {pool.badge}
              </span>
            </div>
            <p className="text-[#4a5260] text-[11px] leading-tight">{pool.description}</p>
          </div>
        </div>

        {/* Stats columns – shown as 2×2 grid on mobile, row on desktop */}
        <div className="flex-1 grid grid-cols-2 lg:flex lg:flex-row px-4 pb-4 lg:px-0 lg:pb-0 gap-3 lg:gap-0">

          {/* APY */}
          <div className="lg:flex-1 lg:px-4 lg:py-4 lg:border-l lg:border-[#0a1510]">
            <div className="lg:hidden text-[#5a6270] text-[10px] uppercase tracking-wider mb-1">APY</div>
            <div className="text-[#c8cace] font-bold text-[18px] leading-tight">{pool.apy.toFixed(2)}%</div>
            <div className="text-[#22c55e] text-[11px]">+{pool.apyChange.toFixed(2)}%</div>
          </div>

          {/* TVL */}
          <div className="lg:flex-1 lg:px-4 lg:py-4 lg:border-l lg:border-[#0a1510]">
            <div className="lg:hidden text-[#5a6270] text-[10px] uppercase tracking-wider mb-1">TVL</div>
            <div className="text-[#c8cace] font-semibold text-[14px]">{fmtTvl(pool.tvl)}</div>
          </div>

          {/* Your Deposit */}
          <div className="lg:flex-1 lg:px-4 lg:py-4 lg:border-l lg:border-[#0a1510]">
            <div className="lg:hidden text-[#5a6270] text-[10px] uppercase tracking-wider mb-1">Your Deposit</div>
            {connected ? (
              <>
                <div className="text-[#c8cace] font-semibold text-[13px]">
                  {pool.yourDeposit.toLocaleString()} {pool.yourDepositSymbol}
                </div>
                <div className="text-[#4a5260] text-[11px]">
                  ${pool.yourDepositUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </>
            ) : (
              <div className="text-[#3a4250] text-[13px]">—</div>
            )}
          </div>

          {/* Your Earned */}
          <div className="lg:flex-1 lg:px-4 lg:py-4 lg:border-l lg:border-[#0a1510]">
            <div className="lg:hidden text-[#5a6270] text-[10px] uppercase tracking-wider mb-1">Your Earned</div>
            {connected ? (
              <>
                <div className="text-[#22c55e] font-semibold text-[13px]">
                  {pool.yourEarned} {pool.yourEarnedSymbol}
                </div>
                <div className="text-[#4a5260] text-[11px]">${pool.yourEarnedUsd.toFixed(2)}</div>
              </>
            ) : (
              <div className="text-[#3a4250] text-[13px]">—</div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-row lg:flex-col gap-2 px-4 pb-4 lg:px-4 lg:py-4 lg:border-l lg:border-[#0a1510] lg:w-[110px] lg:flex-shrink-0">
          <button
            onClick={() => !connected && onConnectRequest()}
            data-testid={`btn-deposit-${pool.id}`}
            className="flex-1 lg:flex-none px-3 py-2 rounded-lg bg-[#22c55e] text-black font-semibold text-[12px] hover:bg-[#16a34a] active:scale-95 transition-all"
          >
            Deposit
          </button>
          <button
            onClick={() => !connected && onConnectRequest()}
            data-testid={`btn-withdraw-${pool.id}`}
            className="flex-1 lg:flex-none px-3 py-2 rounded-lg bg-[#0a1a0e] border border-[#1a2e1e] text-[#7a8290] font-semibold text-[12px] hover:border-[#22c55e]/40 transition-colors"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#0a1510] bg-[#010805]">
        <div className="flex items-center gap-1">
          <span className="text-[#3a4250] text-[11px]">Lock-up:</span>
          <span className="text-[#5a6270] text-[11px] font-medium ml-1">
            {pool.lockDays > 0 ? `${pool.lockDays} days` : "No lock-up"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#3a4250] text-[11px]">Payout:</span>
          <span className="text-[#5a6270] text-[11px] font-medium">Daily</span>
          <Calendar size={11} className="text-[#3a4250]" />
        </div>
        <button className="text-[#22c55e] text-[11px] font-medium flex items-center gap-0.5 hover:text-[#16a34a] transition-colors">
          Details <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function VaultPage(): JSX.Element {
  const wallet = useWalletContext();
  const [walletOpen, setWalletOpen] = useState(false);
  const connected = wallet.isConnected;

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-[#00040b] text-white overflow-y-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-[#0a1510] px-5 sm:px-8 py-5">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Left: title + subtitle */}
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#c8cace] leading-tight">
              Vaults
            </h1>
            <p className="text-[#6f727b] text-[13px] mt-0.5">
              Stake your assets and earn high rewards.
            </p>
          </div>

          {/* Right: TVL + sparkline */}
          <div className="flex items-end gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[#6f727b] text-[12px] mb-1">
                <span>Total Value Locked</span>
                <Info size={12} className="text-[#3a4250]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c8cace] font-semibold text-[22px]">$24,562,721</span>
                <span className="text-[#22c55e] text-[13px] font-medium">+12.45%</span>
              </div>
            </div>
            <img
              src={ICONS.sparkline}
              alt=""
              className="w-[60px] h-[24px] object-contain mb-1 hidden sm:block"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {STATS.map(({ label, value, change, icon }) => (
            <div
              key={label}
              className="bg-[#020c05] border border-[#0a1510] rounded-[10px] px-4 py-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#0a1a0e] border border-[#1a2e1e] flex items-center justify-center overflow-hidden">
                  <img src={icon} className="w-4 h-4 object-contain" alt="" />
                </div>
                <span className="text-[#5a6270] text-[10px] leading-tight">{label}</span>
              </div>
              <div className="text-[#c8cace] font-semibold text-[18px] sm:text-[20px]">{value}</div>
              {change && <div className="text-[#22c55e] text-[11px] mt-0.5">{change}</div>}
            </div>
          ))}
        </div>

        {/* ── Two-column: promo | vault list ────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Promo sidebar */}
          <div className="lg:w-[190px] flex-shrink-0">
            <div className="bg-[#010d07] border border-[#0e1a14] rounded-[14px] p-5 text-center lg:sticky lg:top-6">
              <p className="text-[#7a8290] text-[12px] leading-snug mb-1">Boost your earnings with</p>
              <p className="text-[#22c55e] font-bold text-[18px] mb-4">$SUPER</p>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#0a1a0e] border border-[#1a2e1e] flex items-center justify-center overflow-hidden">
                  <img src={ICONS.super} className="w-12 h-12 object-contain" alt="SUPER" />
                </div>
              </div>
              <button className="flex items-center gap-1 mx-auto text-[#22c55e] text-[12px] font-medium border border-[#0e3018] bg-[#0a2010] px-3 py-1.5 rounded-lg hover:bg-[#0e2a14] transition-colors">
                Learn More <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Vault list */}
          <div className="flex-1 min-w-0">

            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#8a9099] text-[13px] font-semibold">Available Vaults</span>
              <span className="text-[#3a4250] text-[12px]">{VAULT_POOLS.length} vaults</span>
            </div>

            {/* Column headers (desktop only) */}
            <div className="hidden lg:grid gap-0 mb-1 px-4" style={{ gridTemplateColumns: "260px 1fr 1fr 1fr 1fr 110px" }}>
              {["", "APY", "TVL", "Your Deposit", "Your Earned", ""].map((h, i) => (
                <div key={i} className={`text-[#3a4250] text-[10px] uppercase tracking-wider ${i > 0 ? "px-4" : ""}`}>
                  {h}
                </div>
              ))}
            </div>

            {/* Vault rows */}
            {VAULT_POOLS.map((pool) => (
              <VaultRow
                key={pool.id}
                pool={pool}
                connected={connected}
                onConnectRequest={() => setWalletOpen(true)}
              />
            ))}

            {/* ── How it works ─────────────────────────────────────────────── */}
            <div className="mt-8">
              <h3 className="text-[#8a9099] text-[13px] font-semibold mb-4">How it works</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {HOW_IT_WORKS.map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="bg-[#010d07] border border-[#0e1a14] rounded-[10px] p-4 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0a2010] border border-[#0e3018] flex items-center justify-center mx-auto mb-3">
                      <Icon size={18} className="text-[#22c55e]" />
                    </div>
                    <div className="text-[#c8cace] text-[12px] font-semibold mb-1">{label}</div>
                    <div className="text-[#4a5260] text-[10px] leading-snug">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom price ticker ───────────────────────────────────────────── */}
        <div className="mt-8 pt-4 border-t border-[#0a1510] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-6">
            {PRICES.map(({ symbol, price, change, icon }) => (
              <div key={symbol} className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-[#0a1a0e] flex items-center justify-center">
                  <img src={icon} className="w-4 h-4 object-contain" alt={symbol} />
                </div>
                <span className="text-[#8a9099] text-[12px] font-medium">{symbol}</span>
                <span className="text-[#c8cace] text-[12px]">{price}</span>
                <span className="text-[#22c55e] text-[11px]">{change}</span>
              </div>
            ))}
          </div>
          <button className="text-[#22c55e] text-[12px] font-medium flex items-center gap-1 hover:text-[#16a34a] transition-colors whitespace-nowrap">
            View All Markets <ChevronRight size={13} />
          </button>
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
