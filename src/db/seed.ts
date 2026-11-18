import { addDays, format } from "date-fns";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { contentItems, keywords, topicGroups, workspaces } from "@/db/schema";
import { makeBrief, mockSectionText, slugify, sectionsWords } from "@/lib/services/ai";
import { hash, inferIntent } from "@/lib/hash";
import type { Section, ContentStatus, Workspace } from "@/lib/types";

const KEYWORDS: [string, number][] = [
  // group 1 — Organic skincare
  ["organic skincare", 1], ["best organic skincare products", 1], ["organic skincare routine for beginners", 1], ["natural vs organic skincare", 1],
  ["organic skincare brands", 1], ["what is organic skincare", 1], ["is organic skincare better", 1], ["organic skincare gift set", 1],
  ["buy organic skincare online", 1], ["organic skincare for men", 1], ["certified organic skincare", 1], ["organic skincare ingredients to avoid", 1],
  ["organic face moisturiser", 1], ["best organic face moisturiser", 1], ["organic face cleanser", 1], ["organic face serum", 1],
  ["organic skincare subscription", 1], ["organic skincare in india", 1], ["organic body lotion", 1], ["verdant botanics reviews", 1],
  // group 2 — Skin types
  ["organic skincare for oily skin", 2], ["skincare for sensitive skin", 2], ["best moisturiser for dry skin", 2], ["skincare routine for combination skin", 2],
  ["natural skincare for acne prone skin", 2], ["how to know your skin type", 2], ["skincare for mature skin", 2], ["gentle cleanser for sensitive skin", 2],
  ["best serum for oily skin", 2], ["natural remedies for dry skin", 2], ["skincare routine for teenagers", 2], ["best sunscreen for sensitive skin", 2],
  ["how to fix oily skin naturally", 2], ["non comedogenic moisturiser", 2], ["fragrance free skincare", 2], ["eczema friendly moisturiser", 2],
  ["skincare for hormonal acne", 2], ["night routine for dry skin", 2], ["buy moisturiser for sensitive skin", 2], ["skin barrier repair products", 2],
  // group 3 — Natural ingredients
  ["best natural skincare ingredients", 3], ["what does niacinamide do", 3], ["is vitamin c serum safe", 3], ["hyaluronic acid vs glycerin", 3],
  ["aloe vera for skin", 3], ["shea butter benefits for skin", 3], ["rosehip oil benefits", 3], ["squalane vs jojoba oil", 3],
  ["turmeric face mask benefits", 3], ["green tea extract skincare", 3], ["natural retinol alternatives", 3], ["bakuchiol vs retinol", 3],
  ["calendula for sensitive skin", 3], ["essential oils in skincare safe", 3], ["clay mask for oily skin", 3], ["ceramides in skincare", 3],
  ["buy rosehip oil", 3], ["botanical extracts in skincare", 3], ["plant based skincare ingredients", 3], ["best natural exfoliants for face", 3],
];

