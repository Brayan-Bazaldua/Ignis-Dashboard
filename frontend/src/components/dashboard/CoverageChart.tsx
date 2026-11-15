import { useTranslations } from "next-intl";

import type { CounterItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const phaseColors: Record<string, { bar: string; dot: string }> = {
  prevention: { bar: "bg-accent", dot: "bg-accent" },
  detection: { bar: "bg-ai", dot: "bg-ai" },
  suppression: { bar: "bg-signal", dot: "bg-signal" },
};

const fuelColors: Record<string, string> = {
  gas: "bg-accent",
  solid: "bg-signal",
  liquid: "bg-ai",
};

export function CoverageChart({
  phases,
  fuels,
  total,
}: {
  phases: CounterItem[];
  fuels: CounterItem[];
  total: number;
}) {
  const tp = useTranslations("labels.phase");
  const tf = useTranslations("labels.fuel");
  const tc = useTranslations("common");
  const ti = useTranslations("investigations");

  const ordered = ["prevention", "detection", "suppression"]
    .map((phase) => phases.find((entry) => entry.value === phase))
    .filter((entry): entry is CounterItem => Boolean(entry));

  const knownFuel = fuels.reduce((sum, entry) => sum + entry.count, 0);
  const unknownFuel = Math.max(0, total - knownFuel);

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{tc("investigations")}</h3>
          <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-2">
            {tc("psiSnapshot")}
          </p>
        </div>
        <span className="font-mono text-[0.68rem] text-muted-2">n = {total}</span>
      </div>

      <div className="mt-5 space-y-4">
        {ordered.map((entry) => {
          const palette = phaseColors[entry.value] ?? phaseColors.prevention;
          const percent = Math.round((entry.count / Math.max(1, total)) * 100);
          return (
            <div key={entry.value}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs text-muted">
                  <span className={cn("h-1.5 w-1.5 rounded-full", palette.dot)} />
                  {tp(entry.value as "prevention" | "detection" | "suppression")}
                </span>
                <span className="font-mono text-xs text-white">
                  {entry.count}
                  <span className="ml-1 text-[0.62rem] text-muted-2">{percent}%</span>
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]"
                role="img"
                aria-label={`${tp(entry.value as "prevention" | "detection" | "suppression")}: ${entry.count} (${percent}%)`}
              >
                <div
                  className={cn("h-full rounded-full", palette.bar)}
                  style={{ width: `${Math.max(3, percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-border/70 pt-4">
        <div className="mb-2 flex items-center justify-between text-[0.68rem] text-muted-2">
          <span>{tc("source")}: {ti("fuel").toLowerCase()}</span>
          <span className="font-mono">{knownFuel + unknownFuel}</span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
          {fuels.map((entry) => (
            <div
              key={entry.value}
              className={cn(fuelColors[entry.value] ?? "bg-slate-500", "h-full")}
              style={{ width: `${(entry.count / Math.max(1, total)) * 100}%` }}
              title={`${tf(entry.value as "gas")}: ${entry.count}`}
            />
          ))}
          {unknownFuel > 0 ? (
            <div
              className="h-full bg-white/10"
              style={{ width: `${(unknownFuel / Math.max(1, total)) * 100}%` }}
              title={`${tc("unknown")}: ${unknownFuel}`}
            />
          ) : null}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {fuels.map((entry) => (
            <span key={entry.value} className="flex items-center gap-1.5 text-[0.64rem] text-muted-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", fuelColors[entry.value] ?? "bg-slate-500")} />
              {tf(entry.value as "gas")} · {entry.count}
            </span>
          ))}
          {unknownFuel > 0 ? (
            <span className="flex items-center gap-1.5 text-[0.64rem] text-muted-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              {tc("noData")} · {unknownFuel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
