"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, btnClass } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { Input, SelectDropdown } from "@/components/ui-form";
import { SettingsRow, SettingsSection } from "@/components/settings/settings-ui";
import { ExternalLink, RotateCcw } from "lucide-react";

interface WorkspaceSettingsProps {
  workspace: {
    name: string;
    website: string;
    goals: { selected: string[]; primary: string };
    language: string;
  };
}

const GOALS = ["Increase organic traffic", "Improve AI search visibility", "Increase ecommerce sales", "Build topical authority"];
const LANGUAGES = ["English (UK)", "English (US)", "English (India)", "English (Global)"];
const TIME_ZONES = [
  "Asia/Kolkata (UTC+05:30)",
  "Europe/London (UTC+00:00 / +01:00)",
  "America/New_York (UTC-05:00 / -04:00)",
  "America/Los_Angeles (UTC-08:00 / -07:00)",
];
const toOptions = (list: string[]) => list.map((v) => ({ value: v, label: v }));

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "WS"
  );
}

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
  const initial = {
    name: workspace.name,
    website: workspace.website,
    primaryGoal: workspace.goals?.primary || GOALS[0],
    language: workspace.language || LANGUAGES[0],
    timeZone: TIME_ZONES[0],
    summary:
      "Verdant Botanics is an organic skincare brand formulating gentle, plant-based face and body care with transparent ingredient sourcing.",
  };

  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== saved[k]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(form);
      toast("Workspace settings saved successfully");
    }, 400);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (dirty && !saving) handleSave();
      }}
    >
      {/* Identity */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-300 via-orange-400 to-amber-600 text-base font-semibold text-white">
            {initials(form.name)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold leading-tight tracking-tight text-fg">{form.name || "Untitled workspace"}</h2>
            <p className="mt-0.5 truncate text-[13px] text-muted">
              <span className="font-mono">ws_84291</span> · Created Nov 2025
            </p>
          </div>
        </div>

        <a
          href={`https://${form.website}`}
          target="_blank"
          rel="noreferrer"
          className={btnClass("outline", "sm", "w-full justify-center sm:w-auto")}
        >
          Visit website
          <ExternalLink size={14} strokeWidth={1.5} />
        </a>
      </div>

      {/* General */}
      <SettingsSection title="General" description="Your workspace name, primary domain and business context.">
        <SettingsRow label="Workspace name" htmlFor="ws-name" description="Used in team invites and executive reports.">
          <Input id="ws-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </SettingsRow>

        <SettingsRow
          label="Primary domain"
          htmlFor="ws-domain"
          description="The canonical domain audited and monitored across search."
        >
          <Input
            id="ws-domain"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            className="font-mono"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
          />
        </SettingsRow>

        <div className="px-4 py-3.5 sm:px-5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="ws-summary" className="text-sm font-medium text-fg">
              Business profile summary
            </label>
            <span className="text-xs tabular-nums text-faint">{form.summary.length}/400</span>
          </div>
          <p className="mt-0.5 text-[13px] leading-5 text-muted">Context used by the content generator and brand model.</p>
          <textarea
            id="ws-summary"
            className="field mt-2.5 font-sans"
            rows={3}
            maxLength={400}
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
        </div>
      </SettingsSection>

      {/* Regional & goals */}
      <SettingsSection title="Goals & regional" description="Defaults that shape recommendations, content and scheduling.">
        <SettingsRow
          label="Primary objective"
          htmlFor="ws-goal"
          description="Aligns keyword scoring and opportunity prioritisation."
        >
          <SelectDropdown id="ws-goal" value={form.primaryGoal} onChange={(e) => set("primaryGoal", e.target.value)} options={toOptions(GOALS)} />
        </SettingsRow>

        <SettingsRow label="Content language" htmlFor="ws-lang" description="Default language for generated articles and pages.">
          <SelectDropdown id="ws-lang" value={form.language} onChange={(e) => set("language", e.target.value)} options={toOptions(LANGUAGES)} />
        </SettingsRow>

        <SettingsRow label="Time zone" htmlFor="ws-tz" description="Used for scheduled publishing and automated audit runs.">
          <SelectDropdown id="ws-tz" value={form.timeZone} onChange={(e) => set("timeZone", e.target.value)} options={toOptions(TIME_ZONES)} />
        </SettingsRow>
      </SettingsSection>

      {/* Onboarding */}
      <SettingsSection title="Onboarding">
        <SettingsRow label="Setup wizard" description="Re-run to refresh your brand, goals and competitors.">
          <div className="flex sm:justify-end">
            <Link href="/onboarding" className={btnClass("outline", "sm", "w-full justify-center sm:w-auto")}>
              <RotateCcw size={14} strokeWidth={1.5} />
              Re-run setup
            </Link>
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* Unsaved changes bar */}
      {dirty && (
        <div
          role="status"
          className="enter sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 shadow-lg"
        >
          <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setForm(saved)}>
              Discard
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}