const ARTICLES: { title: string; kw: string; tg: number; status: ContentStatus; format: string; day: number; type?: "article" | "page" }[] = [
  { title: "The Complete Guide to Organic Skincare", kw: "organic skincare", tg: 1, status: "published", format: "Pillar guide", day: -60 },
  { title: "Organic Skincare Routine for Beginners", kw: "organic skincare routine for beginners", tg: 1, status: "published", format: "How-to", day: -52 },
  { title: "Natural vs Organic Skincare: What's the Difference?", kw: "natural vs organic skincare", tg: 1, status: "published", format: "Comparison", day: -46 },
  { title: "What Is Organic Skincare? A Plain-English Explainer", kw: "what is organic skincare", tg: 1, status: "published", format: "Explainer", day: -40 },
  { title: "Organic Skincare for Oily Skin", kw: "organic skincare for oily skin", tg: 2, status: "published", format: "Guide", day: -35 },
  { title: "How to Know Your Skin Type at Home", kw: "how to know your skin type", tg: 2, status: "published", format: "How-to", day: -30 },
  { title: "Skincare for Sensitive Skin: A Gentle Approach", kw: "skincare for sensitive skin", tg: 2, status: "published", format: "Guide", day: -26 },
  { title: "What Does Niacinamide Actually Do?", kw: "what does niacinamide do", tg: 3, status: "published", format: "Explainer", day: -22 },
  { title: "Rosehip Oil Benefits: What to Know", kw: "rosehip oil benefits", tg: 3, status: "published", format: "Explainer", day: -18 },
  { title: "Aloe Vera for Skin: Uses and Cautions", kw: "aloe vera for skin", tg: 3, status: "published", format: "Explainer", day: -14 },
  { title: "Bakuchiol vs Retinol: Which Should You Choose?", kw: "bakuchiol vs retinol", tg: 3, status: "published", format: "Comparison", day: -10 },
  { title: "Best Moisturiser for Dry Skin: How to Choose", kw: "best moisturiser for dry skin", tg: 2, status: "published", format: "Buying guide", day: -7 },
  { title: "Best Organic Face Moisturiser: A Buyer's Guide", kw: "best organic face moisturiser", tg: 1, status: "review", format: "Buying guide", day: 2 },
  { title: "Squalane vs Jojoba Oil", kw: "squalane vs jojoba oil", tg: 3, status: "review", format: "Comparison", day: 4 },
  { title: "Skincare Routine for Combination Skin", kw: "skincare routine for combination skin", tg: 2, status: "review", format: "How-to", day: 5 },
  { title: "Organic Skincare Ingredients to Avoid", kw: "organic skincare ingredients to avoid", tg: 1, status: "drafting", format: "Guide", day: 8 },
  { title: "Natural Skincare for Acne-Prone Skin", kw: "natural skincare for acne prone skin", tg: 2, status: "drafting", format: "Guide", day: 10 },
  { title: "Shea Butter Benefits for Skin", kw: "shea butter benefits for skin", tg: 3, status: "editing", format: "Explainer", day: 6 },
  { title: "Is Organic Skincare Better? Looking at the Evidence", kw: "is organic skincare better", tg: 1, status: "editing", format: "Explainer", day: 9 },
  { title: "Gentle Cleanser for Sensitive Skin", kw: "gentle cleanser for sensitive skin", tg: 2, status: "scheduled", format: "Buying guide", day: 3 },
  { title: "Hyaluronic Acid vs Glycerin", kw: "hyaluronic acid vs glycerin", tg: 3, status: "scheduled", format: "Comparison", day: 7 },
  { title: "Best Serum for Oily Skin", kw: "best serum for oily skin", tg: 2, status: "brief", format: "Buying guide", day: 12 },
  { title: "Organic Skincare Gift Guide", kw: "organic skincare gift set", tg: 1, status: "planned", format: "Listicle", day: 15 },
  { title: "Ceramides in Skincare: A Beginner's Explainer", kw: "ceramides in skincare", tg: 3, status: "idea", format: "Explainer", day: 20 },
  { title: "Organic Face Moisturiser Collection", kw: "organic face moisturiser", tg: 1, status: "published", format: "Landing page", day: -20, type: "page" },
  { title: "Skincare for Sensitive Skin — Shop the Range", kw: "buy moisturiser for sensitive skin", tg: 2, status: "drafting", format: "Landing page", day: 11, type: "page" },
  { title: "About Verdant Botanics", kw: "verdant botanics", tg: 1, status: "published", format: "About page", day: -90, type: "page" },
];

const OWNERS = ["Sanjeev Kumar", "Arjun Mehta", "Sofia Lind"];

export const DEFAULT_WORKSPACE: Workspace = {
  id: 1,
  name: "Verdant Botanics",
  website: "verdantbotanics.com",
  businessType: "Ecommerce",
  industry: "Beauty & personal care",
  description:
    "Verdant Botanics is an organic skincare brand making gentle, plant-based face and body care for people who want to understand what is in their products.",
  location: "Bengaluru, India",
  language: "English",
  profile: {
    summary: "Organic skincare ecommerce brand",
    offering: "Natural face care, body care and hair care products",
    customers: "Adults looking for chemical-conscious skincare",
    categories: ["Face care", "Body care", "Hair care"],
    existingContent: 24,
    topics: ["Skincare routines", "Ingredients", "Skin types"],
  },
  audience: {
    segments: ["Ingredient-conscious shoppers", "People with sensitive skin", "Gift buyers"],
    markets: ["India", "United Kingdom"],
    languages: ["English"],
    problems: ["Finding gentle products for sensitive skin", "Understanding ingredient labels", "Building a simple routine"],
  },
  competitors: [
    { domain: "kamaayurveda.com", description: "Ayurvedic beauty and skincare brand", kind: "business", sharedTopics: ["Organic skincare", "Ingredients"], overlap: 62 },
    { domain: "typology.com", description: "Minimalist skincare with ingredient-led formulas", kind: "business", sharedTopics: ["Serums", "Sensitive skin"], overlap: 48 },
    { domain: "healthline.com", description: "Health publisher ranking for skincare questions", kind: "search", sharedTopics: ["Skin types", "Ingredients"], overlap: 71 },
    { domain: "reddit.com", description: "Community discussions cited in AI answers", kind: "ai", sharedTopics: ["Routines", "Product reviews"], overlap: 54 },
  ],
  goals: { selected: ["Increase organic traffic", "Improve AI search visibility", "Increase ecommerce sales"], primary: "Increase organic traffic" },
  brand: {
    tone: ["Friendly", "Authoritative"],
    style: ["Educational", "Simple"],
    avoid: "cure, miracle, anti-aging guarantee, 100% chemical-free",
    references: "https://www.aad.org/public/everyday-care/skin-care-basics",
    guidelines: "Verdant_Brand_Guidelines_2025.pdf",
  },
  integrations: { gsc: true, ga4: false, bing: false, wordpress: true, webflow: false, shopify: false, wix: false, ghost: false, notion: false, framer: false, webhook: false, linkedin: false, reddit: false },
  mode: "simple",
  onboardingCompleted: true,
};

