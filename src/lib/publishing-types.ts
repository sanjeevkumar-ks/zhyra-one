export type PublishingChannelId =
  | "wordpress"
  | "webflow"
  | "shopify"
  | "ghost"
  | "wix"
  | "notion"
  | "framer"
  | "webhook"
  | "linkedin"
  | "reddit";

export type ChannelCategory = "website" | "social";

export type PublicationStatus =
  | "published"
  | "scheduled"
  | "draft"
  | "queued"
  | "processing"
  | "failed"
  | "needs_attention";

export interface ChannelCapabilities {
  posts: boolean;
  pages: boolean;
  scheduling: boolean;
  updates: boolean;
  media: boolean;
  notes?: string;
}

export interface ConnectedChannel {
  id: PublishingChannelId;
  name: string;
  category: ChannelCategory;
  connected: boolean;
  publishedCount: number;
  scheduledCount: number;
  tokenExpiresAt?: string;
  tokenExpired?: boolean;
  capabilities: ChannelCapabilities;
  endpoint?: string;
}

export interface DestinationPublication {
  id: string; // e.g. "pub_1_wp"
  contentId: number;
  destination: PublishingChannelId;
  destinationName: string;
  category: ChannelCategory;
  status: PublicationStatus;
  scheduledFor?: string;
  publishedAt?: string;
  externalUrl?: string;
  externalId?: string;
  idempotencyKey: string;
  version: number;
  adaptedTitle: string;
  adaptedSnippet: string;
  adaptedContentHtml?: string;
  syncStatus: "in_sync" | "pending_sync" | "sync_error";
  lastSyncedAt?: string;
  error?: string;
  retryCount: number;
}

export interface ParentContentPublication {
  contentId: number;
  title: string;
  slug: string;
  contentType: "article" | "page";
  primaryKeyword: string;
  overallStatus: PublicationStatus;
  destinations: DestinationPublication[];
  createdAt: string;
  updatedAt: string;
}

export interface PublishingMetrics {
  totalConnectedChannels: number;
  scheduledCount: number;
  publishedThisMonth: number;
  failedCount: number;
}

export interface WebhookLogEntry {
  id: string;
  event: string;
  status: number;
  key: string;
  at: string;
  attempt: number;
  destination: string;
  payloadSummary: string;
}

