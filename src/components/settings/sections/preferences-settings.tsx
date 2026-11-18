"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { Toggle, toast } from "@/components/ui-client";
import { FilterSelect } from "@/components/filters";
import { setMode } from "@/app/actions";
import { Check, Layers, Loader2, Sliders, Sparkles } from "lucide-react";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-ui";

/* ------------------------------ types ----------------------------- */

interface PreferencesSettingsProps {
  initialMode: "simple" | "advanced";
  revealNotice?: boolean;
}

type Mode = "simple" | "advanced";

interface Prefs {
  defaultDashboard: string;
  defaultRange: string;
  theme: string;
  autoMeta: boolean;
  injectSchema: boolean;
  autoSaveDrafts: boolean;
  brandEnforcement: boolean;
}

/* ------------------------------ data ------------------------------ */

const DEFAULT_PREFS: Prefs = {
  defaultDashboard: "/overview",
  defaultRange: "30d",
  theme: "system",
  autoMeta: true,
  injectSchema: true,
  autoSaveDrafts: true,
  brandEnforcement: true,
};

const DASHBOARD_OPTIONS = [
  { value: "/overview", label: "Executive Overview" },
  { value: "/opportunities", label: "Keyword Opportunities" },
  { value: "/content", label: "Content Pipeline" },
  { value: "/publishing", label: "Publishing Queue" },
  { value: "/audit", label: "Website Audit" },
];

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];

const THEME_OPTIONS = [
  { value: "system", label: "System sync (Auto)" },
  { value: "dark", label: "Dark theme" },
  { value: "light", label: "Light theme" },
];

const MODES: {
  id: Mode;
  title: string;
  description: string;
  tags: string[];
  icon: typeof Layers;
}[] = [
  {
    id: "simple",
    title: "Simple mode",
    description:
      "Curated for marketing leaders & business founders. Keeps the sidebar focused on Opportunities, Content, Publishing, and Performance.",
    tags: ["Streamlined nav", "Executive metrics"],
    icon: Layers,
  },
  {
    id: "advanced",
    title: "Advanced mode",
    description:
      "Engineered for SEO specialists & technical teams. Unlocks Topical Authority, AEO Prompt tracking, Crawlability audits, and Canonical logs.",
    tags: ["+ Authority", "+ AEO engine", "+ Deep crawl"],
    icon: Sliders,
  },
];

/* ----------------------------- helpers ---------------------------- */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";

