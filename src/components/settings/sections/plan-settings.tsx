"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Modal, toast } from "@/components/ui-client";
import { Check, CreditCard, Download, Sparkles } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-ui";

/* ------------------------------ data ------------------------------ */

interface UsageItem {
  label: string;
  used: number;
  limit: number;
  unit: string;
  note: string;
}

const USAGE_METRICS: UsageItem[] = [
  {
    label: "AI Generation Credits",
    used: 620,
    limit: 1000,
    unit: "credits",
    note: "Resets Dec 1, 2026. Powers article generation, briefs, and AI rewrites.",
  },
  {
    label: "Tracked SERP Keywords",
    used: 182,
    limit: 500,
    unit: "keywords",
    note: "Daily position tracking across Google Desktop and Mobile.",
  },
  {
    label: "Monitored AEO Prompts",
    used: 40,
    limit: 100,
    unit: "prompts",
    note: "Synthesized queries tested weekly across ChatGPT, Perplexity, and Claude.",
  },
  {
    label: "Technical Crawl Pages",
    used: 142,
    limit: 1000,
    unit: "pages",
    note: "Audited URLs for status codes, indexability, and Core Web Vitals.",
  },
  {
    label: "Generated Word Volume",
    used: 48200,
    limit: 100000,
    unit: "words",
    note: "Total long-form editorial content authored during this cycle.",
  },
];

const INVOICES = [
  { id: "INV-2026-011", date: "Nov 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-2026-010", date: "Oct 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-2026-009", date: "Sep 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-2026-008", date: "Aug 1, 2026", amount: "$149.00", status: "Paid" },
];

type PlanId = "starter" | "growth" | "scale";

interface PlanOption {
  id: PlanId;
  name: string;
  price: string;
  blurb: string;
  features: string[];
  current?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    blurb: "For boutique sites & solo creators",
    features: ["100 tracked keywords", "200 AI generation credits", "1 connected CMS channel"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$149",
    blurb: "For scaling brands & content teams",
    features: [
      "500 tracked keywords",
      "1,000 AI generation credits",
      "Unlimited publishing channels",
      "AEO prompt monitoring",
    ],
    current: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: "$399",
    blurb: "For high-velocity agencies & multi-brand",
    features: [
      "2,500 tracked keywords",
      "4,000 AI generation credits",
      "Dedicated IP & custom crawlers",
      "Priority enterprise support",
    ],
  },
];

/* ----------------------------- helpers ---------------------------- */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";

const iconBtn = cx(
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted",
  "transition-colors hover:bg-sunken hover:text-fg",
  ring
);

const INVOICE_GRID = "sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_5.5rem_5rem_5.5rem]";

function Chip({ tone, children }: { tone: "success" | "warning"; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium",
        tone === "success" && "bg-success-bg text-success-fg",
        tone === "warning" && "bg-warning-bg text-warning-fg"
      )}
    >
      {children}
    </span>
  );
}

