"use client";

import clsx from "clsx";
import { Bell, Building2, CreditCard, Code2, Palette, SlidersHorizontal, Users, Workflow, type LucideIcon } from "lucide-react";
import { PageTabs } from "@/components/page-tabs";

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
      {/* Mobile & Tablet In-Page Underline Tabs */}
      <div className="lg:hidden mb-4">
        <PageTabs
          value={activeTab}
          onChange={onSelectTab}
          items={TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
          ariaLabel="Settings sections"
        />
      </div>

      {/* Desktop Vertical Sidebar */}
      <div className="hidden lg:block">
        <p className="mb-2 px-3 text-[13px] font-medium text-muted">Settings</p>
        <div
          role="tablist"
          aria-label="Settings sections"
          aria-orientation="vertical"
          className="flex flex-col space-y-1"
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
                  "flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-[15px] font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line",
                  active
                    ? "bg-sunken text-fg font-semibold"
                    : "text-muted hover:bg-subtle hover:text-fg"
                )}
              >
                <Icon size={18} strokeWidth={1.5} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}