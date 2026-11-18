import { Page, PageHeader } from "@/components/ui";
import { getContent, getTopicGroups } from "@/lib/queries";
import { computeChecks, scoreChecks } from "@/lib/services/optimise";
import { ArticlesTable } from "./articles-table";

export default async function ArticlesPage() {
  const [items, groups] = await Promise.all([getContent("article"), getTopicGroups()]);
  const rows = items.map((a) => {
    const groups2 = computeChecks({ title: a.title, keyword: a.primaryKeyword, metaTitle: a.metaTitle, metaDescription: a.metaDescription, slug: a.slug, sections: a.sections, hasImage: !!a.featuredImage, imageAlt: a.featuredImage?.alt ?? "", type: "article" });
    const score = scoreChecks(groups2);
    const g = (id: string) => groups2.find((x) => x.id === id)!.checks;
    const seoBad = g("seo").filter((c) => c.state === "attention").length;
    const readiness = [...g("geo"), ...g("aeo")].filter((c) => c.state === "attention").length;
    return { id: a.id, title: a.title, keyword: a.primaryKeyword, group: groups.find((x) => x.id === a.topicGroupId)?.name ?? "—", score: a.sections.length ? score.score : null, seo: !a.sections.length ? "—" : seoBad === 0 ? "Good" : seoBad <= 2 ? "Needs attention" : "Poor", ready: !a.sections.length ? "—" : readiness === 0 ? "Ready" : readiness <= 2 ? "Partial" : "Low", words: a.words, owner: a.owner, updated: a.updatedAt, status: a.status, imported: a.imported };
  });
  return (
    <Page wide>
      <PageHeader title="Articles" description="Every generated, imported and hand-written article in one library." />
      <ArticlesTable rows={rows} />
    </Page>
  );
}
