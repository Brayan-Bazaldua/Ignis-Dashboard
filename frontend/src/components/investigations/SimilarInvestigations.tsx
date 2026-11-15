import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { EnvironmentBadge, PhaseBadge } from "@/components/ui/Badges";
import { localizedTitle } from "@/lib/localize";
import type { SimilarInvestigation } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SimilarInvestigations({
  items,
  locale,
  className,
}: {
  items: SimilarInvestigation[];
  locale: string;
  className?: string;
}) {
  const t = useTranslations("detail");

  if (items.length === 0) return null;

  return (
    <div className={cn("glass-panel rounded-lg p-5", className)}>
      <h3 className="text-sm font-semibold text-white">{t("similar")}</h3>
      <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-2">{t("relatedDescription")}</p>
      <div className="mt-4 space-y-2">
        {items.map((entry) => (
          <Link
            key={entry.item.accession}
            href={`/${locale}/investigations/${entry.item.accession}`}
            className="group block rounded-lg border border-border/70 bg-surface/60 p-3 transition hover:border-accent/30 hover:bg-surface-2/70"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.6rem] text-accent/80">
                    {entry.item.accession}
                  </span>
                  <span className="text-[0.6rem] text-muted-2">
                    {Math.round(entry.similarity * 100)}%
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-white group-hover:text-accent">
                  {localizedTitle(entry.item, locale)}
                </p>
              </div>
              <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-2 group-hover:text-accent" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.item.phases.slice(0, 2).map((phase) => (
                <PhaseBadge key={phase} value={phase} />
              ))}
              {entry.item.environments.slice(0, 1).map((environment) => (
                <EnvironmentBadge key={environment} value={environment} />
              ))}
            </div>
            <p className="mt-2 line-clamp-1 text-[0.6rem] text-muted-2">
              {entry.reasons.join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
