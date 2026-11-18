import { Page, PageHeader, SampleChip } from "@/components/ui";
import { getContent, getWorkspace } from "@/lib/queries";
import { SocialView } from "./social-view";

export default async function SocialPage() {
  const [w, items] = await Promise.all([getWorkspace(), getContent("article")]);
  return (
    <Page>
      <PageHeader title="Social" description="Distribute your expertise to the communities that matter. LinkedIn for publishing; Reddit for monitoring and drafting only." actions={<SampleChip />} />
      <SocialView connected={{ linkedin: !!w.integrations.linkedin, reddit: !!w.integrations.reddit }} articles={items.filter((i) => ["published", "monitoring"].includes(i.status)).map((i) => ({ id: i.id, title: i.title }))} />
    </Page>
  );
}
