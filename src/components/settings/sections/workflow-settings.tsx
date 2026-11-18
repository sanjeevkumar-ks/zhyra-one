"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { Toggle, toast } from "@/components/ui-client";
import { SelectDropdown } from "@/components/ui-form";
import {
  ArrowDown,
  CheckCircle2,
  FileCheck,
  GitCommit,
  GripVertical,
  Lock,
  ShieldAlert,
} from "lucide-react";

interface WorkflowStage {
  id: string;
  order: number;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  assigneeRole: string;
  category: "pre-pub" | "post-pub";
}

const DEFAULT_STAGES: WorkflowStage[] = [
  {
    id: "opportunity",
    order: 1,
    name: "1. Topic & Opportunity",
    description: "Keyword selection, search intent validation, and opportunity scoring.",
    required: true,
    enabled: true,
    assigneeRole: "SEO Lead / Editor",
    category: "pre-pub",
  },
  {
    id: "brief",
    order: 2,
    name: "2. Content Brief",
    description: "Structure outline, heading hierarchy, target keywords, and competitive angles.",
    required: true,
    enabled: true,
    assigneeRole: "Editor",
    category: "pre-pub",
  },
  {
    id: "drafting",
    order: 3,
    name: "3. Drafting & AI Generation",
    description: "Body writing, section generation, and brand tone application.",
    required: true,
    enabled: true,
    assigneeRole: "Editor / AI Engine",
    category: "pre-pub",
  },
  {
    id: "editorial_review",
    order: 4,
    name: "4. Editorial Review",
    description: "Human refinement, narrative cohesion, readability, and hook optimization.",
    required: true,
    enabled: true,
    assigneeRole: "Lead Reviewer",
    category: "pre-pub",
  },
  {
    id: "seo_fact_check",
    order: 5,
    name: "5. SEO & Fact Validation",
    description: "Verification of external citations, stat checks, and schema markup accuracy.",
    required: false,
    enabled: true,
    assigneeRole: "Reviewer",
    category: "pre-pub",
  },
  {
    id: "compliance_approval",
    order: 6,
    name: "6. Legal & Compliance Gate",
    description: "Strict audit against prohibited claims, medical advice, and brand disclaimers.",
    required: false,
    enabled: true,
    assigneeRole: "Compliance Officer",
    category: "pre-pub",
  },
  {
    id: "scheduled",
    order: 7,
    name: "7. Scheduled for Queue",
    description: "Staged in the multi-channel distribution queue awaiting target launch time.",
    required: true,
    enabled: true,
    assigneeRole: "Automated",
    category: "pre-pub",
  },
  {
    id: "published",
    order: 8,
    name: "8. Live Publication",
    description: "Dispatched to WordPress, Shopify, Webflow, and social distribution channels.",
    required: true,
    enabled: true,
    assigneeRole: "Automated Dispatch",
    category: "pre-pub",
  },
  {
    id: "monitoring",
    order: 9,
    name: "9. Performance & Index Monitoring",
    description: "Tracks indexation status, ranking position velocity, and AI engine citations.",
    required: false,
    enabled: true,
    assigneeRole: "Automated Monitor",
    category: "post-pub",
  },
  {
    id: "refresh",
    order: 10,
    name: "10. Historical Decay Refresh",
    description: "Flags articles with decaying impressions for automatic content updating.",
    required: false,
    enabled: true,
    assigneeRole: "Editor",
    category: "post-pub",
  },
];

