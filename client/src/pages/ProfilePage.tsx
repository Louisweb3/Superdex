import { useState, useRef, useEffect } from "react";
import { useWalletContext } from "@/context/WalletContext";
import { useRewardUser } from "@/hooks/useRewards";
import { useXAccount, useConnectX } from "@/hooks/useEarn";
import { useReferralStats, useApplyReferralCode } from "@/hooks/useReferral";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Twitter,
  Copy,
  CheckCheck,
  AtSign,
  Loader2,
  ShieldCheck,
  X,
  Zap,
  TrendingUp,
  Wallet,
  Gift,
  Users,
  Star,
  ExternalLink,
  ChevronRight,
  DollarSign,
} from "lucide-react";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "#2dae50",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-[#0d1b2a] bg-[#060e18] p-3.5">
      <div className="flex items-center gap-2">
        <Icon size={13} style={{ color: accent }} />
        <span className="text-[11px] text-[#5f6a7c]">{label}</span>
      </div>
      <p className="text-[20px] font-bold text-[#e8ecf0] leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[#3d4f5f]">{sub}</p>}
    </div>
  );
}

function ConnectXModal({
  wallet,
  onClose,
}: {
  wallet: string;
  onClose: () => void;
}) {
  const [username, setUsername] = useState("");
  const connectX = useConnectX();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleSubmit = async () => {
    const cleaned = username.replace(/^@/, "").trim();
    if (!cleaned) return;
    try {
      await connectX.mutateAsync({ wallet, xUsername: cleaned });
      toast({ title: "X account connected!", description: `@${cleaned} linked.` });
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
          <div className="relative mb-4">
            <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4d8ab8]" />
            <input
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="yourhandle"
              className="w-full rounded-[12px] border border-[#1a2535] bg-[#0d1520] pl-9 pr-4 py-3 text-[14px] text-[#e8ecf0] placeholder:text-[#3d4f5f] outline-none focus:border-[#1d9bf0]/50"
              data-testid="input-x-username-profile"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!username.trim() || connectX.isPending}
            className="w-full h-11 rounded-[12px] bg-[#1d9bf0] text-white font-semibold hover:bg-[#1a8cd8] disabled:opacity-40"
          >
            {connectX.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <ShieldCheck size={16} className="mr-2" />}
            Connect Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReferralSection({ wallet }: { wallet: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [refInput, setRefInput] = useState("");
  const { data: stats } = useReferralStats(wallet);
  const applyMutation = useApplyReferralCode();

  const refCode = stats?.referral_code ?? "";
  const refLink = refCode ? `${window.location.origin}?ref=${refCode}` : "";

  const copy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const applyCode = async () => {
    const code = refInput.trim().toUpperCase();
    if (!code) return;
    try {
      await applyMutation.mutateAsync({ wallet, code });
      toast({ title: "Referral applied!", description: "You were referred successfully." });
      setRefInput("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* How it works */}
      <div className="rounded-[16px] border border-[#1a2535] bg-[#060e18] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={15} className="text-[#c9a44a]" />
          <h3 className="text-[14px] font-semibold text-[#e8ecf0]">Referral Program</h3>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { icon: Users, color: "#2dae50", text: "Earn 35% of XP from every swap your referrals make" },
            { icon: Star, color: "#c9a44a", text: "Get 500 bonus XP when your referral completes a $100 swap" },
            { icon: Zap, color: "#a84dda", text: "No limit — refer as many users as you want" },
          ].map(({ icon: Icon, color, text }, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0d1520] mt-0.5">
                <Icon size={12} style={{ color }} />
              </div>
              <p className="text-[12px] text-[#7a8799] leading-[1.5]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Your link */}
      {refCode ? (
        <div className="rounded-[16px] border border-[#0d1b2a] bg-[#060e18] p-4">
          <p className="text-[12px] text-[#5f6a7c] mb-2">Your referral link</p>
          <div className="flex items-center gap-2 rounded-[10px] border border-[#1a2535] bg-[#0d1520] px-3 py-2.5">
            <span className="flex-1 text-[12px] text-[#cfd8e3] truncate font-mono">{refLink}</span>
            <button onClick={copy} className="shrink-0 text-[#5f6a7c] hover:text-[#2dae50] transition-colors" data-testid="button-copy-referral">
              {copied ? <CheckCheck size={15} className="text-[#2dae50]" /> : <Copy size={15} />}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Referrals", value: stats?.referral_count ?? 0 },
              { label: "XP Earned", value: `+${stats?.referral_bonus_xp ?? 0}` },
              { label: "Milestones", value: stats?.milestone_count ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-[10px] border border-[#0d1b2a] bg-[#04090f] px-2 py-2 text-center">
                <p className="text-[15px] font-bold text-[#e8ecf0]">{s.value}</p>
                <p className="text-[10px] text-[#5f6a7c]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[14px] border border-[#1a2535] bg-[#060e18] p-4 text-center">
          <Loader2 size={18} className="animate-spin text-[#3d4f5f] mx-auto mb-2" />
          <p className="text-[12px] text-[#5f6a7c]">Loading referral code…</p>
        </div>
      )}

      {/* Apply someone's code */}
      {!stats?.referred_by && (
        <div className="rounded-[16px] border border-[#0d1b2a] bg-[#060e18] p-4">
          <p className="text-[13px] font-medium text-[#cfd8e3] mb-2">Have a referral code?</p>
          <div className="flex gap-2">
            <input
              value={refInput}
              onChange={(e) => setRefInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && applyCode()}
              placeholder="SUPXXXXX"
              maxLength={12}
              className="flex-1 rounded-[10px] border border-[#1a2535] bg-[#0d1520] px-3 py-2.5 text-[13px] text-[#e8ecf0] placeholder:text-[#3d4f5f] outline-none focus:border-[#2dae50]/40 font-mono uppercase"
              data-testid="input-referral-code"
            />
            <Button
              onClick={applyCode}
              disabled={!refInput.trim() || applyMutation.isPending}
              className="h-auto rounded-[10px] bg-[#0d2b1a] border border-[#1a3a22] text-[#2dae50] px-4 text-[12px] font-semibold hover:bg-[#1a3a22] disabled:opacity-40"
              data-testid="button-apply-referral"
            >
              {applyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
            </Button>
          </div>
        </div>
      )}
      {stats?.referred_by && (
        <div className="rounded-[12px] border border-[#0d2b1a] bg-[#04120c] px-3 py-2 flex items-center gap-2">
          <CheckCheck size={13} className="text-[#2dae50]" />
          <p className="text-[12px] text-[#4a8f5f]">Referred by <span className="font-mono text-[#2dae50]">{stats.referred_by.slice(0, 6)}…{stats.referred_by.slice(-4)}</span></p>
        </div>
      )}
    </div>
  );
}

export function ProfilePage() {
  const wallet = useWalletContext();
  const walletAddress = wallet.address;
  const { data: user } = useRewardUser(walletAddress);
  const { data: xAccountData } = useXAccount(walletAddress ?? undefined);
  const xUsername = xAccountData?.x_username ?? "";
  const [showConnectX, setShowConnectX] = useState(false);

  const short = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  const levelProgress = user ? (user.xp % 100) : 0;

  const TIER_COLOR: Record<string, string> = {
    Bronze: "#cd7f32", Silver: "#c0c0c0", Gold: "#c9a44a", Diamond: "#a855f7",
  };
  const tierColor = TIER_COLOR[user?.tier ?? "Bronze"] ?? "#cd7f32";

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      {showConnectX && walletAddress && (
        <ConnectXModal wallet={walletAddress} onClose={() => setShowConnectX(false)} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#e8ecf0] tracking-tight">Profile</h1>
        <p className="text-[13px] text-[#5f6a7c]">Your stats, rewards & referrals</p>
      </div>

      {!walletAddress ? (
        <div className="rounded-[16px] border border-[#0d1b2a] bg-[#060e18] p-8 text-center">
          <Wallet size={28} className="mx-auto mb-3 text-[#3d4f5f]" />
          <p className="text-[14px] font-medium text-[#cfd8e3]">Connect your wallet to view your profile</p>
        </div>
      ) : (
        <>
          {/* Identity card */}
          <div className="relative overflow-hidden rounded-[20px] border border-[#0d1b2a] bg-[#060e18] p-5">
            <div className="absolute top-0 right-0 h-28 w-28 rounded-full blur-3xl" style={{ background: `${tierColor}18` }} />
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#1a2535] bg-[#0d1520]">
                <User size={22} className="text-[#cfd8e3]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[14px] font-semibold text-[#e8ecf0]">{short}</span>
                  <Badge className="border-0 text-[10px] font-semibold" style={{ background: `${tierColor}22`, color: tierColor }}>
                    {user?.tier ?? "Bronze"}
                  </Badge>
                </div>
                <p className="text-[12px] text-[#5f6a7c] mt-0.5">Level {user?.level ?? 1} · {user?.streak ?? 0} day streak 🔥</p>
              </div>
            </div>
            {/* Level bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[#5f6a7c]">Level {user?.level ?? 1} XP</span>
                <span className="text-[11px] text-[#2dae50]">{levelProgress}/100 XP</span>
              </div>
              <Progress value={levelProgress} className="h-[5px] bg-[#0d1b2a]" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label="Total XP" value={(user?.xp ?? 0).toLocaleString()} sub={`+${user?.weekly_xp ?? 0} this week`} icon={Zap} accent="#2dae50" />
            <StatCard label="Cashback Earned" value={`$${(user?.weekly_cashback_usd ?? 0).toFixed(2)}`} sub="This week" icon={DollarSign} accent="#c9a44a" />
            <StatCard label="Total Volume" value={`$${(user?.total_volume_usd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`} sub={`${user?.total_swaps ?? 0} swaps`} icon={TrendingUp} accent="#4d8ab8" />
            <StatCard label="Pending Cashback" value={`$${(user?.pending_cashback_usd ?? 0).toFixed(2)}`} sub="Ready to claim" icon={Gift} accent="#a84dda" />
          </div>

          {/* X Account section */}
          <div className="rounded-[16px] border border-[#0d1b2a] bg-[#060e18] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${xUsername ? "border-[#1d9bf0]/30 bg-[#040c14]" : "border-[#1a2535] bg-[#0d1520]"}`}>
                  <Twitter size={18} className={xUsername ? "text-[#1d9bf0]" : "text-[#3d4f5f]"} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#e8ecf0]">{xUsername ? `@${xUsername}` : "X Account"}</p>
                  <p className="text-[11px] text-[#5f6a7c]">{xUsername ? "Connected · Social tasks unlocked" : "Not connected"}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectX(true)}
                className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-[12px] font-medium transition-colors ${xUsername ? "border-[#1a2535] text-[#5f6a7c] hover:text-[#1d9bf0]" : "border-[#1d9bf0]/40 text-[#1d9bf0] bg-[#040c14] hover:bg-[#0d1b2a]"}`}
                data-testid="button-x-connect-profile"
              >
                {xUsername ? "Change" : "Connect"}
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Referral section */}
          {walletAddress && <ReferralSection wallet={walletAddress} />}
        </>
      )}
    </div>
  );
}
