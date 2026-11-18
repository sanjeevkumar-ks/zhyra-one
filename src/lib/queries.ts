import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentItems, keywords, publishingJobs, topicGroups, workspaces } from "@/db/schema";
import {
  ensureSeeded,
  DEFAULT_WORKSPACE,
  FALLBACK_TOPIC_GROUPS,
  getFallbackKeywords,
  getFallbackContent,
} from "@/db/seed";
import { sectionsWords } from "@/lib/services/ai";
import type { Workspace } from "@/lib/types";

export type KeywordRow = typeof keywords.$inferSelect;
export type TopicGroupRow = typeof topicGroups.$inferSelect;
type RawContent = typeof contentItems.$inferSelect;
export type ContentRow = Omit<RawContent, "updatedAt" | "createdAt"> & { updatedAt: string; createdAt: string; words: number };
export type JobRow = Omit<typeof publishingJobs.$inferSelect, "createdAt"> & { createdAt: string };

function ser(r: RawContent): ContentRow {
  return { ...r, updatedAt: r.updatedAt.toISOString(), createdAt: r.createdAt.toISOString(), words: sectionsWords(r.sections) };
}

export async function getWorkspace(): Promise<Workspace> {
  try {
    await ensureSeeded();
    const [w] = await db.select().from(workspaces).orderBy(asc(workspaces.id)).limit(1);
    if (w) {
      return { ...w, mode: w.mode === "advanced" ? "advanced" : "simple" };
    }
  } catch (err) {
    console.warn("getWorkspace DB query failed, using fallback:", err instanceof Error ? err.message : err);
  }
  return { ...DEFAULT_WORKSPACE, mode: DEFAULT_WORKSPACE.mode === "advanced" ? "advanced" : "simple" };
}

export async function getKeywords(): Promise<KeywordRow[]> {
  try {
    await ensureSeeded();
    const rows = await db.select().from(keywords).orderBy(asc(keywords.id));
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getKeywords DB query failed, using fallback:", err instanceof Error ? err.message : err);
  }
  return getFallbackKeywords() as KeywordRow[];
}

export async function getTopicGroups(): Promise<TopicGroupRow[]> {
  try {
    await ensureSeeded();
    const rows = await db.select().from(topicGroups).orderBy(asc(topicGroups.id));
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getTopicGroups DB query failed, using fallback:", err instanceof Error ? err.message : err);
  }
  return FALLBACK_TOPIC_GROUPS as TopicGroupRow[];
}

export async function getContent(type?: "article" | "page"): Promise<ContentRow[]> {
  try {
    await ensureSeeded();
    const rows = type
      ? await db.select().from(contentItems).where(eq(contentItems.type, type)).orderBy(desc(contentItems.updatedAt), desc(contentItems.id))
      : await db.select().from(contentItems).orderBy(desc(contentItems.updatedAt), desc(contentItems.id));
    if (rows && rows.length > 0) return rows.map(ser);
  } catch (err) {
    console.warn("getContent DB query failed, using fallback:", err instanceof Error ? err.message : err);
  }
  const fallback = getFallbackContent();
  return (type ? fallback.filter((f) => f.type === type) : fallback) as ContentRow[];
}

export async function getContentItem(id: number): Promise<ContentRow | null> {
  try {
    await ensureSeeded();
    const [r] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    if (r) return ser(r);
  } catch (err) {
    console.warn("getContentItem DB query failed, using fallback:", err instanceof Error ? err.message : err);
  }
  const fallback = getFallbackContent();
  const match = fallback.find((f) => f.id === id);
  return (match ?? null) as ContentRow | null;
}

export async function getJobs(): Promise<JobRow[]> {
  try {
    await ensureSeeded();
    const rows = await db.select().from(publishingJobs).orderBy(desc(publishingJobs.id));
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  } catch (err) {
    console.warn("getJobs DB query failed, returning empty:", err instanceof Error ? err.message : err);
    return [];
  }
}