export const FALLBACK_TOPIC_GROUPS = [
  { id: 1, name: "Organic Skincare", description: "Core category: what organic skincare is, how to buy it and use it.", pillarTitle: "The Complete Guide to Organic Skincare" },
  { id: 2, name: "Skincare by Skin Type", description: "Routines and product guidance for specific skin concerns.", pillarTitle: "The Skin Type Handbook: Find Your Routine" },
  { id: 3, name: "Natural Ingredients", description: "Plain-English explainers for the ingredients on the label.", pillarTitle: "Skincare Ingredients Explained" },
];

export function getFallbackKeywords() {
  return KEYWORDS.map(([k, tg], i) => {
    const h = hash(k);
    const intent = inferIntent(k);
    const volume = Math.round((40 + (h % 9000)) / 10) * 10;
    const difficulty = 12 + (h % 70);
    const published = ARTICLES.find((a) => a.kw === k && a.status === "published");
    const position = published ? 2 + (h % 18) : h % 5 === 0 ? 14 + (h % 40) : null;
    const feats = [(h % 3 === 0 ? ["Featured snippet"] : []), (h % 4 === 0 ? ["AI Overview"] : []), (h % 5 === 0 ? ["People also ask"] : [])].flat();
    return {
      id: i + 1,
      keyword: k,
      volume,
      difficulty,
      intent,
      position,
      serpFeatures: feats,
      targetUrl: published ? `/blog/${slugify(published.title)}` : "",
      topicGroupId: tg,
      tracked: !!published || h % 4 === 0,
      inPlanner: ARTICLES.some((a) => a.kw === k),
      relevance: k.includes("organic") || k.includes("verdant") ? "High" : h % 3 === 0 ? "Medium" : "High",
      conversion: intent === "transactional" ? "High" : intent === "commercial" ? "Medium" : "Low",
      coverage: published ? "Covered" : ARTICLES.some((a) => a.kw === k) ? "Planned" : "Missing",
    };
  });
}

export function getFallbackContent() {
  const today = new Date();
  return ARTICLES.map((a, idx) => {
    const type = a.type ?? "article";
    const brief = makeBrief(a.kw, "Verdant Botanics", inferIntent(a.kw));
    brief.proposedTitle = a.title;
    brief.metaTitle = `${a.title} | Verdant Botanics`.slice(0, 60);
    brief.approved = !["idea", "planned"].includes(a.status);
    const generated = !["idea", "planned", "brief"].includes(a.status);
    const sections: Section[] =
      a.status === "idea" || a.status === "planned"
        ? []
        : brief.outline.map((h, i) => ({
          id: `s${idx}-${i}`,
          heading: h,
          body: generated ? mockSectionText({ keyword: a.kw, heading: h, index: i, business: "Verdant Botanics", questions: brief.questions }) : "",
          status: generated ? "done" : "empty",
        }));
    const slug = slugify(a.title);
    const published = a.status === "published";
    return {
      id: idx + 1,
      type,
      title: a.title,
      slug,
      primaryKeyword: a.kw,
      secondaryKeywords: brief.secondaryKeywords,
      topicGroupId: a.tg,
      format: a.format,
      intent: inferIntent(a.kw),
      owner: OWNERS[idx % 3],
      reviewer: OWNERS[(idx + 1) % 3],
      status: a.status,
      targetDate: format(addDays(today, a.day), "yyyy-MM-dd"),
      destination: "WordPress",
      metaTitle: brief.metaTitle,
      metaDescription: brief.metaDescription,
      brief: a.status === "idea" || a.status === "planned" ? null : brief,
      sections,
      featuredImage: generated
        ? { prompt: `Editorial photo of botanical skincare, soft daylight — ${a.title}`, seed: idx + 3, alt: `Illustration for ${a.title}`, caption: "", ratio: "16:9", position: "top" as const }
        : null,
      versions: published ? [{ version: 1, at: addDays(today, a.day).toISOString(), note: "Published", title: a.title, sections }] : [],
      publishedVersion: published ? 1 : 0,
      externalUrl: published ? `https://verdantbotanics.com/${type === "page" ? "" : "blog/"}${slug}` : null,
      cmsId: published ? `wp_${(hash(slug) % 1e8).toString(16)}` : null,
      imported: false,
      updatedAt: today.toISOString(),
      createdAt: today.toISOString(),
      words: sectionsWords(sections),
    };
  });
}

