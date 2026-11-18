import { Page, PageHeader } from "@/components/ui";
import { getWorkspace } from "@/lib/queries";
import { SettingsView } from "./settings-view";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ reveal?: string }> }) {
  const [w, sp] = await Promise.all([getWorkspace(), searchParams]);
  return (
    <Page>
      <PageHeader title="Settings" description="Workspace, team, brand knowledge, approvals and usage." />
      <SettingsView workspace={{ name: w.name, website: w.website, mode: w.mode, brand: w.brand, goals: w.goals, language: w.language }} reveal={sp.reveal === "advanced"} />
    </Page>
  );
}
