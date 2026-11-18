"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Sparkles, X } from "lucide-react";
import { Badge, Button, Card, Orb } from "@/components/ui";
import { Chip, Counter, Field } from "@/components/ui-client";
import { createContent } from "@/app/actions";
import { makeBrief } from "@/lib/services/ai";
import { competitorGaps } from "@/lib/mock-data";
import type { ContentBrief, Intent } from "@/lib/types";

interface Kw { id: number; keyword: string; intent: string; topicGroupId: number | null; coverage: string; volume: number }
interface Existing { id: number; title: string; keyword: string }
type Start = "keyword" | "group" | "gap" | "existing" | "blank" | "ai";

const PAGE_TYPES: { id: string; label: string; outline: string[] }[] = [
  { id: "Landing page", label: "Landing page", outline: ["Hero: value proposition", "Who it's for", "Key benefits", "How it works", "Proof and reviews (verified only)", "FAQs", "Call to action"] },
  { id: "Product page", label: "Product page", outline: ["Product summary", "Key features", "Ingredients / specifications", "How to use", "Shipping and returns", "FAQs"] },
  { id: "Service page", label: "Service page", outline: ["What we do", "Who it's for", "Process", "Pricing guidance", "Case studies (verified only)", "FAQs", "Contact"] },
  { id: "Location page", label: "Location page", outline: ["About our presence here", "Services in this area", "Directions and hours", "Local FAQs"] },
  { id: "Comparison page", label: "Comparison page", outline: ["Overview", "Side-by-side comparison", "Who should choose which", "Verdict", "FAQs"] },
  { id: "About page", label: "About page", outline: ["Our story", "What we stand for", "How we work", "The team", "Get in touch"] },
];

