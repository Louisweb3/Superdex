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
} from "lucide-react";

const SECTIONS = [
  { id: "intro", label: "Introduction", icon: BookOpen },
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

        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0B1220]">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>

        <div>

          <h2 className="text-[34px] font-black tracking-[-0.05em] text-white">
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
    <div className="rounded-2xl border border-white/[0.06] bg-[#0B1220]/70 p-5 text-[14px] leading-relaxed text-[#94A3B8]">
      {children}
    </div>
  );
}

function IntroSection() {
  return (
    <div>

      <SectionHeader
        icon={BookOpen}
        title="Introduction"
        subtitle="SuperSwap is a next-generation DEX aggregator built on Base."
      />

      <div className="space-y-5 text-[15px] leading-relaxed text-[#94A3B8]">

        <p>
          SuperSwap aggregates liquidity across multiple decentralized
          exchanges including Uniswap, Aerodrome, PancakeSwap,
          SushiSwap, and BaseSwap to deliver optimal swap execution.
        </p>

        <p>
          The protocol automatically discovers the best routing paths,
          minimizes slippage, and provides a seamless non-custodial
          trading experience.
        </p>

        <p>
          Future infrastructure expansion will support cross-chain
          aggregation and emerging ecosystems including ARC Chain,
          Solana, Arbitrum, Ethereum, BNB Chain, and more.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        {[
          ["Network", "Base"],
          ["DEXes", "8+"],
          ["Chains Planned", "10+"],
          ["Token", "$SUPER"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/[0.06] bg-[#0B1220]/70 p-6"
          >

            <p className="text-[34px] font-black tracking-[-0.05em] text-white">
              {value}
            </p>

            <p className="mt-2 text-[12px] uppercase tracking-[0.18em] text-[#64748B]">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <InfoCard>
          SuperSwap is fully non-custodial. The protocol never stores
          user assets and transactions execute directly from connected wallets.
        </InfoCard>
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
            className="flex items-center gap-5 rounded-2xl border border-white/[0.06] bg-[#0B1220]/70 p-5"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-300">
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
        subtitle="The native utility and governance asset of SuperSwap."
      />

      <div className="space-y-5 text-[15px] leading-relaxed text-[#94A3B8]">

        <p>
          $SUPER powers governance, ecosystem incentives,
          protocol expansion, and future staking mechanisms.
        </p>

        <p>
          Holders of $SUPER will participate in governance decisions,
          treasury allocation proposals, and ecosystem upgrades.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">

        {[
          "Governance participation",
          "Fee reduction mechanisms",
          "Future staking rewards",
          "Ecosystem incentives",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/[0.06] bg-[#0B1220]/70 p-5"
          >
            <p className="text-[14px] font-semibold text-white">
              {item}
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

            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">

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
        subtitle="Long-term ecosystem expansion."
      />

      <div className="space-y-5">

        {[
          [
            "Q1 2026",
            "Mainnet launch on Base with aggregation routing and liquidity optimization.",
          ],
          [
            "Q2 2026",
            "$SUPER token launch and governance infrastructure rollout.",
          ],
          [
            "Q3 2026",
            "Expansion to Ethereum, Arbitrum, and BNB Chain.",
          ],
          [
            "Q4 2026",
            "Cross-chain routing and bridge integrations.",
          ],
          [
            "2027",
            "Support for ARC Chain, Solana ecosystem routing, and advanced aggregator infrastructure.",
          ],
        ].map(([phase, desc]) => (
          <div
            key={phase}
            className="rounded-2xl border border-white/[0.06] bg-[#0B1220]/70 p-6"
          >

            <div className="flex items-center gap-3">

              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                {phase}
              </div>
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-[#CBD5E1]">
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
            className="rounded-2xl border border-white/[0.06] bg-[#0B1220]/70 p-5"
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
          className="group rounded-2xl border border-white/[0.06] bg-[#0B1220]/70 p-6 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/5"
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[16px] font-bold text-white">
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
          className="group rounded-2xl border border-white/[0.06] bg-[#0B1220]/70 p-6 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/5"
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[16px] font-bold text-white">
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
    <div className="min-h-screen bg-[#050816] text-white">

      {/* background */}
      <div className="fixed inset-0 overflow-hidden">

        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1600px]">

        {/* SIDEBAR */}
        <aside className="hidden min-h-screen w-[280px] border-r border-white/[0.06] bg-[#070B17]/90 lg:block">

          <div className="sticky top-0 px-6 py-8">

            {/* logo */}
            <div className="mb-10 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-[#0B1220]">

                <Globe className="h-5 w-5 text-cyan-300" />
              </div>

              <div>

                <h1 className="text-[22px] font-black tracking-[-0.04em] text-white">
                  SuperSwap
                </h1>

                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#64748B]">
                  Documentation
                </p>
              </div>
            </div>

            {/* nav */}
            <div className="space-y-1">

              {SECTIONS.map(({ id, label, icon: Icon }) => (

                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
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

        {/* CONTENT */}
        <main className="min-w-0 flex-1">

          {/* mobile nav */}
          <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050816]/90 px-5 py-4 backdrop-blur-xl lg:hidden">

            <div className="overflow-x-auto">

              <div className="flex gap-2">

                {SECTIONS.map(({ id, label }) => (

                  <button
                    key={id}
                    onClick={() => setActive(id)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
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

          {/* page */}
          <div className="mx-auto max-w-5xl px-5 py-10 lg:px-10 lg:py-16">

            <AnimatePresence mode="wait">

              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-[28px] border border-white/[0.06] bg-[#0A0F1C]/80 p-6 shadow-[0_0_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:p-10"
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