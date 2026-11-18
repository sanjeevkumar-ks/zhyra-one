import { hash } from "@/lib/hash";

const PALETTES = [
  ["#ffd9c7", "#d9d0ff", "#cff3e4", "#cde6ff"],
  ["#cff3e4", "#cde6ff", "#fff1c7", "#ffd9c7"],
  ["#d9d0ff", "#ffd9e8", "#cde6ff", "#cff3e4"],
  ["#fff1c7", "#cff3e4", "#d9d0ff", "#ffd9c7"],
];

/** Placeholder generative artwork for the mock image provider. Deterministic per seed. */
export function GenArt({ seed, ratio = "16:9", label, className }: { seed: number; ratio?: string; label?: string; className?: string }) {
  const h = hash(String(seed));
  const p = PALETTES[h % PALETTES.length];
  const [w, hh] = ratio.split(":").map(Number);
  const pos = (i: number) => `${20 + ((h >> (i * 3)) % 60)}% ${20 + ((h >> (i * 3 + 1)) % 60)}%`;
  return (
    <div
      role="img"
      aria-label={label ?? "Generated illustration"}
      className={className}
      style={{
        aspectRatio: `${w} / ${hh}`,
        borderRadius: 12,
        background: `radial-gradient(circle at ${pos(0)}, ${p[0]} 0%, transparent 55%), radial-gradient(circle at ${pos(1)}, ${p[1]} 0%, transparent 55%), radial-gradient(circle at ${pos(2)}, ${p[2]} 0%, transparent 55%), radial-gradient(circle at ${pos(3)}, ${p[3]} 0%, transparent 55%), #f6f3ee`,
      }}
    />
  );
}
