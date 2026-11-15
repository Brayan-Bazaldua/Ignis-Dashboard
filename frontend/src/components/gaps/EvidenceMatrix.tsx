import Link from "next/link";
import { useTranslations } from "next-intl";

import type { GapCell, GapMatrix } from "@/lib/types";
import { cn } from "@/lib/utils";

const levelStyles: Record<GapCell["evidence_level"], string> = {
  none: "border-danger/20 bg-danger/5 text-danger",
  low: "border-signal/25 bg-signal/10 text-[#ffd670]",
  medium: "border-accent/25 bg-accent/10 text-[#a9e7fb]",
  high: "border-success/40 bg-success/15 text-white",
};

const levelDot: Record<GapCell["evidence_level"], string> = {
  none: "bg-danger",
  low: "bg-signal",
  medium: "bg-accent",
  high: "bg-success",
};

export function EvidenceMatrix({
  matrix,
  locale,
  compact = false,
}: {
  matrix: GapMatrix;
  locale: string;
  compact?: boolean;
}) {
  const t = useTranslations("gaps");
  const tp = useTranslations("labels.phase");
  const te = useTranslations("labels.environment");
  const tphase = useTranslations("labels.phase");

  const lookup = new Map(
    matrix.cells.map((cell) => [`${cell.phase}:${cell.environment}`, cell]),
  );

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto">
        <div className={cn(compact ? "min-w-[466px]" : "min-w-[760px]")}>
          <div
            className={cn("grid items-stretch", compact ? "gap-1" : "gap-1.5")}
            style={{
              gridTemplateColumns: `${
                compact ? "76px" : "120px"
              } repeat(${matrix.environments.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="flex items-end pb-2">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-2">
                {t("phases")} ↓ / {t("environments")} →
              </span>
            </div>
            {matrix.environments.map((environment) => (
              <div
                key={environment}
                className={cn(
                  "flex items-end justify-center pb-2 text-center",
                  compact ? "px-0.5" : "px-1",
                )}
              >
                <span
                  className={cn(
                    "font-medium leading-tight text-muted",
                    compact ? "text-[0.56rem]" : "text-[0.62rem]",
                  )}
                >
                  {te(environment)}
                </span>
              </div>
            ))}

            {matrix.phases.map((phase) => (
              <div key={phase} className="contents">
                <div className="flex items-center rounded-lg border border-border/60 bg-surface/60 px-2.5">
                  <span className={cn("font-medium text-white", compact ? "text-[0.66rem]" : "text-[0.72rem]")}>
                    {tp(phase)}
                  </span>
                </div>
                {matrix.environments.map((environment) => {
                  const cell = lookup.get(`${phase}:${environment}`);
                  if (!cell) {
                    return <div key={environment} className="rounded-lg border border-border/40" />;
                  }
                  const content = (
                    <>
                      <div
                        className={cn(
                          "flex w-full items-center gap-1",
                          compact ? "justify-center gap-1.5" : "justify-between",
                        )}
                      >
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            compact ? "text-base" : "text-xl",
                          )}
                        >
                          {cell.count}
                        </span>
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            levelDot[cell.evidence_level],
                          )}
                        />
                      </div>
                      {!compact ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {cell.accessions.slice(0, 3).map((accession) => (
                            <span
                              key={accession}
                              className="rounded border border-white/10 bg-black/20 px-1 py-0.5 font-mono text-[0.54rem] text-white/70"
                            >
                              {accession.replace("PSI-", "")}
                            </span>
                          ))}
                          {cell.accessions.length > 3 ? (
                            <span className="text-[0.54rem] text-muted-2">
                              +{cell.accessions.length - 3}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  );
                  const classes = cn(
                    "group flex flex-col justify-between rounded-lg border transition-all",
                    compact ? "min-h-[48px] p-1.5" : "min-h-[78px] p-2.5 hover:-translate-y-0.5",
                    levelStyles[cell.evidence_level],
                    cell.count === 0 ? "border-dashed" : "hover:border-white/25",
                  );
                  const label = `${tphase(phase)} · ${te(environment)}: ${cell.count} ${t("evidence").toLowerCase()}`;
                  return cell.count > 0 ? (
                    <Link
                      key={environment}
                      href={`/${locale}/investigations?phase=${phase}&environment=${environment}`}
                      className={classes}
                      title={label}
                      aria-label={label}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={environment} className={classes} title={label} aria-label={label}>
                      {content}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3.5">
        {(["none", "low", "medium", "high"] as const).map((level) => (
          <span key={level} className="flex items-center gap-1.5 text-[0.64rem] text-muted-2">
            <span className={cn("h-1.5 w-1.5 rounded-full", levelDot[level])} />
            {t(level)}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-3 font-mono text-[0.62rem] text-muted-2">
          <span className="xl:hidden">{locale === "es" ? "Desliza →" : "Scroll →"}</span>
          {matrix.cells.length} {locale === "es" ? "celdas" : "cells"}
        </span>
      </div>
    </div>
  );
}
