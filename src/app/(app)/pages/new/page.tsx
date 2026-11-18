import { Page } from "@/components/ui";
import { PageBuilderWizard } from "@/components/pages/page-builder-wizard";
import { INITIAL_PAGE_OPPORTUNITIES } from "@/lib/website-intelligence-data";

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string; keyword?: string }>;
}) {
  const { opportunityId } = await searchParams;

  const opportunity = opportunityId
    ? INITIAL_PAGE_OPPORTUNITIES.find((o) => o.id === opportunityId)
    : undefined;

  return (
    <Page>
      <PageBuilderWizard initialOpportunity={opportunity} />
    </Page>
  );
}
