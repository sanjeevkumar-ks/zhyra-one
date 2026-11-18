"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Avatar, Badge, IconButton, intentTone } from "@/components/ui";
import { Chip, Segmented } from "@/components/ui-client";
import { FilterSearch, FilterSelect } from "@/components/filters";
import { moveContent } from "@/app/actions";
import { STAGES, type ContentStatus } from "@/lib/types";

interface Item {
  id: number;
  type: string;
  title: string;
  keyword: string;
  groupId: number | null;
  format: string;
  intent: string;
  owner: string;
  reviewer: string;
  date: string | null;
  status: string;
  destination: string;
}
type View = "kanban" | "calendar" | "list";

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const fmtDate = (d: string | null) => (d ? format(parseISO(d), "MMM d") : null);
const hrefOf = (i: Item) => (i.type === "page" ? `/pages/${i.id}` : `/articles/${i.id}`);
const stageOptions = STAGES.map((s) => ({ value: s.id as string, label: s.label }));

function PlannerCard({
  item,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  item: Item;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (status: ContentStatus) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(item.id));
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cx(
        "cursor-grab rounded-xl border border-line bg-surface p-3 transition-shadow hover:shadow-sm active:cursor-grabbing",
        dragging && "opacity-50"
      )}
    >
      <Link href={hrefOf(item)} className="line-clamp-2 text-[13px] font-medium leading-snug hover:underline">
        {item.title}
      </Link>
      <p className="mt-1 truncate text-xs text-muted">{item.keyword || "No keyword"}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge tone="outline">{item.format}</Badge>
        <Badge tone={intentTone(item.intent)}>{item.intent}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Avatar name={item.owner} />
        <span className="truncate text-xs tabular-nums text-muted">
          {fmtDate(item.date) ?? "No date"} · {item.destination}
        </span>
      </div>
      <div className="mt-3 md:hidden">
        <FilterSelect
          size="sm"
          label={`Move ${item.title} to stage`}
          value={item.status}
          onChange={(v) => onMove(v as ContentStatus)}
          options={stageOptions}
        />
      </div>
    </div>
  );
}

function EmptyPanel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mt-1 text-[13px] text-muted">{hint}</p>
    </div>
  );
}

