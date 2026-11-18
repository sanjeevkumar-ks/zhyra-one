"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Bold,
  Check,
  ChevronDown,
  Clock,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  History,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTree,
  Minus,
  Monitor,
  PanelLeftClose,
  Plus,
  Quote,
  Redo2,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { Badge, Button, Disclaimer, Orb, statusTone, AIAction } from "@/components/ui";
import { Counter, Drawer, Sheet, StateTabs, toast } from "@/components/ui-client";
import { FilterSelect } from "@/components/filters";
import { GenArt } from "@/components/gen-art";
import { Markdown } from "@/lib/markdown";
import { diffWords, applyEdit } from "@/lib/diff";
import { findUnverifiedClaims, mockWriter, REFINE_ACTIONS, sectionsWords, slugify, type RefineAction } from "@/lib/services/ai";
import { computeChecks, scoreChecks, type CheckState } from "@/lib/services/optimise";
import { publishContent, saveContent, saveVersion } from "@/app/actions";
import { STAGES, type ContentStatus, type FeaturedImage, type Section } from "@/lib/types";
import type { ContentRow } from "@/lib/queries";
import { AiAssistantPanel } from "@/components/editor/ai-assistant-panel";
import type { ProposedChange } from "@/lib/services/ai-assistant";

type Tab = "assistant" | "optimise" | "images" | "publish";
type PopId = "link" | "image" | "table" | "chart" | "links" | "find";
type LineKind = "h1" | "h2" | "h3" | "ul" | "ol" | "quote";
type Align = "left" | "center" | "right";
interface Sel { sectionId: string; start: number; end: number; text: string; x: number; y: number }
interface Pending { sectionId: string; start: number; end: number; before: string; after: string; action: RefineAction | "regenerate" }

const STATE_META: Record<CheckState, { label: string; tone: "success" | "warning" | "neutral" | "outline" }> = {
  pass: { label: "Passed", tone: "success" },
  attention: { label: "Needs attention", tone: "warning" },
  na: { label: "Not applicable", tone: "outline" },
  unverified: { label: "Unable to verify", tone: "neutral" },
};

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";
const stageOptions = STAGES.map((s) => ({ value: s.id as string, label: s.label }));
const floatBtn = cx("h-7 rounded-full px-3 text-[13px] font-medium transition-colors hover:bg-sunken", ring);
const iconBtn = cx("inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-fg disabled:cursor-not-allowed disabled:opacity-40", ring);

