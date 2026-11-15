import Image from "next/image";

import { cn } from "@/lib/utils";

export function UmmiaAvatar({
  pose = "front",
  speaking = false,
  size = 96,
  alt,
  className,
}: {
  pose?: "front" | "side";
  speaking?: boolean;
  size?: number;
  alt?: string;
  className?: string;
}) {
  const src =
    pose === "side" ? "/ummia/ummia-side.jpg" : "/ummia/ummia-front.jpg";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-2/80 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
        className,
      )}
      style={{ width: size, height: size }}
      role={alt ? "img" : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
    >
      <Image
        src={src}
        alt={alt ?? ""}
        width={size}
        height={size}
        unoptimized
        className={cn(
          "h-full w-full object-cover transition-transform duration-300",
          speaking ? "scale-[1.03]" : "scale-100",
        )}
      />
      {speaking ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-accent/80">
          <span className="block h-full w-1/3 animate-pulse bg-white/80" />
        </span>
      ) : null}
    </div>
  );
}
