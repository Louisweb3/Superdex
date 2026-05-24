interface PlaceholderPageProps {
  title: string;
  icon: string;
  description: string;
  color?: string;
}

export const PlaceholderPage = ({
  title,
  icon,
  description,
  color = "#2dae50",
}: PlaceholderPageProps): JSX.Element => {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border"
        style={{
          backgroundColor: `${color}10`,
          borderColor: `${color}30`,
        }}
      >
        <span className="text-5xl">{icon}</span>
      </div>
      <h2
        className="mb-3 font-['Inter',Helvetica] text-3xl font-bold tracking-tight"
        style={{ color }}
      >
        {title}
      </h2>
      <p className="mb-8 max-w-[300px] font-['Inter',Helvetica] text-base leading-relaxed text-[#4d5a6e]">
        {description}
      </p>
      <div className="inline-flex items-center gap-2 rounded-2xl border border-[#0d2030] bg-[#020b1c] px-6 py-3">
        <div
          className="h-2 w-2 animate-pulse rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-['Inter',Helvetica] text-sm font-medium" style={{ color }}>
          Coming Soon
        </span>
      </div>
    </div>
  );
};
