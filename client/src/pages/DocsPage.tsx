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
  ExternalLink,
  ChevronRight,
  Gift,
  Vault,
  Sparkles,
  ArrowRight,
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
    <div className="mb-10 border-b border-[#13203B] pb-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#18305E] bg-[#07101F] shadow-[0_0_25px_rgba(0,255,120,0.08)]">
          <Icon className="h-5 w-5 text-[#39FF74]" />
        </div>

        <div>
          <h2 className="text-[38px] font-black tracking-[-0.06em] text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#7E8CA8]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[30px] border border-[#13203B] bg-[#050B17]/90 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function IntroSection() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-[40px] border border-[#163052] bg-[#040B17] p-8 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(57,255,116,0.12),transparent_35%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:38px_38px]" />

        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1A3D5A] bg-[#07111E] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#39FF74]">
            <Sparkles className="h-4 w-4" />
            Reward-First DEX
          </div>

          <h1 className="max-w-4xl text-[74px] font-black leading-[0.88] tracking-[-0.07em] text-white">
            The Only DEX On Base
            <br />
            That Actually Pays
            <br />
            <span className="text-[#39FF74]">
              You To Swap.
            </span>
          </h1>

          <p className="mt-8 max-w-3xl text-[20px] leading-relaxed text-[#7E8CA8]">
            SuperSwap is a next-generation DEX aggregator built on Base
            that routes trades across major decentralized exchanges
            to deliver the best execution prices, lowest slippage,
            and real cashback rewards on every swap.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <GlassCard className="p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[#64748B]">
                Cashback Rewards
              </p>

              <h3 className="mt-3 text-[42px] font-black tracking-[-0.05em] text-[#39FF74]">
                0.15%
              </h3>

              <p className="mt-2 text-[15px] leading-relaxed text-[#7E8CA8]">
                Earn cashback in ETH or USDC on every swap.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[#64748B]">
                Network
              </p>

              <h3 className="mt-3 text-[42px] font-black tracking-[-0.05em] text-white">
                Base
              </h3>

              <p className="mt-2 text-[15px] leading-relaxed text-[#7E8CA8]">
                Optimized for the fastest and cheapest execution.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[#64748B]">
                Token
              </p>

              <h3 className="mt-3 text-[42px] font-black tracking-[-0.05em] text-white">
                TBA
              </h3>

              <p className="mt-2 text-[15px] leading-relaxed text-[#7E8CA8]">
                Future ecosystem rewards and governance token.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeader
          icon={BookOpen}
          title="Introduction"
          subtitle="Next-generation swap aggregation powered by real incentives."
        />

        <div className="space-y-5 text-[16px] leading-relaxed text-[#7E8CA8]">
          <p>
            SuperSwap aggregates liquidity across major decentralized
            exchanges including Uniswap, Aerodrome, PancakeSwap,
            SushiSwap, and BaseSwap to deliver the best execution,
            lowest slippage, and fastest routing on Base.
          </p>

          <p>
            Unlike traditional DEX aggregators, SuperSwap rewards users
            directly for their activity. Every swap executed through
            the protocol earns 0.15% cashback distributed in ETH,
            USDC, or future ecosystem incentives.
          </p>

          <p>
            SuperSwap is designed around sustainable DeFi incentives,
            advanced routing infrastructure, automated vault systems,
            and long-term multi-chain liquidity aggregation.
          </p>

          <p>
            Future infrastructure expansion will support additional
            ecosystems including Ethereum, Arbitrum, BNB Chain,
            Solana, ARC Chain, and more.
          </p>
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
        subtitle="Trade more. Earn more. Every single swap."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="relative overflow-hidden p-8">
          <div className="absolute right-0 top-0 h-[220px] w-[220px] rounded-full bg-[#39FF74]/10 blur-[90px]" />

          <div className="relative z-10">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#39FF74]">
              Cashback Rewards
            </p>

            <h3 className="mt-3 text-[72px] font-black leading-none tracking-[-0.06em] text-white">
              0.15%
            </h3>

            <p className="mt-5 text-[16px] leading-relaxed text-[#7E8CA8]">
              SuperSwap automatically rewards users with cashback on
              every swap executed through the protocol.
            </p>

            <p className="mt-4 text-[16px] leading-relaxed text-[#7E8CA8]">
              Rewards can be distributed in USDC, ETH, or future
              ecosystem campaigns depending on active reward pools.
            </p>
          </div>
        </GlassCard>

        <div className="space-y-4">
          {[
            "Earn rewards on every swap",
            "Receive cashback in ETH or USDC",
            "Accumulate future airdrop eligibility",
            "Boost rewards with $SUPER holdings",
            "Higher vault limits for holders",
          ].map((item) => (
            <GlassCard key={item} className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#18305E] bg-[#07111E]">
                  <Gift className="h-5 w-5 text-[#39FF74]" />
                </div>

                <p className="text-[15px] text-white">
                  {item}
                </p>
              </div>
            </GlassCard>
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
        subtitle="Automated yield infrastructure for long-term growth."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-8">
          <div className="space-y-5 text-[16px] leading-relaxed text-[#7E8CA8]">
            <p>
              SuperSwap Vaults allow users to deposit supported assets
              into automated strategies designed to optimize yield
              generation across decentralized liquidity markets.
            </p>

            <p>
              Vaults provide sustainable APY generation, automated
              compounding, and ecosystem reward boosts for active
              SuperSwap users and long-term participants.
            </p>

            <p>
              Users holding larger amounts of $SUPER unlock boosted
              APY, higher vault limits, exclusive campaigns, and
              enhanced ecosystem reward multipliers.
            </p>
          </div>
        </GlassCard>

        <div className="space-y-4">
          {[
            "Automated yield optimization",
            "Boosted APY for holders",
            "Auto-compounding rewards",
            "Higher vault limits",
            "Exclusive strategies",
          ].map((item) => (
            <GlassCard key={item} className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#18305E] bg-[#07111E]">
                  <Vault className="h-5 w-5 text-[#39FF74]" />
                </div>

                <p className="text-[15px] text-white">
                  {item}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
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
        subtitle="Simple routing. Maximum efficiency."
      />

      <div className="grid gap-4">
        {[
          "Connect a supported wallet",
          "Choose tokens to swap",
          "Fetch optimized liquidity routes",
          "Automatically minimize slippage",
          "Execute directly on-chain",
        ].map((item, index) => (
          <GlassCard key={item} className="p-6">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#173056] bg-[#07111E] text-lg font-black text-[#39FF74]">
                0{index + 1}
              </div>

              <p className="text-[16px] text-white">
                {item}
              </p>
            </div>
          </GlassCard>
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
        subtitle="The core rewards and governance token of SuperSwap."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="relative overflow-hidden p-8">
          <div className="absolute left-0 top-0 h-[240px] w-[240px] rounded-full bg-[#39FF74]/10 blur-[90px]" />

          <div className="relative z-10">
            <div className="inline-flex rounded-xl border border-[#1C4A2E] bg-[#07111E] px-4 py-2 text-[13px] font-bold text-[#39FF74]">
              $SUPER TOKEN
            </div>

            <h3 className="mt-5 text-[56px] font-black leading-none tracking-[-0.06em] text-white">
              COMING
              <br />
              <span className="text-[#39FF74]">
                SOON
              </span>
            </h3>

            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-[#7E8CA8]">
              <p>
                Users earn future $SUPER token allocations through
                trading activity, reward campaigns, and ecosystem
                participation.
              </p>

              <p>
                Every swap contributes toward future airdrop eligibility
                while users also receive 0.15% cashback rewards.
              </p>

              <p>
                Holding $SUPER boosts vault APY, increases rewards,
                unlocks higher limits, and provides governance rights
                across the ecosystem.
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          {[
            ["Earn More", "Higher rewards for $SUPER holders"],
            ["Boost Rewards", "Staking boosts your earnings"],
            ["Govern Together", "Vote on protocol upgrades"],
            ["Early Access", "Get exclusive ecosystem perks"],
          ].map(([title, desc]) => (
            <GlassCard key={title} className="p-5">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#18305E] bg-[#07111E]">
                  <Coins className="h-5 w-5 text-[#39FF74]" />
                </div>

                <div>
                  <h4 className="text-[16px] font-semibold text-white">
                    {title}
                  </h4>

                  <p className="mt-1 text-[14px] text-[#7E8CA8]">
                    {desc}
                  </p>
                </div>
              </div>
            </GlassCard>
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
        subtitle="Planned ecosystem allocation model."
      />

      <GlassCard className="p-8">
        <div className="space-y-6">
          {[
            ["Community & Ecosystem", "35%"],
            ["Liquidity", "20%"],
            ["Treasury", "15%"],
            ["Core Team", "15%"],
            ["Development Grants", "10%"],
            ["Reserve", "5%"],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[15px] text-white">
                  {label}
                </span>

                <span className="font-semibold text-[#39FF74]">
                  {value}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#0E172A]">
                <div
                  className="h-full rounded-full bg-[#39FF74]"
                  style={{ width: value }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function RoadmapSection() {
  return (
    <div>
      <SectionHeader
        icon={Rocket}
        title="Roadmap"
        subtitle="Building the future of reward-driven DeFi."
      />

      <div className="space-y-5">
        {[
          [
            "Phase 1 — Base Launch",
            "Launch SuperSwap with advanced aggregation routing, optimized swap execution, and cashback infrastructure.",
          ],
          [
            "Phase 2 — Rewards & Airdrop",
            "Introduce ecosystem point systems, reward campaigns, and the first $SUPER airdrop allocation model.",
          ],
          [
            "Phase 3 — Vault Infrastructure",
            "Deploy automated vault strategies with APY optimization and boosted rewards for holders.",
          ],
          [
            "Phase 4 — Multi-Chain Expansion",
            "Expand routing infrastructure to Ethereum, Arbitrum, BNB Chain, and additional ecosystems.",
          ],
          [
            "Phase 5 — Advanced Aggregation",
            "Launch cross-chain swaps, bridge integrations, institutional tools, and advanced routing systems.",
          ],
        ].map(([phase, desc]) => (
          <GlassCard key={phase} className="p-7">
            <div className="inline-flex rounded-full border border-[#1C4A2E] bg-[#07111E] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#39FF74]">
              {phase}
            </div>

            <p className="mt-5 text-[16px] leading-relaxed text-[#7E8CA8]">
              {desc}
            </p>
          </GlassCard>
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
        subtitle="Transparent infrastructure and secure execution."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {[
          "Non-custodial architecture",
          "Secure transaction execution",
          "Transparent routing systems",
          "Upgradeable infrastructure",
          "Emergency protection mechanisms",
          "Advanced liquidity monitoring",
        ].map((item) => (
          <GlassCard key={item} className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#18305E] bg-[#07111E]">
                <Shield className="h-5 w-5 text-[#39FF74]" />
              </div>

              <p className="text-[15px] text-white">
                {item}
              </p>
            </div>
          </GlassCard>
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
        subtitle="Join the SuperSwap ecosystem."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <a
          href="https://x.com/superswapfi_"
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <GlassCard className="p-7 transition-all hover:border-[#39FF74]/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-bold text-white">
                  X / Twitter
                </h3>

                <p className="mt-2 text-[#7E8CA8]">
                  x.com/superswapfi_
                </p>
              </div>

              <ExternalLink className="h-6 w-6 text-[#39FF74] transition-transform group-hover:translate-x-1" />
            </div>
          </GlassCard>
        </a>

        <a
          href="https://t.me/superswapdex"
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <GlassCard className="p-7 transition-all hover:border-[#39FF74]/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-bold text-white">
                  Telegram
                </h3>

                <p className="mt-2 text-[#7E8CA8]">
                  t.me/superswapdex
                </p>
              </div>

              <ExternalLink className="h-6 w-6 text-[#39FF74] transition-transform group-hover:translate-x-1" />
            </div>
          </GlassCard>
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

      <GlassCard className="p-7">
        <p className="text-[15px] leading-relaxed text-[#7E8CA8]">
          This documentation is provided for informational purposes
          only and does not constitute investment, financial, or legal
          advice. Participation in decentralized finance protocols
          involves risk.
        </p>
      </GlassCard>
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
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-[#39FF74]/5 blur-[160px]" />

        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#00A3FF]/5 blur-[160px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1700px]">
        <aside className="hidden min-h-screen w-[300px] border-r border-[#13203B] bg-[#040B17]/90 lg:block">
          <div className="sticky top-0 px-6 py-8">
            <div className="mb-12 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#18305E] bg-[#07111E] shadow-[0_0_25px_rgba(57,255,116,0.12)]">
                <Zap className="h-7 w-7 text-[#39FF74]" />
              </div>

              <div>
                <h1 className="text-[30px] font-black tracking-[-0.06em] text-white">
                  Super
                  <span className="text-[#39FF74]">
                    Swap
                  </span>
                </h1>

                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#64748B]">
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
                      ? "bg-[#07111E] text-[#39FF74] border border-[#1A3D5A]"
                      : "text-[#7E8CA8] hover:bg-[#07111E] hover:text-white"
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

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 border-b border-[#13203B] bg-[#020817]/90 px-5 py-4 backdrop-blur-xl lg:hidden">
            <div className="overflow-x-auto">
              <div className="flex gap-2">
                {SECTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActive(id)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      active === id
                        ? "bg-[#07111E] text-[#39FF74]"
                        : "bg-[#07111E]/70 text-[#7E8CA8]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-5 py-10 lg:px-10 lg:py-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-[40px] border border-[#13203B] bg-[#040B17]/90 p-6 shadow-[0_0_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:p-12"
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