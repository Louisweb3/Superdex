import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Coins,
  Zap,
  Gift,
  Rocket,
  Shield,
  Users,
  Star,
  Lock,
  TrendingUp,
} from "lucide-react";

const SECTIONS = [
  { id: "intro", label: "Introduction", icon: BookOpen },
  { id: "how", label: "How It Works", icon: Zap },
  { id: "token", label: "SSWAP Token", icon: Coins },
  { id: "airdrop", label: "Airdrop", icon: Gift },
  { id: "rewards", label: "Rewards", icon: Star },
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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
          <Icon className="h-6 w-6 text-cyan-300" />
        </div>

        <div>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-5 text-sm leading-relaxed text-[#94A3B8]">
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center backdrop-blur-xl">
      <p className="text-3xl font-black tracking-[-0.04em] text-white">
        {value}
      </p>

      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#64748B]">
        {label}
      </p>
    </div>
  );
}

function IntroSection() {
  return (
    <div>
      <SectionHeader
        icon={BookOpen}
        title="Introduction"
        subtitle="Welcome to SuperSwap — a premium DEX aggregator on Base."
      />

      <p className="mb-5 leading-relaxed text-[#94A3B8]">
        SuperSwap routes swaps across Uniswap, Aerodrome,
        PancakeSwap, and BaseSwap to find the best price
        in real time.
      </p>

      <p className="mb-8 leading-relaxed text-[#94A3B8]">
        Users receive better pricing, lower slippage,
        and seamless execution while remaining fully
        non-custodial.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="DEXes" value="4+" />
        <StatCard label="Network" value="Base" />
        <StatCard label="Fee" value="0.3%" />
        <StatCard label="Token" value="SSWAP" />
      </div>

      <div className="mt-8">
        <InfoBox>
          SuperSwap never holds your funds. Swaps execute
          directly from your wallet.
        </InfoBox>
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
        subtitle="Fast and seamless DEX aggregation."
      />

      <div className="space-y-4">
        {[
          "Connect your wallet",
          "Select tokens to swap",
          "Fetch real-time quotes",
          "Best route auto-selected",
          "Approve and confirm",
          "Earn XP and rewards",
        ].map((item, index) => (
          <div
            key={item}
            className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5"
          >
            <span className="text-2xl font-black text-cyan-300/40">
              0{index + 1}
            </span>

            <p className="text-sm text-[#94A3B8]">
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
        title="SSWAP Token"
        subtitle="Governance and ecosystem utility."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {[
          "Governance voting",
          "Fee discounts",
          "XP multipliers",
          "Future staking rewards",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5"
          >
            <p className="text-sm font-semibold text-white">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AirdropSection() {
  return (
    <div>
      <SectionHeader
        icon={Gift}
        title="Airdrop"
        subtitle="Rewarding early community members."
      />

      <div className="space-y-4">
        {[
          "Early adopter rewards",
          "XP-based allocation",
          "Referral bonuses",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5"
          >
            <p className="text-sm text-[#94A3B8]">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardsSection() {
  return (
    <div>
      <SectionHeader
        icon={Star}
        title="Rewards"
        subtitle="Earn XP through trading activity."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Each Swap", "10 XP"],
          ["Referral", "200 XP"],
          ["Daily Bonus", "+20%"],
          ["Milestones", "Extra XP"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5"
          >
            <p className="text-sm font-semibold text-white">
              {label}
            </p>

            <p className="mt-2 text-cyan-300">
              {value}
            </p>
          </div>
        ))}
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
        subtitle="Planned SSWAP supply allocation."
      />

      <div className="space-y-4">
        {[
          ["Community", "30%"],
          ["Liquidity", "20%"],
          ["Team", "15%"],
          ["Treasury", "15%"],
          ["Grants", "10%"],
          ["Reserve", "10%"],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-white">
                {label}
              </span>

              <span className="text-sm text-cyan-300">
                {value}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: value }}
              />
            </div>
          </div>
        ))}
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
        subtitle="SuperSwap development timeline."
      />

      <div className="space-y-5">
        {[
          ["Q1 2025", "Protocol launch"],
          ["Q2 2025", "Token announcement"],
          ["Q3 2025", "TGE and governance"],
          ["2026", "Cross-chain expansion"],
        ].map(([phase, desc]) => (
          <div
            key={phase}
            className="flex gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5"
          >
            <div className="font-bold text-cyan-300">
              {phase}
            </div>

            <div className="text-sm text-[#94A3B8]">
              {desc}
            </div>
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
        subtitle="Safety and transparency."
      />

      <div className="space-y-4">
        {[
          "Non-custodial architecture",
          "Reentrancy protection",
          "Emergency pause systems",
          "Open-source contracts",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5"
          >
            <p className="text-sm text-[#94A3B8]">
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
        subtitle="Join the SuperSwap ecosystem."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {["Twitter / X", "Discord", "Telegram"].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center"
          >
            <p className="font-semibold text-white">
              {item}
            </p>
          </div>
        ))}
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

      <InfoBox>
        This documentation is informational only and
        does not constitute financial advice.
      </InfoBox>
    </div>
  );
}

const CONTENT: Record<SectionId, React.ReactNode> = {
  intro: <IntroSection />,
  how: <HowItWorksSection />,
  token: <TokenSection />,
  airdrop: <AirdropSection />,
  rewards: <RewardsSection />,
  tokenomics: <TokenomicsSection />,
  roadmap: <RoadmapSection />,
  security: <SecuritySection />,
  community: <CommunitySection />,
  legal: <LegalSection />,
};

export function DocsPage() {
  const [active, setActive] = useState<SectionId>("intro");

  return (
    <div className="min-h-screen bg-[#020b1c] text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0">

        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl gap-8 px-5 py-10">

        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 lg:block">

          <div className="sticky top-10">

            <h1 className="mb-8 text-4xl font-black tracking-[-0.05em]">
              Docs
            </h1>

            <div className="space-y-2">

              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                    active === id
                      ? "bg-cyan-400/10 text-cyan-300"
                      : "text-[#94A3B8] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />

                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0 flex-1">

          {/* MOBILE NAV */}
          <div className="mb-6 overflow-x-auto lg:hidden">

            <div className="flex gap-2 pb-2">

              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
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

          <AnimatePresence mode="wait">

            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="rounded-[32px] border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-2xl lg:p-10"
            >
              {CONTENT[active]}
            </motion.div>

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}