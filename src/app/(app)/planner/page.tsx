import { Page } from "@/components/ui";
import { getContent, getTopicGroups } from "@/lib/queries";
import { PlannerView } from "./planner-view";

export default async function PlannerPage() {
  const [items, groups] = await Promise.all([getContent(), getTopicGroups()]);
  return (
    <Page wide>
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Content planner</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-muted">
          Plan, schedule and move content through your workflow. Drag cards between stages in Kanban view.
        </p>
      </div>
      <PlannerView
        items={items
          .filter((i) => i.status !== "archived")
          .map((i) => ({
            id: i.id,
            type: i.type,
            title: i.title,
            keyword: i.primaryKeyword,
            groupId: i.topicGroupId,
            format: i.format,
            intent: i.intent,
            owner: i.owner,
            reviewer: i.reviewer,
            date: i.targetDate,
            status: i.status,
            destination: i.destination,
          }))}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      />
    </Page>
  );
}