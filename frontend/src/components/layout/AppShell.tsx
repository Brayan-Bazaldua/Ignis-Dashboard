"use client";

import {
  ArrowUpRight,
  BarChart3,
  Database,
  Flame,
  FlaskConical,
  GitCompare,
  Globe2,
  Grid3X3,
  Info,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/investigations", key: "investigations", icon: Search },
  { href: "/compare", key: "compare", icon: GitCompare },
  { href: "/gaps", key: "gaps", icon: Grid3X3 },
  { href: "/ummia", key: "copilot", icon: MessageSquare },
  { href: "/science", key: "science", icon: FlaskConical },
  { href: "/metrics", key: "metrics", icon: BarChart3 },
  { href: "/about", key: "about", icon: Info },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const activeItem = useMemo(() => {
    const candidates = navItems
      .filter((item) => item.href !== "/")
      .sort((a, b) => b.href.length - a.href.length);
    return (
      candidates.find(
        (item) =>
          pathname === `/${locale}${item.href}` ||
          pathname.startsWith(`/${locale}${item.href}/`),
      ) ?? navItems[0]
    );
  }, [locale, pathname]);

  function switchLocale(nextLocale: "es" | "en") {
    const segments = pathname.split("/");
    if (segments.length > 2) {
      segments[1] = nextLocale;
      router.push(segments.join("/"));
    } else {
      router.push(`/${nextLocale}`);
    }
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = search.trim();
    router.push(
      `/${locale}/investigations${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    );
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface-3 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:ring-2 focus:ring-accent/60"
      >
        {locale === "es" ? "Saltar al contenido" : "Skip to content"}
      </a>
      <div className="pointer-events-none fixed inset-0 -z-10 grid-bg opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-accent/[0.04] to-transparent" />

      {mobileOpen ? (
        <button
          aria-label={tc("closeNav")}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-border/80 bg-[#060b14]/95 px-4 pb-5 pt-5 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-1">
          <Link href={`/${locale}`} className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
              <Flame className="animate-flame h-6 w-6 text-accent" />
            </span>
            <span>
              <span className="block text-[1.05rem] font-semibold tracking-[0.22em] text-white">
                IGNIS
              </span>
              <span className="block text-[0.62rem] uppercase tracking-[0.18em] text-muted-2">
                {tc("brandTagline")}
              </span>
            </span>
          </Link>
          <button
            className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label={tc("closeNav")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7 flex items-center gap-2 rounded-lg border border-border/80 bg-surface/40 px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">
            {tc("psiSnapshot")}
          </span>
          <span className="ml-auto font-mono text-[0.68rem] text-success">30</span>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label={t("mission")}>
          <p className="px-2 pb-2 text-[0.62rem] uppercase tracking-[0.22em] text-muted-2">
            {t("mission")}
          </p>
          {navItems.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive = pathname === href || (item.href !== "/" && pathname.startsWith(`${href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "border-l-2 border-l-accent bg-accent/10 text-white"
                    : "text-muted hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-accent" : "text-muted-2 group-hover:text-accent",
                  )}
                />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 rounded-lg border border-border/80 bg-surface/40 p-3.5">
          <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-muted-2">
            <Database className="h-3.5 w-3.5 text-accent" />
            NASA PSI
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {tc("disclaimer")}
          </p>
          <Link
            href={`/${locale}/about`}
            className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-accent hover:text-accent/80"
          >
            {tc("learnMore")}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-2 px-1 text-[0.62rem] text-muted-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          NASA Space Apps Challenge 2026
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-[#060b14]/85 backdrop-blur-lg">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              className="rounded-lg border border-border p-2 text-muted hover:bg-white/5 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={tc("openNav")}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-0 items-center gap-2 text-xs text-muted-2 sm:flex">
              <Flame className="animate-flame h-3.5 w-3.5 text-accent" />
              <span className="font-mono uppercase tracking-[0.14em]">IGNIS</span>
              <span className="text-border-strong">/</span>
              <span className="truncate text-muted">{t(activeItem.key)}</span>
            </div>

            <form
              onSubmit={submitSearch}
              className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-md"
            >
              <label className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={locale === "es" ? "Buscar evidencia…" : "Search evidence…"}
                  className="h-10 w-full rounded-lg border border-border bg-surface/80 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-2 focus:border-accent/50 focus:bg-surface-2/80"
                  aria-label={locale === "es" ? "Buscar investigaciones" : "Search investigations"}
                />
              </label>
            </form>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface/70 p-1">
              <Globe2 className="ml-1.5 h-3.5 w-3.5 text-muted-2" />
              {(["es", "en"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => switchLocale(option)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide transition",
                    locale === option
                      ? "bg-accent/15 text-accent"
                      : "text-muted-2 hover:text-white",
                  )}
                  aria-pressed={locale === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="relative mx-auto w-full max-w-[1500px] flex-1 px-4 pb-16 pt-6 outline-none focus-visible:shadow-none sm:px-6 lg:px-8 lg:pt-8"
        >
          {children}
        </main>

        <footer className="border-t border-border/60 px-4 py-6 text-xs text-muted-2 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              IGNIS · {tc("tagline")} · NASA Space Apps Challenge 2026
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              NASA PSI snapshot · 2026
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

