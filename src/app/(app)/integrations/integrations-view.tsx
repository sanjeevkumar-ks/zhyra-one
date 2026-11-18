"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Camera,
  Check,
  FileText,
  Globe,
  Layers,
  Link2,
  Lock,
  Minus,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Unlink,
  Video,
  Webhook,
} from "lucide-react";
import { Badge, Button, PageTabs, Table, Td, Th, trClass } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { toggleIntegration, webhookTest } from "@/app/actions";
import { deliveryLog, integrationCatalog, webhookEvents } from "@/lib/mock-data";

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

const GROUPS = [
  {
    id: "Website",
    title: "Website & publishing",
    icon: Globe,
    description: "Platforms don't offer identical capabilities — a WordPress post, a Webflow item and a Shopify article all differ.",
  },
  {
    id: "Analytics",
    title: "Analytics",
    icon: BarChart3,
    description: "Search Console clicks and GA4 sessions are different measurements and are never summed.",
  },
  {
    id: "Social",
    title: "Social",
    icon: Share2,
    description: "Official APIs and OAuth only. Capabilities depend on provider approval.",
  },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

/* Generic icons by keyword, with a per-group fallback */
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/wordpress/, FileText],
  [/webflow/, Layers],
  [/shopify|woocommerce/, ShoppingBag],
  [/search.?console|gsc/, Search],
  [/ga4|google.?analytics|analytics/, BarChart3],
  [/linkedin/, Briefcase],
  [/instagram/, Camera],
  [/youtube/, Video],
  [/facebook/, Share2],
];
const GROUP_ICON: Record<string, LucideIcon> = { Website: Globe, Analytics: BarChart3, Social: Share2 };

function iconFor(id: string, name: string, group: string): LucideIcon {
  const key = `${id} ${name}`.toLowerCase();
  return ICON_RULES.find(([re]) => re.test(key))?.[1] ?? GROUP_ICON[group] ?? Globe;
}

function IconTile({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "sm" | "md" }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center border border-line bg-sunken text-fg",
        size === "md" ? "h-10 w-10 rounded-xl" : "h-7 w-7 rounded-lg"
      )}
      aria-hidden
    >
      <Icon size={size === "md" ? 18 : 15} strokeWidth={1.75} />
    </span>
  );
}

function SectionHead({
  icon,
  title,
  description,
  right,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  right?: ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Icon size={16} strokeWidth={1.75} className="text-muted" />
          {title}
        </h2>
        <p className="mt-0.5 max-w-2xl text-[13px] text-muted">{description}</p>
      </div>
      {right}
    </div>
  );
}

const chip = "inline-flex h-6 items-center gap-1 rounded-full bg-sunken px-2.5 text-xs font-medium tabular-nums text-muted";