export function PlannerView({ items: initial, groups }: { items: Item[]; groups: { id: number; name: string }[] }) {
  const [items, setItems] = useState(initial);
  const [view, setView] = useState<View>("kanban");
  const [type, setType] = useState("all");
  const [group, setGroup] = useState("all");
  const [owner, setOwner] = useState("all");
  const [channel, setChannel] = useState("all");
  const [kw, setKw] = useState("");
  const [cal, setCal] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [hidden, setHidden] = useState<string[]>(["monitoring", "refresh"]);
  const [stageMenu, setStageMenu] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [, start] = useTransition();

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (type === "all" || i.type === type) &&
          (group === "all" || String(i.groupId) === group) &&
          (owner === "all" || i.owner === owner || i.reviewer === owner) &&
          i.keyword.toLowerCase().includes(kw.toLowerCase())
      ),
    [items, type, group, owner, kw]
  );

  const owners = useMemo(() => [...new Set(items.flatMap((i) => [i.owner, i.reviewer]))], [items]);
  const groupName = (id: number | null) => groups.find((g) => g.id === id)?.name ?? "—";
  const hasFilters = type !== "all" || group !== "all" || owner !== "all" || channel !== "all" || kw !== "";
  const clearFilters = () => {
    setType("all");
    setGroup("all");
    setOwner("all");
    setChannel("all");
    setKw("");
  };

  const move = (id: number, status: ContentStatus) => {
    setItems((s) => s.map((i) => (i.id === id ? { ...i, status } : i)));
    start(async () => {
      await moveContent(id, status);
    });
  };

  const days = useMemo(() => {
    const s = cal === "month" ? startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }) : startOfWeek(cursor, { weekStartsOn: 1 });
    const e = cal === "month" ? endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) : endOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: s, end: e });
  }, [cursor, cal]);

  const byDay = useMemo(() => {
    const m = new Map<string, Item[]>();
    filtered.forEach((i) => {
      if (!i.date) return;
      m.set(i.date, [...(m.get(i.date) ?? []), i]);
    });
    return m;
  }, [filtered]);

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const agendaDays = days.filter((d) => byDay.has(format(d, "yyyy-MM-dd")));

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { id: "kanban", label: "Kanban" },
              { id: "calendar", label: "Calendar" },
              { id: "list", label: "List" },
            ]}
          />
          <span className="text-[13px] tabular-nums text-muted">
            {filtered.length} of {items.length} items
          </span>

          {view === "kanban" && (
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setStageMenu((v) => !v)}
                aria-expanded={stageMenu}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line"
              >
                <Settings2 size={15} strokeWidth={1.75} className="text-muted" />
                Stages
              </button>
              {stageMenu && (
                <>
                  <button
                    type="button"
                    aria-label="Close stages menu"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setStageMenu(false)}
                  />
                  <div className="enter absolute right-0 top-11 z-30 w-60 rounded-2xl border border-line bg-surface p-2 shadow-lg">
                    <p className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted">Workflow stages</p>
                    {STAGES.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] hover:bg-subtle"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded"
                          checked={!hidden.includes(s.id)}
                          onChange={() =>
                            setHidden(hidden.includes(s.id) ? hidden.filter((h) => h !== s.id) : [...hidden, s.id])
                          }
                        />
                        {s.label}
                      </label>
                    ))}
                    <p className="px-2 pb-1.5 pt-1 text-xs text-muted">Not every item needs every stage.</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <FilterSearch
            className="w-full lg:w-64 lg:shrink-0"
            label="Filter by keyword"
            placeholder="Filter by keyword"
            value={kw}
            onChange={setKw}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
            <FilterSelect
              className="lg:w-36"
              label="Content type"
              value={type}
              onChange={setType}
              options={[
                { value: "all", label: "All types" },
                { value: "article", label: "Articles" },
                { value: "page", label: "Pages" },
              ]}
            />
            <FilterSelect
              className="lg:w-44"
              label="Topic group"
              value={group}
              onChange={setGroup}
              options={[{ value: "all", label: "All topic groups" }, ...groups.map((g) => ({ value: String(g.id), label: g.name }))]}
            />
            <FilterSelect
              className="lg:w-44"
              label="Owner or reviewer"
              value={owner}
              onChange={setOwner}
              options={[{ value: "all", label: "Any owner" }, ...owners.map((o) => ({ value: o, label: o }))]}
            />
            <FilterSelect
              className="lg:w-36"
              label="Publishing channel"
              value={channel}
              onChange={setChannel}
              options={[
                { value: "all", label: "All channels" },
                { value: "WordPress", label: "WordPress" },
              ]}
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-sunken hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line lg:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Kanban */}
      {view === "kanban" && (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:snap-none sm:px-0">
          {STAGES.filter((s) => !hidden.includes(s.id)).map((s) => {
            const col = filtered.filter((i) => i.status === s.id);
            const over = overCol === s.id && dragId !== null;
            return (
              <div
                key={s.id}
                aria-label={`${s.label} column`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overCol !== s.id) setOverCol(s.id);
                }}
                onDragLeave={() => setOverCol((c) => (c === s.id ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId !== null) move(dragId, s.id);
                  setDragId(null);
                  setOverCol(null);
                }}
                className={cx(
                  "w-[78vw] max-w-72 shrink-0 snap-start rounded-2xl border p-2 transition-colors sm:w-72",
                  over ? "border-fg/30 bg-sunken" : "border-transparent bg-subtle"
                )}
              >
                <div className="mb-2 flex items-center justify-between px-2 pt-1">
                  <span className="text-[13px] font-semibold">{s.label}</span>
                  <span className="rounded-full bg-sunken px-2 py-0.5 text-xs tabular-nums text-muted">{col.length}</span>
                </div>
                <div className="min-h-24 space-y-2">
                  {col.map((i) => (
                    <PlannerCard
                      key={i.id}
                      item={i}
                      dragging={dragId === i.id}
                      onDragStart={() => setDragId(i.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      onMove={(st) => move(i.id, st)}
                    />
                  ))}
                  {col.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-line text-xs text-muted">
                      {over ? "Drop here" : "No items"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      {view === "calendar" && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <IconButton label="Previous" onClick={() => setCursor(cal === "month" ? addMonths(cursor, -1) : addDays(cursor, -7))}>
                <ChevronLeft size={18} />
              </IconButton>
              <span className="min-w-36 text-center text-[15px] font-semibold tabular-nums">
                {format(cursor, cal === "month" ? "MMMM yyyy" : "'Week of' MMM d")}
              </span>
              <IconButton label="Next" onClick={() => setCursor(cal === "month" ? addMonths(cursor, 1) : addDays(cursor, 7))}>
                <ChevronRight size={18} />
              </IconButton>
            </div>
            <Chip onClick={() => setCursor(new Date())}>Today</Chip>
            <Segmented
              className="ml-auto"
              value={cal}
              onChange={setCal}
              options={[
                { id: "month", label: "Month" },
                { id: "week", label: "Week" },
              ]}
            />
          </div>

          {/* Desktop grid */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-line sm:block">
            <div className="grid grid-cols-7 gap-px">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="bg-subtle px-2.5 py-2 text-xs font-medium text-muted">
                  {d}
                </div>
              ))}
              {days.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const here = byDay.get(key) ?? [];
                const limit = cal === "week" ? 8 : 3;
                return (
                  <div
                    key={key}
                    className={cx(
                      "p-1.5",
                      cal === "week" ? "min-h-64" : "min-h-28",
                      isSameMonth(d, cursor) ? "bg-surface" : "bg-subtle"
                    )}
                  >
                    <p
                      className={cx(
                        "mb-1 text-xs tabular-nums",
                        todayKey === key
                          ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-fg font-medium text-bg"
                          : "px-0.5 text-muted"
                      )}
                    >
                      {format(d, "d")}
                    </p>
                    <div className="space-y-1">
                      {here.slice(0, limit).map((i) => (
                        <Link
                          key={i.id}
                          href={hrefOf(i)}
                          title={i.title}
                          className="block truncate rounded-md bg-sunken px-1.5 py-1 text-xs transition-colors hover:bg-line"
                        >
                          {i.title}
                        </Link>
                      ))}
                      {here.length > limit && <p className="px-0.5 text-xs text-muted">+{here.length - limit} more</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile agenda */}
          <div className="sm:hidden">
            {agendaDays.length === 0 ? (
              <EmptyPanel title="Nothing scheduled" hint="No items have a target date in this range." />
            ) : (
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {agendaDays.map((d) => {
                  const key = format(d, "yyyy-MM-dd");
                  return (
                    <div key={key} className="p-3">
                      <p className={cx("mb-2 text-xs font-medium", key === todayKey ? "text-fg" : "text-muted")}>
                        {format(d, "EEE, MMM d")}
                        {key === todayKey && " · Today"}
                      </p>
                      <div className="space-y-1.5">
                        {(byDay.get(key) ?? []).map((i) => (
                          <Link
                            key={i.id}
                            href={hrefOf(i)}
                            className="block rounded-lg bg-sunken px-2.5 py-2 text-[13px] font-medium"
                          >
                            <span className="line-clamp-2">{i.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {view === "list" &&
        (filtered.length === 0 ? (
          <EmptyPanel title="No items match" hint="Try changing or clearing your filters." />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs font-medium text-muted">
                    <th scope="col" className="px-4 py-3">Title & Keyword</th>
                    <th scope="col" className="px-4 py-3">Type</th>
                    <th scope="col" className="px-4 py-3">Topic group</th>
                    <th scope="col" className="px-4 py-3">Stage</th>
                    <th scope="col" className="px-4 py-3">Target date</th>
                    <th scope="col" className="px-4 py-3">Owner</th>
                    <th scope="col" className="px-4 py-3">Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-subtle/50">
                      <td className="px-4 py-3.5">
                        <Link
                          href={hrefOf(item)}
                          className="font-medium text-fg hover:underline line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted truncate">{item.keyword || "No keyword"}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge tone="outline">{item.format}</Badge>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted">
                        {groupName(item.groupId)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="w-32">
                          <FilterSelect
                            size="sm"
                            label={`Move ${item.title}`}
                            value={item.status}
                            onChange={(v) => move(item.id, v as ContentStatus)}
                            options={stageOptions}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted tabular-nums">
                        {fmtDate(item.date) ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={item.owner} />
                          <span className="text-xs text-muted truncate max-w-24">{item.owner}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted">
                        {item.destination}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="space-y-2 md:hidden">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-xl border border-line bg-surface p-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={hrefOf(item)} className="text-[13px] font-medium leading-snug hover:underline line-clamp-2">
                      {item.title}
                    </Link>
                    <Badge tone="outline" className="shrink-0">{item.format}</Badge>
                  </div>
                  <p className="text-xs text-muted truncate">{item.keyword || "No keyword"}</p>
                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={item.owner} />
                      <span>{item.owner}</span>
                    </div>
                    <span>{fmtDate(item.date) ?? "No date"}</span>
                  </div>
                  <div className="pt-1">
                    <FilterSelect
                      size="sm"
                      label={`Move ${item.title} to stage`}
                      value={item.status}
                      onChange={(v) => move(item.id, v as ContentStatus)}
                      options={stageOptions}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ))}
    </>
  );
}