"use client";

import Link from "next/link";
import { isValidElement, useRef, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export interface PageTabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  href?: string;
  icon?: LucideIcon | ReactNode;
  count?: number | string;
  badge?: ReactNode;
  disabled?: boolean;
}

function renderTabIcon(icon: PageTabItem["icon"]) {
  if (!icon) return null;
  if (isValidElement(icon)) {
    return icon;
  }
  const IconComp = icon as ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  return <IconComp className="h-4 w-4 shrink-0 text-current" size={16} strokeWidth={1.5} />;
}

export interface PageTabsProps<T extends string = string> {
  items: PageTabItem<T>[];
  value?: T;
  active?: T;
  onChange?: (id: T) => void;
  size?: "sm" | "md" | "lg";
  border?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function PageTabs<T extends string = string>({
  items,
  value,
  active,
  onChange,
  size = "md",
  border = true,
  className,
  ariaLabel = "Page navigation tabs",
}: PageTabsProps<T>) {
  const currentActive = value ?? active;
  const tablistRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for accessible tabs (WAI-ARIA)
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      tablistRef.current?.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])') ?? []
    );
    if (!tabs.length) return;

    const currentIndex = tabs.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      tabs[nextIndex]?.focus();
      if (!items[nextIndex]?.href && onChange) {
        tabs[nextIndex]?.click();
      }
    }
  };

  const heightClass =
    size === "sm"
      ? "h-11 text-sm"
      : size === "lg"
      ? "h-14 text-base"
      : "h-[52px] text-[15px] sm:text-base";

  return (
    <div className={clsx("w-full", border && "border-b border-line", className)}>
      <div
        ref={tablistRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-7 sm:gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mb-px"
      >
        {items.map((tab) => {
          const isSelected = tab.id === currentActive;
          const iconElement = renderTabIcon(tab.icon);

          const content = (
            <span className="inline-flex items-center gap-2">
              {iconElement && <span className="shrink-0 flex items-center">{iconElement}</span>}
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    "ml-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
                    isSelected
                      ? "bg-sunken text-fg font-semibold"
                      : "bg-sunken/70 text-muted group-hover:text-fg"
                  )}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge}
            </span>
          );

          const baseClass = clsx(
            "group inline-flex shrink-0 items-center justify-center whitespace-nowrap border-b-2 font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line focus-visible:ring-offset-2",
            heightClass,
            isSelected
              ? "border-fg text-fg font-semibold cursor-default"
              : "border-transparent text-muted hover:border-line-strong/60 hover:text-fg font-normal cursor-pointer",
            tab.disabled && "cursor-not-allowed opacity-40 pointer-events-none"
          );

          if (tab.href && !tab.disabled) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                role="tab"
                id={`page-tab-${tab.id}`}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                className={baseClass}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`page-tab-${tab.id}`}
              aria-selected={isSelected}
              aria-disabled={tab.disabled}
              disabled={tab.disabled}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                if (!tab.disabled && onChange) {
                  onChange(tab.id);
                }
              }}
              className={baseClass}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
