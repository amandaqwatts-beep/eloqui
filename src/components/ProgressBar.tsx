interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="text-burgundy-700 font-medium">
          {current} / {total}
        </span>
        <span className="text-gray-500">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-burgundy-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-burgundy-600 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
