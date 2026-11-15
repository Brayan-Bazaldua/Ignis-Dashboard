import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Database,
  FileText,
  Flame,
  GraduationCap,
  Repeat2,
  Rocket,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatCard } from "@/components/ui/StatCard";
import { getMeta } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MetricsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, meta] = await Promise.all([
    getTranslations({ locale, namespace: "metrics" }),
    getMeta(),
  ]);

  const rows = [
    {
      icon: Search,
      pillar: t("row1Pillar"),
      measures: t("row1Measures", { count: meta.count }),
      result: t("row1Result"),
      href: `/${locale}/compare`,
      tone: "border-accent/25 bg-accent/10 text-accent",
    },
    {
      icon: Flame,
      pillar: t("row2Pillar"),
      measures: t("row2Measures"),
      result: t("row2Result"),
      href: `/${locale}/science`,
      tone: "border-signal/25 bg-signal/10 text-signal",
    },
    {
      icon: AlertTriangle,
      pillar: t("row3Pillar"),
      measures: t("row3Measures"),
      result: t("row3Result"),
      href: `/${locale}/gaps`,
      tone: "border-danger/25 bg-danger/10 text-danger",
    },
    {
      icon: BadgeCheck,
      pillar: t("row4Pillar"),
      measures: t("row4Measures"),
      result: t("row4Result"),
      href: `/${locale}/ummia`,
      tone: "border-ai/25 bg-ai/10 text-ai",
    },
  ];

  const pillars = [
    {
      id: "01",
      icon: Search,
      title: t("pillar1Title"),
      tag: t("pillar1Tag"),
      intro: t("pillar1Intro"),
      metrics: [
        { title: t("pillar1Metric1Title"), body: t("pillar1Metric1Body") },
        { title: t("pillar1Metric2Title"), body: t("pillar1Metric2Body") },
      ],
      href: `/${locale}/compare`,
      link: t("pillar1Link"),
      iconTone: "border-accent/25 bg-accent/10 text-accent",
      badgeTone: "badge-cyan",
    },
    {
      id: "02",
      icon: Flame,
      title: t("pillar2Title"),
      tag: t("pillar2Tag"),
      intro: t("pillar2Intro"),
      metrics: [
        { title: t("pillar2Metric1Title"), body: t("pillar2Metric1Body") },
        { title: t("pillar2Metric2Title"), body: t("pillar2Metric2Body") },
      ],
      href: `/${locale}/science`,
      link: t("pillar2Link"),
      iconTone: "border-signal/25 bg-signal/10 text-signal",
      badgeTone: "badge-amber",
    },
    {
      id: "03",
      icon: AlertTriangle,
      title: t("pillar3Title"),
      tag: t("pillar3Tag"),
      intro: t("pillar3Intro"),
      metrics: [
        { title: t("pillar3Metric1Title"), body: t("pillar3Metric1Body") },
        { title: t("pillar3Metric2Title"), body: t("pillar3Metric2Body") },
      ],
      href: `/${locale}/gaps`,
      link: t("pillar3Link"),
      iconTone: "border-danger/25 bg-danger/10 text-danger",
      badgeTone: "badge-danger",
    },
    {
      id: "04",
      icon: BadgeCheck,
      title: t("pillar4Title"),
      tag: t("pillar4Tag"),
      intro: t("pillar4Intro"),
      metrics: [
        { title: t("pillar4Metric1Title"), body: t("pillar4Metric1Body") },
        { title: t("pillar4Metric2Title"), body: t("pillar4Metric2Body") },
      ],
      href: `/${locale}/ummia`,
      link: t("pillar4Link"),
      iconTone: "border-ai/25 bg-ai/10 text-ai",
      badgeTone: "badge-violet",
    },
  ];

  const beneficiaries = [
    {
      icon: ShieldCheck,
      title: t("beneficiary1Title"),
      tag: t("beneficiary1Tag"),
      body: t("beneficiary1Body"),
      tone: "text-accent border-accent/25 bg-accent/10",
    },
    {
      icon: Rocket,
      title: t("beneficiary2Title"),
      tag: t("beneficiary2Tag"),
      body: t("beneficiary2Body"),
      tone: "text-ai border-ai/25 bg-ai/10",
    },
    {
      icon: GraduationCap,
      title: t("beneficiary3Title"),
      tag: t("beneficiary3Tag"),
      body: t("beneficiary3Body"),
      tone: "text-signal border-signal/25 bg-signal/10",
    },
    {
      icon: Flame,
      title: t("beneficiary4Title"),
      tag: t("beneficiary4Tag"),
      body: t("beneficiary4Body"),
      tone: "text-danger border-danger/25 bg-danger/10",
    },
    {
      icon: BadgeCheck,
      title: t("beneficiary5Title"),
      tag: t("beneficiary5Tag"),
      body: t("beneficiary5Body"),
      tone: "text-success border-success/25 bg-success/10",
    },
  ];

  return (
    <div className="space-y-10 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent/80">
            <span className="h-px w-6 bg-accent/50" />
            <BarChart3 className="h-3.5 w-3.5" />
            {t("eyebrow")}
          </p>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <span className="badge badge-cyan">{t("badgeSources")}</span>
          <span className="badge badge-amber">{t("badgeLanguages")}</span>
          <span className="badge badge-success">{t("badgeReproducible")}</span>
        </div>
      </div>

      <section className="glass-panel overflow-hidden rounded-xl">
        <div className="border-b border-border/60 p-5">
          <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-accent/80">
            <BarChart3 className="h-3.5 w-3.5" />
            {t("tableEyebrow")}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
            {t("tableTitle")}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">
            {t("tableBody")}
          </p>
        </div>
        <div
          className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          tabIndex={0}
          role="region"
          aria-label={t("tableTitle")}
        >
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-[0.58rem] uppercase tracking-[0.14em] text-muted-2">
                <th className="px-5 py-3 font-medium">{t("tablePillar")}</th>
                <th className="px-5 py-3 font-medium">{t("tableMeasures")}</th>
                <th className="px-5 py-3 font-medium">{t("tableResult")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const Icon = row.icon;
                return (
                  <tr
                    key={row.pillar}
                    className="border-b border-border/40 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 align-top">
                      <Link
                        href={row.href}
                        className="group inline-flex items-start gap-2.5 font-semibold leading-snug text-white transition hover:text-accent"
                      >
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${row.tone}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span>
                          {row.pillar}
                          <ArrowRight className="ml-1 inline h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 align-top leading-relaxed text-muted">
                      {row.measures}
                    </td>
                    <td className="px-5 py-4 align-top leading-relaxed text-muted-2">
                      {row.result}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border/60 px-5 py-2 text-[0.6rem] text-muted-2 sm:hidden">
          {t("tableScrollHint")}
        </p>
      </section>

      <section>
        <SectionHeading
          eyebrow={t("pillarsEyebrow")}
          title={t("pillarsTitle")}
          description={t("pillarsBody")}
        />
        <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.id} className="glass-panel flex h-full flex-col rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border ${pillar.iconTone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${pillar.badgeTone}`}>{pillar.tag}</span>
                    <span className="font-mono text-[0.6rem] text-muted-2">{pillar.id}</span>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-snug text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.intro}</p>
                <div className="mt-4 grid gap-3">
                  {pillar.metrics.map((metric, index) => (
                    <div
                      key={metric.title}
                      className="rounded-lg border border-border/60 bg-surface/40 p-3.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 font-mono text-[0.58rem] text-accent/80">
                          {pillar.id}.{index + 1}
                        </span>
                        <h4 className="text-xs font-semibold leading-snug text-white">
                          {metric.title}
                        </h4>
                      </div>
                      <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted">
                        {metric.body}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href={pillar.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent transition hover:text-white"
                >
                  {pillar.link}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow={t("baseEyebrow")}
          title={t("baseTitle")}
          description={t("baseBody")}
        />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t("baseSources")}
            value={meta.count}
            hint={t("baseSourcesHint")}
            icon={Database}
            accent="cyan"
          />
          <StatCard
            label={t("basePublications")}
            value={meta.publications}
            hint={t("basePublicationsHint")}
            icon={FileText}
            accent="violet"
          />
          <StatCard
            label={t("baseLanguages")}
            value={2}
            hint={t("baseLanguagesHint")}
            icon={BookOpen}
            accent="amber"
          />
          <StatCard
            label={t("baseReproducible")}
            value="100%"
            hint={t("baseReproducibleHint")}
            icon={Repeat2}
            accent="emerald"
          />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow={t("beneficiariesEyebrow")}
          title={t("beneficiariesTitle")}
          description={t("beneficiariesBody")}
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {beneficiaries.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="glass-panel rounded-lg p-4 transition-colors hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${item.tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full border border-border bg-surface-2/70 px-2 py-0.5 text-[0.56rem] font-medium text-muted">
                    {item.tag}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-snug text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[0.68rem] leading-relaxed text-muted">
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="glass-panel-strong rounded-xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">{t("ctaTitle")}</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              {t("ctaBody")}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/${locale}/compare`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-[#04121c] transition hover:bg-accent/90"
            >
              {t("ctaCompare")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/${locale}/science`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs text-muted transition hover:text-white"
            >
              {t("ctaScience")}
            </Link>
            <Link
              href={`/${locale}/gaps`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs text-muted transition hover:text-white"
            >
              {t("ctaGaps")}
            </Link>
            <Link
              href={`/${locale}/ummia`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs text-muted transition hover:text-white"
            >
              {t("ctaUmmia")}
            </Link>
          </div>
        </div>
        <div className="mt-4 border-t border-border/60 pt-4">
          <Link
            href={`/${locale}/about`}
            className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-white"
          >
            {t("ctaSecondary")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
