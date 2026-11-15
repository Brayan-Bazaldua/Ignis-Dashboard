import { cn } from "@/lib/utils";

export function FlameMascot({
  size = 44,
  state = "idle",
  label,
  className,
}: {
  size?: number;
  state?: "idle" | "thinking";
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("mascot-flame shrink-0", className)}
      data-state={state}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full" focusable="false">
        <ellipse cx="60" cy="105" rx="26" ry="5" fill="#000000" opacity="0.28" />

        <g className="flame-core">
          {/* Outer flame */}
          <path
            d="M60 10c6 20 28 30 28 54 0 20-12 34-28 34S32 84 32 64c0-16 11-22 15-34 4 9 7 15 13 20 4-8 2-22 0-40Z"
            fill="#ffb703"
          />
          {/* Inner flame */}
          <path
            d="M60 42c4 12 14 18 14 30 0 11-6 18-14 18s-14-7-14-18c0-9 6-13 8-22 2 6 4 10 7 13 2-6 1-13-1-21Z"
            fill="#ffd670"
          />
          {/* Highlight */}
          <path
            d="M49 64c-1 7 2 12 6 15-6-2-9-7-9-13 0-4 2-7 5-10-1 3-2 5-2 8Z"
            fill="#fff3c4"
            opacity="0.75"
          />

          {/* Copilot headset */}
          <path
            d="M39 57c2-11 40-11 42 0"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="38" cy="60" r="4" fill="var(--accent)" />
          <circle cx="82" cy="60" r="4" fill="var(--accent)" />

          {/* Antenna */}
          <line x1="60" y1="10" x2="60" y2="2" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="1.5" r="2.6" fill="var(--accent)" />

          {/* Face */}
          <circle cx="52" cy="68" r="3.1" fill="#1a1206" />
          <circle cx="68" cy="68" r="3.1" fill="#1a1206" />
          <circle cx="53" cy="67" r="1" fill="#ffffff" opacity="0.8" />
          <circle cx="69" cy="67" r="1" fill="#ffffff" opacity="0.8" />
          <path
            d="M54 77c2 3 4 4 6 4s4-1 6-4"
            fill="none"
            stroke="#1a1206"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="45" cy="76" r="3.6" fill="#ff7a00" opacity="0.35" />
          <circle cx="75" cy="76" r="3.6" fill="#ff7a00" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
}
