import type { Intent } from "@/lib/types";

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function inferIntent(k: string): Intent {
  if (/^(buy|shop|order)\b|\bprice\b|\bnear me\b|\bdiscount\b/.test(k)) return "transactional";
  if (/^verdant\b/.test(k)) return "navigational";
  if (/\b(best|top|vs|review|reviews|alternative|compare)\b/.test(k)) return "commercial";
  return "informational";
}