function UsageRow({ metric }: { metric: UsageItem }) {
  const pct = Math.min(100, Math.round((metric.used / metric.limit) * 100));
  const near = pct > 85;
  const remaining = metric.limit - metric.used;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-fg">{metric.label}</p>
            {near && <Chip tone="warning">Near limit</Chip>}
          </div>
          <p className="mt-0.5 text-xs text-muted">{metric.note}</p>
        </div>
        <p className="shrink-0 text-sm font-medium tabular-nums text-fg">
          {metric.used.toLocaleString()}
          <span className="text-muted"> / {metric.limit.toLocaleString()}</span>
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={`${metric.label} usage`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sunken"
      >
        <div
          className={cx("h-full rounded-full transition-all", near ? "bg-warning-fg" : "bg-fg")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs tabular-nums text-muted">
        <span>{pct}% utilized</span>
        <span>
          {remaining.toLocaleString()} {metric.unit} remaining
        </span>
      </div>
    </div>
  );
}

/* ---------------------------- component --------------------------- */

export function PlanSettings() {
  const [showPlansModal, setShowPlansModal] = useState(false);

  const handleDownloadInvoice = (invId: string) => {
    toast(`Downloading invoice ${invId}...`);
  };

  const handleManageStripe = () => {
    toast("Opening Stripe billing portal...");
  };

  const handlePlanAction = (id: PlanId) => {
    setShowPlansModal(false);
    if (id === "starter") toast("Downgraded to Starter at next cycle");
    if (id === "scale") toast("Upgraded to Scale plan! Extra credits added.");
  };

  const paidCount = INVOICES.filter((i) => i.status === "Paid").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-fg">Plan & Resource Usage</h2>
        <p className="mt-1 text-[13px] text-muted">
          Monitor your resource quotas, active subscription tier, and historical invoices.
        </p>
      </div>

      {/* Current plan */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fg text-bg">
              <Sparkles size={20} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-semibold text-fg">Growth plan</h3>
                <Chip tone="success">Active</Chip>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                <span className="tabular-nums">$149.00</span> / month · Renews automatically on Dec 1, 2026
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowPlansModal(true)}>
              Change plan
            </Button>
            <Button onClick={handleManageStripe}>
              <CreditCard size={16} strokeWidth={1.5} className="mr-1.5 shrink-0" />
              Manage billing
            </Button>
          </div>
        </div>

        <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
          <div className="bg-surface px-5 py-4">
            <p className="text-xs text-muted">Payment method</p>
            <div className="mt-2 flex items-center gap-2.5">
              <div className="grid h-6 w-9 shrink-0 place-items-center rounded-md border border-line bg-subtle font-mono text-[10px] font-bold text-fg">
                MC
              </div>
              <span className="truncate text-sm font-medium text-fg">Mastercard ending in 4242</span>
            </div>
            <p className="mt-1.5 text-xs text-muted">Expires 08/2029</p>
          </div>

          <div className="bg-surface px-5 py-4">
            <p className="text-xs text-muted">Billing contact</p>
            <p className="mt-2 truncate text-sm font-medium text-fg">billing@verdantbotanics.com</p>
            <p className="mt-1.5 text-xs text-muted">Verdant Botanics LLC · Tax ID: US-9281741</p>
          </div>
        </div>
      </div>

      {/* Usage */}
      <SettingsSection
        title="Resource usage"
        description="Real-time consumption during the current monthly billing period."
        footer={<p className="text-xs text-muted">Quotas reset on Dec 1, 2026</p>}
      >
        {USAGE_METRICS.map((metric) => (
          <UsageRow key={metric.label} metric={metric} />
        ))}
      </SettingsSection>

      {/* Billing history */}
      <SettingsSection
        title="Billing history"
        description="Past receipts and downloadable tax invoices."
        footer={
          <p className="text-xs tabular-nums text-muted">
            {INVOICES.length} invoices · {paidCount} paid
          </p>
        }
      >
        <div
          className={cx(
            "hidden gap-3 bg-subtle px-5 py-2.5 text-xs font-medium text-muted sm:grid",
            INVOICE_GRID
          )}
        >
          <span>Invoice</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
          <span className="text-right">Receipt</span>
        </div>

        {INVOICES.map((inv) => (
          <div key={inv.id}>
            {/* Desktop row */}
            <div className={cx("hidden items-center gap-3 px-5 py-3 sm:grid", INVOICE_GRID)}>
              <span className="truncate font-mono text-xs font-medium text-fg">{inv.id}</span>
              <span className="text-[13px] text-muted">{inv.date}</span>
              <span className="text-[13px] font-medium tabular-nums text-fg">{inv.amount}</span>
              <span>
                <Chip tone={inv.status === "Paid" ? "success" : "warning"}>{inv.status}</Chip>
              </span>
              <span className="text-right">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(inv.id)}
                  className={cx(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted",
                    "transition-colors hover:bg-sunken hover:text-fg",
                    ring
                  )}
                >
                  <Download size={14} strokeWidth={1.5} className="shrink-0" />
                  PDF
                </button>
              </span>
            </div>

            {/* Mobile row */}
            <div className="flex items-center gap-3 px-5 py-3.5 sm:hidden">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-mono text-xs font-medium text-fg">{inv.id}</p>
                  <Chip tone={inv.status === "Paid" ? "success" : "warning"}>{inv.status}</Chip>
                </div>
                <p className="mt-1 text-xs tabular-nums text-muted">
                  {inv.date} · {inv.amount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadInvoice(inv.id)}
                className={iconBtn}
                title="Download PDF"
                aria-label={`Download invoice ${inv.id}`}
              >
                <Download size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
      </SettingsSection>

      {/* Change plan modal */}
      <Modal
        open={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        title="Choose your VisibilityOS Plan"
        description="Scale resources as your content operation expands."
        width={780}
        footer={
          <Button variant="outline" size="sm" onClick={() => setShowPlansModal(false)}>
            Close
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cx(
                "flex flex-col rounded-2xl border p-5",
                plan.current ? "border-fg bg-subtle ring-1 ring-fg" : "border-line bg-surface"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-fg">{plan.name}</span>
                {plan.current && (
                  <span className="inline-flex h-6 items-center rounded-full bg-fg px-2.5 text-xs font-medium text-bg">
                    Current plan
                  </span>
                )}
              </div>

              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-fg">
                {plan.price}
                <span className="ml-0.5 text-xs font-normal text-muted">/mo</span>
              </p>
              <p className="mt-1 text-xs text-muted">{plan.blurb}</p>

              <ul className="mt-4 flex-1 space-y-2.5 border-t border-line pt-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-fg">
                    <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-sunken text-fg">
                      <Check size={10} strokeWidth={2.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {plan.id === "starter" && (
                  <Button variant="outline" className="w-full text-xs" onClick={() => handlePlanAction("starter")}>
                    Downgrade
                  </Button>
                )}
                {plan.id === "growth" && (
                  <Button disabled className="w-full text-xs">
                    Active plan
                  </Button>
                )}
                {plan.id === "scale" && (
                  <Button className="w-full text-xs" onClick={() => handlePlanAction("scale")}>
                    Upgrade to Scale
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}