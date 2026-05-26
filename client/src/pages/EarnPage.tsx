import { useState } from "react";
import { useWalletContext } from "@/context/WalletContext";
import { useEarnTasks, useCompleteEarnTask } from "@/hooks/useRewards";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import {
  ArrowUpRight,
  Zap,
  Globe,
  CheckCircle2,
  Circle,
  ExternalLink,
  Twitter,
  MessageCircle,
  Heart,
  Users,
  Share2,
  Star,
  Flame,
  Anchor,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────
function shortWallet(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

const categoryIcons: Record<string, any> = {
  onchain: Zap,
  offchain: Globe,
};

const taskIcons: Record<string, any> = {
  swap: ArrowUpRight,
  retweet: Share2,
  like: Heart,
  follow: Twitter,
  join_tg: MessageCircle,
  join_discord: Users,
  post: Flame,
  comment: MessageCircle,
  watch: Star,
  invite: Users,
  default: Circle,
};

const onchainGlow = "#22d3ee";
const offchainGlow = "#8b5cf6";

// ─── Connect Prompt ─────────────────────────────────────────────────────────
function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#182332] bg-[#08111d]">
        <img
          src="/figmaAssets/image-30.png"
          alt="wallet"
          className="h-10 w-10 opacity-70"
        />
      </div>

      <div className="text-center">
        <h2 className="text-[22px] font-black text-white">
          Connect Your Wallet
        </h2>
        <p className="mt-2 text-[14px] text-[#8b97aa]">
          Connect to view and complete earn tasks
        </p>
      </div>

      <button
        onClick={onConnect}
        className="rounded-[18px] bg-gradient-to-r from-[#22d3ee] to-[#2dae50] px-7 py-3 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(45,174,80,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Connect Wallet
      </button>
    </div>
  );
}

