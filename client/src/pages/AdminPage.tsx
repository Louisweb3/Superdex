import { useState, useRef, useEffect } from "react";
import {
  useAdminAuth, useAdminSettings, useAdminBlocks, useAdminEvents, useAdminSocial,
  useAdminDatabase, useAdminEarnTasks, useAdminAnnouncements, useAdminPopularTokens,
  type PageBlock, type CmsEvent, type CmsSocialLink, type AdminEarnTask,
  type AdminAnnouncementItem, type AdminPopularToken,
} from "@/hooks/useAdmin";
import {
  Shield, Settings, FileText, Calendar, Link2, Save, Trash2, Plus, Eye, Lock,
  CheckCircle, AlertCircle, Database, Download, ChevronLeft, ChevronRight, Zap,
  Megaphone, LayoutDashboard, Coins, Bot, Users, BarChart3, Activity, RefreshCw,
  ExternalLink, Globe, Menu, X, ArrowUpRight, Sparkles, ChevronDown, ChevronUp,
  Edit3, Layers, Star,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#020b1c",
  panel:   "#00040e",
  border:  "#0f1e2e",
  border2: "#1a2535",
  green:   "#2dae50",
  greenBg: "#0e3a1e",
  greenBorder: "#1a5c2a",
  text:    "#c8ccd4",
  muted:   "#6c778a",
  accent:  "#3acd5b",
};

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[16px] border border-[#0f1e2e] bg-[#00040e] ${className}`}>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", className = "" }: any) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className={`w-full rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none placeholder:text-[#3a4a5c] focus:border-[#2dae50] transition-colors ${className}`} />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: any) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="w-full rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none placeholder:text-[#3a4a5c] focus:border-[#2dae50] transition-colors resize-y" />
  );
}

function Btn({ onClick, children, variant = "primary", disabled = false, className = "", size = "md" }: any) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-[10px] font-['Inter',sans-serif] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const sz = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[13px]";
  const v = variant === "primary" ? "bg-[#0e3a1e] text-[#3acd5b] border border-[#1a5c2a] hover:bg-[#143e22]"
    : variant === "danger" ? "bg-[#3a0e0e] text-[#c9543a] border border-[#5c1a1a] hover:bg-[#4a1212]"
    : variant === "secondary" ? "bg-[#071020] text-[#6c778a] border border-[#131b27] hover:bg-[#0a1625]"
    : "bg-transparent text-[#6c778a] border border-[#131b27] hover:bg-[#071020]";
  return <button onClick={onClick} disabled={disabled} className={`${base} ${sz} ${v} ${className}`}>{children}</button>;
}

