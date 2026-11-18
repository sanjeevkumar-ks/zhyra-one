import type { ReactNode } from "react";

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[[^\]]{8,}\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${key}-${i}`} style={{ fontWeight: 500 }}>{t.slice(2, -2)}</strong>);
    else if (/\]\(/.test(t)) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t);
      out.push(<a key={`${key}-${i}`} href={mm?.[2]}>{mm?.[1]}</a>);
    } else
      out.push(
        <mark key={`${key}-${i}`} className="rounded bg-warning-bg px-1 text-warning-fg">
          {t}
        </mark>,
      );
    last = m.index + t.length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Tiny markdown renderer (paragraphs, lists, tables, h3, bold, links, [placeholders]). */
export function Markdown({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, bi) => {
        const lines = b.split("\n").filter((l) => l.trim());
        if (!lines.length) return null;
        if (lines[0].startsWith("### ")) return <h3 key={bi}>{lines[0].slice(4)}</h3>;
        if (lines.every((l) => /^\s*[-*] /.test(l)))
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-*] /, ""), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        if (lines[0].startsWith("|") && lines.length >= 2) {
          const rows = lines.filter((l) => !/^\|\s*-/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
          return (
            <table key={bi}>
              <thead>
                <tr>{rows[0].map((c, ci) => <th key={ci}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(1).map((r, ri) => (
                  <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c, `${bi}-${ri}-${ci}`)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {inline(l, `${bi}-${li}`)}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

export function toHtml(source: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return source
    .split(/\n{2,}/)
    .map((b) => `<p>${esc(b).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}
