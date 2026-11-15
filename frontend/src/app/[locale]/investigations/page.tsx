import { ArrowRight, Filter, RotateCcw, Search, SearchX, Tag } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InvestigationCard } from "@/components/investigations/InvestigationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getInvestigations, getMeta } from "@/lib/api";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 text-xs text-foreground outline-none transition focus:border-accent/50";

const QUICK_SEARCHES = ["PSI-99", "PSI-102", "PSI-106", "NASA-SP-9407", "SLICE", "SAFFIRE"];

export default async function InvestigationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const q = first(query.q);
  const phase = first(query.phase);
  const environment = first(query.environment);
  const fuelType = first(query.fuel_type);
  const gravityType = first(query.gravity_type);
  const readiness = first(query.readiness);
  const sort = first(query.sort) || "relevance";

  const [t, tc, tp, te, tf, tg, tr, meta, result] = await Promise.all([
    getTranslations({ locale, namespace: "investigations" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "labels.phase" }),
    getTranslations({ locale, namespace: "labels.environment" }),
    getTranslations({ locale, namespace: "labels.fuel" }),
    getTranslations({ locale, namespace: "labels.gravity" }),
    getTranslations({ locale, namespace: "labels.readiness" }),
    getMeta(),
    getInvestigations({
      q,
      phase,
      environment,
      fuel_type: fuelType,
      gravity_type: gravityType,
      readiness,
      sort,
      limit: 60,
    }),
  ]);

  const activeFilters = [
    q ? `“${q}”` : "",
    phase ? tp(phase as "prevention") : "",
    environment ? te(environment as "spacecraft") : "",
    fuelType ? tf(fuelType as "gas") : "",
    gravityType ? tg(gravityType as "microgravity") : "",
    readiness ? tr(readiness as "metadata") : "",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent/80">
            <span className="h-px w-6 bg-accent/50" />
            NASA PSI · {locale === "es" ? "Evidencia indexada" : "Indexed evidence"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/gaps`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-white"
        >
          {tc("learnMore")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <form
        method="GET"
        action={`/${locale}/investigations`}
        className="glass-panel rounded-lg p-4"
      >
        <div className="flex items-center gap-2 pb-3 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-muted-2">
          <Filter className="h-3.5 w-3.5 text-accent" />
          {t("filters")}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          <label className="relative sm:col-span-2 lg:col-span-4">
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
            <input
              name="q"
              defaultValue={q}
              placeholder={t("searchPlaceholder")}
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-2 focus:border-accent/50"
            />
          </label>

          <label className="lg:col-span-2">
            <span className="sr-only">{t("phase")}</span>
            <select name="phase" defaultValue={phase} className={SELECT_CLASS}>
              <option value="">{t("phase")}</option>
              {meta.phases.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {tp(entry.value as "prevention")} ({entry.count})
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-2">
            <span className="sr-only">{t("environment")}</span>
            <select name="environment" defaultValue={environment} className={SELECT_CLASS}>
              <option value="">{t("environment")}</option>
              {meta.environments.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {te(entry.value as "spacecraft")} ({entry.count})
                </option>
              ))}
              <option value="lunar_base">{te("lunar_base")} (0)</option>
              <option value="mars_base">{te("mars_base")} (0)</option>
              <option value="rover">{te("rover")} (0)</option>
              <option value="partial_gravity">{te("partial_gravity")} (0)</option>
            </select>
          </label>

          <label className="lg:col-span-2">
            <span className="sr-only">{t("fuel")}</span>
            <select name="fuel_type" defaultValue={fuelType} className={SELECT_CLASS}>
              <option value="">{t("fuel")}</option>
              {meta.fuel_types.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {tf(entry.value as "gas")} ({entry.count})
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-2">
            <span className="sr-only">{t("sort")}</span>
            <select name="sort" defaultValue={sort} className={SELECT_CLASS}>
              <option value="relevance">{t("sortRelevance")}</option>
              <option value="title">{t("sortTitle")}</option>
              <option value="date_desc">{t("sortDate")}</option>
              <option value="score_asc">{t("score")} ↑</option>
            </select>
          </label>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          <label className="lg:col-span-2">
            <span className="sr-only">{t("gravity")}</span>
            <select name="gravity_type" defaultValue={gravityType} className={SELECT_CLASS}>
              <option value="">{t("gravity")}</option>
              {meta.gravity_types.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {tg(entry.value as "microgravity")} ({entry.count})
                </option>
              ))}
              <option value="normal_gravity">{tg("normal_gravity")} (0)</option>
              <option value="partial_gravity">{tg("partial_gravity")} (0)</option>
            </select>
          </label>

          <label className="lg:col-span-2">
            <span className="sr-only">{t("readiness")}</span>
            <select name="readiness" defaultValue={readiness} className={SELECT_CLASS}>
              <option value="">{t("readiness")}</option>
              <option value="experimental_table">{tr("experimental_table")}</option>
              <option value="metadata">{tr("metadata")}</option>
              <option value="limited">{tr("limited")}</option>
            </select>
          </label>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-8 lg:justify-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-semibold text-[#04121c] transition hover:bg-accent/90"
            >
              <Search className="h-3.5 w-3.5" />
              {t("apply")}
            </button>
            <Link
              href={`/${locale}/investigations`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted transition hover:border-border-strong hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("clear")}
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-3">
          <span className="mr-1 flex items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted-2">
            <Tag className="h-3 w-3 text-accent" />
            {t("quickSearch")}
          </span>
          {QUICK_SEARCHES.map((term) => (
            <Link
              key={term}
              href={`/${locale}/investigations?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-border bg-surface/60 px-2.5 py-0.5 font-mono text-[0.56rem] text-muted transition hover:border-accent/40 hover:text-accent"
            >
              {term}
            </Link>
          ))}
          <span className="ml-auto hidden text-[0.56rem] text-muted-2 md:inline">
            {t("searchHint")}
          </span>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-white">
            {t("results", { count: result.total })}
          </span>
          {activeFilters.length > 0 ? (
            <span className="hidden text-[0.68rem] text-muted-2 sm:inline">·</span>
          ) : null}
          {activeFilters.map((filter) => (
            <span key={filter} className="badge badge-cyan">
              {filter}
            </span>
          ))}
        </div>
        <span className="text-[0.66rem] text-muted-2">{tc("psiSnapshot")} · 2026</span>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t("noResults")}
          description={t("noResultsHint")}
          action={
            <Link
              href={`/${locale}/investigations`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#04121c] transition hover:bg-accent/90"
            >
              <RotateCcw className="h-4 w-4" />
              {t("clear")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((item) => (
            <InvestigationCard key={item.accession} item={item} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
