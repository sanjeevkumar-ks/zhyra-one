import { Page, PageHeader, SampleChip } from "@/components/ui";
import { getWorkspace } from "@/lib/queries";
import { getCurrentAudit, getAuditHistory, getAuditSchedule } from "@/lib/services/audit-service";
import { AuditView } from "@/components/audit/audit-view";

export default async function AuditPage() {
  const w = await getWorkspace();
  const currentAudit = getCurrentAudit();
  const history = getAuditHistory();
  const schedule = getAuditSchedule();

  return (
    <Page>
      <PageHeader
        title="Website audit"
        description="Technical SEO, crawlability, indexing and on-page health diagnostics. Every issue explains what's wrong, why it matters, and how to verify resolution."
        actions={<SampleChip />}
      />
      <AuditView
        initialAudit={currentAudit}
        initialHistory={history}
        initialSchedule={schedule}
        websiteUrl={w.website ? `https://${w.website}` : "https://verdantbotanics.com"}
        simple={w.mode === "simple"}
      />
    </Page>
  );
}
