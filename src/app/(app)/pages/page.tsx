import { Page, PageHeader } from "@/components/ui";
import { PagesView } from "@/components/pages/pages-view";

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: "inventory" | "opportunities" | "published" }>;
}) {
  const { tab = "inventory" } = await searchParams;

  return (
    <Page wide>
      <PageHeader
        title="Website Intelligence & Pages"
        description="Discover your website's indexed page inventory, uncover missing high-demand page opportunities, and compose structured pages for your CMS."
      />
      <PagesView initialTab={tab} />
    </Page>
  );
}
