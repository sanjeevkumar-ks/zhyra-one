export type Intent = "informational" | "commercial" | "transactional" | "navigational";
export type Level = "High" | "Medium" | "Low";

export type ContentStatus =
  | "idea"
  | "planned"
  | "brief"
  | "drafting"
  | "editing"
  | "review"
  | "scheduled"
  | "published"
  | "monitoring"
  | "refresh"
  | "archived";

export const STAGES: { id: ContentStatus; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "planned", label: "Planned" },
  { id: "brief", label: "Brief" },
  { id: "drafting", label: "Drafting" },
  { id: "editing", label: "Editing" },
  { id: "review", label: "Review" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
  { id: "monitoring", label: "Monitoring" },
  { id: "refresh", label: "Refresh" },
];

export interface Section {
  id: string;
  heading: string;
  body: string;
  status: "empty" | "generating" | "done";
}

export interface FeaturedImage {
  prompt: string;
  seed: number;
  alt: string;
  caption: string;
  ratio: string;
  position: "top" | "after-intro" | "bottom";
}

export interface ContentBrief {
  audience: string;
  intent: Intent;
  primaryKeyword: string;
  secondaryKeywords: string[];
  questions: string[];
  competitorSummary: string;
  proposedTitle: string;
  metaTitle: string;
  metaDescription: string;
  outline: string[];
  internalLinks: string[];
  references: string[];
  expertise: string[];
  lengthSuggestion: string;
  approved: boolean;
}

export interface ContentVersion {
  version: number;
  at: string;
  note: string;
  title: string;
  sections: Section[];
}

export interface BusinessProfileData {
  summary: string;
  offering: string;
  customers: string;
  categories: string[];
  existingContent: number;
  topics: string[];
}

export interface AudienceData {
  segments: string[];
  markets: string[];
  languages: string[];
  problems: string[];
}

export interface CompetitorData {
  domain: string;
  description: string;
  kind: "business" | "search" | "ai";
  sharedTopics: string[];
  overlap: number;
}

export interface BrandData {
  tone: string[];
  style: string[];
  avoid: string;
  references: string;
  guidelines: string;
}

export type IntegrationState = Record<string, boolean>;

export interface Workspace {
  id: number;
  name: string;
  website: string;
  businessType: string;
  industry: string;
  description: string;
  location: string;
  language: string;
  profile: BusinessProfileData;
  audience: AudienceData;
  competitors: CompetitorData[];
  goals: { selected: string[]; primary: string };
  brand: BrandData;
  integrations: IntegrationState;
  mode: "simple" | "advanced";
  onboardingCompleted: boolean;
}
