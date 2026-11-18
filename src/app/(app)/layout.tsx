import type { ReactNode } from "react";
import { Shell } from "@/components/shell";
import { getWorkspace } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const w = await getWorkspace();
  return (
    <Shell domain={w.website} mode={w.mode} workspaceName={w.name}>
      {children}
    </Shell>
  );
}
