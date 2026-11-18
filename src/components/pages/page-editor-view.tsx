"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, PageTabs } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { Input, SelectDropdown } from "@/components/ui-form";
import {
  ALL_PAGE_TYPES,
  type PageDocument,
  type PageSectionItem,
  type PageSectionType,
  type PageType,
} from "@/lib/website-intelligence-types";
import { PagePublishDialog } from "./page-publish-dialog";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Laptop,
  Maximize2,
  MessageSquare,
  Minus,
  MoveDown,
  MoveUp,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Wand2,
} from "lucide-react";

interface PageEditorViewProps {
  initialDocument: PageDocument;
  onSave?: (doc: PageDocument) => void;
}

export function PageEditorView({ initialDocument, onSave }: PageEditorViewProps) {
  const [doc, setDoc] = useState<PageDocument>(initialDocument);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    initialDocument.sections[0]?.id || ""
  );
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [rightPanelTab, setRightPanelTab] = useState<"seo" | "ai">("seo");
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Section Management
  const addSection = (type: PageSectionType) => {
    const newId = `sec_${Date.now()}`;
    let newSection: PageSectionItem;

    switch (type) {
      case "hero":
        newSection = {
          id: newId,
          type: "hero",
          heading: "Catchy Value Proposition Hero",
          subheading: "Supporting headline reinforcing proof and trust.",
          body: "Describe the primary breakthrough of your botanical or product formulation.",
          ctaLabel: "Shop Collection",
          ctaUrl: "/collections/serums",
        };
        break;
      case "features_grid":
        newSection = {
          id: newId,
          type: "features_grid",
          heading: "Key Differentiators & Benefits",
          subheading: "Why choosing plant bio-compatibility transforms skin health.",
          body: "A clean overview of features engineered for maximum biological uptake.",
          bullets: [
            "Cold-Pressed Seed Oils",
            "Zero Artificial Fragrance",
            "Dermatologically Tested",
            "Sustainably Packaged",
          ],
        };
        break;
      case "comparison_table":
        newSection = {
          id: newId,
          type: "comparison_table",
          heading: "Scientific Formulation Comparison",
          subheading: "Verdant Botanics vs Conventional Formulations",
          body: "Direct evidence comparing purity, active lipid source, and irritation rates.",
          tableRows: [
            { feature: "Active Lipids", yourBrand: "Certified Phyto-Ceramides", competitors: "Synthetic Petroleum" },
            { feature: "Fragrance", yourBrand: "100% Fragrance-Free", competitors: "Synthetic Parfum" },
          ],
        };
        break;
      case "faq_accordion":
        newSection = {
          id: newId,
          type: "faq_accordion",
          heading: "Frequently Asked Questions",
          subheading: "Clear answers to address hesitation and objection.",
          body: "Learn how to use, pair, and store our botanical formulations.",
          faqItems: [
            { question: "Is this suitable for rosacea?", answer: "Yes, clinically patch tested on reactive complexions." },
            { question: "How long until I see results?", answer: "Most users notice calmer skin within 72 hours." },
          ],
        };
        break;
      case "cta_banner":
        newSection = {
          id: newId,
          type: "cta_banner",
          heading: "Experience Calmer Skin in 7 Days",
          body: "Join thousands of customers who made the switch to clean, botanical science.",
          ctaLabel: "Shop With 30-Day Guarantee",
          ctaUrl: "/collections/serums",
        };
        break;
      default:
        newSection = {
          id: newId,
          type: "rich_content",
          heading: "Educational Overview",
          body: "In-depth explanation and clinical context for this product or solution.",
        };
    }

    setDoc((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setActiveSectionId(newId);
    toast("New section added to page layout");
  };

  const removeSection = (id: string) => {
    if (doc.sections.length <= 1) {
      toast("Page must retain at least one section");
      return;
    }
    setDoc((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
    toast("Section removed");
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= doc.sections.length) return;

    const updated = [...doc.sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);

    setDoc((prev) => ({ ...prev, sections: updated }));
  };

  const updateSection = (id: string, updates: Partial<PageSectionItem>) => {
    setDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const activeSection = doc.sections.find((s) => s.id === activeSectionId) || doc.sections[0];

  // AI Prompt Assistance
  const runAiPrompt = (promptLabel: string) => {
    setAiGenerating(true);
    setTimeout(() => {
      setAiGenerating(false);

      if (promptLabel.includes("FAQ")) {
        updateSection(activeSection.id, {
          faqItems: [
            ...(activeSection.faqItems || []),
            {
              question: "Can I use this product in the morning under makeup?",
              answer: "Yes, our lightweight formula absorbs within 60 seconds and creates a smooth, silicone-free canvas.",
            },
            {
              question: "Are your certifications verified by independent bodies?",
              answer: "Yes, all our ingredients are certified organic by COSMOS and the Soil Association.",
            },
          ],
        });
        toast("Generated 2 new high-converting FAQs");
      } else if (promptLabel.includes("Rewrite")) {
        updateSection(activeSection.id, {
          heading: "Clinically Validated Botanical Science for Reactive Skin",
          subheading: "Zero compromise between gentle purity and visible anti-aging efficacy.",
        });
        toast("Rewritten heading for higher conversion");
      } else {
        toast(`AI completed: ${promptLabel}`);
      }
    }, 700);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      {/* Top Navigation & Status Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/pages"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-fg"
            title="Back to Pages inventory"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Link>

          <div className="h-4 w-px bg-line" />

          <input
            value={doc.title}
            onChange={(e) => setDoc({ ...doc, title: e.target.value })}
            className="text-sm font-semibold text-fg bg-transparent border-0 outline-none hover:bg-subtle/50 px-2 py-1 rounded max-w-sm truncate"
          />

          <Badge tone="info" className="text-xs shrink-0">
            {doc.pageType}
          </Badge>

          <span className="caption text-xs hidden md:inline text-muted">
            All changes saved locally
          </span>
        </div>

        {/* Device Viewport Switcher */}
        <div className="hidden sm:flex items-center rounded-lg border border-line bg-sunken/60 p-0.5">
          <button
            type="button"
            onClick={() => setDeviceView("desktop")}
            className={`p-1.5 rounded-md transition-colors ${
              deviceView === "desktop" ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg"
            }`}
            title="Desktop preview (100%)"
          >
            <Laptop size={15} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => setDeviceView("tablet")}
            className={`p-1.5 rounded-md transition-colors ${
              deviceView === "tablet" ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg"
            }`}
            title="Tablet preview (768px)"
          >
            <Tablet size={15} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => setDeviceView("mobile")}
            className={`p-1.5 rounded-md transition-colors ${
              deviceView === "mobile" ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg"
            }`}
            title="Mobile preview (375px)"
          >
            <Smartphone size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast("Page draft saved to database")}
          >
            Save draft
          </Button>

          <Button size="sm" onClick={() => setIsPublishDialogOpen(true)}>
            <Send size={14} strokeWidth={1.5} className="mr-1.5 shrink-0" />
            Publish to CMS
          </Button>
        </div>
      </header>

      {/* Main 3-Panel Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* PANEL 1: LEFT — Structure, Sections & Hierarchy */}
        <aside className="w-64 shrink-0 border-r border-line bg-subtle/40 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between p-3.5 border-b border-line">
            <span className="caption text-xs font-semibold uppercase tracking-wider text-muted">
              Page Composition ({doc.sections.length})
            </span>
          </div>

          {/* Section Tree List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {doc.sections.map((section, idx) => {
              const isSelected = activeSectionId === section.id;

              return (
                <div
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-surface text-fg shadow-xs border border-line"
                      : "text-muted hover:bg-surface/60 hover:text-fg"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-muted">{idx + 1}</span>
                    <span className="truncate">{section.heading || section.type}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(idx, "up");
                      }}
                      className="p-1 text-muted hover:text-fg disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === doc.sections.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(idx, "down");
                      }}
                      className="p-1 text-muted hover:text-fg disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSection(section.id);
                      }}
                      className="p-1 text-muted hover:text-danger"
                      title="Delete section"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Section Templates Drawer */}
          <div className="p-3 border-t border-line space-y-2 bg-surface">
            <span className="caption text-[11px] font-semibold text-muted block">
              Add Section Template
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => addSection("hero")}
                className="rounded-lg border border-line p-1.5 text-left hover:bg-subtle text-fg"
              >
                + Hero Banner
              </button>
              <button
                type="button"
                onClick={() => addSection("features_grid")}
                className="rounded-lg border border-line p-1.5 text-left hover:bg-subtle text-fg"
              >
                + Feature Grid
              </button>
              <button
                type="button"
                onClick={() => addSection("comparison_table")}
                className="rounded-lg border border-line p-1.5 text-left hover:bg-subtle text-fg"
              >
                + Comparison
              </button>
              <button
                type="button"
                onClick={() => addSection("faq_accordion")}
                className="rounded-lg border border-line p-1.5 text-left hover:bg-subtle text-fg"
              >
                + FAQ Accordion
              </button>
              <button
                type="button"
                onClick={() => addSection("cta_banner")}
                className="rounded-lg border border-line p-1.5 text-left hover:bg-subtle text-fg"
              >
                + CTA Banner
              </button>
              <button
                type="button"
                onClick={() => addSection("rich_content")}
                className="rounded-lg border border-line p-1.5 text-left hover:bg-subtle text-fg"
              >
                + Rich Content
              </button>
            </div>
          </div>
        </aside>

        {/* PANEL 2: CENTRE — WYSIWYG Page Canvas & Inline Preview */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-sunken/40 flex justify-center p-6">
          <div
            className={`w-full transition-all duration-200 ${
              deviceView === "desktop"
                ? "max-w-4xl"
                : deviceView === "tablet"
                ? "max-w-2xl"
                : "max-w-sm"
            }`}
          >
            {/* Page Header / Meta Breadcrumb Preview */}
            <div className="mb-4 text-xs font-mono text-muted flex items-center gap-1.5">
              <span>https://verdantbotanics.com/</span>
              <span className="text-fg font-semibold">{doc.seo.slug || "new-page"}</span>
            </div>

            {/* Rendered Sections Container */}
            <div className="space-y-6 rounded-2xl border border-line bg-surface p-8 shadow-sm">
              {doc.sections.map((section) => {
                const isSelected = activeSectionId === section.id;

                return (
                  <div
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`rounded-xl p-6 transition-all relative ${
                      isSelected
                        ? "ring-2 ring-fg/80 bg-subtle/20"
                        : "hover:bg-subtle/10 border border-transparent hover:border-line"
                    }`}
                  >
                    {/* Section Type Chip */}
                    <span className="caption absolute top-2 right-2 text-[10px] font-mono text-muted uppercase">
                      {section.type.replace("_", " ")}
                    </span>

                    {/* HERO SECTION */}
                    {section.type === "hero" && (
                      <div className="space-y-4 py-4 text-center">
                        <input
                          value={section.heading}
                          onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                          className="w-full text-2xl md:text-3xl font-bold text-fg bg-transparent border-0 text-center focus:outline-none focus:ring-1 focus:ring-fg rounded"
                          placeholder="Hero Heading..."
                        />
                        <input
                          value={section.subheading || ""}
                          onChange={(e) => updateSection(section.id, { subheading: e.target.value })}
                          className="w-full text-sm md:text-base text-muted bg-transparent border-0 text-center focus:outline-none focus:ring-1 focus:ring-fg rounded"
                          placeholder="Supporting Subheading..."
                        />
                        <textarea
                          rows={2}
                          value={section.body}
                          onChange={(e) => updateSection(section.id, { body: e.target.value })}
                          className="w-full text-xs text-muted bg-transparent border-0 text-center focus:outline-none focus:ring-1 focus:ring-fg rounded resize-none"
                        />
                        <div className="flex justify-center gap-3 pt-2">
                          <input
                            value={section.ctaLabel || "Shop Collection"}
                            onChange={(e) => updateSection(section.id, { ctaLabel: e.target.value })}
                            className="rounded-xl bg-fg px-4 py-2 text-xs font-semibold text-bg text-center max-w-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* FEATURES GRID SECTION */}
                    {section.type === "features_grid" && (
                      <div className="space-y-4 py-2">
                        <div>
                          <input
                            value={section.heading}
                            onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                            className="w-full text-xl font-bold text-fg bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-fg rounded"
                          />
                          <p className="caption text-xs text-muted mt-1">{section.body}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 pt-2">
                          {(section.bullets || []).map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2 rounded-lg border border-line bg-surface p-3 text-xs text-fg">
                              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                              <span className="font-medium">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* COMPARISON TABLE SECTION */}
                    {section.type === "comparison_table" && (
                      <div className="space-y-4 py-2">
                        <div>
                          <input
                            value={section.heading}
                            onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                            className="w-full text-xl font-bold text-fg bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-fg rounded"
                          />
                          <p className="caption text-xs text-muted mt-1">{section.subheading}</p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-line">
                          <table className="w-full text-xs">
                            <thead className="bg-sunken text-muted">
                              <tr>
                                <th className="p-2.5 text-left">Feature</th>
                                <th className="p-2.5 text-left font-bold text-fg">Verdant Botanics</th>
                                <th className="p-2.5 text-left">Conventional Brands</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {(section.tableRows || []).map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-subtle/40">
                                  <td className="p-2.5 font-medium text-fg">{row.feature}</td>
                                  <td className="p-2.5 text-emerald-600 font-medium">{row.yourBrand}</td>
                                  <td className="p-2.5 text-muted">{row.competitors}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* FAQ ACCORDION SECTION */}
                    {section.type === "faq_accordion" && (
                      <div className="space-y-4 py-2">
                        <div>
                          <input
                            value={section.heading}
                            onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                            className="w-full text-xl font-bold text-fg bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-fg rounded"
                          />
                          <p className="caption text-xs text-muted mt-1">{section.subheading}</p>
                        </div>

                        <div className="space-y-2 pt-2">
                          {(section.faqItems || []).map((item, fIdx) => (
                            <div key={fIdx} className="rounded-xl border border-line p-3 text-xs space-y-1">
                              <span className="font-semibold text-fg block">Q: {item.question}</span>
                              <p className="text-muted leading-relaxed">A: {item.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA BANNER SECTION */}
                    {section.type === "cta_banner" && (
                      <div className="rounded-xl bg-sunken p-6 text-center space-y-3">
                        <input
                          value={section.heading}
                          onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                          className="w-full text-xl font-bold text-fg bg-transparent border-0 text-center focus:outline-none"
                        />
                        <p className="caption text-xs text-muted">{section.body}</p>
                        <div className="pt-2">
                          <button className="rounded-xl bg-fg px-5 py-2 text-xs font-semibold text-bg">
                            {section.ctaLabel}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* RICH CONTENT SECTION */}
                    {section.type === "rich_content" && (
                      <div className="space-y-2 py-2">
                        <input
                          value={section.heading}
                          onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                          className="w-full text-xl font-bold text-fg bg-transparent border-0 focus:outline-none"
                        />
                        <textarea
                          rows={4}
                          value={section.body}
                          onChange={(e) => updateSection(section.id, { body: e.target.value })}
                          className="w-full text-xs text-muted bg-transparent border-0 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* PANEL 3: RIGHT — SEO Configuration & Contextual AI Assistant */}
        <aside className="w-80 shrink-0 border-l border-line bg-surface flex flex-col min-h-0 overflow-hidden">
          {/* Right Panel Tabs */}
          <div className="px-3 bg-surface">
            <PageTabs
              size="sm"
              value={rightPanelTab}
              onChange={(v) => setRightPanelTab(v as "seo" | "ai")}
              items={[
                { id: "seo", label: "SEO Directives" },
                { id: "ai", label: "AI Assistant", icon: Sparkles },
              ]}
              ariaLabel="Page editor tool panels"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* TAB: SEO DIRECTIVES & SCHEMA */}
            {rightPanelTab === "seo" && (
              <div className="space-y-4 text-xs">
                {/* Google SERP Snippet Preview */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-fg block">Google SERP Snippet Preview</span>
                  <div className="rounded-xl border border-line bg-surface p-3 space-y-1 font-sans">
                    <span className="caption text-[11px] text-muted block truncate font-mono">
                      https://verdantbotanics.com/{doc.seo.slug}
                    </span>
                    <span className="text-blue-600 font-medium text-sm block truncate hover:underline cursor-pointer">
                      {doc.seo.seoTitle || doc.title}
                    </span>
                    <p className="caption text-[11px] text-muted line-clamp-2">
                      {doc.seo.metaDescription}
                    </p>
                  </div>
                </div>

                {/* SEO Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="caption font-medium text-fg block mb-1">URL Slug</label>
                    <Input
                      value={doc.seo.slug}
                      onChange={(e) =>
                        setDoc({ ...doc, seo: { ...doc.seo, slug: e.target.value } })
                      }
                      className="font-mono text-xs !h-8"
                    />
                  </div>

                  <div>
                    <label className="caption font-medium text-fg block mb-1">SEO Title</label>
                    <Input
                      value={doc.seo.seoTitle}
                      onChange={(e) =>
                        setDoc({ ...doc, seo: { ...doc.seo, seoTitle: e.target.value } })
                      }
                      className="text-xs !h-8"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="caption font-medium text-fg block">Meta Description</label>
                      <span className="caption text-[10px] text-muted">
                        {doc.seo.metaDescription.length} / 160
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={doc.seo.metaDescription}
                      onChange={(e) =>
                        setDoc({ ...doc, seo: { ...doc.seo, metaDescription: e.target.value } })
                      }
                      className="field text-xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="caption font-medium text-fg block mb-1">Structured Data Schema</label>
                    <SelectDropdown
                      value={doc.seo.structuredDataType}
                      onChange={(e) =>
                        setDoc({
                          ...doc,
                          seo: {
                            ...doc.seo,
                            structuredDataType: e.target.value as PageDocument["seo"]["structuredDataType"],
                          },
                        })
                      }
                      className="!h-8 text-xs py-1"
                      options={[
                        { value: "Product", label: "Product Schema (Price, Reviews, Stock)" },
                        { value: "FAQPage", label: "FAQPage Schema (Rich Google SERP snippet)" },
                        { value: "Service", label: "Service Schema (Consultation, Booking)" },
                        { value: "Organization", label: "Organization Schema" },
                        { value: "Article", label: "Article Schema" },
                        { value: "None", label: "None (Standard HTML)" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AI ASSISTANT */}
            {rightPanelTab === "ai" && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-line bg-sunken/50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-fg">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Contextual Page Generator</span>
                  </div>
                  <p className="caption text-[11px] text-muted">
                    Conditioned on Verdant Botanics brand knowledge, sensitive skin guardrails, and target keyword: <span className="font-mono text-fg">{doc.primaryKeyword}</span>.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="caption font-semibold text-fg block">Active Section Actions</span>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      disabled={aiGenerating}
                      onClick={() => runAiPrompt("Rewrite heading for higher conversion")}
                      className="w-full text-left rounded-lg border border-line p-2 hover:bg-subtle text-fg font-medium flex items-center justify-between"
                    >
                      <span>Rewrite heading for higher conversion</span>
                      <Wand2 size={13} className="text-muted" />
                    </button>

                    <button
                      type="button"
                      disabled={aiGenerating}
                      onClick={() => runAiPrompt("Suggest 3 relevant customer FAQs")}
                      className="w-full text-left rounded-lg border border-line p-2 hover:bg-subtle text-fg font-medium flex items-center justify-between"
                    >
                      <span>Suggest 2 customer objection FAQs</span>
                      <MessageSquare size={13} className="text-muted" />
                    </button>

                    <button
                      type="button"
                      disabled={aiGenerating}
                      onClick={() => runAiPrompt("Strengthen value proposition copy")}
                      className="w-full text-left rounded-lg border border-line p-2 hover:bg-subtle text-fg font-medium flex items-center justify-between"
                    >
                      <span>Strengthen clinical proof statements</span>
                      <CheckCircle2 size={13} className="text-muted" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Publish to CMS Dialog */}
      <PagePublishDialog
        open={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        page={doc}
        onSuccess={() => {
          setIsPublishDialogOpen(false);
          toast("Publication record registered in publishing queue");
        }}
      />
    </div>
  );
}

