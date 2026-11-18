import { notFound } from "next/navigation";
import { PageEditorView } from "@/components/pages/page-editor-view";
import {
  INITIAL_DISCOVERED_PAGES,
  INITIAL_PAGE_OPPORTUNITIES,
  createDefaultPageDocument,
} from "@/lib/website-intelligence-data";
import type { PageDocument } from "@/lib/website-intelligence-types";

export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check if it matches an existing inventory page
  const inventoryPage = INITIAL_DISCOVERED_PAGES.find((p) => p.id === id);

  let doc: PageDocument;

  if (inventoryPage) {
    doc = {
      id: inventoryPage.id,
      title: inventoryPage.title,
      pageType: inventoryPage.userOverriddenType || inventoryPage.pageType,
      status: "published",
      primaryKeyword: inventoryPage.primaryKeyword,
      secondaryKeywords: inventoryPage.secondaryKeywords,
      targetAudience: "Discerning consumers looking for plant-powered clean skincare with clinical efficacy.",
      valueProposition: inventoryPage.contentPreview,
      destination: "WordPress",
      sections: [
        {
          id: "sec_hero",
          type: "hero",
          heading: inventoryPage.headings.h1,
          subheading: inventoryPage.headings.h2s[0] || "Formulated with certified botanical bioactives.",
          body: inventoryPage.contentPreview,
          ctaLabel: "Shop Collection",
          ctaUrl: "/collections/serums",
        },
        {
          id: "sec_features",
          type: "features_grid",
          heading: "Key Differentiators & Benefits",
          subheading: "Why choosing plant bio-compatibility transforms skin health.",
          body: "A clean overview of features engineered for maximum biological uptake.",
          bullets: [
            "Cold-Pressed Seed Oils",
            "Zero Artificial Fragrance",
            "Dermatologically Tested",
            "Sustainably Packaged",
          ],
        },
        {
          id: "sec_faq",
          type: "faq_accordion",
          heading: "Frequently Asked Questions",
          subheading: "Common queries regarding formulation, usage, and safety.",
          body: "Learn how to use, pair, and store our botanical formulations.",
          faqItems: [
            {
              question: "Is this suitable for rosacea or eczema-prone complexions?",
              answer: "Yes. All our formulas undergo rigorous HRIPT dermatological patch testing specifically designed to verify hypoallergenic tolerance on highly reactive skin.",
            },
            {
              question: "How long until I see visible results?",
              answer: "Most users notice reduced redness and improved hydration retention within 48 to 72 hours.",
            },
          ],
        },
        {
          id: "sec_cta",
          type: "cta_banner",
          heading: "Experience Calmer, Healthier Skin",
          body: "Discover the restorative power of clean, cold-pressed botanical actives.",
          ctaLabel: "Shop With 30-Day Guarantee",
          ctaUrl: "/collections/serums",
        },
      ],
      seo: {
        slug: inventoryPage.slug,
        seoTitle: inventoryPage.title,
        metaDescription: inventoryPage.metaDescription,
        h1: inventoryPage.headings.h1,
        canonicalUrl: inventoryPage.canonicalUrl,
        noindex: inventoryPage.indexingStatus === "Noindex",
        nofollow: false,
        structuredDataType: "Product",
      },
      updatedAt: inventoryPage.lastCrawledAt,
    };
  } else {
    // Check if it matches an opportunity or fallback to template
    const opp = INITIAL_PAGE_OPPORTUNITIES.find((o) => o.id === id);
    doc = createDefaultPageDocument(opp);
  }

  return <PageEditorView initialDocument={doc} />;
}
