"use client";

import { useState } from "react";
import type { BrandData } from "@/lib/types";
import { SettingsNav, type SettingsTabId } from "@/components/settings/settings-nav";
import { WorkspaceSettings } from "@/components/settings/sections/workspace-settings";
import { PreferencesSettings } from "@/components/settings/sections/preferences-settings";
import { MembersSettings } from "@/components/settings/sections/members-settings";
import { BrandSettings } from "@/components/settings/sections/brand-settings";
import { WorkflowSettings } from "@/components/settings/sections/workflow-settings";
import { NotificationsSettings } from "@/components/settings/sections/notifications-settings";
import { PlanSettings } from "@/components/settings/sections/plan-settings";
import { DeveloperSettings } from "@/components/settings/sections/developer-settings";

export interface SettingsViewProps {
  workspace: {
    name: string;
    website: string;
    mode: "simple" | "advanced";
    brand: BrandData;
    goals: { selected: string[]; primary: string };
    language: string;
  };
  reveal?: boolean;
}

export function SettingsView({ workspace, reveal }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    reveal ? "preferences" : "workspace"
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Secondary Settings Sidebar */}
      <SettingsNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Settings Content Area */}
      <div className="flex-1 w-full min-w-0 max-w-4xl">
        {activeTab === "workspace" && (
          <WorkspaceSettings workspace={workspace} />
        )}

        {activeTab === "preferences" && (
          <PreferencesSettings
            initialMode={workspace.mode}
            revealNotice={reveal}
          />
        )}

        {activeTab === "members" && <MembersSettings />}

        {activeTab === "brand" && (
          <BrandSettings initialBrand={workspace.brand} />
        )}

        {activeTab === "workflow" && <WorkflowSettings />}

        {activeTab === "notifications" && <NotificationsSettings />}

        {activeTab === "plan" && <PlanSettings />}

        {activeTab === "developer" && <DeveloperSettings />}
      </div>
    </div>
  );
}
