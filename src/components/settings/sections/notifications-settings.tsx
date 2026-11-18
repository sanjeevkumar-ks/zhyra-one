"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Toggle, toast } from "@/components/ui-client";
import { Bell, Mail, Sparkles, TrendingUp, Users } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-ui";

/* ------------------------------ types ----------------------------- */

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  email: boolean;
  inApp: boolean;
}

interface NotificationCategory {
  title: string;
  description: string;
  icon: typeof Bell;
  items: NotificationItem[];
}

/* ------------------------------ data ------------------------------ */

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    title: "Content & Publishing",
    description: "Alerts for draft submissions, reviews, approvals, and CMS publishing status.",
    icon: Sparkles,
    items: [
      {
        id: "draft_submitted",
        title: "Draft submitted for review",
        description: "When an author submits an article into the Editorial Review stage.",
        email: true,
        inApp: true,
      },
      {
        id: "content_approved",
        title: "Content approved by reviewer",
        description: "When a reviewer or compliance officer signs off on a pending draft.",
        email: false,
        inApp: true,
      },
      {
        id: "publishing_failed",
        title: "Publication dispatch failure",
        description: "Immediate alert if a CMS connector (WordPress, Shopify, etc.) rejects a payload.",
        email: true,
        inApp: true,
      },
    ],
  },
  {
    title: "Search & Visibility Movements",
    description: "Automated triggers when rankings, crawl status, or AI engine citations change.",
    icon: TrendingUp,
    items: [
      {
        id: "rank_drop",
        title: "Significant rank drop (> 5 positions)",
        description: "Triggered when a tracked primary keyword drops 5 or more spots on Google.",
        email: true,
        inApp: true,
      },
      {
        id: "ai_citation_shift",
        title: "AI Engine citation surge or drop",
        description: "When your brand citation rate shifts significantly across ChatGPT, Claude, or Perplexity.",
        email: true,
        inApp: true,
      },
      {
        id: "crawl_error",
        title: "New 4xx/5xx crawl errors detected",
        description: "When an automated website audit discovers broken URLs or indexing failures.",
        email: false,
        inApp: true,
      },
    ],
  },
  {
    title: "Executive Reports & Digests",
    description: "Scheduled recurring summaries delivered directly to stakeholders.",
    icon: Bell,
    items: [
      {
        id: "weekly_digest",
        title: "Weekly executive performance summary",
        description: "Condensed Monday morning snapshot of organic traffic, new rankings, and publishing velocity.",
        email: true,
        inApp: false,
      },
      {
        id: "monthly_report",
        title: "Monthly visibility & ROI report",
        description: "Comprehensive end-of-month PDF report summarizing organic expansion and content impact.",
        email: true,
        inApp: false,
      },
    ],
  },
  {
    title: "Team & Security",
    description: "Governance, invite acceptances, and authentication security logs.",
    icon: Users,
    items: [
      {
        id: "member_joined",
        title: "New member joined workspace",
        description: "When an invited colleague accepts their invitation and creates an account.",
        email: false,
        inApp: true,
      },
      {
        id: "api_key_activity",
        title: "API key or webhook secret regenerated",
        description: "Security notifications whenever credentials or integrations are modified.",
        email: true,
        inApp: true,
      },
    ],
  },
];

/* ----------------------------- helpers ---------------------------- */

// Shared column template so the header row and item rows line up from `sm` up.
const COLS = "sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem]";

function ChannelCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 sm:justify-center">
      {children}
      <span className="text-xs text-muted sm:hidden">{label}</span>
    </div>
  );
}

/* ---------------------------- component --------------------------- */

export function NotificationsSettings() {
  const [categories, setCategories] = useState<NotificationCategory[]>(DEFAULT_CATEGORIES);
  const [base, setBase] = useState<NotificationCategory[]>(DEFAULT_CATEGORIES);

  const toggleNotification = (
    catIdx: number,
    itemIdx: number,
    channel: "email" | "inApp"
  ) => {
    setCategories((prev) =>
      prev.map((cat, cIdx) => {
        if (cIdx !== catIdx) return cat;
        return {
          ...cat,
          items: cat.items.map((item, iIdx) => {
            if (iIdx !== itemIdx) return item;
            return {
              ...item,
              [channel]: !item[channel],
            };
          }),
        };
      })
    );
  };

  const handleSave = () => {
    toast("Notification preferences saved successfully");
    setBase(categories);
  };

  const handleDiscard = () => setCategories(base);

  const dirty = JSON.stringify(categories) !== JSON.stringify(base);

  const allItems = categories.flatMap((c) => c.items);
  const total = allItems.length;
  const emailOn = allItems.filter((i) => i.email).length;
  const inAppOn = allItems.filter((i) => i.inApp).length;
  const mutedCount = allItems.filter((i) => !i.email && !i.inApp).length;

  return (
    <div className="space-y-6">
      {/* Header + summary */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-fg">Notification Preferences</h2>
        <p className="mt-1 text-[13px] text-muted">
          Choose how and when VisibilityOS contacts you across email and in-app feeds.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
          <div className="bg-surface px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Mail size={13} strokeWidth={1.5} />
              Email alerts
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-fg sm:text-lg">
              {emailOn}
              <span className="text-xs font-normal text-muted"> / {total}</span>
            </p>
          </div>
          <div className="bg-surface px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Bell size={13} strokeWidth={1.5} />
              In-app alerts
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-fg sm:text-lg">
              {inAppOn}
              <span className="text-xs font-normal text-muted"> / {total}</span>
            </p>
          </div>
          <div className="bg-surface px-4 py-3.5">
            <p className="text-xs text-muted">Fully muted</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-fg sm:text-lg">{mutedCount}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.map((category, catIdx) => {
        const Icon = category.icon;
        const catEmail = category.items.filter((i) => i.email).length;
        const catInApp = category.items.filter((i) => i.inApp).length;

        return (
          <SettingsSection
            key={category.title}
            title={category.title}
            description={category.description}
            footer={
              <p className="text-xs tabular-nums text-muted">
                {catEmail} of {category.items.length} by email · {catInApp} of {category.items.length} in-app
              </p>
            }
          >
            {/* Column header */}
            <div
              className={`hidden items-center gap-3 bg-subtle px-5 py-2.5 sm:grid ${COLS}`}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-sunken text-fg">
                  <Icon size={13} strokeWidth={1.5} />
                </span>
                {category.items.length} {category.items.length === 1 ? "alert" : "alerts"}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted">
                <Mail size={13} strokeWidth={1.5} />
                Email
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted">
                <Bell size={13} strokeWidth={1.5} />
                In-app
              </div>
            </div>

            {/* Rows */}
            {category.items.map((item, itemIdx) => (
              <div
                key={item.id}
                className={`flex flex-col gap-3 px-5 py-4 sm:grid sm:items-center ${COLS}`}
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-fg">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                </div>

                <div className="flex items-center gap-6 sm:contents">
                  <ChannelCell label="Email">
                    <Toggle
                      label={`${item.title} Email`}
                      checked={item.email}
                      onChange={() => toggleNotification(catIdx, itemIdx, "email")}
                    />
                  </ChannelCell>
                  <ChannelCell label="In-app">
                    <Toggle
                      label={`${item.title} In-App`}
                      checked={item.inApp}
                      onChange={() => toggleNotification(catIdx, itemIdx, "inApp")}
                    />
                  </ChannelCell>
                </div>
              </div>
            ))}
          </SettingsSection>
        );
      })}

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
            <Button size="sm" onClick={handleSave}>
              Save preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}