/* ---------- formatting helpers (markdown) ---------- */
const LINE: Record<LineKind, { test: RegExp; make: (n: number) => string }> = {
  h1: { test: /^#\s+/, make: () => "# " },
  h2: { test: /^##\s+/, make: () => "## " },
  h3: { test: /^###\s+/, make: () => "### " },
  ul: { test: /^[-*]\s+/, make: () => "- " },
  ol: { test: /^\d+\.\s+/, make: (n) => `${n}. ` },
  quote: { test: /^>\s?/, make: () => "> " },
};
const ANY_PREFIX = /^(#{1,6}\s+|[-*]\s+|\d+\.\s+|>\s?)/;

const mdTable = (rows: number, cols: number) => {
  const head = `| ${Array.from({ length: cols }, (_, i) => `Column ${i + 1}`).join(" | ")} |`;
  const sep = `| ${Array(cols).fill("---").join(" | ")} |`;
  const body = Array.from({ length: rows }, () => `| ${Array(cols).fill("Cell").join(" | ")} |`);
  return [head, sep, ...body].join("\n");
};
const mdChart = (kind: string) =>
  `**${kind} chart**\n\n| Category | Value |\n| --- | --- |\n| A | 10 |\n| B | 20 |\n| C | 30 |\n\n[Chart: replace the sample data with real figures]`;

const POP_TITLES: Record<PopId, string> = {
  link: "Insert link",
  image: "Insert image",
  table: "Insert table",
  chart: "Insert chart",
  links: "Links",
  find: "Find & replace",
};

/* ---------- small shared helpers ---------- */
function Block({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, right, hint, children }: { label: string; right?: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium">{label}</span>
        {right}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function PanelIntro({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <p className="mt-0.5 text-[13px] text-muted">{description}</p>
    </div>
  );
}

/* ---------- formatting toolbar pieces ---------- */
function TB({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        ring,
        active ? "bg-sunken text-fg" : "text-muted hover:bg-sunken hover:text-fg"
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1.5 h-5 w-px shrink-0 bg-line" aria-hidden />;

function Pop({ x, y, title, width = 288, onClose, children }: { x: number; y: number; title: string; width?: number; onClose: () => void; children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-label={title}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      className="enter fixed z-[70] rounded-2xl border border-line bg-surface p-3.5 shadow-lg"
      style={{ left: x, top: y, width: `min(${width}px, calc(100vw - 16px))` }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <button type="button" aria-label="Close" onClick={onClose} className={iconBtn}>
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
      {children}
    </div>
  );
}

function LinkPop({ onApply }: { onApply: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const go = () => { if (url.trim()) onApply(url.trim()); };
  return (
    <div className="space-y-3">
      <Field label="URL">
        <input
          autoFocus
          className="field"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); go(); } }}
          placeholder="https://… or /page"
        />
      </Field>
      <Button size="sm" disabled={!url.trim()} onClick={go}>Apply link</Button>
    </div>
  );
}

function ImagePop({ onInsert, onGenerate }: { onInsert: (url: string, alt: string) => void; onGenerate: () => void }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  return (
    <div className="space-y-3">
      <Field label="Image URL">
        <input autoFocus className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/image.jpg" />
      </Field>
      <Field label="Alt text">
        <input className="field" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
      </Field>
      <Button size="sm" disabled={!url.trim()} onClick={() => onInsert(url.trim(), alt.trim())}>Insert image</Button>
      <div className="border-t border-line pt-3">
        <button
          type="button"
          onClick={onGenerate}
          className={cx("inline-flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[13px] text-muted transition-colors hover:bg-sunken hover:text-fg", ring)}
        >
          <Sparkles size={14} strokeWidth={1.75} /> Generate an image with AI
        </button>
      </div>
    </div>
  );
}

function TablePop({ onInsert }: { onInsert: (rows: number, cols: number) => void }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const clamp = (v: string) => Math.min(8, Math.max(1, Number(v) || 1));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rows">
          <input type="number" min={1} max={8} className="field" value={rows} onChange={(e) => setRows(clamp(e.target.value))} />
        </Field>
        <Field label="Columns">
          <input type="number" min={1} max={8} className="field" value={cols} onChange={(e) => setCols(clamp(e.target.value))} />
        </Field>
      </div>
      <Button size="sm" onClick={() => onInsert(rows, cols)}>Insert table</Button>
    </div>
  );
}

const CHART_KINDS = ["Bar", "Line", "Pie"].map((k) => ({ value: k, label: k }));
function ChartPop({ onInsert }: { onInsert: (kind: string) => void }) {
  const [kind, setKind] = useState("Bar");
  return (
    <div className="space-y-3">
      <Field label="Chart type" hint="Adds sample data and a placeholder that blocks publishing until replaced.">
        <FilterSelect label="Chart type" value={kind} onChange={setKind} options={CHART_KINDS} />
      </Field>
      <Button size="sm" onClick={() => onInsert(kind)}>Insert chart</Button>
    </div>
  );
}

function LinksPop({
  sections,
  onSection,
  onSuggest,
  onRemove,
}: {
  sections: Section[];
  onSection: (s: Section) => void;
  onSuggest: () => void;
  onRemove: () => void;
}) {
  const row = cx("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] transition-colors hover:bg-sunken", ring);
  return (
    <div className="-mx-1.5 space-y-2">
      <div>
        <p className="px-2 pb-1 text-xs font-medium text-muted">Link to a section</p>
        <ul className="max-h-48 overflow-y-auto">
          {sections.map((s) => (
            <li key={s.id}>
              <button type="button" className={row} onClick={() => onSection(s)}>
                <span className="truncate">{s.heading || "Untitled section"}</span>
              </button>
            </li>
          ))}
          {sections.length === 0 && <li className="px-2 py-1 text-xs text-muted">No sections yet.</li>}
        </ul>
      </div>
      <div className="space-y-0.5 border-t border-line pt-2">
        <button type="button" className={row} onClick={onSuggest}>
          <Sparkles size={14} strokeWidth={1.75} className="shrink-0 text-muted" /> Internal link suggestions
        </button>
        <button type="button" className={row} onClick={onRemove}>
          <X size={14} strokeWidth={1.75} className="shrink-0 text-muted" /> Remove link at cursor
        </button>
      </div>
    </div>
  );
}

function FindPop({
  sections,
  onGo,
  onReplaceAll,
}: {
  sections: Section[];
  onGo: (sectionId: string, start: number, end: number) => void;
  onReplaceAll: (q: string, r: string) => void;
}) {
  const [q, setQ] = useState("");
  const [r, setR] = useState("");
  const [idx, setIdx] = useState(-1);
  const matches = useMemo(() => {
    if (!q) return [];
    const lq = q.toLowerCase();
    const out: { sectionId: string; start: number; end: number }[] = [];
    sections.forEach((s) => {
      const lb = s.body.toLowerCase();
      let i = lb.indexOf(lq);
      while (i !== -1) {
        out.push({ sectionId: s.id, start: i, end: i + q.length });
        i = lb.indexOf(lq, i + q.length);
      }
    });
    return out;
  }, [q, sections]);

  const step = (d: number) => {
    if (!matches.length) return;
    const n = matches.length;
    const next = idx < 0 ? (d > 0 ? 0 : n - 1) : (Math.min(idx, n - 1) + d + n) % n;
    setIdx(next);
    const m = matches[next];
    onGo(m.sectionId, m.start, m.end);
  };

  return (
    <div className="space-y-3">
      <input
        autoFocus
        aria-label="Find"
        className="field"
        placeholder="Find"
        value={q}
        onChange={(e) => { setQ(e.target.value); setIdx(-1); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); step(e.shiftKey ? -1 : 1); } }}
      />
      <input aria-label="Replace with" className="field" placeholder="Replace with" value={r} onChange={(e) => setR(e.target.value)} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-muted">
          {!q ? "Type to search" : matches.length === 0 ? "No matches" : idx >= 0 ? `${Math.min(idx, matches.length - 1) + 1} of ${matches.length}` : `${matches.length} match${matches.length === 1 ? "" : "es"}`}
        </span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" disabled={!matches.length} onClick={() => step(-1)}>Prev</Button>
          <Button size="sm" variant="outline" disabled={!matches.length} onClick={() => step(1)}>Next</Button>
        </div>
      </div>
      <Button size="sm" disabled={!q || !matches.length} onClick={() => { onReplaceAll(q, r); setIdx(-1); }}>Replace all</Button>
    </div>
  );
}

export function Editor({ item, groupName, autoGenerate }: { item: ContentRow; groupName: string; autoGenerate: boolean }) {
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);
  const [metaTitle, setMetaTitle] = useState(item.metaTitle);
  const [metaDescription, setMetaDescription] = useState(item.metaDescription);
  const [sections, setSections] = useState<Section[]>(item.sections);
  const [image, setImage] = useState<FeaturedImage | null>(item.featuredImage);
  const [status, setStatus] = useState<ContentStatus>(item.status as ContentStatus);
  const [versions, setVersions] = useState(item.versions);
  const [tab, setTab] = useState<Tab>("assistant");
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [nudge, setNudge] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [sel, setSel] = useState<Sel | null>(null);
  const [pendingEdit, setPendingEdit] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(item.sections[0]?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [save, setSave] = useState<"saved" | "saving">("saved");
  const [history, setHistory] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [lastAction, setLastAction] = useState<RefineAction>("conversational");
  const [pop, setPop] = useState<{ id: PopId; x: number; y: number } | null>(null);
  const [aligns, setAligns] = useState<Record<string, Align>>({});
  const bodyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const started = useRef(false);
  const firstRender = useRef(true);
  const isPage = item.type === "page";
  const keyword = item.primaryKeyword;
  const words = sectionsWords(sections);

  // Undo / Redo History Snapshots
  const [historyStack, setHistoryStack] = useState<{ title: string; sections: Section[]; image: FeaturedImage | null }[]>([
    { title: item.title, sections: item.sections, image: item.featuredImage },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback(
    (newTitle: string, newSections: Section[], newImage: FeaturedImage | null) => {
      setHistoryStack((prev) => [
        ...prev.slice(0, historyIndex + 1),
        { title: newTitle, sections: newSections, image: newImage },
      ]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setTitle(prev.title);
      setSections(prev.sections);
      setImage(prev.image);
      setHistoryIndex(historyIndex - 1);
      toast("Undid last change");
    }
  }, [historyIndex, historyStack]);

  const redo = useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setTitle(next.title);
      setSections(next.sections);
      setImage(next.image);
      setHistoryIndex(historyIndex + 1);
      toast("Redid change");
    }
  }, [historyIndex, historyStack]);

  // Window key listener for native Undo/Redo
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo]);

  // Outline nudge auto-dismisses
  useEffect(() => {
    if (!nudge) return;
    const t = setTimeout(() => setNudge(false), 8000);
    return () => clearTimeout(t);
  }, [nudge]);

  const ctx = useCallback(
    (heading: string, index: number) => ({ keyword, heading, index, business: "Verdant Botanics", questions: item.brief?.questions }),
    [keyword, item.brief],
  );

  /* ---------- autosave ---------- */
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (generating) return;
    setSave("saving");
    const t = setTimeout(async () => {
      await saveContent(item.id, { title, slug, metaTitle, metaDescription, sections, featuredImage: image, status });
      setSave("saved");
    }, 900);
    return () => clearTimeout(t);
  }, [title, slug, metaTitle, metaDescription, sections, image, status, generating, item.id]);

  /* ---------- section-by-section generation ---------- */
  const generateAll = useCallback(async () => {
    setGenerating(true);
    const snapshot = sections;
    for (const t of snapshot.filter((s) => !s.body.trim())) {
      setSections((cur) => cur.map((s) => (s.id === t.id ? { ...s, status: "generating" } : s)));
      const text = await mockWriter.generateSection(ctx(t.heading, snapshot.findIndex((s) => s.id === t.id)));
      setSections((cur) => cur.map((s) => (s.id === t.id ? { ...s, body: text, status: "done" } : s)));
    }
    setGenerating(false);
    toast("Draft generated — review each section");
  }, [sections, ctx]);

  useEffect(() => {
    if (autoGenerate && !started.current && sections.some((s) => !s.body.trim())) {
      started.current = true;
      void generateAll();
    }
  }, [autoGenerate, sections, generateAll]);

  const regenerate = async (s: Section, index: number) => {
    setBusy(true);
    const after = await mockWriter.generateSection(ctx(s.heading, index));
    setBusy(false);
    if (!s.body.trim()) setSections((cur) => cur.map((x) => (x.id === s.id ? { ...x, body: after, status: "done" } : x)));
    else setPendingEdit({ sectionId: s.id, start: 0, end: s.body.length, before: s.body, after, action: "regenerate" });
  };

  /* ---------- AI refine with preview ---------- */
  const runRefine = async (action: RefineAction) => {
    const sid = sel?.sectionId ?? activeId ?? sections[0]?.id;
    const sec = sections.find((s) => s.id === sid);
    if (!sec || !sec.body.trim()) { toast("Write or generate some text first"); return; }
    const range: [number, number] = sel && sel.sectionId === sid ? [sel.start, sel.end] : [0, sec.body.length];
    setBusy(true);
    setLastAction(action);
    setTab("assistant");
    const before = sec.body.slice(range[0], range[1]);
    const after = await mockWriter.refine(action, before, ctx(sec.heading, sections.indexOf(sec)));
    setBusy(false);
    if (after === before) toast("No changes suggested for this text");
    else setPendingEdit({ sectionId: sid!, start: range[0], end: range[1], before, after, action });
  };

  const accept = () => {
    if (!pendingEdit) return;
    pushHistory(title, sections, image);
    setSections((cur) => cur.map((s) => (s.id === pendingEdit.sectionId ? { ...s, body: applyEdit(s.body, pendingEdit.start, pendingEdit.end, pendingEdit.after), status: "done" } : s)));
    setPendingEdit(null);
    setSel(null);
    toast("Edit accepted");
  };
  const reject = () => { setPendingEdit(null); toast("Edit rejected — nothing changed"); };
  const retry = () => { if (pendingEdit && pendingEdit.action !== "regenerate") void runRefine(pendingEdit.action); };

  /* ---------- AI Assistant Handlers ---------- */
  const handleApplyAiChange = useCallback(
    (change: ProposedChange) => {
      pushHistory(title, sections, image);
      if (change.scope === "selection" && change.targetRange && change.targetSectionId) {
        const [start, end] = change.targetRange;
        setSections((cur) =>
          cur.map((s) =>
            s.id === change.targetSectionId
              ? { ...s, body: applyEdit(s.body, start, end, change.after), status: "done" }
              : s
          )
        );
      } else if (change.scope === "section" && change.targetSectionId) {
        setSections((cur) =>
          cur.map((s) =>
            s.id === change.targetSectionId ? { ...s, body: change.after, status: "done" } : s
          )
        );
      } else if (change.scope === "full_article" && change.multiSections && change.multiSections.length > 0) {
        setSections((cur) =>
          cur.map((s) => {
            const match = change.multiSections?.find((m) => m.sectionId === s.id);
            return match ? { ...s, body: match.after, status: "done" } : s;
          })
        );
      } else if (change.targetSectionId) {
        setSections((cur) =>
          cur.map((s) =>
            s.id === change.targetSectionId ? { ...s, body: change.after, status: "done" } : s
          )
        );
      }
      setPendingEdit(null);
      setSel(null);
      toast("AI changes accepted and applied to canvas");
    },
    [pushHistory, title, sections, image]
  );

  const handleRejectAiChange = useCallback((_changeId: string) => {
    setPendingEdit(null);
    toast("Proposed change rejected");
  }, []);

  const handleApplyFeaturedImage = useCallback(
    (img: FeaturedImage) => {
      pushHistory(title, sections, image);
      setImage(img);
      toast("Featured image updated");
    },
    [pushHistory, title, sections, image]
  );

  const handleInsertInlineImage = useCallback(
    (sectionId: string, md: string) => {
      pushHistory(title, sections, image);
      setSections((cur) =>
        cur.map((s) => (s.id === sectionId ? { ...s, body: s.body + md, status: "done" } : s))
      );
      toast("Image inserted into section");
    },
    [pushHistory, title, sections, image]
  );

  const handleApplyMeta = useCallback((mTitle: string, mDesc: string) => {
    setMetaTitle(mTitle);
    setMetaDescription(mDesc);
    toast("SEO meta tags updated");
  }, []);

  const handleInsertInternalLink = useCallback(
    (sectionId: string, anchorText: string, url: string) => {
      pushHistory(title, sections, image);
      setSections((cur) =>
        cur.map((s) =>
          s.id === sectionId
            ? { ...s, body: `${s.body}\n\n*Related reading: [${anchorText}](${url})*`, status: "done" }
            : s
        )
      );
      toast(`Internal link added to ${anchorText}`);
    },
    [pushHistory, title, sections, image]
  );

  const onInstruction = () => {
    const t = instruction.toLowerCase();
    const map: [string, RefineAction][] = [["simpl", "simplify"], ["convers", "conversational"], ["authorit", "authoritative"], ["example", "examples"], ["table", "table"], ["faq", "faqs"], ["repet", "repetition"], ["keyword", "keyword"], ["verify", "verify"], ["claim", "verify"]];
    const hit = map.find(([k]) => t.includes(k));
    if (!hit) { toast("Try: simplify, add examples, add FAQs, verify claims…"); return; }
    setInstruction("");
    void runRefine(hit[1]);
  };

  /* ---------- section helpers ---------- */
  const updateSection = (id: string, patch: Partial<Section>) => setSections((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const moveSection = (i: number, d: number) => setSections((cur) => { const o = [...cur]; const j = i + d; if (j < 0 || j >= o.length) return cur; [o[i], o[j]] = [o[j], o[i]]; return o; });
  const jump = (id: string) => { setActiveId(id); document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const onSelect = (s: Section, e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    setActiveId(s.id);
    if (ta.selectionStart !== ta.selectionEnd) {
      const rect = ta.getBoundingClientRect();
      setSel({ sectionId: s.id, start: ta.selectionStart, end: ta.selectionEnd, text: ta.value.slice(ta.selectionStart, ta.selectionEnd), x: Math.min(rect.left + rect.width / 2, window.innerWidth - 220), y: Math.max(rect.top - 8, 70) });
    } else setSel(null);
  };

  /* ---------- outline ---------- */
  const openOutline = () => { setOutlineOpen(true); setNudge(false); };

  /* ---------- formatting toolbar actions ---------- */
  const getTarget = () => {
    const sid = activeId ?? sections[0]?.id;
    const ta = sid ? bodyRefs.current[sid] : null;
    if (!sid || !ta) { toast("Click into a section to format it"); return null; }
    return { sid, ta };
  };

  const commit = (sid: string, body: string, selStart: number, selEnd: number) => {
    pushHistory(title, sections, image);
    updateSection(sid, { body, status: body ? "done" : "empty" });
    requestAnimationFrame(() => {
      const ta = bodyRefs.current[sid];
      if (ta) { ta.focus(); ta.setSelectionRange(selStart, selEnd); }
    });
  };

  const wrap = (open: string, close = open, placeholder = "text") => {
    const t = getTarget();
    if (!t) return;
    const { sid, ta } = t;
    const body = ta.value;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = body.slice(s, e);
    const wrapped =
      body.slice(Math.max(0, s - open.length), s) === open &&
      body.slice(e, e + close.length) === close &&
      !(open === "*" && body[s - 2] === "*");
    if (wrapped) {
      commit(sid, body.slice(0, s - open.length) + selected + body.slice(e + close.length), s - open.length, e - open.length);
      return;
    }
    const inner = selected || placeholder;
    commit(sid, body.slice(0, s) + open + inner + close + body.slice(e), s + open.length, s + open.length + inner.length);
  };

  const lineFormat = (kind: LineKind) => {
    const t = getTarget();
    if (!t) return;
    const { sid, ta } = t;
    const body = ta.value;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const start = s === 0 ? 0 : body.lastIndexOf("\n", s - 1) + 1;
    const nl = body.indexOf("\n", e);
    const end = nl === -1 ? body.length : nl;
    const def = LINE[kind];
    const lines = body.slice(start, end).split("\n");
    const filled = lines.filter((l) => l.trim());
    if (!filled.length) {
      const p = def.make(1);
      commit(sid, body.slice(0, start) + p + body.slice(end), start + p.length, start + p.length);
      return;
    }
    const remove = filled.every((l) => def.test.test(l));
    let n = 0;
    const out = lines
      .map((l) => {
        if (!l.trim()) return l;
        if (remove) return l.replace(def.test, "");
        n += 1;
        return def.make(n) + l.replace(ANY_PREFIX, "");
      })
      .join("\n");
    commit(sid, body.slice(0, start) + out + body.slice(end), start, start + out.length);
  };

  const insertBlock = (text: string) => {
    const t = getTarget();
    if (!t) return;
    const { sid, ta } = t;
    const body = ta.value;
    const e = ta.selectionEnd;
    const before = body.slice(0, e);
    const after = body.slice(e);
    const lead = !before ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const trail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const pos = (before + lead + text).length;
    commit(sid, before + lead + text + trail + after, pos, pos);
  };

  const codeFormat = () => {
    const t = getTarget();
    if (!t) return;
    const { ta } = t;
    const selected = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    if (selected.includes("\n")) wrap("```\n", "\n```");
    else wrap("`", "`", "code");
  };

  const applyLink = (raw: string) => {
    const url = /^(https?:|mailto:|tel:|\/|#)/i.test(raw) ? raw : `https://${raw}`;
    const t = getTarget();
    if (!t) return;
    const { sid, ta } = t;
    const body = ta.value;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const text = body.slice(s, e) || "link text";
    commit(sid, body.slice(0, s) + `[${text}](${url})` + body.slice(e), s + 1, s + 1 + text.length);
    setPop(null);
  };

  const linkToSection = (target: Section) => {
    const t = getTarget();
    if (!t) return;
    const { sid, ta } = t;
    const body = ta.value;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const text = body.slice(s, e) || target.heading || "section";
    commit(sid, body.slice(0, s) + `[${text}](#${slugify(target.heading || "section")})` + body.slice(e), s + 1, s + 1 + text.length);
    setPop(null);
  };

  const removeLink = () => {
    const t = getTarget();
    if (!t) return;
    const { sid, ta } = t;
    const body = ta.value;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const ms = m.index;
      const me = ms + m[0].length;
      if (body[ms - 1] === "!") continue;
      if (ms <= e && me >= s) {
        commit(sid, body.slice(0, ms) + m[1] + body.slice(me), ms, ms + m[1].length);
        setPop(null);
        return;
      }
    }
    toast("Place the cursor inside a link first");
  };

  const insertImage = (url: string, alt: string) => {
    insertBlock(`![${alt || "Image"}](${url})`);
    setPop(null);
  };

  const goTo = (sectionId: string, start: number, end: number) => {
    setActiveId(sectionId);
    document.getElementById(`sec-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const ta = bodyRefs.current[sectionId];
    if (ta) { ta.focus({ preventScroll: true }); ta.setSelectionRange(start, end); }
  };

  const replaceAll = (q: string, r: string) => {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = sections.reduce((a, s) => a + (s.body.match(re)?.length ?? 0), 0);
    if (!count) return;
    pushHistory(title, sections, image);
    setSections((cur) => cur.map((s) => ({ ...s, body: s.body.replace(re, () => r) })));
    toast(`Replaced ${count} occurrence${count === 1 ? "" : "s"}`);
  };

  const setAlign = (a: Align) => {
    const sid = activeId ?? sections[0]?.id;
    if (!sid) return;
    setAligns((cur) => ({ ...cur, [sid]: a }));
  };
  const currentAlign: Align = aligns[activeId ?? sections[0]?.id ?? ""] ?? "left";

  const openPop = (id: PopId, e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPop((p) => (p?.id === id ? null : { id, x: Math.max(8, Math.min(r.left, window.innerWidth - 328)), y: r.bottom + 6 }));
  };

  const onBodyKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "b") { e.preventDefault(); wrap("**"); }
    else if (k === "i") { e.preventDefault(); wrap("*"); }
    else if (k === "u") { e.preventDefault(); wrap("<u>", "</u>"); }
  };

  /* ---------- derived ---------- */
  const bodyAll = sections.map((s) => s.body).join("\n\n");
  const claims = useMemo(() => findUnverifiedClaims(bodyAll), [bodyAll]);
  const placeholders = (bodyAll.match(/\[[^\]]{8,}\]/g) ?? []).length;
  const groups = useMemo(() => computeChecks({ title, keyword, metaTitle, metaDescription, slug, sections, hasImage: !!image, imageAlt: image?.alt ?? "", type: isPage ? "page" : "article" }), [title, keyword, metaTitle, metaDescription, slug, sections, image, isPage]);
  const score = scoreChecks(groups);

  /* ---------- tools panel (shared by the desktop aside and the drawer) ---------- */
  const toolsBody = (
    <>
      <div className="shrink-0 bg-surface px-3">
        <StateTabs
          value={tab}
          onChange={setTab}
          className="mb-0"
          items={[
            {
              id: "assistant",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={13} strokeWidth={1.75} />
                  Assistant
                  {pendingEdit && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </span>
              ),
            },
            { id: "optimise", label: "Optimise" },
            { id: "images", label: "Images" },
            { id: "publish", label: "Publish" },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === "assistant" && (
          <AiAssistantPanel
            title={title}
            keyword={keyword}
            intent={item.intent}
            groupName={groupName}
            sections={sections}
            activeSectionId={activeId}
            selection={sel}
            featuredImage={image}
            onClose={() => setAiPanelOpen(false)}
            onApplyChange={handleApplyAiChange}
            onRejectChange={handleRejectAiChange}
            onApplyFeaturedImage={handleApplyFeaturedImage}
            onInsertInlineImage={handleInsertInlineImage}
            onApplyMeta={handleApplyMeta}
            onInsertInternalLink={handleInsertInternalLink}
            onSelectSection={(secId) => jump(secId)}
          />
        )}

        {tab === "optimise" && (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted">Readiness score</p>
                  <p className="mt-1.5 text-[32px] font-semibold leading-none tabular-nums">
                    {score.score}
                    <span className="ml-0.5 text-sm font-normal text-muted">/100</span>
                  </p>
                </div>
                <span className="text-xs tabular-nums text-muted">
                  {score.passed} of {score.applicable} passed
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-fg transition-all" style={{ width: `${Math.min(100, Math.max(0, score.score))}%` }} />
              </div>
              <p className="mt-3 text-xs text-muted">“Unable to verify” and “Not applicable” checks are excluded.</p>
              <Disclaimer />
            </div>
            {groups.map((g) => (
              <Block key={g.id} title={g.label}>
                <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                  {g.checks.map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-3 px-3.5 py-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium">{c.label}</p>
                        <p className="mt-0.5 text-xs text-muted">{c.detail}</p>
                      </div>
                      <Badge tone={STATE_META[c.state].tone} className="shrink-0">{STATE_META[c.state].label}</Badge>
                    </li>
                  ))}
                </ul>
              </Block>
            ))}
          </div>
        )}

        {tab === "images" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <ImagePanel image={image} setImage={setImage} title={title} />
          </div>
        )}

        {tab === "publish" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <PublishPanel
              id={item.id} isPage={isPage} title={title} slug={slug} setSlug={setSlug} metaTitle={metaTitle} setMetaTitle={setMetaTitle} metaDescription={metaDescription} setMetaDescription={setMetaDescription}
              sections={sections} image={image} destination={item.destination} claims={claims.length} placeholders={placeholders} status={status} setStatus={setStatus} score={score.score}
              onVersions={(v) => setVersions(v)} stateSnapshot={{ title, slug, metaTitle, metaDescription, sections, image, status }} versionsCount={versions.length}
            />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-bg">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href={isPage ? "/pages" : "/articles"}
            aria-label={`Back to ${isPage ? "pages" : "articles"}`}
            className={cx("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-muted transition-colors hover:bg-sunken hover:text-fg", ring)}
          >
            <ArrowLeft size={15} strokeWidth={1.75} />
            <span className="hidden sm:inline">{isPage ? "Pages" : "Articles"}</span>
          </Link>
          <span className="hidden h-4 w-px shrink-0 bg-line sm:block" />
          <span className="min-w-0 truncate text-[13px] font-medium">{title || "Untitled"}</span>
          <Badge tone={statusTone(status)} className="shrink-0 md:hidden">{status}</Badge>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted" aria-live="polite">
            {save === "saving" ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span className="hidden sm:inline">Saving…</span>
              </>
            ) : (
              <>
                <Check size={12} />
                <span className="hidden sm:inline">Saved</span>
              </>
            )}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-muted xl:inline">{groupName}</span>

          <FilterSelect
            size="sm"
            className="hidden w-32 md:block"
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as ContentStatus)}
            options={stageOptions}
          />

          <Button variant="outline" size="sm" onClick={() => setHistory(true)} className="gap-1.5" aria-label="Versions" title="Versions">
            <History size={14} strokeWidth={1.75} />
            <span className="hidden lg:inline">Versions</span>
          </Button>

          <Button
            variant={aiPanelOpen ? "primary" : "outline"}
            size="sm"
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            className="gap-1.5"
            aria-label={aiPanelOpen ? "Collapse AI Assistant" : "Open AI Assistant"}
            title={aiPanelOpen ? "Collapse AI Assistant" : "Open AI Assistant"}
          >
            <Sparkles size={14} strokeWidth={1.75} />
            <span className="hidden md:inline">AI Assistant</span>
            {pendingEdit && <span className="h-2 w-2 rounded-full bg-amber-400" />}
          </Button>

          <Button size="sm" onClick={() => { setAiPanelOpen(true); setTab("publish"); }}>Publish</Button>
        </div>
      </header>

      {/* Formatting toolbar */}
      <div
        role="toolbar"
        aria-label="Formatting"
        onMouseDown={(e) => { if ((e.target as HTMLElement).closest("button")) e.preventDefault(); }}
        className="flex h-11 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-line bg-surface px-3 [scrollbar-width:none] sm:px-4"
      >
        <TB label="Bold (Ctrl/Cmd+B)" onClick={() => wrap("**")}><Bold size={16} strokeWidth={1.75} /></TB>
        <TB label="Italic (Ctrl/Cmd+I)" onClick={() => wrap("*")}><Italic size={16} strokeWidth={1.75} /></TB>
        <TB label="Underline (Ctrl/Cmd+U)" onClick={() => wrap("<u>", "</u>")}><Underline size={16} strokeWidth={1.75} /></TB>
        <TB label="Strikethrough" onClick={() => wrap("~~")}><Strikethrough size={16} strokeWidth={1.75} /></TB>
        <TB label="Highlight" onClick={() => wrap("==")}><Highlighter size={16} strokeWidth={1.75} /></TB>
        <Sep />
        <TB label="Heading 1" onClick={() => lineFormat("h1")}><Heading1 size={16} strokeWidth={1.75} /></TB>
        <TB label="Heading 2" onClick={() => lineFormat("h2")}><Heading2 size={16} strokeWidth={1.75} /></TB>
        <TB label="Heading 3" onClick={() => lineFormat("h3")}><Heading3 size={16} strokeWidth={1.75} /></TB>
        <Sep />
        <TB label="Bulleted list" onClick={() => lineFormat("ul")}><List size={16} strokeWidth={1.75} /></TB>
        <TB label="Numbered list" onClick={() => lineFormat("ol")}><ListOrdered size={16} strokeWidth={1.75} /></TB>
        <TB label="Quote" onClick={() => lineFormat("quote")}><Quote size={16} strokeWidth={1.75} /></TB>
        <TB label="Code" onClick={codeFormat}><Code size={16} strokeWidth={1.75} /></TB>
        <TB label="Divider" onClick={() => insertBlock("---")}><Minus size={16} strokeWidth={1.75} /></TB>
        <Sep />
        <TB label="Insert link" active={pop?.id === "link"} onClick={(e) => openPop("link", e)}><Link2 size={16} strokeWidth={1.75} /></TB>
        <TB label="Insert image" active={pop?.id === "image"} onClick={(e) => openPop("image", e)}><ImageIcon size={16} strokeWidth={1.75} /></TB>
        <TB label="Insert table" active={pop?.id === "table"} onClick={(e) => openPop("table", e)}><TableIcon size={16} strokeWidth={1.75} /></TB>
        <TB label="Insert chart" active={pop?.id === "chart"} onClick={(e) => openPop("chart", e)}><BarChart3 size={16} strokeWidth={1.75} /></TB>
        <button
          type="button"
          onClick={(e) => openPop("links", e)}
          aria-haspopup="dialog"
          aria-expanded={pop?.id === "links"}
          className={cx(
            "ml-0.5 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[13px] transition-colors",
            ring,
            pop?.id === "links" ? "bg-sunken text-fg" : "text-muted hover:bg-sunken hover:text-fg"
          )}
        >
          <Link2 size={15} strokeWidth={1.75} />
          Links
          <ChevronDown size={13} strokeWidth={1.75} />
        </button>
        <Sep />
        <TB label="Align left" active={currentAlign === "left"} onClick={() => setAlign("left")}><AlignLeft size={16} strokeWidth={1.75} /></TB>
        <TB label="Align center (editor view only)" active={currentAlign === "center"} onClick={() => setAlign("center")}><AlignCenter size={16} strokeWidth={1.75} /></TB>
        <TB label="Align right (editor view only)" active={currentAlign === "right"} onClick={() => setAlign("right")}><AlignRight size={16} strokeWidth={1.75} /></TB>
        <Sep />
        <TB label="Undo (Ctrl/Cmd+Z)" onClick={undo} disabled={historyIndex === 0}><Undo2 size={16} strokeWidth={1.75} /></TB>
        <TB label="Redo (Ctrl/Cmd+Shift+Z)" onClick={redo} disabled={historyIndex >= historyStack.length - 1}><Redo2 size={16} strokeWidth={1.75} /></TB>
        <TB label="Find & replace" active={pop?.id === "find"} onClick={(e) => openPop("find", e)}><Search size={16} strokeWidth={1.75} /></TB>
        <span className="ml-auto shrink-0 pl-4 text-xs tabular-nums text-muted">{words.toLocaleString()} words</span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Outline (closed by default) */}
        {outlineOpen ? (
          <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-line/70 bg-subtle p-3 lg:block" aria-label="Outline">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-medium text-muted">Outline</p>
              <button type="button" aria-label="Hide outline" className={iconBtn} onClick={() => setOutlineOpen(false)}>
                <PanelLeftClose size={15} strokeWidth={1.75} />
              </button>
            </div>
            <ul className="space-y-0.5">
              <li className="truncate rounded-lg px-2.5 py-1.5 text-[13px] font-semibold">{title || "Untitled"}</li>
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => jump(s.id)}
                    className={cx(
                      "flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors hover:bg-sunken",
                      ring,
                      activeId === s.id ? "bg-sunken font-medium text-fg" : "text-muted"
                    )}
                  >
                    <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", s.status === "done" || s.body ? "bg-success" : s.status === "generating" ? "bg-warning" : "bg-line-strong")} />
                    <span className="truncate">{s.heading || "Untitled section"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        ) : (
          <div className="relative hidden w-10 shrink-0 border-r border-line/70 bg-subtle lg:block">
            <button
              type="button"
              aria-label="Show outline"
              title="Show outline"
              onClick={openOutline}
              className={cx("relative flex h-10 w-10 items-center justify-center text-muted transition-colors hover:text-fg", ring)}
            >
              <ListTree size={16} strokeWidth={1.75} />
              {nudge && (
                <span className="absolute right-2 top-2 flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fg opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-fg" />
                </span>
              )}
            </button>
            {nudge && (
              <div role="status" className="enter absolute left-full top-1.5 z-30 ml-2 w-56 rounded-xl bg-fg px-3 py-2.5 text-xs text-bg shadow-lg">
                <span className="absolute -left-1 top-3 h-2 w-2 rotate-45 bg-fg" aria-hidden />
                <p className="font-medium">Outline is tucked away</p>
                <p className="mt-0.5 opacity-80">Open it to jump between sections.</p>
                <div className="mt-2 flex items-center gap-3">
                  <button type="button" onClick={openOutline} className="font-medium underline-offset-2 hover:underline">Open outline</button>
                  <button type="button" onClick={() => setNudge(false)} className="opacity-70 transition-opacity hover:opacity-100">Dismiss</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 sm:py-10">
            <textarea
              aria-label="Title"
              rows={2}
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (!item.publishedVersion) setSlug(slugify(e.target.value)); }}
              placeholder="Untitled"
              className="w-full resize-none border-0 bg-transparent text-3xl font-semibold leading-[1.15] tracking-tight outline-none placeholder:text-faint sm:text-[40px]"
            />
            {image ? (
              <figure className="mb-8 mt-3">
                <div className="overflow-hidden rounded-2xl border border-line">
                  <GenArt seed={image.seed} ratio={image.ratio} label={image.alt} />
                </div>
                {image.caption && <figcaption className="mt-2 text-xs text-muted">{image.caption}</figcaption>}
              </figure>
            ) : (
              <button
                type="button"
                onClick={() => { setAiPanelOpen(true); setTab("images"); }}
                className={cx("mb-8 mt-3 flex h-24 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-[13px] font-medium text-muted transition-colors hover:bg-subtle hover:text-fg", ring)}
              >
                <Orb size={16} /> Add featured image
              </button>
            )}

            {generating && (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-subtle px-3 py-1.5 text-[13px]">
                <Orb size={14} />
                <span className="shimmer">Writing section by section…</span>
              </p>
            )}

            {sections.map((s, i) => {
              const showDiff = pendingEdit?.sectionId === s.id;
              return (
                <section key={s.id} id={`sec-${s.id}`} className="group/sec relative mb-7 scroll-mt-4" onFocusCapture={() => setActiveId(s.id)}>
                  <div className="flex items-start gap-2">
                    <input
                      aria-label={`Heading ${i + 1}`}
                      value={s.heading}
                      onChange={(e) => updateSection(s.id, { heading: e.target.value })}
                      className="min-w-0 flex-1 border-0 bg-transparent text-xl font-semibold leading-snug tracking-tight outline-none placeholder:text-faint sm:text-[22px]"
                      placeholder="Section heading"
                    />
                    <div className="flex shrink-0 items-center rounded-full border border-line bg-surface p-0.5 opacity-100 shadow-sm transition-opacity lg:opacity-0 lg:group-focus-within/sec:opacity-100 lg:group-hover/sec:opacity-100">
                      <button type="button" aria-label="Regenerate section" title="Regenerate section" disabled={busy || generating} onClick={() => regenerate(s, i)} className={iconBtn}><Sparkles size={14} strokeWidth={1.75} /></button>
                      <button type="button" aria-label="Move section up" title="Move up" onClick={() => moveSection(i, -1)} className={iconBtn}><ArrowUp size={14} strokeWidth={1.75} /></button>
                      <button type="button" aria-label="Move section down" title="Move down" onClick={() => moveSection(i, 1)} className={iconBtn}><ArrowDown size={14} strokeWidth={1.75} /></button>
                      <button type="button" aria-label="Delete section" title="Delete" onClick={() => setSections((cur) => cur.filter((x) => x.id !== s.id))} className={iconBtn}><Trash2 size={14} strokeWidth={1.75} /></button>
                    </div>
                  </div>
                  {s.status === "generating" ? (
                    <div className="space-y-2 py-3"><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-11/12" /><div className="skeleton h-4 w-3/4" /></div>
                  ) : showDiff && pendingEdit ? (
                    <div className="mt-2 rounded-2xl border border-line-strong bg-subtle p-4">
                      <p className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted"><Orb size={12} /> AI suggestion — review before applying</p>
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                        {s.body.slice(0, pendingEdit.start)}
                        {diffWords(pendingEdit.before, pendingEdit.after).map((p, k) => p.type === "same" ? <span key={k}>{p.text}</span> : p.type === "add" ? <ins key={k} className="rounded px-0.5 no-underline" style={{ background: "var(--diff-add)" }}>{p.text}</ins> : <del key={k} className="rounded px-0.5" style={{ background: "var(--diff-del)" }}>{p.text}</del>)}
                        {s.body.slice(pendingEdit.end)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={accept}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={reject}>Reject</Button>
                        {pendingEdit.action !== "regenerate" && <Button size="sm" variant="ghost" onClick={retry}>Retry</Button>}
                      </div>
                    </div>
                  ) : (
                    <textarea
                      ref={(el) => { bodyRefs.current[s.id] = el; }}
                      aria-label={`Body of ${s.heading}`}
                      value={s.body}
                      onChange={(e) => updateSection(s.id, { body: e.target.value, status: e.target.value ? "done" : "empty" })}
                      onSelect={(e) => onSelect(s, e)}
                      onKeyDown={onBodyKey}
                      onBlur={() => setTimeout(() => setSel((cur) => (cur?.sectionId === s.id ? null : cur)), 200)}
                      rows={Math.max(4, s.body.split("\n").length + Math.ceil(s.body.length / 80))}
                      placeholder="Start writing, or generate this section with AI…"
                      className={cx(
                        "prose-article mt-1 w-full resize-none border-0 bg-transparent outline-none placeholder:text-faint",
                        aligns[s.id] === "center" && "text-center",
                        aligns[s.id] === "right" && "text-right"
                      )}
                    />
                  )}
                </section>
              );
            })}

            <div className="flex flex-wrap gap-2 pb-24">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSections((c) => [...c, { id: `n${Date.now()}`, heading: "New section", body: "", status: "empty" }])}>
                <Plus size={14} strokeWidth={1.75} /> Add section
              </Button>
              {sections.some((s) => !s.body.trim()) && (
                <Button size="sm" className="gap-1.5" disabled={generating} onClick={generateAll}>
                  <Sparkles size={14} strokeWidth={1.75} /> Generate empty sections
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Right panel on desktop (xl:) */}
        {aiPanelOpen && (
          <aside className="hidden w-[380px] shrink-0 flex-col border-l border-line/70 bg-surface xl:flex" aria-label="Editor tools">
            {toolsBody}
          </aside>
        )}
      </div>

      {/* Slide-over Drawer for smaller screens (< xl) */}
      <div className="xl:hidden">
        <Drawer open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} title="AI Assistant & Tools" width={420}>
          <div className="-mx-6 -mt-5 flex h-[calc(100vh-65px)] flex-col">{toolsBody}</div>
        </Drawer>
      </div>

      {/* Toolbar popovers */}
      {pop && (
        <>
          {pop.id !== "find" && <div className="fixed inset-0 z-[60]" onClick={() => setPop(null)} />}
          <Pop x={pop.x} y={pop.y} title={POP_TITLES[pop.id]} width={pop.id === "find" ? 320 : 288} onClose={() => setPop(null)}>
            {pop.id === "link" && <LinkPop onApply={applyLink} />}
            {pop.id === "image" && (
              <ImagePop
                onInsert={insertImage}
                onGenerate={() => { setPop(null); setAiPanelOpen(true); setTab("images"); }}
              />
            )}
            {pop.id === "table" && <TablePop onInsert={(r, c) => { insertBlock(mdTable(r, c)); setPop(null); }} />}
            {pop.id === "chart" && <ChartPop onInsert={(k) => { insertBlock(mdChart(k)); setPop(null); }} />}
            {pop.id === "links" && (
              <LinksPop
                sections={sections}
                onSection={linkToSection}
                onSuggest={() => { setPop(null); setAiPanelOpen(true); setTab("assistant"); }}
                onRemove={removeLink}
              />
            )}
            {pop.id === "find" && <FindPop sections={sections} onGo={goTo} onReplaceAll={replaceAll} />}
          </Pop>
        </>
      )}

      {/* Selection toolbar */}
      {sel && !pendingEdit && (
        <div
          className="enter fixed z-[70] flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-full border border-line bg-surface p-1 shadow-lg"
          style={{ left: sel.x, top: sel.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <AIAction onClick={() => { setAiPanelOpen(true); setTab("assistant"); }}>
            <Sparkles size={14} className="mr-1 inline" /> Refine with AI
          </AIAction>
          <button type="button" className={floatBtn} onClick={() => { setAiPanelOpen(true); void runRefine("simplify"); }}>Simplify</button>
          <button type="button" className={floatBtn} onClick={() => { setAiPanelOpen(true); void runRefine("conversational"); }}>Conversational</button>
          <button type="button" className={floatBtn} onClick={() => { setAiPanelOpen(true); void runRefine("examples"); }}>Add example</button>
        </div>
      )}

      {/* Version history */}
      <Sheet open={history} onClose={() => setHistory(false)} title="Version history" subtitle="Editing published content never overwrites earlier versions" width={420}>
        {versions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
            <p className="text-[15px] font-semibold">No saved versions yet</p>
            <p className="mt-1 text-[13px] text-muted">Versions are created when you publish, schedule or save a version.</p>
          </div>
        )}
        <ul className="space-y-3">
          {[...versions].reverse().map((v) => (
            <li key={v.version} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium">Version {v.version} · {v.note}</p>
                <Badge tone={v.version === item.publishedVersion ? "success" : "outline"}>{v.version === item.publishedVersion ? "Live" : "Saved"}</Badge>
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs tabular-nums text-muted"><Clock size={12} /> {format(new Date(v.at), "MMM d, HH:mm")} · {sectionsWords(v.sections)} words</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setTitle(v.title); setSections(v.sections); setHistory(false); toast(`Restored version ${v.version} (not yet published)`); }}>Restore</Button>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}

/* ================= Images ================= */
const RATIOS = ["16:9", "4:3", "1:1", "3:4"].map((r) => ({ value: r, label: r }));
const STYLES = ["Editorial photo", "Flat illustration", "Infographic", "Diagram"].map((s) => ({ value: s, label: s }));
const POSITIONS = [
  { value: "top", label: "Top (featured)" },
  { value: "after-intro", label: "After introduction" },
  { value: "bottom", label: "Bottom" },
];

function ImagePanel({ image, setImage, title }: { image: FeaturedImage | null; setImage: (i: FeaturedImage | null) => void; title: string }) {
  const [ratio, setRatio] = useState(image?.ratio ?? "16:9");
  const [style, setStyle] = useState("Editorial photo");
  const [prompt, setPrompt] = useState(image?.prompt ?? `${style} of botanical skincare, soft daylight — ${title}`);
  const [variants, setVariants] = useState<number[]>([]);
  const [gen, setGen] = useState(false);
  const [refs, setRefs] = useState<string[]>([]);
  const colors = ["#2f5d46", "#e8d9c5", "#f5efe6"];
  const generate = () => {
    setGen(true);
    setTimeout(() => { const base = Math.floor(Math.random() * 1000); setVariants([base, base + 1, base + 2, base + 3]); setGen(false); }, 900);
  };
  const choose = (seed: number) => setImage({ prompt, seed, ratio, alt: image?.alt ?? "", caption: image?.caption ?? "", position: image?.position ?? "top" });

  return (
    <div className="space-y-5">
      <PanelIntro title="Generate images" description="Featured, in-article, infographics and diagrams. Mock provider in demo mode." />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Aspect ratio">
          <FilterSelect label="Aspect ratio" value={ratio} onChange={setRatio} options={RATIOS} />
        </Field>
        <Field label="Visual style">
          <FilterSelect label="Visual style" value={style} onChange={setStyle} options={STYLES} />
        </Field>
      </div>

      <Block title="Brand colours">
        <div className="flex gap-2">
          {colors.map((c) => <span key={c} title={c} className="h-6 w-6 rounded-full border border-line" style={{ background: c }} />)}
        </div>
      </Block>

      <Field label="Prompt">
        <textarea className="field" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </Field>

      <label className={cx("flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-line-strong p-3 text-[13px] text-muted transition-colors hover:bg-subtle hover:text-fg focus-within:ring-2 focus-within:ring-line")}>
        <Upload size={16} strokeWidth={1.75} className="shrink-0" />
        <span className="min-w-0 truncate">{refs.length ? refs.join(", ") : "Upload brand reference assets"}</span>
        <input type="file" multiple className="sr-only" onChange={(e) => setRefs(Array.from(e.target.files ?? []).map((f) => f.name))} />
      </label>

      <Button onClick={generate} disabled={gen} className="gap-1.5">
        <Sparkles size={14} strokeWidth={1.75} /> {gen ? "Generating…" : variants.length ? "Regenerate" : "Generate 4 variants"}
      </Button>

      {variants.length > 0 && (
        <Block title="Variants">
          <div className="grid grid-cols-2 gap-2">
            {variants.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => choose(v)}
                aria-label={`Use variant ${v}`}
                className={cx("overflow-hidden rounded-2xl border p-1 transition-colors", ring, image?.seed === v ? "border-fg ring-2 ring-fg" : "border-line hover:bg-sunken")}
              >
                <GenArt seed={v} ratio={ratio} />
              </button>
            ))}
          </div>
        </Block>
      )}

      {image && (
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
          <h3 className="text-[13px] font-semibold">Selected image</h3>
          <Field label="Alt text">
            <input className="field" value={image.alt} onChange={(e) => setImage({ ...image, alt: e.target.value })} placeholder="Describe the image for screen readers" />
          </Field>
          <Field label="Caption">
            <input className="field" value={image.caption} onChange={(e) => setImage({ ...image, caption: e.target.value })} />
          </Field>
          <Field label="Position">
            <FilterSelect label="Position" value={image.position} onChange={(v) => setImage({ ...image, position: v as FeaturedImage["position"] })} options={POSITIONS} />
          </Field>
          <Button variant="outline" size="sm" onClick={() => setImage(null)}>Remove image</Button>
        </div>
      )}
    </div>
  );
}

/* ================= Publish ================= */
interface PublishProps {
  id: number; isPage: boolean; title: string; slug: string; setSlug: (s: string) => void; metaTitle: string; setMetaTitle: (s: string) => void; metaDescription: string; setMetaDescription: (s: string) => void;
  sections: Section[]; image: FeaturedImage | null; destination: string; claims: number; placeholders: number; status: ContentStatus; setStatus: (s: ContentStatus) => void; score: number;
  onVersions: (v: ContentRow["versions"]) => void; stateSnapshot: { title: string; slug: string; metaTitle: string; metaDescription: string; sections: Section[]; image: FeaturedImage | null; status: ContentStatus }; versionsCount: number;
}
function PublishPanel(p: PublishProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [date, setDate] = useState("");
  const [ack, setAck] = useState(false);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const gate = p.claims > 0 || p.placeholders > 0;
  const links = [...p.sections.map((s) => s.body).join("\n").matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": p.isPage ? "WebPage" : "Article", headline: p.title, description: p.metaDescription, author: { "@type": "Organization", name: "Verdant Botanics" } }, null, 2);

  const flush = async () => {
    await saveContent(p.id, { title: p.title, slug: p.slug, metaTitle: p.metaTitle, metaDescription: p.metaDescription, sections: p.sections, featuredImage: p.image, status: p.status });
  };
  const run = (fn: () => Promise<void>) => start(async () => { await flush(); await fn(); });

  return (
    <div className="space-y-5">
      <Block
        title="Preview"
        right={
          <div className="inline-flex rounded-full bg-sunken p-0.5">
            {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
              <button
                key={d}
                type="button"
                aria-label={`${d} preview`}
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={cx("inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors", ring, device === d ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}
              >
                <Icon size={14} strokeWidth={1.75} />
              </button>
            ))}
          </div>
        }
      >
        <div className="max-h-72 overflow-y-auto rounded-2xl border border-line bg-surface p-4">
          <div className={cx("mx-auto", device === "mobile" && "max-w-[240px]")}>
            {p.image && (
              <div className="overflow-hidden rounded-xl">
                <GenArt seed={p.image.seed} ratio={p.image.ratio} />
              </div>
            )}
            <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{p.title}</h3>
            <div className="prose-article !text-sm !leading-normal [&_h2]:!text-[16px] [&_h2]:!leading-snug">
              {p.sections.slice(0, 2).map((s) => <div key={s.id}><h2>{s.heading}</h2><Markdown source={s.body.slice(0, 260)} /></div>)}
            </div>
          </div>
        </div>
      </Block>

      <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
        <Field label="SEO title" right={<Counter value={p.metaTitle.length} min={30} max={60} />}>
          <input className="field" value={p.metaTitle} onChange={(e) => p.setMetaTitle(e.target.value)} />
        </Field>
        <Field label="Meta description" right={<Counter value={p.metaDescription.length} min={80} max={160} />}>
          <textarea className="field" rows={3} value={p.metaDescription} onChange={(e) => p.setMetaDescription(e.target.value)} />
        </Field>
        <Field label="URL slug">
          <input className="field mono" value={p.slug} onChange={(e) => p.setSlug(slugify(e.target.value))} />
        </Field>
      </div>

      <Block title="Search appearance">
        <div className="rounded-2xl bg-subtle p-4">
          <p className="mono break-all text-info-fg">verdantbotanics.com › {p.isPage ? "" : "blog › "}{p.slug}</p>
          <p className="mt-1 text-[15px] font-medium text-info-fg">{p.metaTitle}</p>
          <p className="mt-0.5 text-xs text-muted">{p.metaDescription}</p>
        </div>
      </Block>

      <Block title="Schema preview">
        <pre className="mono max-h-40 overflow-auto rounded-2xl bg-sunken p-3.5">{schema}</pre>
        <p className="mt-1.5 text-xs text-muted">Structured data helps machines read the page; it does not guarantee rich results.</p>
      </Block>

      <Block title={`Links (${links.length})`}>
        {links.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {links.map((l, i) => (
              <li key={i} className="px-3.5 py-2.5 text-xs">
                <span className="font-medium">{l.text}</span>
                <span className="mono mt-0.5 block break-all text-muted">{l.href}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">No links yet — add internal links to related pages and external links to primary sources.</p>
        )}
      </Block>

      {gate && (
        <div className="rounded-2xl border border-warning/40 bg-warning-bg p-4 text-[13px] text-warning-fg">
          <p className="font-medium">Review before publishing</p>
          <ul className="mt-1 list-disc pl-4">
            {p.placeholders > 0 && <li>{p.placeholders} unfinished placeholder(s)</li>}
            {p.claims > 0 && <li>{p.claims} claim(s) without a source</li>}
          </ul>
          <label className="mt-3 flex cursor-pointer items-start gap-2">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            A human has reviewed these and accepts responsibility for the published content.
          </label>
        </div>
      )}

      <p className="text-xs text-muted">Destination: {p.destination}. Content score <span className="tabular-nums">{p.score}/100</span> — readiness, not guaranteed outcomes.</p>

      {result && <p className="mono break-all rounded-xl bg-success-bg p-2.5 text-success-fg">{result}</p>}

      {/* Sticky actions */}
      <div className="sticky bottom-0 -mx-4 -mb-4 space-y-3 border-t border-line bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending || (gate && !ack) || !p.sections.some((s) => s.body.trim())} onClick={() => run(async () => { const r = await publishContent(p.id, "now"); setResult(r.message + (r.url ? ` ${r.url}` : "")); if (r.ok) { p.setStatus("published"); toast(r.message); } })}>Publish now</Button>
          <Button variant="outline" disabled={pending} onClick={() => run(async () => { await saveVersion(p.id, "Draft saved"); p.setStatus("drafting"); toast("Draft and version saved"); })}>Save draft</Button>
          <Button variant="outline" disabled={pending} onClick={() => run(async () => { p.setStatus("review"); toast("Sent for approval"); })}>Send for approval</Button>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="field !w-auto" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Schedule date" />
          <Button variant="outline" disabled={pending || !date || (gate && !ack)} onClick={() => run(async () => { const r = await publishContent(p.id, "schedule", date); if (r.ok) { p.setStatus("scheduled"); toast(`Scheduled for ${date}`); } })}>Schedule</Button>
        </div>
      </div>
    </div>
  );
}