export function WorkflowSettings() {
  const [stages, setStages] = useState<WorkflowStage[]>(DEFAULT_STAGES);
  const [requireApprovalGate, setRequireApprovalGate] = useState(true);
  const [autoAdvanceOnApprove, setAutoAdvanceOnApprove] = useState(false);

  const toggleStage = (id: string) => {
    setStages(
      stages.map((st) =>
        st.id === id && !st.required ? { ...st, enabled: !st.enabled } : st
      )
    );
  };

  const updateRole = (id: string, role: string) => {
    setStages(
      stages.map((st) => (st.id === id ? { ...st, assigneeRole: role } : st))
    );
  };

  const handleSave = () => {
    toast("Editorial workflow pipeline updated successfully");
  };

  const prePubStages = stages.filter((s) => s.category === "pre-pub");
  const postPubStages = stages.filter((s) => s.category === "post-pub");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="h2">Content Editorial Workflow</h2>
          <p className="caption mt-1">
            Configure editorial pipeline gates, reviewer assignments, and compliance approvals.
          </p>
        </div>
        <Button onClick={handleSave}>Save pipeline</Button>
      </div>

      {/* Governance & Approval Gate Rule */}
      <Card className="p-6 space-y-4">
        <div>
          <span className="text-base font-semibold text-fg">Approval Guardrails</span>
          <p className="caption mt-0.5">Enforce mandatory sign-offs before content is allowed into the publishing queue.</p>
        </div>

        <div className="divide-y divide-line">
          <div className="flex items-center justify-between py-3">
            <div className="pr-4">
              <span className="text-sm font-medium text-fg">Enforce Mandatory Reviewer Sign-Off</span>
              <p className="caption text-xs mt-0.5">
                Content cannot enter “Scheduled” or be published to live CMS channels without an explicit approval sign-off.
              </p>
            </div>
            <Toggle
              label="Enforce Mandatory Reviewer Sign-Off"
              checked={requireApprovalGate}
              onChange={setRequireApprovalGate}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="pr-4">
              <span className="text-sm font-medium text-fg">Auto-Advance on Final Approval</span>
              <p className="caption text-xs mt-0.5">
                Automatically transition approved drafts straight into the next available publication queue slot.
              </p>
            </div>
            <Toggle
              label="Auto-Advance on Final Approval"
              checked={autoAdvanceOnApprove}
              onChange={setAutoAdvanceOnApprove}
            />
          </div>
        </div>
      </Card>

      {/* Pre-Publishing Stages */}
      <div className="space-y-4">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-muted">
            EDITORIAL & PUBLISHING PIPELINE ({prePubStages.filter((s) => s.enabled).length} ACTIVE STAGES)
          </span>
          <p className="caption mt-0.5">
            Sequential stages from topic validation to live CMS dispatch.
          </p>
        </div>

        <div className="space-y-3">
          {prePubStages.map((stage) => (
            <Card
              key={stage.id}
              className={`p-4 transition-all ${
                stage.enabled ? "bg-surface" : "bg-sunken/40 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-fg text-xs font-mono font-semibold">
                    {stage.order}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fg">{stage.name}</span>
                      {stage.required ? (
                        <span className="inline-flex items-center gap-1 rounded bg-sunken px-2 py-0.5 text-[11px] font-medium text-muted">
                          <Lock size={12} strokeWidth={1.5} />
                          Required
                        </span>
                      ) : (
                        <span className="rounded bg-sunken px-2 py-0.5 text-[11px] font-medium text-muted">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="caption text-xs mt-1">{stage.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="w-44">
                    <SelectDropdown
                      value={stage.assigneeRole}
                      onChange={(e) => updateRole(stage.id, e.target.value)}
                      disabled={!stage.enabled}
                      className="h-8 text-xs py-1"
                      options={[
                        { value: "Editor", label: "Editor" },
                        { value: "Lead Reviewer", label: "Lead Reviewer" },
                        { value: "Compliance Officer", label: "Compliance Officer" },
                        { value: "SEO Lead / Editor", label: "SEO Lead / Editor" },
                        { value: "Editor / AI Engine", label: "Editor / AI Engine" },
                        { value: "Automated", label: "Automated System" },
                        { value: "Automated Dispatch", label: "Automated Dispatch" },
                      ]}
                    />
                  </div>

                  {!stage.required ? (
                    <Toggle
                      label={`Enable ${stage.name}`}
                      checked={stage.enabled}
                      onChange={() => toggleStage(stage.id)}
                    />
                  ) : (
                    <div className="w-10 flex justify-center text-emerald-500">
                      <CheckCircle2 size={18} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Post-Publishing Stages */}
      <div className="space-y-4">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-muted">
            POST-PUBLICATION LIFECYCLE ({postPubStages.filter((s) => s.enabled).length} ACTIVE STAGES)
          </span>
          <p className="caption mt-0.5">
            Automated monitoring and historical decay mitigation after content goes live.
          </p>
        </div>

        <div className="space-y-3">
          {postPubStages.map((stage) => (
            <Card
              key={stage.id}
              className={`p-4 transition-all ${
                stage.enabled ? "bg-surface" : "bg-sunken/40 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-fg text-xs font-mono font-semibold">
                    {stage.order}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fg">{stage.name}</span>
                      <span className="rounded bg-sunken px-2 py-0.5 text-[11px] font-medium text-muted">
                        Lifecycle
                      </span>
                    </div>
                    <p className="caption text-xs mt-1">{stage.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="w-44">
                    <SelectDropdown
                      value={stage.assigneeRole}
                      onChange={(e) => updateRole(stage.id, e.target.value)}
                      disabled={!stage.enabled}
                      className="h-8 text-xs py-1"
                      options={[
                        { value: "Automated Monitor", label: "Automated Monitor" },
                        { value: "Editor", label: "Editor" },
                        { value: "Lead Reviewer", label: "Lead Reviewer" },
                      ]}
                    />
                  </div>

                  <Toggle
                    label={`Enable ${stage.name}`}
                    checked={stage.enabled}
                    onChange={() => toggleStage(stage.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

