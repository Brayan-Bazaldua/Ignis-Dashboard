"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Atom,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Flame,
  FlaskConical,
  Gauge,
  Info,
  ListChecks,
  Loader2,
  Radar,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sigma,
  Wind,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { postScenario } from "@/lib/api";
import {
  FUELS,
  formatFixed,
  formatScientific,
  presetToRequest,
} from "@/lib/science";
import type {
  ActionPriority,
  Environment,
  PlaybookStage,
  ResponsePlaybook,
  RiskLevel,
  ScenarioPreset,
  ScienceAssessment,
  ScienceRequest,
  ScienceResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function NumberField({
  label,
  value,
  onChange,
  step = 0.01,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.62rem] uppercase tracking-[0.12em] text-muted-2">
        {label}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 font-mono text-xs text-white outline-none transition focus:border-accent/50"
      />
    </label>
  );
}

function MetricCard({
  label,
  value,
  unit,
  formula,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  formula: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-2">{label}</span>
        <span className="font-mono text-[0.54rem] text-muted-2/70">{formula}</span>
      </div>
      <p className="metric-value mt-1.5 text-lg text-white">
        {value}
        {unit ? <span className="ml-1 text-[0.6rem] font-normal text-muted-2">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-[0.58rem] leading-snug text-muted-2">{hint}</p> : null}
    </div>
  );
}

const riskTone: Record<RiskLevel, string> = {
  low: "border-success/35 bg-success/10 text-[#9af3e7]",
  moderate: "border-accent/35 bg-accent/10 text-[#a9e7fb]",
  high: "border-signal/40 bg-signal/10 text-[#ffd670]",
  critical: "border-danger/40 bg-danger/10 text-[#ffb1b1]",
};

const riskBar: Record<RiskLevel, string> = {
  low: "bg-success",
  moderate: "bg-accent",
  high: "bg-signal",
  critical: "bg-danger",
};

const priorityTone: Record<ActionPriority, string> = {
  low: "border-success/25 bg-success/10 text-[#9af3e7]",
  medium: "border-accent/25 bg-accent/10 text-[#a9e7fb]",
  high: "border-signal/30 bg-signal/10 text-[#ffd670]",
  critical: "border-danger/35 bg-danger/10 text-[#ffb1b1]",
};

const RESPONSE_RESOURCES = [
  { id: "water_mist", labelKey: "resourceWaterMist", icon: Droplets },
  { id: "co2", labelKey: "resourceCo2", icon: Wind },
  { id: "inert_gas", labelKey: "resourceInertGas", icon: Atom },
  { id: "ventilation", labelKey: "resourceVentilation", icon: Wind },
  { id: "detector", labelKey: "resourceDetector", icon: Radar },
  { id: "scba", labelKey: "resourceScba", icon: ShieldCheck },
] as const;

const RESOURCE_LABEL_KEYS: Record<string, string> = {
  water_mist: "resourceWaterMist",
  co2: "resourceCo2",
  inert_gas: "resourceInertGas",
  ventilation: "resourceVentilation",
  detector: "resourceDetector",
  scba: "resourceScba",
};

const STAGE_LABEL_KEYS: Record<PlaybookStage, string> = {
  alarm: "stageAlarm",
  protect: "stageProtect",
  isolate: "stageIsolate",
  suppress: "stageSuppress",
  verify: "stageVerify",
  recover: "stageRecover",
};

const STAGE_ICONS: Record<PlaybookStage, typeof Siren> = {
  alarm: Siren,
  protect: ShieldCheck,
  isolate: ShieldAlert,
  suppress: Droplets,
  verify: Search,
  recover: Wind,
};

const STAGE_TONES: Record<PlaybookStage, string> = {
  alarm: "border-danger/30 bg-danger/10 text-danger",
  protect: "border-signal/30 bg-signal/10 text-signal",
  isolate: "border-accent/30 bg-accent/10 text-accent",
  suppress: "border-signal/30 bg-signal/10 text-signal",
  verify: "border-success/30 bg-success/10 text-success",
  recover: "border-accent/30 bg-accent/10 text-accent",
};

function ActionPlan({
  assessment,
  locale,
}: {
  assessment: ScienceAssessment;
  locale: string;
}) {
  const t = useTranslations("science");
  const tPhase = useTranslations("labels.phase");

  const riskLabel: Record<RiskLevel, string> = {
    low: t("riskLow"),
    moderate: t("riskModerate"),
    high: t("riskHigh"),
    critical: t("riskCritical"),
  };

  const priorityLabel: Record<ActionPriority, string> = {
    low: t("priorityLow"),
    medium: t("priorityMedium"),
    high: t("priorityHigh"),
    critical: t("priorityCritical"),
  };

  return (
    <section className="glass-panel-strong overflow-hidden rounded-lg">
      <div className="border-b border-border/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-accent/80">
              <ListChecks className="h-3.5 w-3.5" />
              {t("actionPlan")}
            </p>
            <h3 className="mt-1.5 text-base font-semibold leading-snug text-white">
              {assessment.headline}
            </h3>
            <p className="mt-1 text-[0.66rem] text-muted-2">
              {assessment.habitat_label} · {t("riskScore")} {assessment.risk_score}/100
            </p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2",
              riskTone[assessment.risk_level],
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>
              <span className="block text-[0.52rem] uppercase tracking-[0.14em] opacity-80">
                {t("riskLevel")}
              </span>
              <span className="block font-mono text-[0.72rem] font-semibold">
                {riskLabel[assessment.risk_level]}
              </span>
            </span>
          </span>
        </div>

        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn("h-full rounded-full transition-all", riskBar[assessment.risk_level])}
            style={{ width: `${Math.min(100, Math.max(3, assessment.risk_score))}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[0.5rem] text-muted-2">
          <span>0</span>
          <span>30</span>
          <span>50</span>
          <span>70</span>
          <span>100</span>
        </div>

        <p className="mt-3 text-[0.72rem] leading-relaxed text-muted">{assessment.summary}</p>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <h4 className="flex items-center gap-2 text-xs font-semibold text-white">
            <AlertTriangle className="h-3.5 w-3.5 text-signal" />
            {t("drivers")}
          </h4>
          <ul className="mt-2.5 space-y-2">
            {assessment.drivers.map((driver) => (
              <li key={driver} className="flex gap-2 text-[0.66rem] leading-relaxed text-muted">
                <span className="mt-[0.38rem] h-1 w-1 shrink-0 rounded-full bg-signal/70" />
                {driver}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="flex items-center gap-2 text-xs font-semibold text-white">
            <ListChecks className="h-3.5 w-3.5 text-accent" />
            {t("actions")}
          </h4>
          <ol className="mt-2.5 space-y-2">
            {assessment.actions.map((action, index) => (
              <li
                key={action.id}
                className="rounded-lg border border-border/60 bg-surface/50 p-3"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[0.56rem] text-muted-2">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="rounded-full border border-border bg-surface-2/80 px-2 py-0.5 text-[0.54rem] font-medium text-muted">
                    {tPhase(action.phase)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[0.54rem] font-medium",
                      priorityTone[action.priority],
                    )}
                  >
                    {t("priority")} {priorityLabel[action.priority]}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold leading-snug text-white">
                  {action.title}
                </p>
                <p className="mt-1 text-[0.64rem] leading-relaxed text-muted">{action.detail}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {action.evidence.map((accession) => (
                    <Link
                      key={accession}
                      href={`/${locale}/investigations/${accession}`}
                      className="rounded border border-accent/20 bg-accent/[0.07] px-1.5 py-0.5 font-mono text-[0.52rem] text-accent/80 transition hover:border-accent/40 hover:text-accent"
                    >
                      {accession}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="border-t border-border/60 p-4 sm:p-5">
        <h4 className="flex items-center gap-2 text-xs font-semibold text-white">
          <BookOpen className="h-3.5 w-3.5 text-accent" />
          {t("references")}
        </h4>
        <div className="mt-2.5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {assessment.references.map((reference) => (
            <Link
              key={reference.accession}
              href={`/${locale}/investigations/${reference.accession}`}
              className="group rounded-lg border border-border/60 bg-surface/50 p-2.5 transition hover:border-accent/30 hover:bg-surface-2/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.56rem] text-accent/80">
                  {reference.accession}
                </span>
                <ArrowUpRight className="h-3 w-3 text-muted-2 transition group-hover:text-accent" />
              </div>
              <p className="mt-1 text-[0.7rem] font-medium leading-snug text-white group-hover:text-accent">
                {locale === "en"
                  ? reference.title
                  : reference.title_es || reference.title}
              </p>
              <p className="mt-1 text-[0.6rem] leading-snug text-muted-2">{reference.reason}</p>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-[0.58rem] leading-relaxed text-muted-2">{t("riskDisclaimer")}</p>
      </div>
    </section>
  );
}

function ResponsePlaybookPanel({
  playbook,
  locale,
}: {
  playbook: ResponsePlaybook;
  locale: string;
}) {
  const t = useTranslations("science");
  const isPartial = playbook.coverage === "partial";

  return (
    <section className="glass-panel-strong overflow-hidden rounded-lg border-signal/25">
      <div className="border-b border-border/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-signal">
              <Siren className="h-3.5 w-3.5" />
              {t("responsePlan")}
            </p>
            <h3 className="mt-1.5 text-base font-semibold leading-snug text-white">
              {playbook.headline}
            </h3>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.6rem]",
              isPartial
                ? "border-signal/35 bg-signal/10 text-signal"
                : "border-danger/35 bg-danger/10 text-danger",
            )}
          >
            {isPartial ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isPartial ? t("coveragePartial") : t("coverageLimited")}
          </span>
        </div>
        <p className="mt-2 text-[0.72rem] leading-relaxed text-muted">{playbook.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-muted-2">
            {t("responseResources")}
          </span>
          {playbook.resources.length > 0 ? (
            playbook.resources.map((resource) => (
              <span
                key={resource}
                className="rounded-full border border-border bg-surface-2/70 px-2 py-0.5 text-[0.56rem] text-muted"
              >
                {t(RESOURCE_LABEL_KEYS[resource] ?? "resourceNone")}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-danger/25 bg-danger/10 px-2 py-0.5 text-[0.56rem] text-danger">
              {t("resourceNone")}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 p-4 sm:p-5">
        {playbook.steps.map((step, index) => {
          const Icon = STAGE_ICONS[step.stage];
          return (
            <article
              key={step.id}
              className="rounded-lg border border-border/60 bg-surface/50 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md border",
                    STAGE_TONES[step.stage],
                  )}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted-2">
                  {String(index + 1).padStart(2, "0")} · {t(STAGE_LABEL_KEYS[step.stage])}
                </span>
              </div>
              <p className="mt-2 font-mono text-[0.6rem] leading-relaxed text-signal/90">
                {step.condition}
              </p>
              <p className="mt-1 text-[0.74rem] font-medium leading-relaxed text-white">
                {step.action}
              </p>
              {step.fallback ? (
                <p className="mt-1.5 text-[0.64rem] leading-relaxed text-muted">
                  <span className="font-semibold text-muted-2">{t("responseFallback")}: </span>
                  {step.fallback}
                </p>
              ) : null}
              {step.caution ? (
                <p className="mt-1.5 flex gap-1.5 text-[0.62rem] leading-relaxed text-signal/80">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {step.caution}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1">
                {step.evidence.map((accession) => (
                  <Link
                    key={accession}
                    href={`/${locale}/investigations/${accession}`}
                    className="rounded border border-signal/20 bg-signal/[0.07] px-1.5 py-0.5 font-mono text-[0.52rem] text-signal/80 transition hover:border-signal/40 hover:text-signal"
                  >
                    {accession}
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 border-t border-border/60 p-4 sm:p-5 lg:grid-cols-2">
        <div>
          <h4 className="flex items-center gap-2 text-xs font-semibold text-white">
            <XCircle className="h-3.5 w-3.5 text-danger" />
            {t("responseContraindications")}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {playbook.contraindications.map((item) => (
              <li key={item} className="flex gap-2 text-[0.64rem] leading-relaxed text-muted">
                <span className="mt-[0.38rem] h-1 w-1 shrink-0 rounded-full bg-danger/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="flex items-center gap-2 text-xs font-semibold text-white">
            <BookOpen className="h-3.5 w-3.5 text-signal" />
            {t("responseReferences")}
          </h4>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {playbook.references.map((reference) => (
              <Link
                key={reference.accession}
                href={`/${locale}/investigations/${reference.accession}`}
                className="group rounded-md border border-border/60 bg-surface/50 px-2 py-1.5 transition hover:border-signal/30 hover:bg-surface-2/60"
              >
                <span className="font-mono text-[0.54rem] text-signal/80">
                  {reference.accession}
                </span>
                <span className="mt-0.5 block text-[0.62rem] leading-snug text-muted group-hover:text-white">
                  {locale === "en"
                    ? reference.title
                    : reference.title_es || reference.title}
                </span>
              </Link>
            ))}
          </div>
          {playbook.resources.includes("water_mist") ? (
            <a
              href="https://ntrs.nasa.gov/citations/20110012300"
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-signal/25 bg-signal/[0.07] px-2 py-1.5 text-[0.6rem] leading-snug text-signal/80 transition hover:border-signal/40 hover:text-signal"
            >
              <Droplets className="h-3 w-3 shrink-0" />
              {t("responseWaterMistSource")}
              <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />
            </a>
          ) : null}
        </div>
      </div>

      <p className="border-t border-border/60 px-4 py-3 text-[0.58rem] leading-relaxed text-muted-2 sm:px-5">
        {t("responseDisclaimer")}
      </p>
    </section>
  );
}

export function ScienceLab({
  presets,
  initialPresetId,
  initialRequest,
  initialResult,
  locale,
}: {
  presets: ScenarioPreset[];
  initialPresetId: string;
  initialRequest: ScienceRequest;
  initialResult: ScienceResponse | null;
  locale: string;
}) {
  const t = useTranslations("science");
  const tEnv = useTranslations("labels.environment");
  const tGravity = useTranslations("labels.gravity");
  const [scenario, setScenario] = useState<ScienceRequest>(initialRequest);
  const [selectedPreset, setSelectedPreset] = useState(initialPresetId);
  const [result, setResult] = useState<ScienceResponse | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  function update<K extends keyof ScienceRequest>(key: K, value: ScienceRequest[K]) {
    setScenario((current) => ({ ...current, [key]: value }));
    setSelectedPreset("custom");
  }

  function environmentLabel(environment: string) {
    if (environment === "custom") return t("custom");
    if (environment === "microgravity") {
      return tGravity("microgravity");
    }
    try {
      return tEnv(environment as Environment);
    } catch {
      return environment;
    }
  }

  function presetName(preset: ScenarioPreset) {
    return locale === "en" ? preset.name_en : preset.name_es;
  }

  function presetDescription(preset: ScenarioPreset) {
    return locale === "en" ? preset.description_en : preset.description_es;
  }

  async function calculate(request: ScienceRequest) {
    if (
      request.pressure_pa <= 0 ||
      request.temperature_k <= 0 ||
      request.length_m <= 0 ||
      request.nu_m2_s <= 0
    ) {
      setError(t("validation"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await postScenario(request);
      setResult(response);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  function choosePreset(preset: ScenarioPreset) {
    const request = {
      ...presetToRequest(preset, locale === "en" ? "en" : "es"),
      resources: scenario.resources,
    };
    setScenario(request);
    setSelectedPreset(preset.id);
    void calculate(request);
  }

  function toggleResource(id: string) {
    const resources = scenario.resources.includes(id)
      ? scenario.resources.filter((resource) => resource !== id)
      : [...scenario.resources, id];
    const next = { ...scenario, resources };
    setScenario(next);
    if (result) void calculate(next);
  }

  const earthPsi = 3.09;
  const psiRatio = result ? (result.o2_partial_pressure_psi / earthPsi) * 100 : 0;
  const activePreset = presets.find((preset) => preset.id === selectedPreset);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-muted-2">
          <FlaskConical className="h-3.5 w-3.5 text-signal" />
          {t("presets")}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {presets.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => choosePreset(preset)}
                className={cn(
                  "group rounded-lg border p-3 text-left transition",
                  isActive
                    ? "border-accent/40 bg-accent/10 glow-cyan"
                    : "border-border/70 bg-surface/50 hover:border-border-strong hover:bg-surface-2/60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-xs font-semibold leading-snug",
                      isActive ? "text-accent" : "text-white",
                    )}
                  >
                    {presetName(preset)}
                  </span>
                  <span className="shrink-0 font-mono text-[0.56rem] text-muted-2">
                    {Math.round(preset.o2_fraction * 100)}% O₂
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[0.62rem] leading-snug text-muted-2">
                  {presetDescription(preset)}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.54rem] text-muted-2">
                  <span>{formatFixed(preset.pressure_pa / 1000, locale, 1)} kPa</span>
                  <span>{formatFixed(preset.gravity_m_s2, locale, 2)} m/s²</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[380px_1fr]">
        <form
          className="glass-panel rounded-lg p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void calculate(scenario);
          }}
        >
          <div className="flex items-center gap-2">
            <Sigma className="h-3.5 w-3.5 text-accent" />
            <h2 className="text-sm font-semibold text-white">{t("scenarioLabel")}</h2>
            <span className="ml-auto rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[0.56rem] text-muted-2">
              {selectedPreset === "custom" ? t("custom") : selectedPreset}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[0.62rem] uppercase tracking-[0.12em] text-muted-2">
                  {t("o2")}
                </span>
                <span className="font-mono text-[0.68rem] text-accent">
                  {Math.round(scenario.o2_fraction * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.5}
                step={0.01}
                value={scenario.o2_fraction}
                onChange={(event) => update("o2_fraction", Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[var(--accent)]"
              />
              <div className="mt-1 flex justify-between font-mono text-[0.52rem] text-muted-2">
                <span>5%</span>
                <span>21%</span>
                <span>30%</span>
                <span>50%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <NumberField
                label={t("pressureKpa")}
                value={scenario.pressure_pa / 1000}
                step={0.1}
                min={1}
                onChange={(value) => update("pressure_pa", value * 1000)}
              />
              <NumberField
                label={t("gravity")}
                value={scenario.gravity_m_s2}
                step={0.01}
                min={0}
                onChange={(value) => update("gravity_m_s2", value)}
              />
              <NumberField
                label={t("temperature")}
                value={scenario.temperature_k}
                step={1}
                min={1}
                onChange={(value) => update("temperature_k", value)}
              />
              <NumberField
                label={t("flow")}
                value={scenario.flow_velocity_m_s}
                step={0.01}
                min={0}
                onChange={(value) => update("flow_velocity_m_s", value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <NumberField
                label={t("length")}
                value={scenario.length_m}
                step={0.01}
                min={0.001}
                onChange={(value) => update("length_m", value)}
              />
              <label className="block">
                <span className="mb-1 block text-[0.62rem] uppercase tracking-[0.12em] text-muted-2">
                  {t("fuel")}
                </span>
                <select
                  value={scenario.fuel}
                  onChange={(event) => update("fuel", event.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-white outline-none transition focus:border-accent/50"
                >
                  {FUELS.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {t(fuel)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((value) => !value)}
              className="inline-flex items-center gap-1.5 text-[0.64rem] font-medium text-muted-2 transition hover:text-white"
            >
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")}
              />
              {showAdvanced ? t("hideAdvanced") : t("showAdvanced")}
            </button>

            {showAdvanced ? (
              <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border/60 bg-surface/40 p-2.5">
                <NumberField
                  label={t("beta")}
                  value={scenario.beta_1_k}
                  step={0.0001}
                  min={0.0001}
                  onChange={(value) => update("beta_1_k", value)}
                />
                <NumberField
                  label={t("deltaT")}
                  value={scenario.delta_t_k}
                  step={1}
                  min={0}
                  onChange={(value) => update("delta_t_k", value)}
                />
                <NumberField
                  label={t("nu")}
                  value={scenario.nu_m2_s}
                  step={0.000001}
                  min={0.0000001}
                  onChange={(value) => update("nu_m2_s", value)}
                />
                <NumberField
                  label={t("pr")}
                  value={scenario.pr}
                  step={0.01}
                  min={0.01}
                  onChange={(value) => update("pr", value)}
                />
                <NumberField
                  label={t("sc")}
                  value={scenario.sc}
                  step={0.01}
                  min={0.01}
                  onChange={(value) => update("sc", value)}
                />
                <NumberField
                  label={t("tauFlow")}
                  value={scenario.tau_flow_s}
                  step={0.001}
                  min={0.000001}
                  onChange={(value) => update("tau_flow_s", value)}
                />
                <NumberField
                  label={t("tauChem")}
                  value={scenario.tau_chem_s}
                  step={0.0001}
                  min={0.0000001}
                  onChange={(value) => update("tau_chem_s", value)}
                />
              </div>
            ) : null}

            <div className="rounded-lg border border-border/60 bg-surface/40 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-muted-2">
                  <Siren className="h-3 w-3 text-signal" />
                  {t("responseResources")}
                </span>
                <span className="font-mono text-[0.54rem] text-muted-2">
                  {scenario.resources.length}/{RESPONSE_RESOURCES.length}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {RESPONSE_RESOURCES.map((resource) => {
                  const Icon = resource.icon;
                  const active = scenario.resources.includes(resource.id);
                  return (
                    <button
                      key={resource.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleResource(resource.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.58rem] transition",
                        active
                          ? "border-signal/40 bg-signal/10 text-signal"
                          : "border-border bg-surface/60 text-muted-2 hover:border-border-strong hover:text-white",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {t(resource.labelKey)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[0.54rem] leading-snug text-muted-2">
                {t("responseResourcesHint")}
              </p>
            </div>

            {error ? <p className="text-[0.66rem] text-danger">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-xs font-semibold text-[#04121c] transition hover:bg-accent/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FlaskConical className="h-3.5 w-3.5" />
              )}
              {loading ? t("calculating") : t("calculate")}
            </button>
            <p className="text-[0.58rem] leading-relaxed text-muted-2">{t("runHint")}</p>
          </div>
        </form>

        <div className="min-w-0 space-y-3">
          {!result ? (
            <EmptyState
              icon={FlaskConical}
              title={t("resultEmpty")}
              description={t("resultEmptyBody")}
            />
          ) : (
            <>
              <div className="glass-panel-strong relative overflow-hidden rounded-lg p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-2">
                      {t("results")}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                      {selectedPreset === "custom"
                        ? t("custom")
                        : activePreset
                          ? presetName(activePreset)
                          : environmentLabel(result.environment)}
                    </h2>
                    <p className="mt-0.5 font-mono text-[0.62rem] text-muted-2">
                      {Math.round(result.o2_fraction * 100)}% O₂ ·{" "}
                      {formatFixed(result.pressure_pa / 1000, locale, 1)} kPa ·{" "}
                      {formatFixed(scenario.gravity_m_s2, locale, 2)} m/s²
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-signal/25 bg-signal/10 px-2.5 py-1 font-mono text-[0.62rem] text-signal">
                    <Flame className="h-3 w-3" />
                    {result.adiabatic_flame_temperature_k
                      ? `${formatFixed(result.adiabatic_flame_temperature_k, locale, 1)} K`
                      : "—"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-lg border border-accent/20 bg-accent/10 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                      <span className="text-[0.6rem] uppercase tracking-[0.12em] text-accent/80">
                        {t("partialPressure")}
                      </span>
                      <span className="font-mono text-[0.54rem] text-accent/60">
                        {t("formulaO2")}
                      </span>
                    </div>
                    <p className="metric-value mt-1 text-2xl text-white">
                      {formatFixed(result.o2_partial_pressure_psi, locale, 2)}
                      <span className="ml-1 text-[0.62rem] font-normal text-accent/70">
                        psi
                      </span>
                    </p>
                    <p className="mt-0.5 font-mono text-[0.58rem] text-muted-2">
                      {formatFixed(result.o2_partial_pressure_pa / 1000, locale, 1)} kPa
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-surface/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                      <span className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-2">
                        {t("vsEarth")}
                      </span>
                      <span className="font-mono text-[0.54rem] text-muted-2/70">3.09 psi</span>
                    </div>
                    <p className="metric-value mt-1 text-2xl text-white">
                      {Math.round(psiRatio)}
                      <span className="ml-1 text-[0.62rem] font-normal text-muted-2">%</span>
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          psiRatio > 100
                            ? "bg-signal"
                            : "bg-accent",
                        )}
                        style={{ width: `${Math.min(100, Math.max(3, psiRatio))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 2xl:grid-cols-3">
                <MetricCard
                  label={t("grashof")}
                  value={formatScientific(result.grashof, locale)}
                  formula="gβΔTL³/ν²"
                  hint={result.grashof === 0 ? t("noBuoyancy") : undefined}
                />
                <MetricCard
                  label={t("rayleigh")}
                  value={formatScientific(result.rayleigh, locale)}
                  formula="Gr × Pr"
                />
                <MetricCard
                  label={t("reynolds")}
                  value={formatScientific(result.reynolds, locale)}
                  formula="UL/ν"
                />
                <MetricCard
                  label={t("peclet")}
                  value={formatScientific(result.peclet, locale)}
                  formula="Re × Sc"
                />
                <MetricCard
                  label={t("damkohler")}
                  value={formatScientific(result.damkohler, locale)}
                  formula="τf/τc"
                />
                <MetricCard
                  label={t("radiative")}
                  value={formatScientific(result.radiative_loss_w_m2, locale)}
                  unit="W/m²"
                  formula="εσ(T⁴−T∞⁴)"
                />
              </div>

              {result.assessment ? (
                <ActionPlan assessment={result.assessment} locale={locale} />
              ) : null}

              {result.playbook ? (
                <ResponsePlaybookPanel playbook={result.playbook} locale={locale} />
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="glass-panel rounded-lg p-4">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Info className="h-3.5 w-3.5 text-accent" />
                    {t("notes")}
                  </h3>
                  <ul className="mt-2.5 space-y-2">
                    {result.notes.map((note) => (
                      <li key={note} className="flex gap-2 text-[0.68rem] leading-relaxed text-muted">
                        <span className="mt-[0.38rem] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                        {note}
                      </li>
                    ))}
                    <li className="flex gap-2 text-[0.62rem] leading-relaxed text-muted-2">
                      <span className="mt-[0.32rem] h-1 w-1 shrink-0 rounded-full bg-signal/60" />
                      {t("caution")}
                    </li>
                  </ul>
                </div>

                <div className="glass-panel rounded-lg p-4">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Gauge className="h-3.5 w-3.5 text-signal" />
                    {t("formulas")}
                  </h3>
                  <div className="mt-2.5 grid gap-1.5">
                    {[
                      t("formulaO2"),
                      t("formulaGr"),
                      t("formulaRa"),
                      t("formulaRe"),
                      t("formulaPe"),
                      t("formulaDa"),
                      t("formulaQ"),
                    ].map((formula) => (
                      <p
                        key={formula}
                        className="rounded-md border border-border/50 bg-[#060c16]/70 px-2 py-1 font-mono text-[0.62rem] text-accent/80"
                      >
                        {formula}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <details className="glass-panel group rounded-lg p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-white">
                  <Atom className="h-3.5 w-3.5 text-ai" />
                  {t("assumptions")}
                  <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-2 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2.5">
                  {result.assumptions.map((assumption) => (
                    <p key={assumption} className="text-[0.66rem] leading-relaxed text-muted-2">
                      · {assumption}
                    </p>
                  ))}
                  <p className="pt-1 font-mono text-[0.58rem] text-muted-2">
                    {result.adiabatic_flame_temperature_source}
                  </p>
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
