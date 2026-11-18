import { getKeywords, getWorkspace } from "@/lib/queries";
import { factorsFor, priorityScore } from "@/lib/services/scoring";
import { aiSummary } from "@/lib/mock-data";
import { Wizard } from "./wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const [w, kws] = await Promise.all([getWorkspace(), getKeywords()]);
  const top = kws
    .filter((k) => k.coverage !== "Covered")
    .map((k) => ({ keyword: k.keyword, volume: k.volume, difficulty: k.difficulty, intent: k.intent, priority: priorityScore(factorsFor(k)).label, score: priorityScore(factorsFor(k)).score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  return <Wizard workspace={w} topKeywords={top} ai={{ rate: aiSummary.rate, mentions: aiSummary.mentions, total: aiSummary.total, citations: aiSummary.citations }} />;
}
