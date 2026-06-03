import { useState, useEffect } from "react";
import { X, Info, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { usePublicAnnouncements } from "@/hooks/useAdmin";

const DISMISSED_KEY = "dismissed_announcements";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"); }
  catch { return []; }
}

function addDismissed(id: string) {
  const d = getDismissed();
  if (!d.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...d, id]));
  }
}

const TYPE_STYLES: Record<string, { border: string; bg: string; icon: JSX.Element; label: string }> = {
  info:    { border: "border-[#1a3a5c]", bg: "bg-[#020f1e]", icon: <Info className="h-4 w-4 text-[#4a9fd4]" />, label: "text-[#4a9fd4]" },
  warning: { border: "border-[#4a3200]", bg: "bg-[#0f0800]", icon: <AlertTriangle className="h-4 w-4 text-[#e8a22a]" />, label: "text-[#e8a22a]" },
  success: { border: "border-[#1a4a2a]", bg: "bg-[#020f08]", icon: <CheckCircle className="h-4 w-4 text-[#3acd5b]" />, label: "text-[#3acd5b]" },
  promo:   { border: "border-[#3a1a5c]", bg: "bg-[#0a0514]", icon: <Sparkles className="h-4 w-4 text-[#b06af5]" />, label: "text-[#b06af5]" },
  event:   { border: "border-[#3a1a5c]", bg: "bg-[#0a0514]", icon: <Sparkles className="h-4 w-4 text-[#b06af5]" />, label: "text-[#b06af5]" },
  alert:   { border: "border-[#4a1a1a]", bg: "bg-[#0f0505]", icon: <AlertTriangle className="h-4 w-4 text-[#e84a4a]" />, label: "text-[#e84a4a]" },
  update:  { border: "border-[#1a3a5c]", bg: "bg-[#020f1e]", icon: <Info className="h-4 w-4 text-[#4a9fd4]" />, label: "text-[#4a9fd4]" },
};

export function AnnouncementBanner() {
  const { data: all } = usePublicAnnouncements();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  const visible = (all ?? []).filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  const ann = visible[current % visible.length];
  if (!ann) return null;

  const style = TYPE_STYLES[ann.type] ?? TYPE_STYLES.info;

  const dismiss = (permanently: boolean) => {
    if (permanently) {
      addDismissed(ann.id);
      setDismissed(getDismissed());
    } else {
      setDismissed((d) => [...d, ann.id]);
    }
    setCurrent(0);
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-[320px] max-w-[calc(100vw-2.5rem)] rounded-[16px] border ${style.border} ${style.bg} shadow-2xl overflow-hidden`}
      data-testid="announcement-banner"
    >
      {visible.length > 1 && (
        <div className="flex gap-1 px-4 pt-3 pb-1">
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 flex-1 rounded-full transition-all ${i === current % visible.length ? "bg-[#3acd5b]" : "bg-[#1a2535]"}`}
            />
          ))}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0">{ann.icon || style.icon}</span>
            <p className={`font-['Inter',sans-serif] text-[13px] font-bold truncate ${style.label}`}>
              {ann.title}
            </p>
          </div>
          <button
            onClick={() => dismiss(false)}
            className="shrink-0 text-[#3a4a5c] hover:text-[#6c778a] transition-colors"
            data-testid="announcement-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 font-['Inter',sans-serif] text-[12px] text-[#8a96a4] leading-[1.5]">
          {ann.message}
        </p>
        <button
          onClick={() => dismiss(true)}
          className="mt-2 font-['Inter',sans-serif] text-[11px] text-[#3a4a5c] hover:text-[#6c778a] transition-colors underline"
          data-testid="announcement-dont-show"
        >
          Don't show again
        </button>
      </div>
    </div>
  );
}
