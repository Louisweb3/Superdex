import {
  LayoutDashboard,
  Rocket,
  FileStack,
  Gift,
  Compass,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { RhTab } from "./types";

const NAV_ITEMS: { id: RhTab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "deploy", label: "Deploy", icon: Rocket },
  { id: "contracts", label: "My Contracts", icon: FileStack },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "explorer", label: "Explorer", icon: Compass },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeTab,
  onChange,
}: {
  activeTab: RhTab;
  onChange: (tab: RhTab) => void;
}) {
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-white/[0.06] bg-[#0B1118]/60 backdrop-blur-xl px-4 py-6 gap-1">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            data-testid={`nav-rh-${id}`}
            className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[14px] font-medium transition-all duration-200 ${
              active
                ? "bg-white/[0.06] text-white"
                : "text-[#8B97A8] hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[#5AE4A8]" />
            )}
            <Icon
              size={17}
              className={active ? "text-[#5AE4A8]" : "text-[#5E6B7A]"}
            />
            {label}
          </button>
        );
      })}
    </aside>
  );
}

export function MobileTabBar({
  activeTab,
  onChange,
}: {
  activeTab: RhTab;
  onChange: (tab: RhTab) => void;
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-[#0B1118]/90 backdrop-blur-xl border-t border-white/[0.06] px-2 py-2">
      {NAV_ITEMS.slice(0, 5).map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            data-testid={`nav-mobile-rh-${id}`}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-[10px] text-[10px] font-medium transition-colors ${
              active ? "text-[#5AE4A8]" : "text-[#5E6B7A]"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
