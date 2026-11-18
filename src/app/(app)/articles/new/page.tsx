import { BriefWizard } from "@/components/brief-wizard";
import { getContent, getKeywords, getTopicGroups } from "@/lib/queries";

export default async function NewArticle({ searchParams }: { searchParams: Promise<{ keyword?: string; pillarId?: string }> }) {
  const { keyword, pillarId } = await searchParams;
  const [kws, groups, items] = await Promise.all([getKeywords(), getTopicGroups(), getContent("article")]);
  return (
    <BriefWizard
      mode="article"
      initialKeyword={keyword}
      initialGroupId={pillarId ? Number(pillarId) : undefined}
      keywords={kws.map((k) => ({ id: k.id, keyword: k.keyword, intent: k.intent, topicGroupId: k.topicGroupId, coverage: k.coverage, volume: k.volume }))}
      groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      existing={items.map((i) => ({ id: i.id, title: i.title, keyword: i.primaryKeyword }))}
    />
  );
}
