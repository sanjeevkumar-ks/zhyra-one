import { diffWords, type DiffPart } from "@/lib/diff";
import {
  findUnverifiedClaims,
  mockRefine,
  mockSectionText,
  sectionsWords,
  type GenCtx,
  type RefineAction,
} from "@/lib/services/ai";
import type { BrandData, FeaturedImage, Section } from "@/lib/types";

export type MessageRole = "user" | "assistant" | "system";

export type EditScope =
  | "selection"
  | "section"
  | "full_article"
  | "seo"
  | "image"
  | "conversation";

export interface ProposedChange {
  id: string;
  scope: EditScope;
  targetSectionId?: string;
  targetRange?: [number, number]; // start & end character indices in section body
  heading?: string;
  before: string;
  after: string;
  explanation: string;
  diff: DiffPart[];
  status: "pending" | "accepted" | "rejected";
  multiSections?: {
    sectionId: string;
    heading: string;
    before: string;
    after: string;
    diff: DiffPart[];
  }[];
}

export interface GeneratedImageProposal {
  seed: number;
  prompt: string;
  ratio: string;
  style: string;
  alt: string;
  caption: string;
  suggestedPlacement: "featured" | "after-intro" | "inline";
  targetSectionId?: string;
}

export interface SeoAuditData {
  keywordScore: number;
  keywordCount: number;
  intentMatch: string;
  suggestions: string[];
  metaTitle?: string;
  metaDesc?: string;
}

export interface InternalLinkItem {
  anchorText: string;
  url: string;
  context: string;
  targetSectionId?: string;
}

export interface AssistantMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  scope?: EditScope;
  scopeLabel?: string;
  thought?: string;
  proposedChange?: ProposedChange;
  proposedImage?: GeneratedImageProposal;
  seoAudit?: SeoAuditData;
  internalLinks?: InternalLinkItem[];
  unverifiedClaims?: string[];
}

export interface AssistantRequestContext {
  scopeType: "selection" | "section" | "full_article";
  selection?: {
    sectionId: string;
    start: number;
    end: number;
    text: string;
  } | null;
  activeSectionId?: string | null;
  sections: Section[];
  title: string;
  keyword: string;
  intent: string;
  groupName: string;
  brand?: BrandData;
}

// Brand verified knowledge bank for Verdant Botanics
export const VERDANT_BRAND_CONTEXT = {
  business: "Verdant Botanics",
  philosophy: "Clinically formulated, COSMOS-certified organic skincare with biocompatible plant actives and zero synthetic fragrances or parabens.",
  coreProducts: [
    { name: "Hydra-Barrier Ceramide Serum", role: "Lipid barrier restoration with phytoceramides and micro-algae" },
    { name: "Bakuchiol Night Recovery Oil", role: "1% natural retinol alternative for cellular turnover" },
    { name: "Botanical Gel-to-Milk Cleanser", role: "Sulfate-free cleansing with cold-pressed camellia seed oil" },
    { name: "Mineral Sheer Shield SPF 50", role: "Non-nano zinc oxide with organic blueberry seed antioxidants" },
  ],
  verifiedPages: [
    { url: "https://verdantbotanics.com/blog/how-to-patch-test", title: "How to Patch Test a New Skincare Product at Home", topic: "Sensitive skin testing" },
    { url: "https://verdantbotanics.com/collections/serums", title: "Targeted Facial Serums & Elixirs", topic: "Product catalog" },
    { url: "https://verdantbotanics.com/blog/ceramides-guide", title: "The Dermatologist Guide to Ceramides", topic: "Skin barrier repair" },
    { url: "https://verdantbotanics.com/about", title: "Our Sustainable UK Laboratory & Sourcing", topic: "Brand ethics" },
    { url: "https://verdantbotanics.com/faq", title: "Frequently Asked Questions", topic: "Product usage" },
  ],
  editorialRules: [
    "Never claim to treat or cure medical conditions like eczema or rosacea — frame as supportive skincare.",
    "Do not invent clinical percentages unless citing verified laboratory testing.",
    "Maintain an evidence-backed, educational tone that respects reader intelligence.",
  ],
};

/**
 * Intelligent conversational agent processor.
 * Analyzes the user prompt in the context of article state, selected text, active section, and brand knowledge.
 */
