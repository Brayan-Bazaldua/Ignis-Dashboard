import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Grid3X3,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EvidenceMatrix } from "@/components/gaps/EvidenceMatrix";
import { StatCard } from "@/components/ui/StatCard";
import { getGaps } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function GapsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tc, tp, te, gaps] = await Promise.all([
    getTranslations({ locale, namespace: "gaps" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "labels.phase" }),
    getTranslations({ locale, namespace: "labels.environment" }),
    getGaps(),
  ]);

  const covered = gaps.cells.filter((cell) => cell.count > 0).length;
  const environmentsWithout = new Set(gaps.gaps.map((cell) => cell.environment)).size;
  const maxStrongest = Math.max(1, ...gaps.strongest.map((cell) => cell.count));

  const gapGroups = gaps.environments
    .map((environment) => ({
      environment,
      cells: gaps.gaps.filter((cell) => cell.environment === environment),
    }))
    .filter((group) => group.cells.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent/80">
            <span className="h-px w-6 bg-accent/50" />
            <Grid3X3 className="h-3.5 w-3.5" />
            {t("allGaps")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/investigations`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3.5 py-2.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-white"
        >
          {tc("viewAll")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("coverageTitle")}
          value={`${Math.round((covered / gaps.cells.length) * 100)}%`}
          hint={t("coverageValue", { covered, total: gaps.cells.length })}
          icon={TrendingUp}
          accent="cyan"
        />
        <StatCard
          label={t("openCells")}
          value={gaps.gaps.length}
          hint="NASA PSI snapshot"
          icon={AlertTriangle}
          accent="red"
        />
        <StatCard
          label={t("environmentsWithout")}
          value={environmentsWithout}
          hint={gaps.environments
            .filter((environment) =>
              gaps.gaps.some((cell) => cell.environment === environment),
            )
            .map((environment) => te(environment))
            .join(" · ")}
          icon={Compass}
          accent="amber"
        />
      </div>

      <section className="glass-panel rounded-lg p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">{t("coverageTitle")}</h2>
            <p className="mt-0.5 text-xs text-muted-2">
              {t("evidence")} · {gaps.phases.length} × {gaps.environments.length}
            </p>
          </div>
          <span className="font-mono text-[0.68rem] text-accent">
            {t("coverageValue", { covered, total: gaps.cells.length })}
          </span>
        </div>
        <EvidenceMatrix matrix={gaps} locale={locale} />
        <p className="mt-4 flex items-start gap-2 text-[0.66rem] leading-relaxed text-muted-2">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
          {t("partialGravityNote")}
        </p>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <section className="glass-panel rounded-lg p-5 lg:col-span-7">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-danger/20 bg-danger/[0.07] text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">{t("gapsTitle")}</h2>
              <p className="text-[0.66rem] text-muted-2">{t("gapsSubtitle")}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {gapGroups.map((group) => (
              <div
                key={group.environment}
                className="rounded-lg border border-danger/15 bg-danger/[0.035] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white">
                    {te(group.environment)}
                  </span>
                  <span className="rounded-full border border-danger/25 bg-danger/10 px-1.5 py-0.5 font-mono text-[0.56rem] text-danger">
                    {group.cells.length} / {gaps.phases.length}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  {group.cells.map((cell) => (
                    <div
                      key={`${cell.phase}-${cell.environment}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-1.5 text-[0.64rem] text-muted">
                        <span className="h-1 w-1 rounded-full bg-danger" />
                        {tp(cell.phase)}
                      </span>
                      <span className="font-mono text-[0.56rem] text-danger/80">
                        {t("none")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border/60 bg-surface/60 p-3.5">
            <p className="flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-signal">
              <Target className="h-3.5 w-3.5" />
              {t("opportunityTitle")}
            </p>
            <p className="mt-1.5 text-[0.68rem] leading-relaxed text-muted-2">
              {t("opportunityBody")}
            </p>
          </div>
        </section>

        <section className="glass-panel rounded-lg p-5 lg:col-span-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/20 bg-accent/[0.07] text-accent">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">{t("strongest")}</h2>
              <p className="text-[0.66rem] text-muted-2">{t("strongestNote")}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {gaps.strongest.map((cell) => (
              <Link
                key={`${cell.phase}-${cell.environment}`}
                href={`/${locale}/investigations?phase=${cell.phase}&environment=${cell.environment}`}
                className="group block rounded-lg border border-border/60 bg-surface/60 p-3 transition hover:border-accent/30 hover:bg-surface-2/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.7rem] text-white">
                    {tp(cell.phase)} · {te(cell.environment)}
                  </span>
                  <span className="font-mono text-[0.66rem] text-accent">
                    {t("count", { count: cell.count })}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.max(8, (cell.count / maxStrongest) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-lg border border-signal/20 bg-surface-2/70 p-5 lg:col-span-7">
          <p className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-signal/80">
            <Lightbulb className="h-3.5 w-3.5" />
            {t("insightTitle")}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("insightBody")}</p>
        </div>
        <div className="glass-panel flex flex-col justify-between rounded-lg p-5 lg:col-span-5">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-ai/80">
              {tc("askCopilot")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {locale === "es"
                ? "Pregunta a Ummia por la evidencia disponible para un entorno concreto y obtén una respuesta con citas."
                : "Ask Ummia about the evidence available for a specific environment and get an answer with citations."}
            </p>
          </div>
          <Link
            href={`/${locale}/ummia`}
            className="mt-4 inline-flex items-center gap-2 self-start rounded-lg bg-ai px-3.5 py-2 text-xs font-semibold text-[#0b0618] transition hover:bg-ai/90"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {tc("askCopilot")}
          </Link>
        </div>
      </section>
    </div>
  );
}
