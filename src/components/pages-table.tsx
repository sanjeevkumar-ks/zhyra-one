"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Delta, Table, Td, Th, trClass, Term } from "@/components/ui";
import { Chip } from "@/components/ui-client";
import type { PageRow } from "@/lib/mock-data";

export function PagesTable({ rows, ga4 }: { rows: PageRow[]; ga4: boolean }) {
  const [lowCtr, setLowCtr] = useState(false);
  const list = lowCtr ? rows.filter((r) => r.impressions > 15000 && r.ctr < 2) : rows;
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <Chip active={lowCtr} onClick={() => setLowCtr(!lowCtr)}>High impressions · low CTR</Chip>
        <span className="caption">{lowCtr ? "Improve the title and meta description, then track the result." : `${rows.length} pages`}</span>
      </div>
      <Table>
        <thead><tr><Th>Page</Th><Th>Clicks</Th><Th><Term t="Impressions">Impressions</Term></Th><Th><Term t="CTR">CTR</Term></Th><Th><Term t="Position">Avg pos.</Term></Th><Th>Change</Th><Th>Indexed</Th><Th>Target keyword</Th><Th>Backlinks</Th><Th>AI citations</Th><Th>Freshness</Th><Th>Sessions (GA4)</Th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.url} className={trClass}>
              <Td className="mono max-w-[240px] truncate">{r.url}</Td><Td className="tabular-nums">{r.clicks.toLocaleString()}</Td><Td className="tabular-nums">{r.impressions.toLocaleString()}</Td>
              <Td><span className={r.ctr < 2 ? "text-warning-fg" : ""}>{r.ctr}%</span></Td><Td>{r.position}</Td><Td><Delta value={r.delta} /></Td>
              <Td>{r.indexed ? <Badge tone="success">Indexed</Badge> : <Badge tone="danger">Not indexed</Badge>}</Td>
              <Td className="max-w-[160px] truncate">{r.keyword}</Td><Td>{r.backlinks}</Td><Td>{r.aiCitations}</Td><Td className="whitespace-nowrap text-muted">{r.freshness}</Td>
              <Td>{ga4 ? <span className="tabular-nums">{Math.round(r.clicks * 0.82).toLocaleString()}</span> : <Link href="/integrations" className="text-sm text-muted underline underline-offset-4">Connect GA4</Link>}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
