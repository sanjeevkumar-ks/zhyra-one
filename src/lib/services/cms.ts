import { createHash } from "crypto";
import { slugify } from "./ai";

export interface ContentPayload {
  contentId: number;
  version: number;
  type: "article" | "page";
  title: string;
  slug: string;
  html: string;
  metaTitle: string;
  metaDescription: string;
  scheduledFor?: string;
  externalId?: string;
}

export interface PublishResult {
  ok: boolean;
  externalId: string;
  url: string;
  status: "published" | "scheduled" | "failed";
  idempotencyKey: string;
  error?: string;
}

export interface Capabilities {
  posts: boolean;
  pages: boolean;
  media: boolean;
  scheduling: boolean;
  updates: boolean;
}

export interface CMSConnector {
  name: string;
  connect(): Promise<{ connected: boolean }>;
  testConnection(): Promise<boolean>;
  getCapabilities(): Promise<Capabilities>;
  publishContent(content: ContentPayload): Promise<PublishResult>;
  updateContent(externalId: string, content: ContentPayload): Promise<PublishResult>;
  getContentStatus(externalId: string): Promise<"published" | "scheduled" | "draft" | "missing">;
}

export function idempotencyKey(contentId: number, version: number, destination: string): string {
  return createHash("sha256").update(`${destination}:${contentId}:${version}`).digest("hex").slice(0, 24);
}

/** Mock WordPress adapter. Same-key publishes always resolve to the same external ID (no duplicates). */
export class MockWordPressConnector implements CMSConnector {
  name = "WordPress";
  constructor(private base = "https://verdantbotanics.com") {}
  async connect() {
    return { connected: true };
  }
  async testConnection() {
    return true;
  }
  async getCapabilities(): Promise<Capabilities> {
    return { posts: true, pages: true, media: true, scheduling: true, updates: true };
  }
  private result(c: ContentPayload, externalId: string): PublishResult {
    return {
      ok: true,
      externalId,
      url: `${this.base}/${c.type === "page" ? "" : "blog/"}${c.slug || slugify(c.title)}`,
      status: c.scheduledFor ? "scheduled" : "published",
      idempotencyKey: idempotencyKey(c.contentId, c.version, this.name),
    };
  }
  async publishContent(c: ContentPayload) {
    const id = "wp_" + createHash("sha1").update(`content:${c.contentId}`).digest("hex").slice(0, 8);
    return this.result(c, id);
  }
  async updateContent(externalId: string, c: ContentPayload) {
    return this.result(c, externalId);
  }
  async getContentStatus() {
    return "published" as const;
  }
}

export function getConnector(destination: string): CMSConnector {
  // Only WordPress has an adapter in this build; others fall back to the mock contract implementation.
  const c = new MockWordPressConnector();
  c.name = destination;
  return c;
}
