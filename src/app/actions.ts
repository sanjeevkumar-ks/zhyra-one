"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { db } from "@/db";
import { contentItems, keywords, publishingJobs, workspaces } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { makeBrief, slugify } from "@/lib/services/ai";
import { getConnector, idempotencyKey, type ContentPayload } from "@/lib/services/cms";
import { toHtml } from "@/lib/markdown";
import { hash } from "@/lib/hash";
import type {
  AudienceData,
  BrandData,
  BusinessProfileData,
  CompetitorData,
  ContentBrief,
  ContentStatus,
  FeaturedImage,
  Section,
} from "@/lib/types";

async function firstWorkspaceId(): Promise<number> {
  try {
    await ensureSeeded();
    const [w] = await db.select({ id: workspaces.id }).from(workspaces).limit(1);
    if (w) return w.id;
  } catch (err) {
    console.warn("firstWorkspaceId query failed, falling back to id 1:", err instanceof Error ? err.message : err);
  }
  return 1;
}

export interface OnboardingPayload {
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
}

export async function saveOnboarding(p: OnboardingPayload) {
  const id = await firstWorkspaceId();
  await db.update(workspaces).set({ ...p, onboardingCompleted: true }).where(eq(workspaces.id, id));
  revalidatePath("/", "layout");
}

export async function setMode(mode: "simple" | "advanced") {
  const id = await firstWorkspaceId();
  await db.update(workspaces).set({ mode }).where(eq(workspaces.id, id));
  revalidatePath("/", "layout");
}

export async function saveBrand(brand: BrandData) {
  const id = await firstWorkspaceId();
  await db.update(workspaces).set({ brand }).where(eq(workspaces.id, id));
  revalidatePath("/settings");
}

export async function toggleIntegration(key: string) {
  const id = await firstWorkspaceId();
  const [w] = await db.select().from(workspaces).where(eq(workspaces.id, id));
  await db.update(workspaces).set({ integrations: { ...w.integrations, [key]: !w.integrations[key] } }).where(eq(workspaces.id, id));
  revalidatePath("/", "layout");
}

export async function addKeywordsToPlanner(ids: number[]): Promise<number> {
  await ensureSeeded();
  if (!ids.length) return 0;
  const rows = await db.select().from(keywords).where(inArray(keywords.id, ids));
  let created = 0;
  for (const k of rows) {
    if (k.inPlanner) continue;
    const brief = makeBrief(k.keyword, "Verdant Botanics", k.intent as ContentBrief["intent"]);
    await db.insert(contentItems).values({
      type: "article",
      title: brief.proposedTitle,
      slug: slugify(brief.proposedTitle),
      primaryKeyword: k.keyword,
      secondaryKeywords: brief.secondaryKeywords,
      topicGroupId: k.topicGroupId,
      format: k.intent === "commercial" ? "Buying guide" : "Guide",
      intent: k.intent,
      status: "planned",
      targetDate: format(addDays(new Date(), 7 + created * 2), "yyyy-MM-dd"),
      metaTitle: brief.metaTitle,
      metaDescription: brief.metaDescription,
      sections: [],
      versions: [],
    });
    await db.update(keywords).set({ inPlanner: true, coverage: "Planned" }).where(eq(keywords.id, k.id));
    created++;
  }
  revalidatePath("/", "layout");
  return created;
}

export async function trackKeyword(id: number, tracked: boolean) {
  await db.update(keywords).set({ tracked }).where(eq(keywords.id, id));
  revalidatePath("/opportunities");
}

export interface CreateContentInput {
  type: "article" | "page";
  title: string;
  keyword: string;
  topicGroupId: number | null;
  format: string;
  brief: ContentBrief;
  status?: ContentStatus;
}

export async function createContent(input: CreateContentInput): Promise<number> {
  await ensureSeeded();
  const sections: Section[] = input.brief.outline.map((h, i) => ({ id: `s${Date.now()}-${i}`, heading: h, body: "", status: "empty" }));
  const [row] = await db
    .insert(contentItems)
    .values({
      type: input.type,
      title: input.title,
      slug: slugify(input.title),
      primaryKeyword: input.keyword,
      secondaryKeywords: input.brief.secondaryKeywords,
      topicGroupId: input.topicGroupId,
      format: input.format,
      intent: input.brief.intent,
      status: input.status ?? "drafting",
      targetDate: format(addDays(new Date(), 5), "yyyy-MM-dd"),
      metaTitle: input.brief.metaTitle,
      metaDescription: input.brief.metaDescription,
      brief: { ...input.brief, approved: true },
      sections,
      versions: [],
    })
    .returning({ id: contentItems.id });
  if (input.keyword) await db.update(keywords).set({ inPlanner: true, coverage: "Planned" }).where(eq(keywords.keyword, input.keyword));
  revalidatePath("/", "layout");
  return row.id;
}

export interface SavePatch {
  title?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  sections?: Section[];
  featuredImage?: FeaturedImage | null;
  status?: ContentStatus;
  targetDate?: string | null;
  primaryKeyword?: string;
}

