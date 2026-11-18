import { type ReactNode } from "react";

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  action,
  footer,
  className = "",
}: SettingsSectionProps) {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          {description && (
            <p className="caption text-xs text-muted mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="rounded-2xl border border-line bg-surface overflow-hidden divide-y divide-line shadow-xs">
        {children}
        {footer && (
          <div className="border-t border-line bg-subtle/40 px-4 py-3 sm:px-5 flex items-center justify-between text-xs text-muted">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface SettingsRowProps {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
  className = "",
}: SettingsRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 sm:px-5 ${className}`.trim()}
    >
      <div className="min-w-0 pr-4">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium text-fg block">
            {label}
          </label>
        ) : (
          <span className="text-sm font-medium text-fg block">{label}</span>
        )}
        {description && (
          <p className="mt-0.5 text-[13px] leading-5 text-muted">{description}</p>
        )}
      </div>
      <div className="w-full sm:w-auto sm:min-w-[240px] shrink-0">{children}</div>
    </div>
  );
}

