"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import clsx from "clsx";
import { ChevronDown, Search, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Standardized Input with prefix and suffix icon support              */
/* ------------------------------------------------------------------ */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  onClear?: () => void;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefixIcon, suffixIcon, onClear, error, value, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {prefixIcon && (
          <div className="pointer-events-none absolute left-3 flex h-5 w-5 shrink-0 items-center justify-center text-muted">
            {prefixIcon}
          </div>
        )}

        <input
          ref={ref}
          value={value}
          className={clsx(
            "field h-10 w-full transition-colors",
            prefixIcon ? "pl-10" : "pl-3.5",
            suffixIcon || onClear ? "pr-10" : "pr-3.5",
            error && "border-danger focus:border-danger focus:ring-1 focus:ring-danger",
            className
          )}
          {...props}
        />

        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded text-muted hover:text-fg"
            title="Clear input"
          >
            <X size={14} />
          </button>
        )}

        {suffixIcon && !onClear && (
          <div className="pointer-events-none absolute right-3 flex h-5 w-5 shrink-0 items-center justify-center text-muted">
            {suffixIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ------------------------------------------------------------------ */
/* Standardized Search Input                                          */
/* ------------------------------------------------------------------ */
export interface SearchInputProps extends Omit<InputProps, "prefixIcon"> {
  onSearchChange?: (val: string) => void;
}

export function SearchInput({ value, onChange, onSearchChange, placeholder = "Search...", className, ...props }: SearchInputProps) {
  return (
    <Input
      prefixIcon={<Search size={18} strokeWidth={1.5} className="shrink-0 text-muted" />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        onSearchChange?.(e.target.value);
      }}
      className={className}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Standardized Dropdown Trigger Pattern                               */
/* Requirements:                                                      */
/* - Text aligned left                                                */
/* - Chevron aligned right, vertically centred                         */
/* - Fixed 16px icon dimension                                        */
/* - Consistent right padding, preventing shifting based on label     */
/* ------------------------------------------------------------------ */
export interface SelectDropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string | number; label: string }[];
  wrapperClassName?: string;
  error?: boolean;
}

export const SelectDropdown = forwardRef<HTMLSelectElement, SelectDropdownProps>(
  ({ className, wrapperClassName, options, children, error, ...props }, ref) => {
    return (
      <div className={clsx("relative inline-flex w-full items-center", wrapperClassName)}>
        <select
          ref={ref}
          className={clsx(
            "field h-10 w-full appearance-none cursor-pointer truncate pl-3.5 pr-9 text-sm text-fg transition-colors",
            error && "border-danger focus:border-danger focus:ring-1 focus:ring-danger",
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 shrink-0 text-muted"
        />
      </div>
    );
  }
);
SelectDropdown.displayName = "SelectDropdown";

