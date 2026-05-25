import { useState } from "react";
import { useWalletContext } from "@/context/WalletContext";
import {
  Shield, Lock, TrendingUp, Clock, ArrowRight,
  ChevronDown, Zap, Info, CheckCircle2, Wallet
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

// ─── Mock vault pools (in production, these come from contract reads) ──────────
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

// ─── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-1.5 rounded-[14px] sm:rounded-[18px] border border-[#131b27] bg-[#00040e] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center gap-2">
        <span className="text-[#6c778a]">{icon}</span>
        <span className="font-['Inter',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-[#6c778a]">
          {label}
        </span>
      </div>
      <p className="font-['Inter',sans-serif] text-[20px] sm:text-[24px] font-bold leading-none text-[#d0d2d6]">
        {value}
      </p>
      {sub && (
        <p className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] text-[#667082]">{sub}</p>
      )}
    </article>
  );
}

// ─── Pool card ───────────────────────────────────────────────────────────────
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
    <div className="rounded-[18px] sm:rounded-[22px] border border-[#131b27] bg-[#00040e] overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 sm:gap-4 px-4 py-4 sm:px-6 sm:py-5 text-left"
      >
        <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#071020]">
          <img src={pool.icon} alt={pool.symbol} className="h-6 w-6 sm:h-7 sm:w-7 object-contain rounded-full" />
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#0e3a1e] border border-[#1a5c2a]">
            <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#2dae50]" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-['Inter',sans-serif] text-[14px] sm:text-[16px] font-semibold text-[#c8ccd4]">
                {pool.name}
              </p>
              <p className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] text-[#6c778a]">
                {pool.lockDays > 0 ? `${pool.lockDays}-day lock · ` : "No lock · "}
                TVL {fmtUsd(pool.tvl)}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-['Inter',sans-serif] text-[16px] sm:text-[20px] font-bold text-[#3acd5b]">
                {fmtPct(pool.apy)} APY
              </span>
              <span className="font-['Inter',sans-serif] text-[10px] sm:text-[11px] text-[#667082]">
                {pool.userStaked > 0 ? `Staked: ${fmtUsd(pool.userStaked)}` : "Not staked"}
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#6c778a] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-[#0d1624] px-4 py-4 sm:px-6 sm:py-5">
          {/* Tab switcher */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setTab("stake")}
              className={`flex-1 rounded-[10px] py-2 font-['Inter',sans-serif] text-[13px] font-semibold transition-all ${
                tab === "stake"
                  ? "bg-[#0e3a1e] text-[#3acd5b] border border-[#1a5c2a]"
                  : "bg-[#071020] text-[#6c778a] border border-[#131b27]"
              }`}
            >
              Stake
            </button>
            <button
              onClick={() => setTab("unstake")}
              className={`flex-1 rounded-[10px] py-2 font-['Inter',sans-serif] text-[13px] font-semibold transition-all ${
                tab === "unstake"
                  ? "bg-[#3a0e0e] text-[#c9543a] border border-[#5c1a1a]"
                  : "bg-[#071020] text-[#6c778a] border border-[#131b27]"
              }`}
            >
              Unstake
            </button>
          </div>

          {!connected && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Wallet className="h-8 w-8 text-[#3a4a5c]" />
              <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">
                Connect wallet to {tab}
              </p>
            </div>
          )}

          {connected && (
            <div className="flex flex-col gap-3">
              <div className="rounded-[14px] border border-[#131b27] bg-[#020816] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#6c778a]">
                    {tab === "stake" ? "Amount to stake" : "Amount to unstake"}
                  </span>
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#6c778a]">
                    Balance: —
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent font-['Inter',sans-serif] text-[20px] sm:text-[24px] font-bold text-[#d0d2d6] outline-none placeholder:text-[#3a4a5c]"
                  />
                  <span className="shrink-0 font-['Inter',sans-serif] text-[13px] font-semibold text-[#6c778a]">
                    {pool.symbol}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-[10px] bg-[#071020] px-3 py-2">
                <Info className="h-3.5 w-3.5 shrink-0 text-[#6c778a]" />
                <span className="font-['Inter',sans-serif] text-[11px] text-[#6c778a]">
                  {tab === "stake"
                    ? `Estimated yearly return: ${amount ? fmtUsd(Number(amount) * pool.apy / 100) : "$0.00"}`
                    : pool.lockDays > 0
                    ? `Unstaking will be available after ${pool.lockDays}-day lock period`
                    : "No lock period — instant unstake"}
                </span>
              </div>

              <button
                disabled={!amount || Number(amount) <= 0}
                className="w-full rounded-[14px] bg-[#0e3a1e] py-3 font-['Inter',sans-serif] text-[15px] font-bold text-[#3acd5b] border border-[#1a5c2a] hover:bg-[#143e22] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {tab === "stake" ? "Confirm Stake" : "Confirm Unstake"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main VaultPage ──────────────────────────────────────────────────────────────
export function VaultPage(): JSX.Element {
  const wallet = useWalletContext();
  const [walletOpen, setWalletOpen] = useState(false);
  const addr = wallet.isConnected ? wallet.address : null;

  return (
    <>
      <div className="w-full pb-[8px] px-[14px] sm:px-[18px] pt-[12px] sm:pt-[16px]">
        {/* Page header */}
        <div className="mb-4 sm:mb-5 flex items-center justify-between">
          <div>
            <h1 className="font-['Inter',sans-serif] text-[18px] sm:text-[22px] font-bold leading-none text-[#d0d2d6]">
              Vault
            </h1>
            <p className="mt-1 font-['Inter',sans-serif] text-[11px] sm:text-[12px] text-[#5f6a7c]">
              Stake tokens to earn yield on SuperSwap
            </p>
          </div>
          {wallet.isConnected && addr && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] font-medium text-[#3acd5b]">
                {shortWallet(addr)}
              </span>
              <span className="font-['Inter',sans-serif] text-[10px] text-[#6c778a]">Base Mainnet</span>
            </div>
          )}
        </div>

        {/* Vault stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
          <StatCard
            label="Total Value Locked"
            value={fmtUsd(VAULT_POOLS.reduce((s, p) => s + p.tvl, 0))}
            sub="Across all pools"
            icon={<Shield className="h-4 w-4" />}
          />
          <StatCard
            label="Avg APY"
            value={fmtPct(VAULT_POOLS.reduce((s, p) => s + p.apy, 0) / VAULT_POOLS.length)}
            sub="Weighted average"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            label="Your Staked"
            value="$0.00"
            sub="Connect to view"
            icon={<Lock className="h-4 w-4" />}
          />
          <StatCard
            label="Rewards Earned"
            value="$0.00"
            sub="Lifetime vault yield"
            icon={<Zap className="h-4 w-4" />}
          />
        </div>

        {/* Vault pools */}
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="font-['Inter',sans-serif] text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-[#5f6a7c]">
              Staking Pools
            </h2>
            <span className="font-['Inter',sans-serif] text-[11px] sm:text-[12px] text-[#6c778a]">
              {VAULT_POOLS.length} pools available
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:gap-4">
            {VAULT_POOLS.map((pool) => (
              <PoolCard key={pool.id} pool={pool} connected={wallet.isConnected} />
            ))}
          </div>
        </section>

        {/* Info section */}
        <section className="mt-4 sm:mt-5">
          <div className="rounded-[18px] sm:rounded-[22px] border border-[#131b27] bg-[#00040e] px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#071020]">
                <Clock className="h-4 w-4 text-[#6c778a]" />
              </div>
              <div>
                <p className="font-['Inter',sans-serif] text-[13px] sm:text-[14px] font-semibold text-[#c8ccd4]">
                  How Vault Works
                </p>
                <p className="mt-1 font-['Inter',sans-serif] text-[12px] sm:text-[13px] text-[#6c778a] leading-relaxed">
                  Deposit your tokens into a vault to earn passive yield. Rewards accrue in real-time and can be claimed at any time. Some pools have lock periods for boosted APY.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "Auto-compounding", icon: <Zap className="h-3 w-3" /> },
                    { label: "No minimum", icon: <CheckCircle2 className="h-3 w-3" /> },
                    { label: "Base secured", icon: <Shield className="h-3 w-3" /> },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#071020] border border-[#131b27] px-2.5 py-1 font-['Inter',sans-serif] text-[11px] text-[#6c778a]"
                    >
                      {item.icon}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

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
