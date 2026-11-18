"use client";

import Link from "next/link";
import { Button, btnClass, Card } from "@/components/ui";
import { Globe, Layers, PlugZap, Share2, Sparkles } from "lucide-react";

interface EmptyPublishingStateProps {
  type: "no_channels" | "no_published" | "no_scheduled";
  onClearFilters?: () => void;
}

export function EmptyPublishingState({ type, onClearFilters }: EmptyPublishingStateProps) {
  if (type === "no_channels") {
    return (
      <Card className="p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sunken text-muted">
          <PlugZap size={28} strokeWidth={1.5} />
        </div>
        <h3 className="h3 mt-4 text-fg">No publishing channels connected</h3>
        <p className="caption mx-auto mt-1 max-w-md">
          Connect your website CMS (WordPress, Webflow, Shopify, Ghost) or social platforms (LinkedIn, Reddit) to distribute and schedule content directly.
        </p>
        <div className="mt-6">
          <Link href="/integrations" className={btnClass("primary", "md", "gap-2")}>
            <Sparkles size={16} />
            Connect your first channel
          </Link>
        </div>
      </Card>
    );
  }

  if (type === "no_scheduled") {
    return (
      <Card className="p-8 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-muted">
          <Layers size={22} strokeWidth={1.5} />
        </div>
        <h3 className="h3 mt-3 text-fg">No content scheduled</h3>
        <p className="caption mx-auto mt-1 max-w-md">
          You have no articles or social variants scheduled for automatic distribution in the publishing queue.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/planner" className={btnClass("outline", "sm")}>
            Open planner
          </Link>
          {onClearFilters && (
            <Button size="sm" variant="ghost" onClick={onClearFilters}>
              View all publications
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 text-center sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-muted">
        <Globe size={22} strokeWidth={1.5} />
      </div>
      <h3 className="h3 mt-3 text-fg">Nothing published yet</h3>
      <p className="caption mx-auto mt-1 max-w-md">
        Publish an article from the editor or approve scheduled content to see live delivery records here.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Link href="/articles" className={btnClass("primary", "sm")}>
          View articles
        </Link>
      </div>
    </Card>
  );
}

