import { GitCompare } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CompareClient } from "@/components/compare/CompareClient";
import { getCompare, getInvestigations } from "@/lib/api";
import type { CompareResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const ids = first(query.ids)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 4);

  const [t, list, initialResult] = await Promise.all([
    getTranslations({ locale, namespace: "compare" }),
    getInvestigations({ sort: "relevance", limit: 60 }),
    ids.length >= 2
      ? getCompare(ids).catch((): CompareResponse | null => null)
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1.5 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent/80">
          <span className="h-px w-6 bg-accent/50" />
          <GitCompare className="h-3.5 w-3.5" />
          NASA PSI · {t("title")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t("subtitle")}</p>
      </div>

      <CompareClient
        items={list.items}
        locale={locale}
        initialIds={ids}
        initialResult={initialResult}
      />
    </div>
  );
}
