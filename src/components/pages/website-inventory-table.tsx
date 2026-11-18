"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Table, Td, Th, trClass } from "@/components/ui";
import { FilterSearch, FilterSelect } from "@/components/filters";
import {
  ALL_PAGE_TYPES,
  type PageType,
  type WebsitePage,
} from "@/lib/website-intelligence-types";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Eye,
  RotateCw,
  X,
} from "lucide-react";

interface WebsiteInventoryTableProps {
  pages: WebsitePage[];
  onSelectPage: (page: WebsitePage) => void;
  onTypeChange?: (pageId: string, newType: PageType) => void;
  onOpenRecrawl: () => void;
}

type SortField = "clicks" | "impressions" | "position" | "title";
type SortOrder = "asc" | "desc";

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All page types" },
  ...ALL_PAGE_TYPES.map((t) => ({ value: t as string, label: t as string })),
];
const TYPE_OPTIONS = ALL_PAGE_TYPES.map((t) => ({ value: t as string, label: t as string }));
const INDEX_OPTIONS = [
  { value: "all", label: "All index status" },
  { value: "Indexable", label: "Indexable" },
  { value: "Blocked", label: "Blocked by robots" },
  { value: "Non-Indexable", label: "Non-indexable" },
];
const SORT_OPTIONS = [
  { value: "clicks:desc", label: "Clicks · high to low" },
  { value: "clicks:asc", label: "Clicks · low to high" },
  { value: "impressions:desc", label: "Impressions · high to low" },
  { value: "impressions:asc", label: "Impressions · low to high" },
  { value: "position:asc", label: "Position · best first" },
  { value: "position:desc", label: "Position · worst first" },
  { value: "title:asc", label: "Title · A to Z" },
  { value: "title:desc", label: "Title · Z to A" },
];

const pathOf = (url: string) => url.replace("https://verdantbotanics.com", "") || "/";

function IndexChip({ page }: { page: WebsitePage }) {
  const ok = page.indexingStatus === "Indexable";
  return (
    <span
      title={page.indexingStatus}
      className={cx(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium",
        ok ? "bg-success-bg text-success-fg" : "bg-warning-bg text-warning-fg"
      )}
    >
      {ok ? <CheckCircle2 size={12} strokeWidth={2} /> : <AlertTriangle size={12} strokeWidth={2} />}
      {ok ? "Indexable" : "Blocked"}
    </span>
  );
}

function InspectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Inspect page analysis"
      className={cx(
        "inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium transition-colors hover:bg-sunken",
        ring
      )}
    >
      <Eye size={14} strokeWidth={1.75} />
      Inspect
    </button>
  );
}

