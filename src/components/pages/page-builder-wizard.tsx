"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { Input, SelectDropdown } from "@/components/ui-form";
import {
  ALL_PAGE_TYPES,
  type PageDocument,
  type PageOpportunity,
  type PageType,
} from "@/lib/website-intelligence-types";
import {
  createDefaultPageDocument,
  INITIAL_PAGE_OPPORTUNITIES,
} from "@/lib/website-intelligence-data";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Loader2,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";

interface PageBuilderWizardProps {
  initialOpportunity?: PageOpportunity;
}

export function PageBuilderWizard({ initialOpportunity }: PageBuilderWizardProps) {
  const router = useRouter();

  // Wizard Steps (1 - 6 consolidated into clear progressive milestones)
  // Step 1: Opportunity / Purpose
  // Step 2: Page Type & Keyword Research
  // Step 3: AI Brief & Competitor Benchmarks
  // Step 4: Page Structure & Sections Selection
  // Step 5: Content & Visual Asset Generation
  // Step 6: Review & Transition to Visual Editor
  const [step, setStep] = useState(1);

  // Form State
  const [selectedOpp, setSelectedOpp] = useState<PageOpportunity | undefined>(
    initialOpportunity || INITIAL_PAGE_OPPORTUNITIES[0]
  );
  const [isCustom, setIsCustom] = useState(!initialOpportunity);
  const [customTitle, setCustomTitle] = useState("");
  const [pageType, setPageType] = useState<PageType>(
    initialOpportunity?.recommendedPageType || "Solution"
  );
  const [purpose, setPurpose] = useState(
    "Provide a dedicated comparison between bakuchiol and retinol to convert sensitive skin shoppers seeking gentle cellular renewal."
  );
  const [primaryKeyword, setPrimaryKeyword] = useState(
    initialOpportunity?.primaryKeyword || "bakuchiol vs retinol comparison"
  );
  const [secondaryKeywords, setSecondaryKeywords] = useState(
    initialOpportunity?.relatedKeywords.join(", ") ||
      "natural retinol alternative, is bakuchiol as good as retinol, plant ceramide"
  );
  const [targetAudience, setTargetAudience] = useState(
    "Consumers with sensitive or reactive skin who cannot tolerate traditional retinoids."
  );
  const [includedSections, setIncludedSections] = useState<string[]>([
    "hero",
    "features_grid",
    "comparison_table",
    "faq_accordion",
    "cta_banner",
  ]);

  const [generating, setGenerating] = useState(false);

  const handleNext = () => {
    if (step === 4) {
      // Simulate AI Content & Section Generation
      setGenerating(true);
      setTimeout(() => {
        setGenerating(false);
        setStep(5);
      }, 1200);
      return;
    }

    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      // Transition to visual editor
      const doc = createDefaultPageDocument(isCustom ? undefined : selectedOpp);
      doc.title = isCustom && customTitle ? customTitle : doc.title;
      doc.pageType = pageType;
      doc.primaryKeyword = primaryKeyword;

      toast("Page generated successfully! Opening in visual editor...");
      // In production router.push(`/pages/${doc.id}`);
      // For now redirect or toast
      router.push("/pages");
    }
  };

  const handleSelectOpportunity = (opp: PageOpportunity) => {
    setSelectedOpp(opp);
    setIsCustom(false);
    setPageType(opp.recommendedPageType);
    setPrimaryKeyword(opp.primaryKeyword);
    setSecondaryKeywords(opp.relatedKeywords.join(", "));
    setPurpose(opp.reasonForRecommendation);
  };

  const toggleSection = (sec: string) => {
    setIncludedSections((prev) =>
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Wizard Header & Stepper */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="h1">AI Page Builder & Composition Engine</h1>
            <p className="caption mt-1">
              Create structured, high-ranking landing and commercial pages with clinical brand guardrails.
            </p>
          </div>

          <Link
            href="/pages"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg font-medium"
          >
            <ArrowLeft size={14} />
            Back to pages
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-y border-line py-3 text-xs">
          {[
            { num: 1, label: "Opportunity & Purpose" },
            { num: 2, label: "Keywords & Intent" },
            { num: 3, label: "AI Brief & Blueprint" },
            { num: 4, label: "Structure & Sections" },
            { num: 5, label: "Review & Assets" },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${
                step === s.num
                  ? "text-fg font-bold"
                  : step > s.num
                  ? "text-emerald-500 font-medium"
                  : "text-muted"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono font-semibold ${
                  step === s.num
                    ? "bg-fg text-bg"
                    : step > s.num
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-sunken text-muted"
                }`}
              >
                {step > s.num ? <Check size={12} strokeWidth={2.5} /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: OPPORTUNITY SELECTION OR CUSTOM PURPOSE */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="h2">Select a Page Opportunity or Start Custom</h2>
            <p className="caption mt-1">
              Launch directly from high-demand search gaps or define a custom marketing objective.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsCustom(false)}
              className={`p-4 rounded-xl border text-left transition-all ${
                !isCustom
                  ? "border-fg bg-surface shadow-xs ring-1 ring-fg"
                  : "border-line bg-subtle/40 hover:bg-subtle hover:border-line-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-fg">Recommended Opportunity</span>
                {!isCustom && <Check size={16} strokeWidth={2} className="text-fg shrink-0" />}
              </div>
              <p className="caption text-xs mt-1">
                Backed by verified search demand volume, competitor gaps, and Search Console impressions.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isCustom
                  ? "border-fg bg-surface shadow-xs ring-1 ring-fg"
                  : "border-line bg-subtle/40 hover:bg-subtle hover:border-line-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-fg">Custom Landing Page</span>
                {isCustom && <Check size={16} strokeWidth={2} className="text-fg shrink-0" />}
              </div>
              <p className="caption text-xs mt-1">
                Define your own bespoke marketing goal, product launch, or partnership page from scratch.
              </p>
            </button>
          </div>

          {!isCustom ? (
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted block">
                Discovered High-Impact Opportunities ({INITIAL_PAGE_OPPORTUNITIES.length})
              </span>
              <div className="space-y-2.5">
                {INITIAL_PAGE_OPPORTUNITIES.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => handleSelectOpportunity(opp)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedOpp?.id === opp.id
                        ? "border-fg bg-surface shadow-xs ring-1 ring-fg"
                        : "border-line bg-surface hover:border-line-strong hover:bg-subtle/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge tone="info" className="text-[11px]">{opp.recommendedPageType}</Badge>
                          <span className="font-mono text-xs font-semibold text-fg">{opp.primaryKeyword}</span>
                        </div>
                        <span className="text-sm font-semibold text-fg block">{opp.suggestedTitle}</span>
                        <p className="caption text-xs text-muted">{opp.reasonForRecommendation}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 font-bold text-fg justify-end">
                          <Sparkles size={13} className="text-amber-500" />
                          <span>{opp.opportunityScore}</span>
                        </div>
                        <span className="caption text-[11px] text-muted">{opp.evidence.searchDemandVolume.toLocaleString()} /mo</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="caption font-medium text-fg block">Page Title / Topic</label>
                <Input
                  placeholder="e.g. Organic Ceramide Face Balm for Winter Barrier Repair"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="caption font-medium text-fg block">Page Type</label>
                <SelectDropdown
                  value={pageType}
                  onChange={(e) => setPageType(e.target.value as PageType)}
                  options={ALL_PAGE_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </div>

              <div className="space-y-1">
                <label className="caption font-medium text-fg block">Primary Purpose & Conversion Goal</label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="field text-xs resize-none"
                  placeholder="What is this page intended to achieve? Who is the target reader?"
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* STEP 2: KEYWORDS & SEARCH INTENT */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="h2">Target Keywords & Search Intent</h2>
            <p className="caption mt-1">
              Verify the primary keyword and customer query clusters mapped to this page.
            </p>
          </div>

          <Card className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="caption font-medium text-fg block">Primary Target Keyword</label>
              <Input
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="caption font-medium text-fg block">
                Secondary Keywords (Comma Separated)
              </label>
              <Input
                value={secondaryKeywords}
                onChange={(e) => setSecondaryKeywords(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="caption font-medium text-fg block">Target Audience Persona</label>
              <textarea
                rows={3}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="field text-xs resize-none"
              />
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: AI BLUEPRINT */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="h2">AI Content Brief & Blueprint</h2>
            <p className="caption mt-1">
              Guardrails and competitive differentiators applied during generation.
            </p>
          </div>

          <Card className="p-5 space-y-4">
            <div className="rounded-xl border border-line bg-sunken/40 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-fg">
                <Sparkles size={16} className="text-amber-500" />
                <span>Active Brand Safety Guardrails</span>
              </div>
              <p className="caption text-muted">
                Tone: Professional, Authoritative & Empathetic. Strict exclusion of unverified claims (&quot;miracle cure, 100% chemical-free&quot;).
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-fg block">Competitive Benchmark Strategy</span>
              <ul className="list-disc pl-4 space-y-1 text-muted">
                <li>Out-rank generic publisher listicles by providing genuine clinical HRIPT patch-testing trial data.</li>
                <li>Answer conversational questions to maximize citation potential in ChatGPT and Perplexity.</li>
                <li>Embed Schema.org markup directly to capture Google Rich FAQ SERP elements.</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 4: STRUCTURE & SECTIONS */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="h2">Select Page Sections & Structure</h2>
            <p className="caption mt-1">
              Choose the structural components for your page composition.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { id: "hero", label: "Hero Banner with CTA", desc: "Bold value proposition, subheading, and primary action button." },
              { id: "features_grid", label: "Feature & Benefit Grid", desc: "4-column breakdown of botanical purity and skin barrier benefits." },
              { id: "comparison_table", label: "Product & Science Comparison Table", desc: "Head-to-head comparison against synthetic formulations." },
              { id: "faq_accordion", label: "FAQ Accordion with Schema", desc: "Answers to common customer objections and conversational AI questions." },
              { id: "cta_banner", label: "Final Call to Action Banner", desc: "Guaranteed satisfaction conversion closer." },
            ].map((sec) => {
              const checked = includedSections.includes(sec.id);

              return (
                <div
                  key={sec.id}
                  onClick={() => toggleSection(sec.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? "border-fg bg-surface shadow-xs"
                      : "border-line bg-subtle/30 hover:border-line-strong"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-fg block">{sec.label}</span>
                    <p className="caption text-xs text-muted">{sec.desc}</p>
                  </div>

                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      checked ? "bg-fg text-bg border-fg" : "border-line bg-surface"
                    }`}
                  >
                    {checked && <Check size={13} strokeWidth={2.5} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & FINALIZE */}
      {step === 5 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="h2">Page Blueprint Ready</h2>
            <p className="caption mt-1">
              All sections, copy, and SEO metadata have been compiled.
            </p>
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-line">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-fg">
                <FileCheck size={20} strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-base font-semibold text-fg">
                  {selectedOpp?.suggestedTitle || customTitle || "New Custom Landing Page"}
                </span>
                <p className="caption text-xs">
                  {pageType} · {includedSections.length} sections compiled · Target keyword: {primaryKeyword}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-line p-3 space-y-1">
                <span className="caption text-muted">URL Slug</span>
                <span className="font-mono text-fg font-medium block">
                  /solutions/{primaryKeyword.replace(/[^a-z0-9]+/g, "-")}
                </span>
              </div>
              <div className="rounded-xl border border-line p-3 space-y-1">
                <span className="caption text-muted">Schema Markup</span>
                <span className="font-medium text-emerald-500 block">Product & FAQPage JSON-LD</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-line">
        <Button
          variant="outline"
          disabled={step === 1 || generating}
          onClick={() => setStep((s) => s - 1)}
        >
          Previous
        </Button>

        <Button onClick={handleNext} disabled={generating}>
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin mr-1.5" />
              Generating page content with AI...
            </>
          ) : step === 5 ? (
            <>
              <Wand2 size={14} className="mr-1.5" />
              Open in Visual Page Editor
            </>
          ) : (
            <>
              Next step
              <ArrowRight size={14} className="ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

