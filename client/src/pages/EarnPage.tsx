import { useState } from "react";
import { useWalletContext } from "@/context/WalletContext";
import { useEarnTasks, useTaskCompletions, useAnnouncements, useClaimTask } from "@/hooks/useEarn";
import { useRewardUser } from "@/hooks/useRewards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  TrendingUp,
  Twitter,
  MessageCircle,
  Heart,
  Repeat2,
  ArrowRightLeft,
  Lock,
  Unlock,
  CheckCircle2,
  Circle,
  Sparkles,
  Trophy,
  Bell,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  swap_volume: ArrowRightLeft,
  social_follow: Twitter,
  social_like: Heart,
  social_retweet: Repeat2,
  social_comment: MessageCircle,
  social_join: MessageCircle,
};

const CATEGORY_LABELS: Record<string, string> = {
  swap_volume: "On-Chain",
  social_follow: "Follow",
  social_like: "Like",
  social_retweet: "Retweet",
  social_comment: "Comment",
  social_join: "Join",
};

function CircularProgress({
  percentage,
  size = 100,
  strokeWidth = 8,
  children,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0d1b2a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2dae50"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  completion,
  onClaim,
  walletAddress,
}: {
  task: any;
  completion: any;
  onClaim: (taskId: string) => void;
  walletAddress: string | undefined;
}) {
  const isCompleted = completion?.completed ?? false;
  const isClaimed = completion?.claimed ?? false;
  const progress = isCompleted ? 100 : Math.min((completion?.progress ?? 0) / (task.target_value || task.target_count || 1) * 100, 99);
  const Icon = CATEGORY_ICONS[task.category] ?? Zap;
  const canClaim = isCompleted && !isClaimed;

  return (
    <div
      className={`relative overflow-hidden rounded-[16px] border transition-all duration-300 ${
        isClaimed
          ? "border-[#0d2b1a] bg-[#04120c]/60"
          : isCompleted
          ? "border-[#1a3a22] bg-[#071a10]/80"
          : "border-[#0d1b2a] bg-[#060e18]/80"
      }`}
    >
      {/* Glow for completed unclaimed */}
      {canClaim && (
        <div className="absolute inset-0 animate-pulse rounded-[16px] border-2 border-[#2dae50]/40" />
      )}

      <div className="relative flex items-start gap-3 p-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isClaimed
              ? "bg-[#0d1b2a] text-[#3d4f5f]"
              : isCompleted
              ? "bg-[#1a3a22] text-[#2dae50]"
              : "bg-[#0d1520] text-[#5f6a7c]"
          }`}
        >
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-['Inter',sans-serif] text-[14px] font-semibold text-[#cfd8e3]">
              {task.title}
            </span>
            {task.type === "onchain" && (
              <Badge variant="outline" className="border-[#1a3a22] bg-[#071a10] text-[#2dae50] text-[10px]">
                On-Chain
              </Badge>
            )}
            {task.type === "offchain" && (
              <Badge variant="outline" className="border-[#0d2b3a] bg-[#060e18] text-[#4d8ab8] text-[10px]">
                Social
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-[#5f6a7c] leading-[1.4]">
            {task.description}
          </p>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#5f6a7c]">
                {task.type === "onchain"
                  ? `$${(completion?.progress ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} / $${Number(task.target_value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                  : `${Math.floor(completion?.progress ?? 0)} / ${task.target_count}`}
              </span>
              <span className="text-[11px] font-medium text-[#2dae50]">
                +{task.xp_reward} XP
                {Number(task.cashback_reward) > 0 && ` + $${task.cashback_reward}`}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-[4px] bg-[#0d1b2a]"
            />
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0 self-center">
          {isClaimed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d2b1a]">
              <CheckCircle2 size={18} className="text-[#2dae50]" />
            </div>
          ) : canClaim ? (
            <Button
              onClick={() => onClaim(task.id)}
              className="h-9 rounded-full bg-[#2dae50] px-4 text-[12px] font-semibold text-white hover:bg-[#249b44]"
            >
              Claim
              <Sparkles size={13} className="ml-1" />
            </Button>
          ) : task.verification_url ? (
            <a
              href={task.verification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a2535] bg-[#0d1520] text-[#5f6a7c] hover:text-[#2dae50] hover:border-[#2dae50]/30 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0d1b2a] bg-[#060e18]">
              <Lock size={14} className="text-[#3d4f5f]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnnouncementBanner({ announcement }: { announcement: any }) {
  const typeColors: Record<string, string> = {
    info: "border-[#1a3a4a] bg-[#071520] text-[#4d8ab8]",
    warning: "border-[#4a3a1a] bg-[#1a1205] text-[#c9a44a]",
    success: "border-[#1a3a22] bg-[#071a10] text-[#2dae50]",
    promo: "border-[#3a1a4a] bg-[#12071a] text-[#a84dda]",
  };
  const Icon = Bell;
  return (
    <div className={`rounded-[14px] border p-3 ${typeColors[announcement.type] ?? typeColors.info}`}>
      <div className="flex items-start gap-2.5">
        <Icon size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold">{announcement.title}</p>
          <p className="mt-0.5 text-[12px] opacity-80">{announcement.message}</p>
        </div>
      </div>
    </div>
  );
}

export function EarnPage() {
  const wallet = useWalletContext();
  const walletAddress = wallet.address;
  const [activeFilter, setActiveFilter] = useState<"all" | "onchain" | "offchain">("all");

  const { data: user } = useRewardUser(walletAddress);
  const { data: tasks = [] } = useEarnTasks();
  const { data: completions = [] } = useTaskCompletions(walletAddress ?? undefined);
  const { data: announcements = [] } = useAnnouncements();
  const claimMutation = useClaimTask();

  const handleClaim = (taskId: string) => {
    if (!walletAddress) return;
    claimMutation.mutate({ wallet: walletAddress, taskId });
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "all") return true;
    return t.type === activeFilter;
  });

  const onchainTasks = filteredTasks.filter((t) => t.type === "onchain");
  const offchainTasks = filteredTasks.filter((t) => t.type === "offchain");

  // Compute progress stats
  const totalTasks = tasks.length;
  const completedTasks = completions.filter((c) => c.completed).length;
  const claimedTasks = completions.filter((c) => c.claimed).length;
  const totalXPEarned = completions
    .filter((c) => c.claimed)
    .reduce((sum, c) => {
      const task = tasks.find((t) => t.id === c.task_id);
      return sum + (task?.xp_reward ?? 0);
    }, 0);
  const totalCashbackEarned = completions
    .filter((c) => c.claimed)
    .reduce((sum, c) => {
      const task = tasks.find((t) => t.id === c.task_id);
      return sum + Number(task?.cashback_reward ?? 0);
    }, 0);

  const completionPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const levelProgress = user ? (user.xp % 100) : 0;
  const currentLevel = user?.level ?? 1;
  const nextLevelXP = (currentLevel + 1) * 100;
  const xpToNext = nextLevelXP - (user?.xp ?? 0);

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0d1520] mb-4">
          <Zap size={32} className="text-[#2dae50]" />
        </div>
        <h2 className="text-[18px] font-semibold text-[#cfd8e3]">Connect Your Wallet</h2>
        <p className="mt-2 text-[13px] text-[#5f6a7c] text-center max-w-[260px]">
          Connect your wallet to view tasks, earn XP, and claim cashback rewards.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#e8ecf0] tracking-tight">Earn</h1>
          <p className="text-[13px] text-[#5f6a7c]">Complete tasks to earn XP & cashback</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#0d1b2a] bg-[#060e18] px-3 py-2">
          <Trophy size={14} className="text-[#c9a44a]" />
          <span className="text-[13px] font-semibold text-[#cfd8e3]">{totalXPEarned} XP</span>
        </div>
      </div>

      {/* Level & Progress Card */}
      <div className="relative overflow-hidden rounded-[20px] border border-[#0d1b2a] bg-[#060e18]/90 p-5">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#2dae50]/5 blur-3xl" />
        <div className="flex items-center gap-5">
          <CircularProgress
            percentage={(levelProgress / 100) * 100}
            size={72}
            strokeWidth={6}
          >
            <div className="flex flex-col items-center">
              <span className="text-[18px] font-bold text-[#2dae50]">{currentLevel}</span>
              <span className="text-[9px] text-[#5f6a7c]">LVL</span>
            </div>
          </CircularProgress>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-[#e8ecf0]">Level {currentLevel}</span>
              <Badge className="bg-[#1a3a22] text-[#2dae50] text-[10px] border-0">
                {user?.tier ?? "Bronze"}
              </Badge>
            </div>
            <div className="mt-2">
              <Progress value={levelProgress} className="h-[6px] bg-[#0d1b2a]" />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-[#5f6a7c]">{user?.xp ?? 0} / {nextLevelXP} XP</span>
              <span className="text-[11px] text-[#2dae50]">{xpToNext} to next</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#0a131d] p-3 text-center">
            <p className="text-[11px] text-[#5f6a7c]">Completed</p>
            <p className="mt-1 text-[16px] font-bold text-[#cfd8e3]">{completedTasks}/{totalTasks}</p>
          </div>
          <div className="rounded-xl bg-[#0a131d] p-3 text-center">
            <p className="text-[11px] text-[#5f6a7c]">Claimed</p>
            <p className="mt-1 text-[16px] font-bold text-[#2dae50]">{claimedTasks}</p>
          </div>
          <div className="rounded-xl bg-[#0a131d] p-3 text-center">
            <p className="text-[11px] text-[#5f6a7c]">Cashback</p>
            <p className="mt-1 text-[16px] font-bold text-[#c9a44a]">${totalCashbackEarned.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="flex flex-col gap-2">
          {announcements.slice(0, 2).map((a) => (
            <AnnouncementBanner key={a.id} announcement={a} />
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "onchain", "offchain"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`rounded-full px-4 py-2 text-[12px] font-medium transition-all ${
              activeFilter === f
                ? "bg-[#2dae50] text-white"
                : "bg-[#0d1520] text-[#5f6a7c] hover:text-[#cfd8e3]"
            }`}
          >
            {f === "all" ? "All Tasks" : f === "onchain" ? "On-Chain" : "Social"}
          </button>
        ))}
      </div>

      {/* On-Chain Tasks */}
      {(activeFilter === "all" || activeFilter === "onchain") && onchainTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1a3a22]">
              <TrendingUp size={14} className="text-[#2dae50]" />
            </div>
            <h2 className="text-[14px] font-semibold text-[#cfd8e3]">On-Chain Missions</h2>
            <span className="text-[11px] text-[#5f6a7c]">{onchainTasks.length} tasks</span>
          </div>
          {onchainTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              completion={completions.find((c) => c.task_id === task.id)}
              onClaim={handleClaim}
              walletAddress={walletAddress}
            />
          ))}
        </div>
      )}

      {/* Social / Off-Chain Tasks */}
      {(activeFilter === "all" || activeFilter === "offchain") && offchainTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1a2535]">
              <Sparkles size={14} className="text-[#4d8ab8]" />
            </div>
            <h2 className="text-[14px] font-semibold text-[#cfd8e3]">Social Quests</h2>
            <span className="text-[11px] text-[#5f6a7c]">{offchainTasks.length} tasks</span>
          </div>
          {offchainTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              completion={completions.find((c) => c.task_id === task.id)}
              onClaim={handleClaim}
              walletAddress={walletAddress}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0d1520] mb-3">
            <Zap size={24} className="text-[#3d4f5f]" />
          </div>
          <p className="text-[13px] text-[#5f6a7c]">No tasks available in this category</p>
        </div>
      )}
    </div>
  );
}
