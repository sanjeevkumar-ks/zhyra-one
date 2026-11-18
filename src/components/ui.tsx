import Link from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Info, PlugZap, Sparkles } from "lucide-react";
import { PageTabs, type PageTabItem } from "./page-tabs";

export { PageTabs, type PageTabItem };

export const cn = clsx;

/* ---------- Buttons ---------- */
type BtnVariant = "primary" | "secondary" | "outline" | "ghost";
type BtnSize = "sm" | "md" | "lg";
const btnBase =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-fg hover:opacity-85",
  secondary: "bg-sunken text-fg hover:bg-line",
  outline: "border border-line-strong bg-surface text-fg hover:bg-sunken",
  ghost: "text-fg hover:bg-sunken",
};
const btnSizes: Record<BtnSize, string> = { sm: "h-8 px-3 text-sm", md: "h-9 px-4 text-sm", lg: "h-11 px-6 text-[15px]" };
export const btnClass = (variant: BtnVariant = "primary", size: BtnSize = "md", extra?: string) => clsx(btnBase, btnVariants[variant], btnSizes[size], extra);

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return <button type="button" className={btnClass(variant, size, className)} {...props} />;
}
export function ButtonLink({ href, variant = "primary", size = "md", className, children }: { href: string; variant?: BtnVariant; size?: BtnSize; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={btnClass(variant, size, className)}>
      {children}
    </Link>
  );
}
export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={label} className={clsx("inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-fg", className)} {...props} />;
}

/* ---------- Badges ---------- */
export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "outline";
const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-fg",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
  outline: "border border-line-strong text-muted",
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12.5px] font-medium leading-4", tones[tone], className)}>{children}</span>;
}
export const levelTone = (l: string): Tone => (l === "High" ? "success" : l === "Medium" ? "warning" : "neutral");
export const effortTone = (l: string): Tone => (l === "Low" ? "success" : l === "Medium" ? "warning" : "neutral");
export const statusTone = (s: string): Tone =>
  ({ published: "success", scheduled: "info", review: "warning", drafting: "neutral", editing: "neutral", planned: "outline", idea: "outline", brief: "neutral", monitoring: "success", refresh: "warning", archived: "outline" } as Record<string, Tone>)[s] ?? "neutral";
