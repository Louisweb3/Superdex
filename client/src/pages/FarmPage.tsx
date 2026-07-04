import { useState } from "react";
import baseLogoSrc from "@assets/base_logo_1782978064400.png";
import {
  Zap,
  ArrowLeftRight,
  CheckCircle2,
  User,
  BookOpen,
  Moon,
  Sun,
  Wallet,
  ChevronDown,
  Search,
  Clock,
  Heart,
  X,
  Circle,
  Flame,
  Gift,
  Info,
  Loader2,
  Boxes,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
type NetworkCard = {
  id: string;
  name: string;
  badge?: "New" | "Hot";
  logo: "base" | "tempo" | "pink" | "purple";
  showBridge?: boolean;
};

const NETWORKS: NetworkCard[] = [
  { id: "base", name: "Base", badge: "New", logo: "base", showBridge: true },
  { id: "tempo", name: "Tempo", badge: "New", logo: "tempo" },
  { id: "nova", name: "Nova Chain", badge: "Hot", logo: "pink" },
  { id: "zenith", name: "Zenith", badge: "Hot", logo: "purple" },
  { id: "arbitrum", name: "Arbitrum One", badge: "New", logo: "purple" },
  { id: "optimism", name: "Optimism", badge: "Hot", logo: "pink" },
];

const WORKFLOW_STEPS = [
  "Say GM",
  "Say GN",
  "Deploy NFT Collection",
  "Deploy ERC20 Token",
  "Deploy Counter Contract",
];

const MODAL_TABS = ["GM", "GN", "NFT", "Token", "Counter"];

function LogoTile({ type }: { type: NetworkCard["logo"] }) {
  if (type === "base") {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#0052FF] flex items-center justify-center overflow-hidden">
        <img src={baseLogoSrc} alt="Base" className="w-8 h-8" />
      </div>
    );
  }
  if (type === "tempo") {
    return (
      <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center">
        <span className="text-white font-black text-2xl">T</span>
      </div>
    );
  }
  if (type === "pink") {
    return (
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
        <Boxes size={22} className="text-white" />
      </div>
    );
  }
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
      <Boxes size={22} className="text-white" />
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  hasDropdown,
}: {
  icon: any;
  label: string;
  active?: boolean;
  hasDropdown?: boolean;
}) {
  return (
    <button
      data-testid={`nav-${label.toLowerCase()}`}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
        active
          ? "bg-[#123832] text-[#4ade80] border border-[#2f6b5a]"
          : "text-[#8a93a3] hover:text-white"
      }`}
    >
      <Icon size={14} />
      {label}
      {hasDropdown && <ChevronDown size={12} />}
    </button>
  );
}

export function FarmPage() {
  const [modalOpen, setModalOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [networkTab, setNetworkTab] = useState<"new" | "hot">("new");
  const [darkMode, setDarkMode] = useState(true);
  const [activeModalTab, setActiveModalTab] = useState("Counter");
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    WORKFLOW_STEPS.map(() => false),
  );

  const completedCount = completedSteps.filter(Boolean).length;

  const toggleStep = (i: number) => {
    setCompletedSteps((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const filteredNetworks = NETWORKS.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase()),
  ).filter((n) =>
    networkTab === "hot" ? n.badge === "Hot" : n.badge === "New" || true,
  );

  return (
    <div
      className="min-h-screen bg-[#0a0e14] text-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0e14]/95 backdrop-blur">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between px-5 py-3 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-[11px]">CC</span>
            </div>
            <span className="font-black text-[16px] tracking-wide">
              WATCHOOR
            </span>
          </div>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            <NavItem icon={Zap} label="Airdrop" />
            <NavItem icon={Zap} label="Deploy" active hasDropdown />
            <NavItem icon={ArrowLeftRight} label="Bridge" />
            <NavItem icon={CheckCircle2} label="Checkers" />
            <NavItem icon={User} label="Social" />
            <NavItem icon={BookOpen} label="Learn" />
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDarkMode((d) => !d)}
              data-testid="button-theme-toggle"
              className="relative flex items-center w-14 h-7 rounded-full bg-[#12161f] border border-white/10 px-1 transition-colors"
            >
              <div
                className={`absolute w-5 h-5 rounded-full bg-[#4ade80] flex items-center justify-center transition-all ${
                  darkMode ? "left-1" : "left-8"
                }`}
              >
                {darkMode ? (
                  <Moon size={11} className="text-black" />
                ) : (
                  <Sun size={11} className="text-black" />
                )}
              </div>
            </button>
            <button
              data-testid="button-shield"
              className="w-8 h-8 rounded-full bg-[#123832] border border-[#2f6b5a] flex items-center justify-center text-[#4ade80]"
            >
              <CheckCircle2 size={15} />
            </button>
            <button
              data-testid="button-connect-wallet"
              className="flex items-center gap-2 bg-[#12161f] border border-white/10 hover:border-white/20 text-white text-[13px] font-semibold px-4 py-2 rounded-full transition-all"
            >
              <Wallet size={14} />
              Connect Wallet
              <ChevronDown size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-tight mb-5">
            Say GM &amp; Deploy Contracts{" "}
            <span className="text-[#4ade80]">in one-click!</span>
          </h1>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6270]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search networks..."
              data-testid="input-search-networks"
              className="w-full bg-[#12161f] border border-white/10 focus:border-[#4ade80]/50 rounded-xl pl-11 pr-4 py-3 text-[14px] text-white placeholder:text-[#5a6270] outline-none transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => setNetworkTab("new")}
              data-testid="tab-new-networks"
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                networkTab === "new"
                  ? "bg-white text-black"
                  : "text-[#8a93a3] hover:text-white"
              }`}
            >
              New Networks
            </button>
            <button
              onClick={() => setNetworkTab("hot")}
              data-testid="tab-hot-networks"
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                networkTab === "hot"
                  ? "bg-white text-black"
                  : "text-[#8a93a3] hover:text-white"
              }`}
            >
              Hot Networks
            </button>
          </div>

          {/* Daily reset banner */}
          <div className="flex items-center justify-between bg-[#12161f] border border-white/5 rounded-xl px-4 py-3.5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1c2130] flex items-center justify-center text-[#8a93a3]">
                <Clock size={16} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-white">
                  Daily Tasks Reset
                </div>
                <div className="text-[11px] text-[#8a93a3]">
                  All completed actions reset in
                </div>
              </div>
            </div>
            <div
              className="text-[15px] font-bold text-[#4ade80]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              10:45:25
            </div>
          </div>

          {/* Network grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredNetworks.map((net) => (
              <div
                key={net.id}
                data-testid={`card-network-${net.id}`}
                className="bg-[#12161f] border border-white/5 rounded-2xl p-4 relative"
              >
                <button
                  data-testid={`button-favorite-${net.id}`}
                  className="absolute top-3 left-3 text-[#5a6270] hover:text-pink-400 transition-colors"
                >
                  <Heart size={15} />
                </button>
                {net.badge && (
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      net.badge === "New"
                        ? "bg-[#123832] text-[#4ade80]"
                        : "bg-[#3a1f12] text-orange-400"
                    }`}
                  >
                    {net.badge}
                  </span>
                )}

                <div className="flex flex-col items-center pt-4 pb-2">
                  <LogoTile type={net.logo} />
                  <div className="mt-2.5 font-bold text-[15px] text-white">
                    {net.name}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  {["GM", "GN", "Deploy NFT"].map((label) => (
                    <button
                      key={label}
                      data-testid={`button-${net.id}-${label.toLowerCase().replace(/\s/g, "-")}`}
                      className="text-[11px] font-semibold text-[#c3c9d4] hover:text-[#4ade80] py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  data-testid={`button-${net.id}-deploy-counter`}
                  className="w-full mt-2 text-[11px] font-semibold text-[#c3c9d4] hover:text-[#4ade80] py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  Deploy Counter
                </button>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    data-testid={`button-${net.id}-deploy-token`}
                    className="flex-1 text-[11px] font-semibold text-[#c3c9d4] hover:text-[#4ade80] py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  >
                    Deploy Token
                  </button>
                  <button
                    data-testid={`button-${net.id}-all`}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#4ade80] px-3 py-1.5 rounded-lg bg-[#123832] hover:bg-[#164a3d] transition-colors"
                  >
                    <Zap size={11} />
                    All
                  </button>
                </div>

                {net.showBridge && (
                  <button
                    data-testid={`button-${net.id}-bridge`}
                    className="w-full flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-white/5 text-[11px] font-semibold text-[#8a93a3] hover:text-white transition-colors"
                  >
                    <ArrowLeftRight size={11} />
                    Bridge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Polymer bridge */}
          <div className="bg-[#12161f] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center shrink-0">
              <Boxes size={18} className="text-white" />
            </div>
            <div className="text-[13px] font-bold text-white leading-snug">
              Bridge NOW on Polymer! 🌉
            </div>
          </div>

          {/* GM Streak */}
          <div className="bg-[#12161f] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold text-white">
                GM Streak
              </span>
              <span className="text-[10px] font-semibold text-[#8a93a3] bg-white/[0.04] px-2 py-0.5 rounded-full">
                Arbitrum One
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
                <Flame size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[24px] font-black text-white">0</span>
                  <span className="text-[13px] text-[#8a93a3]">days</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-[#8a93a3] mt-2">
              Keep your streak alive!
            </div>
          </div>

          {/* Refer & Earn */}
          <div className="bg-[#12161f] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shrink-0">
                <Gift size={18} className="text-white" />
              </div>
              <span className="text-[13px] font-bold text-white">
                Refer &amp; Earn!
              </span>
            </div>
            <p className="text-[11px] text-[#8a93a3] leading-relaxed mb-2">
              Invite friends and earn 10% from every deployment automatically!
            </p>
            <div className="flex items-center justify-end gap-1.5 text-[11px] text-[#4ade80]">
              <Loader2 size={12} className="animate-spin" />
              Loading...
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div
            data-testid="modal-all-in-one"
            className="w-full max-w-[380px] bg-[#12161f] border border-white/10 rounded-2xl shadow-2xl p-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#4ade80]" />
                <span className="font-bold text-[15px] text-white">
                  All-in-One on robinhood
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                data-testid="button-close-modal"
                className="text-[#5a6270] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 mb-4">
              {MODAL_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveModalTab(tab)}
                  data-testid={`modal-tab-${tab.toLowerCase()}`}
                  className={`flex-1 text-[12px] font-semibold py-2 rounded-lg transition-all ${
                    activeModalTab === tab
                      ? "bg-white/10 text-white"
                      : "bg-white/[0.03] text-[#8a93a3] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="w-8 h-8 shrink-0 rounded-lg bg-[#4ade80] flex items-center justify-center">
                <CheckCircle2 size={16} className="text-black" />
              </div>
            </div>

            {/* Workflow progress */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-bold text-white">
                  Workflow Progress
                </span>
                <span className="text-[11px] text-[#8a93a3]">
                  {completedCount}/5 Complete
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {WORKFLOW_STEPS.map((step, i) => (
                  <button
                    key={step}
                    onClick={() => toggleStep(i)}
                    data-testid={`workflow-step-${i}`}
                    className="flex items-center gap-2.5 text-left"
                  >
                    {completedSteps[i] ? (
                      <CheckCircle2 size={16} className="text-[#4ade80] shrink-0" />
                    ) : (
                      <Circle size={16} className="text-[#3a3f4b] shrink-0" />
                    )}
                    <span
                      className={`text-[13px] ${completedSteps[i] ? "text-white" : "text-[#c3c9d4]"}`}
                    >
                      {step}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Total reward */}
            <div className="bg-gradient-to-br from-[#1c1633] to-[#211b3a] border border-white/5 rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-white">
                  Total Reward
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#4ade80] bg-[#123832] px-2 py-0.5 rounded-full">
                  Mainnet
                  <Info size={10} />
                </span>
              </div>
              <div className="text-[22px] font-black text-[#4ade80]">
                +15 points
              </div>
            </div>

            {/* Share & earn */}
            <button
              data-testid="button-share-earn"
              className="w-full flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 rounded-xl px-4 py-3 mb-3 transition-colors"
            >
              <span className="text-[13px] font-semibold text-white">
                Share &amp; Earn Rewards
              </span>
              <span className="text-[11px] font-bold text-black bg-yellow-400 px-2 py-0.5 rounded-full">
                $ +Points
              </span>
            </button>

            {/* Switch button */}
            <button
              data-testid="button-switch-network"
              className="w-full bg-[#4ade80] hover:bg-[#3fd672] text-black font-bold text-[14px] py-3 rounded-xl transition-all"
            >
              Switch to robinhood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
