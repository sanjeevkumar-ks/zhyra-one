import type { ContentBrief, Intent, Section } from "@/lib/types";

/**
 * AIWriter — typed interface with a deterministic mock implementation.
 * A real provider (OpenAI, Anthropic, …) can be swapped in behind the same interface.
 * The mock never invents statistics, citations or testimonials: where first-hand
 * information is needed it inserts a clearly marked [placeholder].
 */
export interface AIWriter {
  generateSection(ctx: GenCtx): Promise<string>;
  refine(action: RefineAction, text: string, ctx: GenCtx): Promise<string>;
}

export interface GenCtx {
  keyword: string;
  heading: string;
  index: number;
  business: string;
  tone?: string[];
  questions?: string[];
}

export type RefineAction =
  | "conversational"
  | "examples"
  | "simplify"
  | "authoritative"
  | "table"
  | "faqs"
  | "repetition"
  | "verify"
  | "keyword";

export const REFINE_ACTIONS: { id: RefineAction; label: string }[] = [
  { id: "conversational", label: "Make more conversational" },
  { id: "examples", label: "Add practical examples" },
  { id: "simplify", label: "Simplify" },
  { id: "authoritative", label: "Make more authoritative" },
  { id: "table", label: "Add comparison table" },
  { id: "faqs", label: "Add FAQs" },
  { id: "repetition", label: "Reduce repetition" },
  { id: "keyword", label: "Include target keyword naturally" },
  { id: "verify", label: "Verify claims" },
];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function sectionsWords(sections: Section[]): number {
  return sections.reduce((n, s) => n + wordCount(s.body), 0);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function mockSectionText(ctx: GenCtx): string {
  const kw = ctx.keyword || "this topic";
  const h = ctx.heading.toLowerCase();
  if (ctx.index === 0 || h.startsWith("what is") || h.includes("introduction")) {
    return `${cap(kw)} comes up often when people start researching their options, and the answer depends on what you actually need. In this guide, ${ctx.business} walks through the basics in plain language so you can make a confident decision.\n\nThe short answer: ${kw} is best approached by understanding your own situation first, then comparing options against a clear set of criteria. The sections below explain how.\n\n[Add a first-hand insight from your team here — what do customers most often get wrong about ${kw}?]`;
  }
  if (h.includes("faq") || h.includes("question")) {
    const qs = (ctx.questions ?? []).slice(0, 3);
    const list = (qs.length ? qs : [`What should I know before choosing ${kw}?`, `How long does it take to see results with ${kw}?`]).map(
      (q) => `**${q}**\nGive the direct answer in one or two sentences, then add context. [Verify this answer against your product information before publishing.]`,
    );
    return list.join("\n\n");
  }
  if (h.includes("compar") || h.includes("vs") || h.includes("best") || h.includes("choose")) {
    return `Choosing well comes down to a few criteria you can check yourself:\n\n- **Fit for your needs:** does it address the specific problem you are trying to solve?\n- **Transparency:** is the information about what is included clear and easy to verify?\n- **Value over time:** consider ongoing cost, not just the first purchase.\n- **Support and returns:** what happens if it is not right for you?\n\n| Criteria | What to look for | Where to verify |\n| --- | --- | --- |\n| Fit | Matches your situation | Product page, reviews |\n| Transparency | Clear details | Label or documentation |\n| Value | Fair over time | Your own comparison |`;
  }
  if (h.includes("conclusion") || h.includes("next step") || h.includes("summary")) {
    return `${cap(kw)} does not have to be complicated. Start with a clear understanding of what you need, compare options against the criteria above, and revisit your choice as your needs change.\n\nIf you would like help, ${ctx.business} is happy to answer questions. [Add your preferred call to action and link here.]`;
  }
  if (h.includes("mistake") || h.includes("avoid")) {
    return `A few common mistakes are easy to avoid:\n\n- Skipping the basics and jumping straight to advanced options.\n- Changing too many things at once, which makes it hard to tell what worked.\n- Relying on a single source of information without checking it.\n\nTake one step at a time and keep notes on what you change.`;
  }
  if (h.includes("benefit") || h.includes("why")) {
    return `There are several practical reasons to care about ${kw}:\n\n- It helps you make decisions based on evidence rather than guesswork.\n- It saves time by narrowing down options early.\n- It makes it easier to explain your choice to others.\n\n[Add a specific example or customer scenario from your own experience — avoid unverified claims.]`;
  }
  return `${cap(ctx.heading)} is an important part of ${kw}. Start by defining what success looks like for you, then work through the details one step at a time.\n\nHere is a simple way to approach it: identify the main factors, compare them side by side, and note what is still uncertain. Where you need numbers or research, link directly to the original source rather than paraphrasing from memory. [Add expertise: what does your team do differently here?]`;
}

const REPLACEMENTS: [RegExp, string][] = [
  [/\bHowever,/g, "That said,"],
  [/\bAdditionally,/g, "Also,"],
  [/\bFurthermore,/g, "Plus,"],
  [/\bIt is\b/g, "It's"],
  [/\bdo not\b/g, "don't"],
  [/\bcannot\b/g, "can't"],
  [/\byou will\b/g, "you'll"],
];

export function findUnverifiedClaims(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.filter(
    (s) =>
      (/\d+(\.\d+)?\s?(%|percent|x\b)/i.test(s) || /\b(studies show|research shows|according to|clinically|proven|guaranteed|best in)\b/i.test(s)) &&
      !/\[(source|verified)/i.test(s) &&
      !/https?:\/\//.test(s),
  );
}

export function mockRefine(action: RefineAction, text: string, ctx: GenCtx): string {
  const kw = ctx.keyword || "this topic";
  switch (action) {
    case "conversational": {
      let out = text;
      for (const [re, rep] of REPLACEMENTS) out = out.replace(re, rep);
      return out.replace(/^(\w)/, (m) => m) + (out.includes("Here's the thing") ? "" : "\n\nHere's the thing: you don't need to get everything right on day one.");
    }
    case "examples":
      return `${text}\n\nFor example, someone researching ${kw} might begin with one small change, track what happens for a few weeks, and only then add more. [Replace with a real example from your customers or your own testing.]`;
    case "simplify":
      return text
        .replace(/\butili[sz]e\b/g, "use")
        .replace(/\bin order to\b/g, "to")
        .replace(/\bsubsequently\b/g, "then")
        .replace(/\bapproximately\b/g, "about")
        .split(/(?<=[.!?])\s+/)
        .map((s) => {
          const words = s.split(" ");
          if (words.length > 26 && s.includes(", ")) return s.replace(/, (?=[a-z])/, ". ").replace(/\.\s([a-z])/, (_, c: string) => `. ${c.toUpperCase()}`);
          return s;
        })
        .join(" ");
    case "authoritative": {
      const out = text
        .replace(/\b(might|perhaps|maybe|possibly)\b\s?/gi, "")
        .replace(/\bI think\b/gi, "Our view is")
        .replace(/\bmay\b/g, "can");
      return `${out}\n\n[Add first-hand expertise: who on your team has direct experience with ${kw}, and what have they learned?]`;
    }
    case "table":
      return `${text}\n\n| Option | Best for | Things to check |\n| --- | --- | --- |\n| Option A | [Describe audience] | [Add verified detail] |\n| Option B | [Describe audience] | [Add verified detail] |`;
    case "faqs": {
      const qs = (ctx.questions ?? []).slice(0, 2);
      const items = (qs.length ? qs : [`What is the best way to start with ${kw}?`, `Is ${kw} right for everyone?`]).map(
        (q) => `**${q}**\n[Write a direct, verified answer in one or two sentences.]`,
      );
      return `${text}\n\n### Frequently asked questions\n\n${items.join("\n\n")}`;
    }
    case "repetition": {
      const seen = new Set<string>();
      const parts = text.split(/\n\n/).map((para) =>
        para
          .split(/(?<=[.!?])\s+/)
          .filter((s) => {
            const k = s.trim().toLowerCase();
            if (k.length < 20) return true;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .join(" "),
      );
      return parts.filter(Boolean).join("\n\n").replace(/\b(\w+)\s+\1\b/gi, "$1");
    }
    case "keyword":
      return text.toLowerCase().includes(kw.toLowerCase())
        ? text
        : text.replace(/^([^.!?]*[.!?])/, `$1 This is especially relevant if you are exploring ${kw}.`);
    case "verify": {
      const claims = findUnverifiedClaims(text);
      let out = text;
      for (const c of claims) out = out.replace(c, `${c} [Unverified — add source]`);
      return out;
    }
  }
}

/** Mock provider (async to mirror a real network call). */
export const mockWriter: AIWriter = {
  async generateSection(ctx) {
    await new Promise((r) => setTimeout(r, 700 + ctx.index * 120));
    return mockSectionText(ctx);
  },
  async refine(action, text, ctx) {
    await new Promise((r) => setTimeout(r, 650));
    return mockRefine(action, text, ctx);
  },
};

export function makeBrief(keyword: string, business: string, intent: Intent = "informational", questions: string[] = []): ContentBrief {
  const kw = keyword || "your topic";
  const title = intent === "commercial" ? `The Best ${cap(kw.replace(/^best\s+/i, ""))}: A Buyer's Guide` : `The Complete Guide to ${cap(kw)}`;
  return {
    audience: "People researching this topic who are not yet sure what to choose.",
    intent,
    primaryKeyword: kw,
    secondaryKeywords: [`${kw} guide`, `how to choose ${kw}`, `${kw} for beginners`],
    questions: questions.length
      ? questions
      : [`What is ${kw}?`, `How do I choose ${kw}?`, `What mistakes should I avoid with ${kw}?`],
    competitorSummary:
      "Top-ranking pages tend to open with a direct definition, then cover selection criteria and common questions. Few include first-hand experience or original examples — an opportunity for differentiation. (Summary is an AI estimate based on SERP structure; validate before relying on it.)",
    proposedTitle: title,
    metaTitle: `${title} | ${business}`.slice(0, 60),
    metaDescription: `Learn what ${kw} means, how to choose well, and which mistakes to avoid. A clear, practical guide from ${business}.`.slice(0, 158),
    outline: [`What is ${kw}?`, "Why it matters", `How to choose ${kw}`, "Common mistakes to avoid", "Frequently asked questions", "Next steps"],
    internalLinks: ["/collections/all", "/blog"],
    references: ["Add a primary source (regulator, study or standards body) for any factual claim"],
    expertise: [
      "What does your team know first-hand that competitors don't?",
      "Which customer question do you hear most often?",
      "Is there original data, testing or a photo you can add?",
    ],
    lengthSuggestion: "1,400–1,900 words — based on the depth of top-ranking pages for this intent (estimate).",
    approved: false,
  };
}
