import type { ScenarioPreset, ScienceRequest } from "./types";

export const DEFAULT_REQUEST: ScienceRequest = {
  o2_fraction: 0.21,
  pressure_pa: 101325,
  temperature_k: 298.15,
  gravity_m_s2: 9.81,
  flow_velocity_m_s: 0.05,
  length_m: 0.05,
  beta_1_k: 0.0033,
  delta_t_k: 100,
  nu_m2_s: 1.57e-5,
  pr: 0.71,
  sc: 0.6,
  tau_flow_s: 0.01,
  tau_chem_s: 0.001,
  fuel: "methane",
  environment: "earth",
  locale: "es",
  resources: ["water_mist", "scba", "detector", "ventilation"],
};

export const FUELS = ["methane", "ethylene", "propane", "hydrogen"] as const;

export function presetToRequest(preset: ScenarioPreset, locale: "es" | "en" = "es"): ScienceRequest {
  return {
    ...DEFAULT_REQUEST,
    o2_fraction: preset.o2_fraction,
    pressure_pa: preset.pressure_pa,
    temperature_k: preset.temperature_k,
    gravity_m_s2: preset.gravity_m_s2,
    flow_velocity_m_s: preset.flow_velocity_m_s,
    environment: preset.environment,
    locale,
  };
}

export function formatScientific(value: number, locale: string) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 10000 || absolute < 0.01) {
    return value.toExponential(2).replace("e+", "e");
  }
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatFixed(value: number, locale: string, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
