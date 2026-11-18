"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { Modal, toast } from "@/components/ui-client";
import { SearchInput } from "@/components/ui-form";
import type { PillarContentItem } from "@/lib/content-pillars-types";
import { Check, CheckCircle2, FileText, Globe, Search, X } from "lucide-react";

interface AddExistingContentDialogProps {
  open: boolean;
  onClose: () => void;
  pillarName: string;
  onContentAttached: (item: PillarContentItem) => void;
}

const AVAILABLE_EXISTING_CONTENT: PillarContentItem[] = [
  {
    id: "art_ext_1",
    title: "How to Patch Test a New Skincare Product at Home",
    type: "article",
    pageType: "Article",
    url: "https://verdantbotanics.com/blog/how-to-patch-test",
    status: "published",
    primaryKeyword: "how to patch test skincare",
    intent: "informational",
    publishedDate: "Nov 01, 2026",
    clicks28d: 1120,
    impressions28d: 14000,
    position: 3.2,
  },
  {
    id: "pg_ext_2",
    title: "1-on-1 Virtual Skin Consultation Service",
    type: "page",
    pageType: "Service",
    url: "https://verdantbotanics.com/services/virtual-skin-consultation",
    status: "published",
    primaryKeyword: "virtual skincare consultation",
    intent: "commercial",
    publishedDate: "Oct 15, 2026",
    clicks28d: 940,
    impressions28d: 16000,
    position: 5.6,
  },
  {
    id: "art_ext_3",
    title: "Are Organic Skincare Certifications Trustworthy?",
    type: "article",
    pageType: "Article",
    url: "https://verdantbotanics.com/blog/organic-skincare-certifications",
    status: "published",
    primaryKeyword: "are organic certifications trustworthy",
    intent: "informational",
    publishedDate: "Oct 22, 2026",
    clicks28d: 840,
    impressions28d: 11500,
    position: 4.1,
  },
];

export function AddExistingContentDialog({
  open,
  onClose,
  pillarName,
  onContentAttached,
}: AddExistingContentDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!open) return null;

  const filtered = AVAILABLE_EXISTING_CONTENT.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.primaryKeyword.toLowerCase().includes(search.toLowerCase())
  );

  const handleAttach = () => {
    const item = AVAILABLE_EXISTING_CONTENT.find((c) => c.id === selectedId);
    if (!item) return;

    onContentAttached(item);
    toast(`Attached "${item.title}" to ${pillarName}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attach Existing Content"
      description={
        <span>
          Connect existing live articles or landing pages to <span className="font-medium text-fg">{pillarName}</span>.
        </span>
      }
      width={560}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAttach} disabled={!selectedId}>
            Attach to Pillar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <SearchInput
          placeholder="Search by title or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          className="!h-9 !rounded-xl text-xs"
        />

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {filtered.map((item) => {
            const isSelected = selectedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(String(item.id))}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-fg bg-surface shadow-xs ring-1 ring-fg"
                    : "border-line bg-surface hover:border-line-strong hover:bg-subtle/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-sunken px-2 py-0.5 text-[10px] font-medium text-muted uppercase">
                        {item.type}
                      </span>
                      <span className="font-mono text-xs font-semibold text-fg truncate">
                        {item.primaryKeyword}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-fg block truncate">{item.title}</span>
                    <span className="caption text-xs text-muted block truncate font-mono">
                      {item.url}
                    </span>
                  </div>

                  {isSelected && <Check size={16} strokeWidth={2.5} className="text-fg shrink-0 mt-1" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

