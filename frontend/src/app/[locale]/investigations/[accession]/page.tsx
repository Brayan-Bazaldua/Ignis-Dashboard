import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  FlaskConical,
  GitCompare,
  Layers3,
  MessageSquare,
  Quote,
  Tag,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SimilarInvestigations } from "@/components/investigations/SimilarInvestigations";
import {
  EnvironmentBadge,
  FuelBadge,
  GravityBadge,
  PhaseBadge,
  ReadinessBadge,
} from "@/components/ui/Badges";
import { getInvestigation, getSimilar } from "@/lib/api";
import { localizedFindings, localizedLimitations, localizedSummary, localizedTitle } from "@/lib/localize";
import type { InvestigationDetail, SimilarInvestigation } from "@/lib/types";
import { cn, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function TextSection({
  icon: Icon,
  title,
  body,
  empty,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  empty: string;
}) {
  return (
    <section className="glass-panel rounded-lg p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/20 bg-accent/[0.07] text-accent">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="rich-text mt-3 text-sm text-muted">
        {body ? body : <span className="text-muted-2">{empty}</span>}
      </div>
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">{label}</p>
      <p className="mt-1 line-clamp-2 break-words text-xs leading-snug text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

export default async function InvestigationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; accession: string }>;
}) {
  const { locale, accession } = await params;
  setRequestLocale(locale);

  let item: InvestigationDetail;
  try {
    item = await getInvestigation(accession);
  } catch {
    notFound();
  }

  const [t, td, tc, similar] = await Promise.all([
    getTranslations({ locale, namespace: "investigations" }),
    getTranslations({ locale, namespace: "detail" }),
    getTranslations({ locale, namespace: "common" }),
    getSimilar(accession, 4).catch((): SimilarInvestigation[] => []),
  ]);

  const title = localizedTitle(item, locale);
  const summary = localizedSummary(item, locale);
  const findings = localizedFindings(item, locale);
  const limitations = localizedLimitations(item, locale);
  const score = Math.round(item.relevance_score * 100);
  const tableSize = item.experimental_table?.file_size
    ? `${(item.experimental_table.file_size / 1024).toFixed(1)} KB`
    : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[0.68rem] text-muted-2">
        <Link
          href={`/${locale}/investigations`}
          className="inline-flex items-center gap-1.5 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {td("backToList")}
        </Link>
        <span className="text-border-strong">/</span>
        <span className="font-mono text-accent/80">{item.accession}</span>
      </div>

      <section className="relative overflow-hidden rounded-lg border border-border bg-surface-2/70 p-6 sm:p-8">
        <div className="relative grid gap-7 lg:grid-cols-[1fr_260px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-accent/25 bg-accent/[0.08] px-2 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-accent">
                {item.accession}
              </span>
              {item.acronym ? (
                <span className="rounded-md border border-border bg-white/[0.03] px-2 py-1 text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  {item.acronym}
                </span>
              ) : null}
              <span className="text-[0.64rem] uppercase tracking-[0.14em] text-muted-2">
                NASA PSI · {item.research_area || "Combustion Science"}
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl xl:text-[2.4rem]">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{summary}</p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {item.phases.map((phase) => (
                <PhaseBadge key={phase} value={phase} />
              ))}
              {item.environments.map((environment) => (
                <EnvironmentBadge key={environment} value={environment} />
              ))}
              {item.fuel_types.map((fuel) => (
                <FuelBadge key={fuel} value={fuel} />
              ))}
              {item.gravity_types.map((gravity) => (
                <GravityBadge key={gravity} value={gravity} />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border/70 pt-4 sm:grid-cols-3">
              <MetaItem label={td("platform")} value={item.flight_platform || tc("unknown")} />
              <MetaItem label={td("startDate")} value={item.start_date || tc("unknown")} />
              <MetaItem label={td("endDate")} value={item.end_date || tc("unknown")} />
              <MetaItem label={td("center")} value={item.managing_center || tc("unknown")} />
              <MetaItem label={td("agency")} value={item.sponsoring_agency || tc("unknown")} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-border bg-[#070d18]/80 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from -90deg, #4cc9f0 ${score}%, rgba(255,255,255,0.07) 0)`,
                    }}
                  />
                  <div className="absolute inset-[3px] rounded-full bg-[#070d18]" />
                  <span className="metric-value relative text-lg font-semibold text-accent">
                    {score}%
                  </span>
                </div>
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-2">
                    {td("evidenceScore")}
                  </p>
                  <div className="mt-1.5">
                    <ReadinessBadge value={item.data_readiness} />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[0.64rem] leading-relaxed text-muted-2">{td("scoreNote")}</p>
              <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    item.classification_source === "curated" ? "bg-success" : "bg-signal",
                  )}
                />
                <span className="text-[0.6rem] text-muted-2">
                  {item.classification_source === "curated" ? td("curated") : td("keyword")}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Link
                href={`/${locale}/compare?ids=${item.accession}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#04121c] transition hover:bg-accent/90"
              >
                <GitCompare className="h-3.5 w-3.5" />
                {td("compare")}
              </Link>
              <Link
                href={`/${locale}/ummia?accession=${item.accession}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-xs font-medium text-white transition hover:border-accent/40"
              >
                <MessageSquare className="h-3.5 w-3.5 text-accent" />
                {td("ask")}
              </Link>
              {item.source_url ? (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:border-border-strong hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {td("source")}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <TextSection
            icon={FlaskConical}
            title={td("objective")}
            body={item.objective}
            empty={tc("noData")}
          />
          <TextSection
            icon={Layers3}
            title={td("approach")}
            body={item.approach}
            empty={tc("noData")}
          />
          <TextSection
            icon={TrendingUp}
            title={td("impacts")}
            body={item.research_impacts}
            empty={tc("noData")}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <section className="glass-panel rounded-lg p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-success/20 bg-success/[0.07] text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-semibold text-white">{td("findings")}</h2>
              </div>
              {findings.length > 0 ? (
                <ul className="mt-3 space-y-2.5">
                  {findings.map((finding, index) => (
                    <li key={`${index}-${finding.slice(0, 20)}`} className="flex gap-2.5 text-xs leading-relaxed text-muted">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success/80" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted-2">{td("noFindings")}</p>
              )}
            </section>

            <section className="glass-panel rounded-lg p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-signal/20 bg-signal/[0.07] text-signal">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-semibold text-white">{td("limitations")}</h2>
              </div>
              {limitations.length > 0 ? (
                <ul className="mt-3 space-y-2.5">
                  {limitations.map((limitation, index) => (
                    <li key={`${index}-${limitation.slice(0, 20)}`} className="flex gap-2.5 text-xs leading-relaxed text-muted">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal/80" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted-2">{td("noLimitations")}</p>
              )}
            </section>
          </div>

          <p className="rounded-lg border border-border/60 bg-surface/40 px-3.5 py-2.5 text-[0.64rem] leading-relaxed text-muted-2">
            {td("synthesisNote")}
          </p>

          <p className="rounded-lg border border-border/60 bg-surface/40 px-3.5 py-2.5 text-[0.64rem] leading-relaxed text-muted-2">
            {td("originalLanguage")}
          </p>

          <section className="glass-panel rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-ai/20 bg-ai/[0.07] text-ai">
                  <BookOpen className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-semibold text-white">{td("publications")}</h2>
              </div>
              <span className="font-mono text-[0.64rem] text-muted-2">
                {item.publications.length}
              </span>
            </div>
            {item.publications.length > 0 ? (
              <div className="mt-3 space-y-2">
                {item.publications.map((publication, index) => (
                  <div
                    key={`${publication.doi}-${index}`}
                    className="rounded-lg border border-border/60 bg-surface/50 p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 font-mono text-[0.6rem] text-muted-2">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-snug text-white">{publication.title}</p>
                        {publication.authors ? (
                          <p className="mt-1 line-clamp-2 text-[0.64rem] leading-relaxed text-muted-2">
                            {publication.authors}
                          </p>
                        ) : null}
                        {publication.url ? (
                          <a
                            href={publication.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 font-mono text-[0.6rem] text-accent hover:text-accent"
                          >
                            {td("doi")}: {publication.doi || truncate(publication.url, 40)}
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-2">{td("noPublications")}</p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <section className="glass-panel rounded-lg p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/20 bg-accent/[0.07] text-accent">
                <Tag className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-semibold text-white">{td("conditions")}</h2>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
                  {td("classification")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.phases.map((phase) => (
                    <PhaseBadge key={phase} value={phase} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
                  {t("environment")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.environments.map((environment) => (
                    <EnvironmentBadge key={environment} value={environment} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
                    {t("fuel")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.fuel_types.length > 0
                      ? item.fuel_types.map((fuel) => <FuelBadge key={fuel} value={fuel} />)
                      : <span className="text-[0.68rem] text-muted-2">{tc("noData")}</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
                    {t("gravity")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.gravity_types.map((gravity) => (
                      <GravityBadge key={gravity} value={gravity} />
                    ))}
                  </div>
                </div>
              </div>

              {item.sensors.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
                    {td("sensors")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.sensors.map((sensor) => (
                      <span key={sensor} className="badge">
                        {sensor}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {item.hardware.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
                    {td("hardware")}
                  </p>
                  <div className="space-y-1.5">
                    {item.hardware.map((hardware) => (
                      <p key={hardware} className="flex items-start gap-2 text-[0.68rem] text-muted">
                        <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-muted-2" />
                        <span className="min-w-0 break-words">{hardware}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              {item.keywords.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
                    {td("keywords")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.keywords.slice(0, 12).map((keyword) => (
                      <span key={keyword} className="badge">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="border-t border-border/60 pt-3 text-[0.62rem] leading-relaxed text-muted-2">
                {td("classificationNote")}
              </p>
            </div>
          </section>

          <section className="glass-panel rounded-lg p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-success/20 bg-success/[0.07] text-success">
                <Database className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-semibold text-white">{td("data")}</h2>
            </div>
            <div className="mt-3 space-y-2.5 text-[0.68rem]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-2">{td("dataReadiness")}</span>
                <ReadinessBadge value={item.data_readiness} />
              </div>
              {item.experimental_table ? (
                <div className="rounded-lg border border-border/60 bg-surface/60 p-2.5">
                  <p className="flex items-center gap-1.5 text-[0.64rem] font-medium text-white">
                    <FileText className="h-3 w-3 text-success" />
                    {td("experimentalTable")}
                  </p>
                  <p className="mt-1 break-all font-mono text-[0.58rem] text-muted-2">
                    {item.experimental_table.file_name || "—"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[0.58rem] text-muted-2">
                    {tableSize ? (
                      <span>
                        {td("fileSize")}: {tableSize}
                      </span>
                    ) : null}
                    <span>
                      {td("access")}:{" "}
                      {item.experimental_table.restricted ? td("restricted") : td("public")}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[0.64rem] leading-relaxed text-muted-2">
                  {td("noExperimentalTable")}
                </p>
              )}
              <p className="text-[0.6rem] leading-relaxed text-muted-2">{td("dataNote")}</p>
              {item.doi ? (
                <a
                  href={`https://doi.org/${item.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[0.6rem] text-accent hover:text-accent"
                >
                  DOI: {item.doi}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : null}
              {item.source_url ? (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[0.6rem] text-accent hover:text-accent"
                >
                  {td("sourceRecord")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          </section>

          <section className="glass-panel rounded-lg p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-ai/20 bg-ai/[0.07] text-ai">
                <Users className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-semibold text-white">{td("contacts")}</h2>
            </div>
            {item.contacts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {item.contacts.slice(0, 4).map((contact) => (
                  <div key={contact.name} className="rounded-lg border border-border/60 bg-surface/50 px-2.5 py-2">
                    <p className="text-[0.7rem] font-medium text-white">{contact.name}</p>
                    <p className="mt-0.5 text-[0.58rem] text-muted-2">
                      {contact.role}
                      {contact.affiliation ? ` · ${contact.affiliation}` : ""}
                    </p>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="mt-1 block truncate text-[0.58rem] text-accent/80 hover:text-accent"
                      >
                        {contact.email}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[0.64rem] text-muted-2">{td("noContacts")}</p>
            )}
          </section>

          <SimilarInvestigations items={similar} locale={locale} />
        </aside>
      </div>

      <section className="flex flex-col items-start justify-between gap-4 rounded-lg border border-accent/20 bg-surface-2/70 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <Quote className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium text-white">{td("evidence")}</p>
            <p className="mt-0.5 max-w-xl text-[0.68rem] leading-relaxed text-muted">
              {tc("disclaimer")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/compare?ids=${item.accession}`}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#06101c] transition hover:bg-white/90"
          >
            <GitCompare className="h-3.5 w-3.5" />
            {td("compare")}
          </Link>
          <a
            href="https://psi.nasa.gov/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs text-muted transition hover:text-white"
          >
            NASA PSI
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
}
