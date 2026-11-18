"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Badge, Button, Orb } from "@/components/ui";
import { GenArt } from "@/components/gen-art";
import { Markdown } from "@/lib/markdown";
import type { DiffPart } from "@/lib/diff";
import {
  processAssistantMessage,
  type AssistantMessage,
  type AssistantRequestContext,
  type ProposedChange,
} from "@/lib/services/ai-assistant";
import type { FeaturedImage, Section } from "@/lib/types";
import {
  ArrowUp,
  Check,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Layers,
  Link2,
  Loader2,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wand2,
  X,
  XCircle,
} from "lucide-react";

interface AiAssistantPanelProps {
  title: string;
  keyword: string;
  intent: string;
  groupName: string;
  sections: Section[];
  activeSectionId: string | null;
  selection: {
    sectionId: string;
    start: number;
    end: number;
    text: string;
  } | null;
  featuredImage: FeaturedImage | null;
  onClose: () => void;
  onApplyChange: (change: ProposedChange) => void;
  onRejectChange: (changeId: string) => void;
  onApplyFeaturedImage: (image: FeaturedImage) => void;
  onInsertInlineImage: (sectionId: string, markdownImage: string) => void;
  onApplyMeta: (metaTitle: string, metaDescription: string) => void;
  onInsertInternalLink: (sectionId: string, anchorText: string, url: string) => void;
  onSelectSection?: (sectionId: string) => void;
}

type ScopeId = "selection" | "section" | "full_article";

const SCOPES: { id: ScopeId; label: string }[] = [
  { id: "selection", label: "Selection" },
  { id: "section", label: "Section" },
  { id: "full_article", label: "Full article" },
];

const STARTER_PROMPTS = [
  { label: "Improve this article", icon: Wand2, scope: "full_article" },
  { label: "Make it more conversational", icon: Sparkles, scope: "section" },
  { label: "Improve the introduction", icon: FileText, scope: "section" },
  { label: "Add useful examples", icon: Layers, scope: "section" },
  { label: "Optimise for target keyword", icon: Search, scope: "seo" },
  { label: "Generate relevant images", icon: ImageIcon, scope: "image" },
  { label: "Add FAQ section", icon: CheckCircle2, scope: "section" },
  { label: "Recommend internal links", icon: Link2, scope: "seo" },
];

const SELECTION_ACTIONS = [
  { label: "Rewrite", prompt: "Rewrite this selected text to be clearer and punchier" },
  { label: "Shorten", prompt: "Shorten this passage without losing key facts" },
  { label: "Expand", prompt: "Expand this with clinical skin barrier context" },
  { label: "Simplify", prompt: "Simplify sentence structure and vocabulary" },
  { label: "Conversational", prompt: "Make this passage warm and conversational" },
  { label: "Fix grammar", prompt: "Fix grammar, punctuation, and wording" },
];

const SECTION_ACTIONS = [
  { label: "+ Example", prompt: "Add a realistic practical example to this section" },
  { label: "+ Table", prompt: "Add a comparison table to this section" },
  { label: "+ FAQs", prompt: "Add frequently asked questions to this section" },
  { label: "Authoritative", prompt: "Make this section more authoritative and evidence-backed" },
  { label: "+ Image", prompt: "Generate a featured image for this article" },
];

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";
const iconBtn = cx(
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-fg disabled:cursor-not-allowed disabled:opacity-40",
  ring
);
const pillBtn = cx(
  "inline-flex h-7 shrink-0 items-center rounded-full border border-line bg-surface px-2.5 text-xs font-medium transition-colors hover:bg-sunken",
  ring
);
const cardCls = "overflow-hidden rounded-xl border border-line bg-surface";
const headCls = "flex items-center justify-between gap-2 border-b border-line bg-subtle px-3 py-2";
const bodyCls = "space-y-3 p-3";
const proseCls =
  "prose-article !text-[13px] !leading-relaxed [&_h3]:!mb-1 [&_h3]:!mt-3 [&_h3]:!text-sm [&_h3]:!font-semibold [&_p]:!my-1.5 [&_ul]:!my-1.5 [&_ul]:!pl-4 [&_li]:!my-0.5";

const wordCount = (text: string) => text.split(/\s+/).length;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const clampPct = (n: number) => Math.min(100, Math.max(0, n));
const nowLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function AssistantMark({ large = false }: { large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full border border-line bg-subtle",
        large ? "h-8 w-8" : "h-7 w-7"
      )}
    >
      <Orb size={large ? 16 : 14} />
    </span>
  );
}

