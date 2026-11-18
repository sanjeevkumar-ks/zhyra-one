import { addDays, format, subDays } from "date-fns";
import { hash } from "@/lib/hash";
import type { Intent } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Search Console style series (SearchConsoleService mock)             */
/* ------------------------------------------------------------------ */
export interface DayPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prevClicks: number;
  prevImpressions: number;
  prevCtr: number;
  prevPosition: number;
}

export function searchSeries(days = 28): DayPoint[] {
  const end = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(end, days - 1 - i);
    const wave = Math.sin(i / 3.2) * 60 + Math.cos(i / 1.7) * 25;
    const trend = i * 9;
    const clicks = Math.round(700 + trend + wave);
    const impressions = Math.round(clicks * (21 + Math.sin(i / 4) * 2));
    const pClicks = Math.round(620 + i * 5 + Math.sin(i / 2.9) * 55);
    const pImp = Math.round(pClicks * (21.5 + Math.cos(i / 5) * 2));
    return {
      date: format(d, "MMM d"),
      clicks,
      impressions,
      ctr: +((clicks / impressions) * 100).toFixed(2),
      position: +(14.8 - i * 0.07 + Math.sin(i / 2) * 0.3).toFixed(1),
      prevClicks: pClicks,
      prevImpressions: pImp,
      prevCtr: +((pClicks / pImp) * 100).toFixed(2),
      prevPosition: +(15.6 - i * 0.02 + Math.cos(i / 2) * 0.3).toFixed(1),
    };
  });
}

export const spark = (seed: string, up = true, n = 14): { v: number }[] => {
  const h = hash(seed);
  return Array.from({ length: n }, (_, i) => ({ v: 20 + (up ? i * 2.2 : -i * 1.4) + ((h >> (i % 12)) % 9) + Math.sin(i + h) * 3 + (up ? 0 : 30) }));
};

export const countries = [
  { name: "India", clicks: 14200 }, { name: "United Kingdom", clicks: 4300 }, { name: "United States", clicks: 3600 },
  { name: "UAE", clicks: 1500 }, { name: "Singapore", clicks: 1200 },
];
export const devices = [{ name: "Mobile", value: 68 }, { name: "Desktop", value: 28 }, { name: "Tablet", value: 4 }];
export const rankDistribution = [
  { bucket: "1–3", count: 34 }, { bucket: "4–10", count: 108 }, { bucket: "11–20", count: 12 + 31 }, { bucket: "21–50", count: 74 }, { bucket: "51+", count: 41 },
];

export interface PageRow {
  url: string; clicks: number; impressions: number; ctr: number; position: number; indexed: boolean; keyword: string; backlinks: number; aiCitations: number; freshness: string; delta: number;
}
const PAGE_URLS: [string, string][] = [
  ["/blog/the-complete-guide-to-organic-skincare", "organic skincare"], ["/blog/organic-skincare-routine-for-beginners", "organic skincare routine for beginners"],
  ["/blog/natural-vs-organic-skincare-whats-the-difference", "natural vs organic skincare"], ["/blog/what-is-organic-skincare-a-plain-english-explainer", "what is organic skincare"],
  ["/blog/organic-skincare-for-oily-skin", "organic skincare for oily skin"], ["/blog/how-to-know-your-skin-type-at-home", "how to know your skin type"],
  ["/blog/skincare-for-sensitive-skin-a-gentle-approach", "skincare for sensitive skin"], ["/blog/what-does-niacinamide-actually-do", "what does niacinamide do"],
  ["/blog/rosehip-oil-benefits-what-to-know", "rosehip oil benefits"], ["/blog/aloe-vera-for-skin-uses-and-cautions", "aloe vera for skin"],
  ["/blog/bakuchiol-vs-retinol-which-should-you-choose", "bakuchiol vs retinol"], ["/blog/best-moisturiser-for-dry-skin-how-to-choose", "best moisturiser for dry skin"],
  ["/collections/organic-face-moisturiser", "organic face moisturiser"], ["/about", "verdant botanics"], ["/collections/serums", "organic face serum"], ["/collections/body-care", "organic body lotion"],
];
export const pageRows: PageRow[] = PAGE_URLS.map(([url, keyword], i) => {
  const h = hash(url);
  const impressions = 4000 + (h % 60000);
  const lowCtr = i % 4 === 2;
  const ctr = lowCtr ? 0.8 + (h % 8) / 10 : 2.2 + (h % 50) / 10;
  return {
    url, keyword, impressions, ctr: +ctr.toFixed(1), clicks: Math.round((impressions * ctr) / 100), position: +(3 + (h % 120) / 10).toFixed(1),
    indexed: i !== 13 && i !== 15, backlinks: 2 + (h % 40), aiCitations: h % 6, freshness: ["2 weeks ago", "1 month ago", "3 months ago", "7 months ago"][h % 4], delta: ((h % 41) - 20),
  };
});