export function BriefWizard({ mode, keywords, groups, existing, initialKeyword, initialGroupId }: { mode: "article" | "page"; keywords: Kw[]; groups: { id: number; name: string }[]; existing: Existing[]; initialKeyword?: string; initialGroupId?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [startFrom, setStartFrom] = useState<Start>(initialGroupId ? "group" : "keyword");
  const [keyword, setKeyword] = useState(initialKeyword ?? "");
  const [groupId, setGroupId] = useState<number | null>(initialGroupId ?? null);
  const [pageType, setPageType] = useState(PAGE_TYPES[0].id);
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("");
  const [brief, setBrief] = useState<ContentBrief | null>(null);

  const bestMissing = useMemo(() => keywords.filter((k) => k.coverage === "Missing").sort((a, b) => b.volume - a.volume), [keywords]);

  const resolveKeyword = (): string => {
    if (startFrom === "ai") return bestMissing[0]?.keyword ?? keyword;
    if (startFrom === "group" && groupId) return bestMissing.find((k) => k.topicGroupId === groupId)?.keyword ?? keyword;
    return keyword;
  };

  const build = () => {
    const kw = resolveKeyword();
    const kwRow = keywords.find((k) => k.keyword === kw);
    const b = makeBrief(kw, "Verdant Botanics", (kwRow?.intent as Intent) ?? "informational");
    if (mode === "page") {
      const t = PAGE_TYPES.find((p) => p.id === pageType)!;
      b.outline = t.outline;
      b.proposedTitle = `${kw ? kw.replace(/\b\w/g, (c) => c.toUpperCase()) : t.label} — ${t.label}`;
      b.metaTitle = `${b.proposedTitle} | Verdant Botanics`.slice(0, 60);
      if (audience) b.audience = audience;
      b.lengthSuggestion = "Concise and scannable — pages should serve one clear purpose.";
      b.competitorSummary = `Competing ${t.label.toLowerCase()}s lead with a clear value proposition and answer objections near the call to action. Few show verified proof. (AI estimate — validate.)`;
    }
    if (!kwRow && kw === "") b.proposedTitle = "Untitled";
    setBrief(b);
    if (!groupId) setGroupId(kwRow?.topicGroupId ?? null);
    setStep(2);
  };

  const upd = (p: Partial<ContentBrief>) => setBrief((b) => (b ? { ...b, ...p } : b));
  const move = (i: number, d: number) => {
    if (!brief) return;
    const o = [...brief.outline];
    const j = i + d;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    upd({ outline: o });
  };

  const approve = () =>
    start(async () => {
      if (!brief) return;
      const id = await createContent({ type: mode, title: brief.proposedTitle, keyword: brief.primaryKeyword, topicGroupId: groupId, format: mode === "page" ? pageType : brief.intent === "commercial" ? "Buying guide" : "Guide", brief });
      router.push(`/${mode === "page" ? "pages" : "articles"}/${id}?generate=1`);
    });

  const startOptions: { id: Start; label: string; desc: string }[] = [
    { id: "keyword", label: "From a keyword", desc: "Pick or type a search phrase" },
    { id: "group", label: "From a topic group", desc: "Fill the biggest gap in a cluster" },
    { id: "gap", label: "From a competitor gap", desc: "Cover what competitors rank for" },
    { id: "existing", label: "From an existing article", desc: "Refresh or expand it" },
    { id: "ai", label: "AI-recommended opportunity", desc: "We pick the best open one" },
    { id: "blank", label: "Blank document", desc: "Start from nothing" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <p className="caption mb-1">{mode === "page" ? "New page" : "New article"} · Step {step} of 2</p>
      {step === 1 && mode === "article" && (
        <div className="enter space-y-6">
          <div><h1 className="display">Where should this start?</h1><p className="mt-2 text-muted">We&apos;ll research first and create a brief for you to approve before anything is written.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {startOptions.map((o) => (
              <button key={o.id} type="button" onClick={() => setStartFrom(o.id)} className={`rounded-2xl border p-4 text-left transition-colors ${startFrom === o.id ? "border-fg bg-subtle" : "border-line hover:bg-subtle"}`} aria-pressed={startFrom === o.id}>
                <p className="text-sm font-medium">{o.label}</p><p className="caption mt-0.5">{o.desc}</p>
              </button>
            ))}
          </div>
          {startFrom === "keyword" && (
            <Field label="Primary keyword"><input className="field" list="kwlist" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. best organic face moisturiser" /><datalist id="kwlist">{keywords.map((k) => <option key={k.id} value={k.keyword} />)}</datalist></Field>
          )}
          {startFrom === "group" && (
            <Field label="Topic group"><select className="field" value={groupId ?? ""} onChange={(e) => setGroupId(Number(e.target.value) || null)}><option value="">Choose a group</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
          )}
          {startFrom === "gap" && (
            <Field label="Competitor gap"><select className="field" value={keyword} onChange={(e) => setKeyword(e.target.value)}><option value="">Choose a gap</option>{competitorGaps.map((g) => <option key={g.keyword} value={g.keyword}>{g.keyword} — {g.competitor}</option>)}</select></Field>
          )}
          {startFrom === "existing" && (
            <Field label="Existing article"><select className="field" value={keyword} onChange={(e) => setKeyword(e.target.value)}><option value="">Choose an article</option>{existing.filter((x) => x.keyword).map((x) => <option key={x.id} value={x.keyword}>{x.title}</option>)}</select></Field>
          )}
          {startFrom === "ai" && <Card className="flex items-center gap-3 p-4"><Orb size={28} /><p className="text-sm">Recommended: <span className="font-medium">{bestMissing[0]?.keyword ?? "no open opportunities"}</span> — <span className="text-muted">highest estimated demand with no content yet.</span></p></Card>}
          <Button size="lg" onClick={build} disabled={startFrom === "keyword" && !keyword.trim()}><Sparkles size={16} strokeWidth={1.5} /> Create research brief</Button>
        </div>
      )}

      {step === 1 && mode === "page" && (
        <div className="enter space-y-6">
          <div><h1 className="display">What page are you creating?</h1><p className="mt-2 text-muted">We generate structured content for your existing CMS template — not a visual site builder.</p></div>
          <div className="flex flex-wrap gap-2">{PAGE_TYPES.map((t) => <Chip key={t.id} active={pageType === t.id} onClick={() => setPageType(t.id)}>{t.label}</Chip>)}</div>
          <Field label="Target keyword or topic"><input className="field" list="kwlist" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. organic face moisturiser" /><datalist id="kwlist">{keywords.map((k) => <option key={k.id} value={k.keyword} />)}</datalist></Field>
          <Field label="Page purpose"><input className="field" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Help shoppers choose and buy a moisturiser" /></Field>
          <Field label="Target audience"><input className="field" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Shoppers with sensitive skin" /></Field>
          <Button size="lg" onClick={build} disabled={!keyword.trim()}><Sparkles size={16} strokeWidth={1.5} /> Research competing pages</Button>
        </div>
      )}

      {step === 2 && brief && (
        <div className="enter space-y-6">
          <div><h1 className="display">{mode === "page" ? "Page structure" : "Review your brief"}</h1><p className="mt-2 text-muted">Edit anything. Nothing is written until you approve.</p></div>
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2"><Orb size={16} /><p className="h3">Competitor analysis</p><Badge tone="outline">AI estimate</Badge></div>
            <p className="text-sm leading-relaxed">{brief.competitorSummary}</p>
            <p className="caption mt-2">Suggested length: {brief.lengthSuggestion}</p>
          </Card>
          <Field label="Proposed title"><input className="field" value={brief.proposedTitle} onChange={(e) => upd({ proposedTitle: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary keyword"><input className="field" value={brief.primaryKeyword} onChange={(e) => upd({ primaryKeyword: e.target.value })} /></Field>
            <Field label="Search intent"><select className="field" value={brief.intent} onChange={(e) => upd({ intent: e.target.value as Intent })}><option value="informational">Informational</option><option value="commercial">Commercial</option><option value="transactional">Transactional</option><option value="navigational">Navigational</option></select></Field>
          </div>
          <Field label="Secondary keywords" hint="Comma separated"><input className="field" value={brief.secondaryKeywords.join(", ")} onChange={(e) => upd({ secondaryKeywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
          <Field label="Target audience"><input className="field" value={brief.audience} onChange={(e) => upd({ audience: e.target.value })} /></Field>
          <div>
            <div className="mb-1.5 flex items-center justify-between"><span className="text-sm font-medium">Meta title</span><Counter value={brief.metaTitle.length} min={30} max={60} /></div>
            <input className="field" value={brief.metaTitle} onChange={(e) => upd({ metaTitle: e.target.value })} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between"><span className="text-sm font-medium">Meta description</span><Counter value={brief.metaDescription.length} min={80} max={160} /></div>
            <textarea className="field" rows={3} value={brief.metaDescription} onChange={(e) => upd({ metaDescription: e.target.value })} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{mode === "page" ? "Sections" : "H1 / H2 outline"}</p>
            <ul className="space-y-2">
              <li className="rounded-xl bg-sunken px-3.5 py-2 text-sm font-medium"><span className="caption mr-2 font-normal">H1</span>{brief.proposedTitle}</li>
              {brief.outline.map((h, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="caption w-6">H2</span>
                  <input className="field !h-9 !min-h-9" aria-label={`Section ${i + 1}`} value={h} onChange={(e) => upd({ outline: brief.outline.map((x, k) => (k === i ? e.target.value : x)) })} />
                  <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded-full p-1.5 text-muted hover:bg-sunken"><ArrowUp size={14} /></button>
                  <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded-full p-1.5 text-muted hover:bg-sunken"><ArrowDown size={14} /></button>
                  <button type="button" aria-label="Remove section" onClick={() => upd({ outline: brief.outline.filter((_, k) => k !== i) })} className="rounded-full p-1.5 text-muted hover:bg-sunken"><X size={14} /></button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => upd({ outline: [...brief.outline, "New section"] })}><Plus size={14} /> Add section</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-4"><p className="mb-2 text-sm font-medium">Related questions to answer</p><ul className="list-disc space-y-1 pl-4 text-sm">{brief.questions.map((q) => <li key={q}>{q}</li>)}</ul></Card>
            <Card className="p-4"><p className="mb-2 text-sm font-medium">Internal link & reference suggestions</p><ul className="list-disc space-y-1 pl-4 text-sm">{[...brief.internalLinks, ...brief.references].map((q) => <li key={q}>{q}</li>)}</ul></Card>
          </div>
          <Card className="p-4">
            <p className="mb-2 text-sm font-medium">Unique expertise needed</p>
            <p className="caption mb-2">Helpful content includes first-hand experience. Prepare answers to these before publishing.</p>
            <ul className="list-disc space-y-1 pl-4 text-sm">{brief.expertise.map((q) => <li key={q}>{q}</li>)}</ul>
          </Card>
          <div className="flex items-center gap-3 pb-10">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button size="lg" disabled={pending || !brief.outline.length || !brief.proposedTitle.trim()} onClick={approve}>{pending ? "Creating…" : "Approve brief & start writing"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
