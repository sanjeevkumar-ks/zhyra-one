"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Field, Modal, toast } from "@/components/ui-client";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-ui";

/* ------------------------------ data ------------------------------ */

interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
}

const INITIAL_KEYS: ApiKeyRecord[] = [
  {
    id: "key_1",
    name: "Production CMS Sync",
    prefix: "vos_live_••••••••••••c4d2",
    created: "Oct 14, 2026",
    lastUsed: "22 mins ago",
  },
  {
    id: "key_2",
    name: "Staging Pipeline Script",
    prefix: "vos_test_••••••••••••9e1a",
    created: "Nov 02, 2026",
    lastUsed: "3 days ago",
  },
];

const WEBHOOK_LOGS = [
  {
    id: "evt_9918",
    event: "content.published",
    status: 200,
    time: "14 mins ago",
    url: "https://api.verdantbotanics.com/webhooks/vos",
  },
  {
    id: "evt_9917",
    event: "audit.completed",
    status: 200,
    time: "4 hours ago",
    url: "https://api.verdantbotanics.com/webhooks/vos",
  },
  {
    id: "evt_9916",
    event: "visibility.rank_drop",
    status: 200,
    time: "Yesterday",
    url: "https://api.verdantbotanics.com/webhooks/vos",
  },
  {
    id: "evt_9915",
    event: "content.needs_review",
    status: 504,
    time: "2 days ago",
    url: "https://api.verdantbotanics.com/webhooks/vos",
  },
];

type Lang = "curl" | "typescript" | "python";

const LANGS: { id: Lang; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
];

