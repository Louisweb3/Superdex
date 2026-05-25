import { useState } from "react";
import { useWalletContext } from "@/context/WalletContext";
import {
  Shield,
  Lock,
  TrendingUp,
  Clock,
  ChevronDown,
  Zap,
  Info,
  CheckCircle2,
  Wallet,
} from "lucide-react";

import { ConnectWalletModal } from "@/components/ConnectWalletModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortWallet(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function fmtUsd(n: number) {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(2) + "k";
  return "$" + n.toFixed(2);
}

function fmtPct(n: number) {
  return n.toFixed(2) + "%";
}

// ─── Mock vault pools ──────────────────────────────────────────────────────────
interface VaultPool {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  apy: number;
  tvl: number;
  userStaked: number;
  userEarned: number;
  lockDays: number;
  tokenAddress: string;
}

const VAULT_POOLS: VaultPool[] = [
  {
    id: "super-eth",
    name: "Super ETH",
    symbol: "sETH",
    icon: "/figmaAssets/eth-token.png",
    apy: 8.42,
    tvl: 2_340_500,
    userStaked: 0,
    userEarned: 0,
    lockDays: 0,
    tokenAddress: "0x4200000000000000000000000000000000000006",
  },
  {
    id: "super-usdc",
    name: "Super USDC",
    symbol: "sUSDC",
    icon: "/figmaAssets/image-5.png",
    apy: 12.15,
    tvl: 4_120_800,
    userStaked: 0,
    userEarned: 0,
    lockDays: 7,
    tokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  },
  {
    id: "super-cbtc",
    name: "Super cbBTC",
    symbol: "scbBTC",
    icon: "/figmaAssets/image-6.png",
    apy: 5.78,
    tvl: 890_200,
    userStaked: 0,
    userEarned: 0,
    lockDays: 14,
    tokenAddress: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  },
  {
    id: "super-super",
    name: "Super Token",
    symbol: "SUPER",
    icon: "/figmaAssets/super-coin.png",
    apy: 24.6,
    tvl: 1_560_000,
    userStaked: 0,
    userEarned: 0,
    lockDays: 30,
    tokenAddress: "0x0000000000000000000000000000000000000000",
  },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[24px] border border-white/[0.06] bg-[#0B1118] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2">
        <span className="text-cyan-300">{icon}</span>

        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#64748B]">
          {label}
        </span>
      </div>

      <p className="mt-4 text-[28px] font-black tracking-[-0.04em] text-white">
        {value}
      </p>

      {sub && (
        <p className="mt-2 text-[13px] text-[#94A3B8]">
          {sub}
        </p>
      )}
    </article>
  );
}