function Badge({ children, variant = "green" }: { children: React.ReactNode; variant?: "green" | "red" | "blue" | "gray" }) {
  const v = variant === "green" ? "bg-[#0e3a1e] text-[#3acd5b] border-[#1a5c2a]"
    : variant === "red" ? "bg-[#3a0e0e] text-[#c9543a] border-[#5c1a1a]"
    : variant === "blue" ? "bg-[#0e1a3a] text-[#4a9fd4] border-[#1a3a5c]"
    : "bg-[#071020] text-[#6c778a] border-[#131b27]";
  return <span className={`inline-flex items-center rounded-[6px] border px-2 py-0.5 font-['Inter',sans-serif] text-[10px] font-bold ${v}`}>{children}</span>;
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-['Inter',sans-serif] text-[18px] font-bold text-[#d0d2d6]">{title}</h2>
        {description && <p className="mt-0.5 font-['Inter',sans-serif] text-[13px] text-[#6c778a]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function Select({ value, onChange, children, className = "" }: any) {
  return (
    <select value={value} onChange={onChange}
      className={`rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none focus:border-[#2dae50] transition-colors ${className}`}>
      {children}
    </select>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (pwd: string) => Promise<void> }) {
  const [pwd, setPwd] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try { await onLogin(pwd); } catch { setErr("Wrong password."); } finally { setLoading(false); }
  };
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#020b1c] px-4">
      <Card className="w-full max-w-[380px] px-6 py-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0e3a1e] border border-[#1a5c2a]">
            <Shield className="h-7 w-7 text-[#3acd5b]" />
          </div>
          <div className="text-center">
            <h1 className="font-['Inter',sans-serif] text-[20px] font-bold text-[#d0d2d6]">Admin Dashboard</h1>
            <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">SuperSwap DEX · Control Center</p>
          </div>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input type="password" value={pwd} onChange={(e: any) => setPwd(e.target.value)} placeholder="Enter admin password" />
          {err && <p className="flex items-center gap-1.5 font-['Inter',sans-serif] text-[12px] text-[#c9543a]"><AlertCircle className="h-3 w-3" />{err}</p>}
          <Btn disabled={loading || !pwd} className="w-full py-2.5">{loading ? "Verifying..." : "Enter Dashboard"}</Btn>
        </form>
      </Card>
    </div>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab() {
  const { tables } = useAdminDatabase();
  const tc = tables.data ?? [];
  const get = (name: string) => tc.find((t) => t.table === name)?.count ?? 0;

  const stats = [
    { label: "Total Users", value: get("reward_users").toLocaleString(), icon: <Users className="h-5 w-5 text-[#4a9fd4]" />, color: "border-[#1a3a5c]" },
    { label: "Total Swaps", value: get("swap_events").toLocaleString(), icon: <Activity className="h-5 w-5 text-[#3acd5b]" />, color: "border-[#1a5c2a]" },
    { label: "Earn Tasks", value: get("earn_tasks").toLocaleString(), icon: <Zap className="h-5 w-5 text-[#e8a22a]" />, color: "border-[#4a3200]" },
    { label: "Announcements", value: get("admin_announcements").toLocaleString(), icon: <Megaphone className="h-5 w-5 text-[#b06af5]" />, color: "border-[#3a1a5c]" },
    { label: "Popular Tokens", value: get("popular_tokens").toLocaleString(), icon: <Coins className="h-5 w-5 text-[#3acd5b]" />, color: "border-[#1a5c2a]" },
    { label: "Page Blocks", value: get("page_blocks").toLocaleString(), icon: <Layers className="h-5 w-5 text-[#4a9fd4]" />, color: "border-[#1a3a5c]" },
  ];

  const quickLinks = [
    { label: "Home Page", href: "/", icon: <Globe className="h-4 w-4" /> },
    { label: "Swap Page", href: "/swap", icon: <Activity className="h-4 w-4" /> },
    { label: "Earn Page", href: "/earn", icon: <Zap className="h-4 w-4" /> },
    { label: "Rewards", href: "/rewards", icon: <Star className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Dashboard" description="Live overview of your SuperSwap DEX platform" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className={`px-4 py-4 border ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] uppercase tracking-wide">{s.label}</span>
              {s.icon}
            </div>
            <p className="font-['Inter',sans-serif] text-[22px] font-bold text-[#d0d2d6]">{tables.isLoading ? "—" : s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="px-5 py-4">
        <p className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#c8ccd4] mb-3">Quick Links — Open in new tab</p>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#131b27] bg-[#071020] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#6c778a] hover:text-[#c8ccd4] hover:border-[#1a2535] transition-all">
              {l.icon}{l.label}<ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </Card>

      <Card className="px-5 py-4 border-[#1a3a5c]">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-[#4a9fd4] mt-0.5 shrink-0" />
          <div>
            <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#c8ccd4]">AI Builder available</p>
            <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a] mt-0.5">Use the AI Builder tab to make changes with natural language. Requires an OPENAI_API_KEY secret.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Site Settings Tab ────────────────────────────────────────────────────────
function SiteSettingsTab() {
  const { settings, update } = useAdminSettings();
  const data = settings.data ?? {};
  const [local, setLocal] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string>("");

  const handleSave = async (key: string) => {
    await update.mutateAsync({ key, value: local[key] ?? data[key] ?? "" });
    setSaved(key);
    setTimeout(() => setSaved(""), 2000);
  };

  const groups = [
    {
      title: "Hero Section",
      desc: "Main headlines on the homepage",
      fields: [
        { key: "hero_title_line1", label: "Hero Line 1", placeholder: "SWAP.", hint: "First animated word" },
        { key: "hero_title_line2", label: "Hero Line 2", placeholder: "EARN.", hint: "Second animated word" },
        { key: "hero_title_line3", label: "Hero Line 3", placeholder: "REPEAT.", hint: "Third animated word" },
        { key: "hero_subtitle", label: "Subtitle", placeholder: "The DEX on Base that rewards you every time you trade.", hint: "Below the hero headline" },
        { key: "site_tagline", label: "Site Tagline / Badge", placeholder: "REWARD-FIRST DEX", hint: "Small badge on homepage" },
      ],
    },
    {
      title: "Stats & Metrics",
      desc: "Numbers shown on the homepage",
      fields: [
        { key: "total_rewards_paid", label: "Total Rewards Paid", placeholder: "$2,481,092", hint: "Overview stat" },
      ],
    },
    {
      title: "Campaign Settings",
      desc: "Links used in earn tasks and social campaigns",
      fields: [
        { key: "campaign_post_url", label: "X/Twitter Campaign Post URL", placeholder: "https://x.com/superswap_fi/status/...", hint: "Post users must like & repost on Earn page" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Site Settings" description="Control text, stats, and links across the website" />
      {groups.map((g) => (
        <div key={g.title}>
          <div className="mb-3">
            <p className="font-['Inter',sans-serif] text-[14px] font-bold text-[#c8ccd4]">{g.title}</p>
            <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a]">{g.desc}</p>
          </div>
          <div className="flex flex-col gap-2">
            {g.fields.map((f) => (
              <Card key={f.key} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-['Inter',sans-serif] text-[12px] font-semibold text-[#c8ccd4]">{f.label}</p>
                    <p className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c]">{f.hint}</p>
                  </div>
                  {saved === f.key && <Badge variant="green"><CheckCircle className="h-3 w-3 mr-1" />Saved</Badge>}
                </div>
                <div className="flex gap-2">
                  <Input value={local[f.key] ?? data[f.key] ?? ""} onChange={(e: any) => setLocal((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  <Btn onClick={() => handleSave(f.key)} disabled={update.isPending} size="sm"><Save className="h-3.5 w-3.5" />Save</Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page Blocks Tab ─────────────────────────────────────────────────────────
const PAGES = ["home", "swap", "rewards", "vault", "analytics"];
const SECTIONS: Record<string, string[]> = {
  home:      ["hero", "overview", "dex_highlights", "token_promo"],
  swap:      ["swap_widget", "market_chart", "popular_tokens"],
  rewards:   ["xp_progress", "quests", "history", "leaderboard"],
  vault:     ["stats", "pools", "info"],
  analytics: ["overview", "charts"],
};

function PageBlocksTab() {
  const [selPage, setSelPage] = useState("home");
  const [selSection, setSelSection] = useState("hero");
  const { blocks, saveBlock, deleteBlock } = useAdminBlocks(selPage);
  const [editing, setEditing] = useState<PageBlock | null>(null);
  const [isNew, setIsNew] = useState(false);
  const filtered = (blocks.data ?? []).filter((b) => b.section === selSection);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Page Blocks" description="Edit CMS content blocks for each page section" />
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 uppercase tracking-wide">Page</label>
          <Select value={selPage} onChange={(e: any) => { setSelPage(e.target.value); setSelSection(SECTIONS[e.target.value]?.[0] ?? ""); }}>
            {PAGES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </Select>
        </div>
        <div>
          <label className="block font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 uppercase tracking-wide">Section</label>
          <Select value={selSection} onChange={(e: any) => setSelSection(e.target.value)}>
            {(SECTIONS[selPage] ?? []).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </Select>
        </div>
        <Btn variant="secondary" onClick={() => { setIsNew(true); setEditing({ id: "", page: selPage, section: selSection, block_key: "", content_type: "text", value: "", sort_order: 0 }); }}>
          <Plus className="h-4 w-4" />Add Block
        </Btn>
      </div>
      <div className="flex flex-col gap-3">
        {filtered.map((block) => (
          <Card key={block.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#c8ccd4]">{block.block_key}</p>
                <Badge variant="gray">{block.content_type}</Badge>
                {block.content_type === "image" ? (
                  <img src={block.value} alt={block.block_key} className="mt-2 max-h-[80px] rounded-[8px] object-contain" />
                ) : (
                  <p className="mt-1 font-['Inter',sans-serif] text-[12px] text-[#6c778a] line-clamp-2">{block.value}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Btn size="sm" variant="secondary" onClick={() => { setIsNew(false); setEditing(block); }}><Edit3 className="h-3.5 w-3.5" /></Btn>
                <Btn size="sm" variant="danger" onClick={() => { if (confirm("Delete?")) deleteBlock.mutate(block.id); }}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !isNew && <p className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">No blocks in this section yet.</p>}
      </div>
      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <p className="font-['Inter',sans-serif] text-[14px] font-bold text-[#d0d2d6] mb-3">{isNew ? "Add Block" : "Edit Block"}</p>
          <div className="flex flex-col gap-3">
            <Input value={editing.block_key} onChange={(e: any) => setEditing({ ...editing, block_key: e.target.value })} placeholder="Block key (e.g. title, subtitle)" />
            <Select value={editing.content_type} onChange={(e: any) => setEditing({ ...editing, content_type: e.target.value })} className="w-full">
              <option value="text">Text</option><option value="image">Image URL</option><option value="html">HTML</option>
            </Select>
            {editing.content_type === "text" || editing.content_type === "html"
              ? <TextArea value={editing.value} onChange={(e: any) => setEditing({ ...editing, value: e.target.value })} placeholder={editing.content_type === "html" ? "<p>HTML...</p>" : "Content"} rows={4} />
              : <Input value={editing.value} onChange={(e: any) => setEditing({ ...editing, value: e.target.value })} placeholder="https://..." />
            }
            <Input type="number" value={editing.sort_order} onChange={(e: any) => setEditing({ ...editing, sort_order: Number(e.target.value) })} placeholder="Sort order" />
            <div className="flex gap-2">
              <Btn onClick={() => { saveBlock.mutate(editing); setEditing(null); setIsNew(false); }} disabled={!editing.block_key}><Save className="h-4 w-4" />{isNew ? "Create" : "Update"}</Btn>
              <Btn variant="secondary" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Popular Tokens Tab ───────────────────────────────────────────────────────
const QUICK_ADD_TOKENS = [
  { symbol: "ETH", name: "Ethereum", address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
  { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
  { symbol: "cbBTC", name: "Coinbase Bitcoin", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  { symbol: "DAI", name: "Dai Stablecoin", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
  { symbol: "USDT", name: "Tether USD", address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 },
  { symbol: "AERO", name: "Aerodrome Finance", address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18 },
  { symbol: "BRETT", name: "Brett", address: "0x532f27101965dd16442E59d40670FaF5eBB142E4", decimals: 18 },
  { symbol: "VIRTUAL", name: "Virtuals Protocol", address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", decimals: 18 },
  { symbol: "cbETH", name: "Coinbase Staked ETH", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18 },
];

function PopularTokensTab() {
  const { tokens, upsert, remove } = useAdminPopularTokens();
  const [editing, setEditing] = useState<Partial<AdminPopularToken> | null>(null);
  const [showQuick, setShowQuick] = useState(false);

  const emptyToken: Partial<AdminPopularToken> = {
    symbol: "", name: "", address: "", decimals: 18, icon_url: "", sort_order: 0, active: true,
  };

  const handleSave = () => {
    if (!editing?.symbol || !editing?.name || !editing?.address) return;
    upsert.mutate({
      ...(editing.id ? { id: editing.id } : {}),
      symbol: editing.symbol,
      name: editing.name,
      address: editing.address,
      decimals: Number(editing.decimals ?? 18),
      icon_url: editing.icon_url ?? "",
      sort_order: Number(editing.sort_order ?? 0),
      active: editing.active ?? true,
    });
    setEditing(null);
  };

  const iconSrc = (t: { icon_url?: string; address: string }) =>
    t.icon_url || `https://dd.dexscreener.com/ds-data/tokens/base/${t.address.toLowerCase()}.png`;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Popular Tokens"
        description="Tokens shown in the swap page quick-select panel. If empty, defaults to first 6 from the built-in list."
        action={
          <div className="flex gap-2">
            <Btn size="sm" variant="secondary" onClick={() => setShowQuick(!showQuick)}>
              <Star className="h-3.5 w-3.5" />{showQuick ? "Hide" : "Quick Add"}
            </Btn>
            <Btn size="sm" onClick={() => setEditing({ ...emptyToken })}>
              <Plus className="h-3.5 w-3.5" />Add Token
            </Btn>
          </div>
        }
      />

      {showQuick && (
        <Card className="px-4 py-4">
          <p className="font-['Inter',sans-serif] text-[12px] font-semibold text-[#c8ccd4] mb-3">Quick Add Popular Tokens</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADD_TOKENS.map((t) => {
              const already = (tokens.data ?? []).some((x) => x.address.toLowerCase() === t.address.toLowerCase());
              return (
                <button key={t.address} disabled={already || upsert.isPending} onClick={() => upsert.mutate({ ...t, icon_url: "", sort_order: (tokens.data?.length ?? 0), active: true })}
                  className={`flex items-center gap-2 rounded-[10px] border px-3 py-1.5 font-['Inter',sans-serif] text-[12px] transition-all ${already ? "border-[#1a5c2a] bg-[#0e3a1e] text-[#3acd5b]" : "border-[#131b27] bg-[#071020] text-[#c8ccd4] hover:border-[#1a2535]"}`}>
                  <img src={`https://dd.dexscreener.com/ds-data/tokens/base/${t.address.toLowerCase()}.png`} alt={t.symbol} className="h-4 w-4 rounded-full" onError={(e) => { (e.target as any).style.display = "none"; }} />
                  {already ? <CheckCircle className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {t.symbol}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#d0d2d6] mb-3">{editing.id ? "Edit Token" : "Add New Token"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Symbol (e.g. ETH)" value={editing.symbol ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, symbol: e.target.value }))} />
            <Input placeholder="Name (e.g. Ethereum)" value={editing.name ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, name: e.target.value }))} />
            <Input placeholder="Contract address (0x...)" value={editing.address ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, address: e.target.value }))} className="sm:col-span-2" />
            <Input type="number" placeholder="Decimals (18)" value={editing.decimals ?? 18} onChange={(e: any) => setEditing((p) => ({ ...p!, decimals: Number(e.target.value) }))} />
            <Input type="number" placeholder="Sort order (0 = first)" value={editing.sort_order ?? 0} onChange={(e: any) => setEditing((p) => ({ ...p!, sort_order: Number(e.target.value) }))} />
            <Input placeholder="Custom icon URL (optional)" value={editing.icon_url ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, icon_url: e.target.value }))} className="sm:col-span-2" />
          </div>
          {editing.address && (
            <div className="mt-3 flex items-center gap-3">
              <img src={iconSrc({ icon_url: editing.icon_url, address: editing.address })} alt="preview" className="h-8 w-8 rounded-full bg-[#0a1825] object-cover" onError={(e) => { (e.target as any).src = "https://placehold.co/32x32/0a1825/6c778a?text=?"; }} />
              <span className="font-['Inter',sans-serif] text-[11px] text-[#6c778a]">Icon preview</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing((p) => ({ ...p!, active: e.target.checked }))} className="h-4 w-4 accent-[#2dae50]" />
            <span className="font-['Inter',sans-serif] text-[12px] text-[#c8ccd4]">Active (visible on swap page)</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={handleSave} disabled={!editing.symbol || !editing.address || upsert.isPending}><Save className="h-4 w-4" />Save Token</Btn>
            <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {tokens.isLoading ? (
        <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">Loading tokens...</p>
      ) : (tokens.data ?? []).length === 0 ? (
        <Card className="px-5 py-5">
          <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">No tokens added yet. Use "Quick Add" to add the most popular Base tokens, or add a custom token.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {(tokens.data ?? []).map((t, i) => (
            <Card key={t.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c] w-5 text-center">{i + 1}</span>
                <img src={iconSrc(t)} alt={t.symbol} className="h-9 w-9 rounded-full bg-[#0a1825] object-cover shrink-0"
                  onError={(e) => { (e.target as any).src = "https://placehold.co/36x36/0a1825/6c778a?text=?"; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#c8ccd4]">{t.symbol}</span>
                    <Badge variant={t.active ? "green" : "red"}>{t.active ? "Active" : "Hidden"}</Badge>
                  </div>
                  <p className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] truncate">{t.name} · {t.address.slice(0, 8)}...{t.address.slice(-4)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Btn size="sm" variant="secondary" onClick={() => setEditing(t)}><Edit3 className="h-3.5 w-3.5" /></Btn>
                  <Btn size="sm" variant="danger" onClick={() => { if (confirm(`Remove ${t.symbol}?`)) remove.mutate(t.id); }}><Trash2 className="h-3.5 w-3.5" /></Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────
function AnnouncementsTab() {
  const { announcements, create, update, remove } = useAdminAnnouncements();
  const [editing, setEditing] = useState<Partial<AdminAnnouncementItem> | null>(null);

  const blank: Partial<AdminAnnouncementItem> = {
    title: "", message: "", type: "info", active: true,
    start_date: new Date().toISOString().slice(0, 10), end_date: "", icon: "",
  };

  const handleSave = () => {
    if (!editing) return;
    const payload = { title: editing.title ?? "", message: editing.message ?? "", type: editing.type ?? "info", active: editing.active ?? true, start_date: editing.start_date ?? "", end_date: editing.end_date ?? "", icon: editing.icon ?? "" };
    if (editing.id) update.mutate({ id: editing.id, ...payload });
    else create.mutate(payload as Omit<AdminAnnouncementItem, "id">);
    setEditing(null);
  };

  const typeColors: Record<string, string> = {
    info: "text-[#4a9fd4]", event: "text-[#b06af5]", update: "text-[#4a9fd4]", alert: "text-[#e84a4a]", promo: "text-[#b06af5]",
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Announcements"
        description="Popup banners shown bottom-right to all visitors. Users can close or 'Don't show again'."
        action={<Btn size="sm" onClick={() => setEditing({ ...blank })}><Plus className="h-3.5 w-3.5" />New</Btn>}
      />

      <Card className="px-4 py-3 border-[#1a3a5c]">
        <div className="flex items-start gap-3">
          <Eye className="h-4 w-4 text-[#4a9fd4] mt-0.5 shrink-0" />
          <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a]">
            Active announcements appear as a popup in the bottom-right corner of every page. Users can dismiss them or choose "Don't show again" (stored in their browser).
          </p>
        </div>
      </Card>

      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#d0d2d6] mb-3">{editing.id ? "Edit Announcement" : "New Announcement"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Title" value={editing.title ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, title: e.target.value }))} />
            <Select value={editing.type ?? "info"} onChange={(e: any) => setEditing((p) => ({ ...p!, type: e.target.value }))} className="w-full">
              <option value="info">ℹ️ Info</option>
              <option value="success">✅ Success</option>
              <option value="event">🎉 Event</option>
              <option value="update">🔄 Update</option>
              <option value="alert">⚠️ Alert</option>
              <option value="promo">✨ Promo</option>
            </Select>
            <Input placeholder="Icon (emoji, e.g. 🚀)" value={editing.icon ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, icon: e.target.value }))} />
            <div className="flex gap-2">
              <Input type="date" value={editing.start_date ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, start_date: e.target.value }))} />
              <Input type="date" value={editing.end_date ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3">
            <TextArea placeholder="Message shown in the popup..." value={editing.message ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, message: e.target.value }))} rows={3} />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing((p) => ({ ...p!, active: e.target.checked }))} className="h-4 w-4 accent-[#2dae50]" />
            <span className="font-['Inter',sans-serif] text-[12px] text-[#c8ccd4]">Active</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={handleSave} disabled={!editing.title || !editing.message}><Save className="h-4 w-4" />Save</Btn>
            <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {(announcements.data ?? []).map((a) => (
          <Card key={a.id} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-[18px] shrink-0 mt-0.5">{a.icon || "📢"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#c8ccd4]">{a.title}</span>
                  <Badge variant={a.active ? "green" : "red"}>{a.active ? "Active" : "Inactive"}</Badge>
                  <span className={`font-['Inter',sans-serif] text-[11px] font-semibold capitalize ${typeColors[a.type] ?? "text-[#6c778a]"}`}>{a.type}</span>
                </div>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a] mt-0.5 line-clamp-2">{a.message}</p>
                {(a.start_date || a.end_date) && (
                  <p className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c] mt-0.5">{a.start_date}{a.end_date ? ` → ${a.end_date}` : ""}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Btn size="sm" variant="secondary" onClick={() => setEditing(a)}><Edit3 className="h-3.5 w-3.5" /></Btn>
                <Btn size="sm" variant="danger" onClick={() => remove.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>
            </div>
          </Card>
        ))}
        {(announcements.data ?? []).length === 0 && (
          <p className="font-['Inter',sans-serif] text-[13px] text-[#3a4a5c]">No announcements yet. Create one to show a popup to visitors.</p>
        )}
      </div>
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function EventsTab() {
  const { events, create, update, remove } = useAdminEvents();
  const [editing, setEditing] = useState<CmsEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const blank = (): CmsEvent => ({ id: "", title: "", description: "", event_type: "announcement", start_date: new Date().toISOString().slice(0, 10), end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), active: true, xp_bonus: 0, cashback_multiplier: 1 });

  const save = () => {
    if (!editing) return;
    if (isNew) create.mutate(editing); else update.mutate(editing);
    setEditing(null); setIsNew(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Events & Promos" description="Time-limited events with XP bonuses and cashback multipliers"
        action={<Btn size="sm" onClick={() => { setEditing(blank()); setIsNew(true); }}><Plus className="h-3.5 w-3.5" />New Event</Btn>} />
      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#d0d2d6] mb-3">{isNew ? "New Event" : "Edit Event"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input value={editing.title} onChange={(e: any) => setEditing({ ...editing, title: e.target.value })} placeholder="Title" />
            <Select value={editing.event_type} onChange={(e: any) => setEditing({ ...editing, event_type: e.target.value })} className="w-full">
              <option value="announcement">Announcement</option><option value="reward_event">Reward Event</option><option value="promo">Promo</option>
            </Select>
            <Input type="date" value={editing.start_date} onChange={(e: any) => setEditing({ ...editing, start_date: e.target.value })} />
            <Input type="date" value={editing.end_date} onChange={(e: any) => setEditing({ ...editing, end_date: e.target.value })} />
            <Input type="number" value={editing.xp_bonus} onChange={(e: any) => setEditing({ ...editing, xp_bonus: Number(e.target.value) })} placeholder="XP Bonus" />
            <Input type="number" step="0.1" value={editing.cashback_multiplier} onChange={(e: any) => setEditing({ ...editing, cashback_multiplier: Number(e.target.value) })} placeholder="Cashback multiplier" />
            <div className="sm:col-span-2">
              <TextArea value={editing.description} onChange={(e: any) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[#2dae50]" />
              <span className="font-['Inter',sans-serif] text-[12px] text-[#c8ccd4]">Active</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={save} disabled={!editing.title}><Save className="h-4 w-4" />Save</Btn>
            <Btn variant="secondary" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Btn>
          </div>
        </Card>
      )}
      <div className="flex flex-col gap-2">
        {(events.data ?? []).map((ev) => (
          <Card key={ev.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#c8ccd4]">{ev.title}</span>
                  <Badge variant={ev.active ? "green" : "red"}>{ev.active ? "Active" : "Inactive"}</Badge>
                  <Badge variant="gray">{ev.event_type}</Badge>
                </div>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a] mt-0.5">{ev.description}</p>
                <p className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c] mt-0.5">{ev.start_date} → {ev.end_date} · XP +{ev.xp_bonus} · ×{ev.cashback_multiplier}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Btn size="sm" variant="secondary" onClick={() => { setEditing(ev); setIsNew(false); }}><Edit3 className="h-3.5 w-3.5" /></Btn>
                <Btn size="sm" variant="danger" onClick={() => { if (confirm("Delete?")) remove.mutate(ev.id); }}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Earn Tasks Tab ───────────────────────────────────────────────────────────
function EarnTasksTab() {
  const { tasks, create, update, remove } = useAdminEarnTasks();
  const [editing, setEditing] = useState<Partial<AdminEarnTask> | null>(null);
  const empty: Partial<AdminEarnTask> = { title: "", description: "", type: "onchain", category: "swap_volume", target_value: 0, target_count: 1, xp_reward: 0, cashback_reward: 0, icon: "", verification_url: "", sort_order: 0, active: true };

  const save = () => {
    if (!editing) return;
    const p = { title: editing.title ?? "", description: editing.description ?? "", type: editing.type ?? "onchain", category: editing.category ?? "swap_volume", target_value: Number(editing.target_value ?? 0), target_count: Number(editing.target_count ?? 1), xp_reward: Number(editing.xp_reward ?? 0), cashback_reward: Number(editing.cashback_reward ?? 0), icon: editing.icon ?? "", verification_url: editing.verification_url ?? "", sort_order: Number(editing.sort_order ?? 0), active: editing.active ?? true };
    if (editing.id) update.mutate({ id: editing.id, ...p }); else create.mutate(p as Omit<AdminEarnTask, "id">);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Earn Tasks" description="Tasks users complete to earn XP and cashback"
        action={<Btn size="sm" onClick={() => setEditing({ ...empty })}><Plus className="h-3.5 w-3.5" />New Task</Btn>} />
      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#d0d2d6] mb-3">{editing.id ? "Edit Task" : "New Task"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Title" value={editing.title ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, title: e.target.value }))} />
            <Input placeholder="Category" value={editing.category ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, category: e.target.value }))} />
            <Select value={editing.type ?? "onchain"} onChange={(e: any) => setEditing((p) => ({ ...p!, type: e.target.value }))} className="w-full">
              <option value="onchain">On-chain</option><option value="offchain">Off-chain</option>
            </Select>
            <Input placeholder="Icon (emoji)" value={editing.icon ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, icon: e.target.value }))} />
            <Input type="number" placeholder="Target Value (USD)" value={editing.target_value ?? 0} onChange={(e: any) => setEditing((p) => ({ ...p!, target_value: Number(e.target.value) }))} />
            <Input type="number" placeholder="Target Count" value={editing.target_count ?? 1} onChange={(e: any) => setEditing((p) => ({ ...p!, target_count: Number(e.target.value) }))} />
            <Input type="number" placeholder="XP Reward" value={editing.xp_reward ?? 0} onChange={(e: any) => setEditing((p) => ({ ...p!, xp_reward: Number(e.target.value) }))} />
            <Input type="number" placeholder="Cashback %" value={editing.cashback_reward ?? 0} onChange={(e: any) => setEditing((p) => ({ ...p!, cashback_reward: Number(e.target.value) }))} />
            <Input type="number" placeholder="Sort Order" value={editing.sort_order ?? 0} onChange={(e: any) => setEditing((p) => ({ ...p!, sort_order: Number(e.target.value) }))} />
            <Input placeholder="Verification URL" value={editing.verification_url ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, verification_url: e.target.value }))} />
          </div>
          <TextArea className="mt-3" rows={2} placeholder="Description" value={editing.description ?? ""} onChange={(e: any) => setEditing((p) => ({ ...p!, description: e.target.value }))} />
          <div className="flex items-center gap-2 mt-3">
            <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing((p) => ({ ...p!, active: e.target.checked }))} className="h-4 w-4 accent-[#2dae50]" />
            <span className="font-['Inter',sans-serif] text-[12px] text-[#c8ccd4]">Active</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn onClick={save} disabled={!editing.title}><Save className="h-4 w-4" />Save</Btn>
            <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
          </div>
        </Card>
      )}
      <div className="flex flex-col gap-2">
        {(tasks.data ?? []).map((t) => (
          <Card key={t.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[18px] shrink-0">{t.icon || "🎯"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#c8ccd4]">{t.title}</span>
                  <Badge variant={t.active ? "green" : "red"}>{t.active ? "Active" : "Inactive"}</Badge>
                  <Badge variant="gray">{t.type}</Badge>
                </div>
                <p className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] truncate">{t.description}</p>
                <div className="flex gap-3 mt-0.5">
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c]">XP: <span className="text-[#3acd5b]">{t.xp_reward}</span></span>
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c]">CB: <span className="text-[#3acd5b]">{t.cashback_reward}%</span></span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Btn size="sm" variant="secondary" onClick={() => setEditing(t)}><Edit3 className="h-3.5 w-3.5" /></Btn>
                <Btn size="sm" variant="danger" onClick={() => remove.mutate(t.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Social Links Tab ─────────────────────────────────────────────────────────
function SocialTab() {
  const { links, save, remove } = useAdminSocial();
  const [editing, setEditing] = useState<Partial<CmsSocialLink> & { platform: string; url: string } | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Social Links" description="Platform links displayed in the app footer and social sections"
        action={<Btn size="sm" onClick={() => setEditing({ platform: "", url: "", icon: "", active: true, sort_order: 0 })}><Plus className="h-3.5 w-3.5" />Add</Btn>} />
      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <div className="flex flex-col gap-3">
            <Input value={editing.platform} onChange={(e: any) => setEditing({ ...editing, platform: e.target.value })} placeholder="Platform (twitter, discord, telegram...)" />
            <Input value={editing.url} onChange={(e: any) => setEditing({ ...editing, url: e.target.value })} placeholder="URL" />
            <Input value={editing.icon ?? ""} onChange={(e: any) => setEditing({ ...editing, icon: e.target.value })} placeholder="Icon URL (optional)" />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[#2dae50]" />
              <span className="font-['Inter',sans-serif] text-[12px] text-[#c8ccd4]">Active</span>
            </div>
            <div className="flex gap-2">
              <Btn onClick={() => { save.mutate(editing); setEditing(null); }} disabled={!editing.platform || !editing.url}><Save className="h-4 w-4" />Save</Btn>
              <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}
      <div className="flex flex-col gap-2">
        {(links.data ?? []).map((l) => (
          <Card key={l.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#c8ccd4] capitalize">{l.platform}</span>
                  <Badge variant={l.active ? "green" : "red"}>{l.active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a] truncate">{l.url}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Btn size="sm" variant="secondary" onClick={() => setEditing(l)}><Edit3 className="h-3.5 w-3.5" /></Btn>
                <Btn size="sm" variant="danger" onClick={() => { if (confirm("Delete?")) remove.mutate(l.id); }}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── AI Builder Tab ───────────────────────────────────────────────────────────
interface AiMessage { role: "user" | "assistant"; content: string; actions?: string[] }

function AiBuilderTab() {
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "assistant", content: "Hi! I'm your AI assistant for SuperSwap. I can help you change site settings, create announcements, manage popular tokens, and more.\n\nJust tell me what you want to change in plain English. For example:\n• \"Change the hero title to TRADE. EARN. WIN.\"\n• \"Create an announcement about the upcoming TGE\"\n• \"Add BRETT as a popular token\"" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: AiMessage = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") ?? "";
      const res = await fetch("/api/admin/ai-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.response || "Done!", actions: data.actions }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Error connecting to AI. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <SectionHeader title="AI Builder" description="Make changes to your website using plain English" />

      <Card className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 400 }}>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: 480 }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-[14px] px-4 py-3 ${m.role === "user" ? "bg-[#0e3a1e] border border-[#1a5c2a]" : "bg-[#071020] border border-[#131b27]"}`}>
                {m.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bot className="h-3.5 w-3.5 text-[#3acd5b]" />
                    <span className="font-['Inter',sans-serif] text-[10px] font-bold text-[#3acd5b] uppercase tracking-wide">AI Assistant</span>
                  </div>
                )}
                <p className="font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] whitespace-pre-wrap leading-[1.6]">{m.content}</p>
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {m.actions.map((a, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3 text-[#3acd5b]" />
                        <span className="font-['Inter',sans-serif] text-[11px] text-[#3acd5b]">{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-[14px] bg-[#071020] border border-[#131b27] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 text-[#3acd5b]" />
                  <span className="font-['Inter',sans-serif] text-[12px] text-[#6c778a]">Thinking...</span>
                  <div className="flex gap-1">
                    {[0,1,2].map((i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#3acd5b] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-[#0f1e2e] p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder='e.g. "Change the hero title to SWAP. EARN. WIN."'
              className="flex-1 rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none placeholder:text-[#3a4a5c] focus:border-[#2dae50] transition-colors"
              disabled={loading}
            />
            <Btn onClick={send} disabled={!input.trim() || loading}>
              <ArrowUpRight className="h-4 w-4" />Send
            </Btn>
          </div>
          <p className="mt-1.5 font-['Inter',sans-serif] text-[11px] text-[#3a4a5c]">Requires OPENAI_API_KEY in Secrets · Press Enter to send</p>
        </div>
      </Card>
    </div>
  );
}

// ─── Database Tab ─────────────────────────────────────────────────────────────
function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function downloadCSV(filename: string, headers: string[], rows: Record<string, unknown>[]) {
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function DatabaseTab() {
  const { tables, rows } = useAdminDatabase();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;
  const tableData = selectedTable ? rows(selectedTable, page, PAGE_SIZE) : null;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Database Explorer" description="Browse raw data from all tables"
        action={selectedTable && tableData?.data ? (
          <Btn size="sm" onClick={() => { const r = tableData.data!.rows; if (!r.length) return; downloadCSV(`${selectedTable}.csv`, Object.keys(r[0]), r); }}>
            <Download className="h-3.5 w-3.5" />Export CSV
          </Btn>
        ) : undefined} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {(tables.data ?? []).map((t) => (
          <button key={t.table} onClick={() => { setSelectedTable(t.table); setPage(0); }}
            className={`flex flex-col items-start rounded-[12px] border px-3 py-2.5 text-left transition-all ${selectedTable === t.table ? "border-[#1a5c2a] bg-[#0e3a1e]" : "border-[#0f1e2e] bg-[#00040e] hover:border-[#1a2535]"}`}>
            <span className="font-['Inter',sans-serif] text-[12px] font-semibold text-[#c8ccd4] capitalize">{t.table.replace(/_/g, " ")}</span>
            <span className="font-['Inter',sans-serif] text-[11px] text-[#6c778a]">{t.count.toLocaleString()} rows</span>
          </button>
        ))}
      </div>
      {selectedTable && tableData && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a]">{tableData.data ? `${tableData.data.rows.length} of ~${tables.data?.find((t) => t.table === selectedTable)?.count.toLocaleString()} rows` : "Loading..."}</p>
            <div className="flex items-center gap-2">
              <Btn size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft className="h-3.5 w-3.5" />Prev</Btn>
              <span className="font-['Inter',sans-serif] text-[12px] text-[#6c778a]">p.{page + 1}</span>
              <Btn size="sm" variant="secondary" disabled={!tableData.data || tableData.data.rows.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>Next<ChevronRight className="h-3.5 w-3.5" /></Btn>
            </div>
          </div>
          {tableData.isLoading ? <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">Loading...</p>
            : tableData.data && tableData.data.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-[12px] border border-[#0f1e2e]">
                <table className="w-full text-left">
                  <thead className="bg-[#071020]">
                    <tr>{Object.keys(tableData.data.rows[0]).map((h) => <th key={h} className="px-3 py-2 font-['Inter',sans-serif] text-[10px] font-semibold text-[#6c778a] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {tableData.data.rows.map((row, i) => (
                      <tr key={i} className="border-t border-[#0a1420] hover:bg-[#071020]/50">
                        {Object.values(row).map((cell, j) => <td key={j} className="px-3 py-2 font-['Inter',sans-serif] text-[12px] text-[#c8ccd4] whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis">{cell === null || cell === undefined ? "—" : String(cell).slice(0, 80)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">No rows.</p>}
        </div>
      )}
    </div>
  );
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
type TabKey = "dashboard" | "settings" | "blocks" | "tokens" | "announcements" | "events" | "tasks" | "social" | "ai" | "database";

const NAV_ITEMS: { key: TabKey; label: string; icon: JSX.Element; group?: string }[] = [
  { key: "dashboard",    label: "Dashboard",       icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "settings",     label: "Site Settings",   icon: <Settings className="h-4 w-4" />,      group: "Content" },
  { key: "blocks",       label: "Page Blocks",     icon: <Layers className="h-4 w-4" />,         group: "Content" },
  { key: "tokens",       label: "Popular Tokens",  icon: <Coins className="h-4 w-4" />,          group: "Swap" },
  { key: "announcements",label: "Announcements",   icon: <Megaphone className="h-4 w-4" />,      group: "Community" },
  { key: "events",       label: "Events & Promos", icon: <Calendar className="h-4 w-4" />,       group: "Community" },
  { key: "tasks",        label: "Earn Tasks",      icon: <Zap className="h-4 w-4" />,            group: "Community" },
  { key: "social",       label: "Social Links",    icon: <Link2 className="h-4 w-4" />,          group: "Community" },
  { key: "ai",           label: "AI Builder",      icon: <Bot className="h-4 w-4" />,            group: "Tools" },
  { key: "database",     label: "Database",        icon: <Database className="h-4 w-4" />,       group: "Tools" },
];

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export function AdminPage(): JSX.Element {
  const auth = useAdminAuth();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!auth.isLoggedIn) return <LoginScreen onLogin={auth.login} />;

  const groups = ["", "Content", "Swap", "Community", "Tools"];
  const currentItem = NAV_ITEMS.find((n) => n.key === tab);

  const renderContent = () => {
    switch (tab) {
      case "dashboard":     return <DashboardTab />;
      case "settings":      return <SiteSettingsTab />;
      case "blocks":        return <PageBlocksTab />;
      case "tokens":        return <PopularTokensTab />;
      case "announcements": return <AnnouncementsTab />;
      case "events":        return <EventsTab />;
      case "tasks":         return <EarnTasksTab />;
      case "social":        return <SocialTab />;
      case "ai":            return <AiBuilderTab />;
      case "database":      return <DatabaseTab />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020b1c]">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[230px] flex-col border-r border-[#0f1e2e] bg-[#00040e] transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex h-[60px] items-center gap-2.5 border-b border-[#0f1e2e] px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0e3a1e] border border-[#1a5c2a] shrink-0">
            <Shield className="h-4 w-4 text-[#3acd5b]" />
          </div>
          <div>
            <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#d0d2d6] leading-none">SuperSwap</p>
            <p className="font-['Inter',sans-serif] text-[10px] text-[#3acd5b] leading-none mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 py-3">
          {groups.map((group) => {
            const items = NAV_ITEMS.filter((n) => (n.group ?? "") === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mb-3">
                {group && <p className="px-2 mb-1 font-['Inter',sans-serif] text-[10px] font-semibold text-[#3a4a5c] uppercase tracking-widest">{group}</p>}
                {items.map((item) => (
                  <button key={item.key} onClick={() => { setTab(item.key); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-all font-['Inter',sans-serif] text-[13px] ${tab === item.key ? "bg-[#0e3a1e] text-[#3acd5b] border border-[#1a5c2a]" : "text-[#6c778a] hover:bg-[#071020] hover:text-[#c8ccd4] border border-transparent"}`}>
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-[#0f1e2e] p-3">
          <button onClick={auth.logout} className="w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 font-['Inter',sans-serif] text-[13px] text-[#6c778a] hover:bg-[#3a0e0e] hover:text-[#c9543a] transition-all border border-transparent">
            <Lock className="h-4 w-4" />Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-[60px] items-center justify-between border-b border-[#0f1e2e] bg-[#00040e]/80 px-4 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#6c778a] hover:text-[#c8ccd4] transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="font-['Inter',sans-serif] text-[15px] font-bold text-[#d0d2d6] leading-none">{currentItem?.label}</p>
              {currentItem?.group && <p className="font-['Inter',sans-serif] text-[11px] text-[#3a4a5c] leading-none mt-0.5">{currentItem.group}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="green"><CheckCircle className="h-3 w-3 mr-1" />Live</Badge>
            <a href="/" target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 rounded-[8px] border border-[#131b27] bg-[#071020] px-2.5 py-1.5 font-['Inter',sans-serif] text-[12px] text-[#6c778a] hover:text-[#c8ccd4] transition-all">
              <Globe className="h-3.5 w-3.5" />View Site
            </a>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mx-auto max-w-[900px]">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
