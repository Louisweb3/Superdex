import { ReactNode } from "react";
import { GlassCard } from "./GlassCard";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  accentColor?: string;
  sub?: ReactNode;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accentColor = "#5AE4A8",
  sub,
}: StatCardProps) {
  return (
    <GlassCard hoverable className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--rh-text-secondary)] font-medium">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: `${accentColor}1A`,
            color: accentColor,
          }}
        >
          <Icon size={15} />
        </div>
      </div>
      <div className="text-[22px] font-semibold text-[var(--rh-text)] tracking-tight">
        {value}
      </div>
      {sub ? (
        <div className="text-[12px] text-[var(--rh-muted)]">{sub}</div>
      ) : null}
    </GlassCard>
  );
}