export interface RankRow {
  keyword: string; position: number; previous: number; url: string; location: string; device: string; intent: Intent; features: string[]; trend: { v: number }[];
}
export const rankRows: RankRow[] = pageRows.slice(0, 14).map((p, i) => {
  const h = hash(p.keyword + "r");
  const position = 1 + (h % 24);
  return {
    keyword: p.keyword, position, previous: Math.max(1, position + ((h >> 3) % 9) - 4), url: p.url, location: i % 3 === 0 ? "United Kingdom" : "India", device: i % 4 === 0 ? "Desktop" : "Mobile",
    intent: (["informational", "commercial", "informational", "transactional"] as Intent[])[i % 4], features: h % 3 === 0 ? ["Featured snippet"] : h % 4 === 0 ? ["AI Overview"] : [], trend: spark(p.keyword, position < 10),
  };
});

/* ------------------------------------------------------------------ */
/* Technical audit                                                     */
/* ------------------------------------------------------------------ */
export type Severity = "Critical" | "High" | "Medium" | "Low";
export interface AuditIssue {
  id: number; severity: Severity; title: string; what: string; why: string; fix: string; auto: boolean; urls: string[];
}
const AUDIT: [Severity, string, string, string, string, boolean, number][] = [
  ["Critical", "2 pages return 404 from internal links", "Internal links point to URLs that no longer exist.", "Visitors and crawlers hit dead ends, wasting crawl budget.", "Update the links or add 301 redirects to the closest live page.", false, 2],
  ["Critical", "Product category blocked by robots.txt", "A robots.txt rule disallows /collections/sale.", "Blocked pages can't be crawled, so they won't be understood or ranked properly.", "Remove the Disallow rule or add a noindex tag if intentional.", false, 1],
  ["Critical", "Sitemap contains non-indexable URLs", "XML sitemap lists URLs that redirect or are noindexed.", "Sends mixed signals to search engines.", "Regenerate the sitemap with indexable, canonical URLs only.", true, 7],
  ["Critical", "2 important pages not indexed", "Google reports 'Discovered – currently not indexed'.", "Pages that aren't indexed can't appear in search.", "Improve internal linking and content quality, then request indexing.", false, 2],
  ["High", "4 published articles missing meta descriptions", "No meta description tag found.", "Search engines will generate their own snippet, which may lower click-through.", "Add a unique description of 80–160 characters.", true, 4],
  ["High", "Redirect chain: 3 hops", "/shop → /store → /collections → /collections/all.", "Each hop slows crawling and dilutes link signals.", "Redirect the first URL directly to the final destination.", false, 3],
  ["High", "Duplicate title tags", "Multiple pages share the same <title>.", "Makes it hard for search engines to distinguish pages.", "Write unique, descriptive titles.", true, 6],
  ["High", "Missing H1 on 3 pages", "No H1 element detected.", "The main heading helps users and crawlers understand the page topic.", "Add a single descriptive H1.", true, 3],
  ["High", "Canonical points to a redirected URL", "Canonical tag references a URL that redirects.", "Weakens canonical signals.", "Point canonical to the final live URL.", true, 5],
  ["High", "Largest Contentful Paint over 4s on mobile", "Hero image is unoptimised.", "Slow pages frustrate users and may affect page experience.", "Compress and serve responsive images; preload the hero.", false, 9],
  ["High", "Structured data error: Product missing offers", "Product schema lacks price/availability.", "Page may not be eligible for rich results (not guaranteed).", "Add offers with price, currency and availability.", true, 12],
  ["Medium", "Orphan pages (no internal links)", "Pages exist in the sitemap but aren't linked from anywhere.", "Hard for users and crawlers to discover.", "Link from relevant pillar or category pages.", true, 6],
  ["Medium", "Images missing alt text", "Alt attribute is empty.", "Reduces accessibility and image context.", "Add concise descriptive alt text.", true, 41],
  ["Medium", "Title too long (>60 characters)", "Titles likely to be truncated in results.", "Truncated titles may reduce clarity.", "Shorten while keeping the primary topic first.", true, 11],
  ["Medium", "Thin content (<300 words)", "Pages offer little unique information.", "Pages without substance rarely satisfy intent.", "Expand with helpful, original information.", false, 5],
  ["Medium", "Mixed content on checkout assets", "HTTP resources loaded on HTTPS page.", "Browsers may block them.", "Serve all assets over HTTPS.", false, 2],
  ["Medium", "Pagination without clear canonical", "Paginated archives lack self-referencing canonicals.", "May cause duplicate-content ambiguity.", "Add self-referencing canonicals to each page.", true, 8],
  ["Medium", "Missing Organization schema", "No Organization structured data on the homepage.", "Entity details are less explicit for machines.", "Add Organization schema with name, logo and sameAs.", true, 1],
  ["Medium", "Missing BreadcrumbList schema", "Breadcrumbs exist visually but not as structured data.", "Helps describe site hierarchy; display not guaranteed.", "Add BreadcrumbList JSON-LD.", true, 24],
  ["Medium", "Low internal links to pillar page", "Pillar page receives few contextual links.", "Weak topical signals for the cluster.", "Link supporting articles to the pillar with descriptive anchors.", true, 3],
  ["Low", "Meta description too short", "Descriptions under 70 characters.", "Missed opportunity to explain the page.", "Expand to 120–155 characters.", true, 9],
  ["Low", "Non-descriptive anchor text", "Links labelled 'click here'.", "Descriptive anchors help users and crawlers.", "Rewrite anchors to describe the destination.", true, 14],
  ["Low", "Multiple H1 tags", "More than one H1 on the page.", "Can blur page hierarchy.", "Keep one H1; downgrade others to H2.", true, 4],
  ["Low", "URL contains uppercase characters", "Mixed-case URLs found.", "Can create duplicate URL variants.", "Use lowercase and redirect variants.", false, 3],
  ["Low", "Missing hreflang for UK/IN variants", "Regional pages lack hreflang.", "Wrong regional version may be shown.", "Add hreflang annotations.", false, 6],
  ["Low", "Large unused JavaScript", "Third-party scripts block rendering.", "Slows interaction.", "Defer or remove unused scripts.", false, 1],
  ["Low", "Favicon missing in some sizes", "Only 16px favicon provided.", "Poor branding in some browsers.", "Provide 32px and 180px icons.", false, 1],
  ["Low", "Open Graph image missing", "No og:image on 8 articles.", "Weaker social previews.", "Add featured images as og:image.", true, 8],
  ["Low", "Outdated copyright year in footer", "Footer shows the previous year.", "Minor trust signal.", "Update the footer template.", false, 1],
  ["Low", "HTTP link to external source", "Link points to http:// version.", "Insecure link.", "Update to https.", true, 3],
];
export const auditIssues: AuditIssue[] = AUDIT.map(([severity, title, what, why, fix, auto, n], i) => ({
  id: i + 1, severity, title, what, why, fix, auto,
  urls: Array.from({ length: Math.min(n, 5) }, (_, k) => PAGE_URLS[(i + k) % PAGE_URLS.length][0]),
}));

