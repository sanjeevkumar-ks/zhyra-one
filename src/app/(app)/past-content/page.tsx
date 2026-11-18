import { Page, PageHeader, SampleChip } from "@/components/ui";
import { getContent } from "@/lib/queries";
import { hash } from "@/lib/hash";
import { PastContentView } from "@/components/past-content-view";

export default async function PastContentPage() {
  const items = (await getContent()).filter((c) => ["published", "monitoring", "refresh"].includes(c.status));
  const rows = items.map((c) => {
    const h = hash(c.title);
    const delta = (h % 51) - 30;
    return { c, delta, imp: 3000 + (h % 40000), age: [2, 4, 7, 9, 12][h % 5] };
  });
  return (
    <Page>
      <PageHeader
        title="Assets & past content"
        description="Published content, topical assets, and refresh recommendations to protect and expand organic visibility."
        actions={<SampleChip />}
      />
      <PastContentView rows={rows} />
    </Page>
  );
}
