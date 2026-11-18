/**
 * Website Discovery & Page Classification Engine
 * Discovers website URLs via XML Sitemaps, Navigation Graphs, and Search Console.
 * Classifies pages using multi-signal heuristics (URL structure, Meta, Content, Structured Data).
 */

import type {
  PageType,
  StructuredDataItem,
  WebsiteCrawl,
  WebsitePage,
} from "../website-intelligence-types";

export interface ClassificationRuleResult {
  pageType: PageType;
  confidence: number; // 0 - 100
  matchedSignals: string[];
}

/**
 * Multi-Signal Page Classifier
 * Combines URL path patterns, title/heading keywords, structured data schemas, and content semantics.
 */
export function classifyPage(
  url: string,
  title: string,
  h1: string,
  structuredData: StructuredDataItem[] = [],
  contentPreview: string = ""
): ClassificationRuleResult {
  const path = url.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerH1 = h1.toLowerCase();
  const schemas = structuredData.map((s) => s.type.toLowerCase());
  const text = (contentPreview + " " + lowerTitle + " " + lowerH1).toLowerCase();

  // 1. Homepage
  if (path === "/" || path === "" || path === "https://verdantbotanics.com/" || path === "https://verdantbotanics.com") {
    return {
      pageType: "Homepage",
      confidence: 100,
      matchedSignals: ["Root URL match", "Site logo canonical link"],
    };
  }

  // 2. Comparison Pages (e.g. bakuchiol-vs-retinol, vs-, compare)
  if (
    path.includes("-vs-") ||
    path.includes("/compare") ||
    lowerTitle.includes(" vs ") ||
    lowerH1.includes(" vs ") ||
    lowerTitle.includes("comparison")
  ) {
    return {
      pageType: "Comparison",
      confidence: 95,
      matchedSignals: ["URL pattern '-vs-' or '/compare'", "Title contains comparison syntax"],
    };
  }

  // 3. FAQ Pages
  if (
    path.includes("/faq") ||
    path.includes("/frequently-asked-questions") ||
    schemas.includes("faqpage") ||
    lowerTitle.includes("frequently asked questions") ||
    lowerTitle.startsWith("faqs")
  ) {
    return {
      pageType: "FAQ",
      confidence: 94,
      matchedSignals: ["URL contains /faq", schemas.includes("faqpage") ? "FAQPage Schema detected" : "Title keyword match"],
    };
  }

  // 4. Product Category / Collection Pages
  if (
    path.includes("/collections/") ||
    path.includes("/category/") ||
    path.includes("/shop/category") ||
    schemas.includes("itemlist") ||
    schemas.includes("collectionpage")
  ) {
    return {
      pageType: "Product Category",
      confidence: 92,
      matchedSignals: ["URL structure '/collections/'", "Multi-product catalog layout"],
    };
  }

  // 5. Individual Product Pages
  if (
    path.includes("/products/") ||
    path.includes("/item/") ||
    schemas.includes("product") ||
    text.includes("add to cart") ||
    text.includes("in stock")
  ) {
    return {
      pageType: "Product",
      confidence: 96,
      matchedSignals: [schemas.includes("product") ? "Product Schema.org markup" : "URL contains /products/", "Cart/Checkout action detected"],
    };
  }

  // 6. Solution / Use-case Pages
  if (
    path.includes("/solutions/") ||
    path.includes("/for/") ||
    lowerTitle.includes("solution for") ||
    lowerTitle.includes("for sensitive skin") ||
    lowerTitle.includes("for eczema") ||
    lowerTitle.includes("barrier repair for")
  ) {
    return {
      pageType: "Solution",
      confidence: 88,
      matchedSignals: ["URL /solutions/ pattern", "Audience condition-targeted terminology"],
    };
  }

  // 7. Use-case Pages
  if (path.includes("/use-cases/") || path.includes("/usecase") || lowerTitle.includes("use case")) {
    return {
      pageType: "Use-case",
      confidence: 90,
      matchedSignals: ["URL /use-cases/ pattern"],
    };
  }

  // 8. Service Pages
  if (
    path.includes("/services/") ||
    schemas.includes("service") ||
    lowerTitle.includes("consultation") ||
    lowerTitle.includes("skin analysis service")
  ) {
    return {
      pageType: "Service",
      confidence: 86,
      matchedSignals: ["URL /services/ path", "Service offering terminology"],
    };
  }

  // 9. Location / Regional Pages
  if (
    path.includes("/locations/") ||
    path.includes("/stores/") ||
    path.includes("/london") ||
    path.includes("/new-york") ||
    schemas.includes("localbusiness")
  ) {
    return {
      pageType: "Location",
      confidence: 90,
      matchedSignals: ["Location path or LocalBusiness Schema"],
    };
  }

  // 10. About Pages
  if (path.includes("/about") || path.includes("/our-story") || lowerTitle.includes("about us") || lowerTitle.includes("our story")) {
    return {
      pageType: "About",
      confidence: 98,
      matchedSignals: ["URL '/about'", "Brand story heading"],
    };
  }

  // 11. Contact Pages
  if (path.includes("/contact") || lowerTitle.includes("contact us") || lowerTitle.includes("get in touch")) {
    return {
      pageType: "Contact",
      confidence: 98,
      matchedSignals: ["URL '/contact'", "Form submission intent"],
    };
  }

  // 12. Resource / Guide Hub Pages
  if (path.includes("/resources") || path.includes("/handbook") || path.includes("/glossary") || path.includes("/guides/")) {
    return {
      pageType: "Resource",
      confidence: 88,
      matchedSignals: ["URL /resources or /handbook", "Educational glossary index"],
    };
  }

  // 13. Blog Articles
  if (
    path.includes("/blog/") ||
    path.includes("/articles/") ||
    path.includes("/journal/") ||
    schemas.includes("article") ||
    schemas.includes("blogposting")
  ) {
    return {
      pageType: "Blog article",
      confidence: 95,
      matchedSignals: ["URL pattern '/blog/' or '/journal/'", schemas.includes("article") ? "Article Schema" : "Editorial heading"],
    };
  }

  // 14. Fallback: Other
  return {
    pageType: "Other",
    confidence: 60,
    matchedSignals: ["General informative page"],
  };
}

/**
 * Robots.txt Rule Validation Simulator
 */
export function evaluateRobotsDirective(url: string): {
  allowed: boolean;
  matchedRule?: string;
} {
  const disallowedPrefixes = [
    "/admin",
    "/checkout",
    "/cart",
    "/account",
    "/search",
    "/collections/sale", // intentionally disallowed in mock to demonstrate crawl discovery
  ];

  for (const prefix of disallowedPrefixes) {
    if (url.startsWith(prefix)) {
      return {
        allowed: false,
        matchedRule: `Disallow: ${prefix}`,
      };
    }
  }

  return { allowed: true };
}

