import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Code2,
  Database,
  ExternalLink,
  FlaskConical,
  GitCompare,
  Globe2,
  Layers3,
  Microscope,
  Rocket,
  Server,
  ShieldCheck,
  Sigma,
  Tags,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tc, tm] = await Promise.all([
    getTranslations({ locale, namespace: "about" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "metrics" }),
  ]);

  const steps = [
    { icon: GitCompare, title: t("step1Title"), body: t("step1Body") },
    { icon: Tags, title: t("step2Title"), body: t("step2Body") },
    { icon: Sigma, title: t("step3Title"), body: t("step3Body") },
    { icon: BrainCircuit, title: t("step4Title"), body: t("step4Body") },
  ];

  const architecture = [
    {
      label: "UI",
      icon: Globe2,
      title: locale === "es" ? "Interfaz bilingüe" : "Bilingual interface",
      body: t("archUIBody"),
      tone: "text-accent border-accent/20 bg-accent/10",
    },
    {
      label: "API",
      icon: Server,
      title: locale === "es" ? "API científica" : "Scientific API",
      body: t("archAPIBody"),
      tone: "text-ai border-ai/20 bg-ai/10",
    },
    {
      label: "SCI",
      icon: FlaskConical,
      title: locale === "es" ? "Motor de cálculo" : "Calculation engine",
      body: t("archScienceBody"),
      tone: "text-signal border-signal/20 bg-signal/10",
    },
    {
      label: "AI",
      icon: BrainCircuit,
      title: locale === "es" ? "Capa neuro-simbólica" : "Neuro-symbolic layer",
      body: t("archAIBody"),
      tone: "text-success border-success/20 bg-success/[0.07]",
    },
  ];

  const roles = [
    { title: t("roleProduct"), body: t("roleProductBody"), icon: Target },
    { title: t("roleFrontend"), body: t("roleFrontendBody"), icon: Code2 },
    { title: t("roleBackend"), body: t("roleBackendBody"), icon: Database },
    { title: t("roleAI"), body: t("roleAIBody"), icon: BrainCircuit },
    { title: t("roleScience"), body: t("roleScienceBody"), icon: Microscope },
  ];

  const roadmap = [
    { title: t("mvpTitle"), body: t("mvpBody"), tone: "border-accent/25 bg-accent/10" },
    { title: t("nextTitle"), body: t("nextBody"), tone: "border-ai/25 bg-ai/10" },
    { title: t("visionTitle"), body: t("visionBody"), tone: "border-signal/25 bg-signal/10" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-1.5 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent/80">
          <span className="h-px w-6 bg-accent/50" />
          <BookOpen className="h-3.5 w-3.5" />
          IGNIS · v0.1
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{t("subtitle")}</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel-strong relative overflow-hidden rounded-lg p-6 lg:col-span-2">
          <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-accent/80">
            <Rocket className="h-3.5 w-3.5" />
            {t("missionTitle")}
          </p>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">{t("missionBody")}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "30", value: tc("investigations") },
              { label: "3", value: t("phases") },
              { label: "ES/EN", value: tc("language") },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border/70 bg-surface/50 px-3 py-2.5">
                <p className="metric-value text-xl font-semibold text-white">{stat.label}</p>
                <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-muted-2">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-lg p-6">
          <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-success/80">
            <Database className="h-3.5 w-3.5" />
            {t("dataTitle")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("dataBody")}</p>
          <a
            href="https://psi.nasa.gov/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent"
          >
            NASA PSI
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Pipeline"
          title={t("pipelineTitle")}
          description={t("pipelineSubtitle")}
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="glass-panel relative rounded-lg p-5">
              <span className="absolute right-4 top-4 font-mono text-[0.6rem] text-muted-2">
                0{index + 1}
              </span>
              <span className="inline-flex rounded-lg border border-border bg-surface-2/70 p-2.5 text-accent">
                <step.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-white">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-12">
        <div className="glass-panel rounded-lg p-5 lg:col-span-7">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-ai/20 bg-ai/10 text-ai">
              <Layers3 className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-sm font-semibold text-white">{t("archTitle")}</h2>
          </div>
          <div className="mt-4 space-y-2">
            {architecture.map((layer) => (
              <div
                key={layer.label}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface/50 p-3"
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", layer.tone)}>
                  <layer.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.56rem] uppercase tracking-[0.14em] text-muted-2">
                      {layer.label}
                    </span>
                    <span className="text-xs font-medium text-white">{layer.title}</span>
                  </div>
                  <p className="mt-0.5 text-[0.66rem] leading-relaxed text-muted">{layer.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="glass-panel rounded-lg p-5">
            <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-signal/80">
              <Sigma className="h-3.5 w-3.5" />
              {t("scienceTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("scienceBody")}</p>
            <div className="mt-3 grid gap-1.5">
              {["p(O₂) = y(O₂) × P", "Gr = gβΔTL³/ν²", "Ra = Gr × Pr", "Da = τflujo / τquímica"].map(
                (formula) => (
                  <p
                    key={formula}
                    className="rounded-md border border-border/50 bg-[#060c16]/70 px-2 py-1 font-mono text-[0.64rem] text-signal/80"
                  >
                    {formula}
                  </p>
                ),
              )}
            </div>
          </div>
          <div className="rounded-lg border border-danger/15 bg-danger/5 p-5">
            <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-danger/80">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("limitsTitle")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{t("limitsBody")}</p>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Team" title={t("rolesTitle")} description={t("teamBody")} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {roles.map((role) => (
            <div key={role.title} className="glass-panel rounded-lg p-4">
              <span className="inline-flex rounded-lg border border-border bg-surface-2/70 p-2 text-accent">
                <role.icon className="h-3.5 w-3.5" />
              </span>
              <h3 className="mt-2.5 text-xs font-semibold text-white">{role.title}</h3>
              <p className="mt-1 text-[0.64rem] leading-relaxed text-muted-2">{role.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Roadmap" title={t("roadmapTitle")} description={t("roadmapBody")} />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {roadmap.map((item, index) => (
            <div key={item.title} className={cn("rounded-lg border p-5", item.tone)}>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-black/20 font-mono text-[0.58rem] text-white">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-lg p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-accent/80">
                {tm("eyebrow")}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">{tm("title")}</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
                {tm("subtitle")}
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/metrics`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs text-muted transition hover:border-accent/40 hover:text-white"
          >
            {tm("exploreMetrics")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="glass-panel rounded-lg p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-accent/80">
              <Workflow className="h-3.5 w-3.5" />
              {t("methodTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("methodBody")}</p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ai/80">
              <Users className="h-3.5 w-3.5" />
              {t("reproTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("reproBody")}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-[0.66rem] leading-relaxed text-muted-2">{t("sourceBody")}</p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/${locale}/ummia`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-[#04121c] transition hover:bg-accent/90"
            >
              {tc("askCopilot")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="https://psi.nasa.gov/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs text-muted transition hover:text-white"
            >
              {t("sourceTitle")}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <p className="mt-4 text-[0.62rem] leading-relaxed text-muted-2">{tc("disclaimer")}</p>
      </section>
    </div>
  );
}
