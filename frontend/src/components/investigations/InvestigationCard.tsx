import { ArrowUpRight, FileText, Gauge, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  EnvironmentBadge,
  GravityBadge,
  PhaseBadge,
  ReadinessBadge,
} from "@/components/ui/Badges";
import type { InvestigationCard as InvestigationCardType } from "@/lib/types";
import { localizedSummary, localizedTitle } from "@/lib/localize";
import { cn, formatScore, truncate } from "@/lib/utils";

const lineByPhase: Record<string, string> = {
  prevention: "bg-accent",
  detection: "bg-ai",
  suppression: "bg-signal",
};

export const NEXT_GEN_ACCESSIONS = new Set([
  "PSI-25",
  "PSI-69",
  "PSI-98",
  "PSI-99",
  "PSI-100",
  "PSI-101",
  "PSI-102",
]);

export function InvestigationCard({
  item,
  locale,
  className,
  featured = false,
}: {
  item: InvestigationCardType;
  locale: string;
  className?: string;
  featured?: boolean;
}) {
  const t = useTranslations("investigations");
  const primaryPhase = item.phases[0] ?? "prevention";
  const title = localizedTitle(item, locale);
  const summary = localizedSummary(item, locale);
  const score = Math.round(item.relevance_score * 100);

  return (
    <Link
      href={`/${locale}/investigations/${item.accession}`}
      className={cn(
        "card-hover group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface-2/70 p-5",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-0.5",
          lineByPhase[primaryPhase] ?? lineByPhase.prevention,
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent">
              {item.accession}
            </span>
            {item.acronym ? (
              <span className="rounded border border-border bg-white/[0.03] px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                {item.acronym}
              </span>
            ) : null}
            {NEXT_GEN_ACCESSIONS.has(item.accession) ? (
              <span className="inline-flex items-center gap-1 rounded border border-signal/30 bg-signal/10 px-1.5 py-0.5 text-[0.58rem] font-medium text-signal">
                <Sparkles className="h-2.5 w-2.5" />
                {t("nextGenBadge")}
              </span>
            ) : null}
          </div>
          <h3
            className={cn(
              "mt-2 font-semibold leading-snug tracking-tight text-white transition-colors group-hover:text-accent",
              featured ? "line-clamp-2 text-lg" : "line-clamp-2 text-[0.95rem]",
            )}
          >
            {title}
          </h3>
        </div>
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from -90deg, var(--accent) ${score}%, rgba(255,255,255,0.06) 0)`,
            }}
          />
          <div className="absolute inset-[2px] rounded-full bg-surface" />
          <span className="relative font-mono text-[0.66rem] font-medium text-accent">
            {formatScore(item.relevance_score)}
          </span>
        </div>
      </div>

      <p className={cn("mt-3 text-sm leading-relaxed text-muted", featured ? "line-clamp-3" : "line-clamp-2")}>
        {truncate(summary, featured ? 280 : 190)}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.phases.slice(0, 3).map((phase) => (
          <PhaseBadge key={phase} value={phase} />
        ))}
        {item.environments.slice(0, 2).map((environment) => (
          <EnvironmentBadge key={environment} value={environment} />
        ))}
        {item.gravity_types.slice(0, 1).map((gravity) => (
          <GravityBadge key={gravity} value={gravity} />
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-3.5 text-[0.68rem] text-muted-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <FileText className="h-3.5 w-3.5" />
            {item.publications_count}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t("relevance")}</span>
          </span>
          <ReadinessBadge value={item.data_readiness} />
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-2 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
    </Link>
  );
}
