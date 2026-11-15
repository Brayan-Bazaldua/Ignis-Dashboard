import { Compass, Flame } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function LocaleNotFound() {
  const locale = useLocale();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel w-full max-w-xl rounded-lg p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-accent/25 bg-accent/10">
          <Flame className="h-6 w-6 animate-flame text-accent" />
        </span>
        <p className="mt-5 font-mono text-[0.64rem] uppercase tracking-[0.2em] text-muted-2">
          404 · PSI
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {locale === "es" ? "Evidencia no encontrada" : "Evidence not found"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {locale === "es"
            ? "El registro solicitado no existe en el snapshot de NASA PSI o la dirección no es válida."
            : "The requested record does not exist in the NASA PSI snapshot or the address is invalid."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href={`/${locale}/investigations`}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#04121c] transition hover:bg-accent/90"
          >
            <Compass className="h-4 w-4" />
            {locale === "es" ? "Explorar investigaciones" : "Explore investigations"}
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition hover:text-white"
          >
            {locale === "es" ? "Volver al inicio" : "Back to home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