function CardHead({ icon, title, right }: { icon?: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <div className={headCls}>
      <div className="flex min-w-0 items-center gap-1.5">
        {icon && <span className="shrink-0 text-muted">{icon}</span>}
        <div className="min-w-0 truncate text-xs font-semibold">{title}</div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function AiAssistantPanel({
  title,
  keyword,
  intent,
  groupName,
  sections,
  activeSectionId,
  selection,
  onClose,
  onApplyChange,
  onRejectChange,
  onApplyFeaturedImage,
  onInsertInlineImage,
  onApplyMeta,
  onInsertInternalLink,
}: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    {
      id: "initial_welcome",
      role: "assistant",
      timestamp: nowLabel(),
      content: `Hello! I'm your **contextual writing assistant** for *"${title}"*.\n\nI understand your complete draft (${sections.length} sections), target keyword (\`${keyword}\`), search intent (**${intent}**), and Verdant Botanics brand guardrails.\n\nHighlight text in the editor, select a section, or ask me for rewrites, practical examples, image generation, or SEO refinements.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualScope, setManualScope] = useState<"auto" | ScopeId>("auto");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  // Determine effective context
  const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0];
  const hasSelection = Boolean(selection && selection.text.trim().length > 0);
  const selWords = selection ? wordCount(selection.text) : 0;

  const effectiveScope: ScopeId =
    manualScope !== "auto"
      ? manualScope === "selection" && !hasSelection
        ? "section"
        : manualScope
      : hasSelection
      ? "selection"
      : "section";

  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt ?? input).trim();
    if (!promptToSend || busy) return;

    const userMsg: AssistantMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: promptToSend,
      timestamp: nowLabel(),
      scopeLabel:
        effectiveScope === "selection"
          ? `Selection (${selWords} words)`
          : effectiveScope === "section"
          ? `Section: ${currentSection?.heading || "Section"}`
          : "Full Article",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const reqContext: AssistantRequestContext = {
        scopeType: effectiveScope,
        selection: hasSelection ? selection : null,
        activeSectionId: currentSection?.id,
        sections,
        title,
        keyword,
        intent,
        groupName,
      };

      const response = await processAssistantMessage(promptToSend, reqContext);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          timestamp: nowLabel(),
          content: "Sorry, I encountered an issue analyzing that request. Please try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `cleared_${Date.now()}`,
        role: "assistant",
        timestamp: nowLabel(),
        content: `Conversation cleared. Ready for your next request on *"${title}"*.`,
      },
    ]);
  };

  const handleAcceptChange = (msgId: string, change: ProposedChange) => {
    onApplyChange(change);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.proposedChange
          ? { ...m, proposedChange: { ...m.proposedChange, status: "accepted" } }
          : m
      )
    );
  };

  const handleRejectChange = (msgId: string, changeId: string) => {
    onRejectChange(changeId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.proposedChange
          ? { ...m, proposedChange: { ...m.proposedChange, status: "rejected" } }
          : m
      )
    );
  };

  const pendingReview = messages.some((m) => m.proposedChange?.status === "pending");
  const liveState = busy
    ? { label: "Working…", dot: "bg-fg animate-pulse" }
    : pendingReview
    ? { label: "Review pending", dot: "bg-warning" }
    : { label: "Ready", dot: "bg-success" };

  const scopeCaption =
    effectiveScope === "selection"
      ? `${plural(selWords, "word", "words")} selected`
      : effectiveScope === "section"
      ? `Section: ${currentSection?.heading || "Untitled section"}`
      : `${plural(sections.length, "section", "sections")} in this article`;

  const quickActions = effectiveScope === "selection" ? SELECTION_ACTIONS : SECTION_ACTIONS;

  const composerPlaceholder =
    effectiveScope === "selection"
      ? `Ask to refine selection (${selWords}w)…`
      : effectiveScope === "section"
      ? `Ask about "${currentSection?.heading || "Section"}"…`
      : "Ask for full article review, rewrites, or images…";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface text-fg">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <AssistantMark large />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-tight">AI Assistant</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
              <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", liveState.dot)} />
              {liveState.label}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={handleClearHistory}
            className={iconBtn}
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className={iconBtn}
            title="Close assistant"
            aria-label="Close assistant"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Scope */}
      <div className="shrink-0 border-b border-line px-4 py-3">
        <div role="group" aria-label="Assistant scope" className="grid grid-cols-3 rounded-full bg-sunken p-0.5">
          {SCOPES.map((opt) => {
            const active = effectiveScope === opt.id;
            const disabled = opt.id === "selection" && !hasSelection;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                title={disabled ? "Highlight text in the editor to target a selection" : undefined}
                onClick={() => setManualScope(opt.id === "selection" && !hasSelection ? "section" : opt.id)}
                className={cx(
                  "h-7 rounded-full text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  ring,
                  active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 truncate text-xs text-muted">{scopeCaption}</p>
      </div>

      {/* Thread */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const pc = msg.proposedChange;
          const pi = msg.proposedImage;
          const seo = msg.seoAudit;
          const links = msg.internalLinks;
          const claims = msg.unverifiedClaims;
          const suggestion =
            seo?.metaTitle && seo.metaDesc ? { title: seo.metaTitle, desc: seo.metaDesc } : null;

          const meta = (
            <div className={cx("flex flex-wrap items-center gap-1.5 text-[11px] text-muted", isUser && "justify-end")}>
              <span className="font-medium text-fg">{isUser ? "You" : "Assistant"}</span>
              {msg.scopeLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{msg.scopeLabel}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{msg.timestamp}</span>
            </div>
          );

          if (isUser) {
            return (
              <div key={msg.id} className="flex flex-col items-end gap-1.5">
                {meta}
                <div className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-fg px-3.5 py-2.5 text-[13px] leading-relaxed text-bg">
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex gap-3">
              <AssistantMark />
              <div className="min-w-0 flex-1 space-y-3">
                {meta}

                {msg.thought && (
                  <p className="rounded-xl border border-line bg-subtle px-3 py-2 text-xs leading-relaxed text-muted">
                    <span className="font-medium text-fg">AI rationale: </span>
                    {msg.thought}
                  </p>
                )}

                <div className={cx(proseCls, "break-words")}>
                  <Markdown source={msg.content} />
                </div>

                {/* Proposed text change */}
                {pc && (
                  <div className={cardCls}>
                    <CardHead
                      icon={<Wand2 size={13} strokeWidth={1.75} />}
                      title={
                        <>
                          Proposed change
                          {pc.heading && <span className="font-normal text-muted"> in “{pc.heading}”</span>}
                        </>
                      }
                      right={
                        <Badge tone={pc.status === "accepted" ? "success" : pc.status === "rejected" ? "outline" : "info"}>
                          {pc.status}
                        </Badge>
                      }
                    />
                    <div className={bodyCls}>
                      <p className="text-xs leading-relaxed text-muted">{pc.explanation}</p>

                      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-subtle p-2.5 text-[13px] leading-relaxed">
                        {pc.diff.map((part: DiffPart, idx: number) => {
                          if (part.type === "same") return <span key={idx}>{part.text}</span>;
                          if (part.type === "add")
                            return (
                              <ins
                                key={idx}
                                className="rounded px-0.5 no-underline"
                                style={{ background: "var(--diff-add)" }}
                              >
                                {part.text}
                              </ins>
                            );
                          return (
                            <del key={idx} className="rounded px-0.5" style={{ background: "var(--diff-del)" }}>
                              {part.text}
                            </del>
                          );
                        })}
                      </div>

                      {pc.status === "pending" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" className="gap-1.5" onClick={() => handleAcceptChange(msg.id, pc)}>
                            <Check size={13} strokeWidth={2} />
                            Accept change
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectChange(msg.id, pc.id)}>
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSend("Retry this with a slightly more concise formulation")}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : pc.status === "accepted" ? (
                        <p className="flex items-center gap-1.5 text-xs text-muted">
                          <CheckCircle2 size={13} strokeWidth={1.75} className="shrink-0 text-success-fg" />
                          Applied to article canvas and autosaved.
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 text-xs text-muted">
                          <XCircle size={13} strokeWidth={1.75} className="shrink-0" />
                          Change was rejected. Original draft preserved.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Proposed image */}
                {pi && (
                  <div className={cardCls}>
                    <CardHead
                      icon={<ImageIcon size={13} strokeWidth={1.75} />}
                      title="Generated visual asset"
                      right={
                        <span className="rounded-full bg-sunken px-2 py-0.5 text-[11px] font-medium text-muted">
                          {pi.style}
                        </span>
                      }
                    />
                    <div className={bodyCls}>
                      <div className="overflow-hidden rounded-lg border border-line">
                        <GenArt seed={pi.seed} ratio={pi.ratio} label={pi.alt} />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="text-muted">
                          <span className="font-medium text-fg">Alt text: </span>
                          {pi.alt}
                        </p>
                        {pi.caption && (
                          <p className="text-muted">
                            <span className="font-medium text-fg">Caption: </span>
                            {pi.caption}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            onApplyFeaturedImage({
                              prompt: pi.prompt,
                              seed: pi.seed,
                              alt: pi.alt,
                              caption: pi.caption,
                              ratio: pi.ratio,
                              position: "top",
                            })
                          }
                        >
                          Set as featured image
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onInsertInlineImage(
                              pi.targetSectionId || currentSection.id,
                              `\n\n![${pi.alt}](genart:${pi.seed}:${pi.ratio})\n*${pi.caption}*\n\n`
                            )
                          }
                        >
                          Insert in section
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SEO readiness */}
                {seo && (
                  <div className={cardCls}>
                    <CardHead icon={<Search size={13} strokeWidth={1.75} />} title="SEO readiness & metadata" />
                    <div className={bodyCls}>
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">Readiness score</span>
                          <span className="font-semibold tabular-nums">{seo.keywordScore}/100</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                          <div
                            className="h-full rounded-full bg-fg transition-all"
                            style={{ width: `${clampPct(seo.keywordScore)}%` }}
                          />
                        </div>
                      </div>

                      {suggestion && (
                        <div className="space-y-2.5 rounded-xl bg-subtle p-3">
                          <div>
                            <p className="text-[11px] font-medium text-muted">Suggested meta title</p>
                            <p className="mt-0.5 text-[13px] font-medium text-info-fg">{suggestion.title}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-muted">Suggested meta description</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted">{suggestion.desc}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onApplyMeta(suggestion.title, suggestion.desc)}
                          >
                            Apply to SEO settings
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Internal links */}
                {links && links.length > 0 && (
                  <div className={cardCls}>
                    <CardHead icon={<Link2 size={13} strokeWidth={1.75} />} title="Recommended internal links" />
                    <ul className="divide-y divide-line">
                      {links.map((link, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">“{link.anchorText}”</p>
                            <p className="mono mt-0.5 truncate text-[11px] text-muted">{link.url}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() =>
                              onInsertInternalLink(link.targetSectionId || currentSection.id, link.anchorText, link.url)
                            }
                          >
                            Insert link
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Verification warning */}
                {claims && claims.length > 0 && (
                  <div className="rounded-xl border border-warning/40 bg-warning-bg p-3 text-warning-fg">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <ShieldAlert size={14} strokeWidth={1.75} />
                      Verification required
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed">
                      The following statement lacks verified clinical evidence. Verdant Botanics policy prohibits unsubstantiated medical claims:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs font-medium">
                      {claims.map((claim, idx) => (
                        <li key={idx}>{claim}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking state */}
        {busy && (
          <div className="flex gap-3">
            <AssistantMark />
            <div className="flex items-center gap-2 rounded-xl border border-line bg-subtle px-3 py-2 text-xs text-muted">
              <Loader2 size={13} strokeWidth={1.75} className="shrink-0 animate-spin" />
              <span className="shimmer">Analyzing article draft and generating contextual response…</span>
            </div>
          </div>
        )}

        {/* Starter prompts when the conversation is short */}
        {messages.length <= 1 && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted">Suggested quick prompts</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STARTER_PROMPTS.map((sp) => {
                const Icon = sp.icon;
                return (
                  <button
                    key={sp.label}
                    type="button"
                    onClick={() => handleSend(sp.label)}
                    className={cx(
                      "flex items-start gap-2 rounded-xl border border-line bg-surface px-2.5 py-2 text-left text-xs font-medium leading-snug transition-colors hover:bg-subtle",
                      ring
                    )}
                  >
                    <Icon size={13} strokeWidth={1.75} className="mt-px shrink-0 text-muted" />
                    <span className="min-w-0">{sp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 space-y-2.5 border-t border-line bg-surface p-3">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {quickActions.map((a) => (
            <button key={a.label} type="button" onClick={() => handleSend(a.prompt)} className={pillBtn}>
              {a.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 transition-colors focus-within:border-line-strong focus-within:ring-2 focus-within:ring-line">
          <textarea
            ref={textareaRef}
            aria-label="Message the assistant"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={composerPlaceholder}
            className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1 text-[13px] leading-relaxed text-fg placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            disabled={!input.trim() || busy}
            onClick={() => handleSend()}
            aria-label="Send message"
            className={cx(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30",
              ring
            )}
          >
            <ArrowUp size={15} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[11px] text-muted">
          <span>Enter to send · Shift+Enter for new line</span>
          <span>Knowledge: Verdant Botanics</span>
        </div>
      </div>
    </div>
  );
}