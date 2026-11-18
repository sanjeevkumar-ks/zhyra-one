"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { FilterSelect } from "@/components/filters";
import { SettingsRow, SettingsSection } from "@/components/settings/settings-ui";
import { saveBrand } from "@/app/actions";
import type { BrandData } from "@/lib/types";
import {
  Check,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

const TONES = [
  "Professional",
  "Friendly",
  "Authoritative",
  "Conversational",
  "Technical",
  "Inspirational",
  "Empathetic",
];

const STYLES = [
  "Simple",
  "Detailed",
  "Educational",
  "Persuasive",
  "Action-oriented",
  "Analytical",
];

const FONTS = ["Inter", "DM Sans", "Geist", "Playfair Display", "Lora", "Source Serif 4", "System default"].map((f) => ({
  value: f,
  label: f,
}));

interface Asset { name: string; url: string }
interface Identity {
  brandName: string;
  tagline: string;
  titleSuffix: string;
  logo: Asset | null;
  favicon: Asset | null;
  primary: string;
  secondary: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  colorsInImages: boolean;
  watermark: boolean;
}
interface GuidelinesDoc { name: string; size: string; updated: string }

const DEFAULT_AUDIENCE =
  "Discerning consumers looking for science-backed organic skincare with clean ingredients, sustainable packaging, and transparent clinical trial results.";
const DEFAULT_PRODUCTS = "Botanical Cleanser, Hydra-Barrier Serum, Bakuchiol Night Oil, Mineral SPF 50";
const DEFAULT_DOC: GuidelinesDoc = {
  name: "verdant-botanics-editorial-guidelines-v2.pdf",
  size: "2.8 MB",
  updated: "Updated 12 days ago",
};
const DEFAULT_IDENTITY: Identity = {
  brandName: "Verdant Botanics",
  tagline: "Botanical skincare, backed by science",
  titleSuffix: "| Verdant Botanics",
  logo: null,
  favicon: null,
  primary: "#2F5D46",
  secondary: "#E8D9C5",
  accent: "#F5EFE6",
  headingFont: "Playfair Display",
  bodyFont: "Inter",
  colorsInImages: true,
  watermark: false,
};

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";

/* ---------- colour helpers ---------- */
const HEX = /^#[0-9a-f]{6}$/i;
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const readable = (hex: string) =>
  HEX.test(hex) ? (contrast(hex, "#FFFFFF") >= contrast(hex, "#111111") ? "#FFFFFF" : "#111111") : "#111111";

/* ---------- local UI pieces ---------- */
function FullRow({
  label,
  description,
  htmlFor,
  right,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {htmlFor ? (
            <label htmlFor={htmlFor} className="text-[13px] font-medium">{label}</label>
          ) : (
            <p className="text-[13px] font-medium">{label}</p>
          )}
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        ring,
        active ? "border-fg bg-fg text-bg" : "border-line bg-surface text-muted hover:bg-sunken hover:text-fg"
      )}
    >
      {active && <Check size={13} strokeWidth={2.25} />}
      {children}
    </button>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        ring,
        checked ? "bg-fg" : "bg-line-strong"
      )}
    >
      <span
        className={cx(
          "inline-block h-4 w-4 rounded-full bg-bg shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const valid = HEX.test(value);
  return (
    <div>
      <div className="flex items-center gap-2">
        <label
          className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-line focus-within:ring-2 focus-within:ring-line"
          style={{ background: valid ? value : "transparent" }}
        >
          <input
            type="color"
            aria-label={`${label} colour picker`}
            value={valid ? value.toLowerCase() : "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          id={id}
          className={cx("field mono", !valid && "!border-danger")}
          value={value}
          maxLength={7}
          spellCheck={false}
          aria-invalid={!valid}
          onChange={(e) => {
            let v = e.target.value.trim();
            if (v && !v.startsWith("#")) v = `#${v}`;
            onChange(v.toUpperCase());
          }}
        />
      </div>
      {!valid && <p className="mt-1.5 text-xs text-danger">Use a 6-digit hex value, e.g. #2F5D46</p>}
    </div>
  );
}

function AssetField({
  id,
  asset,
  hint,
  accept,
  onPick,
  onClear,
}: {
  id: string;
  asset: Asset | null;
  hint: string;
  accept: string;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sunken text-muted">
        {asset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt="" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon size={18} strokeWidth={1.75} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{asset?.name ?? "No file"}</p>
        <p className="truncate text-xs text-muted">{hint}</p>
      </div>
      <label
        className={cx(
          "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium transition-colors hover:bg-sunken focus-within:ring-2 focus-within:ring-line"
        )}
      >
        <Upload size={14} strokeWidth={1.75} />
        {asset ? "Replace" : "Upload"}
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
        />
      </label>
      {asset && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove file"
          title="Remove file"
          className={cx(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-danger",
            ring
          )}
        >
          <Trash2 size={15} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

interface BrandSettingsProps {
  initialBrand: BrandData;
}

export function BrandSettings({ initialBrand }: BrandSettingsProps) {
  const [brand, setBrand] = useState<BrandData>(initialBrand);
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [identity, setIdentity] = useState<Identity>(DEFAULT_IDENTITY);
  const [guidelinesDoc, setGuidelinesDoc] = useState<GuidelinesDoc | null>(DEFAULT_DOC);
  const [pending, start] = useTransition();

  const snapshot = { brand, audience, products, identity, doc: guidelinesDoc };
  const [base, setBase] = useState(snapshot);
  const dirty = JSON.stringify(snapshot) !== JSON.stringify(base);

  const colorsValid = HEX.test(identity.primary) && HEX.test(identity.secondary) && HEX.test(identity.accent);
  const setId = <K extends keyof Identity>(key: K, value: Identity[K]) => setIdentity((p) => ({ ...p, [key]: value }));

  const toggleTone = (t: string) => {
    setBrand((prev) => ({
      ...prev,
      tone: prev.tone.includes(t)
        ? prev.tone.filter((x) => x !== t)
        : [...prev.tone, t],
    }));
  };

  const toggleStyle = (s: string) => {
    setBrand((prev) => ({
      ...prev,
      style: prev.style.includes(s)
        ? prev.style.filter((x) => x !== s)
        : [...prev.style, s],
    }));
  };

  const handleSave = () => {
    const snap = snapshot;
    start(async () => {
      await saveBrand(brand);
      setBase(snap);
      toast("Brand Knowledge Profile saved successfully");
    });
  };

  const handleDiscard = () => {
    setBrand(base.brand);
    setAudience(base.audience);
    setProducts(base.products);
    setIdentity(base.identity);
    setGuidelinesDoc(base.doc);
  };

  const pickAsset = (key: "logo" | "favicon") => (f: File) =>
    setId(key, { name: f.name, url: URL.createObjectURL(f) });

  const initials =
    identity.brandName
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "B";

  const swatches = [
    { label: "Primary", value: identity.primary },
    { label: "Secondary", value: identity.secondary },
    { label: "Accent", value: identity.accent },
  ];
  const primaryRatio = HEX.test(identity.primary) ? contrast(identity.primary, readable(identity.primary)) : null;

  return (
    <div className="space-y-6">
      {/* Identity panel */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-semibold"
          style={{
            background: HEX.test(identity.primary) ? identity.primary : "var(--sunken)",
            color: readable(identity.primary),
          }}
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <h2 className="truncate text-[15px] font-semibold">{identity.brandName || "Untitled brand"}</h2>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {identity.tagline || "Brand knowledge profile"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success-bg px-2.5 text-xs font-medium text-success-fg">
            <CheckCircle2 size={12} strokeWidth={2} />
            Profile active
          </span>
          <span className="text-xs text-muted">Last synced today</span>
        </div>
      </div>

      {/* AI context engine note */}
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-subtle p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface">
          <Sparkles size={16} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">Automated brand guardrail engine</p>
          <p className="mt-0.5 text-xs text-muted">
            Every generated brief, article draft, and SEO meta element is dynamically conditioned on this profile. Restricted claims are automatically flagged and scrubbed before editorial review.
          </p>
        </div>
      </div>

      {/* Brand identity */}
      <SettingsSection title="Brand identity" description="How your brand is named and presented in generated content and previews.">
        <SettingsRow label="Brand name" description="Used in copy, schema and previews." htmlFor="brand-name">
          <input id="brand-name" className="field" value={identity.brandName} onChange={(e) => setId("brandName", e.target.value)} />
        </SettingsRow>
        <SettingsRow label="Tagline" description="A short line describing what you do." htmlFor="brand-tagline">
          <input id="brand-tagline" className="field" value={identity.tagline} onChange={(e) => setId("tagline", e.target.value)} />
        </SettingsRow>
        <SettingsRow label="Meta title suffix" description="Appended to SEO titles when there's room." htmlFor="brand-suffix">
          <input id="brand-suffix" className="field" value={identity.titleSuffix} onChange={(e) => setId("titleSuffix", e.target.value)} />
        </SettingsRow>
        <SettingsRow label="Logo" description="SVG or PNG, transparent background." htmlFor="brand-logo">
          <AssetField
            id="brand-logo"
            asset={identity.logo}
            hint="SVG, PNG or WebP · up to 2 MB"
            accept="image/svg+xml,image/png,image/webp"
            onPick={pickAsset("logo")}
            onClear={() => setId("logo", null)}
          />
        </SettingsRow>
        <SettingsRow label="Favicon" description="Square image, at least 64×64." htmlFor="brand-favicon">
          <AssetField
            id="brand-favicon"
            asset={identity.favicon}
            hint="PNG or ICO · square"
            accept="image/png,image/x-icon,image/svg+xml"
            onPick={pickAsset("favicon")}
            onClear={() => setId("favicon", null)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* Brand colours */}
      <SettingsSection title="Brand colours" description="Applied to generated images, infographics and previews.">
        <SettingsRow label="Primary" description="Key accents and headings." htmlFor="color-primary">
          <ColorField id="color-primary" label="Primary" value={identity.primary} onChange={(v) => setId("primary", v)} />
        </SettingsRow>
        <SettingsRow label="Secondary" description="Backgrounds and supporting shapes." htmlFor="color-secondary">
          <ColorField id="color-secondary" label="Secondary" value={identity.secondary} onChange={(v) => setId("secondary", v)} />
        </SettingsRow>
        <SettingsRow label="Accent" description="Highlights and light surfaces." htmlFor="color-accent">
          <ColorField id="color-accent" label="Accent" value={identity.accent} onChange={(v) => setId("accent", v)} />
        </SettingsRow>
        <div className="px-4 py-4 sm:px-5">
          <p className="mb-2 text-xs font-medium text-muted">Palette preview</p>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
            {swatches.map((s) => (
              <div
                key={s.label}
                className="flex h-20 flex-col justify-between p-2.5"
                style={{ background: HEX.test(s.value) ? s.value : "#FFFFFF", color: readable(s.value) }}
              >
                <span className="text-lg font-semibold leading-none">Aa</span>
                <span className="text-[11px] leading-tight">
                  {s.label}
                  <span className="mono block opacity-80">{HEX.test(s.value) ? s.value : "Invalid"}</span>
                </span>
              </div>
            ))}
          </div>
          {primaryRatio !== null && (
            <p className="mt-2 text-xs tabular-nums text-muted">
              Text on primary: {primaryRatio.toFixed(1)}:1 · {primaryRatio >= 4.5 ? "meets WCAG AA" : "below WCAG AA (4.5:1)"}
            </p>
          )}
        </div>
        <SettingsRow label="Use brand colours in generated images" description="Image generation follows this palette.">
          <div className="flex sm:justify-end">
            <Switch label="Use brand colours in generated images" checked={identity.colorsInImages} onChange={(v) => setId("colorsInImages", v)} />
          </div>
        </SettingsRow>
        <SettingsRow label="Add logo watermark to images" description="Requires an uploaded logo.">
          <div className="flex sm:justify-end">
            <Switch label="Add logo watermark to images" checked={identity.watermark} onChange={(v) => setId("watermark", v)} />
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* Typography */}
      <SettingsSection title="Typography" description="Fonts used in image text, infographics and article previews.">
        <SettingsRow label="Heading font" htmlFor="font-heading">
          <FilterSelect label="Heading font" value={identity.headingFont} onChange={(v) => setId("headingFont", v)} options={FONTS} />
        </SettingsRow>
        <SettingsRow label="Body font" htmlFor="font-body">
          <FilterSelect label="Body font" value={identity.bodyFont} onChange={(v) => setId("bodyFont", v)} options={FONTS} />
        </SettingsRow>
        <div className="bg-subtle px-4 py-4 sm:px-5">
          <p className="mb-2 text-xs font-medium text-muted">Preview</p>
          <p
            className="text-xl font-semibold leading-snug tracking-tight"
            style={{ fontFamily: `"${identity.headingFont}", system-ui, sans-serif` }}
          >
            The Complete Guide to Organic Skincare
          </p>
          <p
            className="mt-1 text-sm text-muted"
            style={{ fontFamily: `"${identity.bodyFont}", system-ui, sans-serif` }}
          >
            Clean ingredients, transparent trials and routines that fit real skin.
          </p>
        </div>
      </SettingsSection>

      {/* Voice & style */}
      <SettingsSection title="Voice & style" description="Tone and structure applied to every generated draft.">
        <FullRow
          label="Tone of voice"
          description="Select the emotional resonance and attitude for generated copy."
          right={<span className="shrink-0 text-xs tabular-nums text-muted">{brand.tone.length} selected</span>}
        >
          <div role="group" aria-label="Tone of voice" className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <ToggleChip key={t} active={brand.tone.includes(t)} onClick={() => toggleTone(t)}>
                {t}
              </ToggleChip>
            ))}
          </div>
        </FullRow>
        <FullRow
          label="Writing style"
          description="Defines sentence complexity, readability grade level, and structure."
          right={<span className="shrink-0 text-xs tabular-nums text-muted">{brand.style.length} selected</span>}
        >
          <div role="group" aria-label="Writing style" className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <ToggleChip key={s} active={brand.style.includes(s)} onClick={() => toggleStyle(s)}>
                {s}
              </ToggleChip>
            ))}
          </div>
        </FullRow>
      </SettingsSection>

      {/* Audience & offerings */}
      <SettingsSection title="Audience & core offerings" description="Context used by the generator to tailor value propositions.">
        <FullRow label="Target audience persona" description="Demographics, pain points, and buyer intent." htmlFor="brand-audience">
          <textarea id="brand-audience" className="field" rows={3} value={audience} onChange={(e) => setAudience(e.target.value)} />
        </FullRow>
        <FullRow label="Primary products or services" description="Key product lines to naturally mention in solutions." htmlFor="brand-products">
          <input id="brand-products" className="field" value={products} onChange={(e) => setProducts(e.target.value)} />
        </FullRow>
      </SettingsSection>

      {/* Compliance */}
      <SettingsSection
        title="Compliance & prohibited claims"
        description="Strict negative constraints. The AI model will never output these words or unverified assertions."
      >
        <FullRow
          label="Words, phrases, or unapproved claims to avoid"
          description="Comma-separated forbidden terms (e.g., 'cure, 100% chemical-free, guaranteed results')."
          htmlFor="brand-avoid"
        >
          <input
            id="brand-avoid"
            className="field"
            value={brand.avoid}
            onChange={(e) => setBrand({ ...brand, avoid: e.target.value })}
            placeholder="miracle cure, eliminates wrinkles overnight, chemicals-free"
          />
        </FullRow>
        <FullRow
          label="Benchmark reference websites"
          description="External publications or industry benchmarks that exemplify your desired editorial standard."
          htmlFor="brand-references"
        >
          <input
            id="brand-references"
            className="field"
            value={brand.references}
            onChange={(e) => setBrand({ ...brand, references: e.target.value })}
            placeholder="https://byrdie.com, https://healthline.com/skincare"
          />
        </FullRow>
      </SettingsSection>

      {/* Guidelines document */}
      <SettingsSection
        title="Brand guidelines document"
        description="Full PDF or Markdown styleguide parsed into the semantic vector index."
      >
        <div className="px-4 py-4 sm:px-5">
          {guidelinesDoc ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-subtle p-3.5">
              <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface">
                  <FileText size={18} strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{guidelinesDoc.name}</p>
                  <p className="text-xs text-muted">{guidelinesDoc.size} · {guidelinesDoc.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toast("Upload a replacement brand PDF (Mock)")}>
                  Replace
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setGuidelinesDoc(null);
                    toast("Brand guideline removed");
                  }}
                  aria-label="Remove document"
                  title="Remove document"
                  className={cx(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-danger",
                    ring
                  )}
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setGuidelinesDoc({
                  name: "verdant-botanics-editorial-guidelines-v2.pdf",
                  size: "2.8 MB",
                  updated: "Uploaded just now",
                });
                toast("Document uploaded and indexed");
              }}
              className={cx(
                "flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-4 py-8 text-center transition-colors hover:bg-subtle",
                ring
              )}
            >
              <Upload size={22} strokeWidth={1.75} className="mb-2 text-muted" />
              <span className="text-[13px] font-medium">Click to upload brand guideline PDF</span>
              <span className="mt-1 text-xs text-muted">PDF, DOCX or Markdown up to 25MB</span>
            </button>
          )}
        </div>
      </SettingsSection>

      {/* Unsaved changes bar */}
      {dirty && (
        <div
          role="status"
          className="enter sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 pl-4 shadow-lg"
        >
          <p className="text-[13px] font-medium">
            {colorsValid ? "Unsaved changes" : "Fix the highlighted colour values to save"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDiscard} disabled={pending}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={pending || !colorsValid}>
              {pending ? "Saving profile..." : "Save Brand Knowledge Profile"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}