"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Plus, Sparkles, Upload, X } from "lucide-react";
import { Badge, Button, Card, Orb, SectionTitle, Table, Td, Th, trClass, Delta } from "@/components/ui";
import { Chip, Field } from "@/components/ui-client";
import { ProgressBar } from "@/components/charts";
import { saveOnboarding, toggleIntegration } from "@/app/actions";
import { integrationCatalog } from "@/lib/mock-data";
import type { AudienceData, BusinessProfileData, CompetitorData, Workspace } from "@/lib/types";

const TYPES = ["SaaS", "Ecommerce", "Local business", "Professional services", "Agency", "Publisher / Media", "Education", "Healthcare", "Other"];
const INDUSTRIES = ["Beauty & personal care", "Software", "Fashion & apparel", "Food & beverage", "Home & garden", "Health & wellness", "Financial services", "Travel & hospitality", "Education & training", "Real estate", "Legal services", "Marketing & advertising", "Electronics", "Sports & fitness", "Pet care"];
const LANGS = ["English", "Hindi", "Spanish", "French", "German", "Portuguese", "Arabic"];
const GOALS = ["Increase organic traffic", "Rank for important keywords", "Generate qualified leads", "Increase ecommerce sales", "Improve AI search visibility", "Establish industry authority", "Launch a new product or service", "Improve existing website content"];
const TONES = ["Professional", "Friendly", "Authoritative", "Conversational", "Technical"];
const STYLES = ["Simple", "Detailed", "Educational", "Persuasive"];
const PROBLEM_SUGGESTIONS = ["Finding gentle products for sensitive skin", "Understanding ingredient labels", "Building a simple routine", "Comparing brands I can trust", "Knowing what is actually organic"];
const SCAN_TASKS = ["Discovering website pages", "Understanding your business", "Identifying existing content", "Checking technical health"];

type Step = 1 | 2 | 3 | 4 | 5;
interface TopKw { keyword: string; volume: number; difficulty: number; intent: string; priority: string; score: number }

