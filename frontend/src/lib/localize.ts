import type { InvestigationCard as InvestigationCardType } from "@/lib/types";

export function localizedTitle(item: InvestigationCardType, locale: string) {
  return locale === "es" ? item.title_es || item.title : item.title;
}

export function localizedSummary(item: InvestigationCardType, locale: string) {
  return locale === "es" ? item.summary_es || item.summary_en : item.summary_en || item.summary_es;
}

export function localizedFindings(
  item: { key_findings: string[]; key_findings_es: string[] },
  locale: string,
) {
  return locale === "es" ? item.key_findings_es || item.key_findings : item.key_findings;
}

export function localizedLimitations(
  item: { limitations: string[]; limitations_es: string[] },
  locale: string,
) {
  return locale === "es" ? item.limitations_es || item.limitations : item.limitations;
}