// ─── Pool Card ────────────────────────────────────────────────────────────────
function PoolCard({
  pool,
  connected,
}: {
  pool: VaultPool;
  connected: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"stake" | "unstake">("stake");

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0B1118] transition-all duration-300 hover:border-cyan-400/20">

      {/* HEADER */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-5 text-left"
      >

        {/* TOKEN */}
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#111827]">

          <img
            src={pool.icon}
            alt={pool.symbol}
            className="h-8 w-8 rounded-full object-cover"
          />

          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
            <Lock className="h-3 w-3 text-emerald-300" />
          </div>
        </div>

        {/* INFO */}
        <div className="min-w-0 flex-1">

          <div className="flex items-center justify-between gap-3">

            <div>

              <p className="text-[18px] font-bold text-white">
                {pool.name}
              </p>

              <p className="mt-1 text-[13px] text-[#94A3B8]">
                {pool.lockDays > 0
                  ? `${pool.lockDays}-day lock`
                  : "No lock"} · TVL {fmtUsd(pool.tvl)}
              </p>
            </div>

            <div className="text-right">

              <p className="text-[24px] font-black tracking-[-0.04em] text-emerald-300">
                {fmtPct(pool.apy)}
              </p>

              <p className="text-[11px] uppercase tracking-[0.15em] text-[#64748B]">
                APY
              </p>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-[#64748B] transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* EXPANDED */}
      {expanded && (
        <div className="border-t border-white/[0.05] px-5 pb-5 pt-5">

          {/* TABS */}
          <div className="mb-5 grid grid-cols-2 gap-3">

            <button
              onClick={() => setTab("stake")}
              className={`rounded-[16px] py-3 text-[14px] font-bold transition-all ${
                tab === "stake"
                  ? "bg-cyan-400 text-black"
                  : "bg-[#111827] text-[#94A3B8]"
              }`}
            >
              Stake
            </button>

            <button
              onClick={() => setTab("unstake")}
              className={`rounded-[16px] py-3 text-[14px] font-bold transition-all ${
                tab === "unstake"
                  ? "bg-red-400 text-black"
                  : "bg-[#111827] text-[#94A3B8]"
              }`}
            >
              Unstake
            </button>
          </div>

          {!connected && (
            <div className="flex flex-col items-center gap-4 py-8">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111827]">
                <Wallet className="h-7 w-7 text-cyan-300" />
              </div>

              <p className="text-[14px] text-[#94A3B8]">
                Connect wallet to continue
              </p>
            </div>
          )}

          {connected && (
            <div className="flex flex-col gap-4">

              {/* INPUT */}
              <div className="rounded-[20px] border border-white/[0.06] bg-[#111827] p-5">

                <div className="mb-3 flex items-center justify-between">

                  <span className="text-[12px] text-[#64748B]">
                    Amount
                  </span>

                  <span className="text-[12px] text-[#64748B]">
                    Balance: —
                  </span>
                </div>

                <div className="flex items-center gap-3">

                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-[32px] font-black tracking-[-0.04em] text-white outline-none placeholder:text-[#334155]"
                  />

                  <span className="text-[14px] font-bold text-[#94A3B8]">
                    {pool.symbol}
                  </span>
                </div>
              </div>

              {/* INFO */}
              <div className="flex items-start gap-2 rounded-[16px] border border-white/[0.05] bg-[#111827] px-4 py-3">

                <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />

                <span className="text-[13px] leading-relaxed text-[#94A3B8]">
                  {tab === "stake"
                    ? `Estimated yearly return: ${
                        amount
                          ? fmtUsd((Number(amount) * pool.apy) / 100)
                          : "$0.00"
                      }`
                    : pool.lockDays > 0
                    ? `Unstaking available after ${pool.lockDays} days`
                    : "Instant unstake available"}
                </span>
              </div>

              {/* BUTTON */}
              <button
                disabled={!amount || Number(amount) <= 0}
                className="rounded-[18px] bg-white py-4 text-[15px] font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-40"
              >
                {tab === "stake"
                  ? "Confirm Stake"
                  : "Confirm Unstake"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function VaultPage(): JSX.Element {
  const wallet = useWalletContext();

  const [walletOpen, setWalletOpen] = useState(false);

  // FORCED POPUP
  const [showVaultPopup] = useState(true);

  const addr = wallet.isConnected ? wallet.address : null;

  return (
    <>
      {/* FORCED POPUP */}
      {showVaultPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md">

          {/* glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_55%)]" />

          {/* popup */}
          <div className="relative w-full max-w-[540px] px-5">

            <div className="overflow-hidden rounded-[34px] border border-white/[0.08] bg-[#070B11] shadow-[0_30px_120px_rgba(0,0,0,0.75)]">

              {/* image */}
              <img
                src="https://i.ibb.co/xSTdr3nh/Chat-GPT-Image-May-25-2026-06-22-11-PM.png"
                alt="Vault"
                className="w-full object-cover"
              />

              {/* overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-7 pb-8 pt-20">
                <div className="flex flex-col items-center text-center">
                  {/* intentionally empty */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE */}
      <div className="min-h-screen w-full bg-[#070B11] px-[16px] pb-[30px] pt-[18px]">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">

          <div>

            <h1 className="text-[34px] font-black tracking-[-0.05em] text-white">
              Vault
            </h1>

            <p className="mt-2 text-[14px] text-[#94A3B8]">
              Stake tokens and earn passive yield
            </p>
          </div>

          {wallet.isConnected && addr && (
            <div className="rounded-[18px] border border-white/[0.06] bg-[#0B1118] px-4 py-3">

              <p className="text-[13px] font-semibold text-cyan-300">
                {shortWallet(addr)}
              </p>

              <p className="mt-1 text-[11px] text-[#64748B]">
                Base Mainnet
              </p>
            </div>
          )}
        </div>

        {/* STATS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="TVL"
            value={fmtUsd(
              VAULT_POOLS.reduce((s, p) => s + p.tvl, 0)
            )}
            sub="Across all pools"
            icon={<Shield className="h-4 w-4" />}
          />

          <StatCard
            label="Average APY"
            value={fmtPct(
              VAULT_POOLS.reduce((s, p) => s + p.apy, 0) /
                VAULT_POOLS.length
            )}
            sub="Weighted average"
            icon={<TrendingUp className="h-4 w-4" />}
          />

          <StatCard
            label="Your Staked"
            value="$0.00"
            sub="Connect wallet"
            icon={<Lock className="h-4 w-4" />}
          />

          <StatCard
            label="Rewards"
            value="$0.00"
            sub="Lifetime earnings"
            icon={<Zap className="h-4 w-4" />}
          />
        </div>

        {/* POOLS */}
        <section>

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
              Vault Pools
            </h2>

            <span className="text-[13px] text-[#94A3B8]">
              {VAULT_POOLS.length} active pools
            </span>
          </div>

          <div className="flex flex-col gap-4">

            {VAULT_POOLS.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                connected={wallet.isConnected}
              />
            ))}
          </div>
        </section>

        {/* INFO */}
        <section className="mt-6">

          <div className="rounded-[28px] border border-white/[0.06] bg-[#0B1118] p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827]">

                <Clock className="h-5 w-5 text-cyan-300" />
              </div>

              <div>

                <h3 className="text-[18px] font-bold text-white">
                  How Vault Works
                </h3>

                <p className="mt-3 max-w-[700px] text-[14px] leading-relaxed text-[#94A3B8]">
                  Deposit your assets into SuperVaults to earn passive yield. Rewards accrue in real-time and can be claimed anytime. Longer lock periods unlock higher APY rewards.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">

                  {[
                    {
                      label: "Auto-compounding",
                      icon: <Zap className="h-3 w-3" />,
                    },
                    {
                      label: "Base secured",
                      icon: <Shield className="h-3 w-3" />,
                    },
                    {
                      label: "No minimum",
                      icon: <CheckCircle2 className="h-3 w-3" />,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#111827] px-4 py-2 text-[12px] text-[#CBD5E1]"
                    >
                      {item.icon}
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* WALLET MODAL */}
      <ConnectWalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onConnect={async () => {
          setWalletOpen(false);
          await wallet.connect();
        }}
      />
    </>
  );
}