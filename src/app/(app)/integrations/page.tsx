import { Page, PageHeader, SampleChip } from "@/components/ui";
import { getWorkspace } from "@/lib/queries";
import { IntegrationsView } from "./integrations-view";

export default async function IntegrationsPage() {
  const w = await getWorkspace();
  return (
    <Page>
      <PageHeader title="Integrations" description="Connect your website, analytics and social accounts. Each integration shows exactly what it enables — and what stays unavailable without it." actions={<SampleChip label="Demo connections" />} />
      <IntegrationsView state={w.integrations} />
    </Page>
  );
}