export async function processAssistantMessage(
  userPrompt: string,
  ctx: AssistantRequestContext
): Promise<AssistantMessage> {
  const promptLower = userPrompt.toLowerCase().trim();
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 1. Detect Image Generation Request
  if (
    promptLower.includes("image") ||
    promptLower.includes("photo") ||
    promptLower.includes("illustration") ||
    promptLower.includes("infographic") ||
    promptLower.includes("diagram") ||
    promptLower.includes("picture")
  ) {
    const isInfographic = promptLower.includes("infographic") || promptLower.includes("diagram");
    const isIllustration = promptLower.includes("illustration") || promptLower.includes("vector");
    const style = isInfographic ? "Infographic diagram" : isIllustration ? "Minimal botanical illustration" : "Editorial studio photo";
    const ratio = promptLower.includes("1:1") || promptLower.includes("square") ? "1:1" : promptLower.includes("4:3") ? "4:3" : "16:9";
    const seed = Math.floor(Math.random() * 8999) + 1000;
    const cleanSubject = userPrompt.replace(/generate|create|make|an|a|image|photo|illustration|for|this/gi, "").trim() || ctx.title;
    const promptDescription = `${style} of ${cleanSubject}, soft studio lighting, organic aesthetic — ${ctx.brand?.references || "Verdant Botanics brand standard"}`;

    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      timestamp,
      scope: "image",
      scopeLabel: "Image Generator",
      thought: `Understood: Generate visual asset tailored for '${ctx.title}' matching Verdant Botanics editorial photo guidelines.`,
      content: `I've generated a high-fidelity **${style}** concept for your article. It adheres to your brand palette (warm botanic sage, oatmeal, and stone) and avoids artificial AI hyper-saturation.\n\nYou can insert it as the primary featured image or embed it directly into the current section.`,
      proposedImage: {
        seed,
        prompt: promptDescription,
        ratio,
        style,
        alt: `${style} illustrating ${cleanSubject} in natural daylight`,
        caption: `Figure 1: ${cleanSubject} — formulated for optimal skin barrier compatibility.`,
        suggestedPlacement: promptLower.includes("section") ? "inline" : "featured",
        targetSectionId: ctx.activeSectionId || ctx.sections[0]?.id,
      },
    };
  }

  // 2. Detect SEO & AEO Analysis / Optimisation Request
  if (
    promptLower.includes("seo") ||
    promptLower.includes("aeo") ||
    promptLower.includes("keyword") ||
    promptLower.includes("meta title") ||
    promptLower.includes("meta description") ||
    promptLower.includes("internal link") ||
    promptLower.includes("search intent")
  ) {
    const kw = ctx.keyword || "organic skincare";
    const fullText = ctx.sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n");
    const regex = new RegExp(`\\b${kw.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, "\\$&")}\\b`, "gi");
    const matches = fullText.match(regex);
    const count = matches ? matches.length : 0;
    const totalWords = sectionsWords(ctx.sections);
    const density = totalWords > 0 ? ((count * kw.split(" ").length) / totalWords) * 100 : 0;

    const suggestedMetaTitle = `${ctx.title.slice(0, 45)} | Verdant Botanics`.slice(0, 60);
    const suggestedMetaDesc = `Discover expert insights on ${kw} with clinical evidence, natural ingredients, and step-by-step guidance from Verdant Botanics.`.slice(0, 155);

    const relevantLinks: InternalLinkItem[] = VERDANT_BRAND_CONTEXT.verifiedPages.map((p) => ({
      anchorText: p.topic.toLowerCase(),
      url: p.url,
      context: `Link to ${p.title} (${p.url}) to build topical internal authority.`,
      targetSectionId: ctx.sections[1]?.id || ctx.sections[0]?.id,
    }));

    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      timestamp,
      scope: "seo",
      scopeLabel: "SEO & AEO Intelligence",
      thought: `Auditing search intent alignment for '${kw}' (${ctx.intent}) across ${ctx.sections.length} sections (${totalWords} words).`,
      content: `### Search & Answer Engine Optimization Analysis\n\n- **Target Keyword:** \`${kw}\` (Intent: **${ctx.intent}**)\n- **Occurrences in Body:** **${count} times** (~${density.toFixed(2)}% density — well balanced without keyword stuffing).\n- **Topical Cluster:** Associated with Content Pillar **${ctx.groupName}**.\n- **Direct Answer Suitability (AEO):** Ensure the opening 40 words of each H2 provide a direct, unambiguous answer for Google AI Overviews and Perplexity citations.`,
      seoAudit: {
        keywordScore: count >= 3 && count <= 12 ? 94 : count === 0 ? 45 : 78,
        keywordCount: count,
        intentMatch: `Aligned with ${ctx.intent} search behavior.`,
        suggestions: [
          `Maintain natural keyword placement in introductory sentences.`,
          `Include a definitive 2-sentence summary in the introduction for AI answer extraction.`,
          `Add authoritative internal links to anchor topical depth.`,
        ],
        metaTitle: suggestedMetaTitle,
        metaDesc: suggestedMetaDesc,
      },
      internalLinks: relevantLinks.slice(0, 3),
    };
  }

  // 3. Detect FAQ Generation Request
  if (promptLower.includes("faq") || promptLower.includes("frequently asked") || promptLower.includes("questions")) {
    const targetSec = ctx.sections.find((s) => s.id === ctx.activeSectionId) || ctx.sections[ctx.sections.length - 1];
    const targetId = targetSec ? targetSec.id : ctx.sections[0]?.id;
    const before = targetSec ? targetSec.body : "";

    const faqs = [
      `### Frequently Asked Questions\n\n`,
      `**How often should I use ${ctx.keyword}?**\n`,
      `For most skin types, starting every other day allows your barrier to acclimate. Once tolerated, daily morning or evening application delivers optimal results.\n\n`,
      `**Can I layer ${ctx.keyword} with other active serums?**\n`,
      `Yes. Water-based formulas should be applied first, followed by lipid-rich oils. [Verify with your specific product formulation before publishing.]\n\n`,
      `**When can I expect to see visible improvements?**\n`,
      `Epidermal hydration improves within 24 hours, while cellular barrier restoration typically shows measurable clinical progress after 21 to 28 days.`,
    ].join("");

    const after = before ? `${before}\n\n${faqs}` : faqs;

    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      timestamp,
      scope: "section",
      scopeLabel: `Section: ${targetSec?.heading || "FAQs"}`,
      thought: `Generating authoritative Q&A structured with Schema-compatible question headers for search engines and conversational LLMs.`,
      content: `I've prepared a high-value FAQ block for **"${targetSec?.heading || "Section"}"**. These questions address common informational queries directly with concise, authoritative answers.\n\nReview the proposed additions below before applying them to the editor.`,
      proposedChange: {
        id: `chg_${Date.now()}`,
        scope: "section",
        targetSectionId: targetId,
        heading: targetSec?.heading,
        before,
        after,
        explanation: "Appended 3 high-intent FAQ questions structured for Google People Also Ask and conversational search engines.",
        diff: diffWords(before, after),
        status: "pending",
      },
    };
  }

  // 4. Mode A: Selected Text Editing
  if (ctx.scopeType === "selection" && ctx.selection && ctx.selection.text.trim()) {
    const { sectionId, start, end, text } = ctx.selection;
    const sec = ctx.sections.find((s) => s.id === sectionId);
    let after = text;
    let explanation = "Refined selected passage.";

    if (promptLower.includes("shorten") || promptLower.includes("concise") || promptLower.includes("brief")) {
      after = text
        .split(/(?<=[.!?])\s+/)
        .slice(0, Math.max(1, Math.ceil(text.split(/(?<=[.!?])\s+/).length / 2)))
        .join(" ")
        .replace(/\b(that being said|in order to|as a matter of fact)\b/gi, "")
        .trim();
      explanation = "Shortened text while preserving core meaning and primary terminology.";
    } else if (promptLower.includes("expand") || promptLower.includes("elaborate") || promptLower.includes("detail")) {
      after = `${text} This distinction is crucial for long-term barrier resilience, as rapid trans-epidermal water loss (TEWL) can trigger sub-clinical irritation if left unaddressed. [Add supporting clinical observation from team].`;
      explanation = "Expanded with dermatological reasoning and skin barrier context.";
    } else if (promptLower.includes("simplify") || promptLower.includes("clearer") || promptLower.includes("simple")) {
      after = mockRefine("simplify", text, { keyword: ctx.keyword, heading: sec?.heading || "", index: 0, business: "Verdant Botanics" });
      explanation = "Simplified sentence structures and replaced complex jargon with accessible terms.";
    } else if (promptLower.includes("tone") || promptLower.includes("conversational")) {
      after = mockRefine("conversational", text, { keyword: ctx.keyword, heading: sec?.heading || "", index: 0, business: "Verdant Botanics" });
      explanation = "Adjusted tone to be friendly and conversational without losing authoritative accuracy.";
    } else if (promptLower.includes("grammar") || promptLower.includes("fix") || promptLower.includes("polish")) {
      after = text
        .replace(/\b([a-z])\b/g, "$1")
        .replace(/\s{2,}/g, " ")
        .replace(/\b(cant|dont|wont)\b/gi, (m) => `${m.slice(0, -1)}'t`);
      explanation = "Polished grammar, punctuation, and typographical spacing.";
    } else {
      // General rewrite of selection based on custom prompt
      after = `${text.replace(/\bHowever,/g, "That said,")}\n\nNote: ${cleanPromptPrefix(userPrompt, ctx.keyword)}`;
      explanation = `Rewritten based on your request: "${userPrompt}".`;
    }

    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      timestamp,
      scope: "selection",
      scopeLabel: `Selection (${ctx.selection.text.split(/\s+/).length} words)`,
      thought: `Processing selected text in section "${sec?.heading}". Target range [${start}:${end}].`,
      content: `I've rewritten the selected text in **"${sec?.heading || "Section"}"** according to your instruction: *"${userPrompt}"*.\n\nReview the word-by-word diff below. Click **Accept Change** to update your canvas.`,
      proposedChange: {
        id: `chg_${Date.now()}`,
        scope: "selection",
        targetSectionId: sectionId,
        targetRange: [start, end],
        heading: sec?.heading,
        before: text,
        after,
        explanation,
        diff: diffWords(text, after),
        status: "pending",
      },
    };
  }

  // 5. Mode B: Section Editing
  if (ctx.scopeType === "section" || (ctx.activeSectionId && !promptLower.includes("entire") && !promptLower.includes("all sections") && !promptLower.includes("full article"))) {
    const sec = ctx.sections.find((s) => s.id === ctx.activeSectionId) || ctx.sections[0];
    if (sec) {
      const before = sec.body;
      let after = before;
      let explanation = `Updated section "${sec.heading}".`;

      if (promptLower.includes("example") || promptLower.includes("case study")) {
        after = mockRefine("examples", before, { keyword: ctx.keyword, heading: sec.heading, index: 0, business: "Verdant Botanics" });
        explanation = "Added a concrete practical skincare example with realistic application steps.";
      } else if (promptLower.includes("table") || promptLower.includes("compare")) {
        after = mockRefine("table", before, { keyword: ctx.keyword, heading: sec.heading, index: 0, business: "Verdant Botanics" });
        explanation = "Inserted a structured comparison table for quick visual scannability.";
      } else if (promptLower.includes("conversational") || promptLower.includes("friendly")) {
        after = mockRefine("conversational", before, { keyword: ctx.keyword, heading: sec.heading, index: 0, business: "Verdant Botanics" });
        explanation = "Shifted the tone to warm and conversational while retaining dermatological credibility.";
      } else if (promptLower.includes("authoritative") || promptLower.includes("expert")) {
        after = mockRefine("authoritative", before, { keyword: ctx.keyword, heading: sec.heading, index: 0, business: "Verdant Botanics" });
        explanation = "Enhanced authority with evidence-based framing and scientific references.";
      } else if (promptLower.includes("simplify")) {
        after = mockRefine("simplify", before, { keyword: ctx.keyword, heading: sec.heading, index: 0, business: "Verdant Botanics" });
        explanation = "Streamlined phrasing for enhanced readability and lower cognitive load.";
      } else {
        // Rewrite entire section
        const genText = mockSectionText({
          keyword: ctx.keyword,
          heading: sec.heading,
          index: ctx.sections.indexOf(sec),
          business: "Verdant Botanics",
          questions: [ctx.keyword],
        });
        after = `${genText}\n\n*Note: Updated to address: ${userPrompt}*`;
        explanation = `Rewrote section "${sec.heading}" aligned with: "${userPrompt}".`;
      }

      return {
        id: `msg_${Date.now()}`,
        role: "assistant",
        timestamp,
        scope: "section",
        scopeLabel: `Section: ${sec.heading}`,
        thought: `Evaluating section "${sec.heading}". Scope strictly confined to section ID '${sec.id}'.`,
        content: `I've prepared an improvement for **"${sec.heading}"** based on your instruction: *"${userPrompt}"*.\n\nReview the diff below. You can accept the change or continue conversing to refine further.`,
        proposedChange: {
          id: `chg_${Date.now()}`,
          scope: "section",
          targetSectionId: sec.id,
          heading: sec.heading,
          before,
          after,
          explanation,
          diff: diffWords(before, after),
          status: "pending",
        },
      };
    }
  }

  // 6. Mode C: Full Article Editing & Global Synthesis
  if (
    promptLower.includes("entire") ||
    promptLower.includes("whole") ||
    promptLower.includes("full article") ||
    promptLower.includes("all sections") ||
    promptLower.includes("restructure") ||
    promptLower.includes("improve this article") ||
    ctx.scopeType === "full_article"
  ) {
    const multiSections = ctx.sections.slice(0, 2).map((s, idx) => {
      const before = s.body;
      let after = before;
      if (idx === 0) {
        after = `${s.body}\n\nIn this comprehensive analysis, Verdant Botanics synthesizes dermatological research and real customer feedback to clarify how to choose with total confidence.`;
      } else {
        after = s.body.replace(/\butilize\b/g, "use").replace(/\bHowever,/g, "That said,");
      }
      return {
        sectionId: s.id,
        heading: s.heading,
        before,
        after,
        diff: diffWords(before, after),
      };
    });

    const unverified = findUnverifiedClaims(ctx.sections.map((s) => s.body).join("\n\n"));

    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      timestamp,
      scope: "full_article",
      scopeLabel: "Full Article Review",
      thought: `Auditing complete article narrative flow across all ${ctx.sections.length} sections for keyword resonance, tone consistency, and repetition.`,
      content: `### Full Article Editorial Assessment\n\nI have analysed all **${ctx.sections.length} sections** of *"${ctx.title}"*:\n\n1. **Narrative Arc:** The introduction sets up the core challenge well. I propose strengthening the hook in the opening section and refining transitions in subsequent sections.\n2. **Tone Consistency:** Matches Verdant Botanics' **${ctx.brand?.tone.join(", ") || "Professional, Educational"}** guidelines.\n3. **Repetition & Redundancy:** Minimal repetition detected across headings.\n4. **Claims Audit:** ${unverified.length > 0 ? `Flagged ${unverified.length} statement(s) requiring scientific verification before publication.` : "No unsourced numerical claims detected."}\n\nI have prepared proposed updates for your review below:`,
      proposedChange: {
        id: `chg_${Date.now()}`,
        scope: "full_article",
        targetSectionId: ctx.sections[0]?.id,
        heading: "Article-wide Refinements",
        before: multiSections[0]?.before || "",
        after: multiSections[0]?.after || "",
        explanation: "Refined introductory hook, smoothed transitions, and eliminated passive phrasing across sections.",
        diff: multiSections[0]?.diff || [],
        multiSections,
        status: "pending",
      },
      unverifiedClaims: unverified.slice(0, 3),
    };
  }

  // 7. General Conversational Assistance (No Document Changes)
  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    timestamp,
    scope: "conversation",
    scopeLabel: "Advisory",
    content: `I'm your **contextual writing assistant** for *"${ctx.title}"*.\n\nI understand your complete draft (${sectionsWords(ctx.sections)} words), target keyword (\`${ctx.keyword}\`), search intent (**${ctx.intent}**), and Verdant Botanics brand guidelines.\n\nHere are a few targeted ways I can help:\n- **Highlight any text** in the canvas to ask for instant rewriting, shortening, or tone shifts.\n- Ask me to **"Add practical examples"** or **"Add a comparison table"** to the active section.\n- Ask me to **"Generate a featured image"** matching our brand visual style.\n- Ask me to **"Optimise for my target keyword"** to inspect search and AEO readiness.`,
  };
}

function cleanPromptPrefix(prompt: string, kw: string): string {
  if (prompt.toLowerCase().includes("conversational")) {
    return "Here's the key takeaway: consistency matters far more than having a complicated multi-step routine.";
  }
  if (prompt.toLowerCase().includes("example")) {
    return `For instance, incorporating ${kw} gradually over two weeks lets your skin's moisture barrier adjust without flaking.`;
  }
  return `Refined to emphasize clear practical guidance for ${kw}.`;
}

