import { useState, useEffect, useRef } from "react";
import { useWalletContext } from "@/context/WalletContext";
import {
  useEarnTasks,
  useTaskCompletions,
  useAnnouncements,
  useClaimTask,
  useXAccount,
  useConnectX,
  useVerifySocialTask,
} from "@/hooks/useEarn";
import { useRewardUser } from "@/hooks/useRewards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  TrendingUp,
  Twitter,
  MessageCircle,
  Heart,
  Repeat2,
  ArrowRightLeft,
  CheckCircle2,
  Sparkles,
  Trophy,
  Bell,
  ExternalLink,
  X,
  AtSign,
  Loader2,
  ShieldCheck,
  Wallet,
  ChevronRight,
} from "lucide-react";

const SOCIAL_CATEGORIES = new Set([
  "social_follow",
  "social_like",
  "social_retweet",
  "social_comment",
  "social_join",
]);

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
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#0d1b2a" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="#2dae50" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function ConnectXModal({
  onClose,
  onConnected,
  wallet,
}: {
  onClose: () => void;
  onConnected: (username: string) => void;
  wallet: string;
}) {
  const [username, setUsername] = useState("");
  const connectX = useConnectX();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async () => {
    const cleaned = username.replace(/^@/, "").trim();
    if (!cleaned) return;
    try {
      await connectX.mutateAsync({ wallet, xUsername: cleaned });
      onConnected(cleaned);
      toast({ title: "X account connected!", description: `@${cleaned} linked to your wallet.` });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[400px] mx-4 mb-4 sm:mb-0 rounded-[24px] border border-[#1a2535] bg-[#060e18] shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#1d9bf0]/40 to-transparent" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d1b2a] border border-[#1a2535]">
                <Twitter size={18} className="text-[#1d9bf0]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#e8ecf0]">Connect X Account</p>
                <p className="text-[12px] text-[#5f6a7c]">Required for social tasks</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1a2535] text-[#5f6a7c] hover:text-[#cfd8e3]">
              <X size={14} />
            </button>
          </div>

          <div className="rounded-[14px] border border-[#0d2233] bg-[#040c14] p-3 mb-4">
            <p className="text-[12px] text-[#4d8ab8] leading-[1.5]">
              Enter your X (Twitter) username. You'll need to complete the action on X before verifying each task.
            </p>
          </div>

          <div className="relative mb-4">
            <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4d8ab8]" />
            <input
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="yourhandle"
              className="w-full rounded-[12px] border border-[#1a2535] bg-[#0d1520] pl-9 pr-4 py-3 text-[14px] text-[#e8ecf0] placeholder:text-[#3d4f5f] outline-none focus:border-[#1d9bf0]/50"
              data-testid="input-x-username"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!username.trim() || connectX.isPending}
            className="w-full h-11 rounded-[12px] bg-[#1d9bf0] text-white font-semibold hover:bg-[#1a8cd8] disabled:opacity-40"
            data-testid="button-connect-x"
          >
            {connectX.isPending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <ShieldCheck size={16} className="mr-2" />
            )}
            Connect Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  completion,
  xUsername,
  walletAddress,
  onClaim,
  onVerify,
  onConnectX,
}: {
  task: any;
  completion: any;
  xUsername: string;
  walletAddress: string | null;
  onClaim: (taskId: string) => void;
  onVerify: (taskId: string) => void;
  onConnectX: () => void;
}) {
  const isCompleted = completion?.completed ?? false;
  const isClaimed = completion?.claimed ?? false;
  const isSocial = SOCIAL_CATEGORIES.has(task.category);
  const xConnected = !!xUsername;

  const [pendingVerify, setPendingVerify] = useState(false);
  const [openedLink, setOpenedLink] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = isCompleted
    ? 100
    : Math.min(
        ((completion?.progress ?? 0) / (task.target_value || task.target_count || 1)) * 100,
        99
      );

  const Icon = CATEGORY_ICONS[task.category] ?? Zap;
  const canClaim = isCompleted && !isClaimed;

  const handleGoToX = () => {
    if (task.verification_url) {
      window.open(task.verification_url, "_blank", "noopener,noreferrer");
    }
    setOpenedLink(true);
    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          setPendingVerify(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const renderAction = () => {
    if (isClaimed) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d2b1a]">
          <CheckCircle2 size={18} className="text-[#2dae50]" />
        </div>
      );
    }
    if (canClaim) {
      return (
        <Button
          onClick={() => onClaim(task.id)}
          className="h-9 rounded-full bg-[#2dae50] px-4 text-[12px] font-semibold text-white hover:bg-[#249b44]"
          data-testid={`button-claim-${task.id}`}
        >
          Claim <Sparkles size={13} className="ml-1" />
        </Button>
      );
    }
    if (isSocial) {
      if (!walletAddress) {
        return (
          <div className="flex h-9 items-center gap-1.5 rounded-full border border-[#1a2535] bg-[#0d1520] px-3">
            <Wallet size={12} className="text-[#3d4f5f]" />
            <span className="text-[11px] text-[#3d4f5f]">Connect wallet</span>
          </div>
        );
      }
      if (!xConnected) {
        return (
          <Button
            onClick={onConnectX}
            className="h-9 rounded-full border border-[#1d9bf0]/40 bg-[#040c14] px-3 text-[11px] font-medium text-[#1d9bf0] hover:bg-[#0d1b2a]"
            data-testid={`button-connect-x-task-${task.id}`}
          >
            <Twitter size={12} className="mr-1.5" /> Link X
          </Button>
        );
      }
      if (!openedLink) {
        return (
          <Button
            onClick={handleGoToX}
            className="h-9 rounded-full border border-[#1a2535] bg-[#0d1520] px-3 text-[11px] font-medium text-[#cfd8e3] hover:text-[#2dae50] hover:border-[#2dae50]/30"
            data-testid={`button-go-x-${task.id}`}
          >
            <ExternalLink size={12} className="mr-1.5" /> Go to X
          </Button>
        );
      }
      if (countdown > 0) {
        return (
          <div className="flex h-9 items-center gap-1.5 rounded-full border border-[#1a2535] bg-[#0d1520] px-3">
            <Loader2 size={12} className="animate-spin text-[#5f6a7c]" />
            <span className="text-[11px] text-[#5f6a7c]">{countdown}s</span>
          </div>
        );
      }
      if (pendingVerify) {
        return (
          <Button
            onClick={() => onVerify(task.id)}
            className="h-9 rounded-full bg-[#0d2233] border border-[#1d9bf0]/50 px-3 text-[11px] font-semibold text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
            data-testid={`button-verify-${task.id}`}
          >
            <ShieldCheck size={12} className="mr-1.5" /> Verify
          </Button>
        );
      }
    }
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0d1b2a] bg-[#060e18]">
        <Zap size={14} className="text-[#3d4f5f]" />
      </div>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[16px] border transition-all duration-300 ${
        isClaimed
          ? "border-[#0d2b1a] bg-[#04120c]/60"
          : isCompleted
          ? "border-[#1a3a22] bg-[#071a10]/80"
          : "border-[#0d1b2a] bg-[#060e18]/80"
      }`}
      data-testid={`card-task-${task.id}`}
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
              : isSocial
              ? "bg-[#040c14] text-[#1d9bf0]"
              : "bg-[#0d1520] text-[#5f6a7c]"
          }`}
        >
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-[#cfd8e3]">{task.title}</span>
            {task.type === "onchain" && (
              <Badge variant="outline" className="border-[#1a3a22] bg-[#071a10] text-[#2dae50] text-[10px]">
                On-Chain
              </Badge>
            )}
            {task.type === "offchain" && (
              <Badge variant="outline" className="border-[#0d2233] bg-[#040c14] text-[#1d9bf0] text-[10px]">
                Social
              </Badge>
            )}
          </div>

          <p className="mt-0.5 text-[12px] text-[#5f6a7c] leading-[1.4]">{task.description}</p>

          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#5f6a7c]">
                {task.type === "onchain"
                  ? `$${(completion?.progress ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} / $${Number(task.target_value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                  : `${Math.floor(completion?.progress ?? 0)} / ${task.target_count}`}
              </span>
              <span className="text-[11px] font-medium text-[#2dae50]">
                +{task.xp_reward} XP{Number(task.cashback_reward) > 0 ? ` + $${task.cashback_reward}` : ""}
              </span>
            </div>
            <Progress value={progress} className="h-[4px] bg-[#0d1b2a]" />
          </div>
        </div>

        <div className="shrink-0 self-center">{renderAction()}</div>
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
  return (
    <div className={`rounded-[14px] border p-3 ${typeColors[announcement.type] ?? typeColors.info}`}>
      <div className="flex items-start gap-2.5">
        <Bell size={16} className="mt-0.5 shrink-0" />
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
  const { toast } = useToast();

  const [activeFilter, setActiveFilter] = useState<"all" | "onchain" | "offchain">("all");
  const [showConnectX, setShowConnectX] = useState(false);

  const { data: user } = useRewardUser(walletAddress);
  const { data: tasks = [] } = useEarnTasks();
  const { data: completions = [] } = useTaskCompletions(walletAddress ?? undefined);
  const { data: announcements = [] } = useAnnouncements();
  const { data: xAccountData } = useXAccount(walletAddress ?? undefined);
  const xUsername = xAccountData?.x_username ?? "";

  const claimMutation = useClaimTask();
  const verifyMutation = useVerifySocialTask();

  const handleClaim = (taskId: string) => {
    if (!walletAddress) return;
    claimMutation.mutate(
      { wallet: walletAddress, taskId },
      {
        onSuccess: (data) => {
          toast({
            title: "XP Claimed!",
            description: `+${data.xpReward} XP added to your balance${data.cashbackReward > 0 ? ` and $${data.cashbackReward} cashback earned` : ""}.`,
          });
        },
        onError: (e: any) => {
          toast({ title: "Claim failed", description: e.message, variant: "destructive" });
        },
      }
    );
  };

  const handleVerify = (taskId: string) => {
    if (!walletAddress) return;
    verifyMutation.mutate(
      { wallet: walletAddress, taskId },
      {
        onSuccess: () => {
          toast({ title: "Verified!", description: "Task completed. You can now claim your XP reward." });
        },
        onError: (e: any) => {
          toast({ title: "Verification failed", description: e.message, variant: "destructive" });
        },
      }
    );
  };

  const getCompletion = (taskId: string) =>
    completions.find((c: any) => c.task_id === taskId);

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "all") return true;
    return t.type === activeFilter;
  });

  const onchainTasks = filteredTasks.filter((t) => t.type === "onchain");
  const offchainTasks = filteredTasks.filter((t) => t.type === "offchain");

  const totalTasks = tasks.length;
  const claimedCount = completions.filter((c: any) => c.claimed).length;
  const completedCount = completions.filter((c: any) => c.completed && !c.claimed).length;

  const totalXPEarned = completions
    .filter((c: any) => c.claimed)
    .reduce((sum: number, c: any) => {
      const task = tasks.find((t: any) => t.id === c.task_id);
      return sum + (task?.xp_reward ?? 0);
    }, 0);

  const levelProgress = user ? ((user.xp % 100) / 100) * 100 : 0;
  const currentLevel = user?.level ?? 1;
  const nextLevelXP = currentLevel * 100;
  const xpIntoLevel = user ? user.xp % 100 : 0;
  const xpToNext = nextLevelXP - xpIntoLevel;

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      {showConnectX && walletAddress && (
        <ConnectXModal
          wallet={walletAddress}
          onClose={() => setShowConnectX(false)}
          onConnected={() => {}}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#e8ecf0] tracking-tight">Earn</h1>
          <p className="text-[13px] text-[#5f6a7c]">Complete tasks to earn XP & cashback</p>
        </div>
        <div className="flex items-center gap-2">
          {walletAddress && (
            <button
              onClick={() => setShowConnectX(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors ${
                xUsername
                  ? "border-[#1d9bf0]/30 bg-[#040c14] text-[#1d9bf0]"
                  : "border-[#1a2535] bg-[#0d1520] text-[#5f6a7c] hover:text-[#1d9bf0] hover:border-[#1d9bf0]/30"
              }`}
              data-testid="button-connect-x-header"
            >
              <Twitter size={13} />
              {xUsername ? `@${xUsername}` : "Link X"}
            </button>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-[#0d1b2a] bg-[#060e18] px-3 py-2">
            <Trophy size={14} className="text-[#c9a44a]" />
            <span className="text-[13px] font-semibold text-[#cfd8e3]" data-testid="text-xp-earned">
              {user?.xp ?? 0} XP
            </span>
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="flex flex-col gap-2">
          {announcements.map((a: any) => (
            <AnnouncementBanner key={a.id} announcement={a} />
          ))}
        </div>
      )}

      {/* Level Card */}
      <div className="relative overflow-hidden rounded-[20px] border border-[#0d1b2a] bg-[#060e18]/90 p-5">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#2dae50]/5 blur-3xl" />
        <div className="flex items-center gap-5">
          <CircularProgress percentage={levelProgress} size={72} strokeWidth={6}>
            <div className="flex flex-col items-center">
              <span className="text-[18px] font-bold text-[#2dae50]">{currentLevel}</span>
              <span className="text-[9px] text-[#5f6a7c]">LVL</span>
            </div>
          </CircularProgress>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-[#e8ecf0]">Level {currentLevel}</span>
              <Badge className="bg-[#1a3a22] text-[#2dae50] text-[10px] border-0">{user?.tier ?? "Bronze"}</Badge>
            </div>
            <div className="mt-2">
              <Progress value={levelProgress} className="h-[6px] bg-[#0d1b2a]" />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-[#5f6a7c]">{xpIntoLevel} / 100 XP</span>
              <span className="text-[11px] text-[#2dae50]">{xpToNext} to next level</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Total Tasks", value: totalTasks },
            { label: "Completed", value: completedCount + claimedCount },
            { label: "Claimed", value: claimedCount },
          ].map((s) => (
            <div key={s.label} className="rounded-[12px] border border-[#0d1b2a] bg-[#04090f] px-3 py-2 text-center">
              <p className="text-[16px] font-bold text-[#e8ecf0]">{s.value}</p>
              <p className="text-[10px] text-[#5f6a7c]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* X Account Banner (if wallet connected but X not linked) */}
      {walletAddress && !xUsername && (
        <button
          onClick={() => setShowConnectX(true)}
          className="flex items-center gap-3 rounded-[16px] border border-[#1d9bf0]/20 bg-[#040c14] p-4 text-left w-full hover:border-[#1d9bf0]/40 transition-colors"
          data-testid="banner-connect-x"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d1b2a] border border-[#1a2535]">
            <Twitter size={18} className="text-[#1d9bf0]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[#e8ecf0]">Connect X to unlock social tasks</p>
            <p className="text-[11px] text-[#4d8ab8]">Follow, RT, and Like to earn XP rewards</p>
          </div>
          <ChevronRight size={16} className="text-[#3d4f5f]" />
        </button>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(["all", "onchain", "offchain"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
              activeFilter === f
                ? "bg-[#0d2b1a] text-[#2dae50] border border-[#1a3a22]"
                : "text-[#5f6a7c] border border-transparent hover:text-[#cfd8e3]"
            }`}
            data-testid={`filter-${f}`}
          >
            {f === "all" ? "All Tasks" : f === "onchain" ? "On-Chain" : "Social"}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-[#3d4f5f]">
          {claimedCount}/{totalTasks} done
        </span>
      </div>

      {/* No wallet message */}
      {!walletAddress && (
        <div className="rounded-[16px] border border-[#0d1b2a] bg-[#060e18] p-6 text-center">
          <Wallet size={28} className="mx-auto mb-3 text-[#3d4f5f]" />
          <p className="text-[14px] font-medium text-[#cfd8e3]">Connect your wallet to start earning</p>
          <p className="mt-1 text-[12px] text-[#5f6a7c]">Track progress and claim XP rewards</p>
        </div>
      )}

      {/* On-Chain Tasks */}
      {(activeFilter === "all" || activeFilter === "onchain") && onchainTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-[#2dae50]" />
            <h2 className="text-[13px] font-semibold text-[#cfd8e3]">On-Chain Tasks</h2>
            <Badge className="bg-[#071a10] text-[#2dae50] border-[#1a3a22] text-[10px]">Auto-tracked</Badge>
          </div>
          {onchainTasks.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              completion={getCompletion(task.id)}
              xUsername={xUsername}
              walletAddress={walletAddress}
              onClaim={handleClaim}
              onVerify={handleVerify}
              onConnectX={() => setShowConnectX(true)}
            />
          ))}
        </div>
      )}

      {/* Social Tasks */}
      {(activeFilter === "all" || activeFilter === "offchain") && offchainTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Twitter size={14} className="text-[#1d9bf0]" />
            <h2 className="text-[13px] font-semibold text-[#cfd8e3]">Social Tasks</h2>
            <Badge className="bg-[#040c14] text-[#1d9bf0] border-[#0d2233] text-[10px]">X (Twitter)</Badge>
          </div>
          {offchainTasks.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              completion={getCompletion(task.id)}
              xUsername={xUsername}
              walletAddress={walletAddress}
              onClaim={handleClaim}
              onVerify={handleVerify}
              onConnectX={() => setShowConnectX(true)}
            />
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="rounded-[16px] border border-[#0d1b2a] bg-[#060e18] p-8 text-center">
          <Zap size={28} className="mx-auto mb-3 text-[#3d4f5f]" />
          <p className="text-[14px] font-medium text-[#cfd8e3]">No tasks available yet</p>
          <p className="mt-1 text-[12px] text-[#5f6a7c]">Check back soon for new challenges</p>
        </div>
      )}
    </div>
  );
}
