interface ComingSoonOverlayProps {
  lines: string[];
}

export function ComingSoonOverlay({ lines }: ComingSoonOverlayProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 mx-4 w-full max-w-[420px] rounded-[20px] border border-[#1a3020] bg-[#030e05] px-8 py-10 text-center shadow-[0_0_80px_rgba(34,197,94,0.15)]">
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.07),transparent_60%)] pointer-events-none" />

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#22c55e]/30 bg-[#0a2010] shadow-[0_0_30px_rgba(34,197,94,0.2)]">
          <span className="text-[32px] leading-none">⚡</span>
        </div>

        {/* Lines */}
        <div className="flex flex-col gap-2">
          {lines.map((line, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "text-[22px] font-black tracking-tight text-white"
                  : i === lines.length - 1
                  ? "mt-3 text-[13px] text-[#4a5a50] leading-relaxed"
                  : "text-[15px] font-medium text-[#697278]"
              }
            >
              {line}
            </p>
          ))}
        </div>

        {/* Pulsing dot */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
          <span className="text-[12px] font-semibold uppercase tracking-widest text-[#22c55e]">
            Coming Soon
          </span>
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
        </div>
      </div>
    </div>
  );
}
