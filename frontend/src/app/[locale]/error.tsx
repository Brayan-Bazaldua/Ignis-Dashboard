"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel w-full max-w-xl rounded-lg p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-danger/25 bg-danger/10 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-white">
          {locale === "es" ? "La señal se interrumpió" : "Signal interrupted"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {locale === "es"
            ? "No se pudo cargar la evidencia desde la API de IGNIS. Verifica que el backend esté en ejecución y vuelve a intentar."
            : "Evidence could not be loaded from the IGNIS API. Check that the backend is running and try again."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#04121c] transition hover:bg-accent/90"
          >
            <RefreshCcw className="h-4 w-4" />
            {locale === "es" ? "Reintentar" : "Retry"}
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition hover:text-white"
          >
            {locale === "es" ? "Volver al inicio" : "Back to home"}
          </Link>
        </div>
        <p className="mt-5 font-mono text-[0.6rem] text-muted-2">
          GET /api/health · http://127.0.0.1:8000
        </p>
      </div>
    </div>
  );
}
