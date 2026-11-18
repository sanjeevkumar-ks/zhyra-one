import type { Section } from "@/lib/types";
import { findUnverifiedClaims, wordCount } from "./ai";

export type CheckState = "pass" | "attention" | "na" | "unverified";
export interface Check {
  id: string;
  label: string;
  state: CheckState;
  detail: string;
}
export interface CheckGroup {
  id: "seo" | "geo" | "aeo" | "editorial";
  label: string;
  checks: Check[];
}

export interface OptimiseInput {
  title: string;
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  sections: Section[];
  hasImage: boolean;
  imageAlt: string;
  type: "article" | "page";
}

export function computeChecks(i: OptimiseInput): CheckGroup[] {
  const body = i.sections.map((s) => s.body).join("\n\n");
  const kw = i.keyword.toLowerCase();
  const intro = (i.sections[0]?.body ?? "").toLowerCase();
  const links = (body.match(/\]\((https?:\/\/|\/)[^)]+\)/g) ?? []).length;
  const headings = i.sections.filter((s) => s.heading.trim()).length;
  const words = wordCount(body);
  const claims = findUnverifiedClaims(body);
  const placeholders = (body.match(/\[[^\]]{8,}\]/g) ?? []).length;
  const hasFaq = /faq|frequently asked|question/i.test(i.sections.map((s) => s.heading).join(" ") + body);
  const hasList = /^\s*[-*] /m.test(body) || /\|.*\|/.test(body);
  const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  const avgLen = sentences.length ? words / sentences.length : 0;
  const empty = words === 0;
  const c = (id: string, label: string, ok: boolean, detail: string, state?: CheckState): Check => ({
    id,
    label,
    detail,
    state: state ?? (ok ? "pass" : "attention"),
  });

  return [
    {
      id: "seo",
      label: "SEO",
      checks: [
        c("title-len", "SEO title length (30–60 characters)", i.metaTitle.length >= 30 && i.metaTitle.length <= 60, `${i.metaTitle.length} characters`),
        c("meta-len", "Meta description (80–160 characters)", i.metaDescription.length >= 80 && i.metaDescription.length <= 160, `${i.metaDescription.length} characters`),
        c("kw-title", "Primary keyword in title", !!kw && i.title.toLowerCase().includes(kw), kw ? `Keyword: "${i.keyword}"` : "No primary keyword set"),
        c("kw-intro", "Keyword in the opening section", !!kw && intro.includes(kw), "Mention the topic early, naturally"),
        c("h2", "At least 3 descriptive headings", headings >= 3, `${headings} headings`),
        c("slug", "Clean URL slug", /^[a-z0-9-]{3,70}$/.test(i.slug), `/${i.slug}`),
        c("links", "Internal or external links", links >= 2, `${links} links found`),
        c("indexable", "Indexability", true, "Cannot be verified until published", "unverified"),
      ],
    },
    {
      id: "geo",
      label: "GEO",
      checks: [
        c("clarity", "Clear, quotable statements", !empty && avgLen > 0 && avgLen < 24, `Average sentence ${Math.round(avgLen)} words`),
        c("entity", "Brand/entity named consistently", !empty && /verdant|our team|we /i.test(body), "Mention the brand where relevant"),
        c("evidence", "Claims backed by sources", claims.length === 0, claims.length ? `${claims.length} claim(s) lack a source` : "No unsourced claims detected"),
        c("attribution", "Source attribution links", links > 0, links ? "Links present" : "Add links to primary sources", links > 0 ? "pass" : "attention"),
        c("citations", "Appearance in AI answers", true, "Requires AI visibility monitoring after publishing", "unverified"),
      ],
    },
    {
      id: "aeo",
      label: "AEO",
      checks: [
        c("direct", "Direct answer near the start", !empty && intro.length > 80 && /\b(is|are|means|best|short answer)\b/.test(intro), "Open with the answer, then add context"),
        c("faq", "Question coverage", hasFaq, hasFaq ? "Questions addressed" : "No question section found"),
        c("structure", "Lists or tables for scannability", hasList, hasList ? "Structured content present" : "Add a list or table where useful"),
        c("schema", "Structured data", i.type === "article", i.type === "article" ? "Article schema generated on publish" : "Page schema depends on template", i.type === "article" ? "pass" : "na"),
      ],
    },
    {
      id: "editorial",
      label: "Editorial quality",
      checks: [
        c("placeholders", "No unfinished placeholders", placeholders === 0, placeholders ? `${placeholders} placeholder(s) to complete` : "None found"),
        c("length", "Sufficient depth", words >= 500, `${words} words`),
        c("alt", "Featured image with alt text", i.hasImage && i.imageAlt.length > 5, i.hasImage ? "Alt text present" : "No featured image"),
        c("voice", "Brand voice match", true, "Requires human review", "unverified"),
        c("originality", "Original input and experience", placeholders === 0 && words > 300, "Add first-hand examples; cannot be machine-verified", placeholders === 0 && words > 300 ? "unverified" : "attention"),
      ],
    },
  ];
}

export function scoreChecks(groups: CheckGroup[]): { score: number; passed: number; applicable: number } {
  const all = groups.flatMap((g) => g.checks).filter((c) => c.state === "pass" || c.state === "attention");
  const passed = all.filter((c) => c.state === "pass").length;
  return { score: all.length ? Math.round((passed / all.length) * 100) : 0, passed, applicable: all.length };
}
