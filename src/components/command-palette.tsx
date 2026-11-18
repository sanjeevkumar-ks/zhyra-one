"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui-client";

interface CommandItem {
  id: string;
  label: string;
  group: "Actions" | "Navigation" | "Tools";
  href: string;
  icon?: typeof Search;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  mode: string;
}

export function CommandPalette({ open, onClose, mode }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      { id: "act-new-art", label: "Create new article", group: "Actions", href: "/articles/new", icon: FileText, shortcut: "C A" },
      { id: "act-new-page", label: "Create new landing page", group: "Actions", href: "/pages/new", icon: Globe, shortcut: "C P" },
      { id: "act-page-opps", label: "Discover missing page opportunities", group: "Actions", href: "/pages?tab=opportunities", icon: Sparkles },
      { id: "act-opps", label: "Find keyword opportunities", group: "Actions", href: "/opportunities", icon: Search },
      { id: "act-audit", label: "Run website audit", group: "Actions", href: "/audit", icon: ShieldCheck },
      { id: "act-onboard", label: "Re-run onboarding wizard", group: "Actions", href: "/onboarding", icon: Sparkles },

      { id: "nav-overview", label: "Dashboard Overview", group: "Navigation", href: "/overview", icon: LayoutDashboard },
      { id: "nav-pages-inventory", label: "Website Inventory & Pages", group: "Navigation", href: "/pages", icon: Globe },
      { id: "nav-planner", label: "Content Planner", group: "Navigation", href: "/planner", icon: Calendar },
      { id: "nav-articles", label: "Articles & Guides", group: "Navigation", href: "/articles", icon: FileText },
      { id: "nav-pages", label: "Landing Pages", group: "Navigation", href: "/pages", icon: Globe },
      { id: "nav-pillars", label: "Content Pillars & Topical Authority", group: "Navigation", href: "/topic-groups", icon: Layers },
      { id: "nav-publishing", label: "Publishing Control Centre", group: "Navigation", href: "/publishing", icon: Globe },
      { id: "nav-settings", label: "Settings Workspace", group: "Navigation", href: "/settings", icon: Settings },
      { id: "nav-docs", label: "Design System & Docs", group: "Navigation", href: "/design", icon: BookOpen },
    ];

    if (mode === "advanced") {
      list.push(
        { id: "nav-authority", label: "Topical & Brand Authority", group: "Tools", href: "/authority", icon: Sparkles },
        { id: "nav-aeo", label: "AEO & Answer Engines", group: "Tools", href: "/aeo", icon: Sparkles }
      );
    }

    return list;
  }, [mode]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation inside command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target) {
        router.push(target.href);
        onClose();
      }
    }
  };

  // Group filtered results by category
  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      const g = map.get(item.group) || [];
      g.push(item);
      map.set(item.group, g);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Command palette"
      description="Quick navigation, workflow actions, and rapid search"
      width={580}
      footer={
        <div className="flex w-full items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded bg-sunken px-1 py-0.5">↑</kbd> <kbd className="rounded bg-sunken px-1 py-0.5">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="rounded bg-sunken px-1.5 py-0.5">↵</kbd> to select
            </span>
          </div>
          <span>Esc to close</span>
        </div>
      }
    >
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Dedicated Search Input Layout */}
        <div className="relative flex items-center rounded-xl border border-line bg-surface transition-colors focus-within:border-fg focus-within:ring-1 focus-within:ring-fg">
          {/* Prefix Search Icon */}
          <div className="pointer-events-none absolute left-3.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted">
            <Search size={18} strokeWidth={1.5} />
          </div>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            className="h-11 w-full bg-transparent pl-11 pr-20 text-sm font-medium text-fg placeholder:text-muted placeholder:font-normal focus:outline-none"
            placeholder="Search commands, navigate, or create..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search commands"
          />

          {/* Right Action Hint / Clear button */}
          <div className="absolute right-3 flex items-center gap-1.5">
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded p-1 text-muted hover:text-fg"
                title="Clear query"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center rounded bg-sunken px-1.5 py-0.5 text-[10px] font-medium text-muted">
                ESC
              </kbd>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-muted">
              <Search size={24} strokeWidth={1.5} className="mx-auto mb-2 text-faint" />
              <p className="text-sm font-medium text-fg">No commands match &quot;{query}&quot;</p>
              <p className="caption mt-0.5">Try searching for &quot;article&quot;, &quot;settings&quot;, or &quot;audit&quot;</p>
            </div>
          ) : (
            groups.map(([groupName, items]) => (
              <div key={groupName} className="space-y-1">
                <span className="caption block px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {groupName}
                </span>

                <div className="space-y-0.5">
                  {items.map((item) => {
                    const itemGlobalIndex = filtered.indexOf(item);
                    const isSelected = selectedIndex === itemGlobalIndex;
                    const Icon = item.icon || Sparkles;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          router.push(item.href);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                          isSelected
                            ? "bg-sunken text-fg font-medium"
                            : "text-muted hover:bg-subtle hover:text-fg"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon size={18} strokeWidth={1.5} className="shrink-0 text-muted" />
                          <span className="truncate">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {item.shortcut && (
                            <kbd className="hidden sm:inline-block rounded bg-surface border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ArrowRight
                            size={14}
                            className={`shrink-0 text-muted transition-opacity ${
                              isSelected ? "opacity-100 text-fg" : "opacity-0"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