export async function seedDatabase() {
  try {
    const [{ value }] = await db.select({ value: count() }).from(workspaces);
    if (value > 0) return;

    await db.insert(workspaces).values(DEFAULT_WORKSPACE);

    await db.insert(topicGroups).values([
      { name: "Organic Skincare", description: "Core category: what organic skincare is, how to buy it and use it.", pillarTitle: "The Complete Guide to Organic Skincare" },
      { name: "Skincare by Skin Type", description: "Routines and product guidance for specific skin concerns.", pillarTitle: "The Skin Type Handbook: Find Your Routine" },
      { name: "Natural Ingredients", description: "Plain-English explainers for the ingredients on the label.", pillarTitle: "Skincare Ingredients Explained" },
    ]);

    const kwRows = KEYWORDS.map(([k, tg]) => {
      const h = hash(k);
      const intent = inferIntent(k);
      const volume = Math.round((40 + (h % 9000)) / 10) * 10;
      const difficulty = 12 + (h % 70);
      const published = ARTICLES.find((a) => a.kw === k && a.status === "published");
      const position = published ? 2 + (h % 18) : h % 5 === 0 ? 14 + (h % 40) : null;
      const feats = [(h % 3 === 0 ? ["Featured snippet"] : []), (h % 4 === 0 ? ["AI Overview"] : []), (h % 5 === 0 ? ["People also ask"] : [])].flat();
      return {
        keyword: k,
        volume,
        difficulty,
        intent,
        position,
        serpFeatures: feats,
        targetUrl: published ? `/blog/${slugify(published.title)}` : "",
        topicGroupId: tg,
        tracked: !!published || h % 4 === 0,
        inPlanner: ARTICLES.some((a) => a.kw === k),
        relevance: k.includes("organic") || k.includes("verdant") ? "High" : h % 3 === 0 ? "Medium" : "High",
        conversion: intent === "transactional" ? "High" : intent === "commercial" ? "Medium" : "Low",
        coverage: published ? "Covered" : ARTICLES.some((a) => a.kw === k) ? "Planned" : "Missing",
      };
    });
    await db.insert(keywords).values(kwRows);

    const today = new Date();
    const items = ARTICLES.map((a, idx) => {
      const type = a.type ?? "article";
      const brief = makeBrief(a.kw, "Verdant Botanics", inferIntent(a.kw));
      brief.proposedTitle = a.title;
      brief.metaTitle = `${a.title} | Verdant Botanics`.slice(0, 60);
      brief.approved = !["idea", "planned"].includes(a.status);
      const generated = !["idea", "planned", "brief"].includes(a.status);
      const sections: Section[] =
        a.status === "idea" || a.status === "planned"
          ? []
          : brief.outline.map((h, i) => ({
            id: `s${idx}-${i}`,
            heading: h,
            body: generated ? mockSectionText({ keyword: a.kw, heading: h, index: i, business: "Verdant Botanics", questions: brief.questions }) : "",
            status: generated ? "done" : "empty",
          }));
      const slug = slugify(a.title);
      const published = a.status === "published";
      return {
        type,
        title: a.title,
        slug,
        primaryKeyword: a.kw,
        secondaryKeywords: brief.secondaryKeywords,
        topicGroupId: a.tg,
        format: a.format,
        intent: inferIntent(a.kw),
        owner: OWNERS[idx % 3],
        reviewer: OWNERS[(idx + 1) % 3],
        status: a.status,
        targetDate: format(addDays(today, a.day), "yyyy-MM-dd"),
        destination: "WordPress",
        metaTitle: brief.metaTitle,
        metaDescription: brief.metaDescription,
        brief: a.status === "idea" || a.status === "planned" ? null : brief,
        sections,
        featuredImage: generated
          ? { prompt: `Editorial photo of botanical skincare, soft daylight — ${a.title}`, seed: idx + 3, alt: `Illustration for ${a.title}`, caption: "", ratio: "16:9", position: "top" as const }
          : null,
        versions: published ? [{ version: 1, at: addDays(today, a.day).toISOString(), note: "Published", title: a.title, sections }] : [],
        publishedVersion: published ? 1 : 0,
        externalUrl: published ? `https://verdantbotanics.com/${type === "page" ? "" : "blog/"}${slug}` : null,
        cmsId: published ? `wp_${(hash(slug) % 1e8).toString(16)}` : null,
        imported: false,
      };
    });
    void sectionsWords;
    await db.insert(contentItems).values(items);
  } catch (err) {
    console.warn("Could not query or seed database (offline or permissions):", err instanceof Error ? err.message : err);
  }
}

let seeding: Promise<void> | null = null;
export async function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = seedDatabase().catch((e) => {
      console.warn("Database seeding failed:", e instanceof Error ? e.message : e);
      seeding = null;
    });
  }
  return seeding;
}
