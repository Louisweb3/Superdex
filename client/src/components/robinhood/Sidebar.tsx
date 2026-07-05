import type { LucideIcon } from "lucide-react";
import {
  Home,
  FileText,
  Rocket,
  BarChart3,
  Settings,
} from "lucide-react";
import type { RhTab } from "./types";

const NAV_ITEMS: { id: RhTab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: RhTab;
  onChange: (tab: RhTab) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-[#000405]/95 backdrop-blur-xl border-t border-[#081312] px-1 py-2">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            data-testid={`nav-bottom-${id}`}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-[8px] text-[10px] font-medium transition-colors min-w-[60px] ${
              active
                ? "text-[#0baf3d]"
                : "text-[#5e6164] hover:text-[#8b8e92]"
            }`}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-[#0baf3d]" />
              )}
            </div>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
