"use client";

import {
  ArrowRight,
  Check,
  GitCompare,
  Loader2,
  Minus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  EnvironmentBadge,
  FuelBadge,
  GravityBadge,
  PhaseBadge,
  ReadinessBadge,
} from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCompare } from "@/lib/api";
import { localizedSummary, localizedTitle } from "@/lib/localize";
import type {
  CompareResponse,
  Environment,
  FuelType,
  GravityType,
  InvestigationCard,
  Phase,
} from "@/lib/types";
import { cn, formatScore } from "@/lib/utils";

export function CompareClient({
  items,
  locale,
  initialIds,
  initialResult,
}: {
  items: InvestigationCard[];
  locale: string;
  initialIds: string[];
  initialResult: CompareResponse | null;
}) {
  const t = useTranslations("compare");
  const tCommon = useTranslations("common");
  const tPhase = useTranslations("labels.phase");
  const tEnv = useTranslations("labels.environment");
  const tFuel = useTranslations("labels.fuel");
  const tGravity = useTranslations("labels.gravity");

  const [selected, setSelected] = useState<string[]>(
    initialIds.filter((id) => items.some((item) => item.accession === id)).slice(0, 4),
  );
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CompareResponse | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [
        item.accession,
        item.acronym,
        item.title,
        item.title_es,
        item.summary_en,
        item.summary_es,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, query]);

  const comparisonStale =
    result !== null &&
    (result.items.length !== selected.length ||
      result.items.some((item) => !selected.includes(item.accession)));

  function toggle(accession: string) {
    setError("");
    setSelected((current) => {
      if (current.includes(accession)) {
        return current.filter((id) => id !== accession);
      }
      if (current.length >= 4) {
        setError(t("max"));
        return current;
      }
      return [...current, accession];
    });
  }

  async function runCompare() {
    if (selected.length < 2) {
      setError(t("empty"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await getCompare(selected);
      setResult(response);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  const dimensionSets = useMemo(() => {
    if (!result) return [];
    const definitions: Array<{
      key: "phases" | "environments" | "fuel_types" | "gravity_types" | "sensors";
      label: string;
      render: (value: string) => string;
    }> = [
      { key: "phases", label: t("attributePhase"), render: (value) => tPhase(value as Phase) },
      {
        key: "environments",
        label: t("attributeEnvironment"),
        render: (value) => tEnv(value as Environment),
      },
      { key: "fuel_types", label: t("attributeFuel"), render: (value) => tFuel(value as FuelType) },
      {
        key: "gravity_types",
        label: t("attributeGravity"),
        render: (value) => tGravity(value as GravityType),
      },
      { key: "sensors", label: t("attributeSensors"), render: (value) => value },
    ];
    return definitions.map((definition) => {
      const valuesPerItem = result.items.map(
        (item) => new Set<string>((item[definition.key] as string[]) ?? []),
      );
      const union = new Set(valuesPerItem.flatMap((set) => Array.from(set)));
      const shared = Array.from(union).filter((value) =>
        valuesPerItem.every((set) => set.has(value)),
      );
      return {
        ...definition,
        shared: shared.map(definition.render),
        differing: Array.from(union)
          .filter((value) => !shared.includes(value))
          .map(definition.render),
      };
    });
  }, [result, t, tEnv, tFuel, tGravity, tPhase]);

  const sharedDimensions = dimensionSets.filter((dimension) => dimension.shared.length > 0);
  const differentDimensions = dimensionSets.filter((dimension) => dimension.differing.length > 0);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
      <aside className="glass-panel rounded-lg p-4 lg:sticky lg:top-[92px]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{t("select")}</h2>
          <span className="font-mono text-[0.62rem] text-muted-2">
            {t("selectedCount", { count: selected.length })}
          </span>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-2" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-xs text-foreground outline-none transition placeholder:text-muted-2 focus:border-accent/50"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.length === 0 ? (
            <span className="text-[0.66rem] text-muted-2">{t("selectHint")}</span>
          ) : (
            selected.map((accession) => {
              const item = items.find((entry) => entry.accession === accession);
              return (
                <button
                  key={accession}
                  onClick={() => toggle(accession)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-1 font-mono text-[0.6rem] text-accent transition hover:bg-accent/15"
                  title={t("remove")}
                >
                  {item?.acronym || accession}
                  <X className="h-2.5 w-2.5" />
                </button>
              );
            })
          )}
        </div>

        <div className="scrollbar-thin mt-3 max-h-[430px] space-y-1.5 overflow-y-auto pr-1">
          {filtered.map((item) => {
            const isSelected = selected.includes(item.accession);
            const isDisabled = !isSelected && selected.length >= 4;
            return (
              <button
                key={item.accession}
                onClick={() => toggle(item.accession)}
                disabled={isDisabled}
                className={cn(
                  "w-full rounded-lg border p-2.5 text-left transition",
                  isSelected
                    ? "border-accent/35 bg-accent/[0.08]"
                    : "border-border/60 bg-surface/50 hover:border-border-strong hover:bg-surface-2/60",
                  isDisabled && "cursor-not-allowed opacity-40",
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      isSelected
                        ? "border-accent bg-accent text-[#04121c]"
                        : "border-border-strong bg-transparent",
                    )}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[0.56rem] text-accent/80">
                        {item.accession}
                      </span>
                      {item.acronym ? (
                        <span className="truncate text-[0.56rem] uppercase tracking-wide text-muted-2">
                          {item.acronym}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[0.68rem] leading-snug text-white">
                      {localizedTitle(item, locale)}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      {item.phases.map((phase) => (
                        <span
                          key={phase}
                          className={cn(
                            "h-1 w-1 rounded-full",
                            phase === "prevention"
                              ? "bg-accent"
                              : phase === "detection"
                                ? "bg-ai"
                                : "bg-signal",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={runCompare}
          disabled={loading || selected.length < 2}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-xs font-semibold text-[#04121c] transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCompare className="h-3.5 w-3.5" />}
          {loading ? t("loading") : t("compare")}
        </button>
        {error ? <p className="mt-2 text-[0.64rem] text-danger">{error}</p> : null}
      </aside>

      <div className="min-w-0 space-y-4">
        {!result ? (
          <EmptyState
            icon={GitCompare}
            title={selected.length < 2 ? t("empty") : t("compare")}
            description={selected.length < 2 ? t("selectHint") : t("evidenceNote")}
            action={
              selected.length >= 2 ? (
                <button
                  onClick={runCompare}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#04121c] transition hover:bg-accent/90 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
                  {t("compare")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-accent/80">
                  <GitCompare className="h-3.5 w-3.5" />
                  {t("resultsTitle")}
                </p>
                <h2 className="mt-1.5 text-lg font-semibold text-white">
                  {result.items.map((item) => item.acronym || item.accession).join(" · ")}
                </h2>
                <p className="mt-1 text-xs text-muted-2">{t("resultsSubtitle")}</p>
              </div>
              {comparisonStale ? (
                <button
                  onClick={runCompare}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/15"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCompare className="h-3.5 w-3.5" />}
                  {t("compare")}
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="glass-panel rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-success">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
                    <Check className="h-3 w-3" />
                  </span>
                  {t("similarities")}
                </h3>
                {sharedDimensions.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {sharedDimensions.map((dimension) => (
                      <li key={dimension.key} className="text-[0.7rem] leading-relaxed text-muted">
                        <span className="text-white">{dimension.label}:</span>{" "}
                        {dimension.shared.join(", ")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-2">{t("noShared")}</p>
                )}
              </div>
              <div className="glass-panel rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-signal">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal/15">
                    <Minus className="h-3 w-3" />
                  </span>
                  {t("differences")}
                </h3>
                {differentDimensions.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {differentDimensions.map((dimension) => (
                      <li key={dimension.key} className="text-[0.7rem] leading-relaxed text-muted">
                        <span className="text-white">{dimension.label}:</span>{" "}
                        {dimension.differing.join(", ")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-2">{t("noShared")}</p>
                )}
              </div>
            </div>

            <div className="glass-panel overflow-hidden rounded-lg">
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr className="border-b border-border/70">
                      <th className="w-[150px] px-4 py-3 text-left text-[0.6rem] uppercase tracking-[0.16em] text-muted-2">
                        {t("attribute")}
                      </th>
                      {result.items.map((item) => (
                        <th key={item.accession} className="px-4 py-3 text-left align-top">
                          <Link
                            href={`/${locale}/investigations/${item.accession}`}
                            className="group block"
                          >
                            <span className="font-mono text-[0.58rem] text-accent/80">
                              {item.accession}
                            </span>
                            <span className="mt-0.5 block text-xs font-semibold text-white group-hover:text-accent">
                              {item.acronym || item.accession}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[0.64rem] font-normal leading-snug text-muted-2">
                              {localizedTitle(item, locale)}
                            </span>
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributeSummary")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3 align-top">
                          <p className="line-clamp-4 text-[0.68rem] leading-relaxed text-muted">
                            {localizedSummary(item, locale)}
                          </p>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributePhase")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.phases.map((phase) => (
                              <PhaseBadge key={phase} value={phase} />
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributeEnvironment")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.environments.map((environment) => (
                              <EnvironmentBadge key={environment} value={environment} />
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributeFuel")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.fuel_types.length > 0 ? (
                              item.fuel_types.map((fuel) => <FuelBadge key={fuel} value={fuel} />)
                            ) : (
                              <span className="text-[0.64rem] text-muted-2">{tCommon("noData")}</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributeGravity")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.gravity_types.map((gravity) => (
                              <GravityBadge key={gravity} value={gravity} />
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributeSensors")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.sensors.slice(0, 4).map((sensor) => (
                              <span key={sensor} className="badge">
                                {sensor}
                              </span>
                            ))}
                            {item.sensors.length > 4 ? (
                              <span className="badge">+{item.sensors.length - 4}</span>
                            ) : null}
                            {item.sensors.length === 0 ? (
                              <span className="text-[0.64rem] text-muted-2">{tCommon("noData")}</span>
                            ) : null}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributePublications")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3 font-mono text-xs text-white">
                          {item.publications.length}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributeRelevance")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.07]">
                              <span
                                className="block h-full rounded-full bg-accent"
                                style={{ width: `${Math.round(item.relevance_score * 100)}%` }}
                              />
                            </span>
                            <span className="font-mono text-[0.64rem] text-accent">
                              {formatScore(item.relevance_score)}
                            </span>
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-[0.64rem] text-muted-2">{t("attributeReadiness")}</td>
                      {result.items.map((item) => (
                        <td key={item.accession} className="px-4 py-3">
                          <ReadinessBadge value={item.data_readiness} />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface/50 px-4 py-3">
              <p className="max-w-3xl text-[0.66rem] leading-relaxed text-muted-2">{t("evidenceNote")}</p>
              <Link
                href={`/${locale}/ummia`}
                className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium text-accent hover:text-accent"
              >
                {tCommon("askCopilot")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