export function IntegrationsView({ state }: { state: Record<string, boolean> }) {
  const [on, setOn] = useState(state);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [pending, start] = useTransition();
  const flip = (id: string) => {
    setOn((s) => ({ ...s, [id]: !s[id] }));
    start(async () => {
      await toggleIntegration(id);
      toast(on[id] ? "Disconnected" : "Connected (demo)");
    });
  };

  const counts = GROUPS.map((g) => {
    const items = integrationCatalog.filter((i) => i.group === g.id);
    return { ...g, total: items.length, connected: items.filter((i) => on[i.id]).length };
  });

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <PageTabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: "all", label: "All integrations", count: integrationCatalog.length },
          { id: "Website", label: "Website & publishing", icon: Globe, count: counts.find((c) => c.id === "Website")?.total },
          { id: "Analytics", label: "Analytics", icon: BarChart3, count: counts.find((c) => c.id === "Analytics")?.total },
          { id: "Social", label: "Social", icon: Share2, count: counts.find((c) => c.id === "Social")?.total },
          { id: "webhooks", label: "Webhooks & API", icon: Webhook },
        ]}
        ariaLabel="Integrations categories"
      />
      {/* Summary */}
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {counts.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.id} className="flex items-center gap-3 bg-surface p-4">
              <IconTile icon={Icon} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted">{g.id}</p>
                <p className="mt-0.5 text-xl font-semibold leading-none tabular-nums">
                  {g.connected}
                  <span className="ml-1 text-sm font-normal text-muted">/ {g.total} connected</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {counts
        .filter((g) => activeTab === "all" || activeTab === g.id)
        .map((g) => (
        <section key={g.id} aria-label={g.title}>
          <SectionHead
            icon={g.icon}
            title={g.title}
            description={g.description}
            right={<span className={chip}>{g.connected} of {g.total} connected</span>}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {integrationCatalog
              .filter((i) => i.group === (g.id as GroupId))
              .map((i) => {
                const connected = !!on[i.id];
                return (
                  <article key={i.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                    <div className="flex items-start gap-3 p-4 sm:p-5">
                      <IconTile icon={iconFor(i.id, i.name, i.group)} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-semibold leading-tight">{i.name}</h3>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
                          <span className={cx("h-1.5 w-1.5 rounded-full", connected ? "bg-success" : "bg-line-strong")} aria-hidden />
                          {connected ? "Connected" : "Not connected"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={connected ? "secondary" : "primary"}
                        disabled={pending}
                        onClick={() => flip(i.id)}
                        className="shrink-0 gap-1.5"
                      >
                        {connected ? <Unlink size={14} strokeWidth={1.75} /> : <Link2 size={14} strokeWidth={1.75} />}
                        {connected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>

                    <div className="flex-1 space-y-4 border-t border-line bg-subtle/60 px-4 py-4 sm:px-5">
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted">What this enables</p>
                        <ul className="space-y-1.5">
                          {i.enables.map((e) => (
                            <li key={e} className="flex items-start gap-2 text-[13px]">
                              <Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" />
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted">Capability matrix</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(i.caps).map(([k, v]) => (
                            <span
                              key={k}
                              className={cx(
                                "inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs",
                                v ? "border-line bg-surface font-medium text-fg" : "border-line/70 text-muted"
                              )}
                            >
                              {v ? <Check size={11} strokeWidth={2.25} /> : <Minus size={11} strokeWidth={2.25} />}
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>

          {g.id === "Analytics" && !on.gsc && (
            <p className="mt-3 flex items-start gap-2.5 rounded-2xl border border-warning/40 bg-warning-bg p-3.5 text-[13px] text-warning-fg">
              <AlertTriangle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span>Until Search Console is connected, clicks, impressions and rankings show as “Unavailable” rather than estimates.</span>
            </p>
          )}
        </section>
      ))}

      {(activeTab === "all" || activeTab === "webhooks") && <WebhookPanel />}
    </div>
  );
}

export function WebhookPanel() {
  const [url, setUrl] = useState("https://api.verdantbotanics.com/hooks/content");
  const [events, setEvents] = useState<string[]>(["content.published", "content.updated"]);
  const [res, setRes] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const secret = "whsec_••••••••••••••••a91f";
  const payload = JSON.stringify(
    {
      event: events[0] ?? "content.published",
      idempotency_key: "9f2a1c04e7b81d3a",
      content: {
        id: 42,
        type: "article",
        title: "The Complete Guide to Organic Skincare",
        slug: "the-complete-guide-to-organic-skincare",
        html: "<p>…</p>",
        meta: { title: "…", description: "…" },
        version: 3,
      },
    },
    null,
    2
  );
  const failedCount = deliveryLog.filter((d) => d.status !== 200).length;
  const failed = res?.startsWith("Failed");
  const retry = () => toast("Retry queued with the same idempotency key");

  return (
    <section aria-label="Custom webhook">
      <SectionHead
        icon={Webhook}
        title="Custom webhook"
        description="Send signed payloads to your own backend. Idempotency keys prevent duplicate publishing."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Config */}
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium">Webhook URL</span>
            <input className="field mono" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">
              <Lock size={13} strokeWidth={1.75} className="text-muted" />
              Signing secret
            </span>
            <input readOnly className="field mono" value={secret} />
            <span className="mt-1.5 block text-xs text-muted">
              Verify the X-Signature HMAC header on your server. The secret is never exposed to the browser in production.
            </span>
          </label>

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium">Events</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {webhookEvents.map((e) => {
                const checked = events.includes(e);
                return (
                  <label
                    key={e}
                    className={cx(
                      "mono flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-[13px] transition-colors focus-within:ring-2 focus-within:ring-line",
                      checked ? "border-line-strong bg-subtle" : "border-line hover:bg-subtle"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded"
                      checked={checked}
                      onChange={() => setEvents(checked ? events.filter((x) => x !== e) : [...events, e])}
                    />
                    <span className="min-w-0 truncate">{e}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <Button
              variant="outline"
              disabled={pending}
              className="gap-1.5"
              onClick={() =>
                start(async () => {
                  const r = await webhookTest(url, "connection.test");
                  setRes(`${r.ok ? "OK" : "Failed"} · status ${r.status} · key ${r.key} · ${r.body}`);
                })
              }
            >
              <Activity size={14} strokeWidth={1.75} /> Test connection
            </Button>
            <Button
              disabled={pending}
              className="gap-1.5"
              onClick={() =>
                start(async () => {
                  const r = await webhookTest(url, "content.published");
                  setRes(`${r.ok ? "Test publish delivered" : "Failed"} · status ${r.status} · idempotency key ${r.key}`);
                })
              }
            >
              <Send size={14} strokeWidth={1.75} /> Test publish
            </Button>
          </div>

          {res && (
            <p
              role="status"
              className={cx(
                "mono flex items-start gap-2 break-all rounded-xl p-3",
                failed ? "bg-warning-bg text-warning-fg" : "bg-success-bg text-success-fg"
              )}
            >
              {failed ? <AlertTriangle size={14} className="mt-0.5 shrink-0" /> : <Check size={14} className="mt-0.5 shrink-0" />}
              <span className="min-w-0">{res}</span>
            </p>
          )}
        </div>

        {/* Payload preview */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-semibold">Payload preview</h3>
            <span className={cx(chip, "mono max-w-[60%] truncate")}>{events[0] ?? "content.published"}</span>
          </div>
          <pre className="mono max-h-96 flex-1 overflow-auto rounded-xl bg-sunken p-3.5">{payload}</pre>
        </div>
      </div>

      {/* Delivery log */}
      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold">Delivery log</h3>
          <span className="text-xs tabular-nums text-muted">
            {deliveryLog.length} deliveries{failedCount > 0 && ` · ${failedCount} failed`}
          </span>
        </div>

        {deliveryLog.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
            <p className="text-[15px] font-semibold">No deliveries yet</p>
            <p className="mt-1 text-[13px] text-muted">Send a test publish to see it appear here.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Delivery</Th>
                      <Th>Event</Th>
                      <Th>Status</Th>
                      <Th className="hidden xl:table-cell">Idempotency key</Th>
                      <Th className="hidden lg:table-cell">Attempts</Th>
                      <Th>Time</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryLog.map((d) => (
                      <tr key={d.id} className={trClass}>
                        <Td className="mono">{d.id}</Td>
                        <Td className="mono">{d.event}</Td>
                        <Td>
                          <Badge tone={d.status === 200 ? "success" : "danger"}>{d.status}</Badge>
                        </Td>
                        <Td className="mono hidden xl:table-cell">{d.key}</Td>
                        <Td className="hidden tabular-nums lg:table-cell">{d.attempt}</Td>
                        <Td className="whitespace-nowrap text-muted">{d.at}</Td>
                        <Td>
                          {d.status !== 200 && (
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={retry}>
                              <RefreshCw size={12} /> Retry
                            </Button>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface md:hidden">
              {deliveryLog.map((d) => (
                <li key={d.id} className="space-y-2 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="mono min-w-0 truncate text-[13px] font-medium">{d.event}</p>
                    <Badge tone={d.status === 200 ? "success" : "danger"}>{d.status}</Badge>
                  </div>
                  <p className="mono break-all text-xs text-muted">{d.id} · {d.key}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs tabular-nums text-muted">
                      {d.at} · {d.attempt} attempt{Number(d.attempt) === 1 ? "" : "s"}
                    </p>
                    {d.status !== 200 && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={retry}>
                        <RefreshCw size={12} /> Retry
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}