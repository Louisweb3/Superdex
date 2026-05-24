import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
}

export function ComingSoonModal({ open, onClose, title, description }: ComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border border-[#0f2030] bg-[#020b1c] p-0 text-white max-w-sm w-[calc(100%-2rem)] rounded-2xl">
        <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#041220] border border-[#0d2030]">
            <span className="text-4xl">⚡</span>
          </div>
          <div>
            <h2 className="mb-2 font-['Inter',sans-serif] text-xl font-bold text-[#d0d2d6]">
              {title}
            </h2>
            <p className="font-['Inter',sans-serif] text-sm leading-relaxed text-[#4d5a6e]">
              {description ?? "This feature is being built. Check back soon for the full experience."}
            </p>
          </div>
          <div className="w-full rounded-xl border border-[#0d2030] bg-[#030e1c] px-5 py-4">
            <p className="font-['Inter',sans-serif] text-xs font-bold uppercase tracking-widest text-[#2dae50]">
              Coming Soon
            </p>
          </div>
          <button
            onClick={onClose}
            className="font-['Inter',sans-serif] text-sm text-[#3a4a5c] hover:text-[#5a6a7c] transition-colors"
          >
            Dismiss
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
