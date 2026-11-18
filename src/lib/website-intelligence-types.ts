/**
 * Website Intelligence and Page Opportunity Discovery Data Models
 * VisibilityOS System Architecture
 */

import type { Intent, Level } from "./types";

/* ------------------------------------------------------------------ */
/* Page Classification & Discovery Types                              */
/* ------------------------------------------------------------------ */

export type PageType =
  | "Homepage"
  | "About"
  | "Contact"
  | "Product"
  | "Product Category"
  | "Service"
  | "Solution"
  | "Use-case"
  | "Comparison"
  | "Location"
  | "Resource"
  | "FAQ"
  | "Blog article"
  | "Other";

export const ALL_PAGE_TYPES: PageType[] = [
  "Homepage",
  "Product Category",
  "Product",
  "Service",
  "Solution",
  "Use-case",
  "Comparison",
  "Location",
  "Resource",
  "FAQ",
  "Blog article",
  "About",
  "Contact",
  "Other",
];

export type IndexingStatus =
  | "Indexable"
  | "Noindex"
  | "Canonicalized"
  | "404 Error"
  | "Blocked by robots.txt";

export type CrawlSource =
  | "sitemap"
  | "navigation"
  | "internal_links"
  | "canonical"
  | "gsc"
  | "cms_api";

export interface CrawlIssue {
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation: string;
}

/* ------------------------------------------------------------------ */
/* Website Page Entity                                                */
/* ------------------------------------------------------------------ */

export interface HeadingsHierarchy {
  h1: string;
  h2s: string[];
  h3s: string[];
}

export interface InternalLinkItem {
  url: string;
  anchorText: string;
  contextSentence?: string;
}

export interface StructuredDataItem {
  type: string; // e.g. "Product", "FAQPage", "BreadcrumbList", "Organization", "Article"
  valid: boolean;
  propertiesSummary: string;
}

export interface PagePerformanceData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  sessionsGa4?: number;
  trend: "up" | "down" | "flat";
}

export interface AiVisibilityAssociation {
  citedInQuestions: number;
  brandMentionRate: number; // percentage (0-100)
  platforms: ("ChatGPT" | "Claude" | "Perplexity" | "Gemini" | "Google AI Overviews")[];
  exampleQuery?: string;
}

export interface WebsitePage {
  id: string;
  url: string;
  slug: string;
  title: string;
  metaDescription: string;
  headings: HeadingsHierarchy;
  contentPreview: string;
  wordCount: number;
  pageType: PageType;
  userOverriddenType?: PageType;
  primaryTopic: string;
  topicGroupId?: number;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: Intent;
  canonicalUrl: string;
  isCanonical: boolean;
  indexingStatus: IndexingStatus;
  structuredData: StructuredDataItem[];
  incomingLinks: InternalLinkItem[];
  outgoingLinks: InternalLinkItem[];
  performance: PagePerformanceData;
  aiVisibility: AiVisibilityAssociation;
  issues: CrawlIssue[];
  lastCrawledAt: string;
  discoveredVia: CrawlSource;
  status: "live" | "draft" | "redirected" | "archived";
}

/* ------------------------------------------------------------------ */
/* Website & Crawl Snapshot Entities                                 */
/* ------------------------------------------------------------------ */

export interface WebsiteCrawl {
  id: string;
  websiteId: string;
  startedAt: string;
  completedAt?: string;
  status: "pending" | "discovering" | "crawling" | "classifying" | "completed" | "failed";
  progressPercent: number;
  currentStage: string;
  pagesDiscovered: number;
  pagesCrawled: number;
  sourcesUsed: CrawlSource[];
  issuesFoundCount: number;
  robotsTxtStatus: "allowed" | "restricted" | "not_found";
}

export interface PageSnapshot {
  id: string;
  pageId: string;
  snapshotDate: string;
  title: string;
  metaDescription: string;
  wordCount: number;
  clicks: number;
  impressions: number;
  position: number;
}

/* ------------------------------------------------------------------ */
/* Page Opportunity Discovery Types                                   */
/* ------------------------------------------------------------------ */

