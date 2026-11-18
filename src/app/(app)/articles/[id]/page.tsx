import { notFound } from "next/navigation";
import { Editor } from "@/components/editor";
import { getContentItem, getTopicGroups } from "@/lib/queries";

export default async function ArticleEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ generate?: string }> }) {
  const { id } = await params;
  const { generate } = await searchParams;
  const [item, groups] = await Promise.all([getContentItem(Number(id)), getTopicGroups()]);
  if (!item || Number.isNaN(Number(id))) notFound();
  return <Editor key={item.id} item={item} groupName={groups.find((g) => g.id === item.topicGroupId)?.name ?? "No topic group"} autoGenerate={generate === "1"} />;
}
