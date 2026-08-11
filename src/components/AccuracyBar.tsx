import { severityClass, severityTextClass } from "~/lib/diagnosticUi";

/**
 * AccuracyBar — reusable severity-colored accuracy bar (extracted from
 * ReviewScreen's inline bar per UI-spec §11). Pure presentational; pct is
 * clamped to 0–100 for the fill width.
 */
interface Props {
  pct: number;
  /** Optional right label, e.g. "7/13" or "54% · 7/13". */
  caption?: string;
  size?: "sm" | "md";
}

export default function AccuracyBar({ pct, caption, size = "md" }: Props) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex items-center gap-3">
      <div className={`${size === "sm" ? "h-2" : "h-3"} flex-1 rounded-full bg-gray-100`}>
        <div
          className={`h-full rounded-full ${severityClass(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {caption !== undefined && (
        <span
          className={`shrink-0 text-right text-xs font-bold whitespace-nowrap ${severityTextClass(clamped)}`}
        >
          {caption}
        </span>
      )}
    </div>
  );
}
