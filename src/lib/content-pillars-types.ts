/**
 * Content Pillars Data Models & Relationship Architecture
 * VisibilityOS Topical Authority Architecture
 */

import type { Intent, Level } from "./types";
import type { PageType } from "./website-intelligence-types";

/* ------------------------------------------------------------------ */
/* Opportunity & Coverage Status Lifecycle                            */
/* ------------------------------------------------------------------ */

export type CoverageStatus =
  | "identified"
  | "approved"
  | "planned"
  | "in_production"
  | "published"
  | "covered"
  | "not_pursuing";

export interface PillarPillarPage {
  id?: number | string;
  title: string;
  url?: string;
  type: "article" | "page";
  status: "published" | "in_production" | "planned" | "missing";
  primaryKeyword: string;
  wordCount?: number;
  lastUpdated?: string;
}

export interface PillarContentItem {
  id: number | string;
  title: string;
  type: "article" | "page";
  pageType?: PageType | "Article";
  url?: string;
  status: "published" | "scheduled" | "review" | "drafting" | "planned";
  primaryKeyword: string;
  intent: Intent;
  publishedDate?: string;
  clicks28d?: number;
  impressions28d?: number;
  position?: number;
  isPillarPage?: boolean;
}

export interface PillarOpportunityItem {
  id: string;
  title: string;
  targetKeyword: string;
  contentType: "article" | "page";
  suggestedPageType?: PageType | "Guide";
  intent: Intent;
  searchVolume: number;
  difficulty: number;
  priorityScore: number; // 0-100
  status: CoverageStatus;
  coveredByUrl?: string;
  coveredByTitle?: string;
  coverageReason?: string;
  customerQuestion?: string;
}

export interface PillarInternalLink {
  sourceTitle: string;
  sourceUrl: string;
  targetTitle: string;
  targetUrl: string;
  recommendedAnchor: string;
  rationale: string;
  status: "implemented" | "recommended";
}

export interface PillarPerformance {
  clicks28d: number;
  clicksChangePct: number;
  impressions28d: number;
  impressionsChangePct: number;
  ctr: number;
  avgPosition: number;
  rankingKeywordsCount: number;
  top10KeywordsCount: number;
  aiVisibility: {
    mentionRate: number; // percentage (0-100)
    citationsCount: number;
    monitoredQuestionsCount: number;
  };
}

export interface ContentPillar {
  id: number;
  name: string;
  description: string;
  strategicObjective: string;
  targetAudience: string;
  primaryTopic: string;
  pillarPage: PillarPillarPage;
  // Coverage Metrics
  totalOpportunities: number;
  coveredOpportunities: number;
  plannedOpportunities: number;
  inProductionOpportunities: number;
  coveragePercentage: number;
  // Content relations
  contentCount: number;
  publishedCount: number;
  // Performance Summary
  performance: PillarPerformance;
  // Suggested Next Actions
  recommendedActions: {
    id: string;
    action: string;
    impact: Level;
    effort: Level;
    rationale: string;
    href: string;
  }[];
}

/* ------------------------------------------------------------------ */
/* AI Pillar Generator Types                                          */
/* ------------------------------------------------------------------ */

export interface SuggestedPillarDraft {
  id: string;
  name: string;
  description: string;
  strategicObjective: string;
  targetAudience: string;
  suggestedPillarPageTitle: string;
  estimatedSearchDemand: number;
  initialOpportunityTopics: string[];
  relevanceRationale: string;
  approved: boolean;
}

