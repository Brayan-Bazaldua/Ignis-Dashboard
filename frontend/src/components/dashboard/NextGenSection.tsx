import { ArrowUpRight, Droplets, Flame, Globe2, Radar, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SectionHeading } from "@/components/ui/SectionHeading";

const WATER_MIST_URL = "https://ntrs.nasa.gov/citations/20110012300";

const FRONTS = [
  {
    key: "Detection",
    icon: Radar,
    tone: "border-ai/25 bg-ai/10 text-ai",
    accessions: ["PSI-102", "PSI-101", "NASA-SP-9407"],
  },
  {
    key: "Suppression",
    icon: Droplets,
    tone: "border-signal/25 bg-signal/10 text-signal",
    accessions: ["PSI-25", "PSI-69"],
    external: { href: WATER_MIST_URL, labelKey: "nextGenWaterMistLink" },
  },
  {
    key: "Protection",
    icon: ShieldCheck,
    tone: "border-success/25 bg-success/10 text-success",
    accessions: ["NASA-SP-9918", "NASA-SP-9582"],
  },
  {
    key: "Materials",
    icon: Flame,
    tone: "border-accent/25 bg-accent/10 text-accent",
    accessions: ["PSI-98", "PSI-99", "PSI-100"],
  },
] as const;

export async function NextGenSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return (
    <section>
      <SectionHeading
        eyebrow={t("nextGenEyebrow")}
        title={t("nextGenTitle")}
        description={t("nextGenSubtitle")}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[0.62rem] font-medium text-accent">
            <Sparkles className="h-3 w-3" />
            ISS → Earth
          </span>
        }
      />

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {FRONTS.map((front) => {
          const Icon = front.icon;
          return (
            <article
              key={front.key}
              className="glass-panel flex flex-col rounded-lg p-5 transition hover:border-border-strong"
            >
              <div className="flex items-start gap-3">
                <span className={`inline-flex shrink-0 rounded-lg border p-2.5 ${front.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-0.5 text-sm font-semibold leading-snug text-white">
                  {t(`nextGen${front.key}Title`)}
                </h3>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted">
                {t(`nextGen${front.key}Body`)}
              </p>

              <div className="mt-4 rounded-lg border border-success/20 bg-success/[0.06] p-3">
                <p className="flex items-center gap-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-success">
                  <Globe2 className="h-3 w-3" />
                  {t("nextGenEarthLabel")}
                </p>
                <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted">
                  {t(`nextGen${front.key}Earth`)}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                <span className="mr-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.14em] text-muted-2">
                  {t("nextGenEvidenceLabel")}
                </span>
                {front.accessions.map((accession) => (
                  <Link
                    key={accession}
                    href={`/${locale}/investigations/${accession}`}
                    className="rounded border border-border bg-surface-2/60 px-1.5 py-0.5 font-mono text-[0.54rem] text-muted-2 transition hover:border-accent/40 hover:text-accent"
                  >
                    {accession}
                  </Link>
                ))}
                {"external" in front && front.external ? (
                  <a
                    href={front.external.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-signal/25 bg-signal/[0.07] px-1.5 py-0.5 font-mono text-[0.54rem] text-signal/80 transition hover:border-signal/40 hover:text-signal"
                  >
                    {t(front.external.labelKey)}
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
