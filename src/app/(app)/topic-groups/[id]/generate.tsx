"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { toast } from "@/components/ui-client";
import { addKeywordsToPlanner } from "@/app/actions";

export function GenerateStrategy({ ids }: { ids: number[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={pending || !ids.length}
      onClick={() =>
        start(async () => {
          const n = await addKeywordsToPlanner(ids);
          toast(n ? `Strategy created: ${n} articles added to the planner` : "Nothing new to plan");
          if (n) router.push("/planner");
        })
      }
    >
      <Sparkles size={14} strokeWidth={1.5} /> {pending ? "Planning…" : "Generate strategy from this group"}
    </Button>
  );
}
