import { cn } from "@/lib/utils";

export function ConfidenceBar({
  value,
  label,
  tone = "cyan",
}: {
  value: number;
  label?: string;
  tone?: "cyan" | "amber" | "emerald";
}) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  const colors = {
    cyan: "bg-accent",
    amber: "bg-signal",
    emerald: "bg-success",
  } as const;

  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-[0.68rem]">
          <span className="uppercase tracking-[0.14em] text-muted-2">{label}</span>
          <span className="font-mono text-muted">{percent}%</span>
        </div>
      ) : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full transition-all", colors[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