export async function saveContent(id: number, patch: SavePatch) {
  await db.update(contentItems).set({ ...patch, updatedAt: new Date() }).where(eq(contentItems.id, id));
  revalidatePath("/articles");
  revalidatePath("/planner");
}

export async function moveContent(id: number, status: ContentStatus) {
  await db.update(contentItems).set({ status, updatedAt: new Date() }).where(eq(contentItems.id, id));
  revalidatePath("/", "layout");
}

export async function saveVersion(id: number, note: string) {
  const [r] = await db.select().from(contentItems).where(eq(contentItems.id, id));
  if (!r) return;
  const next = (r.versions.at(-1)?.version ?? 0) + 1;
  await db
    .update(contentItems)
    .set({ versions: [...r.versions, { version: next, at: new Date().toISOString(), note, title: r.title, sections: r.sections }], updatedAt: new Date() })
    .where(eq(contentItems.id, id));
  revalidatePath(`/articles/${id}`);
}

export interface PublishOutcome {
  ok: boolean;
  message: string;
  url?: string;
  deduped?: boolean;
}

/** Publishes through the connector abstraction. Re-publishing an edited item creates a new version + updateContent(). */
export async function publishContent(id: number, mode: "now" | "schedule", scheduleDate?: string): Promise<PublishOutcome> {
  const [r] = await db.select().from(contentItems).where(eq(contentItems.id, id));
  if (!r) return { ok: false, message: "Content not found" };
  const connector = getConnector(r.destination);
  if (!(await connector.testConnection())) return { ok: false, message: `${r.destination} connection failed` };

  const version = (r.versions.at(-1)?.version ?? 0) + 1;
  // Key derives from content state, so re-publishing unchanged content never creates a duplicate.
  const key = idempotencyKey(r.id, hash(JSON.stringify([r.title, r.sections, r.metaTitle, r.metaDescription, mode, scheduleDate ?? ""])), r.destination);
  const [dup] = await db.select().from(publishingJobs).where(and(eq(publishingJobs.idempotencyKey, key), eq(publishingJobs.contentId, id)));
  if (dup && dup.status !== "failed") return { ok: true, deduped: true, message: "Already delivered with this idempotency key — no duplicate created.", url: dup.externalUrl ?? undefined };

  const payload: ContentPayload = {
    contentId: r.id,
    version,
    type: r.type === "page" ? "page" : "article",
    title: r.title,
    slug: r.slug || slugify(r.title),
    html: toHtml(r.sections.map((s) => `**${s.heading}**\n\n${s.body}`).join("\n\n")),
    metaTitle: r.metaTitle,
    metaDescription: r.metaDescription,
    scheduledFor: mode === "schedule" ? scheduleDate : undefined,
  };
  const res = r.cmsId ? await connector.updateContent(r.cmsId, payload) : await connector.publishContent(payload);
  await db.insert(publishingJobs).values({
    contentId: r.id,
    title: r.title,
    destination: r.destination,
    status: res.status,
    externalUrl: res.url,
    cmsId: res.externalId,
    idempotencyKey: key,
    error: res.error ?? null,
  });
  await db
    .update(contentItems)
    .set({
      status: mode === "schedule" ? "scheduled" : "published",
      targetDate: mode === "schedule" && scheduleDate ? scheduleDate : r.targetDate,
      externalUrl: res.url,
      cmsId: res.externalId,
      publishedVersion: mode === "now" ? version : r.publishedVersion,
      versions: [...r.versions, { version, at: new Date().toISOString(), note: mode === "now" ? (r.cmsId ? "Updated live" : "Published") : "Scheduled", title: r.title, sections: r.sections }],
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, id));
  revalidatePath("/", "layout");
  return { ok: true, url: res.url, message: mode === "now" ? (r.cmsId ? "Updated on your site (new version saved)." : "Published to your site.") : "Scheduled." };
}

export async function importFromWebsite(): Promise<number> {
  await ensureSeeded();
  const titles = ["Winter Skincare Tips (imported)", "Our Sourcing Promise (imported)", "How We Make Our Cleanser (imported)"];
  for (const t of titles) {
    const brief = makeBrief("imported article", "Verdant Botanics");
    await db.insert(contentItems).values({
      type: "article",
      title: t,
      slug: slugify(t),
      primaryKeyword: "",
      secondaryKeywords: [],
      format: "Imported",
      status: "monitoring",
      imported: true,
      metaTitle: "",
      metaDescription: "",
      brief: null,
      sections: [{ id: "i1", heading: "Imported content", body: `Imported from your website. ${brief.audience}`, status: "done" }],
      versions: [],
      publishedVersion: 1,
      externalUrl: `https://verdantbotanics.com/blog/${slugify(t)}`,
    });
  }
  revalidatePath("/", "layout");
  return titles.length;
}

export async function webhookTest(url: string, event: string): Promise<{ ok: boolean; status: number; key: string; body: string }> {
  const key = idempotencyKey(Date.now() % 100000, 1, url + event);
  const ok = /^https?:\/\//.test(url);
  return {
    ok,
    status: ok ? 200 : 0,
    key,
    body: ok ? "Mock delivery accepted (no request is sent in demo mode)." : "Invalid URL — must start with https://",
  };
}
