"use client";

import type { ReactNode } from "react";
import { ChevronDown, Search, X } from "lucide-react";

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export function FilterSelect({
  value,
  onChange,
  options,
  label,
  icon,
  size = "md",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  icon?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cx("relative min-w-0", className)}>
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          {icon}
        </span>
      )}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "w-full cursor-pointer appearance-none truncate rounded-full border border-line bg-surface pr-8 text-fg transition-colors hover:bg-subtle",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line",
          size === "sm" ? "h-8 text-xs" : "h-9 text-[13px]",
          icon ? "pl-9" : "pl-3.5"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.75}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export function FilterSearch({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cx("relative min-w-0", className)}>
      <Search
        size={15}
        strokeWidth={1.75}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="text"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "h-9 w-full rounded-full border border-line bg-surface pl-9 pr-9 text-[13px] text-fg placeholder:text-muted transition-colors hover:bg-subtle",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-sunken hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}