import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center rounded-xl px-6 py-14 text-center">
      {Icon ? (
        <span className="mb-4 rounded-lg border border-border bg-surface-2/70 p-3 text-muted">
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
