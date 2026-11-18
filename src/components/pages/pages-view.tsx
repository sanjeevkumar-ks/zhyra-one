"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Page, PageHeader, PageTabs, Table, Td, Th, trClass } from "@/components/ui";
import { toast } from "@/components/ui-client";
import {
  INITIAL_DISCOVERED_PAGES,
  INITIAL_PAGE_OPPORTUNITIES,
  createDefaultPageDocument,
} from "@/lib/website-intelligence-data";
import type {
  PageDocument,
  PageOpportunity,
  PageType,
  WebsitePage,
} from "@/lib/website-intelligence-types";
import { InventoryKpiSummary } from "./inventory-kpi-summary";
import { WebsiteInventoryTable } from "./website-inventory-table";
import { PageOpportunitiesView } from "./page-opportunities-view";
import { PageDetailDrawer } from "./page-detail-drawer";
import { RecrawlModal } from "./recrawl-modal";
import {
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  Layers,
  Plus,
  RotateCw,
  Sparkles,
} from "lucide-react";

interface PagesViewProps {
  initialTab?: "inventory" | "opportunities" | "published";
}

export function PagesView({ initialTab = "inventory" }: PagesViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inventory" | "opportunities" | "published">(initialTab);
  const [pages, setPages] = useState<WebsitePage[]>(INITIAL_DISCOVERED_PAGES);
  const [opportunities, setOpportunities] = useState<PageOpportunity[]>(INITIAL_PAGE_OPPORTUNITIES);
  const [selectedPage, setSelectedPage] = useState<WebsitePage | null>(null);
  const [isRecrawlOpen, setIsRecrawlOpen] = useState(false);
  const [kpiFilter, setKpiFilter] = useState("all");

  // Handler for user overriding page type
  const handleTypeChange = (pageId: string, newType: PageType) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, userOverriddenType: newType } : p))
    );
    if (selectedPage?.id === pageId) {
      setSelectedPage((prev) => (prev ? { ...prev, userOverriddenType: newType } : null));
    }
    toast(`Page classification updated to ${newType}`);
  };

  const handleOpenBuilderWithOpp = (opp: PageOpportunity) => {
    router.push(`/pages/new?opportunityId=${opp.id}`);
  };

  const handleOpenEditor = (pageId: string) => {
    router.push(`/pages/${pageId}`);
  };

  // Filter pages by KPI summary button click
  const displayPages = pages.filter((p) => {
    if (kpiFilter === "indexable") return p.indexingStatus === "Indexable";
    if (kpiFilter === "non_indexable") return p.indexingStatus !== "Indexable";
    if (kpiFilter === "with_traffic") return p.performance.clicks > 0;
    if (kpiFilter === "needs_improvement")
      return (
        p.issues.length > 0 ||
        (p.performance.impressions > 10000 && p.performance.ctr < 4) ||
        p.indexingStatus !== "Indexable"
      );
    if (kpiFilter === "ai_citations") return p.aiVisibility.citedInQuestions > 10;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Section Navigation Tabs & Primary Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <PageTabs
            value={activeTab}
            onChange={(v) => setActiveTab(v as any)}
            items={[
              {
                id: "inventory",
                label: "Website Inventory",
                count: pages.length,
                icon: Globe,
              },
              {
                id: "opportunities",
                label: "Page Opportunities",
                count: opportunities.length,
                icon: Sparkles,
              },
              {
                id: "published",
                label: "Drafts & Published Pages",
                icon: FileCheck,
              },
            ]}
            ariaLabel="Pages workspace sections"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-center">
          <Link
            href="/pages/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-xs font-medium text-bg hover:opacity-90 transition-opacity"
          >
            <Plus size={14} strokeWidth={2} />
            Create page
          </Link>
        </div>
      </div>

      {/* TAB 1: WEBSITE INVENTORY */}
      {activeTab === "inventory" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* KPI Summary Tiles */}
          <InventoryKpiSummary
            pages={pages}
            activeFilter={kpiFilter}
            onSelectFilter={setKpiFilter}
          />

          {/* Searchable Inventory Data Table */}
          <WebsiteInventoryTable
            pages={displayPages}
            onSelectPage={setSelectedPage}
            onTypeChange={handleTypeChange}
            onOpenRecrawl={() => setIsRecrawlOpen(true)}
          />
        </div>
      )}

      {/* TAB 2: PAGE OPPORTUNITIES */}
      {activeTab === "opportunities" && (
        <div className="animate-in fade-in duration-150">
          <PageOpportunitiesView
            opportunities={opportunities}
            onSelectOpportunityForBuilder={handleOpenBuilderWithOpp}
            onOpenExistingPage={(id) => {
              const p = pages.find((x) => x.id === id);
              if (p) setSelectedPage(p);
            }}
          />
        </div>
      )}

      {/* TAB 3: DRAFTS & PUBLISHED PAGES */}
      {activeTab === "published" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <Card className="overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th>Page Title</Th>
                  <Th>Type</Th>
                  <Th>Target Keyword</Th>
                  <Th>Destination</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                <tr className={trClass}>
                  <Td className="font-medium text-fg">
                    <Link href="/pages/pg_custom_1" className="hover:underline">
                      Bakuchiol vs Retinol: Direct Scientific Comparison & Efficacy Guide
                    </Link>
                  </Td>
                  <Td><Badge tone="info">Comparison</Badge></Td>
                  <Td className="font-mono text-xs">bakuchiol vs retinol</Td>
                  <Td>WordPress</Td>
                  <Td><Badge tone="success">Published</Badge></Td>
                  <Td className="text-right">
                    <Link
                      href="/pages/pg_custom_1"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg hover:underline"
                    >
                      Open in editor
                    </Link>
                  </Td>
                </tr>

                <tr className={trClass}>
                  <Td className="font-medium text-fg">
                    <Link href="/pages/pg_custom_2" className="hover:underline">
                      Organic Eczema & Sensitive Skin Barrier Solutions
                    </Link>
                  </Td>
                  <Td><Badge tone="info">Solution</Badge></Td>
                  <Td className="font-mono text-xs">organic eczema skincare routine</Td>
                  <Td>Shopify</Td>
                  <Td><Badge tone="warning">Draft</Badge></Td>
                  <Td className="text-right">
                    <Link
                      href="/pages/pg_custom_2"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg hover:underline"
                    >
                      Open in editor
                    </Link>
                  </Td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* Slide-over Page Analysis Drawer */}
      <PageDetailDrawer
        page={selectedPage}
        onClose={() => setSelectedPage(null)}
        onTypeChange={handleTypeChange}
        onOpenEditor={handleOpenEditor}
      />

      {/* Live Recrawl Modal */}
      <RecrawlModal
        open={isRecrawlOpen}
        onClose={() => setIsRecrawlOpen(false)}
        websiteUrl="https://verdantbotanics.com"
        onCrawlComplete={() => toast("Inventory metrics refreshed")}
      />
    </div>
  );
}