/* ------------------------------------------------------------------ */
/* AI visibility                                                       */
/* ------------------------------------------------------------------ */
export const AI_PLATFORMS = ["ChatGPT", "Google AI", "Perplexity", "Copilot", "Gemini"] as const;
export type AIPlatform = (typeof AI_PLATFORMS)[number];
const BRANDS = ["Verdant Botanics", "Kama Ayurveda", "Typology", "The Ordinary", "Forest Essentials", "Mamaearth"];

const Q: [string, string, Intent][] = [
  ["What are the best organic skincare brands in India?", "Organic skincare", "commercial"],
  ["Which organic moisturiser is suitable for sensitive skin?", "Skin types", "commercial"],
  ["What ingredients should I look for in natural skincare products?", "Ingredients", "informational"],
  ["Is organic skincare better than conventional skincare?", "Organic skincare", "informational"],
  ["How do I build a simple organic skincare routine?", "Organic skincare", "informational"],
  ["What's the difference between natural and organic skincare?", "Organic skincare", "informational"],
  ["Best organic face serum for oily skin?", "Skin types", "commercial"],
  ["Is niacinamide safe for sensitive skin?", "Ingredients", "informational"],
  ["Where can I buy certified organic skincare online?", "Organic skincare", "transactional"],
  ["What is bakuchiol and is it a good retinol alternative?", "Ingredients", "informational"],
  ["How do I know my skin type?", "Skin types", "informational"],
  ["Best moisturiser for dry skin in winter?", "Skin types", "commercial"],
  ["Are essential oils safe in skincare?", "Ingredients", "informational"],
  ["Which natural sunscreen is best for sensitive skin?", "Skin types", "commercial"],
  ["How to read a skincare ingredient label?", "Ingredients", "informational"],
  ["Is rosehip oil good for oily skin?", "Ingredients", "informational"],
  ["What are the best skincare gift sets?", "Organic skincare", "commercial"],
  ["How do I repair my skin barrier naturally?", "Skin types", "informational"],
  ["Best natural cleanser for acne-prone skin?", "Skin types", "commercial"],
  ["Does organic skincare expire faster?", "Organic skincare", "informational"],
  ["What does hyaluronic acid do for skin?", "Ingredients", "informational"],
  ["Are plant-based skincare brands cruelty free?", "Organic skincare", "informational"],
  ["Which brands sell fragrance-free organic moisturiser?", "Skin types", "commercial"],
  ["What is squalane and who should use it?", "Ingredients", "informational"],
  ["How to choose a serum for combination skin?", "Skin types", "informational"],
  ["Is aloe vera gel good for daily face use?", "Ingredients", "informational"],
  ["Best organic body lotion brands?", "Organic skincare", "commercial"],
  ["What skincare ingredients should not be mixed?", "Ingredients", "informational"],
  ["Is vitamin C serum safe for beginners?", "Ingredients", "informational"],
  ["Top organic skincare subscription boxes?", "Organic skincare", "commercial"],
  ["How often should I exfoliate sensitive skin?", "Skin types", "informational"],
  ["What are ceramides and why do they matter?", "Ingredients", "informational"],
  ["Best natural alternatives to retinol?", "Ingredients", "commercial"],
  ["Do I need a different routine for night and day?", "Skin types", "informational"],
  ["Which Indian brands make organic face wash?", "Organic skincare", "commercial"],
  ["Is shea butter good for the face?", "Ingredients", "informational"],
  ["What is a skincare routine for teenagers?", "Skin types", "informational"],
  ["Are organic skincare certifications trustworthy?", "Organic skincare", "informational"],
  ["How to patch test a new skincare product?", "Skin types", "informational"],
  ["Verdant Botanics reviews — is it worth it?", "Organic skincare", "navigational"],
];
const SOURCE_DOMAINS: [string, string][] = [
  ["healthline.com", "Publisher"], ["reddit.com", "Community"], ["aad.org", "Authority body"], ["byrdie.com", "Publisher"], ["nykaa.com", "Retailer"],
  ["youtube.com", "Video"], ["vogue.in", "Publisher"], ["verdantbotanics.com", "Your site"], ["wikipedia.org", "Reference"], ["sephora.com", "Retailer"],
];
export interface AICheck {
  id: number; question: string; topic: string; intent: Intent; platform: AIPlatform; mention: boolean; cited: boolean; position: number | null; competitors: string[]; sources: string[]; citedUrl: string | null; lastChecked: string; trend: "up" | "down" | "flat"; snippet: string;
}
export const aiChecks: AICheck[] = Q.map(([question, topic, intent], i) => {
  const h = hash(question);
  const platform = AI_PLATFORMS[h % 5];
  const mention = h % 10 < 4;
  const cited = mention && h % 3 !== 0;
  const comps = BRANDS.slice(1).filter((_, k) => (h >> k) % 3 === 0).slice(0, 3);
  const srcs = SOURCE_DOMAINS.filter((_, k) => (h >> (k + 1)) % 3 === 0).map((s) => s[0]).slice(0, 4);
  if (cited && !srcs.includes("verdantbotanics.com")) srcs.unshift("verdantbotanics.com");
  return {
    id: i + 1, question, topic, intent, platform, mention, cited, position: mention ? 1 + (h % 4) : null, competitors: comps, sources: srcs,
    citedUrl: cited ? PAGE_URLS[h % 12][0] : null, lastChecked: format(subDays(new Date(), h % 6), "MMM d, HH:mm"), trend: (["up", "down", "flat"] as const)[h % 3],
    snippet: mention
      ? `…popular options include ${["Verdant Botanics", ...comps].slice(0, 3).join(", ")}. ${"Verdant Botanics"} is often mentioned for gentle, plant-based formulas…`
      : `…commonly recommended brands include ${comps.slice(0, 3).join(", ") || "The Ordinary"}. Look for fragrance-free formulas and patch test first…`,
  };
});

