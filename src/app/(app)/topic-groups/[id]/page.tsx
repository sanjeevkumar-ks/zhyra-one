import { notFound } from "next/navigation";
import { Page } from "@/components/ui";
import { PillarWorkspaceView } from "@/components/pillars/pillar-workspace-view";
import { INITIAL_CONTENT_PILLARS } from "@/lib/content-pillars-data";

export default async function PillarWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);

  const pillar = INITIAL_CONTENT_PILLARS.find((p) => p.id === numId) || INITIAL_CONTENT_PILLARS[0];

  if (!pillar) notFound();

  return (
    <Page wide>
      <PillarWorkspaceView pillar={pillar} />
    </Page>
  );
}
