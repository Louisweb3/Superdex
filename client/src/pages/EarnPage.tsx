import { useState, useEffect } from "react";
import { useWalletContext } from "@/context/WalletContext";
import {
  useEarnTasks,
  useTaskCompletions,
  useAnnouncements,
  useClaimTask,
} from "@/hooks/useEarn";
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
  CheckCircle2,
  Sparkles,
  Trophy,
  Bell,
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
  const offset =
    circumference -
    (Math.min(percentage, 100) / 100) * circumference;

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
}: {
  task: any;
  completion: any;
  onClaim: (taskId: string) => void;
}) {
  const isCompleted = completion?.completed ?? false;
  const isClaimed = completion?.claimed ?? false;

  const progress = isCompleted
    ? 100
    : Math.min(
        ((completion?.progress ?? 0) /
          (task.target_value || task.target_count || 1)) *
          100,
        99
      );

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
            <span className="text-[14px] font-semibold text-[#cfd8e3]">
              {task.title}
            </span>

            {task.type === "onchain" && (
              <Badge
                variant="outline"
                className="border-[#1a3a22] bg-[#071a10] text-[#2dae50] text-[10px]"
              >
                On-Chain
              </Badge>
            )}

            {task.type === "offchain" && (
              <Badge
                variant="outline"
                className="border-[#0d2b3a] bg-[#060e18] text-[#4d8ab8] text-[10px]"
              >
                Social
              </Badge>
            )}
          </div>

          <p className="mt-0.5 text-[12px] text-[#5f6a7c] leading-[1.4]">
            {task.description}
          </p>

          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#5f6a7c]">
                {task.type === "onchain"
                  ? `$${(
                      completion?.progress ?? 0
                    ).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })} / $${Number(
                      task.target_value
                    ).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}`
                  : `${Math.floor(
                      completion?.progress ?? 0
                    )} / ${task.target_count}`}
              </span>

              <span className="text-[11px] font-medium text-[#2dae50]">
                +{task.xp_reward} XP
                {Number(task.cashback_reward) > 0 &&
                  ` + $${task.cashback_reward}`}
              </span>
            </div>

            <Progress
              value={progress}
              className="h-[4px] bg-[#0d1b2a]"
            />
          </div>
        </div>

        <div className="shrink-0 self-center">
          {isClaimed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d2b1a]">
              <CheckCircle2
                size={18}
                className="text-[#2dae50]"
              />
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

function AnnouncementBanner({
  announcement,
}: {
  announcement: any;
}) {
  const typeColors: Record<string, string> = {
    info: "border-[#1a3a4a] bg-[#071520] text-[#4d8ab8]",
    warning: "border-[#4a3a1a] bg-[#1a1205] text-[#c9a44a]",
    success: "border-[#1a3a22] bg-[#071a10] text-[#2dae50]",
    promo: "border-[#3a1a4a] bg-[#12071a] text-[#a84dda]",
  };

  return (
    <div
      className={`rounded-[14px] border p-3 ${
        typeColors[announcement.type] ?? typeColors.info
      }`}
    >
      <div className="flex items-start gap-2.5">
        <Bell size={16} className="mt-0.5 shrink-0" />

        <div>
          <p className="text-[13px] font-semibold">
            {announcement.title}
          </p>

          <p className="mt-0.5 text-[12px] opacity-80">
            {announcement.message}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EarnPage() {
  const wallet = useWalletContext();
  const walletAddress = wallet.address;

  const [activeFilter, setActiveFilter] = useState<
    "all" | "onchain" | "offchain"
  >("all");

  // FORCE POPUP
  const [showPopup] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const { data: user } = useRewardUser(walletAddress);

  const { data: tasks = [] } = useEarnTasks();

  const { data: completions = [] } =
    useTaskCompletions(walletAddress ?? undefined);

  const { data: announcements = [] } =
    useAnnouncements();

  const claimMutation = useClaimTask();

  const handleClaim = (taskId: string) => {
    if (!walletAddress) return;

    claimMutation.mutate({
      wallet: walletAddress,
      taskId,
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "all") return true;
    return t.type === activeFilter;
  });

  const onchainTasks = filteredTasks.filter(
    (t) => t.type === "onchain"
  );

  const offchainTasks = filteredTasks.filter(
    (t) => t.type === "offchain"
  );

  const totalTasks = tasks.length;

  const completedTasks = completions.filter(
    (c) => c.completed
  ).length;

  const claimedTasks = completions.filter(
    (c) => c.claimed
  ).length;

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

  const levelProgress = user ? user.xp % 100 : 0;

  const currentLevel = user?.level ?? 1;

  const nextLevelXP = (currentLevel + 1) * 100;

  const xpToNext =
    nextLevelXP - (user?.xp ?? 0);

  return (
    <>
      {/* FORCED IMAGE POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div
            className="relative w-full max-w-[420px] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-[24px] border border-[#1a2535] bg-[#060e18] shadow-2xl">
              <img
                src="https://i.ibb.co/0VCbbhc8/Chat-GPT-Image-May-26-2026-09-28-27-PM.png"
                alt="Popup"
                className="w-full object-cover"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#e8ecf0] tracking-tight">
              Earn
            </h1>

            <p className="text-[13px] text-[#5f6a7c]">
              Complete tasks to earn XP & cashback
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#0d1b2a] bg-[#060e18] px-3 py-2">
            <Trophy
              size={14}
              className="text-[#c9a44a]"
            />

            <span className="text-[13px] font-semibold text-[#cfd8e3]">
              {totalXPEarned} XP
            </span>
          </div>
        </div>

        {/* LEVEL CARD */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#0d1b2a] bg-[#060e18]/90 p-5">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#2dae50]/5 blur-3xl" />

          <div className="flex items-center gap-5">
            <CircularProgress
              percentage={levelProgress}
              size={72}
              strokeWidth={6}
            >
              <div className="flex flex-col items-center">
                <span className="text-[18px] font-bold text-[#2dae50]">
                  {currentLevel}
                </span>

                <span className="text-[9px] text-[#5f6a7c]">
                  LVL
                </span>
              </div>
            </CircularProgress>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold text-[#e8ecf0]">
                  Level {currentLevel}
                </span>

                <Badge className="bg-[#1a3a22] text-[#2dae50] text-[10px] border-0">
                  {user?.tier ?? "Bronze"}
                </Badge>
              </div>

              <div className="mt-2">
                <Progress
                  value={levelProgress}
                  className="h-[6px] bg-[#0d1b2a]"
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[11px] text-[#5f6a7c]">
                  {user?.xp ?? 0} / {nextLevelXP} XP
                </span>

                <span className="text-[11px] text-[#2dae50]">
                  {xpToNext} to next
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}