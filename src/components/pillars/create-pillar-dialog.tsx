"use client";

import { useState } from "react";
import { Badge, Button, Card, PageTabs } from "@/components/ui";
import { Modal, toast } from "@/components/ui-client";
import { Input, SelectDropdown } from "@/components/ui-form";
import {
  SUGGESTED_AI_PILLARS,
} from "@/lib/content-pillars-data";
import type {
  ContentPillar,
  SuggestedPillarDraft,
} from "@/lib/content-pillars-types";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  Layers,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

interface CreatePillarDialogProps {
  open: boolean;
  onClose: () => void;
  onPillarCreated: (newPillar: ContentPillar) => void;
}

export function CreatePillarDialog({
  open,
  onClose,
  onPillarCreated,
}: CreatePillarDialogProps) {
  const [method, setMethod] = useState<"ai" | "manual">("ai");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedPillarDraft[]>(SUGGESTED_AI_PILLARS);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string>(SUGGESTED_AI_PILLARS[0].id);

  // Manual Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [strategicObjective, setStrategicObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [pillarPageTitle, setPillarPageTitle] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");

  if (!open) return null;

  const handleRunAiAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      toast("AI synthesis complete: 3 tailored content pillars generated");
    }, 1000);
  };

  const handleApproveSuggestion = (sug: SuggestedPillarDraft) => {
    const created: ContentPillar = {
      id: Date.now(),
      name: sug.name,
      description: sug.description,
      strategicObjective: sug.strategicObjective,
      targetAudience: sug.targetAudience,
      primaryTopic: sug.name,
      pillarPage: {
        title: sug.suggestedPillarPageTitle,
        type: "article",
        status: "planned",
        primaryKeyword: sug.name.toLowerCase(),
      },
      totalOpportunities: sug.initialOpportunityTopics.length + 4,
      coveredOpportunities: 0,
      plannedOpportunities: sug.initialOpportunityTopics.length,
      inProductionOpportunities: 0,
      coveragePercentage: 15,
      contentCount: 1,
      publishedCount: 0,
      performance: {
        clicks28d: 0,
        clicksChangePct: 0,
        impressions28d: 0,
        impressionsChangePct: 0,
        ctr: 0,
        avgPosition: 0,
        rankingKeywordsCount: 0,
        top10KeywordsCount: 0,
        aiVisibility: {
          mentionRate: 0,
          citationsCount: 0,
          monitoredQuestionsCount: 0,
        },
      },
      recommendedActions: [
        {
          id: "act_init",
          action: `Create primary pillar page for '${sug.suggestedPillarPageTitle}'`,
          impact: "High",
          effort: "High",
          rationale: "Establishes the core topical foundation and canonical URL for this pillar.",
          href: "/articles/new",
        },
      ],
    };

    onPillarCreated(created);
    toast(`Content pillar "${sug.name}" created successfully`);
    onClose();
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created: ContentPillar = {
      id: Date.now(),
      name: name.trim(),
      description: description.trim() || "Strategic subject pillar for brand authority.",
      strategicObjective: strategicObjective.trim() || "Build topical coverage and organic search visibility.",
      targetAudience: targetAudience.trim() || "Target consumers and prospective clients.",
      primaryTopic: name.trim(),
      pillarPage: {
        title: pillarPageTitle.trim() || `The Complete Guide to ${name.trim()}`,
        type: "article",
        status: "planned",
        primaryKeyword: primaryKeyword.trim() || name.trim().toLowerCase(),
      },
      totalOpportunities: 6,
      coveredOpportunities: 0,
      plannedOpportunities: 2,
      inProductionOpportunities: 0,
      coveragePercentage: 0,
      contentCount: 1,
      publishedCount: 0,
      performance: {
        clicks28d: 0,
        clicksChangePct: 0,
        impressions28d: 0,
        impressionsChangePct: 0,
        ctr: 0,
        avgPosition: 0,
        rankingKeywordsCount: 0,
        top10KeywordsCount: 0,
        aiVisibility: {
          mentionRate: 0,
          citationsCount: 0,
          monitoredQuestionsCount: 0,
        },
      },
      recommendedActions: [],
    };

    onPillarCreated(created);
    toast(`Content pillar "${name}" created successfully`);
    onClose();
  };

  const selectedSuggestion = aiSuggestions.find((s) => s.id === selectedSuggestionId) || aiSuggestions[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Content Pillar"
      description="Establish a strategic topical cluster with a designated pillar page and supporting content."
      width={780}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          {method === "ai" ? (
            <Button onClick={() => handleApproveSuggestion(selectedSuggestion)}>
              <Wand2 size={14} className="mr-1.5" />
              Approve & Create Pillar
            </Button>
          ) : (
            <Button type="submit" form="manual-pillar-form">
              <Plus size={14} className="mr-1.5" />
              Create Content Pillar
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Method Selector Tabs */}
        <PageTabs
          size="sm"
          value={method}
          onChange={(v) => setMethod(v as "ai" | "manual")}
          items={[
            { id: "ai", label: "Generate with AI Strategy Synthesis", icon: Sparkles },
            { id: "manual", label: "Create Manually", icon: FileText },
          ]}
          ariaLabel="Pillar creation method"
        />

        {/* Tab Content */}
        {method === "ai" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-subtle/30 p-4 space-y-1 text-xs">
                <span className="font-semibold text-fg block">Autonomous Topical Discovery</span>
                <p className="caption text-muted leading-relaxed">
                  Synthesizes your business profile, products (serums, barrier balms, cleansers), Search Console impressions, and competitor content to recommend strategic pillars with justified search demand.
                </p>
              </div>

              {/* Suggestions Cards Selector */}
              <div className="space-y-2.5">
                {aiSuggestions.map((sug) => {
                  const isSelected = selectedSuggestionId === sug.id;

                  return (
                    <div
                      key={sug.id}
                      onClick={() => setSelectedSuggestionId(sug.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-fg bg-surface shadow-xs ring-1 ring-fg"
                          : "border-line bg-surface hover:border-line-strong hover:bg-subtle/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-fg">{sug.name}</span>
                            <span className="rounded-full bg-sunken px-2 py-0.5 text-[11px] font-medium text-muted">
                              ~{sug.estimatedSearchDemand.toLocaleString()} searches/mo
                            </span>
                          </div>
                          <p className="caption text-xs text-muted">{sug.description}</p>
                          <div className="caption text-xs text-fg font-medium pt-1">
                            Pillar Page: &quot;{sug.suggestedPillarPageTitle}&quot;
                          </div>
                        </div>

                        {isSelected && <Check size={16} strokeWidth={2.5} className="text-fg shrink-0 mt-1" />}
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-line space-y-2 text-xs animate-in fade-in duration-150">
                          <div className="text-muted">
                            <span className="font-semibold text-fg">Strategic Objective: </span>
                            {sug.strategicObjective}
                          </div>
                          <div className="text-muted">
                            <span className="font-semibold text-fg">Why recommended: </span>
                            {sug.relevanceRationale}
                          </div>
                          <div className="pt-1">
                            <span className="font-semibold text-fg block mb-1">
                              Supporting Topics Discovered ({sug.initialOpportunityTopics.length}):
                            </span>
                            <div className="grid gap-1 sm:grid-cols-2">
                              {sug.initialOpportunityTopics.map((top, idx) => (
                                <div key={idx} className="rounded bg-sunken px-2 py-1 text-[11px] text-muted truncate">
                                  • {top}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form id="manual-pillar-form" onSubmit={handleCreateManual} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="caption font-medium text-fg block">Content Pillar Name *</label>
                <Input
                  required
                  placeholder="e.g. Certified Organic Skincare"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="caption font-medium text-fg block">Strategic Objective</label>
                <textarea
                  rows={2}
                  className="field text-xs resize-none"
                  placeholder="What business and search authority goal does this pillar achieve?"
                  value={strategicObjective}
                  onChange={(e) => setStrategicObjective(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="caption font-medium text-fg block">Target Audience</label>
                  <Input
                    placeholder="e.g. Sensitive & reactive skin shoppers"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="caption font-medium text-fg block">Primary Target Keyword</label>
                  <Input
                    placeholder="e.g. organic skincare"
                    value={primaryKeyword}
                    onChange={(e) => setPrimaryKeyword(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="caption font-medium text-fg block">Primary Pillar Page Title</label>
                <Input
                  placeholder="e.g. The Complete Guide to Organic Skincare"
                  value={pillarPageTitle}
                  onChange={(e) => setPillarPageTitle(e.target.value)}
                />
                <span className="caption text-[11px] text-muted block mt-0.5">
                  The flagship canonical page that anchors all supporting articles and category pages.
                </span>
              </div>

              <div className="space-y-1">
                <label className="caption font-medium text-fg block">Description</label>
                <textarea
                  rows={2}
                  className="field text-xs resize-none"
                  placeholder="Brief summary of what this strategic subject encompasses..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </form>
          )}
        </div>
    </Modal>
  );
}

