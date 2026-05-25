import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Coins,
  Zap,
  Rocket,
  Shield,
  Users,
  Lock,
  TrendingUp,
  Globe,
  ExternalLink,
  ChevronRight,
  Gift,
  Vault,
  Sparkles,
} from "lucide-react";

const SECTIONS = [
  { id: "intro", label: "Introduction", icon: BookOpen },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "vaults", label: "Vaults", icon: Vault },
  { id: "how", label: "How It Works", icon: Zap },
  { id: "token", label: "$SUPER Token", icon: Coins },
  { id: "tokenomics", label: "Tokenomics", icon: TrendingUp },
  { id: "roadmap", label: "Roadmap", icon: Rocket },
  { id: "security", label: "Security", icon: Shield },
  { id: "community", label: "Community", icon: Users },
  { id: "legal", label: "Legal", icon: Lock },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 border-b border-white/[0.06] pb-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 backdrop-blur-xl">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>

        <div>
          <h2 className="text-[36px] font-black tracking-[-0.05em] text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#94A3B8]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-[#0B1220]/70 p-6 text-[14px] leading-relaxed text-[#94A3B8] backdrop-blur-xl">
      {children}
    </div>
  );
}

function IntroSection() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-[36px] border border-cyan-400/10 bg-gradient-to-br from-cyan-500/10 via-[#0B1220] to-[#050816] p-8 lg:p-12">
        <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Powered By Base
          </div>

          <h1 className="max-w-5xl text-[52px] font-black leading-[0.95] tracking-[-0.06em] text-white">
            The Only DEX On Base That Actually Pays You To Swap
          </h1>

          <p className="mt-7 max-w-3xl text-[17px] leading-relaxed text-[#94A3B8]">
            SuperSwap is a next-generation DEX aggregator built on Base
            that routes trades across leading decentralized exchanges
            to deliver the best execution prices, lowest slippage,
            and real cashback rewards on every swap.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/10 p-6 backdrop-blur-xl">
              <p className="text-[12px] uppercase tracking-[0.18em] text-cyan-300">
                Cashback Rewards
              </p>

              <p className="mt-3 text-[42px] font-black tracking-[-0.05em] text-white">
                0.15%
              </p>
            </div>

            <div className="rounded-3xl border border-white/[0.06] bg-[#0B1220]/70 p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[#64748B]">
                Network
              </p>

              <p className="mt-3 text-[42px] font-black tracking-[-0.05em] text-white">
                Base
              </p>
            </div>

            <div className="rounded-3xl border border-white/[0.06] bg-[#0B1220]/70 p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[#64748B]">
                Token
              </p>

              <p className="mt-3 text-[42px] font-black tracking-[-0.05em] text-white">
                TBA
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeader
          icon={BookOpen}
          title="Introduction"
          subtitle="Professional swap aggregation with real user incentives."
        />

        <div className="space-y-5 text-[15px] leading-relaxed text-[#94A3B8]">
          <p>
            SuperSwap aggregates liquidity across major decentralized
            exchanges including Uniswap, Aerodrome, PancakeSwap,
            SushiSwap, and BaseSwap to deliver optimal routing and
            execution across the Base ecosystem.
          </p>

          <p>
            Unlike traditional aggregators, SuperSwap rewards users
            directly for their trading activity. Every swap executed
            through the protocol earns users 0.15% cashback in USDC
            or ETH while also generating ecosystem rewards and future
            airdrop eligibility.
          </p>

          <p>
            The protocol is designed around sustainable user incentives,
            deep liquidity aggregation, vault-based yield infrastructure,
            and long-term expansion into multi-chain liquidity routing.
          </p>
        </div>

        <div className="mt-8">
          <InfoCard>
            SuperSwap is fully non-custodial. The protocol never stores
            user assets and transactions execute directly from connected wallets.
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

function RewardsSection() {
  return (
    <div>
      <SectionHeader
        icon={Gift}
        title="Rewards"
        subtitle="Swap, earn cashback, and accumulate ecosystem rewards."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[32px] border border-cyan-400/10 bg-gradient-to-br from-cyan-500/10 to-[#0B1220] p-8">
          <p className="text-[12px] uppercase tracking-[0.18em] text-cyan-300">
            Cashback Rewards
          </p>

          <h3 className="mt-3 text-[54px] font-black tracking-[-0.06em] text-white">
            0.15%
          </h3>

          <p className="mt-5 text-[15px] leading-relaxed text-[#94A3B8]">
            SuperSwap automatically rewards users with 0.15% cashback
            on every swap executed through the protocol.
          </p>

          <p className="mt-4 text-[15px] leading-relaxed text-[#94A3B8]">
            Rewards can be distributed in USDC, ETH, or future
            ecosystem incentives depending on active reward campaigns.
          </p>
        </div>

        <div className="space-y-4">
          {[
            "Earn rewards on every swap",
            "Receive cashback in USDC or ETH",
            "Accumulate future airdrop eligibility",
            "Boost rewards by holding $SUPER",
            "Higher vault limits for token holders",
          ].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/[0.06] bg-[#0B1220]/70 p-5"
            >
              <p className="text-[14px] text-[#CBD5E1]">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VaultsSection() {
  return (
    <div>
      <SectionHeader
        icon={Vault}
        title="Vaults"
        subtitle="Passive yield infrastructure powered by SuperSwap."
      />

      <div className="space-y-5 text-[15px] leading-relaxed text-[#94A3B8]">
        <p>
          SuperSwap Vaults allow users to deposit supported assets
          into automated yield strategies designed to optimize
          capital efficiency across decentralized liquidity markets.
        </p>

        <p>
          Vaults are designed to provide sustainable APY generation,
          automated compounding, and boosted ecosystem rewards for
          active SuperSwap users and $SUPER holders.
        </p>

        <p>
          Users holding larger amounts of $SUPER will unlock boosted
          vault APY, higher deposit limits, exclusive strategies,
          and enhanced reward multipliers across the ecosystem.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          "Automated yield optimization",
          "Boosted APY for $SUPER holders",
          "Auto-compounding strategies",
          "Higher vault limits",
          "Exclusive vault campaigns",
          "Future multi-chain yield routing",
        ].map((item) => (
          <div
            key={item}
            className="rounded-3xl border border-white/[0.06] bg-[#0B1220]/70 p-5"
          >
            <p className="text-[14px] font-medium text-white">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <div>
      <SectionHeader
        icon={Zap}
        title="How It Works"
        subtitle="Efficient routing and execution architecture."
      />

      <div className="space-y-4">
        {[
          "Connect a supported wallet",
          "Select input and output assets",
          "Fetch real-time liquidity routes",
          "Automatically optimize swap path",
          "Execute directly on-chain",
        ].map((item, index) => (
          <div
            key={item}
            className="flex items-center gap-5 rounded-3xl border border-white/[0.06] bg-[#0B1220]/70 p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-300">
              0{index + 1}
            </div>

            <p className="text-[14px] text-[#CBD5E1]">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenSection() {
  return (
    <div>
      <SectionHeader
        icon={Coins}
        title="$SUPER Token"
        subtitle="The core rewards and ecosystem utility token."
      />

      <div className="space-y-6">
        <div className="rounded-[32px] border border-cyan-400/10 bg-gradient-to-br from-cyan-500/10 to-[#0B1220] p-8">
          <p className="text-[12px] uppercase tracking-[0.18em] text-cyan-300">
            Airdrop System
          </p>

          <h3 className="mt-3 text-[36px] font-black tracking-[-0.05em] text-white">
            Earn While You Swap
          </h3>

          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#94A3B8]">
            <p>
              Users earn future $SUPER token allocations through
              trading activity on SuperSwap. Every swap contributes
              toward ecosystem reward distribution and future airdrop
              eligibility.
            </p>

            <p>
              Users receive rewards equal to 0.15% of their swap
              volume while simultaneously accumulating points and
              future $SUPER incentives.
            </p>

            <p>
              Active users, long-term traders, and vault participants
              may receive boosted allocations based on ecosystem
              participation and protocol usage.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            "Governance participation",
            "Boosted vault APY",
            "Swap reward multipliers",
            "Higher vault limits",
            "Future staking rewards",
            "Protocol fee incentives",
            "Ecosystem governance",
            "Long-term reward boosts",
          ].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/[0.06] bg-[#0B1220]/70 p-5"
            >
              <p className="text-[14px] font-semibold text-white">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TokenomicsSection() {
  return (
    <div>
      <SectionHeader
        icon={TrendingUp}
        title="Tokenomics"
        subtitle="Planned allocation model for $SUPER."
      />

      <div className="space-y-5">
        {[
          ["Community & Ecosystem", "35%"],
          ["Liquidity", "20%"],
          ["Treasury", "15%"],
          ["Core Team", "15%"],
          ["Development Grants", "10%"],
          ["Reserve", "5%"],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[14px] text-white">
                {label}
              </span>

              <span className="text-[14px] text-cyan-300">
                {value}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: value }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <InfoCard>
          Final tokenomics may evolve based on governance decisions,
          ecosystem requirements, and long-term sustainability.
        </InfoCard>
      </div>
    </div>
  );
}

function RoadmapSection() {
  return (
    <div>
      <SectionHeader
        icon={Rocket}
        title="Roadmap"
        subtitle="Building the future infrastructure for rewards-driven DeFi."
      />

      <div className="space-y-5">
        {[
          [
            "Phase 1 — Base Launch",
            "Launch SuperSwap on Base with aggregation routing, optimized swap execution, cashback infrastructure, and initial DEX integrations including Aerodrome, Uniswap, and SushiSwap.",
          ],
          [
            "Phase 2 — Rewards & Airdrop",
            "Introduce reward tracking, cashback campaigns, ecosystem point systems, and the first $SUPER airdrop allocation model for active protocol users.",
          ],
          [
            "Phase 3 — Vault Infrastructure",
            "Deploy automated vault strategies with APY optimization, auto-compounding systems, and boosted yield mechanisms for $SUPER holders.",
          ],
          [
            "Phase 4 — Multi-Chain Expansion",
            "Expand routing infrastructure to Ethereum, Arbitrum, BNB Chain, and additional ecosystems while improving liquidity discovery and cross-chain execution.",
          ],
          [
            "Phase 5 — Advanced Aggregation",
            "Launch cross-chain swaps, advanced routing algorithms, bridge integrations, institutional tooling, and future support for ecosystems including Solana and ARC Chain.",
          ],
        ].map(([phase, desc]) => (
          <div
            key={phase}
            className="rounded-[32px] border border-white/[0.06] bg-[#0B1220]/70 p-7"
          >
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              {phase}
            </div>

            <p className="mt-5 text-[15px] leading-relaxed text-[#CBD5E1]">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div>
      <SectionHeader
        icon={Shield}
        title="Security"
        subtitle="Protocol security and operational transparency."
      />

      <div className="space-y-4">
        {[
          "Non-custodial architecture",
          "Secure transaction execution",
          "Transparent routing systems",
          "Upgradeable infrastructure",
          "Emergency protection mechanisms",
        ].map((item) => (
          <div
            key={item}
            className="rounded-3xl border border-white/[0.06] bg-[#0B1220]/70 p-5"
          >
            <p className="text-[14px] text-[#CBD5E1]">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunitySection() {
  return (
    <div>
      <SectionHeader
        icon={Users}
        title="Community"
        subtitle="Official SuperSwap community channels."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <a
          href="https://x.com/superswapfi_"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-[32px] border border-white/[0.06] bg-[#0B1220]/70 p-6 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[18px] font-bold text-white">
                X / Twitter
              </p>

              <p className="mt-2 text-[13px] text-[#94A3B8]">
                x.com/superswapfi_
              </p>
            </div>

            <ExternalLink className="h-5 w-5 text-cyan-300 transition-transform group-hover:translate-x-1" />
          </div>
        </a>

        <a
          href="https://t.me/superswapdex"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-[32px] border border-white/[0.06] bg-[#0B1220]/70 p-6 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[18px] font-bold text-white">
                Telegram
              </p>

              <p className="mt-2 text-[13px] text-[#94A3B8]">
                t.me/superswapdex
              </p>
            </div>

            <ExternalLink className="h-5 w-5 text-cyan-300 transition-transform group-hover:translate-x-1" />
          </div>
        </a>
      </div>
    </div>
  );
}

function LegalSection() {
  return (
    <div>
      <SectionHeader
        icon={Lock}
        title="Legal"
        subtitle="Important notices and disclaimers."
      />

      <InfoCard>
        This documentation is provided for informational purposes only
        and does not constitute investment, legal, or financial advice.
        Participation in decentralized finance protocols involves risk.
      </InfoCard>
    </div>
  );
}

const CONTENT: Record<SectionId, React.ReactNode> = {
  intro: <IntroSection />,
  rewards: <RewardsSection />,
  vaults: <VaultsSection />,
  how: <HowItWorksSection />,
  token: <TokenSection />,
  tokenomics: <TokenomicsSection />,
  roadmap: <RoadmapSection />,
  security: <SecuritySection />,
  community: <CommunitySection />,
  legal: <LegalSection />,
};

export function DocsPage() {
  const [active, setActive] = useState<SectionId>("intro");

  return (
    <div className="min-h-screen bg-[#040816] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1700px]">
        {/* Sidebar */}
        <aside className="hidden min-h-screen w-[300px] border-r border-white/[0.06] bg-[#070B17]/90 lg:block">
          <div className="sticky top-0 px-6 py-8">
            <div className="mb-12 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10">
                <Globe className="h-6 w-6 text-cyan-300" />
              </div>

              <div>
                <h1 className="text-[26px] font-black tracking-[-0.05em] text-white">
                  SuperSwap
                </h1>

                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#64748B]">
                  Documentation
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`group flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left transition-all ${
                    active === id
                      ? "bg-cyan-400/10 text-cyan-300"
                      : "text-[#94A3B8] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />

                    <span className="text-[14px] font-medium">
                      {label}
                    </span>
                  </div>

                  <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {/* Mobile Nav */}
          <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050816]/90 px-5 py-4 backdrop-blur-xl lg:hidden">
            <div className="overflow-x-auto">
              <div className="flex gap-2">
                {SECTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActive(id)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      active === id
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "bg-white/[0.03] text-[#94A3B8]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Page */}
          <div className="mx-auto max-w-6xl px-5 py-10 lg:px-10 lg:py-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-[36px] border border-white/[0.06] bg-[#0A0F1C]/80 p-6 shadow-[0_0_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:p-12"
              >
                {CONTENT[active]}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}