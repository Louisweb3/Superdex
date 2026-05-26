import { useState } from "react";
import {
  useAdminAuth,
  useAdminSettings,
  useAdminBlocks,
  useAdminEvents,
  useAdminSocial,
  useAdminDatabase,
  type PageBlock,
  type CmsEvent,
  type CmsSocialLink,
} from "@/hooks/useAdmin";
import { Shield, Settings, FileText, Calendar, Link2, Save, Trash2, Plus, ChevronDown, Eye, Lock, CheckCircle, AlertCircle, Database, Download, ChevronLeft, ChevronRight, Coins } from "lucide-react";
import { useAdminEarnTasks } from "@/hooks/useAdmin";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PAGES = ["home", "swap", "rewards", "vault", "analytics"];
const SECTIONS: Record<string, string[]> = {
  home:      ["hero", "overview", "dex_highlights", "token_promo"],
  swap:      ["swap_widget", "market_chart", "popular_tokens"],
  rewards:   ["xp_progress", "quests", "history", "leaderboard"],
  vault:     ["stats", "pools", "info"],
  analytics: ["overview", "charts"],
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[18px] border border-[#131b27] bg-[#00040e] ${className}`}>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", className = "" }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none placeholder:text-[#4a5568] focus:border-[#2dae50] transition-colors ${className}`}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: any) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none placeholder:text-[#4a5568] focus:border-[#2dae50] transition-colors resize-y"
    />
  );
}

