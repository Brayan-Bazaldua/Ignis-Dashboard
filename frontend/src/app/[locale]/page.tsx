import {
  Activity,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Database,
  FileText,
  FlaskConical,
  GitCompare,
  Globe2,
  MessageSquare,
  Radar,
  ShieldCheck,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CoverageChart } from "@/components/dashboard/CoverageChart";
import { EvidenceOrbit } from "@/components/dashboard/EvidenceOrbit";
import { NextGenSection } from "@/components/dashboard/NextGenSection";
import { EvidenceMatrix } from "@/components/gaps/EvidenceMatrix";
import { InvestigationCard } from "@/components/investigations/InvestigationCard";
import { ConfidenceBar } from "@/components/ui/ConfidenceBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatCard } from "@/components/ui/StatCard";
import { getGaps, getInvestigations, getMeta } from "@/lib/api";
import type { InvestigationCard as InvestigationCardType } from "@/lib/types";

export const dynamic = "force-dynamic";

const FEATURED_ACCESSIONS = ["PSI-100", "PSI-69", "PSI-10"];

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tc, meta, gaps, list] = await Promise.all([
    getTranslations({ locale, namespace: "dashboard" }),
    getTranslations({ locale, namespace: "common" }),
    getMeta(),
    getGaps(),
    getInvestigations({ sort: "relevance", limit: 50 }),
  ]);

  const phaseCounts = {
    prevention: meta.phases.find((entry) => entry.value === "prevention")?.count ?? 0,
    detection: meta.phases.find((entry) => entry.value === "detection")?.count ?? 0,
    suppression: meta.phases.find((entry) => entry.value === "suppression")?.count ?? 0,
  };

  const byAccession = new Map(list.items.map((item) => [item.accession, item]));
  const featured = FEATURED_ACCESSIONS.map((accession) => byAccession.get(accession)).filter(
    (item): item is InvestigationCardType => Boolean(item),
  );

  return (
    <div className="space-y-12 pb-6 lg:space-y-14">
      <section className="animate-fade-up relative">
        <div className="grid items-center gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-accent">
              <Activity className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.03em] text-white sm:text-5xl xl:text-[4.1rem]">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-muted sm:text-base">
              {t("subtitle")}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/investigations`}
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#04121c] transition hover:bg-accent/90"
              >
                {t("ctaExplore")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={`/${locale}/ummia`}
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-2/60 px-4 py-2.5 text-sm font-medium text-white transition hover:border-accent/40 hover:bg-surface-2"
              >
                <MessageSquare className="h-4 w-4 text-accent" />
                {t("ctaCopilot")}
              </Link>
              <Link
                href={`/${locale}/compare`}
                className="inline-flex items-center gap-2 px-2 py-2.5 text-sm text-muted transition hover:text-white"
              >
                <GitCompare className="h-4 w-4" />
                {tc("compare")}
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.7rem] text-muted-2">
              <span className="inline-flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-border bg-surface-2/70">
                  <Database className="h-3 w-3 text-accent" />
                </span>
                NASA PSI · Combustion Science
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-mono text-accent">{meta.count}</span>
                {tc("investigations")}
              </span>
              <span className="inline-flex items-center gap-2">
                <Globe2 className="h-3.5 w-3.5" />
                ES / EN
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                NASA Space Apps 2026
              </span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[420px] lg:max-w-none">
            <EvidenceOrbit total={meta.count} counts={phaseCounts} gapCount={gaps.gaps.length} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("statsInvestigations")}
          value={meta.count}
          hint="NASA PSI · Combustion Science"
          icon={Database}
          accent="cyan"
        />
        <StatCard
          label={t("statsPublications")}
          value={meta.publications}
          hint={`${meta.experimental_tables} ${tc("tables")}`}
          icon={FileText}
          accent="violet"
        />
        <StatCard
          label={t("statsPhases")}
          value="3 / 3"
          hint={`${phaseCounts.prevention} · ${phaseCounts.detection} · ${phaseCounts.suppression}`}
          icon={ShieldCheck}
          accent="emerald"
        />
        <StatCard
          label={t("statsGaps")}
          value={gaps.gaps.length}
          hint={`${gaps.gaps.length} / ${gaps.cells.length}`}
          icon={Radar}
          accent="red"
        />
      </section>

      <section>
        <SectionHeading
          eyebrow={t("coverageEyebrow")}
          title={t("coverageTitle")}
          description={t("coverageSubtitle")}
          action={
            <Link
              href={`/${locale}/gaps`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-white"
            >
              {t("gapTitle")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <CoverageChart phases={meta.phases} fuels={meta.fuel_types} total={meta.count} />
          </div>
          <div className="glass-panel rounded-lg p-5 xl:col-span-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{t("gapTitle")}</h3>
                <p className="mt-0.5 text-xs text-muted-2">{t("gapSubtitle")}</p>
              </div>
              <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-danger/25 bg-danger/10 px-2.5 py-1 text-[0.62rem] font-medium text-danger sm:inline-flex">
                {gaps.gaps.length} {tc("noData").toLowerCase()}
              </span>
            </div>
            <EvidenceMatrix matrix={gaps} locale={locale} compact />
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border/70 bg-surface/60 px-3 py-2.5">
              <Radar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
              <p className="text-[0.7rem] leading-relaxed text-muted">{t("gapSubtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow={t("featuredEyebrow")}
          title={t("featuredTitle")}
          description={t("featuredSubtitle")}
          action={
            <Link
              href={`/${locale}/investigations`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition hover:text-accent/80"
            >
              {tc("viewAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((item) => (
            <InvestigationCard key={item.accession} item={item} locale={locale} featured />
          ))}
        </div>
      </section>

      <NextGenSection locale={locale} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel-strong relative overflow-hidden rounded-lg p-6">
          <p className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-ai">
            <BrainCircuit className="h-3.5 w-3.5" />
            {t("copilotEyebrow")}
          </p>
          <h2 className="mt-2 max-w-md text-2xl font-semibold leading-tight tracking-tight text-white">
            {t("copilotTitle")}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{t("copilotBody")}</p>

          <div className="mt-6 rounded-lg border border-border bg-[#070d18]/80 p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent">
                <MessageSquare className="h-3 w-3" />
              </span>
              <p className="text-[0.78rem] leading-relaxed text-white">{t("copilotQ")}</p>
            </div>
            <div className="mt-3.5 rounded-lg border border-border/70 bg-surface/80 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-ai/15">
                  <BrainCircuit className="h-2.5 w-2.5 text-ai" />
                </span>
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ai">
                  IGNIS
                </span>
                <span className="ml-auto font-mono text-[0.56rem] text-muted-2">mock / gemini</span>
              </div>
              <p className="text-[0.74rem] leading-relaxed text-muted">{t("copilotA")}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="badge badge-cyan">{t("copilotCitation")}</span>
                <span className="badge badge-amber">{t("copilotCitation2")}</span>
              </div>
            </div>
            <div className="mt-3">
              <ConfidenceBar value={0.86} label={tc("confidence")} />
            </div>
          </div>

          <Link
            href={`/${locale}/ummia`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent transition hover:text-accent/80"
          >
            {t("ctaCopilot")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass-panel relative overflow-hidden rounded-lg p-6">
            <p className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-signal">
              <FlaskConical className="h-3.5 w-3.5" />
              {t("labPill")}
            </p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{t("labTitle")}</h3>
                <p className="mt-1 font-mono text-[0.68rem] text-muted-2">{t("labSubtitle")}</p>
              </div>
              <span className="rounded-md border border-signal/25 bg-signal/10 px-2.5 py-1 font-mono text-lg font-semibold text-signal">
                {t("labValue")}
              </span>
            </div>
            <div className="mt-4 rounded-lg border border-border/70 bg-[#060c16]/80 px-3.5 py-3">
              <p className="font-mono text-[0.7rem] text-accent">{t("labMetric")}</p>
              <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-2">{t("labNote")}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem] text-muted-2">
              {["Ra", "Gr", "Re", "Pe", "Da", "T_ad"].map((symbol) => (
                <span
                  key={symbol}
                  className="rounded border border-border bg-surface-2/60 px-1.5 py-1 font-mono text-accent/80"
                >
                  {symbol}
                </span>
              ))}
              <span className="self-center">Cantera 3.2 · GRI 3.0</span>
            </div>
            <Link
              href={`/${locale}/science`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-signal transition hover:text-signal/80"
            >
              {t("scenarioCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass-panel rounded-lg p-6">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-success">
              {t("dataTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("dataBody")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://psi.nasa.gov/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[0.68rem] text-muted transition hover:border-success/40 hover:text-white"
              >
                <Database className="h-3.5 w-3.5" />
                NASA PSI
              </a>
              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[0.68rem] text-muted transition hover:border-accent/40 hover:text-white"
              >
                <BookOpen className="h-3.5 w-3.5" />
                {tc("learnMore")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow={t("layersEyebrow")}
          title={t("missionTitle")}
          description={t("missionBody")}
        />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: t("evidenceSummarize"),
              body: t("evidenceSummarizeBody"),
              accent: "text-accent border-accent/25 bg-accent/10",
            },
            {
              icon: Tags,
              title: t("evidenceClassify"),
              body: t("evidenceClassifyBody"),
              accent: "text-ai border-ai/25 bg-ai/10",
            },
            {
              icon: BrainCircuit,
              title: t("evidenceInterpret"),
              body: t("evidenceInterpretBody"),
              accent: "text-signal border-signal/25 bg-signal/10",
            },
          ].map((layer) => (
            <div key={layer.title} className="glass-panel rounded-lg p-5">
              <span className={`inline-flex rounded-lg border p-2.5 ${layer.accent}`}>
                <layer.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-white">{layer.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{layer.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-lg border border-accent/20 bg-surface-2/70 p-7 sm:p-9">
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("ctaTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("ctaBody")}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              href={`/${locale}/gaps`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#06101c] transition hover:bg-white/90"
            >
              {t("gapTitle")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/ummia`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              <MessageSquare className="h-4 w-4" />
              {tc("askCopilot")}
            </Link>
          </div>
        </div>
        <p className="relative mt-6 max-w-3xl border-t border-white/10 pt-4 text-[0.66rem] leading-relaxed text-muted-2">
          {tc("disclaimer")}
        </p>
      </section>
    </div>
  );
}
