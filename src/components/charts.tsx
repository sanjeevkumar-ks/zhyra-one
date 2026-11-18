"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint } from "@/lib/mock-data";
import { Segmented } from "./ui-client";

const axis = { fontSize: 13, fill: "var(--muted)", fontFamily: "var(--font-sans)" };
const tip = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "var(--font-sans)",
    color: "var(--fg)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
  },
};

type Metric = "clicks" | "impressions" | "ctr" | "position";
const METRICS: { id: Metric; label: string; prev: keyof DayPoint }[] = [
  { id: "clicks", label: "Clicks", prev: "prevClicks" },
  { id: "impressions", label: "Impressions", prev: "prevImpressions" },
  { id: "ctr", label: "CTR", prev: "prevCtr" },
  { id: "position", label: "Avg position", prev: "prevPosition" },
];

export function SearchChart({ data, height = 280 }: { data: DayPoint[]; height?: number }) {
  const [metric, setMetric] = useState<Metric>("clicks");
  const m = METRICS.find((x) => x.id === metric)!;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented value={metric} onChange={setMetric} options={METRICS.map((x) => ({ id: x.id, label: x.label }))} />
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-fg" /> This period</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed border-faint" /> Previous period</span>
        </div>
      </div>
      <div style={{ height }} role="img" aria-label={`${m.label} over time with previous period comparison`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -10, right: 4, top: 6 }}>
            <defs>
              <linearGradient id="fillA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--fg)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--fg)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={axis} tickLine={false} axisLine={false} reversed={metric === "position"} domain={metric === "position" ? ["auto", "auto"] : [0, "auto"]} />
            <Tooltip {...tip} />
            <Area type="monotone" dataKey={metric} name={m.label} stroke="var(--fg)" strokeWidth={1.5} fill="url(#fillA)" />
            <Line type="monotone" dataKey={m.prev as string} name={`Previous ${m.label.toLowerCase()}`} stroke="var(--faint)" strokeDasharray="4 4" strokeWidth={1.25} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Spark({ data, up = true }: { data: { v: number }[]; up?: boolean }) {
  return (
    <div className="h-8 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={up ? "var(--success)" : "var(--danger)"} strokeWidth={1.25} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniLine({ data, x, lines, height = 220 }: { data: Record<string, number | string>[]; x: string; lines: { key: string; name: string; color?: string; dashed?: boolean }[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -15, right: 4, top: 6 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey={x} tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color ?? "var(--fg)"} strokeDasharray={l.dashed ? "4 4" : undefined} strokeWidth={1.5} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Bars({ data, x, bars, height = 220, stacked = false, layout = "horizontal" }: { data: Record<string, number | string>[]; x: string; bars: { key: string; name: string; color: string }[]; height?: number; stacked?: boolean; layout?: "horizontal" | "vertical" }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout} margin={{ left: layout === "vertical" ? 30 : -15, right: 4, top: 6 }}>
          <CartesianGrid stroke="var(--border)" horizontal={layout === "horizontal"} vertical={layout === "vertical"} />
          {layout === "horizontal" ? (
            <>
              <XAxis dataKey={x} tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} />
            </>
          ) : (
            <>
              <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey={x} tick={axis} tickLine={false} axisLine={false} width={110} />
            </>
          )}
          <Tooltip {...tip} cursor={{ fill: "var(--surface-muted)" }} />
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} stackId={stacked ? "a" : undefined} radius={stacked ? 0 : [4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProgressBar({ pct, tone = "fg" }: { pct: number; tone?: "fg" | "success" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: tone === "success" ? "var(--success)" : "var(--fg)" }} />
    </div>
  );
}