const CODE_SNIPPETS: Record<Lang, string> = {
  curl: `curl -X GET "https://api.visibilityos.com/v1/keywords?limit=10" \\
  -H "Authorization: Bearer vos_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  typescript: `import { VisibilityClient } from "@visibilityos/sdk";

const client = new VisibilityClient({
  apiKey: process.env.VOS_API_KEY,
});

const { keywords } = await client.keywords.list({
  limit: 10,
  minSearchVolume: 500,
});`,
  python: `from visibilityos import VisibilityOS

client = VisibilityOS(api_key="vos_live_YOUR_API_KEY")

response = client.keywords.list(
    limit=10,
    opportunity_score="high"
)`,
};

/* ----------------------------- helpers ---------------------------- */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";

const inputCls = cx(
  "h-9 w-full rounded-full border border-line bg-surface px-3.5 text-[13px] text-fg",
  "placeholder:text-muted read-only:bg-subtle transition-colors",
  ring
);

const iconBtn = cx(
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted",
  "transition-colors hover:bg-sunken hover:text-fg",
  ring
);

const DELIVERY_GRID =
  "md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_6rem_7rem_5.5rem]";

function FullRow({
  label,
  hint,
  htmlFor,
  warn,
  children,
}: {
  label: string;
  hint: string;
  htmlFor?: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg">
        {label}
      </label>
      <p className={cx("mb-2.5 mt-0.5 text-xs", warn ? "text-warning-fg" : "text-muted")}>
        {hint}
      </p>
      {children}
    </div>
  );
}

function Chip({ tone, children }: { tone: "success" | "warning" | "danger"; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium",
        tone === "success" && "bg-success-bg text-success-fg",
        tone === "warning" && "bg-warning-bg text-warning-fg",
        tone === "danger" && "bg-danger/10 text-danger"
      )}
    >
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: number }) {
  return status === 200 ? (
    <Chip tone="success">200 OK</Chip>
  ) : (
    <Chip tone="danger">{status} Error</Chip>
  );
}

/* ---------------------------- component --------------------------- */

export function DeveloperSettings() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>(INITIAL_KEYS);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState("https://api.verdantbotanics.com/webhooks/vos");
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [signingSecret] = useState("whsec_98319f018a7c2b64dd810e981");

  const [selectedLanguage, setSelectedLanguage] = useState<Lang>("curl");

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const rawSecret = "vos_live_" + Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("");
    const masked = rawSecret.slice(0, 9) + "••••••••••••" + rawSecret.slice(-4);

    setKeys([
      {
        id: "key_" + Date.now(),
        name: newKeyName,
        prefix: masked,
        created: "Just now",
        lastUsed: "Never",
      },
      ...keys,
    ]);

    setGeneratedKey(rawSecret);
  };

  const handleRevokeKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
    toast("API key revoked immediately");
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast(`${label} copied to clipboard`);
  };

  const handleTestWebhook = () => {
    toast("Test payload dispatched! Received 200 OK from endpoint.");
  };

  const closeKeyModal = () => {
    setShowKeyModal(false);
    setGeneratedKey(null);
    setNewKeyName("");
  };

  const urlSecure = webhookUrl.trim().startsWith("https://");
  const failedCount = WEBHOOK_LOGS.filter((l) => l.status !== 200).length;

  return (
    <div className="space-y-6">
      {/* Header + summary */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-fg">Developer & API Integrations</h2>
        <p className="mt-1 text-[13px] text-muted">
          Manage REST API authentication tokens, webhook event subscriptions, and integration logs.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
          <div className="bg-surface px-4 py-3.5">
            <p className="text-xs text-muted">Active keys</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-fg sm:text-lg">{keys.length}</p>
          </div>
          <div className="bg-surface px-4 py-3.5">
            <p className="text-xs text-muted">Endpoint</p>
            <p className="mt-1 text-base font-semibold text-fg sm:text-lg">
              {urlSecure ? "Secure" : "Insecure"}
            </p>
          </div>
          <div className="bg-surface px-4 py-3.5">
            <p className="text-xs text-muted">Failed deliveries</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-fg sm:text-lg">{failedCount}</p>
          </div>
        </div>
      </div>

      {/* API keys */}
      <SettingsSection
        title="API keys"
        description="Bearer tokens for server-side integration. Keep secret keys secure."
        action={
          <Button onClick={() => setShowKeyModal(true)}>
            <Plus size={16} strokeWidth={1.5} className="mr-1.5 shrink-0" />
            Create new key
          </Button>
        }
        footer={
          <p className="text-xs text-muted">
            {keys.length} {keys.length === 1 ? "key" : "keys"} · Never expose secret keys in client-side code
          </p>
        }
      >
        {keys.length === 0 ? (
          <div className="p-5">
            <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-line bg-subtle text-muted">
                <KeyRound size={18} strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-sm font-medium text-fg">No API keys yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
                Create a key to authenticate requests from your CMS, scripts or automation tools.
              </p>
            </div>
          </div>
        ) : (
          keys.map((k) => {
            const isTest = k.prefix.startsWith("vos_test");
            return (
              <div key={k.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-subtle text-muted">
                  <KeyRound size={16} strokeWidth={1.5} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-fg">{k.name}</p>
                    <Chip tone={isTest ? "warning" : "success"}>{isTest ? "Test" : "Live"}</Chip>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted">{k.prefix}</p>
                  <p className="mt-0.5 text-xs text-muted sm:hidden">
                    Created {k.created} · Last used {k.lastUsed}
                  </p>
                </div>

                <div className="hidden w-40 shrink-0 text-right text-xs text-muted sm:block">
                  <p>Created {k.created}</p>
                  <p className="mt-0.5">Last used {k.lastUsed}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevokeKey(k.id)}
                  className={cx(iconBtn, "hover:text-danger")}
                  title="Revoke key"
                  aria-label={`Revoke ${k.name}`}
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
            );
          })
        )}
      </SettingsSection>

      {/* Webhook endpoint */}
      <SettingsSection
        title="Webhook endpoint"
        description="Receive real-time HTTP POST notifications when events occur in your workspace."
        footer={
          <p className="text-xs text-muted">Payloads are signed with HMAC SHA-256 on every request</p>
        }
      >
        <FullRow
          label="Endpoint URL"
          htmlFor="webhook-url"
          hint={
            urlSecure
              ? "Must be a publicly accessible HTTPS URL"
              : "This URL doesn't start with https:// — webhooks require a secure endpoint"
          }
          warn={!urlSecure}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              inputMode="url"
              spellCheck={false}
              className={cx(inputCls, "font-mono text-xs")}
            />
            <Button variant="outline" onClick={handleTestWebhook} className="shrink-0">
              <Play size={14} strokeWidth={1.5} className="mr-1.5 shrink-0" />
              Send test
            </Button>
          </div>
        </FullRow>

        <FullRow
          label="Signing secret"
          htmlFor="webhook-secret"
          hint="Used to verify HMAC SHA-256 signatures in the Vos-Signature header"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="webhook-secret"
                readOnly
                value={secretRevealed ? signingSecret : "••••••••••••••••••••••••••••••••"}
                className={cx(inputCls, "pr-24 font-mono text-xs")}
              />
              <button
                type="button"
                onClick={() => setSecretRevealed(!secretRevealed)}
                aria-pressed={secretRevealed}
                className={cx(
                  "absolute right-1.5 top-1/2 inline-flex h-6 -translate-y-1/2 items-center gap-1 rounded-full px-2.5",
                  "text-xs font-medium text-muted transition-colors hover:bg-sunken hover:text-fg",
                  ring
                )}
              >
                {secretRevealed ? (
                  <>
                    <EyeOff size={13} strokeWidth={1.5} />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye size={13} strokeWidth={1.5} />
                    Reveal
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(signingSecret, "Webhook signing secret")}
              title="Copy secret"
              aria-label="Copy signing secret"
              className={cx(iconBtn, "h-9 w-9 border border-line")}
            >
              <Copy size={15} strokeWidth={1.5} />
            </button>
          </div>
        </FullRow>
      </SettingsSection>

      {/* Quickstart */}
      <SettingsSection
        title="API quickstart"
        description="Example request showing authorization and data retrieval."
      >
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Code language" className="inline-flex rounded-full bg-sunken p-0.5">
              {LANGS.map((l) => {
                const active = selectedLanguage === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedLanguage(l.id)}
                    className={cx(
                      "h-7 rounded-full px-3 text-xs font-medium transition-colors",
                      active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
                      ring
                    )}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(CODE_SNIPPETS[selectedLanguage], "Code snippet")}
              className={cx(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted",
                "transition-colors hover:bg-sunken hover:text-fg",
                ring
              )}
            >
              <Copy size={14} strokeWidth={1.5} />
              Copy snippet
            </button>
          </div>

          <pre className="overflow-x-auto rounded-xl border border-line bg-subtle p-4 font-mono text-xs leading-relaxed text-fg">
            {CODE_SNIPPETS[selectedLanguage]}
          </pre>
        </div>
      </SettingsSection>

      {/* Deliveries */}
      <SettingsSection
        title="Recent webhook deliveries"
        description="Audit log of outbound HTTP requests."
        footer={
          <p className="text-xs tabular-nums text-muted">
            {WEBHOOK_LOGS.length} deliveries · {failedCount} failed
          </p>
        }
      >
        <div
          className={cx(
            "hidden gap-3 bg-subtle px-5 py-2.5 text-xs font-medium text-muted md:grid",
            DELIVERY_GRID
          )}
        >
          <span>Event</span>
          <span>Destination</span>
          <span>Status</span>
          <span>Time</span>
          <span className="text-right">Action</span>
        </div>

        {WEBHOOK_LOGS.map((log) => (
          <div key={log.id}>
            {/* Desktop row */}
            <div className={cx("hidden items-center gap-3 px-5 py-3 md:grid", DELIVERY_GRID)}>
              <span className="truncate font-mono text-xs font-medium text-fg">{log.event}</span>
              <span className="truncate font-mono text-xs text-muted" title={log.url}>
                {log.url}
              </span>
              <span>
                <StatusChip status={log.status} />
              </span>
              <span className="text-xs text-muted">{log.time}</span>
              <span className="text-right">
                <button
                  type="button"
                  onClick={() => toast(`Redelivering ${log.id}...`)}
                  className={cx(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted",
                    "transition-colors hover:bg-sunken hover:text-fg",
                    ring
                  )}
                >
                  <RotateCcw size={12} strokeWidth={1.5} />
                  Retry
                </button>
              </span>
            </div>

            {/* Mobile row */}
            <div className="flex items-start gap-3 px-5 py-3.5 md:hidden">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-mono text-xs font-medium text-fg">{log.event}</p>
                  <StatusChip status={log.status} />
                </div>
                <p className="mt-1 truncate font-mono text-xs text-muted">{log.url}</p>
                <p className="mt-0.5 text-xs text-muted">{log.time}</p>
              </div>
              <button
                type="button"
                onClick={() => toast(`Redelivering ${log.id}...`)}
                className={iconBtn}
                title="Retry delivery"
                aria-label={`Retry ${log.id}`}
              >
                <RotateCcw size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
      </SettingsSection>

      {/* Create key modal */}
      <Modal
        open={showKeyModal}
        onClose={closeKeyModal}
        title="Create new API key"
        description="Generate a secret token for programmatic access to VisibilityOS endpoints."
        width={480}
        footer={
          !generatedKey ? (
            <div className="flex w-full items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeKeyModal}>
                Cancel
              </Button>
              <Button type="submit" form="create-api-key-form">
                Generate key
              </Button>
            </div>
          ) : (
            <Button onClick={closeKeyModal}>I have saved my key</Button>
          )
        }
      >
        {!generatedKey ? (
          <form id="create-api-key-form" onSubmit={handleCreateKey} className="space-y-4">
            <Field label="Key description" hint="e.g. CI/CD sync, Zapier automation, Webhook reader">
              <input
                placeholder="e.g. Zapier Production Sync"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
                autoFocus
                className={inputCls}
              />
            </Field>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-warning-bg px-3.5 py-3 text-xs text-warning-fg">
              <ShieldAlert size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Save your key now</p>
                <p className="mt-0.5">
                  For your security, this key will never be shown again. If you lose it, you will need to
                  generate a new one.
                </p>
              </div>
            </div>

            <div className="relative">
              <input
                readOnly
                value={generatedKey}
                aria-label="Generated API key"
                onFocus={(e) => e.currentTarget.select()}
                className={cx(inputCls, "bg-subtle pr-12 font-mono text-xs")}
              />
              <button
                type="button"
                onClick={() => handleCopy(generatedKey, "API key")}
                className={cx(iconBtn, "absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2")}
                title="Copy API key"
                aria-label="Copy API key"
              >
                <Copy size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}