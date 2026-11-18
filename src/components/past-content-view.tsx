"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, btnClass, Delta, EmptyState, PageTabs, Table, Td, Th, trClass, Why } from "@/components/ui";
import { Sparkles, History, RefreshCw, FileText, Newspaper } from "lucide-react";

export interface PastContentRow {
  c: {
    id: number;
    title: string;
    type: string;
    status: string;
    keyword?: string;
  };
  delta: number;
  imp: number;
  age: number;
}

type PastContentTab = "all" | "refresh" | "monitoring" | "articles" | "pages";

export function PastContentView({ rows }: { rows: PastContentRow[] }) {
  const [tab, setTab] = useState<PastContentTab>("all");

  const counts = useMemo(() => {
    return {
      all: rows.length,
      refresh: rows.filter(
        ({ c, delta, age }) =>
          c.status === "refresh" || delta < -15 || age > 8
      ).length,
      monitoring: rows.filter(
        ({ c, delta }) => c.status === "monitoring" || (delta >= 0 && c.status !== "refresh")
      ).length,
      articles: rows.filter(({ c }) => c.type === "article").length,
      pages: rows.filter(({ c }) => c.type === "page").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    switch (tab) {
      case "refresh":
        return rows.filter(
          ({ c, delta, age }) =>
            c.status === "refresh" || delta < -15 || age > 8
        );
      case "monitoring":
        return rows.filter(
          ({ c, delta }) => c.status === "monitoring" || (delta >= 0 && c.status !== "refresh")
        );
      case "articles":
        return rows.filter(({ c }) => c.type === "article");
      case "pages":
        return rows.filter(({ c }) => c.type === "page");
      case "all":
      default:
        return rows;
    }
  }, [rows, tab]);

  const tabs = [
    {
      id: "all" as const,
      label: "All assets",
      count: counts.all,
      icon: History,
    },
    {
      id: "refresh" as const,
      label: "Needs refresh",
      count: counts.refresh,
      icon: RefreshCw,
    },
    {
      id: "monitoring" as const,
      label: "Monitoring",
      count: counts.monitoring,
      icon: Sparkles,
    },
    {
      id: "articles" as const,
      label: "Articles",
      count: counts.articles,
      icon: Newspaper,
    },
    {
      id: "pages" as const,
      label: "Pages",
      count: counts.pages,
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <PageTabs
        items={tabs}
        value={tab}
        onChange={setTab}
        ariaLabel="Assets content filtering"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No assets found"
          description="There is no published content matching this filter tab."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Content</Th>
              <Th>Clicks (28d)</Th>
              <Th>Impressions</Th>
              <Th>Age</Th>
              <Th>Refresh recommendation</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ c, delta, imp, age }) => {
              const rec =
                delta < -15
                  ? "Refresh: clicks declining, answer new questions and improve the title"
                  : age > 8
                  ? "Review for outdated information"
                  : delta < 0
                  ? "Check title and meta description"
                  : "No action needed";
              return (
                <tr key={c.id} className={trClass}>
                  <Td className="max-w-sm truncate font-medium">
                    <Link
                      className="hover:underline"
                      href={c.type === "page" ? `/pages/${c.id}` : `/articles/${c.id}`}
                    >
                      {c.title}
                    </Link>
                  </Td>
                  <Td>
                    <Delta value={delta} />
                  </Td>
                  <Td className="tabular-nums">{imp.toLocaleString()}</Td>
                  <Td className="text-muted">{age} mo</Td>
                  <Td className="text-sm">
                    {rec.startsWith("No") ? (
                      <span className="text-muted">{rec}</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {rec}
                        <Why
                          impact="Medium"
                          effort="Low"
                          confidence="Medium"
                          goal="High"
                          reason="Clicks and age signals suggest this page is losing relevance."
                        />
                      </span>
                    )}
                  </Td>
                  <Td>
                    {!rec.startsWith("No") && (
                      <Link
                        href={c.type === "page" ? `/pages/${c.id}` : `/articles/${c.id}`}
                        className={btnClass("outline", "sm")}
                      >
                        Improve {c.type === "page" ? "page" : "article"}
                      </Link>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Badge tone="outline" className="mt-4">
        Performance values are sample data
      </Badge>
    </div>
  );
}