export const aiSummary = (() => {
  const mentions = aiChecks.filter((c) => c.mention).length;
  const cited = aiChecks.filter((c) => c.cited).length;
  return { total: aiChecks.length, mentions, citations: cited, rate: Math.round((mentions / aiChecks.length) * 100), citedPages: new Set(aiChecks.filter((c) => c.citedUrl).map((c) => c.citedUrl)).size };
})();

export const aiTrend = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`, mentions: 8 + Math.round(i * 0.9 + Math.sin(i) * 1.5), citations: 4 + Math.round(i * 0.6 + Math.cos(i) * 1.2), rate: 18 + Math.round(i * 1.3 + Math.sin(i / 1.5) * 2),
}));
export const aiByPlatform = AI_PLATFORMS.map((p) => {
  const rows = aiChecks.filter((c) => c.platform === p);
  return { platform: p, checks: rows.length, mention: rows.length ? Math.round((rows.filter((r) => r.mention).length / rows.length) * 100) : 0, citation: rows.length ? Math.round((rows.filter((r) => r.cited).length / rows.length) * 100) : 0 };
});
export const aiTopics = ["Organic skincare", "Skin types", "Ingredients"].map((t) => {
  const rows = aiChecks.filter((c) => c.topic === t);
  return { topic: t, questions: rows.length, mention: Math.round((rows.filter((r) => r.mention).length / rows.length) * 100), citation: Math.round((rows.filter((r) => r.cited).length / rows.length) * 100), topPage: PAGE_URLS[hash(t) % 6][0], competitors: BRANDS.slice(1, 4 + (hash(t) % 2)), missing: 3 + (hash(t) % 4) };
});
export const aiCompetitors = BRANDS.map((b) => {
  const h = hash(b + "c");
  const mention = b === "Verdant Botanics" ? aiSummary.rate : 14 + (h % 38);
  return { brand: b, mention, citation: Math.max(2, Math.round(mention * (0.35 + (h % 4) / 10))), platforms: AI_PLATFORMS.filter((_, k) => (h >> k) % 2 === 0).slice(0, 3), you: b === "Verdant Botanics" };
}).sort((a, b) => b.mention - a.mention);
export const aiSources = SOURCE_DOMAINS.map(([domain, type]) => {
  const h = hash(domain);
  return { domain, type, appearances: 4 + (h % 40), questions: 2 + (h % 12), brands: BRANDS.slice(0, 2 + (h % 3)), opportunity: type === "Your site" ? "Strengthen cited pages" : type === "Publisher" ? "Pitch expert commentary" : type === "Community" ? "Participate helpfully (manual)" : type === "Retailer" ? "Optimise listings" : "Earn a reference" };
}).sort((a, b) => b.appearances - a.appearances);
export const outsideSources = [
  { domain: "byrdie.com", type: "Editorial", context: "Mentioned in a roundup of gentle moisturisers", sentiment: "Positive", backlink: true, citations: 6, date: "Mar 2", credibility: "High" },
  { domain: "reddit.com/r/IndianSkincareAddicts", type: "Community", context: "Thread comparing organic serums", sentiment: "Neutral", backlink: false, citations: 9, date: "Feb 21", credibility: "Community" },
  { domain: "nykaa.com", type: "Retailer", context: "Product reviews on Verdant range", sentiment: "Positive", backlink: true, citations: 3, date: "Feb 14", credibility: "Medium" },
  { domain: "trustpilot.com", type: "Review site", context: "Customer reviews of delivery and quality", sentiment: "Mixed", backlink: true, citations: 2, date: "Feb 10", credibility: "Medium" },
  { domain: "vogue.in", type: "Editorial", context: "Brand named among emerging clean-beauty labels", sentiment: "Positive", backlink: false, citations: 4, date: "Jan 29", credibility: "High" },
  { domain: "youtube.com", type: "Video", context: "Creator review of the moisturiser range", sentiment: "Neutral", backlink: false, citations: 1, date: "Jan 18", credibility: "Medium" },
];

/* ------------------------------------------------------------------ */
/* Authority                                                           */
/* ------------------------------------------------------------------ */
export const authority = {
  referringDomains: 1284, rdDelta: 12.4, newBacklinks: 86, lostBacklinks: 31,
  backlinkTrend: Array.from({ length: 12 }, (_, i) => ({ m: `M${i + 1}`, rd: 900 + i * 32 + Math.round(Math.sin(i) * 18) })),
  topicCoverage: [{ topic: "Industry expertise", pct: 82 }, { topic: "Product education", pct: 64 }, { topic: "Comparisons", pct: 38 }, { topic: "Customer problems", pct: 56 }],
  brand: { unlinked: 23, reviews: "4.4 average across 3 review sites (reported by the sites)", nap: "Name, address, phone consistent on 7 of 9 listings" },
  recs: [
    { title: "Build a missing supporting article", detail: "Comparisons topic is only 38% covered.", action: "Create content", href: "/articles/new" },
    { title: "Improve a weak pillar page", detail: "Skin Type Handbook has few internal links.", action: "Improve article", href: "/topic-groups/2" },
    { title: "Earn mentions from industry publications", detail: "23 unlinked brand mentions — ask for links.", action: "View outside sources", href: "/ai-visibility/outside-sources" },
    { title: "Fix broken backlinks", detail: "31 backlinks lost, 9 point to 404 pages.", action: "Inspect page", href: "/seo/backlinks" },
  ],
};
export const backlinks = [
  { domain: "byrdie.com", url: "/blog/the-complete-guide-to-organic-skincare", anchor: "organic skincare guide", status: "New", relevance: "High" },
  { domain: "healthline.com", url: "/blog/what-does-niacinamide-actually-do", anchor: "niacinamide explained", status: "Active", relevance: "High" },
  { domain: "nykaa.com", url: "/collections/organic-face-moisturiser", anchor: "Verdant moisturiser", status: "Active", relevance: "Medium" },
  { domain: "blogspot.example", url: "/", anchor: "click here", status: "Lost", relevance: "Low" },
  { domain: "vogue.in", url: "/about", anchor: "Verdant Botanics", status: "New", relevance: "High" },
  { domain: "skinblog.example", url: "/blog/old-ingredient-guide", anchor: "ingredients", status: "Broken", relevance: "Medium" },
];

/* ------------------------------------------------------------------ */
/* AEO                                                                 */
/* ------------------------------------------------------------------ */
export const aeoQuestions = [
  { q: "Is organic skincare safe for sensitive skin?", source: "People also ask", status: "No answer", page: "" },
  { q: "How long does an organic moisturiser last once opened?", source: "AI monitoring", status: "Weak answer", page: "/collections/organic-face-moisturiser" },
  { q: "Can I use niacinamide with vitamin C?", source: "Site search", status: "Competitors cover better", page: "/blog/what-does-niacinamide-actually-do" },
  { q: "What does 'certified organic' mean on a label?", source: "Related searches", status: "No answer", page: "" },
  { q: "Do natural products need patch testing?", source: "Community", status: "Dedicated page could help", page: "" },
  { q: "What order do I apply skincare products?", source: "People also ask", status: "Weak answer", page: "/blog/organic-skincare-routine-for-beginners" },
];
export const answerLibrary = [
  { q: "What is organic skincare?", a: "Skincare made with ingredients grown without synthetic pesticides or fertilisers, and processed under organic standards where certified.", evidence: "Certification body definitions", sources: "USDA, COSMOS-standard", page: "/blog/what-is-organic-skincare-a-plain-english-explainer", reviewed: "Feb 12" },
  { q: "Is natural the same as organic?", a: "No. 'Natural' is not consistently regulated; 'organic' claims typically need certification to be verifiable.", evidence: "Regulatory guidance", sources: "Add source", page: "/blog/natural-vs-organic-skincare-whats-the-difference", reviewed: "Jan 30" },
  { q: "Do you ship to the UK?", a: "Yes — standard delivery is available to UK addresses.", evidence: "Shipping policy", sources: "/shipping", page: "/shipping", reviewed: "Mar 1" },
  { q: "What's your returns policy?", a: "[Needs review — confirm current policy with operations]", evidence: "—", sources: "—", page: "/returns", reviewed: "Overdue" },
];
export const schemaChecks = [
  { type: "Article", state: "pass", detail: "Present on 12 of 12 articles" },
  { type: "Product", state: "attention", detail: "Missing offers on 12 products" },
  { type: "Organization", state: "attention", detail: "Not found on the homepage" },
  { type: "LocalBusiness", state: "na", detail: "Not applicable — online store" },
  { type: "BreadcrumbList", state: "attention", detail: "Missing on 24 pages" },
  { type: "FAQPage", state: "pass", detail: "Used on 3 pages with genuine Q&A" },
  { type: "Service", state: "na", detail: "Not applicable" },
];

/* ------------------------------------------------------------------ */
/* Social                                                              */
/* ------------------------------------------------------------------ */
export const linkedinVariants = (title: string) => [
  { kind: "Educational", text: `Most people read the ingredient list backwards.\n\nWe wrote a plain-English guide to ${title.toLowerCase()} — what the terms mean, and what to check before you buy.\n\nRead it: verdantbotanics.com/blog` },
  { kind: "Founder POV", text: `When we started Verdant, customers kept asking the same question. This article is our honest answer. [Add the founder's own story here.]\n\nverdantbotanics.com/blog` },
  { kind: "Short insight", text: `Simple beats complicated. One change at a time, then measure.\n\nMore in our guide: verdantbotanics.com/blog` },
  { kind: "Carousel outline", text: `Slide 1: The question\nSlide 2: Why it's confusing\nSlide 3: 3 things to check\nSlide 4: Common mistakes\nSlide 5: Read the full guide` },
  { kind: "Discussion question", text: `What's the one skincare ingredient you wish someone had explained sooner? Tell us below — we'll cover the top answers.` },
];
export const redditThreads = [
  { sub: "r/IndianSkincareAddicts", title: "Organic moisturiser for sensitive skin — recommendations?", age: "3h", relevance: "High", rules: "No self-promotion in top-level posts" },
  { sub: "r/SkincareAddiction", title: "Does 'organic' actually matter on labels?", age: "9h", relevance: "High", rules: "Disclose affiliation if relevant" },
  { sub: "r/AsianBeauty", title: "Niacinamide + vitamin C routine order", age: "1d", relevance: "Medium", rules: "Follow weekly thread rules" },
  { sub: "r/IndianSkincareAddicts", title: "Mention: Verdant Botanics serum — anyone tried?", age: "2d", relevance: "Brand mention", rules: "Disclose affiliation when replying" },
];
export const subreddits = [
  { name: "r/IndianSkincareAddicts", members: "Large", fit: "High" }, { name: "r/SkincareAddiction", members: "Very large", fit: "High" }, { name: "r/NaturalBeauty", members: "Medium", fit: "Medium" },
];
export const capabilities: Record<string, Record<string, "available" | "needs-approval" | "unavailable">> = {
  LinkedIn: { "Read profile": "available", "Create post": "available", "Schedule post": "available", "Read analytics": "needs-approval", "Reply to comments": "needs-approval" },
  Reddit: { "Read posts": "available", "Monitor mentions": "available", "Create post": "unavailable", "Schedule post": "unavailable", "Read analytics": "unavailable" },
};

