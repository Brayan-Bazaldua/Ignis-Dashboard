import { useTranslations } from "next-intl";

import type {
  Environment,
  FuelType,
  GravityType,
  Phase,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "cyan"
  | "amber"
  | "violet"
  | "danger"
  | "success"
  | "outline";

const variantClasses: Record<Variant, string> = {
  default: "border-border bg-surface-2/70 text-muted",
  cyan: "border-accent/30 bg-accent/10 text-[#a9e7fb]",
  amber: "border-signal/30 bg-signal/10 text-[#ffd670]",
  violet: "border-ai/30 bg-ai/10 text-[#c8bcff]",
  danger: "border-danger/30 bg-danger/10 text-[#ffb1b1]",
  success: "border-success/30 bg-success/10 text-[#9af3e7]",
  outline: "border-border-strong bg-transparent text-foreground",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-medium leading-none tracking-wide",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

const phaseVariant: Record<Phase, Variant> = {
  prevention: "cyan",
  detection: "violet",
  suppression: "amber",
};

const phaseDot: Record<Phase, string> = {
  prevention: "bg-accent",
  detection: "bg-ai",
  suppression: "bg-signal",
};

export function PhaseBadge({ value }: { value: Phase }) {
  const t = useTranslations("labels.phase");
  return (
    <Badge variant={phaseVariant[value]}>
      <span className={cn("h-1.5 w-1.5 rounded-full", phaseDot[value])} />
      {t(value)}
    </Badge>
  );
}

const environmentVariant: Record<Environment, Variant> = {
  spacecraft: "cyan",
  lunar_base: "violet",
  mars_base: "danger",
  rover: "amber",
  partial_gravity: "outline",
  earth: "success",
};

export function EnvironmentBadge({ value }: { value: Environment }) {
  const t = useTranslations("labels.environment");
  return <Badge variant={environmentVariant[value]}>{t(value)}</Badge>;
}

export function FuelBadge({ value }: { value: FuelType }) {
  const t = useTranslations("labels.fuel");
  return <Badge variant="default">{t(value)}</Badge>;
}

export function GravityBadge({ value }: { value: GravityType }) {
  const t = useTranslations("labels.gravity");
  return <Badge variant="default">{t(value)}</Badge>;
}

export function ReadinessBadge({ value }: { value: string }) {
  const t = useTranslations("labels.readiness");
  const variant: Variant =
    value === "experimental_table" ? "success" : value === "limited" ? "danger" : "default";
  const label = value === "experimental_table" || value === "metadata" || value === "limited"
    ? t(value)
    : value;
  return <Badge variant={variant}>{label}</Badge>;
}

export function PhaseDot({ value }: { value: Phase }) {
  return <span className={cn("h-2 w-2 rounded-full", phaseDot[value])} />;
}