export function Wizard({ workspace, topKeywords, ai }: { workspace: Workspace; topKeywords: TopKw[]; ai: { rate: number; mentions: number; total: number; citations: number } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState<Step>(1);
  const [f, setF] = useState({ name: workspace.name, website: workspace.website, type: workspace.businessType, industry: workspace.industry, description: workspace.description, location: workspace.location, language: workspace.language });
  const [profile, setProfile] = useState<BusinessProfileData>(workspace.profile);
  const [audience, setAudience] = useState<AudienceData>(workspace.audience);
  const [competitors, setCompetitors] = useState<CompetitorData[]>(workspace.competitors);
  const [compMode, setCompMode] = useState<"manual" | "ai" | "skip">("ai");
  const [goals, setGoals] = useState(workspace.goals);
  const [brand, setBrand] = useState(workspace.brand);
  const [integrations, setIntegrations] = useState(workspace.integrations);
  const [files, setFiles] = useState<string[]>([]);
  const [scan, setScan] = useState<number[]>([0, 0, 0, 0]);
  const [scanDone, setScanDone] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newSeg, setNewSeg] = useState("");
  const [newProb, setNewProb] = useState("");
  const [aiWriting, setAiWriting] = useState(false);
  const [saved, setSaved] = useState(false);

  const valid1 = f.name.trim() && /^[\w.-]+\.[a-z]{2,}/i.test(f.website.replace(/^https?:\/\//, "")) && f.description.trim().length > 10;

  // Animated discovery checklist (sequential progress per task)
  useEffect(() => {
    if (step !== 2) return;
    setScan([0, 0, 0, 0]);
    setScanDone(false);
    let task = 0;
    const id = setInterval(() => {
      setScan((s) => {
        const n = [...s];
        n[task] = Math.min(100, n[task] + 12 + Math.round(Math.random() * 14));
        if (n[task] >= 100) task++;
        if (task >= 4) {
          clearInterval(id);
          setScanDone(true);
          setProfile((p) => (f.website === workspace.website ? p : { ...p, summary: `${f.type} business: ${f.name}`, offering: f.description.slice(0, 90), existingContent: 0 }));
        }
        return n;
      });
    }, 220);
    return () => clearInterval(id);
  }, [step, f.website, f.name, f.type, f.description, workspace.website, workspace.profile]);

  const writeFromSite = () => {
    setAiWriting(true);
    setTimeout(() => {
      setF((s) => ({ ...s, description: `${s.name || "This business"} is a ${s.type.toLowerCase()} company in ${s.industry.toLowerCase() || "its industry"} serving customers in ${s.location || "its home market"}. [Drafted from public pages on ${s.website || "your website"} — please edit so it is accurate.]` }));
      setAiWriting(false);
    }, 900);
  };

  const aiCompetitors = useMemo<CompetitorData[]>(() => workspace.competitors, [workspace.competitors]);
  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const finish = () =>
    start(async () => {
      await saveOnboarding({ name: f.name, website: f.website.replace(/^https?:\/\//, ""), businessType: f.type, industry: f.industry, description: f.description, location: f.location, language: f.language, profile, audience, competitors: compMode === "skip" ? [] : competitors, goals, brand });
      setSaved(true);
      setStep(5);
    });

  const progress = step === 5 ? 100 : (step / 4) * 100;

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed inset-x-0 top-0 z-10 bg-bg">
        <div className="h-0.5 bg-sunken"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2"><Orb size={20} /><span className="text-sm font-medium">Visibility OS</span></div>
          <span className="caption">{step === 5 ? "Ready" : `Step ${step} of 4`}</span>
        </div>
      </div>

      <div className={`mx-auto px-6 pb-32 pt-24 ${step === 5 ? "max-w-4xl" : "max-w-[560px]"}`}>
        {step === 1 && (
          <div className="enter space-y-5">
            <div>
              <h1 className="display">Let&apos;s get to know your business.</h1>
              <p className="mt-2 text-muted">Tell us a little about your business. We&apos;ll use this to understand your market, customers and opportunities to grow your visibility.</p>
            </div>
            <Field label="Business name"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Verdant Botanics" /></Field>
            <Field label="Website URL"><input className="field" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="yourbusiness.com" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Business type">
                <select className="field" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
              <Field label="Industry">
                <input className="field" list="industries" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} placeholder="Search industries…" />
                <datalist id="industries">{INDUSTRIES.map((i) => <option key={i} value={i} />)}</datalist>
              </Field>
            </div>
            <Field label="Business description">
              <textarea className="field" rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What do you sell, and who for?" />
            </Field>
            <button type="button" onClick={writeFromSite} disabled={aiWriting} className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm hover:bg-sunken">
              <Orb size={14} /> {aiWriting ? <span className="shimmer">Reading your website…</span> : "Write it from my website"}
            </button>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Business location"><input className="field" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Country / city" /></Field>
              <Field label="Primary language">
                <select className="field" value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>{LANGS.map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="enter space-y-6">
            <div>
              <h1 className="display">Let&apos;s explore your website.</h1>
              <p className="mt-2 text-muted">We read your public pages, sitemap and metadata. Nothing is changed on your site.</p>
            </div>
            <ul className="space-y-4">
              {SCAN_TASKS.map((t, i) => (
                <li key={t}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">{scan[i] >= 100 ? <Check size={16} strokeWidth={1.5} className="text-success" /> : <Orb size={14} />}{t}</span>
                    <span className="tabular-nums text-muted">{Math.min(100, scan[i])}%</span>
                  </div>
                  <ProgressBar pct={Math.min(100, scan[i])} />
                </li>
              ))}
            </ul>
            {scanDone ? (
              <Card className="enter p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="h2">Business profile</h2>
                  <Badge tone="warning">AI-extracted — please confirm</Badge>
                </div>
                <div className="space-y-3">
                  {(["summary", "offering", "customers"] as const).map((k) => (
                    <Field key={k} label={{ summary: "Business", offering: "Main offering", customers: "Target customers" }[k]}>
                      <input className="field" value={profile[k]} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} />
                    </Field>
                  ))}
                  <Field label="Main categories" hint="Comma separated"><input className="field" value={profile.categories.join(", ")} onChange={(e) => setProfile({ ...profile, categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
                  <Field label="Detected topics" hint="Comma separated"><input className="field" value={profile.topics.join(", ")} onChange={(e) => setProfile({ ...profile, topics: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
                  <p className="text-sm text-muted">Existing content found: <span className="text-fg font-medium">{profile.existingContent} articles</span> · Technical checks flagged <span className="text-fg font-medium">8 items</span> to review later.</p>
                </div>
                <p className="caption mt-3">Crawls can miss pages or misread positioning. Treat this as a starting point, not business truth. Demo mode uses sample extraction.</p>
              </Card>
            ) : (
              <p className="shimmer text-sm">Analysing your website…</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="enter space-y-7">
            <div>
              <h1 className="display">Who are you trying to reach?</h1>
              <p className="mt-2 text-muted">Pre-filled from your website. Edit anything that isn&apos;t right.</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Customer segments</p>
              <div className="flex flex-wrap gap-2">
                {audience.segments.map((s) => <Chip key={s} active onClick={() => setAudience({ ...audience, segments: audience.segments.filter((x) => x !== s) })}>{s} <X size={12} /></Chip>)}
              </div>
              <div className="mt-2 flex gap-2"><input className="field" placeholder="Add a segment" value={newSeg} onChange={(e) => setNewSeg(e.target.value)} /><Button variant="outline" onClick={() => { if (newSeg.trim()) { setAudience({ ...audience, segments: [...audience.segments, newSeg.trim()] }); setNewSeg(""); } }}><Plus size={16} /> Add</Button></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Geographic markets"><input className="field" value={audience.markets.join(", ")} onChange={(e) => setAudience({ ...audience, markets: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <Field label="Languages"><input className="field" value={audience.languages.join(", ")} onChange={(e) => setAudience({ ...audience, languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">What problems do your customers come to you to solve?</p>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...PROBLEM_SUGGESTIONS, ...audience.problems])].map((p) => (
                  <Chip key={p} active={audience.problems.includes(p)} onClick={() => setAudience({ ...audience, problems: toggleIn(audience.problems, p) })}>{p}</Chip>
                ))}
              </div>
              <div className="mt-2 flex gap-2"><input className="field" placeholder="Add your own" value={newProb} onChange={(e) => setNewProb(e.target.value)} /><Button variant="outline" onClick={() => { if (newProb.trim()) { setAudience({ ...audience, problems: [...audience.problems, newProb.trim()] }); setNewProb(""); } }}><Plus size={16} /> Add</Button></div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Who are you competing with?</p>
              <div className="mb-3 inline-flex rounded-full bg-sunken p-0.5">
                {([["manual", "Add manually"], ["ai", "Let AI discover"], ["skip", "Skip"]] as const).map(([id, l]) => (
                  <button key={id} type="button" onClick={() => { setCompMode(id); if (id === "ai") setCompetitors(aiCompetitors); }} className={`rounded-full px-3.5 py-1 text-sm font-medium ${compMode === id ? "bg-surface shadow-sm" : "text-muted"}`}>{l}</button>
                ))}
              </div>
              {compMode === "skip" && <p className="text-sm text-muted">No problem — you can configure competitors later in Settings. Competitor gap analysis will stay empty until then.</p>}
              {compMode === "manual" && (
                <div className="mb-3 flex gap-2"><input className="field" placeholder="competitor.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} /><Button variant="outline" onClick={() => { if (newDomain.trim()) { setCompetitors([...competitors, { domain: newDomain.trim(), description: "Added manually", kind: "business", sharedTopics: [], overlap: 0 }]); setNewDomain(""); } }}>Add</Button></div>
              )}
              {compMode !== "skip" && (
                <div className="space-y-2">
                  {competitors.map((c) => (
                    <Card key={c.domain} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{c.domain}</p>
                          <p className="caption mt-0.5">{c.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={c.kind === "business" ? "neutral" : c.kind === "search" ? "info" : "outline"}>{c.kind === "business" ? "Business competitor" : c.kind === "search" ? "Search competitor" : "AI visibility competitor"}</Badge>
                          <button type="button" aria-label={`Remove ${c.domain}`} onClick={() => setCompetitors(competitors.filter((x) => x.domain !== c.domain))} className="text-muted hover:text-fg"><X size={14} /></button>
                        </div>
                      </div>
                      {c.overlap > 0 && <p className="caption mt-2">Shared topics: {c.sharedTopics.join(", ")} · {c.overlap}% keyword overlap (estimate)</p>}
                    </Card>
                  ))}
                </div>
              )}
              <p className="caption mt-2">Business, search and AI-visibility competitors are often different companies.</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">What does growth look like for you?</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <Chip key={g} active={goals.selected.includes(g)} onClick={() => { const sel = toggleIn(goals.selected, g); setGoals({ selected: sel, primary: sel.includes(goals.primary) ? goals.primary : sel[0] ?? "" }); }}>{g}</Chip>
                ))}
              </div>
              {goals.selected.length > 1 && (
                <div className="mt-3">
                  <p className="caption mb-1">Which is your primary objective?</p>
                  <select className="field" value={goals.primary} onChange={(e) => setGoals({ ...goals, primary: e.target.value })}>{goals.selected.map((g) => <option key={g}>{g}</option>)}</select>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="enter space-y-7">
            <div>
              <h1 className="display">Let&apos;s understand your brand&apos;s voice.</h1>
              <p className="mt-2 text-muted">Saved as your <strong style={{ fontWeight: 500 }}>Brand Knowledge Profile</strong> and used for every article and page. Both parts are optional and resumable.</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Brand tone</p>
              <div className="flex flex-wrap gap-2">{TONES.map((t) => <Chip key={t} active={brand.tone.includes(t)} onClick={() => setBrand({ ...brand, tone: toggleIn(brand.tone, t) })}>{t}</Chip>)}</div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Writing style</p>
              <div className="flex flex-wrap gap-2">{STYLES.map((t) => <Chip key={t} active={brand.style.includes(t)} onClick={() => setBrand({ ...brand, style: toggleIn(brand.style, t) })}>{t}</Chip>)}</div>
            </div>
            <Field label="Words or claims to avoid"><input className="field" value={brand.avoid} onChange={(e) => setBrand({ ...brand, avoid: e.target.value })} placeholder="e.g. cure, miracle, guaranteed" /></Field>
            <Field label="Reference articles or websites"><input className="field" value={brand.references} onChange={(e) => setBrand({ ...brand, references: e.target.value })} placeholder="https://" /></Field>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong p-6 text-center hover:bg-subtle">
              <Upload size={20} strokeWidth={1.5} className="text-muted" />
              <span className="text-sm font-medium">Upload guidelines, PDFs, logo or product catalogue</span>
              <span className="caption">{files.length ? files.join(", ") : brand.guidelines || "Drop files here or click to browse"}</span>
              <input type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((x) => x.name))} />
            </label>

            <div>
              <SectionTitle title="Connect your existing tools" description="Skip any of these — analytics stay unavailable until connected." />
              {(["Website", "Analytics", "Social"] as const).map((g) => (
                <div key={g} className="mb-5">
                  <p className="caption mb-2">{g}</p>
                  <div className="space-y-2">
                    {integrationCatalog.filter((i) => i.group === g && (g !== "Website" || ["wordpress", "webflow", "shopify", "webhook"].includes(i.id))).map((i) => (
                      <Card key={i.id} className="flex items-start justify-between gap-3 p-4">
                        <div>
                          <p className="text-sm font-medium">{i.name}</p>
                          <ul className="caption mt-1 list-disc pl-4">{i.enables.slice(0, 3).map((e) => <li key={e}>{e}</li>)}</ul>
                        </div>
                        <Button size="sm" variant={integrations[i.id] ? "secondary" : "outline"} onClick={() => { setIntegrations({ ...integrations, [i.id]: !integrations[i.id] }); toggleIntegration(i.id); }}>{integrations[i.id] ? "Connected" : "Connect"}</Button>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              {!integrations.gsc && <p className="rounded-xl bg-warning-bg p-3.5 text-sm text-warning-fg">Without Google Search Console, clicks, impressions and rankings will show as unavailable.</p>}
            </div>
          </div>
        )}

        {step === 5 && saved && (
          <div className="enter space-y-8">
            <div className="flex items-start gap-4">
              <Orb size={44} />
              <div>
                <h1 className="display">Your visibility strategy is ready.</h1>
                <p className="mt-2 text-muted">A personalised starting report for {f.name}. Estimates are labelled and need validation.</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-5"><p className="caption">Business profile</p><p className="mt-1 text-sm leading-relaxed">{profile.summary}</p><p className="caption mt-2">{profile.offering}</p></Card>
              <Card className="p-5"><p className="caption">Website health</p><p className="text-[32px] font-normal leading-tight">72<span className="text-base text-muted">/100</span></p><p className="caption mt-1">4 critical and 7 high items to review</p></Card>
              <Card className="p-5"><p className="caption">Existing content</p><p className="text-[32px] font-normal leading-tight">{profile.existingContent}</p><p className="caption mt-1">Topics: {profile.topics.join(", ")}</p></Card>
            </div>
            <div>
              <SectionTitle title="10 keyword opportunities" description="Volume and difficulty are estimates." />
              <Table>
                <thead><tr><Th>Keyword</Th><Th>Volume (est.)</Th><Th>Difficulty (est.)</Th><Th>Intent</Th><Th>Priority</Th></tr></thead>
                <tbody>{topKeywords.map((k) => (
                  <tr key={k.keyword} className={trClass}><Td className="font-medium">{k.keyword}</Td><Td>{k.volume.toLocaleString()}</Td><Td>{k.difficulty}</Td><Td><Badge>{k.intent}</Badge></Td><Td><Badge tone={k.priority === "High" ? "success" : "warning"}>{k.priority}</Badge></Td></tr>
                ))}</tbody>
              </Table>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-5">
                <p className="h3 mb-3">Competitor landscape</p>
                {competitors.length ? competitors.slice(0, 4).map((c) => <div key={c.domain} className="flex justify-between py-1 text-sm"><span className="font-medium">{c.domain}</span><span className="text-muted">{c.kind}</span></div>) : <p className="text-sm text-muted">Skipped — configure in Settings.</p>}
              </Card>
              <Card className="p-5">
                <p className="h3 mb-1">AI visibility baseline</p>
                <p className="text-[32px] font-normal leading-tight">{ai.rate}%</p>
                <p className="caption mt-1">Responses mentioning your brand ÷ valid monitored responses ({ai.mentions} of {ai.total}). Controlled sample, not what every user sees.</p>
              </Card>
            </div>
            <div>
              <SectionTitle title="Your first five actions" />
              <ol className="divide-y divide-line rounded-2xl border border-line">
                {["Create a buying guide for “best organic face moisturiser”", "Fix 4 missing meta descriptions", "Connect Google Analytics 4 to measure organic sessions", "Build the missing comparison articles in Organic Skincare", "Add direct answers to your top 3 questions"].map((a, i) => (
                  <li key={a} className="flex items-center gap-3 px-5 py-3 text-sm font-medium"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-sunken text-xs font-normal">{i + 1}</span>{a}</li>
                ))}
              </ol>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => router.push("/overview")}>Explore my visibility dashboard</Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/topic-groups")}>Review my growth strategy</Button>
            </div>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[560px] items-center justify-between px-6">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => (s - 1) as Step)}><ChevronLeft size={16} /> Back</Button>
            <div className="flex items-center gap-2">
              {step === 4 && <Button variant="ghost" onClick={finish} disabled={pending}>Skip for now</Button>}
              {step < 4 ? (
                <Button disabled={(step === 1 && !valid1) || (step === 2 && !scanDone)} onClick={() => setStep((s) => (s + 1) as Step)}>Continue</Button>
              ) : (
                <Button disabled={pending} onClick={finish}>{pending ? <span className="inline-flex items-center gap-2"><Sparkles size={14} /> Building strategy…</span> : "Generate my strategy"}</Button>
              )}
            </div>
          </div>
        </div>
      )}
      <span className="hidden"><Delta value={0} /></span>
    </div>
  );
}
