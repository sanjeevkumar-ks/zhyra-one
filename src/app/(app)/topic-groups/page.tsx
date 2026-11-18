import { Page, PageHeader } from "@/components/ui";
import { ContentPillarsList } from "@/components/pillars/content-pillars-list";

export default function ContentPillarsPage() {
  return (
    <Page wide>
      <PageHeader
        title="Content pillars"
        description="Build topical authority through connected content, strategic pages and relevant search opportunities."
      />
      <ContentPillarsList />
    </Page>
  );
}
