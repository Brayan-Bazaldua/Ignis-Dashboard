import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "cyan",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  accent?: "cyan" | "amber" | "violet" | "emerald" | "red";
  className?: string;
}) {
  const accents = {
    cyan: "text-accent border-accent/25 bg-accent/10",
    amber: "text-signal border-signal/25 bg-signal/10",
    violet: "text-ai border-ai/25 bg-ai/10",
    emerald: "text-success border-success/25 bg-success/10",
    red: "text-danger border-danger/25 bg-danger/10",
  } as const;

  return (
    <div
      className={cn(
        "glass-panel group relative overflow-hidden rounded-lg p-4 transition-colors hover:border-border-strong",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-2">
          {label}
        </p>
        {Icon ? (
          <span className={cn("rounded-md border p-1.5", accents[accent])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <p className="metric-value mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1.5 text-[0.7rem] leading-snug text-muted-2">{hint}</p> : null}
      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-border-strong/60 to-transparent" />
    </div>
  );
}