export const intentTone = (i: string): Tone => (i === "transactional" ? "success" : i === "commercial" ? "info" : i === "navigational" ? "outline" : "neutral");
export function Dot({ tone }: { tone: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const c = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info", neutral: "bg-faint" }[tone];
  return <span className={clsx("inline-block h-2 w-2 shrink-0 rounded-full", c)} aria-hidden />;
}

/* ---------- Tooltips & glossary ---------- */
export function Tip({ children, text, side = "top" }: { children: ReactNode; text: ReactNode; side?: "top" | "bottom" }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={clsx(
          "pointer-events-none invisible absolute left-1/2 z-50 w-56 -translate-x-1/2 rounded-lg bg-primary px-3 py-2 text-left text-xs font-normal leading-4 text-primary-fg opacity-0 shadow-sm transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {text}
      </span>
    </span>
  );
}

export const GLOSSARY: Record<string, string> = {
  CTR: "Click-through rate: the share of people who saw your page in search results and clicked it.",
  KD: "Keyword difficulty: an estimate of how hard it is to rank on page one. Lower is easier.",
  SERP: "Search engine results page: the list of results shown for a search.",
  Impressions: "How many times your pages appeared in search results.",
  Position: "Your average ranking in search results. 1 is the top.",
  Volume: "Estimated monthly searches for this phrase.",
  Intent: "What the searcher wants: to learn, compare, buy, or find a specific site.",
  Citation: "An AI answer linking to your website as a source.",
  Mention: "An AI answer naming your brand, with or without a link.",
  Canonical: "A tag telling search engines which URL is the main version of a page.",
  Schema: "Structured data that describes a page to machines. It does not guarantee rich results.",
};
export function Term({ t, children }: { t: keyof typeof GLOSSARY | string; children?: ReactNode }) {
  return (
    <Tip text={GLOSSARY[t] ?? t}>
      <span tabIndex={0} className="cursor-help underline decoration-dotted decoration-faint underline-offset-4">
        {children ?? t}
      </span>
    </Tip>
  );
}
export function Estimate({ children, source = "Estimated from a keyword data provider. Validate before relying on it." }: { children: ReactNode; source?: string }) {
  return (
    <Tip text={`Estimate — ${source}`}>
      <span tabIndex={0} className="cursor-help">
        {children}
        <span className="ml-0.5 text-faint">~</span>
      </span>
    </Tip>
  );
}

export function Why({ impact, effort, confidence, goal, reason }: { impact: string; effort: string; confidence: string; goal: string; reason: string }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" className="inline-flex items-center gap-1 text-sm text-muted underline decoration-dotted underline-offset-4 hover:text-fg" aria-label="Why this recommendation?">
        <Info size={14} strokeWidth={1.5} /> Why this?
      </button>
      <span className="invisible absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-line bg-surface p-4 text-left text-sm leading-snug opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <span className="block text-sm font-medium">{reason}</span>
        <span className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-muted">
          <span>Impact</span><span className="text-fg">{impact}</span>
          <span>Effort</span><span className="text-fg">{effort}</span>
          <span>Confidence</span><span className="text-fg">{confidence}</span>
          <span>Goal relevance</span><span className="text-fg">{goal}</span>
        </span>
      </span>
    </span>
  );
}

/* ---------- Layout ---------- */
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={clsx("rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)}>{children}</div>;
}
export function PageHeader({ title, description, actions, display }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; display?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className={display ? "display" : "h1"}>{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[16px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
export function SectionTitle({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="h2">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={clsx("enter mx-auto w-full px-8 py-8", wide ? "max-w-[1400px]" : "max-w-[1200px]")}>{children}</div>;
}

export function Tabs({
  items,
  active,
  className,
}: {
  items: { id: string; label: ReactNode; href: string; count?: number | string; badge?: ReactNode }[];
  active: string;
  className?: string;
}) {
  return (
    <PageTabs
      items={items}
      active={active}
      className={clsx("mb-6", className)}
    />
  );
}

/* ---------- Data display ---------- */
export function Delta({ value, suffix = "%", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const good = invert ? value < 0 : value >= 0;
  return (
    <span className={clsx("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium", good ? "bg-success-bg text-success-fg" : "bg-danger-bg text-danger-fg")}>
      {value >= 0 ? <ArrowUpRight size={12} strokeWidth={1.5} /> : <ArrowDownRight size={12} strokeWidth={1.5} />}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

export function SampleChip({ label = "Sample data" }: { label?: string }) {
  return (
    <Tip text="Demo workspace: values are illustrative sample data, not live measurements.">
      <span tabIndex={0} className="inline-flex items-center rounded-full border border-dashed border-line-strong px-2 py-0.5 text-xs font-medium text-muted">
        {label}
      </span>
    </Tip>
  );
}

export function Orb({ size = 24, className }: { size?: number; className?: string }) {
  return <span className={clsx("orb inline-block shrink-0", className)} style={{ width: size, height: size }} aria-hidden />;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <Orb size={56} />
      <p className="h3 mt-4">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Unavailable({ source, href = "/integrations", compact = false }: { source: string; href?: string; compact?: boolean }) {
  return (
    <div className={clsx("flex items-center gap-3 rounded-xl border border-dashed border-line-strong bg-subtle", compact ? "p-3" : "p-5")}>
      <PlugZap size={18} strokeWidth={1.5} className="shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Unavailable — connect {source}</p>
        {!compact && <p className="caption mt-0.5">This metric is never estimated or filled with zeros. It appears once the data source is connected.</p>}
      </div>
      <Link href={href} className={btnClass("outline", "sm")}>
        Connect
      </Link>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} aria-hidden />;
}

export function Disclaimer({ children }: { children?: ReactNode }) {
  return <p className="caption mt-3">{children ?? "Scores indicate readiness, not guaranteed outcomes."}</p>;
}

export function AIBadge({ children = "AI" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs font-medium text-muted">
      <Orb size={10} /> {children}
    </span>
  );
}
export function AIAction({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-medium transition-colors hover:bg-sunken disabled:opacity-50" {...props}>
      <Sparkles size={14} strokeWidth={1.5} /> {children}
    </button>
  );
}

/* ---------- Tables ---------- */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-x-auto rounded-2xl border border-line bg-surface", className)}>
      <table className="w-full border-collapse text-sm leading-normal">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={clsx("sticky top-0 h-10 whitespace-nowrap border-b border-line bg-subtle px-3.5 text-left text-sm font-medium text-muted first:pl-4 last:pr-4", className)}>{children}</th>;
}
export function Td({ children, className, onClick }: { children?: ReactNode; className?: string; onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void }) {
  return <td onClick={onClick} className={clsx("h-11 border-b border-line px-3.5 align-middle text-sm text-fg first:pl-4 last:pr-4", className)}>{children}</td>;
}
export const trClass = "transition-colors hover:bg-subtle [&:last-child>td]:border-b-0";

export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span title={name} className="inline-flex shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-medium text-muted" style={{ width: size, height: size }}>
      {initials}
    </span>
  );
}

export function Stat({ label, value, sub, delta, source, children }: { label: ReactNode; value: ReactNode; sub?: ReactNode; delta?: number; source?: string; children?: ReactNode }) {
  return (
    <div className="min-w-0 flex-1 px-5 first:pl-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-medium text-muted">{label}</p>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      <p className="mt-1 text-[38px] font-normal leading-[1.15] tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      {children}
      {source && <p className="mt-1 text-xs text-faint">{source}</p>}
    </div>
  );
}
