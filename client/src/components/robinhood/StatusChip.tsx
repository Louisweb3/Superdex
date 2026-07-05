import {
  CheckCircle2,
  Clock,
  XCircle,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

export type StatusKind =
  | "verified"
  | "pending"
  | "failed"
  | "connected"
  | "wrong-network";

const CONFIG: Record<
  StatusKind,
  { label: string; icon: LucideIcon; className: string }
> = {
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    className: "text-[#46D67B] bg-[#46D67B]/10 border-[#46D67B]/25",
  },
  pending: {
    label: "Verifying…",
    icon: Clock,
    className: "text-[#FFB547] bg-[#FFB547]/10 border-[#FFB547]/25",
  },
  failed: {
    label: "Unverified",
    icon: XCircle,
    className: "text-[#FF5A67] bg-[#FF5A67]/10 border-[#FF5A67]/25",
  },
  connected: {
    label: "Connected",
    icon: Wifi,
    className: "text-[#5AE4A8] bg-[#5AE4A8]/10 border-[#5AE4A8]/25",
  },
  "wrong-network": {
    label: "Wrong Network",
    icon: WifiOff,
    className: "text-[#FFB547] bg-[#FFB547]/10 border-[#FFB547]/25",
  },
};

export function StatusChip({
  kind,
  spin = false,
}: {
  kind: StatusKind;
  spin?: boolean;
}) {
  const { label, icon: Icon, className } = CONFIG[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${className}`}
    >
      <Icon size={11} className={spin ? "animate-spin" : ""} />
      {label}
    </span>
  );
}