/* ------------------------------------------------------------------ */
/* Integrations catalogue                                              */
/* ------------------------------------------------------------------ */
export interface IntegrationDef {
  id: string; name: string; group: "Website" | "Analytics" | "Social"; enables: string[]; caps: Record<string, boolean>; phase?: string;
}
const cmsCaps = (posts: boolean, pages: boolean, media: boolean, sched: boolean, upd: boolean) => ({ Posts: posts, Pages: pages, Media: media, Scheduling: sched, Updates: upd });
export const integrationCatalog: IntegrationDef[] = [
  { id: "wordpress", name: "WordPress", group: "Website", enables: ["Publish posts and pages", "Upload media", "Categories and tags"], caps: cmsCaps(true, true, true, true, true) },
  { id: "webflow", name: "Webflow", group: "Website", enables: ["Publish CMS collection items", "Supported assets"], caps: cmsCaps(true, false, true, false, true) },
  { id: "shopify", name: "Shopify", group: "Website", enables: ["Publish blog articles", "Supported content resources"], caps: cmsCaps(true, true, true, false, true) },
  { id: "wix", name: "Wix", group: "Website", enables: ["Supported CMS content and publishing APIs"], caps: cmsCaps(true, false, true, false, false) },
  { id: "ghost", name: "Ghost", group: "Website", enables: ["Posts, tags, authors, feature images"], caps: cmsCaps(true, true, true, true, true) },
  { id: "notion", name: "Notion", group: "Website", enables: ["Structured page content", "Website publication depends on your setup"], caps: cmsCaps(true, true, false, false, true) },
  { id: "framer", name: "Framer", group: "Website", enables: ["Supported CMS publishing API or approved integration path"], caps: cmsCaps(true, false, false, false, false) },
  { id: "webhook", name: "Custom webhook", group: "Website", enables: ["Signed payloads to your own backend", "Delivery logs and retries"], caps: cmsCaps(true, true, true, true, true) },
  { id: "gsc", name: "Google Search Console", group: "Analytics", enables: ["Discover real search queries", "Track clicks and impressions", "Find underperforming pages"], caps: { Queries: true, Pages: true, Clicks: true, "Rank tracking": false } },
  { id: "ga4", name: "Google Analytics 4", group: "Analytics", enables: ["Measure organic sessions", "Understand engagement", "Track conversions and revenue"], caps: { Sessions: true, Engagement: true, Conversions: true, "Rank tracking": false } },
  { id: "bing", name: "Bing Webmaster Tools", group: "Analytics", enables: ["Bing search performance", "AI Performance report (where available to your account)"], caps: { Queries: true, "AI citations": true, "Rank tracking": false } },
  { id: "linkedin", name: "LinkedIn", group: "Social", enables: ["Draft and publish posts", "Company analytics need extra approval"], caps: { "Create post": true, Schedule: true, Analytics: false, "Reply to comments": false } },
  { id: "reddit", name: "Reddit", group: "Social", enables: ["Subreddit discovery", "Thread and brand-mention monitoring", "Draft replies (manual posting only)"], caps: { Monitor: true, "Draft replies": true, "Auto-post": false } },
];