function ToggleRow({
  title,
  description,
  label,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-fg">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <div className="shrink-0">
        <Toggle label={label} checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

/* ---------------------------- component --------------------------- */

export function PreferencesSettings({ initialMode, revealNotice }: PreferencesSettingsProps) {
  const [mode, setModeState] = useState<Mode>(initialMode);
  const [defaultDashboard, setDefaultDashboard] = useState(DEFAULT_PREFS.defaultDashboard);
  const [defaultRange, setDefaultRange] = useState(DEFAULT_PREFS.defaultRange);
  const [theme, setTheme] = useState(DEFAULT_PREFS.theme);
  const [autoMeta, setAutoMeta] = useState(DEFAULT_PREFS.autoMeta);
  const [injectSchema, setInjectSchema] = useState(DEFAULT_PREFS.injectSchema);
  const [autoSaveDrafts, setAutoSaveDrafts] = useState(DEFAULT_PREFS.autoSaveDrafts);
  const [brandEnforcement, setBrandEnforcement] = useState(DEFAULT_PREFS.brandEnforcement);
  const [pending, start] = useTransition();

  const [base, setBase] = useState<Prefs>(DEFAULT_PREFS);

  const snapshot: Prefs = {
    defaultDashboard,
    defaultRange,
    theme,
    autoMeta,
    injectSchema,
    autoSaveDrafts,
    brandEnforcement,
  };
  const dirty = JSON.stringify(snapshot) !== JSON.stringify(base);

  const handleModeSwitch = (newMode: Mode) => {
    if (newMode === mode) return;
    setModeState(newMode);
    start(async () => {
      await setMode(newMode);
      toast(`${newMode === "advanced" ? "Advanced" : "Simple"} mode activated`);
    });
  };

  const handleSavePreferences = () => {
    toast("Preferences updated successfully");
    setBase(snapshot);
  };

  const handleDiscard = () => {
    setDefaultDashboard(base.defaultDashboard);
    setDefaultRange(base.defaultRange);
    setTheme(base.theme);
    setAutoMeta(base.autoMeta);
    setInjectSchema(base.injectSchema);
    setAutoSaveDrafts(base.autoSaveDrafts);
    setBrandEnforcement(base.brandEnforcement);
  };

  const enabledCount = [autoMeta, injectSchema, autoSaveDrafts, brandEnforcement].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-fg">Experience & Preferences</h2>
        <p className="mt-1 text-[13px] text-muted">
          Customize navigation complexity, default filters, appearance, and AI generation defaults.
        </p>
      </div>

      {/* Advanced features notice */}
      {revealNotice && mode === "simple" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-subtle px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-fg text-bg">
              <Sparkles size={15} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-fg">Advanced SEO features are available</p>
              <p className="mt-0.5 text-xs text-muted">
                Authority, AEO engine benchmarks, and technical crawl logs are hidden in Simple mode. Switch to
                Advanced mode below to unlock them.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => handleModeSwitch("advanced")}
            className="shrink-0 self-start sm:self-center"
          >
            Switch to Advanced
          </Button>
        </div>
      )}

      {/* Complexity mode */}
      <SettingsSection
        title="Platform complexity mode"
        description="Choose whether to streamline the sidebar navigation or reveal comprehensive technical tooling."
        footer={
          <p className="flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
            {pending ? (
              <>
                <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                Applying mode…
              </>
            ) : (
              "Mode changes apply immediately to your sidebar"
            )}
          </p>
        }
      >
        <div className="p-5">
          <div role="radiogroup" aria-label="Platform complexity mode" className="grid gap-3 sm:grid-cols-2">
            {MODES.map((m) => {
              const active = mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={pending}
                  onClick={() => handleModeSwitch(m.id)}
                  className={cx(
                    "flex flex-col rounded-2xl border p-4 text-left transition-colors disabled:cursor-wait",
                    active
                      ? "border-fg bg-surface ring-1 ring-fg"
                      : "border-line bg-subtle hover:border-line-strong hover:bg-surface",
                    ring
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cx(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-xl border",
                          active ? "border-fg bg-fg text-bg" : "border-line bg-surface text-muted"
                        )}
                      >
                        <Icon size={15} strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-semibold text-fg">{m.title}</span>
                    </div>
                    <span
                      aria-hidden
                      className={cx(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                        active ? "border-fg bg-fg text-bg" : "border-line bg-surface"
                      )}
                    >
                      {active && <Check size={12} strokeWidth={2.5} />}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted">{m.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex h-6 items-center rounded-full bg-sunken px-2.5 text-xs font-medium text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      {/* Navigation & defaults */}
      <SettingsSection
        title="Navigation & defaults"
        description="Configure your landing page and default reporting windows."
      >
        <SettingsRow label="Default landing page" description="Where you land after signing in.">
          <FilterSelect
            label="Default landing page"
            value={defaultDashboard}
            onChange={setDefaultDashboard}
            options={DASHBOARD_OPTIONS}
            className="w-full"
          />
        </SettingsRow>

        <SettingsRow label="Default reporting period" description="Applied to charts and tables on first load.">
          <FilterSelect
            label="Default reporting period"
            value={defaultRange}
            onChange={setDefaultRange}
            options={RANGE_OPTIONS}
            className="w-full"
          />
        </SettingsRow>

        <SettingsRow label="Appearance theme" description="Match your system or pick a fixed theme.">
          <FilterSelect
            label="Appearance theme"
            value={theme}
            onChange={setTheme}
            options={THEME_OPTIONS}
            className="w-full"
          />
        </SettingsRow>
      </SettingsSection>

      {/* AI content automation */}
      <SettingsSection
        title="AI content automation"
        description="Control automated metadata, schema markup, and editorial safety checks."
        footer={
          <p className="text-xs tabular-nums text-muted">
            {enabledCount} of 4 automations enabled
          </p>
        }
      >
        <ToggleRow
          title="Auto-generate meta descriptions"
          description="Automatically author 150-160 character SERP descriptions when drafts are generated."
          label="Auto-generate meta descriptions"
          checked={autoMeta}
          onChange={setAutoMeta}
        />
        <ToggleRow
          title="Inject JSON-LD structured data"
          description="Automatically generate Article and FAQPage schema markup for all published articles."
          label="Inject JSON-LD Structured Data"
          checked={injectSchema}
          onChange={setInjectSchema}
        />
        <ToggleRow
          title="Auto-save editor drafts"
          description="Automatically save document changes every 30 seconds to prevent loss of work."
          label="Auto-save editor drafts"
          checked={autoSaveDrafts}
          onChange={setAutoSaveDrafts}
        />
        <ToggleRow
          title="Strict brand guardrail enforcement"
          description="Block publishing if restricted claims or prohibited competitor references are detected."
          label="Strict brand guardrail enforcement"
          checked={brandEnforcement}
          onChange={setBrandEnforcement}
        />
      </SettingsSection>

      {/* Sticky save bar */}
      {dirty && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2 text-[13px] text-fg">
            <span className="h-2 w-2 shrink-0 rounded-full bg-warning-fg" aria-hidden />
            Unsaved changes
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDiscard}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSavePreferences}>
              Save preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}