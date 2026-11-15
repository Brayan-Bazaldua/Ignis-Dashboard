import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Phase } from "@/lib/types";
import { cn } from "@/lib/utils";

const RING_DEFINITIONS: Array<{
  phase: Phase;
  radius: number;
  color: string;
  dot: string;
  offset: number;
}> = [
  { phase: "prevention", radius: 168, color: "var(--accent)", dot: "bg-accent", offset: -Math.PI / 2 },
  { phase: "detection", radius: 128, color: "var(--ai)", dot: "bg-ai", offset: -Math.PI / 2 + 0.35 },
  { phase: "suppression", radius: 88, color: "var(--signal)", dot: "bg-signal", offset: -Math.PI / 2 + 0.7 },
];

export function EvidenceOrbit({
  total,
  counts,
  gapCount,
}: {
  total: number;
  counts: Record<Phase, number>;
  gapCount: number;
}) {
  const t = useTranslations("labels.phase");
  const tc = useTranslations("common");
  const tg = useTranslations("gaps");
  const td = useTranslations("dashboard");

  return (
    <div className="glass-panel-strong relative overflow-hidden rounded-xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-accent">
            NASA PSI · {tc("psiSnapshot")}
          </p>
          <h3 className="mt-1 text-sm font-medium text-white">{td("evidenceField")}</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[0.62rem] font-medium text-success">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
          {td("liveSnapshot")}
        </span>
      </div>

      <div className="relative mx-auto mt-3 aspect-square w-full max-w-[360px]">
        <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
        <div className="absolute inset-0 animate-[spin_70s_linear_infinite] rounded-full opacity-40 [background:conic-gradient(from_0deg,transparent_0deg,rgba(76,201,240,0.14)_38deg,transparent_82deg,rgba(124,92,255,0.10)_160deg,transparent_210deg,rgba(255,183,3,0.08)_280deg,transparent_330deg)]" />

        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={td("evidenceField")}
        >
          <defs>
            <filter id="ignis-dot-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="ignis-core" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#0e2a3d" />
              <stop offset="60%" stopColor="#0a1524" />
              <stop offset="100%" stopColor="#070d18" />
            </radialGradient>
          </defs>

          {RING_DEFINITIONS.map((ring) => (
            <circle
              key={ring.phase}
              cx="200"
              cy="200"
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeOpacity="0.14"
              strokeWidth="1"
              strokeDasharray="2 7"
            />
          ))}

          <g stroke="var(--accent)" strokeOpacity="0.12" strokeWidth="1">
            {Array.from({ length: 48 }).map((_, index) => {
              const angle = (index / 48) * Math.PI * 2;
              const inner = 184;
              const outer = index % 4 === 0 ? 192 : 188;
              return (
                <line
                  key={index}
                  x1={200 + Math.cos(angle) * inner}
                  y1={200 + Math.sin(angle) * inner}
                  x2={200 + Math.cos(angle) * outer}
                  y2={200 + Math.sin(angle) * outer}
                />
              );
            })}
          </g>

          <circle cx="200" cy="200" r="64" fill="url(#ignis-core)" stroke="var(--border)" />

          {RING_DEFINITIONS.map((ring) => {
            const count = counts[ring.phase] ?? 0;
            return (
              <g key={ring.phase} filter="url(#ignis-dot-glow)">
                {Array.from({ length: count }).map((_, index) => {
                  const jitter = ((index * 37) % 9) - 4;
                  const angle = (index / Math.max(1, count)) * Math.PI * 2 + ring.offset;
                  const radius = ring.radius + jitter;
                  const x = 200 + Math.cos(angle) * radius;
                  const y = 200 + Math.sin(angle) * radius;
                  return (
                    <circle
                      key={`${ring.phase}-${index}`}
                      cx={x}
                      cy={y}
                      r={index % 5 === 0 ? 3.4 : 2.4}
                      fill={ring.color}
                      fillOpacity={index % 3 === 0 ? 0.92 : 0.58}
                    />
                  );
                })}
              </g>
            );
          })}

          <circle cx="200" cy="92" r="3" fill="var(--accent)" opacity="0.9" />
          <circle cx="318" cy="250" r="2.4" fill="var(--ai)" opacity="0.8" />
          <circle cx="106" cy="290" r="2.4" fill="var(--signal)" opacity="0.8" />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full border border-accent/20 bg-[#08111f]/95 text-center">
            <Flame className="mb-0.5 h-5 w-5 animate-flame text-accent" />
            <span className="metric-value text-3xl font-semibold text-white">{total}</span>
            <span className="max-w-[88px] text-[0.56rem] uppercase leading-tight tracking-[0.14em] text-muted-2">
              {tc("investigations")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-4">
        {RING_DEFINITIONS.map((ring) => (
          <div
            key={ring.phase}
            className="min-w-0 rounded-md border border-border/60 bg-surface/40 px-2 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ring.dot)} />
              <span className="truncate text-[0.6rem] leading-tight text-muted-2">
                {t(ring.phase)}
              </span>
            </span>
            <p className="metric-value mt-1 text-sm font-medium text-white">
              {counts[ring.phase] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-danger/15 bg-danger/5 px-3 py-2.5">
        <span className="text-[0.68rem] text-danger/80">{tg("gapsTitle")}</span>
        <span className="font-mono text-[0.72rem] font-medium text-danger">{gapCount} / 18</span>
      </div>
    </div>
  );
}