export const webhookEvents = ["content.created", "content.updated", "content.scheduled", "content.published", "content.unpublished"];
export const deliveryLog = [
  { id: "d_1042", event: "content.published", status: 200, key: "9f2a1c04e7b81d3a", at: "Today 10:12", attempt: 1 },
  { id: "d_1041", event: "content.updated", status: 200, key: "4be7710aa90c2f55", at: "Today 09:40", attempt: 1 },
  { id: "d_1039", event: "content.scheduled", status: 502, key: "c3d84a0b19ee7a21", at: "Yesterday 17:03", attempt: 3 },
  { id: "d_1038", event: "content.created", status: 200, key: "71ad5f98c2204be6", at: "Yesterday 16:55", attempt: 1 },
];

export const teamMembers = [
  { name: "Sanjeev Kumar", email: "Sanjeev@verdantbotanics.com", role: "Owner" },
  { name: "Arjun Mehta", email: "arjun@verdantbotanics.com", role: "Editor" },
  { name: "Sofia Lind", email: "sofia@verdantbotanics.com", role: "Reviewer" },
  { name: "Dev Patel", email: "dev@verdantbotanics.com", role: "Viewer" },
];

export const competitorGaps = [
  { keyword: "organic skincare for pregnancy", competitor: "typology.com", volume: 880, difficulty: 34, intent: "informational" as Intent },
  { keyword: "best organic sunscreen for face", competitor: "kamaayurveda.com", volume: 2400, difficulty: 52, intent: "commercial" as Intent },
  { keyword: "organic skincare certification india", competitor: "healthline.com", volume: 590, difficulty: 28, intent: "informational" as Intent },
  { keyword: "natural lip balm ingredients", competitor: "typology.com", volume: 720, difficulty: 22, intent: "informational" as Intent },
  { keyword: "vegan vs organic skincare", competitor: "healthline.com", volume: 1300, difficulty: 41, intent: "informational" as Intent },
  { keyword: "buy organic face wash online", competitor: "kamaayurveda.com", volume: 3100, difficulty: 58, intent: "transactional" as Intent },
];

export const questionOpps = [
  { q: "Is organic skincare worth the money?", volume: 1900, source: "People also ask", covered: false },
  { q: "How do I switch to organic skincare?", volume: 720, source: "Related searches", covered: false },
  { q: "Can organic skincare cause breakouts?", volume: 480, source: "AI monitoring", covered: false },
  { q: "What is a purging phase?", volume: 2200, source: "People also ask", covered: true },
  { q: "How long do natural skincare products last?", volume: 590, source: "Community", covered: false },
];

export const notificationsList = [
  "Google Search Console synced 12 minutes ago",
  "2 articles are waiting for your review",
  "AI visibility check completed — 40 questions",
];

export const todayPlus = (n: number) => format(addDays(new Date(), n), "yyyy-MM-dd");
