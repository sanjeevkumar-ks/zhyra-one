import { Badge, Button, Card, EmptyState, Orb, Page, PageHeader, SectionTitle, Table, Td, Th, trClass, Tabs, Delta, Unavailable, AIBadge, AIAction, Skeleton, SampleChip } from "@/components/ui";
import { DesignSheetDemo } from "./sheet-demo";

const swatches = [
  ["--bg", "#FFFFFF"], ["--bg-subtle", "#FAFAFA"], ["--surface-muted", "#F5F5F5"], ["--border", "#E5E5E5"], ["--text-secondary", "#737373"], ["--primary", "#000000"],
  ["--success", "#16A34A"], ["--warning", "#D97706"], ["--danger", "#DC2626"], ["--info", "#2563EB"],
];
const cssVar: Record<string, string> = { "--bg": "var(--bg)", "--bg-subtle": "var(--bg-subtle)", "--surface-muted": "var(--surface-muted)", "--border": "var(--border)", "--text-secondary": "var(--muted)", "--primary": "var(--primary)", "--success": "var(--success)", "--warning": "var(--warning)", "--danger": "var(--danger)", "--info": "var(--info)" };

export default function DesignPage() {
  return (
    <Page>
      <PageHeader display title="Design system" description="Tokens and components for Visibility OS — calm, monochrome, colour only for status and small AI moments." />

      <section className="mb-10">
        <SectionTitle title="Typography" description="Inter · clean display, regular body, medium labels and navigation." />
        <div className="space-y-3">
          <p className="display">Display 44 / 400</p>
          <p className="h1">Heading 1 · 32 / 500</p>
          <p className="h2">Heading 2 · 24 / 500</p>
          <p className="h3">Heading 3 · 18 / 500</p>
          <p className="metric">Metric 38 / 400 — 142,850</p>
          <p className="lead">Lead / Description 16 / 400 — Overview of your search and AI visibility.</p>
          <p>Body 15 / 400 — Get found on Google and in AI answers.</p>
          <p className="caption">Caption 13 · secondary metadata and source details</p>
          <p className="mono">/blog/organic-skincare-guide · {`{"event":"content.published"}`}</p>
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="Colour tokens" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {swatches.map(([n, v]) => (
            <div key={n} className="rounded-xl border border-line p-3">
              <div className="h-10 rounded-lg border border-line" style={{ background: cssVar[n] }} />
              <p className="mt-2 text-sm font-medium">{n}</p>
              <p className="caption mono">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="Buttons" description="Pills. Primary is solid black (inverts in dark mode)." />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Create article</Button>
          <Button>Primary</Button>
          <Button size="sm">Small</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
          <AIAction>Refine</AIAction>
        </div>
      </section>

      <section className="mb-10 grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle title="Inputs" />
          <div className="space-y-3">
            <input className="field" placeholder="Business name" />
            <select className="field" defaultValue="Ecommerce"><option>Ecommerce</option><option>SaaS</option></select>
            <textarea className="field" rows={3} placeholder="Describe your business…" />
          </div>
        </div>
        <div>
          <SectionTitle title="Badges & status" />
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge><Badge tone="success">Published</Badge><Badge tone="warning">In review</Badge><Badge tone="danger">Critical</Badge><Badge tone="info">Scheduled</Badge><Badge tone="outline">Beta</Badge>
            <AIBadge /><SampleChip /><Delta value={18.6} /><Delta value={-4} />
          </div>
          <div className="mt-4 flex items-center gap-3"><Orb size={32} /><span className="shimmer text-sm">Generating…</span></div>
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle
          title="In-page Tab Navigation"
          description="Minimal underline-based tabs with Inter typography, full-width subtle grey divider, optional icons and count badges."
        />
        <Tabs
          active="keywords"
          items={[
            { id: "keywords", label: "Keywords", href: "#", count: 142 },
            { id: "topics", label: "Content pillars", href: "#", count: 8 },
            { id: "questions", label: "Questions", href: "#", count: 35 },
            { id: "archived", label: "Archived", href: "#" },
          ]}
        />
      </section>

      <section className="mb-10">
        <SectionTitle title="Table" description="Comfortable rows, sticky header, 14px text." />
        <Table>
          <thead><tr><Th>Keyword</Th><Th>Volume</Th><Th>Intent</Th><Th>Priority</Th></tr></thead>
          <tbody>
            {[["organic skincare", "4,400", "Informational", "High"], ["best organic face moisturiser", "1,900", "Commercial", "High"], ["natural vs organic skincare", "880", "Informational", "Medium"]].map((r) => (
              <tr key={r[0]} className={trClass}><Td>{r[0]}</Td><Td>{r[1]}</Td><Td><Badge>{r[2]}</Badge></Td><Td><Badge tone={r[3] === "High" ? "success" : "warning"}>{r[3]}</Badge></Td></tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section className="mb-10 grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle title="Card & empty state" />
          <Card><EmptyState title="No articles yet" description="Start from a keyword opportunity and we'll build the brief." action={<Button>Create article</Button>} /></Card>
        </div>
        <div>
          <SectionTitle title="Side sheet · unavailable · skeleton" />
          <DesignSheetDemo />
          <div className="mt-4"><Unavailable source="Google Analytics 4" compact /></div>
          <div className="mt-4 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-24 w-full" /></div>
        </div>
      </section>
    </Page>
  );
}
