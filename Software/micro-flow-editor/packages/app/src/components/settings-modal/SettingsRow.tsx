import type { ReactNode } from "react";

export function SettingsSwitch({
  checked,
  onChange,
  label,
}: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-slpill ${checked ? "bg-brand-blue" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-e1 transition-[left] duration-200 ${checked ? "left-4" : "left-0.5"}`} />
    </button>
  );
}

export function SettingsRow({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0 flex-1">
        <div className="font-body-strong text-sm text-ink">{title}</div>
        {description && <p className="mt-1 font-body text-sm text-ink-muted">{description}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}
