"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  Bell, BookOpen, ChevronDown, ChevronRight, FileText, HelpCircle, LayoutDashboard, Link2, Lightbulb, Moon, PanelLeft, Plug, Search, Settings, Share2,
  ShieldCheck, Sparkles, Sun, Telescope, TrendingUp, Layers, CalendarDays, Newspaper, History, Send, MessagesSquare, RefreshCw, ScanSearch, Award, type LucideIcon,
} from "lucide-react";
import { btnClass, IconButton } from "./ui";
import { Modal, Toaster, toast } from "./ui-client";
import { CommandPalette } from "./command-palette";
import { notificationsList } from "@/lib/mock-data";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  advanced?: boolean;
  badge?: string;
  children?: { label: string; href: string }[];
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/overview", icon: LayoutDashboard },
      { label: "Opportunities", href: "/opportunities", icon: Lightbulb },
      { label: "Authority", href: "/authority", icon: Award, advanced: true },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Planner", href: "/planner", icon: CalendarDays },
      { label: "Articles", href: "/articles", icon: Newspaper },
      { label: "Pages", href: "/pages", icon: FileText },
      { label: "Content pillars", href: "/topic-groups", icon: Layers },
      { label: "Past content", href: "/past-content", icon: History },
    ],
  },
  {
    label: "Visibility",
    items: [
      {
        label: "SEO",
        href: "/seo",
        icon: TrendingUp,
        children: [
          { label: "Overview", href: "/seo" },
          { label: "Keywords", href: "/seo/keywords" },
          { label: "Rankings", href: "/seo/rankings" },
          { label: "Pages", href: "/seo/pages" },
          { label: "Technical audit", href: "/seo/audit" },
          { label: "Backlinks", href: "/seo/backlinks" },
        ],
      },
      {
        label: "AI visibility",
        href: "/ai-visibility",
        icon: Telescope,
        badge: "Beta",
        children: [
          { label: "Overview", href: "/ai-visibility" },
          { label: "Searches", href: "/ai-visibility/searches" },
          { label: "Topics", href: "/ai-visibility/topics" },
          { label: "Competitors", href: "/ai-visibility/competitors" },
          { label: "Sources", href: "/ai-visibility/sources" },
          { label: "Outside sources", href: "/ai-visibility/outside-sources" },
          { label: "Opportunities", href: "/ai-visibility/opportunities" },
        ],
      },
      { label: "AEO", href: "/aeo", icon: MessagesSquare, advanced: true },
      { label: "Website audit", href: "/audit", icon: ScanSearch },
    ],
  },
  {
    label: "Distribution",
    items: [
      { label: "Social", href: "/social", icon: Share2 },
      { label: "Publishing", href: "/publishing", icon: Send },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Integrations", href: "/integrations", icon: Plug },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const TITLES: [string, string][] = [
  ["/overview", "Overview"], ["/opportunities", "Opportunities"], ["/authority", "Authority"], ["/planner", "Planner"], ["/articles/new", "New article"], ["/articles", "Articles"],
  ["/pages/new", "New page"], ["/pages", "Pages"], ["/topic-groups", "Content pillars"], ["/content-pillars", "Content pillars"], ["/past-content", "Past content"], ["/seo", "SEO"], ["/ai-visibility", "AI visibility"],
  ["/aeo", "AEO"], ["/audit", "Website audit"], ["/social", "Social"], ["/publishing", "Publishing"], ["/integrations", "Integrations"], ["/settings", "Settings"], ["/design", "Design system"],
];

function useTitle(pathname: string) {
  return TITLES.find(([p]) => pathname === p || pathname.startsWith(p + "/"))?.[1] ?? "Workspace";
}

function cta(pathname: string): { label: string; href: string } | null {
  if (pathname.startsWith("/articles/") || pathname.startsWith("/pages/")) return null;
  if (pathname.startsWith("/pages")) return { label: "Create page", href: "/pages/new" };
  if (pathname.startsWith("/integrations") || pathname.startsWith("/settings") || pathname.startsWith("/design")) return null;
  return { label: "Create article", href: "/articles/new" };
}

export function Shell({ children, domain, mode, workspaceName }: { children: ReactNode; domain: string; mode: "simple" | "advanced"; workspaceName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [range, setRange] = useState("28");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setCollapsed(localStorage.getItem("vos-collapsed") === "1");
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => setMobileNav(false), [pathname]);

  const toggleTheme = useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("vos-theme", next ? "dark" : "light");
  }, [dark]);

  const title = useTitle(pathname);
  const action = cta(pathname);
  const isEditor = /^\/(articles|pages)\/\d+/.test(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {mobileNav && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileNav(false)} />}

      <aside
        aria-label="Primary"
        className={clsx(
          "z-50 flex shrink-0 flex-col border-r border-line/70 bg-subtle transition-[width] duration-200 ease-out",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0",
          collapsed ? "w-[72px]" : "w-64",
          mobileNav ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        )}
      >
        {/* Brand + search */}
        <div className={clsx("flex h-16 shrink-0 items-center px-4", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Link href="/overview" className="px-2 text-[22px] font-semibold tracking-tight text-fg">
              VisibilityOS
            </Link>
          )}
          {collapsed ? (
            <Link href="/overview" aria-label="Home" className="flex h-9 w-9 items-center justify-center rounded-xl bg-fg text-sm font-semibold text-bg">
              V
            </Link>
          ) : (
            <IconButton label="Search (Command K)" onClick={() => setCmdOpen(true)}>
              <Search size={18} strokeWidth={1.5} />
            </IconButton>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
          {NAV.map((g, gi) => {
            const items = g.items.filter((i) => !(i.advanced && mode === "simple"));
            if (!items.length) return null;
            return (
              <div key={g.label} className={clsx(gi > 0 && (collapsed ? "mt-3 border-t border-line/70 pt-3" : "mt-7"))}>
                {!collapsed && gi > 0 && (
                  <p className="mb-2 px-3 text-[14px] font-medium text-muted">{g.label}</p>
                )}
                <ul className="space-y-1">
                  {items.map((it) => (
                    <NavRow key={it.href} item={it} pathname={pathname} collapsed={collapsed} advanced={!!it.advanced} />
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-line/70 p-3">
          {!collapsed && (
            <Link
              href="/settings"
              className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-sunken"
              title="Manage plan"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Monthly credits</span>
                <span className="font-medium tabular-nums text-fg">620 / 1,000</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
                <div className="h-full w-[62%] rounded-full bg-fg" />
              </div>
              <span className="mt-2 inline-block text-sm font-medium text-fg underline-offset-2 hover:underline">Upgrade plan</span>
            </Link>
          )}

          {/* Workspace / domain */}
          <button
            type="button"
            title={domain}
            className={clsx(
              "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors hover:bg-sunken",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="h-5 w-5 shrink-0 rounded-md bg-gradient-to-br from-orange-300 via-orange-400 to-amber-600" />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium leading-tight text-fg">{domain}</span>
                  <span className="block truncate text-xs text-muted">{workspaceName}</span>
                </span>
                <ChevronDown size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
              </>
            )}
          </button>

          {/* User + utilities */}
          <div className={clsx("flex items-center", collapsed ? "flex-col gap-1" : "justify-between px-1")}>
            <div className="flex min-w-0 items-center gap-2.5 px-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-medium text-fg">SK</span>
              {!collapsed && <span className="truncate text-sm font-medium text-fg">Sanjeev Kumar</span>}
            </div>
            <div className={clsx("flex items-center", collapsed && "flex-col")}>
              <IconButton label="Help and docs" onClick={() => toast("Docs open in a new tab in production")}>
                <HelpCircle size={18} strokeWidth={1.5} />
              </IconButton>
              <IconButton
                label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="max-lg:hidden"
                onClick={() => {
                  setCollapsed(!collapsed);
                  localStorage.setItem("vos-collapsed", collapsed ? "0" : "1");
                }}
              >
                <PanelLeft size={18} strokeWidth={1.5} />
              </IconButton>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-bg px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <IconButton label="Open navigation" className="lg:hidden" onClick={() => setMobileNav(true)}><PanelLeft size={20} strokeWidth={1.5} /></IconButton>
            <span className="hidden text-sm text-muted sm:inline">{workspaceName}</span>
            <ChevronRight size={16} className="hidden text-faint sm:inline shrink-0" />
            <span className="truncate text-sm font-medium text-fg">{title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!isEditor && (
              <div className="relative inline-flex items-center max-md:hidden">
                <select
                  aria-label="Date range"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="h-8 appearance-none rounded-full border border-line bg-surface pl-3.5 pr-8 text-xs font-medium text-fg hover:border-line-strong transition-colors cursor-pointer focus:border-fg focus:outline-none"
                >
                  <option value="7">Last 7 days</option>
                  <option value="28">Last 28 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <ChevronDown size={16} strokeWidth={1.5} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            )}
            <span className="caption mx-1 hidden items-center gap-1 xl:flex">
              Last synced 12 min ago
              <IconButton label="Refresh data" onClick={() => { router.refresh(); toast("Data refreshed"); }}><RefreshCw size={16} strokeWidth={1.5} /></IconButton>
            </span>
            <div className="relative">
              <IconButton label="Notifications" onClick={() => setBell(!bell)}><Bell size={20} strokeWidth={1.5} /></IconButton>
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
              {bell && (
                <div className="enter absolute right-0 top-10 z-50 w-72 rounded-xl border border-line bg-surface p-2 shadow-lg">
                  {notificationsList.map((n) => (
                    <p key={n} className="rounded-lg px-3 py-2 text-sm hover:bg-subtle">{n}</p>
                  ))}
                </div>
              )}
            </div>
            <IconButton label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>{dark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}</IconButton>
            <Link href="/design" className={btnClass("ghost", "sm", "max-xl:hidden")}><BookOpen size={16} strokeWidth={1.5} /> Docs</Link>
            {action && <Link href={action.href} className={btnClass("primary", "md")}>{action.label}</Link>}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto bg-bg">{children}</main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} mode={mode} />
      <Toaster />
    </div>
  );
}

function NavRow({ item, pathname, collapsed, advanced }: { item: NavItem; pathname: string; collapsed: boolean; advanced: boolean }) {
  const Icon = item.icon;
  const hasChildren = !!item.children;
  const inSection = pathname === item.href || pathname.startsWith(item.href + "/");
  const open = hasChildren && inSection;
  // Parents with children stay text-highlighted; the pill moves to the active child.
  const pill = inSection && !hasChildren;

  return (
    <li>
      <Link
        href={item.href}
        title={item.label}
        aria-current={pill ? "page" : undefined}
        className={clsx(
          "group flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors",
          pill ? "bg-sunken text-fg" : inSection ? "text-fg" : "text-muted hover:bg-sunken/70 hover:text-fg",
          advanced && !inSection && "text-muted/80",
          collapsed && "justify-center px-0",
        )}
      >
        <Icon size={18} strokeWidth={1.5} className="shrink-0" />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted group-hover:bg-surface">
            {item.badge}
          </span>
        )}
        {!collapsed && advanced && (
          <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted group-hover:bg-surface">
            Advanced
          </span>
        )}
        {!collapsed && hasChildren && (
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className={clsx("shrink-0 text-faint transition-transform", open ? "rotate-0" : "-rotate-90")}
          />
        )}
      </Link>

      {!collapsed && open && item.children && (
        <ul className="mb-1 ml-[22px] mt-1 space-y-0.5 border-l border-line pl-3">
          {item.children.map((c) => {
            const a = pathname === c.href;
            return (
              <li key={c.href}>
                <Link
                  href={c.href}
                  aria-current={a ? "page" : undefined}
                  className={clsx(
                    "flex h-9 items-center rounded-lg px-3 text-[14px] font-medium transition-colors",
                    a ? "bg-sunken text-fg" : "text-muted hover:bg-sunken/70 hover:text-fg",
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export { ShieldCheck, Link2 };