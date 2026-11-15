import { FlaskConical, Sigma } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ScienceLab } from "@/components/science/ScienceLab";
import { getPresets, postScenario } from "@/lib/api";
import { presetToRequest } from "@/lib/science";
import type { ScienceResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SciencePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, presets] = await Promise.all([
    getTranslations({ locale, namespace: "science" }),
    getPresets(),
  ]);

  const initialPreset = presets[0] ?? null;
  const initialRequest = initialPreset
    ? presetToRequest(initialPreset, locale === "en" ? "en" : "es")
    : presetToRequest(
        {
          id: "earth",
          name_es: "Tierra, nivel del mar",
          name_en: "Earth, sea level",
          description_es: "",
          description_en: "",
          o2_fraction: 0.21,
          pressure_pa: 101325,
          gravity_m_s2: 9.81,
          flow_velocity_m_s: 0.05,
          temperature_k: 298.15,
          environment: "earth",
        },
        locale === "en" ? "en" : "es",
      );
  const initialResult = await postScenario(initialRequest).catch(
    (): ScienceResponse | null => null,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent/80">
            <span className="h-px w-6 bg-accent/50" />
            <Sigma className="h-3.5 w-3.5" />
            {t("presets")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <span className="badge badge-cyan">Cantera 3.2</span>
          <span className="badge badge-violet">GRI 3.0</span>
          <span className="badge badge-amber">{t("siUnits")}</span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-surface/50 px-3.5 py-2.5">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
        <p className="text-[0.66rem] leading-relaxed text-muted-2">{t("caution")}</p>
      </div>

      <ScienceLab
        presets={presets}
        initialPresetId={initialPreset?.id ?? "earth"}
        initialRequest={initialRequest}
        initialResult={initialResult}
        locale={locale}
      />
    </div>
  );
}