// ─── Task Card ──────────────────────────────────────────────────────────────
function TaskCard({ task, onClaim }: { task: any; onClaim: () => void }) {
  const glow = task.category === "onchain" ? onchainGlow : offchainGlow;

  const Icon = taskIcons[task.task_type] ?? taskIcons.default;

  const hasCashback = Number(task.cashback_reward) > 0;

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[#182332] bg-[#060d17] p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-[2px]">
      <div
        className="absolute right-[-20px] top-[-20px] h-[90px] w-[90px] rounded-full blur-[60px]"
        style={{ background: `${glow}22` }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border text-[20px]"
              style={{
                background: `${glow}15`,
                borderColor: `${glow}55`,
              }}
            >
              <Icon className="h-5 w-5" style={{ color: glow }} />
            </div>

            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-white">
                {task.title}
              </h3>

              <p className="mt-1 text-[13px] leading-relaxed text-[#8c98aa]">
                {task.description}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="rounded-full border border-[#1d3428] bg-[#0b1811] px-3 py-1 text-[11px] font-bold text-[#3acd5b]">
              +{task.xp_reward} XP
            </div>

            {hasCashback && (
              <div className="rounded-full border border-[#1a2e35] bg-[#0b1418] px-3 py-1 text-[11px] font-bold text-[#22d3ee]">
                +${Number(task.cashback_reward).toFixed(2)} CB
              </div>
            )}
          </div>
        </div>

        {/* Action / Claim */}
        <div className="mt-4 flex items-center gap-3">
          {task.action_url && !task.completed && (
            <a
              href={task.action_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#1a2535] bg-[#0b1420] px-4 py-2.5 text-[13px] font-semibold text-[#a0aab8] transition-all hover:border-[#2dae50] hover:text-white"
              data-testid={`link-task-${task.id}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {task.action_label || "Go"}
            </a>
          )}

          {!task.completed ? (
            <button
              onClick={onClaim}
              className="flex-1 rounded-[15px] bg-gradient-to-r from-[#22d3ee] to-[#2dae50] px-4 py-3 text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(45,174,80,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              data-testid={`button-claim-task-${task.id}`}
            >
              Complete & Claim
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-[15px] border border-[#1a3522] bg-[#0b1810] py-3 text-[13px] font-bold text-[#3acd5b]">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function EarnPage(): JSX.Element {
  const wallet = useWalletContext();

  const [walletOpen, setWalletOpen] = useState(false);

  // PERMANENT POPUP
  const [showPopup] = useState(true);

  const [activeCategory, setActiveCategory] = useState<
    "onchain" | "offchain"
  >("onchain");

  const addr = wallet.isConnected ? wallet.address : null;

  const { data: tasks, isLoading } = useEarnTasks(addr);

  const complete = useCompleteEarnTask(addr || "");

  const filtered =
    tasks?.filter((t) => t.category === activeCategory) ?? [];

  const completedCount = filtered.filter((t) => t.completed).length;

  const totalXP = filtered.reduce(
    (sum, t) => sum + (t.completed ? t.xp_reward : 0),
    0
  );

  return (
    <>
      {/* ─── FORCED POPUP ───────────────────────────────────── */}
      {showPopup && (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="relative w-[95%] max-w-[520px]">
            <img
              src="https://i.ibb.co/0VCbbhc8/Chat-GPT-Image-May-26-2026-09-28-27-PM.png"
              alt="popup"
              className="w-full rounded-2xl object-cover shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>
      )}

      {/* ─── PAGE CONTENT ─────────────────────────────────── */}
      <div className="w-full px-[14px] pb-[20px] pt-[12px] sm:px-[18px]">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-black text-white">Earn</h1>

            <p className="mt-1 text-[13px] text-[#6f7b8e]">
              Complete tasks to earn XP & cashback
            </p>
          </div>

          {wallet.isConnected && addr && (
            <div className="text-right">
              <p className="text-[13px] font-semibold text-[#3acd5b]">
                {shortWallet(addr)}
              </p>

              <p className="mt-1 text-[11px] text-[#7f8b9d]">
                Base Mainnet
              </p>
            </div>
          )}
        </div>

        {!wallet.isConnected && (
          <ConnectPrompt onConnect={() => setWalletOpen(true)} />
        )}

        {isLoading && addr && (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-[80px] rounded-[24px] bg-[#101827]" />

            <div className="grid grid-cols-2 gap-3">
              <div className="h-[140px] rounded-[22px] bg-[#101827]" />
              <div className="h-[140px] rounded-[22px] bg-[#101827]" />
              <div className="h-[140px] rounded-[22px] bg-[#101827]" />
              <div className="h-[140px] rounded-[22px] bg-[#101827]" />
            </div>
          </div>
        )}

        {wallet.isConnected && tasks && (
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Stats */}
            <div className="relative overflow-hidden rounded-[22px] border border-[#1b2432] bg-gradient-to-br from-[#071321] via-[#08111d] to-[#02050b] p-4 sm:p-5 backdrop-blur-xl">
              <div className="absolute left-[-40px] top-[-40px] h-[140px] w-[140px] rounded-full bg-cyan-400/10 blur-[80px]" />

              <div className="absolute bottom-[-60px] right-[-50px] h-[180px] w-[180px] rounded-full bg-emerald-500/10 blur-[90px]" />

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#6f7b8e]">
                    {activeCategory} Tasks
                  </p>

                  <p className="mt-1 text-[26px] font-black text-white">
                    {completedCount}

                    <span className="text-[16px] font-bold text-[#7f8b9d]">
                      {" "}
                      / {filtered.length}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#6f7b8e]">
                    XP Earned
                  </p>

                  <p className="mt-1 text-[26px] font-black text-[#3acd5b]">
                    +{totalXP}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 rounded-[16px] border border-[#182332] bg-[#060d17] p-1.5">
              {(["onchain", "offchain"] as const).map((cat) => {
                const isActive = activeCategory === cat;

                const CatIcon = categoryIcons[cat];

                const glow =
                  cat === "onchain" ? onchainGlow : offchainGlow;

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-[12px] py-2.5 text-[13px] font-semibold transition-all ${
                      isActive
                        ? "text-white"
                        : "text-[#6f7b8e] hover:text-[#a0aab8]"
                    }`}
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(135deg, ${glow}22, transparent)`,
                            boxShadow: `inset 0 0 20px ${glow}15`,
                            border: `1px solid ${glow}44`,
                          }
                        : {}
                    }
                  >
                    <CatIcon
                      className="h-4 w-4"
                      style={{
                        color: isActive ? glow : "#6f7b8e",
                      }}
                    />

                    {cat === "onchain"
                      ? "Onchain"
                      : "Offchain"}
                  </button>
                );
              })}
            </div>

            {/* Tasks */}
            <div className="grid gap-3">
              {filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClaim={() => complete.mutate(task.id)}
                />
              ))}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[22px] border border-[#182332] bg-[#060d17] py-14">
                  <Anchor className="h-10 w-10 text-[#4a5568]" />

                  <p className="text-[14px] text-[#6f7b8e]">
                    No tasks available in this category
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Wallet Modal */}
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