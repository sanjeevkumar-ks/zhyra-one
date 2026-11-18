"use client";

import clsx from "clsx";
import { Bell, Building2, CreditCard, Code2, Palette, SlidersHorizontal, Users, Workflow, type LucideIcon } from "lucide-react";

export type SettingsTabId =
  | "workspace"
  | "preferences"
  | "members"
  | "brand"
  | "workflow"
  | "notifications"
  | "plan"
  | "developer";

const TABS: { id: SettingsTabId; label: string; icon: LucideIcon }[] = [
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "members", label: "Members", icon: Users },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "workflow", label: "Workflow", icon: Workflow },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "plan", label: "Plan", icon: CreditCard },
  { id: "developer", label: "Developer", icon: Code2 },
];

export function SettingsNav({
  activeTab,
  onSelectTab,
}: {
  activeTab: SettingsTabId;
  onSelectTab: (id: SettingsTabId) => void;
}) {
  return (
    <div className="w-full shrink-0 lg:sticky lg:top-6 lg:w-56">
      <p className="mb-2 hidden px-3 text-[13px] font-medium text-muted lg:block">Settings</p>

      <div
        role="tablist"
        aria-label="Settings sections"
        aria-orientation="vertical"
        className={clsx(
          "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "lg:mx-0 lg:flex-col lg:overflow-visible lg:p-0",
        )}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`settings-tab-${id}`}
              aria-selected={active}
              aria-controls={`settings-panel-${id}`}
              onClick={() => onSelectTab(id)}
              className={clsx(
                "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line",
                "lg:h-10 lg:w-full lg:rounded-xl lg:border-transparent lg:px-3 lg:text-[15px]",
                active
                  ? "border-line bg-sunken text-fg"
                  : "border-line text-muted hover:bg-sunken hover:text-fg lg:border-transparent",
              )}
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0 lg:h-5 lg:w-5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}