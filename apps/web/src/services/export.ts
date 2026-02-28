import { api } from "./http";

const PRINT_CSS = `
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto;
    color: #111;
    margin: 0;
    padding: 0;
  }
  .cover {
    break-after: page;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(11in - 1.2in);
  }
  .cover__inner { text-align: center; }
  .cover .emoji { font-size: 64px; margin-bottom: 12px; }
  .cover h1 { font-size: 28px; margin: 0 0 8px; color: #111 !important; }
  .cover .meta { color: #555; font-size: 12px; }
  .page { break-after: page; }
  .page:last-child { break-after: auto; }
  h1 { font-size: 20px; margin: 0 0 10px; color: #111 !important; }
  h2 { font-size: 16px; margin: 18px 0 8px; color: #111 !important; }
  h3 { font-size: 14px; margin: 14px 0 6px; color: #111 !important; }
  p { margin: 8px 0; color: #111 !important; }
  li { color: #111 !important; }
  strong { color: #111 !important; }
  em { color: #111 !important; }
  code { color: #111 !important; }
  .content table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .content th, .content td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; color: #111 !important; }
  .content th { background: #f5f5f5; text-align: left; }
  .content ul, .content ol { margin: 8px 0 8px 20px; }
  blockquote { border-left: 3px solid #ccc; padding-left: 10px; color: #555 !important; margin: 10px 0; }
  hr { border: 0; border-top: 1px solid #ddd; margin: 14px 0; }
`;

function esc(s: string) {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]!)
  );
}

interface PageMeta {
  _id: string;
  title: string;
  emoji: string;
}

interface PageContent {
  doc: string | null;
}

export async function exportPdf(payload: {
  worldId: string;
  pageIds: string[];
  order?: string[];
}) {
  const { worldId, pageIds, order } = payload;
  const orderIds = (order?.length ? order : pageIds);

  // Fetch world info (for name/emoji) and pages list
  const [worlds, pages] = await Promise.all([
    api<{ _id: string; name: string; emoji?: string }[]>("/worlds"),
    api<PageMeta[]>(`/worlds/${worldId}/pages`),
  ]);

  const world = worlds.find((w) => w._id === worldId);
  const worldName = world?.name ?? "World";
  const worldEmoji = world?.emoji ?? "";

  // Fetch content for each page
  const contents = await Promise.all(
    orderIds.map((id) =>
      api<PageContent>(`/pages/${id}/content`).catch(() => ({ doc: null }))
    )
  );

  const pagesById = new Map(pages.map((p) => [p._id, p]));

  const blocks = orderIds.map((id, i) => {
    const p = pagesById.get(id);
    if (!p) return "";
    const body = contents[i]?.doc ?? "";
    return `<section class="page">
      <h1>${esc(p.title || "Untitled")}</h1>
      <div class="content">${body}</div>
    </section>`;
  });

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(worldName)} — Export</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="cover">
    <div class="cover__inner">
      ${worldEmoji ? `<div class="emoji">${esc(worldEmoji)}</div>` : ""}
      <h1>${esc(worldName)}</h1>
      <div class="meta">Exported ${new Date().toLocaleString()}</div>
    </div>
  </div>
  ${blocks.join("\n")}
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Could not open print window. Please allow popups for this site.");
  }
  win.document.write(html);
  win.document.close();
  win.print();
}