export function WebsiteInventoryTable({
  pages,
  onSelectPage,
  onTypeChange,
  onOpenRecrawl,
}: WebsiteInventoryTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [indexFilter, setIndexFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("clicks");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredPages = useMemo(() => {
    return pages
      .filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.url.toLowerCase().includes(search.toLowerCase()) ||
          p.primaryKeyword.toLowerCase().includes(search.toLowerCase());

        const effectiveType = p.userOverriddenType || p.pageType;
        const matchesType = typeFilter === "all" || effectiveType === typeFilter;

        const matchesIndex =
          indexFilter === "all" ||
          (indexFilter === "Indexable" && p.indexingStatus === "Indexable") ||
          (indexFilter === "Blocked" && p.indexingStatus === "Blocked by robots.txt") ||
          (indexFilter === "Non-Indexable" && p.indexingStatus !== "Indexable");

        return matchesSearch && matchesType && matchesIndex;
      })
      .sort((a, b) => {
        if (sortField === "clicks") {
          return sortOrder === "desc"
            ? b.performance.clicks - a.performance.clicks
            : a.performance.clicks - b.performance.clicks;
        }
        if (sortField === "impressions") {
          return sortOrder === "desc"
            ? b.performance.impressions - a.performance.impressions
            : a.performance.impressions - b.performance.impressions;
        }
        if (sortField === "position") {
          return sortOrder === "asc"
            ? a.performance.position - b.performance.position
            : b.performance.position - a.performance.position;
        }
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      });
  }, [pages, search, typeFilter, indexFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const hasFilters = search !== "" || typeFilter !== "all" || indexFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setIndexFilter("all");
  };

  const SortHead = ({ field, children }: { field: SortField; children: string }) => {
    const active = sortField === field;
    const Icon = !active ? ArrowUpDown : sortOrder === "asc" ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        aria-label={`Sort by ${children}`}
        className={cx(
          "inline-flex items-center gap-1 rounded-md font-semibold transition-colors hover:text-fg",
          ring,
          active ? "text-fg" : "text-muted"
        )}
      >
        {children}
        <Icon size={12} strokeWidth={1.75} className={active ? "text-fg" : "text-muted"} />
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <FilterSearch
            className="col-span-2 w-full sm:w-72"
            label="Filter pages"
            placeholder="Filter by title, URL or keyword…"
            value={search}
            onChange={setSearch}
          />
          <FilterSelect
            className="sm:w-44"
            label="Filter by page type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_FILTER_OPTIONS}
          />
          <FilterSelect
            className="sm:w-44"
            label="Filter by index status"
            value={indexFilter}
            onChange={setIndexFilter}
            options={INDEX_OPTIONS}
          />
          <FilterSelect
            className="col-span-2 sm:hidden"
            label="Sort pages"
            value={`${sortField}:${sortOrder}`}
            onChange={(v) => {
              const [f, o] = v.split(":");
              setSortField(f as SortField);
              setSortOrder(o as SortOrder);
            }}
            options={SORT_OPTIONS}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className={cx(
                "col-span-2 inline-flex h-9 items-center justify-center gap-1 rounded-full px-3 text-[13px] font-medium text-muted transition-colors hover:bg-sunken hover:text-fg sm:col-span-1",
                ring
              )}
            >
              <X size={14} strokeWidth={1.75} />
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span className="text-xs tabular-nums text-muted">
            Showing {filteredPages.length} of {pages.length} URLs
          </span>
          <Button variant="outline" size="sm" onClick={onOpenRecrawl} className="gap-1.5">
            <RotateCw size={14} strokeWidth={1.75} className="shrink-0" />
            Recrawl website
          </Button>
        </div>
      </div>

      {filteredPages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-5 py-12 text-center">
          <p className="text-[15px] font-semibold">No URLs match your filters</p>
          <p className="mt-1 text-[13px] text-muted">Try a different search or reset the filters.</p>
          {hasFilters && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>
                      <SortHead field="title">Page & URL</SortHead>
                    </Th>
                    <Th>Type</Th>
                    <Th className="hidden lg:table-cell">Primary keyword</Th>
                    <Th className="text-right">
                      <SortHead field="clicks">Clicks (28d)</SortHead>
                    </Th>
                    <Th className="hidden text-right lg:table-cell">
                      <SortHead field="impressions">Impressions</SortHead>
                    </Th>
                    <Th>Indexing</Th>
                    <Th className="text-right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPages.map((page) => {
                    const displayType = page.userOverriddenType || page.pageType;
                    return (
                      <tr
                        key={page.id}
                        tabIndex={0}
                        onClick={() => onSelectPage(page)}
                        onKeyDown={(e) => {
                          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            onSelectPage(page);
                          }
                        }}
                        className={cx(trClass, "cursor-pointer transition-colors hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none")}
                      >
                        <Td className="max-w-[16rem] xl:max-w-sm">
                          <span className="block truncate text-[13px] font-medium text-fg">{page.title}</span>
                          <span className="mono mt-0.5 block truncate text-[11px] text-muted">{pathOf(page.url)}</span>
                        </Td>

                        <Td>
                          <div
                            className="w-36"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <FilterSelect
                              size="sm"
                              label={`Page type for ${page.title}`}
                              value={displayType}
                              onChange={(v) => onTypeChange?.(page.id, v as PageType)}
                              options={TYPE_OPTIONS}
                            />
                          </div>
                        </Td>

                        <Td className="hidden lg:table-cell">
                          <span className="text-[13px]">{page.primaryKeyword || "—"}</span>
                        </Td>

                        <Td className="text-right text-[13px] font-semibold tabular-nums">
                          {page.performance.clicks.toLocaleString()}
                        </Td>

                        <Td className="hidden text-right text-[13px] tabular-nums text-muted lg:table-cell">
                          {page.performance.impressions.toLocaleString()}
                        </Td>

                        <Td>
                          <IndexChip page={page} />
                        </Td>

                        <Td className="text-right">
                          <div
                            className="flex justify-end"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <InspectButton onClick={() => onSelectPage(page)} />
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Mobile list */}
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface md:hidden">
            {filteredPages.map((page) => {
              const displayType = page.userOverriddenType || page.pageType;
              return (
                <li key={page.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPage(page)}
                    className={cx("block w-full space-y-2 p-3.5 pb-2 text-left transition-colors hover:bg-subtle", ring)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{page.title}</p>
                        <p className="mono mt-0.5 truncate text-[11px] text-muted">{pathOf(page.url)}</p>
                      </div>
                      <IndexChip page={page} />
                    </div>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted">
                      <span>
                        <span className="font-semibold text-fg">{page.performance.clicks.toLocaleString()}</span> clicks
                      </span>
                      <span>{page.performance.impressions.toLocaleString()} impressions</span>
                      {page.primaryKeyword && <span className="truncate">“{page.primaryKeyword}”</span>}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 px-3.5 pb-3.5">
                    <FilterSelect
                      size="sm"
                      className="min-w-0 flex-1"
                      label={`Page type for ${page.title}`}
                      value={displayType}
                      onChange={(v) => onTypeChange?.(page.id, v as PageType)}
                      options={TYPE_OPTIONS}
                    />
                    <InspectButton onClick={() => onSelectPage(page)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}