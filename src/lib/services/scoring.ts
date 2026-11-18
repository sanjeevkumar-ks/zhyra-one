import type { Level } from "@/lib/types";

export interface PriorityFactors {
  relevance: Level;
  demand: Level;
  competition: Level; // High competition lowers priority
  intent: Level;
  coverage: Level; // High = large gap (content missing)
  conversion: Level;
}

export const FACTOR_WEIGHTS: Record<keyof PriorityFactors, { label: string; weight: number; help: string }> = {
  relevance: { label: "Business relevance", weight: 0.25, help: "How closely the topic matches what you sell or know." },
  demand: { label: "Search demand", weight: 0.2, help: "Estimated monthly searches (estimate, needs validation)." },
  competition: { label: "Competition", weight: 0.15, help: "How hard it is to rank. Lower competition scores higher." },
  intent: { label: "Intent fit", weight: 0.15, help: "How close the searcher is to taking action." },
  coverage: { label: "Content gap", weight: 0.15, help: "Higher when you have no content on this yet." },
  conversion: { label: "Conversion potential", weight: 0.1, help: "Likelihood the visit leads to a business outcome." },
};

const val = (l: Level) => (l === "High" ? 1 : l === "Medium" ? 0.55 : 0.15);

export interface PriorityBreakdown {
  score: number;
  label: Level;
  rows: { key: keyof PriorityFactors; label: string; level: Level; weight: number; contribution: number; help: string }[];
}

export function priorityScore(f: PriorityFactors): PriorityBreakdown {
  const rows = (Object.keys(FACTOR_WEIGHTS) as (keyof PriorityFactors)[]).map((key) => {
    const meta = FACTOR_WEIGHTS[key];
    const raw = key === "competition" ? 1 - val(f[key]) + 0.15 : val(f[key]);
    const contribution = Math.round(Math.min(1, raw) * meta.weight * 100);
    return { key, label: meta.label, level: f[key], weight: meta.weight, contribution, help: meta.help };
  });
  const score = rows.reduce((n, r) => n + r.contribution, 0);
  return { score, label: score >= 68 ? "High" : score >= 48 ? "Medium" : "Low", rows };
}

export function levelFromNumber(n: number, hi: number, mid: number): Level {
  return n >= hi ? "High" : n >= mid ? "Medium" : "Low";
}

export interface KeywordLike {
  volume: number;
  difficulty: number;
  intent: string;
  relevance: string;
  conversion: string;
  coverage: string;
}

export function factorsFor(k: KeywordLike): PriorityFactors {
  const lvl = (s: string): Level => (s === "High" ? "High" : s === "Low" ? "Low" : "Medium");
  return {
    relevance: lvl(k.relevance),
    demand: levelFromNumber(k.volume, 3000, 900),
    competition: levelFromNumber(k.difficulty, 55, 35),
    intent: k.intent === "transactional" ? "High" : k.intent === "commercial" ? "High" : k.intent === "informational" ? "Medium" : "Low",
    coverage: k.coverage === "Missing" ? "High" : k.coverage === "Planned" ? "Medium" : "Low",
    conversion: lvl(k.conversion),
  };
}
