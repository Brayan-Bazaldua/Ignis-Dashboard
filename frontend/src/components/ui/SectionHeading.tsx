import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-1.5 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-accent/80">
            <span className="h-px w-6 bg-accent/50" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
