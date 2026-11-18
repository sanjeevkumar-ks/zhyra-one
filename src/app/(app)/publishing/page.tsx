import Link from "next/link";
import { Page, PageHeader, btnClass } from "@/components/ui";
import { getWorkspace } from "@/lib/queries";
import { getPublishingData } from "@/lib/services/publishing-service";
import { PublishingView } from "@/components/publishing/publishing-view";

export default async function PublishingPage() {
  const w = await getWorkspace();
  const { channels, parentItems, metrics, webhookLogs } = getPublishingData(w.integrations);

  return (
    <Page wide>
      <PageHeader
        title="Publishing"
        description="Multi-channel content distribution control centre. Re-publishing unchanged content never creates duplicates (idempotency keys), and edits create a new version."
        actions={
          <Link href="/integrations" className={btnClass("outline", "sm")}>
            Manage connectors
          </Link>
        }
      />
      <PublishingView
        initialChannels={channels}
        initialParentItems={parentItems}
        initialMetrics={metrics}
        initialLogs={webhookLogs}
      />
    </Page>
  );
}