function Button({ onClick, children, variant = "primary", disabled = false, className = "" }: any) {
  const base = "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2 font-['Inter',sans-serif] text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-[#0e3a1e] text-[#3acd5b] border border-[#1a5c2a] hover:bg-[#143e22]"
      : variant === "danger"
      ? "bg-[#3a0e0e] text-[#c9543a] border border-[#5c1a1a] hover:bg-[#4a1212]"
      : variant === "secondary"
      ? "bg-[#071020] text-[#6c778a] border border-[#131b27] hover:bg-[#0a1625]"
      : "bg-transparent text-[#6c778a] border border-[#131b27] hover:bg-[#071020]";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (pwd: string) => Promise<void> }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await onLogin(pwd);
    } catch {
      setErr("Wrong password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#020b1c] px-4">
      <Card className="w-full max-w-[400px] px-6 py-8 sm:px-8 sm:py-10">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0e3a1e] border border-[#1a5c2a]">
            <Shield className="h-7 w-7 text-[#3acd5b]" />
          </div>
        </div>
        <h1 className="mb-2 text-center font-['Inter',sans-serif] text-[20px] font-bold text-[#d0d2d6]">
          Admin Panel
        </h1>
        <p className="mb-6 text-center font-['Inter',sans-serif] text-[13px] text-[#6c778a]">
          Enter password to access the dashboard
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input
            type="password"
            value={pwd}
            onChange={(e: any) => setPwd(e.target.value)}
            placeholder="Password"
          />
          {err && (
            <p className="flex items-center gap-1.5 font-['Inter',sans-serif] text-[12px] text-[#c9543a]">
              <AlertCircle className="h-3 w-3" /> {err}
            </p>
          )}
          <Button disabled={loading || !pwd} className="w-full py-2.5">
            {loading ? "Checking..." : "Enter Dashboard"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────────────────────────
function SettingsTab() {
  const { settings, update } = useAdminSettings();
  const data = settings.data ?? {};
  const [local, setLocal] = useState<Record<string, string>>({});

  const handleSave = (key: string) => {
    update.mutate({ key, value: local[key] ?? data[key] ?? "" });
  };

  const predefined = [
    { key: "total_rewards_paid", label: "Total Rewards Paid", placeholder: "$2,481,092", desc: "Shown on homepage overview" },
    { key: "hero_title_line1", label: "Hero Title Line 1", placeholder: "SWAP.", desc: "Homepage hero heading" },
    { key: "hero_title_line2", label: "Hero Title Line 2", placeholder: "EARN.", desc: "Homepage hero heading" },
    { key: "hero_title_line3", label: "Hero Title Line 3", placeholder: "REPEAT.", desc: "Homepage hero heading" },
    { key: "hero_subtitle", label: "Hero Subtitle", placeholder: "The DEX on Base that rewards you every time you trade.", desc: "Homepage hero description" },
    { key: "site_tagline", label: "Site Tagline", placeholder: "REWARD-FIRST DEX", desc: "Badge on homepage" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-['Inter',sans-serif] text-[16px] font-bold text-[#d0d2d6]">Site Settings</h2>
      {predefined.map((s) => (
        <Card key={s.key} className="px-4 py-4">
          <div className="mb-2">
            <p className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#c8ccd4]">{s.label}</p>
            <p className="font-['Inter',sans-serif] text-[11px] text-[#6c778a]">{s.desc}</p>
          </div>
          <div className="flex gap-2">
            <Input
              value={local[s.key] ?? data[s.key] ?? ""}
              onChange={(e: any) => setLocal((p) => ({ ...p, [s.key]: e.target.value }))}
              placeholder={s.placeholder}
            />
            <Button onClick={() => handleSave(s.key)} disabled={update.isPending}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Page Editor Tab ───────────────────────────────────────────────────────────────────────────────────────────
function PageEditorTab() {
  const [selPage, setSelPage] = useState("home");
  const [selSection, setSelSection] = useState("hero");
  const { blocks, saveBlock, deleteBlock } = useAdminBlocks(selPage);
  const [editing, setEditing] = useState<PageBlock | null>(null);
  const [newBlock, setNewBlock] = useState(false);

  const filtered = (blocks.data ?? []).filter((b) => b.section === selSection);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-['Inter',sans-serif] text-[16px] font-bold text-[#d0d2d6]">Page Editor</h2>

      {/* Page / Section selector */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-['Inter',sans-serif] text-[11px] font-medium text-[#6c778a] uppercase">Page</label>
          <select
            value={selPage}
            onChange={(e) => {
              setSelPage(e.target.value);
              setSelSection(SECTIONS[e.target.value]?.[0] ?? "");
            }}
            className="rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none"
          >
            {PAGES.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-['Inter',sans-serif] text-[11px] font-medium text-[#6c778a] uppercase">Section</label>
          <select
            value={selSection}
            onChange={(e) => setSelSection(e.target.value)}
            className="rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none"
          >
            {(SECTIONS[selPage] ?? []).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add new block */}
      <Button
        onClick={() => {
          setNewBlock(true);
          setEditing({ id: "", page: selPage, section: selSection, block_key: "", content_type: "text", value: "", sort_order: 0 });
        }}
        variant="secondary"
        className="w-fit"
      >
        <Plus className="h-4 w-4" /> Add Block
      </Button>

      {/* Blocks list */}
      <div className="flex flex-col gap-3">
        {filtered.map((block) => (
          <Card key={block.id} className="px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#c8ccd4]">
                  {block.block_key}
                </p>
                <span className="inline-block rounded-[6px] bg-[#071020] px-2 py-0.5 font-['Inter',sans-serif] text-[10px] text-[#6c778a] mt-1">
                  {block.content_type}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => { setEditing(block); setNewBlock(false); }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm("Delete this block?")) deleteBlock.mutate(block.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {block.content_type === "image" ? (
              <img src={block.value} alt={block.block_key} className="max-h-[120px] rounded-[8px] object-contain" />
            ) : (
              <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a] line-clamp-3">{block.value}</p>
            )}
          </Card>
        ))}
        {filtered.length === 0 && !newBlock && (
          <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">No blocks in this section yet.</p>
        )}
      </div>

      {/* Edit / Add modal panel */}
      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <h3 className="mb-3 font-['Inter',sans-serif] text-[14px] font-bold text-[#d0d2d6]">
            {newBlock ? "Add New Block" : "Edit Block"}
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Block Key (ID)</label>
              <Input
                value={editing.block_key}
                onChange={(e: any) => setEditing({ ...editing, block_key: e.target.value })}
                placeholder="e.g. title, subtitle, image_url"
              />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Content Type</label>
              <select
                value={editing.content_type}
                onChange={(e) => setEditing({ ...editing, content_type: e.target.value })}
                className="w-full rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none"
              >
                <option value="text">Text</option>
                <option value="image">Image URL</option>
                <option value="html">HTML</option>
              </select>
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Value</label>
              {editing.content_type === "text" || editing.content_type === "html" ? (
                <TextArea
                  value={editing.value}
                  onChange={(e: any) => setEditing({ ...editing, value: e.target.value })}
                  placeholder={editing.content_type === "html" ? "<p>HTML content</p>" : "Text content"}
                  rows={4}
                />
              ) : (
                <Input
                  value={editing.value}
                  onChange={(e: any) => setEditing({ ...editing, value: e.target.value })}
                  placeholder="https://example.com/image.png"
                />
              )}
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Sort Order</label>
              <Input
                type="number"
                value={editing.sort_order}
                onChange={(e: any) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  saveBlock.mutate(editing);
                  setEditing(null);
                  setNewBlock(false);
                }}
                disabled={!editing.block_key || editing.value === undefined}
              >
                <Save className="h-4 w-4" /> {newBlock ? "Create Block" : "Update Block"}
              </Button>
              <Button variant="secondary" onClick={() => { setEditing(null); setNewBlock(false); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Events Tab ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function EventsTab() {
  const { events, create, update, remove } = useAdminEvents();
  const [editing, setEditing] = useState<CmsEvent | null>(null);
  const [isNew, setIsNew] = useState(false);

  const blank = (): CmsEvent => ({
    id: "", title: "", description: "", event_type: "announcement",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    active: true, xp_bonus: 0, cashback_multiplier: 1,
  });

  const save = () => {
    if (!editing) return;
    if (isNew) {
      create.mutate(editing);
    } else {
      update.mutate(editing);
    }
    setEditing(null);
    setIsNew(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-['Inter',sans-serif] text-[16px] font-bold text-[#d0d2d6]">Events & Announcements</h2>
        <Button
          variant="secondary"
          onClick={() => { setEditing(blank()); setIsNew(true); }}
        >
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {(events.data ?? []).map((ev) => (
        <Card key={ev.id} className="px-4 py-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-[6px] px-2 py-0.5 font-['Inter',sans-serif] text-[10px] font-bold ${ev.active ? "bg-[#0e3a1e] text-[#3acd5b]" : "bg-[#3a0e0e] text-[#c9543a]"}`}>
                  {ev.active ? "Active" : "Inactive"}
                </span>
                <span className="font-['Inter',sans-serif] text-[11px] text-[#6c778a]">{ev.event_type}</span>
              </div>
              <p className="mt-1 font-['Inter',sans-serif] text-[14px] font-semibold text-[#c8ccd4]">{ev.title}</p>
              <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a]">{ev.description}</p>
              <p className="mt-1 font-['Inter',sans-serif] text-[11px] text-[#5f6a7c]">
                {ev.start_date} → {ev.end_date} · XP bonus: {ev.xp_bonus} · Cashback x{ev.cashback_multiplier}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" onClick={() => { setEditing(ev); setIsNew(false); }}>Edit</Button>
              <Button variant="danger" onClick={() => { if (confirm("Delete?")) remove.mutate(ev.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <h3 className="mb-3 font-['Inter',sans-serif] text-[14px] font-bold text-[#d0d2d6]">{isNew ? "New Event" : "Edit Event"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Title</label>
              <Input value={editing.title} onChange={(e: any) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Type</label>
              <select
                value={editing.event_type}
                onChange={(e) => setEditing({ ...editing, event_type: e.target.value })}
                className="w-full rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none"
              >
                <option value="announcement">Announcement</option>
                <option value="reward_event">Reward Event</option>
                <option value="promo">Promo</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Description</label>
              <TextArea value={editing.description} onChange={(e: any) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Start Date</label>
              <Input type="date" value={editing.start_date} onChange={(e: any) => setEditing({ ...editing, start_date: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">End Date</label>
              <Input type="date" value={editing.end_date} onChange={(e: any) => setEditing({ ...editing, end_date: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">XP Bonus</label>
              <Input type="number" value={editing.xp_bonus} onChange={(e: any) => setEditing({ ...editing, xp_bonus: Number(e.target.value) })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Cashback Multiplier</label>
              <Input type="number" step="0.1" value={editing.cashback_multiplier} onChange={(e: any) => setEditing({ ...editing, cashback_multiplier: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4 accent-[#2dae50]"
              />
              <span className="font-['Inter',sans-serif] text-[13px] text-[#c8ccd4]">Active</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={save} disabled={!editing.title}>
              <Save className="h-4 w-4" /> Save Event
            </Button>
            <Button variant="secondary" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Social Links Tab ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function SocialTab() {
  const { links, save, remove } = useAdminSocial();
  const [editing, setEditing] = useState<Partial<CmsSocialLink> & { platform: string; url: string } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-['Inter',sans-serif] text-[16px] font-bold text-[#d0d2d6]">Social Links</h2>
        <Button
          variant="secondary"
          onClick={() => setEditing({ platform: "", url: "", icon: "", active: true, sort_order: 0 })}
        >
          <Plus className="h-4 w-4" /> Add Link
        </Button>
      </div>

      {(links.data ?? []).map((link) => (
        <Card key={link.id} className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-block rounded-[6px] px-2 py-0.5 font-['Inter',sans-serif] text-[10px] font-bold ${link.active ? "bg-[#0e3a1e] text-[#3acd5b]" : "bg-[#3a0e0e] text-[#c9543a]"}`}>
                {link.active ? "Active" : "Inactive"}
              </span>
              <p className="font-['Inter',sans-serif] text-[14px] font-semibold text-[#c8ccd4]">{link.platform}</p>
              <p className="font-['Inter',sans-serif] text-[12px] text-[#6c778a]">{link.url}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(link)}>Edit</Button>
              <Button variant="danger" onClick={() => { if (confirm("Delete?")) remove.mutate(link.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <h3 className="mb-3 font-['Inter',sans-serif] text-[14px] font-bold text-[#d0d2d6]">Edit Social Link</h3>
          <div className="flex flex-col gap-3">
            <Input value={editing.platform} onChange={(e: any) => setEditing({ ...editing, platform: e.target.value })} placeholder="Platform (twitter, discord...)" />
            <Input value={editing.url} onChange={(e: any) => setEditing({ ...editing, url: e.target.value })} placeholder="URL" />
            <Input value={editing.icon ?? ""} onChange={(e: any) => setEditing({ ...editing, icon: e.target.value })} placeholder="Icon URL (optional)" />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[#2dae50]" />
              <span className="font-['Inter',sans-serif] text-[13px] text-[#c8ccd4]">Active</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { save.mutate(editing); setEditing(null); }} disabled={!editing.platform || !editing.url}>
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Database Tab ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function downloadCSV(filename: string, headers: string[], rows: Record<string, unknown>[]) {
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function DatabaseTab() {
  const { tables, rows } = useAdminDatabase();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;

  const tableData = selectedTable ? rows(selectedTable, page, PAGE_SIZE) : null;

  if (tables.isLoading) return <p className="text-[#6c778a] font-['Inter',sans-serif] text-[13px]">Loading tables...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-['Inter',sans-serif] text-[16px] font-bold text-[#d0d2d6]">Database Explorer</h2>
        {selectedTable && tableData?.data && (
          <Button
            onClick={() => {
              const allRows = tableData.data.rows;
              if (allRows.length === 0) return;
              const headers = Object.keys(allRows[0]);
              downloadCSV(`${selectedTable}.csv`, headers, allRows);
            }}
          >
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {(tables.data ?? []).map((t) => (
          <button
            key={t.table}
            onClick={() => { setSelectedTable(t.table); setPage(0); }}
            className={`flex flex-col items-start rounded-[12px] border px-4 py-3 text-left transition-all ${
              selectedTable === t.table
                ? "border-[#1a5c2a] bg-[#0e3a1e]"
                : "border-[#131b27] bg-[#00040e] hover:border-[#1a2535]"
            }`}
          >
            <span className="font-['Inter',sans-serif] text-[12px] font-semibold text-[#c8ccd4] capitalize">
              {t.table.replace(/_/g, " ")}
            </span>
            <span className="font-['Inter',sans-serif] text-[11px] text-[#6c778a]">
              {t.count.toLocaleString()} rows
            </span>
          </button>
        ))}
      </div>

      {selectedTable && tableData && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-['Inter',sans-serif] text-[13px] text-[#c8ccd4]">
              {tableData.data
                ? `Showing ${tableData.data.rows.length} of ~${tables.data?.find((t) => t.table === selectedTable)?.count.toLocaleString() ?? 0} rows`
                : "Loading..."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">Page {page + 1}</span>
              <Button
                variant="secondary"
                disabled={!tableData.data || tableData.data.rows.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {tableData.isLoading || !tableData.data ? (
            <p className="text-[#6c778a] font-['Inter',sans-serif] text-[13px]">Loading rows...</p>
          ) : tableData.data.rows.length === 0 ? (
            <p className="text-[#6c778a] font-['Inter',sans-serif] text-[13px]">No rows in this table.</p>
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-[#131b27]">
              <table className="w-full text-left">
                <thead className="bg-[#071020]">
                  <tr>
                    {Object.keys(tableData.data.rows[0]).map((h) => (
                      <th key={h} className="px-3 py-2 font-['Inter',sans-serif] text-[11px] font-semibold text-[#6c778a] uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.data.rows.map((row, i) => (
                    <tr key={i} className="border-t border-[#0e1620] hover:bg-[#071020]/50">
                      {Object.values(row).map((cell, j) => (
                        <td key={j} className="px-3 py-2 font-['Inter',sans-serif] text-[12px] text-[#c8ccd4] whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                          {cell === null || cell === undefined ? "—" : String(cell).slice(0, 80)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Earn Tasks Tab ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
function EarnTasksTab() {
  const { tasks, create, update, remove } = useAdminEarnTasks();
  const [editing, setEditing] = useState<Partial<AdminEarnTask> & { id?: string } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "onchain" | "offchain">("all");

  const list = tasks.data ?? [];
  const filtered = categoryFilter === "all" ? list : list.filter((t) => t.category === categoryFilter);

  const empty: Partial<AdminEarnTask> = {
    title: "",
    description: "",
    category: "onchain",
    task_type: "swap",
    xp_reward: 0,
    cashback_reward: "0",
    action_url: "",
    action_label: "Go",
    active: true,
    sort_order: 0,
  };

  const save = () => {
    if (!editing?.title || !editing?.category || !editing?.task_type) return;
    if (isNew || !editing.id) {
      create.mutate(editing);
    } else {
      update.mutate(editing as any);
    }
    setEditing(null);
    setIsNew(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-['Inter',sans-serif] text-[16px] font-bold text-[#d0d2d6]">Earn Tasks</h2>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="rounded-[10px] border border-[#131b27] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none"
          >
            <option value="all">All</option>
            <option value="onchain">Onchain</option>
            <option value="offchain">Offchain</option>
          </select>
          <Button
            variant="secondary"
            onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
          >
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {filtered.map((task) => (
        <Card key={task.id} className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-['Inter',sans-serif] text-[14px] font-bold text-[#c8ccd4]">{task.title}</p>
                <span className="rounded-full border border-[#1d3428] bg-[#0b1811] px-2 py-0.5 text-[10px] font-bold text-[#3acd5b]">
                  +{task.xp_reward} XP
                </span>
                <span className="rounded-full border border-[#1a2e35] bg-[#0b1418] px-2 py-0.5 text-[10px] font-bold text-[#22d3ee]">
                  +${task.cashback_reward} CB
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${task.active ? "bg-[#0e3a1e] text-[#3acd5b] border border-[#1a5c2a]" : "bg-[#3a0e0e] text-[#c9543a] border border-[#5c1a1a]"}`}>
                  {task.active ? "Active" : "Inactive"}
                </span>
                <span className="rounded-full bg-[#071020] border border-[#131b27] px-2 py-0.5 text-[10px] font-semibold text-[#6c778a]">
                  {task.category}
                </span>
              </div>
              <p className="mt-1 font-['Inter',sans-serif] text-[12px] text-[#6c778a]">{task.description}</p>
              <p className="mt-0.5 font-['Inter',sans-serif] text-[11px] text-[#4a5568]">Type: {task.task_type} · Order: {task.sort_order} · Action: {task.action_label}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                variant="secondary"
                onClick={() => { setEditing({ ...task }); setIsNew(false); }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="danger"
                onClick={() => remove.mutate(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {filtered.length === 0 && (
        <Card className="px-4 py-8 text-center">
          <p className="font-['Inter',sans-serif] text-[13px] text-[#6c778a]">No tasks found.</p>
        </Card>
      )}

      {editing && (
        <Card className="px-4 py-4 border-[#1a5c2a]">
          <h3 className="mb-3 font-['Inter',sans-serif] text-[14px] font-bold text-[#d0d2d6]">{isNew ? "New Task" : "Edit Task"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Title</label>
              <Input value={editing.title} onChange={(e: any) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Description</label>
              <TextArea value={editing.description} onChange={(e: any) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Category</label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full rounded-[10px] border border-[#1a2535] bg-[#020816] px-3 py-2 font-['Inter',sans-serif] text-[13px] text-[#c8ccd4] outline-none"
              >
                <option value="onchain">Onchain</option>
                <option value="offchain">Offchain</option>
              </select>
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Task Type</label>
              <Input value={editing.task_type} onChange={(e: any) => setEditing({ ...editing, task_type: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">XP Reward</label>
              <Input type="number" value={editing.xp_reward} onChange={(e: any) => setEditing({ ...editing, xp_reward: Number(e.target.value) })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Cashback ($)</label>
              <Input type="number" step="0.01" value={editing.cashback_reward} onChange={(e: any) => setEditing({ ...editing, cashback_reward: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Action URL</label>
              <Input value={editing.action_url} onChange={(e: any) => setEditing({ ...editing, action_url: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Action Label</label>
              <Input value={editing.action_label} onChange={(e: any) => setEditing({ ...editing, action_label: e.target.value })} />
            </div>
            <div>
              <label className="font-['Inter',sans-serif] text-[11px] text-[#6c778a] mb-1 block">Sort Order</label>
              <Input type="number" value={editing.sort_order} onChange={(e: any) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4 accent-[#2dae50]"
              />
              <span className="font-['Inter',sans-serif] text-[13px] text-[#c8ccd4]">Active</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={save} disabled={!editing.title || !editing.category || !editing.task_type}>
              <Save className="h-4 w-4" /> Save Task
            </Button>
            <Button variant="secondary" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Main AdminPage ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
export function AdminPage(): JSX.Element {
  const auth = useAdminAuth();
  const [tab, setTab] = useState<"settings" | "pages" | "events" | "social" | "earn" | "database">("settings");

  if (!auth.isLoggedIn) {
    return <LoginScreen onLogin={auth.login} />;
  }

  const tabs = [
    { key: "settings" as const, label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { key: "pages" as const, label: "Page Editor", icon: <FileText className="h-4 w-4" /> },
    { key: "events" as const, label: "Events", icon: <Calendar className="h-4 w-4" /> },
    { key: "social" as const, label: "Social", icon: <Link2 className="h-4 w-4" /> },
    { key: "earn" as const, label: "Earn Tasks", icon: <Coins className="h-4 w-4" /> },
    { key: "database" as const, label: "Database", icon: <Database className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen w-full bg-[#020b1c]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[#0b1e24] bg-[#020816]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0e3a1e] border border-[#1a5c2a]">
              <Shield className="h-4 w-4 text-[#3acd5b]" />
            </div>
            <span className="font-['Inter',sans-serif] text-[16px] font-bold text-[#d0d2d6]">SuperSwap Admin</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-[6px] bg-[#0e3a1e] px-2 py-0.5 font-['Inter',sans-serif] text-[10px] font-bold text-[#3acd5b]">
              <CheckCircle className="h-3 w-3" /> Online
            </span>
          </div>
          <Button variant="danger" onClick={auth.logout}>
            <Lock className="h-4 w-4" /> Logout
          </Button>
        </div>

        {/* Tab bar */}
        <div className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-[10px] px-3 py-2 font-['Inter',sans-serif] text-[13px] font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-[#0e3a1e] text-[#3acd5b] border border-[#1a5c2a]"
                  : "text-[#6c778a] hover:bg-[#071020]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1200px] px-4 py-5">
        {tab === "settings" && <SettingsTab />}
        {tab === "pages" && <PageEditorTab />}
        {tab === "events" && <EventsTab />}
        {tab === "social" && <SocialTab />}
        {tab === "earn" && <EarnTasksTab />}
        {tab === "database" && <DatabaseTab />}
      </main>
    </div>
  );
}
