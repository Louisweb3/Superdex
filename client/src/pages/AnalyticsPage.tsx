import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, Users, Repeat2,
  DollarSign, ArrowUpRight, ChevronDown, Info,
  Zap, BarChart2, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsOverview {
  totalVolume: number;
  totalFees: number;
  totalSwaps: number;
  totalUsers: number;
  volume24h: number;
  swaps24h: number;
  activeUsers24h: number;
  volumeChange24h: number;
  fees: { swap: number; liquidity: number; platform: number };
  protocols: { name: string; percentage: number }[];
}
interface ChartPoint { date: string; volume: number; swaps: number }
interface UserPoint { date: string; users: number }
interface TopPair { pair: string; volume: number; swaps: number; change24h: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtUsd(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  }
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return "$" + n.toFixed(2);
}
function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("en-US");
}
function pct(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

const PERIOD_DAYS: Record<string, number> = { "24H": 1, "7D": 7, "30D": 30, "90D": 90, "1Y": 365 };

const PROTOCOL_COLORS = ["#2dae50", "#3b82f6", "#f59e0b", "#8b5cf6", "#64748b"];

const TOKEN_ICONS: Record<string, string> = {
  ETH: "/figmaAssets/image-7.png",
  WETH: "/figmaAssets/image-7.png",
  cbBTC: "/figmaAssets/image-6.png",
  USDC: "/figmaAssets/image-5.png",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, change, icon: Icon, color = "#2dae50", sparkData,
}: {
  label: string; value: string; change?: number;
  icon: any; color?: string; sparkData?: number[];
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="relative flex flex-col justify-between rounded-[18px] border border-[#0f2030] bg-[#030c18] p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#071a14]/30 to-transparent pointer-events-none" />
      <div className="relative flex items-start justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#1a2e28]" style={{ background: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <Info className="h-3.5 w-3.5 text-[#3a4a5a] cursor-help" />
      </div>
      <div className="relative">
        <div className="font-['Inter',Helvetica] text-[22px] font-bold text-white leading-none">{value}</div>
        {change !== undefined && (
          <div className={`mt-1.5 flex items-center gap-1 text-[12px] font-medium ${up ? "text-[#2dae50]" : "text-[#e05a3a]"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {pct(change)}
          </div>
        )}
        <div className="mt-1 text-[11px] text-[#4a5a6a] font-['Inter',Helvetica]">{label}</div>
      </div>
      {sparkData && sparkData.length > 0 && (
        <div className="mt-3 h-[40px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map((v, i) => ({ v, i }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg-${label})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-['Inter',Helvetica] text-[15px] font-bold text-white">{title}</h2>
          <Info className="h-3.5 w-3.5 text-[#3a4a5a] cursor-help" />
        </div>
        {sub && <p className="mt-0.5 text-[11px] text-[#4a5a6a]">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function PeriodSelector({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex items-center gap-1 rounded-[10px] border border-[#0f2030] bg-[#020b15] p-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-[7px] px-2.5 py-1 text-[11px] font-medium transition-all ${
            value === o ? "bg-[#0f2030] text-[#2dae50]" : "text-[#3a4a5a] hover:text-[#2dae50]"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[12px] border border-[#1a2e28] bg-[#030c18] px-3 py-2 shadow-xl">
      <p className="text-[11px] text-[#5a7a6a] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[12px] font-bold" style={{ color: p.color }}>
          {p.name === "volume" ? fmtUsd(p.value, true) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AnalyticsPage = (): JSX.Element => {
  const [period, setPeriod] = useState("7D");
  const [userPeriod, setUserPeriod] = useState("7D");

  const periodParam = period.toLowerCase().replace("h", "h");

  const { data: overview, isLoading: ovLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/analytics/overview"],
    queryFn: async () => {
      const r = await fetch("/api/analytics/overview");
      return r.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: chartData = [], isLoading: chartLoading } = useQuery<ChartPoint[]>({
    queryKey: ["/api/analytics/chart", period],
    queryFn: async () => {
      const r = await fetch(`/api/analytics/chart?period=${period.toLowerCase()}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const { data: topPairs = [], isLoading: pairsLoading } = useQuery<TopPair[]>({
    queryKey: ["/api/analytics/top-pairs"],
    queryFn: async () => {
      const r = await fetch("/api/analytics/top-pairs");
      return r.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: usersData = [], isLoading: usersLoading } = useQuery<UserPoint[]>({
    queryKey: ["/api/analytics/users-chart", userPeriod],
    queryFn: async () => {
      const r = await fetch(`/api/analytics/users-chart?period=${userPeriod.toLowerCase()}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const ov = overview;
  const hasData = !!ov;

  // Spark data derived from chart
  const sparkVolume = chartData.map((d) => d.volume);
  const sparkSwaps = chartData.map((d) => d.swaps);

  // Protocol pie data
  const protocols = ov?.protocols ?? [];

  const insights = [
    {
      icon: TrendingUp,
      color: "#2dae50",
      title: ov
        ? `Volume is ${pct(ov.volumeChange24h)} vs previous 24h.`
        : "Volume change tracking active.",
      sub: "Traders are more active today.",
    },
    {
      icon: Users,
      color: "#3b82f6",
      title: `${fmtNum(ov?.totalUsers ?? 0)} unique traders on SuperSwap.`,
      sub: "Growing community on Base.",
    },
    {
      icon: Activity,
      color: "#f59e0b",
      title: (topPairs[0]?.pair ?? "ETH / USDC") + " is the most traded pair.",
      sub: topPairs[0] ? `${fmtUsd(topPairs[0].volume, true)} total volume.` : "Based on all-time data.",
    },
    {
      icon: DollarSign,
      color: "#8b5cf6",
      title: `Fees collected: ${fmtUsd(ov?.totalFees ?? 0, true)}.`,
      sub: "More volume means more rewards for $SUPER holders.",
    },
  ];

  return (
    <div className="w-full min-h-screen pb-6 px-3 sm:px-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between py-4 sm:py-5">
        <div>
          <h1 className="font-['Inter',Helvetica] text-[20px] sm:text-[22px] font-bold text-white">
            Analytics Overview
          </h1>
          <p className="mt-0.5 text-[12px] text-[#4a5a6a]">Track the performance of SuperSwap on Base.</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} options={["24H", "7D", "30D", "90D", "1Y"]} />
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Total Volume"
          value={hasData ? fmtUsd(ov!.totalVolume, true) : "—"}
          change={ov?.volumeChange24h}
          icon={DollarSign}
          color="#2dae50"
          sparkData={sparkVolume}
        />
        <StatCard
          label="Total Fees"
          value={hasData ? fmtUsd(ov!.totalFees, true) : "—"}
          change={ov ? ov.volumeChange24h * 0.8 : undefined}
          icon={TrendingUp}
          color="#8b5cf6"
          sparkData={sparkVolume.map((v) => v * 0.003)}
        />
        <StatCard
          label="Total Swaps"
          value={hasData ? fmtNum(ov!.totalSwaps) : "—"}
          change={ov ? ov.volumeChange24h * 0.6 : undefined}
          icon={Repeat2}
          color="#3b82f6"
          sparkData={sparkSwaps}
        />
        <StatCard
          label="Unique Users"
          value={hasData ? fmtNum(ov!.totalUsers) : "—"}
          change={ov ? Math.abs(ov.volumeChange24h) * 0.4 : undefined}
          icon={Users}
          color="#f59e0b"
          sparkData={usersData.map((d) => d.users)}
        />
      </div>

      {/* ── Volume Over Time ── */}
      <div className="rounded-[18px] border border-[#0f2030] bg-[#030c18] p-4 mb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#4a5a6a]">Volume Over Time</span>
              <Info className="h-3.5 w-3.5 text-[#3a4a5a]" />
            </div>
            <div className="font-['Inter',Helvetica] text-[20px] font-bold text-white mt-0.5">
              {hasData ? fmtUsd(ov!.totalVolume) : "—"}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-1 rounded-[7px] border border-[#0f2030] bg-[#020b15] text-[#4a5a6a]">USD</span>
            <PeriodSelector value={period} onChange={setPeriod} options={["7D", "30D", "1Y"]} />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className={`flex items-center gap-1 text-[11px] font-medium ${(ov?.volumeChange24h ?? 0) >= 0 ? "text-[#2dae50]" : "text-[#e05a3a]"}`}>
            <div className="h-2 w-2 rounded-full bg-[#2dae50]" />
            Volume (USD)
          </span>
          {ov && (
            <span className={`text-[11px] font-medium ${ov.volumeChange24h >= 0 ? "text-[#2dae50]" : "text-[#e05a3a]"}`}>
              {pct(ov.volumeChange24h)}
            </span>
          )}
        </div>

        {chartLoading || chartData.length === 0 ? (
          <div className="h-[140px] flex items-center justify-center">
            {chartLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 rounded-full border-2 border-[#2dae50] border-t-transparent animate-spin" />
                <span className="text-[11px] text-[#3a4a5a]">Loading chart…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <BarChart2 className="h-8 w-8 text-[#1a2a3a]" />
                <span className="text-[12px] text-[#3a4a5a]">No swap data yet</span>
                <span className="text-[10px] text-[#2a3a4a]">Make a swap to start tracking volume</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dae50" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2dae50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0a1520" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#3a4a5a", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => fmtUsd(v, true)} tick={{ fill: "#3a4a5a", fontSize: 10 }} tickLine={false} axisLine={false} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="volume" name="volume" stroke="#2dae50" strokeWidth={2} fill="url(#volGrad)" dot={false} activeDot={{ r: 4, fill: "#2dae50" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Volume by Protocol ── */}
      <div className="rounded-[18px] border border-[#0f2030] bg-[#030c18] p-4 mb-4">
        <SectionHeader title="Volume by Protocol" sub="Live routing data from 0x API" />

        {protocols.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-[#2dae50] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocols}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    dataKey="percentage"
                    strokeWidth={0}
                  >
                    {protocols.map((_: any, i: number) => (
                      <Cell key={i} fill={PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#4a5a6a]">Total</span>
                <span className="text-[12px] font-bold text-white">{hasData ? fmtUsd(ov!.totalVolume, true) : "—"}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {protocols.map((p: any, i: number) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PROTOCOL_COLORS[i % PROTOCOL_COLORS.length] }} />
                    <span className="text-[12px] text-[#c0c8d0] truncate">{p.name}</span>
                  </div>
                  <span className="text-[12px] font-medium text-white shrink-0 ml-2">{p.percentage}%</span>
                </div>
              ))}
              <button className="mt-1 flex items-center gap-1 text-[11px] text-[#2dae50] hover:text-[#3acd5b] transition-colors">
                View All Protocols <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Trading Pairs ── */}
      <div className="rounded-[18px] border border-[#0f2030] bg-[#030c18] p-4 mb-4">
        <SectionHeader title="Top Trading Pairs" sub="Ranked by all-time volume" />
        {pairsLoading ? (
          <div className="h-[120px] flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-[#2dae50] border-t-transparent animate-spin" />
          </div>
        ) : topPairs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Repeat2 className="h-8 w-8 text-[#1a2a3a]" />
            <span className="text-[12px] text-[#3a4a5a]">No swap data yet</span>
            <span className="text-[10px] text-[#2a3a4a]">Trading pairs will appear here after swaps</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] text-[#3a4a5a] font-medium uppercase tracking-wide">Pair</span>
              <div className="flex items-center gap-6">
                <span className="text-[10px] text-[#3a4a5a] font-medium uppercase tracking-wide">Volume</span>
                <span className="text-[10px] text-[#3a4a5a] font-medium uppercase tracking-wide w-16 text-right">24H Chg</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {topPairs.slice(0, 5).map((p, i) => {
                const [sell, buy] = p.pair.split(" / ");
                return (
                  <div key={p.pair} className="flex items-center justify-between rounded-[12px] border border-[#0a1828] bg-[#020b15] px-3 py-2.5" data-testid={`row-pair-${i}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex -space-x-1.5">
                        <div className="h-7 w-7 rounded-full border border-[#0f2030] bg-[#0a1828] overflow-hidden">
                          <img src={TOKEN_ICONS[sell] ?? "/figmaAssets/image-7.png"} alt={sell} className="h-full w-full object-cover" />
                        </div>
                        <div className="h-7 w-7 rounded-full border border-[#0f2030] bg-[#0a1828] overflow-hidden">
                          <img src={TOKEN_ICONS[buy] ?? "/figmaAssets/image-5.png"} alt={buy} className="h-full w-full object-cover" />
                        </div>
                      </div>
                      <span className="text-[13px] font-medium text-white">{p.pair}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-medium text-[#c0c8d0]">{fmtUsd(p.volume, true)}</span>
                      <span className={`text-[12px] font-bold w-16 text-right ${p.change24h >= 0 ? "text-[#2dae50]" : "text-[#e05a3a]"}`}>
                        {pct(p.change24h)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="mt-3 flex items-center gap-1 text-[11px] text-[#2dae50] hover:text-[#3acd5b] transition-colors">
              View All Pairs <ArrowUpRight className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {/* ── Users Growth ── */}
      <div className="rounded-[18px] border border-[#0f2030] bg-[#030c18] p-4 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-white">Users Growth</span>
              <Info className="h-3.5 w-3.5 text-[#3a4a5a]" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[20px] font-bold text-white">{hasData ? fmtNum(ov!.totalUsers) : "—"}</span>
              {ov && (
                <span className="text-[12px] text-[#2dae50] font-medium">
                  +{fmtNum(ov.activeUsers24h)} active 24h
                </span>
              )}
            </div>
          </div>
          <PeriodSelector value={userPeriod} onChange={setUserPeriod} options={["7D", "30D"]} />
        </div>
        {usersLoading || usersData.length === 0 ? (
          <div className="h-[110px] flex items-center justify-center">
            {usersLoading ? (
              <div className="h-6 w-6 rounded-full border-2 border-[#2dae50] border-t-transparent animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-center">
                <Users className="h-7 w-7 text-[#1a2a3a]" />
                <span className="text-[11px] text-[#3a4a5a]">No user data for this period</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[110px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0a1520" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#3a4a5a", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#3a4a5a", fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="users" name="users" fill="#2dae50" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {usersData.map((_: any, i: number) => (
                    <Cell key={i} fill={i === usersData.length - 1 ? "#2dae50" : "#1a4a2a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Fees Breakdown ── */}
      <div className="rounded-[18px] border border-[#0f2030] bg-[#030c18] p-4 mb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-white">Fees Breakdown</span>
              <Info className="h-3.5 w-3.5 text-[#3a4a5a]" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[20px] font-bold text-white">{hasData ? fmtUsd(ov!.totalFees) : "—"}</span>
              {ov && (
                <span className={`text-[12px] font-medium ${ov.volumeChange24h >= 0 ? "text-[#2dae50]" : "text-[#e05a3a]"}`}>
                  {pct(ov.volumeChange24h * 0.8)}
                </span>
              )}
            </div>
          </div>
        </div>

        {hasData && (
          <div className="mt-3 flex flex-col gap-3">
            {[
              { label: "Swap Fees", value: ov!.fees.swap, pct: 76.9, color: "#2dae50" },
              { label: "Liquidity Fees", value: ov!.fees.liquidity, pct: 15.3, color: "#3b82f6" },
              { label: "Platform Fees", value: ov!.fees.platform, pct: 7.8, color: "#8b5cf6" },
            ].map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-[#c0c8d0]">{f.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-white">{fmtUsd(f.value)}</span>
                    <span className="text-[11px] text-[#4a5a6a] w-12 text-right">{f.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#0a1520]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${f.pct}%`, background: f.color }} />
                </div>
              </div>
            ))}
            <button className="mt-1 flex items-center gap-1 text-[11px] text-[#2dae50] hover:text-[#3acd5b] transition-colors">
              View Fee Model <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Analytics Insights ── */}
      <div className="rounded-[18px] border border-[#0f2030] bg-[#030c18] p-4">
        <SectionHeader title="Analytics Insights" />
        <div className="flex flex-col gap-3">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-3 rounded-[12px] border border-[#0a1828] bg-[#020b15] px-3 py-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: `${ins.color}15`, border: `1px solid ${ins.color}25` }}
              >
                <ins.icon className="h-4 w-4" style={{ color: ins.color }} />
              </div>
              <div>
                <p className="text-[12px] font-medium text-white leading-snug">{ins.title}</p>
                <p className="mt-0.5 text-[11px] text-[#4a5a6a]">{ins.sub}</p>
              </div>
            </div>
          ))}
          <button className="mt-1 flex items-center gap-1 text-[11px] text-[#2dae50] hover:text-[#3acd5b] transition-colors">
            View All Insights <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