export type OpportunityActionType = "CREATE" | "IMPROVE" | "CONSOLIDATE";

export interface OpportunityEvidence {
  searchDemandVolume: number;
  monthlyTrendPct: number;
  cpcUsd: number;
  competitorsRanking: { name: string; url: string; position: number }[];
  customerQuestions: string[];
  gscQueryMatches?: { query: string; impressions: number; currentAvgPosition: number }[];
  cannibalizationRiskUrl?: string;
}

export interface InternalLinkRecommendation {
  sourceUrl: string;
  sourceTitle: string;
  recommendedAnchor: string;
  placementLocation: string;
  rationale: string;
}

export interface PageOpportunity {
  id: string;
  suggestedTitle: string;
  recommendedPageType: PageType;
  targetSearchIntent: Intent;
  primaryKeyword: string;
  relatedKeywords: string[];
  relatedCustomerQuestions: string[];
  businessRelevance: string;
  evidence: OpportunityEvidence;
  existingPageOverlap: {
    url: string;
    overlapDegree: "Low" | "Medium" | "High";
    note: string;
  }[];
  recommendedInternalLinks: InternalLinkRecommendation[];
  reasonForRecommendation: string;
  confidenceLevel: "High" | "Medium" | "Low";
  estimatedCreationEffort: "Quick (1-2 hrs)" | "Moderate (3-5 hrs)" | "In-depth (1-2 days)";
  opportunityScore: number; // 0-100 explainable score
  scoreBreakdown: {
    demandScore: number; // 0-30
    relevanceScore: number; // 0-30
    competitorGapScore: number; // 0-25
    easeOfCaptureScore: number; // 0-15
  };
  actionType: OpportunityActionType;
  targetPageId?: string; // If action is IMPROVE or CONSOLIDATE
  status: "discovered" | "planned" | "in_builder" | "published" | "dismissed";
}

/* ------------------------------------------------------------------ */
/* Page Composition, Sections & Editor Types                          */
/* ------------------------------------------------------------------ */

export type PageSectionType =
  | "hero"
  | "features_grid"
  | "comparison_table"
  | "value_props"
  | "product_showcase"
  | "testimonials"
  | "faq_accordion"
  | "cta_banner"
  | "process_steps"
  | "rich_content";

export interface PageSectionItem {
  id: string;
  type: PageSectionType;
  heading: string;
  subheading?: string;
  body: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  mediaPrompt?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  // Specific payload for comparison tables or FAQs
  tableRows?: { feature: string; yourBrand: string; competitors: string }[];
  faqItems?: { question: string; answer: string }[];
}

export interface PageSeoConfig {
  slug: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  canonicalUrl: string;
  noindex: boolean;
  nofollow: boolean;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
  structuredDataType: "Product" | "FAQPage" | "Organization" | "Service" | "Article" | "None";
}

export interface PageDocument {
  id: string;
  title: string;
  pageType: PageType;
  status: "idea" | "draft" | "review" | "scheduled" | "published";
  topicGroupId?: number;
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  valueProposition: string;
  opportunityId?: string;
  sections: PageSectionItem[];
  seo: PageSeoConfig;
  destination: string;
  externalUrl?: string;
  cmsPageId?: string;
  publishedAt?: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* CMS Capability Matrix & Adapter Types                              */
/* ------------------------------------------------------------------ */

export type CmsPlatformId =
  | "wordpress"
  | "webflow"
  | "shopify"
  | "ghost"
  | "wix"
  | "notion"
  | "framer"
  | "custom_webhook";

export interface CmsCapabilities {
  createPage: boolean;
  updatePage: boolean;
  publishLive: boolean;
  schedulePublish: boolean;
  uploadMedia: boolean;
  customSlug: boolean;
  seoMetaTitleDescription: boolean;
  structuredDataJsonLd: boolean;
  limitationsNotes?: string;
}

export interface CmsConnectorConfig {
  id: CmsPlatformId;
  name: string;
  iconName: string;
  connected: boolean;
  capabilities: CmsCapabilities;
  accountName?: string;
}

